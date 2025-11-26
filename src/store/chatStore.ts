import { create } from 'zustand'
import { subscribeToCollection, subscribeToDocument } from '@/lib/firestore'

export interface Message {
  id: string
  text: string
  senderId: string
  timestamp: Date
  type: 'text' | 'image'
  imageUrl?: string
  isRead: boolean
}

export interface Conversation {
  id: string
  members: string[]
  lastMessage: {
    text: string
    senderId: string
    timestamp: Date
  }
  lastAt: Date
  unreadCount: number
}

interface ChatStore {
  conversations: Conversation[]
  currentConversation: Conversation | null
  messages: Message[]
  loading: boolean
  error: string | null
  setConversations: (conversations: Conversation[]) => void
  setCurrentConversation: (conversation: Conversation | null) => void
  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void
  updateMessage: (id: string, updates: Partial<Message>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  subscribeToConversations: (userId: string) => () => void
  subscribeToMessages: (conversationId: string) => () => void
  markAsRead: (conversationId: string, messageId: string) => void
}

export const useChatStore = create<ChatStore>((set, get) => ({
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
    messages: state.messages.map(message => 
      message.id === id ? { ...message, ...updates } : message
    )
  })),
  
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error }),
  
  subscribeToConversations: (userId) => {
    const unsubscribe = subscribeToCollection(
      'chats',
      (conversations) => {
        set({ conversations: conversations as Conversation[] })
      },
      [{ field: 'members', operator: 'array-contains', value: userId }],
      'lastAt',
      'desc'
    )
    
    return unsubscribe
  },
  
  subscribeToMessages: (conversationId) => {
    const unsubscribe = subscribeToCollection(
      `chats/${conversationId}/messages`,
      (messages) => {
        set({ messages: messages as Message[] })
      },
      [],
      'timestamp',
      'asc'
    )
    
    return unsubscribe
  },
  
  markAsRead: (conversationId, messageId) => {
    set((state) => ({
      messages: state.messages.map(message => 
        message.id === messageId ? { ...message, isRead: true } : message
      )
    }))
  }
}))
