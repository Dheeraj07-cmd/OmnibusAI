import { create } from 'zustand';
import api from '../lib/api';

const useChatStore = create((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  isLoadingHistory: false,

  // Load all sidebar conversations
  fetchConversations: async () => {
    try {
      const res = await api.get('/conversations');
      set({ conversations: res.data });
    } catch (error) {
      console.error("Failed to load conversations", error);
    }
  },

  // Create a new thread
  createConversation: async (title, aiModel) => {
    const res = await api.post('/conversations', { title, aiModel });
    set((state) => ({ 
      conversations: [res.data, ...state.conversations],
      currentConversation: res.data,
      messages: []
    }));
    return res.data;
  },

  // Load a specific chat history
  loadConversation: async (id) => {
    set({ isLoadingHistory: true });
    try {
      const conv = get().conversations.find(c => c.id === Number(id));
      const res = await api.get(`/conversations/${id}/messages`);
      set({ currentConversation: conv, messages: res.data, isLoadingHistory: false });
    } catch (error) {
      console.error("Failed to load messages", error);
      set({ isLoadingHistory: false });
    }
  },

  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  
  // Clear current chat when clicking "New Thread"
  clearCurrentChat: () => set({ currentConversation: null, messages: [] })
}));

export default useChatStore;