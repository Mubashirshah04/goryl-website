/**
 * Helper service to trigger order emails
 * Call these functions when orders are created or updated
 */

interface OrderItem {
  title: string;
  quantity: number;
  price: number;
}

interface OrderData {
  orderId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  sellerName: string;
  sellerEmail: string;
  totalAmount: number;
  items: OrderItem[];
  estimatedDelivery: string;
  shippingAddress: string;
}

/**
 * Send order placed email to buyer and new order email to seller
 */
export const sendOrderCreatedEmails = async (orderData: OrderData) => {
  try {
    // Send to buyer
    await fetch('/api/orders/send-emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'order_placed',
        buyerEmail: orderData.buyerEmail,
        orderData: {
          orderId: orderData.orderId,
          buyerName: orderData.buyerName,
          totalAmount: orderData.totalAmount,
          items: orderData.items,
          estimatedDelivery: orderData.estimatedDelivery,
        },
      }),
    });

    // Send to seller
    await fetch('/api/orders/send-emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'new_order',
        sellerEmail: orderData.sellerEmail,
        orderData: {
          orderId: orderData.orderId,
          sellerName: orderData.sellerName,
          buyerName: orderData.buyerName,
          buyerPhone: orderData.buyerPhone,
          totalAmount: orderData.totalAmount,
          items: orderData.items,
          shippingAddress: orderData.shippingAddress,
        },
      }),
    });

    console.log('✅ Order created emails sent successfully');
  } catch (error) {
    console.error('❌ Error sending order created emails:', error);
  }
};

/**
 * Send order status update email to buyer
 */
export const sendOrderStatusUpdateEmail = async (
  buyerEmail: string,
  orderId: string,
  buyerName: string,
  status: string,
  trackingNumber?: string,
  estimatedDelivery?: string
) => {
  try {
    await fetch('/api/orders/send-emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'status_update',
        buyerEmail,
        orderData: {
          orderId,
          buyerName,
          status,
          trackingNumber,
          estimatedDelivery,
        },
      }),
    });

    console.log(`✅ Status update email sent for order ${orderId}`);
  } catch (error) {
    console.error('❌ Error sending status update email:', error);
  }
};

/**
 * Send order cancelled email to both buyer and seller
 */
export const sendOrderCancelledEmails = async (
  buyerEmail: string,
  sellerEmail: string,
  orderId: string,
  buyerName: string,
  sellerName: string,
  reason: string,
  refundAmount?: number
) => {
  try {
    // Send to buyer
    await fetch('/api/orders/send-emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'order_cancelled',
        buyerEmail,
        orderData: {
          orderId,
          recipientName: buyerName,
          reason,
          refundAmount,
        },
      }),
    });

    // Send to seller
    await fetch('/api/orders/send-emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'order_cancelled',
        sellerEmail,
        orderData: {
          orderId,
          recipientName: sellerName,
          reason,
        },
      }),
    });

    console.log(`✅ Cancellation emails sent for order ${orderId}`);
  } catch (error) {
    console.error('❌ Error sending cancellation emails:', error);
  }
};
