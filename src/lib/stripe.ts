// ✅ AWS DYNAMODB - Firestore completely removed
// Stripe service - Keep Stripe, store in AWS DynamoDB

import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-11-20.acacia' })
  : null;

export const createPaymentIntent = async (amount: number, currency: string = 'usd') => {
  if (!stripe) {
    console.warn('⚠️ Stripe not configured');
    return null;
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
    });

    // TODO: Store payment intent in AWS DynamoDB
    console.warn('⚠️ Store payment intent in AWS DynamoDB');

    return paymentIntent;
  } catch (error) {
    console.error('Stripe error:', error);
    throw error;
  }
}

export const confirmPayment = async (paymentIntentId: string) => {
  if (!stripe) {
    console.warn('⚠️ Stripe not configured');
    return null;
  }

  try {
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId);

    // TODO: Update payment status in AWS DynamoDB
    console.warn('⚠️ Update payment status in AWS DynamoDB');

    return paymentIntent;
  } catch (error) {
    console.error('Stripe error:', error);
    throw error;
  }
}