import { loadStripe } from '@stripe/stripe-js';
let stripePromise;
export const getStripe = () => {
    if (!stripePromise) {
        stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
    }
    return stripePromise;
};
export const formatAmount = (amount) => {
    // Stripe expects amount in cents (smallest currency unit)
    return Math.round(amount * 100);
};
