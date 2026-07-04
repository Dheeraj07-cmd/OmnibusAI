import { create } from 'zustand';
import api from '../lib/api';

const usePromptStore = create((set, get) => ({
  prompts: [],
  isLoading: false,
  error: null,
  selectedCategory: 'All',
  searchQuery: '',

  fetchPrompts: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/prompts');
      set({ prompts: res.data, isLoading: false });
    } catch (err) {
      console.error("Failed to load prompt library", err);
      set({ error: "Could not fetch prompt library.", isLoading: false });
    }
  },

  createPrompt: async (newPrompt) => {
    try {
      const res = await api.post('/prompts', newPrompt);
      set((state) => ({ prompts: [res.data, ...state.prompts] }));
      return res.data;
    } catch (err) {
      console.error("Failed to save custom prompt", err);
      throw err;
    }
  },

  deletePrompt: async (id) => {
    try {
      await api.delete(`/prompts/${id}`);
      set((state) => ({ prompts: state.prompts.filter((p) => p.id !== id) }));
    } catch (err) {
      console.error("Failed to delete prompt", err);
      alert("Cannot delete this prompt.");
    }
  },

  setCategory: (category) => set({ selectedCategory: category }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  getFilteredPrompts: () => {
    const { prompts, selectedCategory, searchQuery } = get();
    return prompts.filter((p) => {
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase();
      const matchesSearch = p.title.toLowerCase().includes(q) || 
                            p.description?.toLowerCase().includes(q) ||
                            p.tags?.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }
}));

export default usePromptStore;