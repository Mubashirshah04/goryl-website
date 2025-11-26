import * as awsChat from './awsChatService';
import { getUserProfile, updateUserProfile } from './awsUserService';

export type ChatMessage = awsChat.ChatMessage;
export type ChatRoom = awsChat.Chat;

export interface UserContact {
  userId: string;
  name: string;
  photoURL?: string;
  lastSeen?: any;
  isOnline?: boolean;
}

export const getChatRoom = awsChat.getChatRoom;
export const sendMessage = awsChat.sendMessage;
export const getMessages = awsChat.getMessages;
export const subscribeToMessages = awsChat.subscribeToMessages;

export const markMessagesAsRead = async (chatId: string, userId: string): Promise<void> => {
  try {
    const messages = await awsChat.getMessages(chatId, 1000);
    const unread = messages.filter(m => m.receiverId === userId && !m.read);
    await Promise.all(unread.map(m => awsChat.markMessageAsRead(m.id || '', chatId, userId)));
  } catch (err) {
    console.warn('markMessagesAsRead (aws) failed:', err);
  }
};

export const getUnreadCount = awsChat.getUnreadCount;

export const getUserChatRooms = async (userId: string) => {
  const chats = await awsChat.getUserChats(userId);
  return chats as ChatRoom[];
};

export const subscribeToUserChatRooms = (userId: string, callback: (rooms: ChatRoom[]) => void) => {
  return awsChat.subscribeToUserChats(userId, callback);
};

export const getUserContacts = async (userId: string): Promise<UserContact[]> => {
  const rooms = await getUserChatRooms(userId);
  const contactIds = new Set<string>();
  rooms.forEach(r => r.participants.forEach(p => { if (p !== userId) contactIds.add(p); }));

  const contacts: UserContact[] = [];
  await Promise.all(Array.from(contactIds).map(async (cid) => {
    try {
      const profile = await getUserProfile(cid);
      if (profile) {
        contacts.push({
          userId: cid,
          name: profile.name || profile.id,
          photoURL: profile.photoURL || profile.customPhotoURL || '',
          lastSeen: profile.updatedAt || profile.createdAt,
          isOnline: !!profile.isActive
        });
      }
    } catch (e) {
      // ignore
    }
  }));

  return contacts;
};

export const subscribeToUserContacts = (userId: string, callback: (contacts: UserContact[]) => void) => {
  return subscribeToUserChatRooms(userId, async (rooms) => {
    const contactIds = new Set<string>();
    rooms.forEach(r => r.participants.forEach(p => { if (p !== userId) contactIds.add(p); }));

    const contacts: UserContact[] = [];
    await Promise.all(Array.from(contactIds).map(async (cid) => {
      try {
        const profile = await getUserProfile(cid);
        if (profile) {
          contacts.push({
            userId: cid,
            name: profile.name || profile.id,
            photoURL: profile.photoURL || profile.customPhotoURL || '',
            lastSeen: profile.updatedAt || profile.createdAt,
            isOnline: !!profile.isActive
          });
        }
      } catch (e) {
        // ignore
      }
    }));

    callback(contacts);
  });
};

export const updateUserOnlineStatus = async (userId: string, isOnline: boolean): Promise<void> => {
  try {
    await updateUserProfile(userId, { isActive: isOnline, lastSeen: new Date().toISOString() } as any);
  } catch (e) {
    console.warn('updateUserOnlineStatus failed:', e);
  }
};

export const subscribeToUserStatus = (userId: string, callback: (isOnline: boolean, lastSeen: any) => void) => {
  let active = true;
  const poll = async () => {
    if (!active) return;
    try {
      const p = await getUserProfile(userId);
      callback(!!p?.isActive, p?.updatedAt || p?.createdAt || null);
    } catch (e) {
      console.warn('subscribeToUserStatus poll failed:', e);
    }
    if (active) setTimeout(poll, 5000);
  };
  poll();
  return () => { active = false; };
};

export default {
  getChatRoom,
  sendMessage,
  getMessages,
  subscribeToMessages,
  markMessagesAsRead,
  getUnreadCount,
  getUserChatRooms,
  subscribeToUserChatRooms,
  getUserContacts,
  subscribeToUserContacts,
  updateUserOnlineStatus,
  subscribeToUserStatus,
};


