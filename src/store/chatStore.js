import { create } from 'zustand';
import { subscribeToCollection } from '@/lib/firestore';
export const useChatStore = create((set, get) => ({
    conversations: [],
    currentConversation: null,
    messages: [],
    loading: false,
    error: null,
    setConversations: (conversations) => set({ conversations }),
    setCurrentConversation: (conversation) => set({ currentConversation: conversation }),
    setMessages: (messages) => set({ messages }),
    addMessage: (message) => set((state) => ({
        messages: [...state.messages, message]
    })),
    updateMessage: (id, updates) => set((state) => ({
        messages: state.messages.map(message => message.id === id ? Object.assign(Object.assign({}, message), updates) : message)
    })),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    subscribeToConversations: (userId) => {
        const unsubscribe = subscribeToCollection('chats', (conversations) => {
            set({ conversations: conversations });
        }, [{ field: 'members', operator: 'array-contains', value: userId }], 'lastAt', 'desc');
        return unsubscribe;
    },
    subscribeToMessages: (conversationId) => {
        const unsubscribe = subscribeToCollection(`chats/${conversationId}/messages`, (messages) => {
            set({ messages: messages });
        }, [], 'timestamp', 'asc');
        return unsubscribe;
    },
    markAsRead: (conversationId, messageId) => {
        set((state) => ({
            messages: state.messages.map(message => message.id === messageId ? Object.assign(Object.assign({}, message), { isRead: true }) : message)
        }));
    }
}));
