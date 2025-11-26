import * as awsChat from './awsChatService';
import { getUserProfile, updateUserProfile } from './awsUserService';

// Delegate to AWS-backed chat service
export const getChatRoom = awsChat.getChatRoom;
export const sendMessage = awsChat.sendMessage;
export const getMessages = awsChat.getMessages;
export const subscribeToMessages = awsChat.subscribeToMessages;
// Send a message
export const sendMessage = async (senderId, receiverId, text, senderName, senderPhoto) => {
    const roomId = await getChatRoom(senderId, receiverId);
    const messageRef = ref(rtdb, `messages/${roomId}`);
    const newMessageRef = push(messageRef);
    const message = {
        senderId,
        receiverId,
        text,
