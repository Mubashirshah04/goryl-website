'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { CreditCard, Truck, MapPin, Building, CheckCircle, ArrowLeft, Lock } from 'lucide-react';
import { useAuthStore } from '@/store/authStoreCognito';
import { useCartStore } from '@/store/cartStore';
import { createOrder, getUserAddresses, addShippingAddress } from '@/lib/orderService';
import { processCardPayment } from '@/lib/paymentService';
import { sendOrderConfirmationEmail } from '@/lib/emailService';
import { sendOrderPlacedNotification } from '@/lib/notificationService';
import { sendRealOrderEmail, requestNotificationPermission } from '@/lib/realEmailService';
const paymentMethods = [
    {
        id: 'cod',
        name: 'Cash on Delivery',
        description: 'Pay when you receive your order',
        icon: <Truck className="w-6 h-6"/>
    },
    {
        id: 'card',
        name: 'Credit/Debit Card',
        description: 'Secure payment with Visa/MasterCard',
        icon: <CreditCard className="w-6 h-6"/>
    },
    {
        id: 'paypal',
        name: 'PayPal',
        description: 'Pay with your PayPal account',
        icon: <Building className="w-6 h-6"/>,
        disabled: true // Placeholder for future PayPal integration
    }
];
function CheckoutPageContent() {
    var _a, _b, _c;
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, userData } = useAuthStore();
    const { cart, getCartTotal, clearCart } = useCartStore();
    const [loading, setLoading] = useState(false);
    const [cartLoading, setCartLoading] = useState(true);
    const [step, setStep] = useState('address');
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState('');
    const [showNewAddressForm, setShowNewAddressForm] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cod');
    const [cardDetails, setCardDetails] = useState({
        number: '',
        expMonth: '',
        expYear: '',
        cvc: '',
        name: ''
    });
    const [shippingAddress, setShippingAddress] = useState({
        firstName: ((_a = userData === null || userData === void 0 ? void 0 : userData.name) === null || _a === void 0 ? void 0 : _a.split(' ')[0]) || '',
        lastName: ((_b = userData === null || userData === void 0 ? void 0 : userData.name) === null || _b === void 0 ? void 0 : _b.split(' ').slice(1).join(' ')) || '',
        addressLine1: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'Pakistan',
        phone: (userData === null || userData === void 0 ? void 0 : userData.phone) || ''
    });
    useEffect(() => {
        var _a;
        if (!user) {
            toast.error('Please login to checkout');
            router.push('/auth-login');
            return;
        }
        console.log('🛒 Checkout: Cart state:', { cart, itemCount: (_a = cart === null || cart === void 0 ? void 0 : cart.items) === null || _a === void 0 ? void 0 : _a.length });
        // Check if cart has items immediately, if not wait for it to load
        if (cart && cart.items.length > 0) {
            console.log('✅ Checkout: Cart has items, proceeding');
            setCartLoading(false);
        }
        else {
            console.log('⏳ Checkout: Cart empty or loading, waiting...');
            // Give cart time to load (especially for Buy Now flow)
            const timer = setTimeout(() => {
                var _a;
                console.log('🕐 Checkout: Timer expired, checking cart again:', { cart, itemCount: (_a = cart === null || cart === void 0 ? void 0 : cart.items) === null || _a === void 0 ? void 0 : _a.length });
                setCartLoading(false);
                if (!cart || cart.items.length === 0) {
                    console.log('❌ Checkout: Cart still empty, redirecting');
                    toast.error('Your cart is empty');
                    router.push('/cart');
                    return;
                }
            }, 1500); // Wait 1.5 seconds for cart to load
            return () => clearTimeout(timer);
        }
    }, [user, cart, router]);
    // Load saved addresses
    useEffect(() => {
        let isSubscribed = true;
        const loadSavedAddresses = async () => {
            if (user && isSubscribed) {
                try {
                    console.log('🏠 Loading saved addresses for user:', user.sub);
                    const addresses = await getUserAddresses(user.sub);
                    console.log('📍 Raw addresses loaded:', addresses.length);
                    if (!isSubscribed)
                        return; // Component unmounted
                    // Remove duplicates by comparing all address fields, not just ID
                    const uniqueAddresses = addresses.filter((address, index, self) => {
                        return index === self.findIndex(a => a.firstName === address.firstName &&
                            a.lastName === address.lastName &&
                            a.addressLine1 === address.addressLine1 &&
                            a.city === address.city &&
                            a.state === address.state &&
                            a.postalCode === address.postalCode &&
                            a.phone === address.phone);
                    });
                    console.log('📍 Unique addresses after deduplication:', uniqueAddresses.length);
                    setSavedAddresses(uniqueAddresses);
                    // Auto-select default address if available
                    const defaultAddress = uniqueAddresses.find(addr => addr.isDefault);
                    if (defaultAddress && isSubscribed) {
                        setSelectedAddressId(defaultAddress.id);
                        // Pre-fill form with default address
                        setShippingAddress({
                            firstName: defaultAddress.firstName,
                            lastName: defaultAddress.lastName,
                            company: defaultAddress.company || '',
                            addressLine1: defaultAddress.addressLine1,
                            addressLine2: defaultAddress.addressLine2 || '',
                            city: defaultAddress.city,
                            state: defaultAddress.state,
                            postalCode: defaultAddress.postalCode,
                            country: defaultAddress.country,
                            phone: defaultAddress.phone
                        });
                    }
                    else if (uniqueAddresses.length > 0) {
                        // If no default, show address selection
                        setShowNewAddressForm(false);
                    }
                    else {
                        // No saved addresses, show new address form
                        setShowNewAddressForm(true);
                    }
                }
                catch (error) {
                    console.error('Error loading saved addresses:', error);
                    if (isSubscribed) {
                        setShowNewAddressForm(true);
                    }
                }
            }
        };
        loadSavedAddresses();
        return () => {
            isSubscribed = false;
        };
    }, [user === null || user === void 0 ? void 0 : user.sub]); // Only depend on user ID, not savedAddresses.length
    const handleSavedAddressSelect = (address) => {
        setSelectedAddressId(address.id);
        setShippingAddress({
            firstName: address.firstName,
            lastName: address.lastName,
            company: address.company || '',
            addressLine1: address.addressLine1,
            addressLine2: address.addressLine2 || '',
            city: address.city,
            state: address.state,
            postalCode: address.postalCode,
            country: address.country,
            phone: address.phone
        });
    };
    const handleAddressSubmit = (e) => {
        e.preventDefault();
        // If user selected a saved address, use that
        if (selectedAddressId && !showNewAddressForm) {
            setStep('payment');
            return;
        }
        // If user is adding a new address, validate and proceed
        if (showNewAddressForm || savedAddresses.length === 0) {
            // Basic validation
            if (!shippingAddress.firstName || !shippingAddress.lastName || !shippingAddress.addressLine1 ||
                !shippingAddress.city || !shippingAddress.state || !shippingAddress.postalCode ||
                !shippingAddress.country || !shippingAddress.phone) {
                toast.error('Please fill in all required fields');
                return;
            }
            setStep('payment');
        }
    };
    const handlePaymentSubmit = (e) => {
        e.preventDefault();
        setStep('review');
    };
    const handlePlaceOrder = async () => {
        var _a;
        console.log('🚀 handlePlaceOrder called');
        console.log('User:', user === null || user === void 0 ? void 0 : user.sub);
        console.log('Cart:', cart);
        console.log('Cart items:', (_a = cart === null || cart === void 0 ? void 0 : cart.items) === null || _a === void 0 ? void 0 : _a.length);
        if (!user || !cart) {
            console.log('❌ Missing user or cart');
            toast.error('Please login and add items to cart');
            return;
        }
        if (!cart.items || cart.items.length === 0) {
            console.log('❌ Cart is empty');
            toast.error('Your cart is empty');
            return;
        }
        // Validate card details if card payment is selected
        if (selectedPaymentMethod === 'card') {
            if (!cardDetails.number || !cardDetails.expMonth || !cardDetails.expYear || !cardDetails.cvc || !cardDetails.name) {
                toast.error('Please fill in all card details.');
                return;
            }
        }
        console.log('✅ Starting order placement...');
        setLoading(true);
        try {
            // Create clean address data by removing undefined fields
            const cleanAddress = Object.assign(Object.assign({ type: 'home', firstName: shippingAddress.firstName, lastName: shippingAddress.lastName, addressLine1: shippingAddress.addressLine1, city: shippingAddress.city, state: shippingAddress.state, postalCode: shippingAddress.postalCode, country: shippingAddress.country, phone: shippingAddress.phone, isDefault: true }, (shippingAddress.company && { company: shippingAddress.company })), (shippingAddress.addressLine2 && { addressLine2: shippingAddress.addressLine2 }));
            // Create shipping address
            const addressId = await addShippingAddress(user.sub, cleanAddress);
            // Create full address object for order
            const fullAddress = Object.assign(Object.assign({}, cleanAddress), { id: addressId, userId: user.sub, createdAt: new Date(), updatedAt: new Date() });
            console.log('📝 Creating order with data:', {
                userId: user.sub,
                cartItems: cart.items.length,
                address: fullAddress,
                paymentMethod: selectedPaymentMethod
            });
            const orderId = await createOrder(user.sub, cart, fullAddress, selectedPaymentMethod);
            console.log('✅ Order created successfully! Order ID:', orderId);
            if (!orderId) {
                throw new Error('Order creation failed - no order ID returned');
            }
            // 🎉 IMMEDIATE SUCCESS NOTIFICATION
            console.log('🎉 ORDER PLACED SUCCESSFULLY!');
            toast.success('🎉 Order Placed Successfully!', {
                duration: 5000,
                position: 'top-center',
                style: {
                    background: '#10B981',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: 'bold'
                }
            });
            // Process card payment if selected
            if (selectedPaymentMethod === 'card') {
                const paymentResult = await processCardPayment(orderId, calculateTotal(), {
                    number: cardDetails.number.replace(/\s/g, ''),
                    expMonth: parseInt(cardDetails.expMonth),
                    expYear: parseInt(cardDetails.expYear),
                    cvc: cardDetails.cvc,
                    name: cardDetails.name
                });
                if (!paymentResult.success) {
                    toast.error(`Payment failed: ${paymentResult.error}`);
                    setLoading(false);
                    return;
                }
                toast.success('Payment processed successfully!');
            }
            // Show immediate success message
            console.log('🎉 Order placement successful!');
            toast.success('🎉 Order Placed Successfully!');
            toast.success('📧 Confirmation email will be sent shortly');
            // Send real-time notification
            try {
                console.log('📱 Sending real-time notification...');
                const notificationResult = await sendOrderPlacedNotification(user.sub, {
                    id: orderId,
                    total: calculateTotal(),
                    trackingNumber: `GW${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
                    items: cart.items
                });
                if (notificationResult.success) {
                    console.log('✅ Real-time notification sent successfully');
                    toast.success('📱 You will receive updates on your phone');
                }
            }
            catch (notificationError) {
                console.error('❌ Error sending notification:', notificationError);
            }
            // Clear cart after successful order
            console.log('🛒 Clearing cart after successful order...');
            await clearCart();
            console.log('✅ Cart cleared successfully');
            // 📧 SEND REAL EMAIL NOTIFICATION
            if (user === null || user === void 0 ? void 0 : user.email) {
                console.log('📧 Sending REAL order confirmation email...');
                // Request notification permission
                await requestNotificationPermission();
                try {
                    // Send real email
                    const realEmailResult = await sendRealOrderEmail({
                        id: orderId,
                        userId: user.sub,
                        items: cart.items.map(item => (Object.assign(Object.assign({}, item), { total: item.product.price * item.quantity }))),
                        subtotal: calculateSubtotal(),
                        shipping: calculateShipping(),
                        tax: calculateTax(),
                        total: calculateTotal(),
                        shippingAddress: fullAddress,
                        paymentMethod: selectedPaymentMethod,
                        status: 'confirmed',
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }, user.email);
                    if (realEmailResult.success) {
                        console.log('✅ REAL email sent successfully!');
                        toast.success(`📧 Confirmation email sent to ${user.email}`, {
                            duration: 4000,
                            position: 'top-center'
                        });
                        if (realEmailResult.trackingNumber) {
                            setTimeout(() => {
                                toast.success(`📦 Tracking: ${realEmailResult.trackingNumber}`, {
                                    duration: 8000,
                                    position: 'top-center'
                                });
                            }, 2000);
                        }
                    }
                    // Also send backup email
                    const emailResult = await sendOrderConfirmationEmail({
                        id: orderId,
                        userId: user.sub,
                        items: cart.items.map(item => (Object.assign(Object.assign({}, item), { total: item.product.price * item.quantity }))),
                        subtotal: calculateSubtotal(),
                        shipping: calculateShipping(),
                        tax: calculateTax(),
                        total: calculateTotal(),
                        shippingAddress: fullAddress,
                        paymentMethod: selectedPaymentMethod,
                        status: 'confirmed',
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }, user.email);
                    if (emailResult.success) {
                        console.log('✅ Order confirmation email sent successfully');
                        toast.success(`🎉 Order Placed Successfully!`);
                        toast.success(`📧 Confirmation email sent to ${user.email}`);
                        // Show tracking number in success message
                        if (emailResult.trackingNumber) {
                            setTimeout(() => {
                                toast.success(`📦 Tracking Number: ${emailResult.trackingNumber}`, {
                                    duration: 10000
                                });
                            }, 1500);
                        }
                    }
                    else {
                        console.log('⚠️ Email sending failed, but order was placed');
                        toast.success('🎉 Order Placed Successfully!');
                        toast.success('📧 Confirmation email will be sent shortly');
                    }
                }
                catch (emailError) {
                    console.error('❌ Error sending confirmation email:', emailError);
                    toast.success('Order placed successfully!');
                }
            }
            else {
                toast.success('Order placed successfully!');
            }
            setStep('success');
            // Redirect to orders page after 5 seconds
            setTimeout(() => {
                router.push('/orders');
            }, 5000);
        }
        catch (error) {
            console.error('Error placing order:', error);
            toast.error('Failed to place order. Please try again.');
        }
        finally {
            setLoading(false);
        }
    };
    const calculateSubtotal = () => {
        if (cart === null || cart === void 0 ? void 0 : cart.subtotal)
            return cart.subtotal;
        // Fallback calculation if subtotal is not available
        return (cart === null || cart === void 0 ? void 0 : cart.items.reduce((total, item) => total + (item.product.price * item.quantity), 0)) || 0;
    };
    const calculateShipping = () => 5.99; // Fixed shipping cost
    const calculateTax = () => calculateSubtotal() * 0.1; // 10% tax
    const calculateTotal = () => calculateSubtotal() + calculateShipping() + calculateTax();
    if (!user) {
        return (<div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Please login to checkout</h1>
          <Link href="/auth-login" className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors">
            Login
          </Link>
        </div>
      </div>);
    }
    if (cartLoading) {
        return (<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Loading checkout...</h1>
          <p className="text-gray-600 dark:text-gray-400">Please wait while we prepare your order</p>
        </div>
      </div>);
    }
    if (!cart || cart.items.length === 0) {
        return (<div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Your cart is empty</h1>
          <Link href="/cart" className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors">
            View Cart
          </Link>
        </div>
      </div>);
    }
    if (step === 'success') {
        return (<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4"/>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">🎉 Order Placed Successfully!</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Thank you for your order! Your cart has been cleared and you will receive a confirmation email with tracking details shortly.
          </p>
          
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
            <div className="flex items-center mb-2">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-2"/>
              <h3 className="font-semibold text-green-800 dark:text-green-200">Order Confirmed</h3>
            </div>
            <p className="text-green-700 dark:text-green-300 text-sm mb-2">
              📧 Confirmation email sent to your registered email address
            </p>
            <p className="text-green-700 dark:text-green-300 text-sm">
              📦 You will receive a tracking number within 1-2 business days
            </p>
          </div>

          <div className="space-y-3">
            <Link href="/orders" className="block w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors text-center">
              📋 View My Orders
            </Link>
            <Link href="/" className="block w-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white px-6 py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-center">
              🛍️ Continue Shopping
            </Link>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 text-center">
            Redirecting to orders page in a few seconds...
          </p>
        </div>
      </div>);
    }
    return (<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/cart" className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4 mr-2"/>
            Back to Cart
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Progress Steps */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between">
                <div className={`flex items-center ${step === 'address' ? 'text-purple-600' : 'text-gray-400 dark:text-gray-500'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'address' ? 'bg-purple-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'}`}>
                    1
                  </div>
                  <span className="ml-2 font-medium">Shipping Address</span>
                </div>
                <div className={`flex items-center ${step === 'payment' ? 'text-purple-600' : 'text-gray-400 dark:text-gray-500'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'payment' ? 'bg-purple-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'}`}>
                    2
                  </div>
                  <span className="ml-2 font-medium">Payment</span>
                </div>
                <div className={`flex items-center ${step === 'review' ? 'text-purple-600' : 'text-gray-400 dark:text-gray-500'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'review' ? 'bg-purple-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'}`}>
                    3
                  </div>
                  <span className="ml-2 font-medium">Review</span>
                </div>
              </div>
            </div>

            {/* Step Content */}
            {step === 'address' && (<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center text-gray-900 dark:text-white">
                  <MapPin className="w-5 h-5 mr-2"/>
                  Shipping Address
                </h2>

                {/* Saved Addresses */}
                {savedAddresses.length > 0 && !showNewAddressForm && (<div className="mb-6">
                    <h3 className="font-medium mb-4 text-gray-900 dark:text-white">Choose from saved addresses</h3>
                    <div className="space-y-3">
                      {savedAddresses.map((address) => (<div key={address.id} className={`border rounded-lg p-4 cursor-pointer transition-colors ${selectedAddressId === address.id
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'}`} onClick={() => handleSavedAddressSelect(address)}>
                          <div className="flex items-start">
                            <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 mr-3 mt-1">
                              {selectedAddressId === address.id && (<div className="w-2.5 h-2.5 bg-purple-600 rounded-full"></div>)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-gray-900 dark:text-white">
                                  {address.firstName} {address.lastName}
                                </h4>
                                {address.isDefault && (<span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">
                                    Default
                                  </span>)}
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {address.addressLine1}
                                {address.addressLine2 && `, ${address.addressLine2}`}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {address.city}, {address.state} {address.postalCode}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{address.country}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{address.phone}</p>
                            </div>
                          </div>
                        </div>))}
                    </div>
                    
                    <div className="flex items-center justify-between mt-4">
                      <button type="button" onClick={() => setShowNewAddressForm(true)} className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium text-sm">
                        + Add new address
                      </button>
                      
                      {selectedAddressId && (<button type="button" onClick={() => setStep('payment')} className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium">
                          Continue to Payment
                        </button>)}
                    </div>
                  </div>)}

                {/* New Address Form */}
                {(showNewAddressForm || savedAddresses.length === 0) && (<div>
                    {savedAddresses.length > 0 && (<div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium text-gray-900 dark:text-white">Add new address</h3>
                        <button type="button" onClick={() => setShowNewAddressForm(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm">
                          Cancel
                        </button>
                      </div>)}
                    
                <form onSubmit={handleAddressSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label>
                      <input type="text" required value={shippingAddress.firstName} onChange={(e) => setShippingAddress(Object.assign(Object.assign({}, shippingAddress), { firstName: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
                      <input type="text" required value={shippingAddress.lastName} onChange={(e) => setShippingAddress(Object.assign(Object.assign({}, shippingAddress), { lastName: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"/>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company (Optional)</label>
                    <input type="text" value={shippingAddress.company} onChange={(e) => setShippingAddress(Object.assign(Object.assign({}, shippingAddress), { company: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address Line 1</label>
                    <input type="text" required value={shippingAddress.addressLine1} onChange={(e) => setShippingAddress(Object.assign(Object.assign({}, shippingAddress), { addressLine1: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address Line 2 (Optional)</label>
                    <input type="text" value={shippingAddress.addressLine2} onChange={(e) => setShippingAddress(Object.assign(Object.assign({}, shippingAddress), { addressLine2: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"/>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                      <input type="text" required value={shippingAddress.city} onChange={(e) => setShippingAddress(Object.assign(Object.assign({}, shippingAddress), { city: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State/Province</label>
                      <input type="text" required value={shippingAddress.state} onChange={(e) => setShippingAddress(Object.assign(Object.assign({}, shippingAddress), { state: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                      <input type="text" required value={shippingAddress.postalCode} onChange={(e) => setShippingAddress(Object.assign(Object.assign({}, shippingAddress), { postalCode: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"/>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                      <select value={shippingAddress.country} onChange={(e) => setShippingAddress(Object.assign(Object.assign({}, shippingAddress), { country: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500">
                        <option value="Pakistan">Pakistan</option>
                        <option value="United States">United States</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="Canada">Canada</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <input type="tel" required value={shippingAddress.phone} onChange={(e) => setShippingAddress(Object.assign(Object.assign({}, shippingAddress), { phone: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"/>
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium">
                    Continue to Payment
                  </button>
                </form>
                  </div>)}
              </motion.div>)}

            {step === 'payment' && (<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center text-gray-900 dark:text-white">
                  <CreditCard className="w-5 h-5 mr-2"/>
                  Payment Method
                </h2>
                <form onSubmit={handlePaymentSubmit} className="space-y-4">
                  {paymentMethods.map((method) => (<div key={method.id} className={`border rounded-lg p-4 cursor-pointer transition-colors ${selectedPaymentMethod === method.id
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'} ${method.disabled ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={() => !method.disabled && setSelectedPaymentMethod(method.id)}>
                      <div className="flex items-center">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 mr-3">
                          {selectedPaymentMethod === method.id && (<div className="w-3 h-3 bg-purple-600 rounded-full"></div>)}
                        </div>
                        <div className="flex items-center flex-1">
                          <div className="text-purple-600 mr-3">{method.icon}</div>
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">{method.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{method.description}</p>
                          </div>
                        </div>
                        {method.disabled && (<span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            Coming Soon
                          </span>)}
                      </div>
                    </div>))}

                  {/* Card Payment Form */}
                  {selectedPaymentMethod === 'card' && (<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="border border-gray-200 rounded-lg p-4 mt-4">
                      <h3 className="font-medium mb-4">Card Details</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Card Number
                          </label>
                          <input type="text" value={cardDetails.number} onChange={(e) => {
                    const value = e.target.value.replace(/\s/g, '');
                    const formatted = value.replace(/(\d{4})/g, '$1 ').trim();
                    setCardDetails(Object.assign(Object.assign({}, cardDetails), { number: formatted }));
                }} placeholder="1234 5678 9012 3456" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500" maxLength={19}/>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Expiry Month
                            </label>
                            <select value={cardDetails.expMonth} onChange={(e) => setCardDetails(Object.assign(Object.assign({}, cardDetails), { expMonth: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500">
                              <option value="">MM</option>
                              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (<option key={month} value={month.toString().padStart(2, '0')}>
                                  {month.toString().padStart(2, '0')}
                                </option>))}
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Expiry Year
                            </label>
                            <select value={cardDetails.expYear} onChange={(e) => setCardDetails(Object.assign(Object.assign({}, cardDetails), { expYear: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500">
                              <option value="">YYYY</option>
                              {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (<option key={year} value={year.toString()}>
                                  {year}
                                </option>))}
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              CVC
                            </label>
                            <input type="text" value={cardDetails.cvc} onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setCardDetails(Object.assign(Object.assign({}, cardDetails), { cvc: value }));
                }} placeholder="123" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500" maxLength={4}/>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cardholder Name
                          </label>
                          <input type="text" value={cardDetails.name} onChange={(e) => setCardDetails(Object.assign(Object.assign({}, cardDetails), { name: e.target.value }))} placeholder="John Doe" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"/>
                        </div>
                      </div>
                    </motion.div>)}

                  <button type="submit" className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium">
                    Continue to Review
                  </button>
                </form>
              </motion.div>)}

            {step === 'review' && (<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Order Review</h2>
                
                {/* Shipping Address */}
                <div className="mb-6">
                  <h3 className="font-medium mb-2 text-gray-900 dark:text-white">Shipping Address</h3>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-800 dark:text-gray-200">{shippingAddress.firstName} {shippingAddress.lastName}</p>
                    {shippingAddress.company && <p className="text-gray-800 dark:text-gray-200">{shippingAddress.company}</p>}
                    <p className="text-gray-800 dark:text-gray-200">{shippingAddress.addressLine1}</p>
                    {shippingAddress.addressLine2 && <p className="text-gray-800 dark:text-gray-200">{shippingAddress.addressLine2}</p>}
                    <p className="text-gray-800 dark:text-gray-200">{shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}</p>
                    <p className="text-gray-800 dark:text-gray-200">{shippingAddress.country}</p>
                    <p className="text-gray-800 dark:text-gray-200">{shippingAddress.phone}</p>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="mb-6">
                  <h3 className="font-medium mb-2 text-gray-900 dark:text-white">Payment Method</h3>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-800 dark:text-gray-200">{(_c = paymentMethods.find(m => m.id === selectedPaymentMethod)) === null || _c === void 0 ? void 0 : _c.name}</p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="mb-6">
                  <h3 className="font-medium mb-2 text-gray-900 dark:text-white">Order Items</h3>
                  <div className="space-y-3">
                    {cart === null || cart === void 0 ? void 0 : cart.items.map((item) => (<div key={item.id} className="flex items-center space-x-4 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <img src={item.product.image} alt={item.product.title} className="w-16 h-16 object-cover rounded-lg"/>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">{item.product.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900 dark:text-white">${(item.product.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>))}
                  </div>
                </div>

                <button onClick={handlePlaceOrder} disabled={loading} className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50">
                  {loading ? 'Placing Order...' : 'Place Order'}
                </button>
              </motion.div>)}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 sticky top-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Order Summary</h2>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Subtotal</span>
                  <span className="text-gray-900 dark:text-white font-medium">${calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Shipping</span>
                  <span className="text-gray-900 dark:text-white font-medium">${calculateShipping().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Tax</span>
                  <span className="text-gray-900 dark:text-white font-medium">${calculateTax().toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between font-semibold text-lg">
                  <span className="text-gray-900 dark:text-white">Total</span>
                  <span className="text-gray-900 dark:text-white">${calculateTotal().toFixed(2)}</span>
                </div>
              </div>

              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-4">
                <Lock className="w-4 h-4 mr-2"/>
                Secure checkout
              </div>

              <div className="text-xs text-gray-500">
                By placing your order, you agree to our Terms of Service and Privacy Policy.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>);
}
export default function CheckoutPage() {
    return (<Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="text-white text-xl">Loading...</div>
    </div>}>
      <CheckoutPageContent />
    </Suspense>);
}

