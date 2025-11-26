// Firebase Cloud Messaging Service Worker
// This file handles background push notifications

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase with your project config
const firebaseConfig = {
  apiKey: "AIzaSyByhCgo_k9i8_AstSaZkZ3Atv5Rt2eOjhc",
  authDomain: "zaillisy.firebaseapp.com",
  projectId: "zaillisy",
  storageBucket: "zaillisy.firebasestorage.app",
  messagingSenderId: "984913226421",
  appId: "1:984913226421:web:c648bbccdd5055cf6cecfc"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle background messages (when app is closed)
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || '💬 New Message';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.message || 'You have a new message',
    icon: payload.notification?.icon || '/favicon.ico',
    badge: '/favicon.ico',
    tag: payload.data?.chatId || 'message',
    data: payload.data || {},
    requireInteraction: false,
    silent: false,
    vibrate: [200, 100, 200]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.');
  
  event.notification.close();
  
  const chatId = event.notification.data?.chatId;
  const url = chatId ? `/chat/${chatId}` : '/';
  
  // Open the app to the chat
  event.waitUntil(
    clients.openWindow(url)
  );
});

