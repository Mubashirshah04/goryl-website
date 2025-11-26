'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addDoc, collection, serverTimestamp } from '@/lib/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStoreCognito';
import { loadRazorpay } from '@/lib/razorpay';
import { toast } from 'sonner';
import { sendOrderPlacedNotifications } from '@/lib/notificationService';
import { clearCart } from '@/lib/cartService';
import OrderSuccessModal from '@/components/order/OrderSuccessModal';

export function CheckoutForm({ productId }: { productId: string }) {
  const { user } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderDetails, setOrderDetails] = useState({ orderId: '', total: 0 });
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    payment: 'online'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to checkout');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        buyerUid: user.sub,
        buyerId: user.sub,
        customerId: user.sub,
        productId,
        shipping: formData,
        payment: formData.payment,
        status: formData.payment === 'cod' ? 'placed' : 'pending',
        createdAt: serverTimestamp(),
        totalAmount: 1000, // This should be calculated from product price
        customerName: formData.fullName,
        shippingAddress: formData
      };

      const orderRef = await addDoc(collection(db, 'orders'), orderData);
      
      // Send notifications to buyer and seller
      const completeOrderData = {
        id: orderRef.id,
        ...orderData,
        createdAt: new Date()
      };
      
      await sendOrderPlacedNotifications(completeOrderData);
      
      // Clear cart after successful order
      if (user?.sub) {
        await clearCart(user.sub);
      }
      
      // Set order details for success modal
      setOrderDetails({ 
        orderId: orderRef.id, 
        total: 1000 // You can fetch actual total from product
      });
      
      if (formData.payment === 'online') {
        const res = await fetch('/api/createOrder', {
          method: 'POST',
          body: JSON.stringify({ orderId: orderRef.id }),
        });
        const { id } = await res.json();
        const razorpay = await loadRazorpay();
        razorpay.open({
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
          amount: 1000, // fetch from product
          order_id: id,
          handler: () => {
            // Show success modal instead of redirect
            setShowSuccessModal(true);
          },
          modal: { 
            ondismiss: () => {
              // Show modal even if payment dismissed
              setShowSuccessModal(true);
            }
          },
        });
      } else {
        // Show success modal for COD orders
        setShowSuccessModal(true);
      }
    } catch (e) {
      toast.error('Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-4">
      <h2 className="text-2xl font-bold">Checkout</h2>
      
      <input
        value={formData.fullName}
        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
        placeholder="Full Name"
        required
        className="w-full border rounded p-2 text-gray-900 dark:text-white"
      />

      <input
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        placeholder="Phone"
        required
        className="w-full border rounded p-2 text-gray-900 dark:text-white"
      />

      <input
        value={formData.address}
        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        placeholder="Address"
        required
        className="w-full border rounded p-2 text-gray-900 dark:text-white"
      />

      <div className="grid grid-cols-2 gap-4">
        <input
          value={formData.city}
          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          placeholder="City"
          required
          className="border rounded p-2 text-gray-900 dark:text-white"
        />
        <input
          value={formData.state}
          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
          placeholder="State"
          required
          className="border rounded p-2 text-gray-900 dark:text-white"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <input
          value={formData.zip}
          onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
          placeholder="ZIP"
          required
          className="border rounded p-2 text-gray-900 dark:text-white"
        />
        <input
          value={formData.country}
          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
          placeholder="Country"
          required
          className="border rounded p-2 text-gray-900 dark:text-white"
        />
      </div>

      <div className="space-y-2">
        <label className="flex items-center space-x-2">
          <input
            type="radio"
            value="online"
            checked={formData.payment === 'online'}
            onChange={(e) => setFormData({ ...formData, payment: e.target.value })}
          />
          <span>Online Payment</span>
        </label>
        <label className="flex items-center space-x-2">
          <input
            type="radio"
            value="cod"
            checked={formData.payment === 'cod'}
            onChange={(e) => setFormData({ ...formData, payment: e.target.value })}
          />
          <span>Cash on Delivery</span>
        </label>
      </div>

      <button
        disabled={loading}
        className="w-full bg-pink-600 text-white py-2 rounded hover:bg-pink-700 disabled:opacity-50"
      >
        {loading ? 'Processing…' : 'Place Order'}
      </button>

      {/* Order Success Modal */}
      <OrderSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        orderId={orderDetails.orderId}
        orderTotal={orderDetails.total}
        customerEmail={user?.email || undefined}
      />
    </form>
  );
}

