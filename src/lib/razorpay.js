export const loadRazorpay = () => {
    return new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(window.Razorpay);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
            resolve(window.Razorpay);
        };
        script.onerror = () => {
            throw new Error('Razorpay SDK failed to load');
        };
        document.body.appendChild(script);
    });
};
export const createRazorpayOrder = async (amount, currency = 'INR') => {
    try {
        const response = await fetch('/api/createOrder', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: amount * 100, // Convert to paise
                currency,
            }),
        });
        if (!response.ok) {
            throw new Error('Failed to create order');
        }
        return await response.json();
    }
    catch (error) {
        console.error('Error creating Razorpay order:', error);
        throw error;
    }
};
export const verifyPayment = async (paymentId, orderId, signature) => {
    try {
        const response = await fetch('/api/verifyPayment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                paymentId,
                orderId,
                signature,
            }),
        });
        if (!response.ok) {
            throw new Error('Payment verification failed');
        }
        return await response.json();
    }
    catch (error) {
        console.error('Error verifying payment:', error);
        throw error;
    }
};
