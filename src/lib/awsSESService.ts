import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const REGION = process.env.NEXT_PUBLIC_AWS_REGION || 'ap-south-1';
const SES_CLIENT = new SESClient({ region: REGION });
const FROM_EMAIL = process.env.NEXT_PUBLIC_SES_FROM_EMAIL || 'noreply@goryl.com';

interface EmailParams {
  to: string;
  subject: string;
  htmlBody: string;
}

/**
 * Send email using AWS SES
 */
export const sendEmail = async (params: EmailParams): Promise<boolean> => {
  try {
    const command = new SendEmailCommand({
      Source: FROM_EMAIL,
      Destination: {
        ToAddresses: [params.to],
      },
      Message: {
        Subject: {
          Data: params.subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: params.htmlBody,
            Charset: 'UTF-8',
          },
        },
      },
    });

    const response = await SES_CLIENT.send(command);
    console.log('✅ Email sent successfully:', response.MessageId);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return false;
  }
};

/**
 * Order Placed Email - Send to Buyer
 */
export const sendOrderPlacedEmailToBuyer = async (
  buyerEmail: string,
  orderData: {
    orderId: string;
    buyerName: string;
    totalAmount: number;
    items: Array<{ title: string; quantity: number; price: number }>;
    estimatedDelivery: string;
  }
): Promise<boolean> => {
  const itemsHtml = orderData.items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.title}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">Rs ${item.price.toFixed(2)}</td>
        </tr>`
    )
    .join('');

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 5px; text-align: center; }
          .content { margin: 20px 0; }
          .order-details { background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .order-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          .order-table th { background: #667eea; color: white; padding: 10px; text-align: left; }
          .total-row { font-weight: bold; font-size: 18px; color: #667eea; padding: 15px; text-align: right; }
          .button { background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 15px 0; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Order Confirmed!</h1>
          </div>
          
          <div class="content">
            <p>Hi ${orderData.buyerName},</p>
            <p>Thank you for your order! We're excited to get your items to you.</p>
            
            <div class="order-details">
              <h3>Order Details</h3>
              <p><strong>Order ID:</strong> ${orderData.orderId}</p>
              <p><strong>Estimated Delivery:</strong> ${orderData.estimatedDelivery}</p>
            </div>
            
            <h3>Items Ordered</h3>
            <table class="order-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            
            <div class="total-row">
              Total Amount: Rs ${orderData.totalAmount.toFixed(2)}
            </div>
            
            <p>You can track your order status in your account dashboard.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderData.orderId}" class="button">View Order</a>
            
            <p>If you have any questions, please contact our support team.</p>
          </div>
          
          <div class="footer">
            <p>© 2025 Goryl. All rights reserved.</p>
            <p>This is an automated email. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: buyerEmail,
    subject: `Order Confirmed - ${orderData.orderId}`,
    htmlBody,
  });
};

/**
 * New Order Email - Send to Seller
 */
export const sendNewOrderEmailToSeller = async (
  sellerEmail: string,
  orderData: {
    orderId: string;
    sellerName: string;
    buyerName: string;
    buyerPhone: string;
    totalAmount: number;
    items: Array<{ title: string; quantity: number; price: number }>;
    shippingAddress: string;
  }
): Promise<boolean> => {
  const itemsHtml = orderData.items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.title}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">Rs ${item.price.toFixed(2)}</td>
        </tr>`
    )
    .join('');

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 5px; text-align: center; }
          .content { margin: 20px 0; }
          .alert { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; border-radius: 3px; }
          .order-details { background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .order-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          .order-table th { background: #667eea; color: white; padding: 10px; text-align: left; }
          .total-row { font-weight: bold; font-size: 18px; color: #667eea; padding: 15px; text-align: right; }
          .button { background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 15px 0; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📦 New Order Received!</h1>
          </div>
          
          <div class="content">
            <p>Hi ${orderData.sellerName},</p>
            <p>You have received a new order! Please review and process it as soon as possible.</p>
            
            <div class="alert">
              <strong>⚠️ Action Required:</strong> Please confirm and prepare this order for shipment.
            </div>
            
            <div class="order-details">
              <h3>Order Information</h3>
              <p><strong>Order ID:</strong> ${orderData.orderId}</p>
              <p><strong>Customer Name:</strong> ${orderData.buyerName}</p>
              <p><strong>Customer Phone:</strong> ${orderData.buyerPhone}</p>
              <p><strong>Shipping Address:</strong> ${orderData.shippingAddress}</p>
            </div>
            
            <h3>Items Ordered</h3>
            <table class="order-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            
            <div class="total-row">
              Total Amount: Rs ${orderData.totalAmount.toFixed(2)}
            </div>
            
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/seller/orders/${orderData.orderId}" class="button">View & Process Order</a>
            
            <p>Please ensure the items are packed and ready for shipment.</p>
          </div>
          
          <div class="footer">
            <p>© 2025 Goryl. All rights reserved.</p>
            <p>This is an automated email. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: sellerEmail,
    subject: `New Order - ${orderData.orderId}`,
    htmlBody,
  });
};

/**
 * Order Status Update Email - Send to Buyer
 */
export const sendOrderStatusUpdateEmail = async (
  buyerEmail: string,
  orderData: {
    orderId: string;
    buyerName: string;
    status: string;
    trackingNumber?: string;
    estimatedDelivery?: string;
  }
): Promise<boolean> => {
  const statusMessages: { [key: string]: string } = {
    confirmed: '✅ Your order has been confirmed by the seller',
    processing: '⚙️ Your order is being processed',
    shipped: '🚚 Your order has been shipped',
    out_for_delivery: '📍 Your order is out for delivery',
    delivered: '🎉 Your order has been delivered',
    cancelled: '❌ Your order has been cancelled',
  };

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 5px; text-align: center; }
          .content { margin: 20px 0; }
          .status-box { background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 15px 0; border-radius: 3px; }
          .order-details { background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .button { background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 15px 0; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Status Update</h1>
          </div>
          
          <div class="content">
            <p>Hi ${orderData.buyerName},</p>
            
            <div class="status-box">
              <h3>${statusMessages[orderData.status] || 'Your order status has been updated'}</h3>
            </div>
            
            <div class="order-details">
              <p><strong>Order ID:</strong> ${orderData.orderId}</p>
              <p><strong>Status:</strong> ${orderData.status.toUpperCase()}</p>
              ${orderData.trackingNumber ? `<p><strong>Tracking Number:</strong> ${orderData.trackingNumber}</p>` : ''}
              ${orderData.estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${orderData.estimatedDelivery}</p>` : ''}
            </div>
            
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderData.orderId}" class="button">Track Order</a>
            
            <p>Thank you for shopping with us!</p>
          </div>
          
          <div class="footer">
            <p>© 2025 Goryl. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: buyerEmail,
    subject: `Order Update - ${orderData.orderId}`,
    htmlBody,
  });
};

/**
 * Order Cancelled Email - Send to Both Buyer and Seller
 */
export const sendOrderCancelledEmail = async (
  email: string,
  orderData: {
    orderId: string;
    recipientName: string;
    reason: string;
    refundAmount?: number;
  },
  isSeller: boolean = false
): Promise<boolean> => {
  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); color: white; padding: 20px; border-radius: 5px; text-align: center; }
          .content { margin: 20px 0; }
          .alert { background: #ffebee; border-left: 4px solid #f44336; padding: 15px; margin: 15px 0; border-radius: 3px; }
          .order-details { background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .button { background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 15px 0; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Cancelled</h1>
          </div>
          
          <div class="content">
            <p>Hi ${orderData.recipientName},</p>
            
            <div class="alert">
              <h3>❌ Your order has been cancelled</h3>
            </div>
            
            <div class="order-details">
              <p><strong>Order ID:</strong> ${orderData.orderId}</p>
              <p><strong>Reason:</strong> ${orderData.reason}</p>
              ${orderData.refundAmount ? `<p><strong>Refund Amount:</strong> Rs ${orderData.refundAmount.toFixed(2)}</p>` : ''}
            </div>
            
            ${
              orderData.refundAmount
                ? `<p>Your refund of Rs ${orderData.refundAmount.toFixed(2)} will be processed within 5-7 business days.</p>`
                : ''
            }
            
            <p>If you have any questions, please contact our support team.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/support" class="button">Contact Support</a>
          </div>
          
          <div class="footer">
            <p>© 2025 Goryl. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Order Cancelled - ${orderData.orderId}`,
    htmlBody,
  });
};
