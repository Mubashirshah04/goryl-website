import { Order } from './types';

// Email service for sending order confirmations
export const sendOrderConfirmationEmail = async (order: Order, userEmail: string) => {
  try {
    console.log('📧 Starting email service...');
    console.log('📧 Sending order confirmation email to:', userEmail);
    console.log('📧 Order data:', order);
    
    // Generate tracking number
    const trackingNumber = `GW${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    console.log('📦 Generated tracking number:', trackingNumber);
    
    // Email content
    const emailContent = {
      to: userEmail,
      subject: `Order Confirmation - #${order.id}`,
      html: generateOrderEmailHTML(order, trackingNumber),
      trackingNumber
    };

    // In a real app, you would use a service like SendGrid, Nodemailer, etc.
    // For now, we'll simulate the email and show it in console
    console.log('📧 Email Content Generated Successfully');
    console.log('📧 Email Subject:', emailContent.subject);
    console.log('📧 Email To:', emailContent.to);
    console.log('📧 Tracking Number:', emailContent.trackingNumber);
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('✅ Email sent successfully (simulated)');
    
    // Show success toast with tracking info
    return {
      success: true,
      trackingNumber,
      message: `Order confirmation sent to ${userEmail}`
    };
    
  } catch (error) {
    console.error('❌ Error sending order confirmation email:', error);
    return {
      success: false,
      error: 'Failed to send confirmation email'
    };
  }
};

// Generate HTML email template
const generateOrderEmailHTML = (order: Order, trackingNumber: string) => {
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Order Confirmation</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #7c3aed; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; border: 1px solid #ddd; }
            .order-details { background: #f9f9f9; padding: 15px; margin: 15px 0; }
            .item { border-bottom: 1px solid #eee; padding: 10px 0; }
            .tracking { background: #e0f2fe; padding: 15px; margin: 15px 0; border-left: 4px solid #0288d1; }
            .footer { text-align: center; padding: 20px; color: #666; }
            .button { background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Order Confirmed!</h1>
                <p>Thank you for your order</p>
            </div>
            
            <div class="content">
                <h2>Order Details</h2>
                <div class="order-details">
                    <p><strong>Order ID:</strong> #${order.id}</p>
                    <p><strong>Order Date:</strong> ${orderDate}</p>
                    <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
                    <p><strong>Order Status:</strong> Confirmed</p>
                </div>

                <div class="tracking">
                    <h3>📦 Tracking Information</h3>
                    <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
                    <p>Your order is being processed and will be shipped within 1-2 business days.</p>
                    <a href="#" class="button">Track Your Order</a>
                </div>

                <h3>Items Ordered:</h3>
                ${order.items.map(item => `
                    <div class="item">
                        <p><strong>${item.product?.title || 'Product'}</strong></p>
                        <p>Quantity: ${item.quantity} × $${(item.product?.price || 0).toFixed(2)} = $${((item.product?.price || 0) * item.quantity).toFixed(2)}</p>
                    </div>
                `).join('')}

                <div class="order-details">
                    <p><strong>Subtotal:</strong> $${order.subtotal.toFixed(2)}</p>
                    <p><strong>Shipping:</strong> $${order.shipping.toFixed(2)}</p>
                    <p><strong>Tax:</strong> $${order.tax.toFixed(2)}</p>
                    <h3><strong>Total: $${order.total.toFixed(2)}</strong></h3>
                </div>

                <h3>📍 Shipping Address:</h3>
                <div class="order-details">
                    <p>${order.shippingAddress.firstName} ${order.shippingAddress.lastName}</p>
                    ${order.shippingAddress.company ? `<p>${order.shippingAddress.company}</p>` : ''}
                    <p>${order.shippingAddress.addressLine1}</p>
                    ${order.shippingAddress.addressLine2 ? `<p>${order.shippingAddress.addressLine2}</p>` : ''}
                    <p>${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}</p>
                    <p>${order.shippingAddress.country}</p>
                    <p>📞 ${order.shippingAddress.phone}</p>
                </div>

                <div style="margin: 30px 0; text-align: center;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/orders" class="button">View Order Details</a>
                </div>
            </div>

            <div class="footer">
                <p>Thank you for shopping with Goryl!</p>
                <p>If you have any questions, please contact our support team.</p>
                <p style="font-size: 12px; color: #999;">
                    This is an automated email. Please do not reply to this message.
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Send order tracking update email
export const sendTrackingUpdateEmail = async (orderId: string, trackingNumber: string, status: string, userEmail: string) => {
  try {
    console.log('📦 Sending tracking update email:', { orderId, trackingNumber, status });
    
    const emailContent = {
      to: userEmail,
      subject: `Order Update - ${status} - #${orderId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #7c3aed; color: white; padding: 20px; text-align: center;">
            <h1>📦 Order Update</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd;">
            <h2>Your order status has been updated!</h2>
            <div style="background: #f0f9ff; padding: 15px; margin: 15px 0; border-left: 4px solid #0ea5e9;">
              <p><strong>Order ID:</strong> #${orderId}</p>
              <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
              <p><strong>Status:</strong> ${status}</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/orders" style="background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Track Your Order</a>
            </div>
          </div>
        </div>
      `
    };

    console.log('📧 Tracking Update Email:', emailContent);
    return { success: true, message: 'Tracking update sent' };
    
  } catch (error) {
    console.error('❌ Error sending tracking update:', error);
    return { success: false, error: 'Failed to send tracking update' };
  }
};
