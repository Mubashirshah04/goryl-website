// ✅ AWS DYNAMODB - Firestore completely removed
// Notification service converted to AWS SNS/DynamoDB
// TODO: Implement full AWS SNS + DynamoDB integration

// Stub implementations - returning success but not actually sending
// These will be implemented with AWS SNS + DynamoDB later

export const sendRealTimeNotification = async (
  userId: string,
  type: string,
  data: any
) => {
  console.warn('⚠️ sendRealTimeNotification: AWS implementation pending');
  // TODO: Implement AWS SNS notification
  return { success: true, notificationId: `notif_${Date.now()}` };
}

export const sendOrderPlacedNotification = async (userId: string, orderData: any) => {
  console.warn('⚠️ sendOrderPlacedNotification: AWS implementation pending');
  return { success: true };
}

export const sendOrderStatusNotification = async (userId: string, orderId: string, status: string, trackingNumber?: string) => {
  console.warn('⚠️ sendOrderStatusNotification: AWS implementation pending');
  return { success: true };
}

export const subscribeToUserNotifications = (userId: string, callback: (notifications: any[]) => void) => {
  console.log('🔔 Subscribing to notifications for user:', userId);
  
  // Fetch initial notifications
  const fetchNotifications = async () => {
    try {
      const response = await fetch(`/api/notifications?userId=${userId}`);
      if (response.ok) {
        const notifications = await response.json();
        console.log('✅ Notifications fetched:', notifications.length);
        callback(notifications);
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      callback([]);
    }
  };

  // Fetch immediately
  fetchNotifications();

  // Poll for new notifications every 5 seconds
  const interval = setInterval(fetchNotifications, 5000);

  // Return cleanup function
  return () => {
    clearInterval(interval);
  };
}

export const markNotificationAsRead = async (notificationId: string, userId: string) => {
  try {
    console.log('📝 Marking notification as read:', notificationId, 'for user:', userId);
    const response = await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId, userId, read: true }),
    });
    
    if (response.ok) {
      console.log('✅ Notification marked as read');
      return { success: true };
    }
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
  }
  return { success: false };
}

export const markAllNotificationsAsRead = async (userId: string) => {
  console.warn('⚠️ markAllNotificationsAsRead: AWS implementation pending');
  return { success: true };
}


export const sendOrderPlacedNotifications = async (orderData: any) => {
  console.warn('⚠️ sendOrderPlacedNotifications: AWS implementation pending');
  return { success: true };
}

export const sendOrderStatusUpdateNotifications = async (orderId: string, newStatus: string, orderData: any) => {
  console.warn('⚠️ sendOrderStatusUpdateNotifications: AWS implementation pending');
  return { success: true };
}

export const sendUploadUnderReviewNotification = async (userId: string, itemType: 'product' | 'reel', itemTitle: string, itemId: string) => {
  console.warn('⚠️ sendUploadUnderReviewNotification: AWS implementation pending');
  return { success: true };
}

export const sendUploadApprovedNotification = async (userId: string, itemType: 'product' | 'reel', itemTitle: string, itemId: string) => {
  console.warn('⚠️ sendUploadApprovedNotification: AWS implementation pending');
  return { success: true };
}

export const sendUploadRejectedNotification = async (userId: string, itemType: 'product' | 'reel', itemTitle: string, itemId: string, reason?: string) => {
  console.warn('⚠️ sendUploadRejectedNotification: AWS implementation pending');
  return { success: true };
}

export const sendUploadChangesRequestedNotification = async (userId: string, itemType: 'product' | 'reel', itemTitle: string, itemId: string, changes?: string) => {
  console.warn('⚠️ sendUploadChangesRequestedNotification: AWS implementation pending');
  return { success: true };
}

export const sendMessageNotification = async (
  receiverId: string,
  senderId: string,
  senderName: string,
  messageText: string,
  chatId: string
) => {
  console.warn('⚠️ sendMessageNotification: AWS implementation pending');
  return { success: true };
}

export const sendFollowNotification = async (
  followedUserId: string,
  followerId: string,
  followerName: string
) => {
  console.warn('⚠️ sendFollowNotification: AWS implementation pending');
  return { success: true };
}

export const sendNewContentNotification = async (
  creatorId: string,
  creatorName: string,
  contentType: 'post' | 'reel',
  contentTitle: string,
  contentId: string
) => {
  console.warn('⚠️ sendNewContentNotification: AWS implementation pending');
  return { success: true, notified: 0 };
}

export const sendNewOrderSellerNotification = async (
  sellerId: string,
  orderId: string,
  orderData: any
) => {
  console.warn('⚠️ sendNewOrderSellerNotification: AWS implementation pending');
  return { success: true };
}
