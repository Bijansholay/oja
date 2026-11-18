import { NextRequest, NextResponse } from "next/server";
import { defaultPaymentProvider } from "@/lib/payments/provider";
import { createAdminClient, DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/server";
import { DEMO_ORDERS } from "@/lib/demo/store";

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get("x-paystack-signature");
    if (!signature) {
      return NextResponse.json({ error: "Missing webhook signature" }, { status: 401 });
    }

    const rawBody = await req.text();

    // 1. Verify HMAC SHA512 signature
    const isValid = defaultPaymentProvider.verifyWebhookSignature(signature, rawBody);
    if (!isValid && process.env.PAYSTACK_SECRET_KEY) {
      console.warn("[Webhook] Invalid Paystack signature rejected");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);

    // 2. Handle 'charge.success' idempotently
    if (event.event === "charge.success") {
      const data = event.data;
      const reference = data.reference;
      const orderIds: string[] = data.metadata?.orderIds || [];

      console.log(`[Webhook] Charge verified for reference ${reference}. Orders:`, orderIds);

      const admin = createAdminClient();
      if (admin && process.env.APPWRITE_API_KEY) {
        for (const orderId of orderIds) {
          try {
            const current = await admin.databases.getDocument(
              DATABASE_ID,
              COLLECTIONS.ORDERS,
              orderId
            );

            // Idempotent check: if already paid, do nothing
            if (current.paymentStatus !== "paid") {
              await admin.databases.updateDocument(
                DATABASE_ID,
                COLLECTIONS.ORDERS,
                orderId,
                {
                  paymentStatus: "paid",
                  paystackReference: reference,
                }
              );
            }
          } catch (e) {
            console.error(`[Webhook] Failed updating payment status for order ${orderId}`, e);
          }
        }
      } else {
        // In demo store, update matching orders
        for (const orderId of orderIds) {
          const ord = DEMO_ORDERS.find((o) => o.$id === orderId);
          if (ord) {
            ord.paymentStatus = "paid";
            ord.paystackReference = reference;
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("[Webhook Error]:", error?.message);
    return NextResponse.json({ error: "Internal error processing webhook" }, { status: 500 });
  }
}
