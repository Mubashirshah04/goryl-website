import { NextRequest, NextResponse } from 'next/server';
import {
  sendOrderPlacedEmailToBuyer,
  sendNewOrderEmailToSeller,
  sendOrderStatusUpdateEmail,
  sendOrderCancelledEmail,
} from '@/lib/awsSESService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, buyerEmail, sellerEmail, orderData } = body;

    if (!type) {
      return NextResponse.json(
        { error: 'Email type is required' },
        { status: 400 }
      );
    }

    let success = false;

    switch (type) {
      case 'order_placed':
        // Send to buyer
        if (buyerEmail && orderData) {
          success = await sendOrderPlacedEmailToBuyer(buyerEmail, orderData);
        }
        break;

      case 'new_order':
        // Send to seller
        if (sellerEmail && orderData) {
          success = await sendNewOrderEmailToSeller(sellerEmail, orderData);
        }
        break;

      case 'status_update':
        // Send to buyer
        if (buyerEmail && orderData) {
          success = await sendOrderStatusUpdateEmail(buyerEmail, orderData);
        }
        break;

      case 'order_cancelled':
        // Send to both buyer and seller
        if (buyerEmail && orderData) {
          await sendOrderCancelledEmail(buyerEmail, orderData, false);
        }
        if (sellerEmail && orderData) {
          await sendOrderCancelledEmail(sellerEmail, orderData, true);
        }
        success = true;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid email type' },
          { status: 400 }
        );
    }

    if (success) {
      return NextResponse.json({
        success: true,
        message: `${type} email sent successfully`,
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending order email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
