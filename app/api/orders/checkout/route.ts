import { NextRequest, NextResponse } from "next/server";
import { checkoutSchema } from "@/lib/validation/schemas";
import { createAdminClient, DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/server";
import { defaultPaymentProvider } from "@/lib/payments/provider";
import { defaultNotificationChannel } from "@/lib/notifications/channel";
import { validateFirstTimePodLimit } from "@/lib/orders/calculator";
import { DEMO_LISTINGS, DEMO_ORDERS } from "@/lib/demo/store";
import { Listing, Order, OrderItem } from "@/lib/types";
import { APP_CONFIG } from "@/lib/config";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Zod input validation
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      const fieldPath = firstIssue?.path.join(".");
      const errorMsg = firstIssue
        ? `${fieldPath ? `${fieldPath}: ` : ""}${firstIssue.message}`
        : "Invalid checkout submission";

      console.warn("[Checkout] 400 Validation Error:", errorMsg, parsed.error.format());

      return NextResponse.json(
        { error: errorMsg, details: parsed.error.format() },
        { status: 400 }
      );
    }

    const {
      items,
      paymentMethod,
      deliveryAddress,
      deliveryLat,
      deliveryLng,
      buyerNote,
      buyerName,
      buyerPhone,
      buyerEmail,
    } = parsed.data;

    // Buyer identity from header, body, or active session
    const buyerId = req.headers.get("x-user-id") || body.buyerId;
    if (!buyerId && !APP_CONFIG.app.isDemoMode) {
      return NextResponse.json(
        { error: "Please sign in to place an order" },
        { status: 401 }
      );
    }
    const resolvedBuyerId = buyerId || `guest_${Date.now()}`;
    const resolvedBuyerEmail =
      buyerEmail || `${buyerPhone.replace(/[^0-9]/g, "")}@buyer.local`;

    const admin = createAdminClient();
    const isLiveAppwrite = !!(admin && process.env.APPWRITE_API_KEY);

    // 2. Fetch authoritative listings from database to check stock & recompute prices
    const enrichedItems: Array<{
      listing: Listing;
      qty: number;
      authoritativePrice: number;
    }> = [];

    if (isLiveAppwrite) {
      for (const item of items) {
        try {
          const doc = await admin.databases.getDocument(
            DATABASE_ID,
            COLLECTIONS.LISTINGS,
            item.listingId
          );
          const listing = doc as unknown as Listing;

          if (listing.status !== "active") {
            return NextResponse.json(
              { error: `"${listing.title}" is no longer available for order` },
              { status: 400 }
            );
          }

          if (listing.quantityAvailable < item.qty) {
            return NextResponse.json(
              {
                error: `Not enough stock for "${listing.title}". Only ${listing.quantityAvailable} ${listing.unit} left.`,
              },
              { status: 400 }
            );
          }

          enrichedItems.push({
            listing,
            qty: item.qty,
            authoritativePrice: listing.price, // Server price ONLY
          });
        } catch (err: any) {
          return NextResponse.json(
            { error: `Produce listing ${item.listingId} could not be verified` },
            { status: 404 }
          );
        }
      }
    } else {
      // Demo store verification
      for (const item of items) {
        const found = DEMO_LISTINGS.find((l) => l.$id === item.listingId);
        if (!found) {
          return NextResponse.json(
            { error: `Produce item ${item.listingId} not found` },
            { status: 404 }
          );
        }
        if (found.quantityAvailable < item.qty) {
          return NextResponse.json(
            {
              error: `Insufficient stock for "${found.title}". Only ${found.quantityAvailable} left.`,
            },
            { status: 400 }
          );
        }
        enrichedItems.push({
          listing: found,
          qty: item.qty,
          authoritativePrice: found.price,
        });
      }
    }

    // 3. Partition items by sellerId (ONE ORDER PER FARMER)
    const perFarmerGroups = new Map<
      string,
      {
        sellerId: string;
        sellerName: string;
        sellerPhone: string;
        items: Array<{
          listingId: string;
          titleSnapshot: string;
          qty: number;
          unitPriceSnapshot: number;
          unitSnapshot: string;
        }>;
        total: number;
      }
    >();

    for (const enriched of enrichedItems) {
      const sId = enriched.listing.sellerId;
      if (!perFarmerGroups.has(sId)) {
        perFarmerGroups.set(sId, {
          sellerId: sId,
          sellerName: enriched.listing.sellerName || "Local Farm",
          sellerPhone: enriched.listing.sellerPhone || "",
          items: [],
          total: 0,
        });
      }

      const group = perFarmerGroups.get(sId)!;
      const subtotal = enriched.authoritativePrice * enriched.qty;
      group.items.push({
        listingId: enriched.listing.$id,
        titleSnapshot: enriched.listing.title,
        qty: enriched.qty,
        unitPriceSnapshot: enriched.authoritativePrice,
        unitSnapshot: enriched.listing.unit,
      });
      group.total += subtotal;
    }

    // 4. Validate First-Time Pay on Delivery Cap
    const grandTotal = Array.from(perFarmerGroups.values()).reduce(
      (acc, g) => acc + g.total,
      0
    );

    if (paymentMethod === "pay_on_delivery") {
      const podCheck = validateFirstTimePodLimit(
        grandTotal,
        APP_CONFIG.orders.maxFirstTimePodLimitNaira
      );
      if (!podCheck.allowed) {
        return NextResponse.json({ error: podCheck.reason }, { status: 400 });
      }
    }

    // 5. Create Orders and Order Items
    const createdOrders: Order[] = [];
    const nowIso = new Date().toISOString();

    for (const farmerGroup of Array.from(perFarmerGroups.values())) {
      const orderId = "order_" + Date.now() + "_" + Math.random().toString(36).substring(7);

      const orderData: Order = {
        $id: orderId,
        buyerId: resolvedBuyerId,
        sellerId: farmerGroup.sellerId,
        status: "pending",
        paymentMethod,
        paymentStatus: paymentMethod === "online" ? "unpaid" : "unpaid",
        deliveryAddress,
        deliveryLat,
        deliveryLng,
        buyerNote,
        total: farmerGroup.total,
        createdAt: nowIso,
        seller: {
          name: farmerGroup.sellerName,
          phone: farmerGroup.sellerPhone,
        },
        buyer: {
          name: buyerName,
          phone: buyerPhone,
        },
        items: farmerGroup.items.map((it, idx) => ({
          $id: `item_${orderId}_${idx}`,
          orderId,
          ...it,
          unitSnapshot: it.unitSnapshot as any,
        })),
      };

      if (isLiveAppwrite) {
        // Persist order in Appwrite
        await admin.databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.ORDERS,
          orderId,
          {
            buyerId: resolvedBuyerId,
            sellerId: farmerGroup.sellerId,
            status: "pending",
            paymentMethod,
            paymentStatus: "unpaid",
            deliveryAddress,
            deliveryLat,
            deliveryLng,
            buyerNote: buyerNote || "",
            total: farmerGroup.total,
            createdAt: nowIso,
          }
        );

        // Persist order items
        for (const it of farmerGroup.items) {
          await admin.databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.ORDER_ITEMS,
            "unique()",
            {
              orderId,
              listingId: it.listingId,
              titleSnapshot: it.titleSnapshot,
              qty: it.qty,
              unitPriceSnapshot: it.unitPriceSnapshot,
              unitSnapshot: it.unitSnapshot,
            }
          );

          // Decrement stock in database
          try {
            const currentListing = await admin.databases.getDocument(
              DATABASE_ID,
              COLLECTIONS.LISTINGS,
              it.listingId
            );
            const newQty = Math.max(0, currentListing.quantityAvailable - it.qty);
            await admin.databases.updateDocument(
              DATABASE_ID,
              COLLECTIONS.LISTINGS,
              it.listingId,
              {
                quantityAvailable: newQty,
                status: newQty === 0 ? "sold_out" : currentListing.status,
              }
            );
          } catch (e) {
            console.error("Failed to decrement stock for", it.listingId, e);
          }
        }
      } else {
        // Decrement stock in demo memory
        for (const it of farmerGroup.items) {
          const l = DEMO_LISTINGS.find((x) => x.$id === it.listingId);
          if (l) {
            l.quantityAvailable = Math.max(0, l.quantityAvailable - it.qty);
            if (l.quantityAvailable === 0) l.status = "sold_out";
          }
        }
        DEMO_ORDERS.unshift(orderData);
      }

      // Trigger notification to farmer
      await defaultNotificationChannel.notifyNewOrderToFarmer({
        orderId,
        farmerName: farmerGroup.sellerName,
        farmerPhone: farmerGroup.sellerPhone,
        buyerName,
        buyerPhone,
        totalNaira: farmerGroup.total,
        deliveryAddress,
        status: "pending",
      });

      createdOrders.push(orderData);
    }

    // 6. If Online Payment chosen, initialize Paystack transaction
    let paymentAuthUrl: string | null = null;
    let paymentReference: string | null = null;

    if (paymentMethod === "online") {
      const orderIds = createdOrders.map((o) => o.$id);
      const appUrl = APP_CONFIG.app.url;

      const initResult = await defaultPaymentProvider.initializePayment({
        orderIds,
        amountNaira: grandTotal,
        email: resolvedBuyerEmail,
        callbackUrl: `${appUrl}/orders?paid_ref=${orderIds[0]}`,
        metadata: {
          buyerId: resolvedBuyerId,
          buyerPhone,
          orderCount: createdOrders.length,
        },
      });

      paymentAuthUrl = initResult.authorizationUrl;
      paymentReference = initResult.reference;

      // Attach reference to orders in background
      if (isLiveAppwrite) {
        for (const ord of createdOrders) {
          try {
            await admin.databases.updateDocument(
              DATABASE_ID,
              COLLECTIONS.ORDERS,
              ord.$id,
              { paystackReference: paymentReference }
            );
          } catch {}
        }
      }
    }

    return NextResponse.json({
      success: true,
      ordersCount: createdOrders.length,
      orders: createdOrders,
      grandTotal,
      paymentMethod,
      paymentAuthUrl,
      paymentReference,
    });
  } catch (error: any) {
    console.error("Checkout order processing error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process order checkout" },
      { status: 500 }
    );
  }
}
