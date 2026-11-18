export interface OrderNotificationPayload {
  orderId: string;
  farmerName: string;
  farmerPhone: string;
  buyerName: string;
  buyerPhone: string;
  totalNaira: number;
  deliveryAddress: string;
  status: string;
}

export interface NotificationChannel {
  name: string;
  notifyNewOrderToFarmer(payload: OrderNotificationPayload): Promise<void>;
  notifyStatusUpdateToBuyer(payload: OrderNotificationPayload): Promise<void>;
}

/**
 * Generates direct pre-filled WhatsApp deep-link for instant farmer-buyer messaging
 */
export function createWhatsAppChatUrl(phone: string, text: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

export class WhatsAppNotificationChannel implements NotificationChannel {
  name = "whatsapp";

  async notifyNewOrderToFarmer(payload: OrderNotificationPayload): Promise<void> {
    // In production, integrate with WhatsApp Business Cloud API or Termii SMS
    console.log(
      `[Notification] Farmer ${payload.farmerPhone} notified of new Order #${payload.orderId.slice(-6)} (₦${payload.totalNaira.toLocaleString()})`
    );
  }

  async notifyStatusUpdateToBuyer(payload: OrderNotificationPayload): Promise<void> {
    console.log(
      `[Notification] Buyer ${payload.buyerPhone} notified: Order #${payload.orderId.slice(-6)} updated to '${payload.status}'`
    );
  }
}

export const defaultNotificationChannel = new WhatsAppNotificationChannel();
