'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStoreCognito';
import { doc, getDoc, collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, setDoc } from '@/lib/firestore';
import { db } from '@/lib/firebase';
import { ArrowLeft, Send, MoreVertical, Image as ImageIcon, Paperclip } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt: any;
  read: boolean;
}

interface SellerProfile {
  id: string;
  name: string;
  photoURL?: string;
  customPhotoURL?: string;
  role: string;
  isOnline?: boolean;
}

interface ChatPageClientProps {
  sellerId: string;
}

export default function ChatPageClient({ sellerId }: ChatPageClientProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          console.log('✅ Notification permission granted');
        }
      });
    }
  }, []);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load seller profile
  useEffect(() => {
    if (!sellerId) return;

    const loadSeller = async () => {
      try {
        const sellerDoc = await getDoc(doc(db, 'users', sellerId));
        if (sellerDoc.exists()) {
          setSeller({ id: sellerDoc.id, ...sellerDoc.data() } as SellerProfile);
        } else {
          toast.error('Seller not found');
          router.back();
        }
      } catch (error) {
        console.error('Error loading seller:', error);
        toast.error('Failed to load seller profile');
      } finally {
        setLoading(false);
      }
    };

    loadSeller();
  }, [sellerId, router]);

  // Load messages with proper error handling and notifications
  useEffect(() => {
    if (!user || !sellerId) return;

    const chatId = [user.sub, sellerId].sort().join('_');
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    let isFirstLoad = true;

    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Message[];
        
        // Check for new messages (not from current user)
        if (!isFirstLoad && snapshot.docChanges().length > 0) {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const newMsg = change.doc.data();
              // Only show notification for messages from other user
              if (newMsg.senderId !== user.sub) {
                // Show toast notification
                toast.success(`New message from ${seller?.name || 'Seller'}`, {
                  description: newMsg.text.length > 50 
                    ? newMsg.text.substring(0, 50) + '...' 
                    : newMsg.text,
                  duration: 3000,
                });
                
                // Play notification sound (optional)
                try {
                  const audio = new Audio('/notification.mp3');
                  audio.volume = 0.3;
                  audio.play().catch(() => {
                    // Ignore if sound fails
                  });
                } catch (e) {
                  // Ignore sound errors
                }
                
                // Browser notification (if permission granted)
                if ('Notification' in window && Notification.permission === 'granted') {
                  new Notification(`New message from ${seller?.name || 'Seller'}`, {
                    body: newMsg.text.length > 100 
                      ? newMsg.text.substring(0, 100) + '...' 
                      : newMsg.text,
                    icon: seller?.customPhotoURL || seller?.photoURL || '/logo.png',
                    tag: 'chat-message',
                  });
                }
              }
            }
          });
        }
        
        setMessages(msgs);
        console.log('💬 Messages updated:', msgs.length);
        isFirstLoad = false;
      },
      (error) => {
        console.error('❌ Error loading messages:', error);
        // Don't show error to user, just log it
        // Messages will still work, just might not be real-time
      }
    );

    return () => {
      console.log('🔌 Cleaning up message listener');
      unsubscribe();
    };
  }, [user?.sub, sellerId, seller?.name, seller?.customPhotoURL, seller?.photoURL]);

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !sellerId || sending) return;

    setSending(true);
    const messageText = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX
    
    try {
      const chatId = [user.sub, sellerId].sort().join('_');
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const chatRef = doc(db, 'chats', chatId);
      
      // Add message to subcollection
      await addDoc(messagesRef, {
        senderId: user.sub,
        senderName: user.displayName || (user as any).name || 'User',
        senderPhoto: user.photoURL || (user as any).customPhotoURL || '',
        receiverId: sellerId,
        receiverName: seller?.name || 'Seller',
        text: messageText,
        createdAt: serverTimestamp(),
        read: false
      });

      // Update chat metadata for chat list
      await setDoc(chatRef, {
        participants: [user.sub, sellerId],
        participantNames: {
          [user.sub]: user.displayName || (user as any).name || 'User',
          [sellerId]: seller?.name || 'Seller'
        },
        participantPhotos: {
          [user.sub]: user.photoURL || (user as any).customPhotoURL || '',
          [sellerId]: seller?.customPhotoURL || seller?.photoURL || ''
        },
        lastMessage: messageText,
        lastMessageTime: serverTimestamp(),
        lastMessageSender: user.sub,
        updatedAt: serverTimestamp()
      }, { merge: true });

      console.log('✅ Message sent successfully');
    } catch (error) {
      console.error('❌ Error sending message:', error);
      toast.error('Failed to send message');
      setNewMessage(messageText); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Please login to chat</h1>
          <Link
            href="/auth-login"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Login
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Seller not found</h1>
          <button
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <div className="max-w-4xl mx-auto h-full flex flex-col">
        {/* Header - Mobile & Desktop Responsive */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 sm:px-4 py-3 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
              <button
                onClick={() => router.back()}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              
              <Link href={`/profile/${seller.id}`} className="flex items-center space-x-2 sm:space-x-3 hover:opacity-80 flex-1 min-w-0">
                <div className="relative flex-shrink-0">
                  <img
                    src={seller.customPhotoURL || seller.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(seller.name)}&background=random`}
                    alt={seller.name}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover"
                  />
                  {seller.isOnline && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">{seller.name}</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize truncate">{seller.role}</p>
                </div>
              </Link>
            </div>

            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
              <button className="p-1.5 sm:p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Messages - Full Screen Scrollable */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4 space-y-2 sm:space-y-3">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 dark:text-gray-400 text-sm">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.senderId === user.sub;
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] sm:max-w-[70%] lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
                    <div
                      className={`px-3 py-2 rounded-2xl shadow-sm ${
                        isOwn
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none border border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      <p className="text-[13px] sm:text-sm break-words whitespace-pre-wrap leading-relaxed">{message.text}</p>
                    </div>
                    <p className={`text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5 px-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                      {message.createdAt?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Just now'}
                    </p>
                  </div>
                </motion.div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input - Fixed Bottom, Mobile Optimized */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-2 sm:p-3 flex-shrink-0">
          <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
            <button
              type="button"
              className="hidden sm:flex p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full flex-shrink-0 mb-1"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <button
              type="button"
              className="flex p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full flex-shrink-0 mb-1"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder="Type a message..."
              rows={1}
              className="flex-1 px-3 sm:px-4 py-2.5 text-sm sm:text-base bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none max-h-32 overflow-y-auto"
              style={{ minHeight: '42px' }}
            />
            
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 mb-1 transition-all active:scale-95"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

