import { create } from 'zustand'
import { api } from '../utils/api'

const useMcpStore = create((set, get) => ({
  servers: {},
  isLoading: false,
  error: null,
  addError: null,   // Track errors from adding
  addSuccess: false, // Track success state

  fetchServers: async () => {
    set({ isLoading: true, error: null })
    try {
      const res = await api.getMcpServers()
      set({ servers: res.servers || {}, isLoading: false })
    } catch (err) {
      set({ error: err.message, isLoading: false })
    }
  },

  addServer: async (id, command, args, transport = 'stdio') => {
    set({ isLoading: true, error: null, addError: null, addSuccess: false })
    try {
      await api.addMcpServer({ id, command, args, transport })
      await get().fetchServers()
      set({ isLoading: false, addSuccess: true })
      // Reset success state after 3 seconds
      setTimeout(() => set({ addSuccess: false }), 3000)
      return true
    } catch (err) {
      set({ error: err.message, isLoading: false, addError: err.message })
      return false
    }
  },

  deleteServer: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await api.deleteMcpServer(id)
      await get().fetchServers()
      return true
    } catch (err) {
      set({ error: err.message, isLoading: false })
      return false
    }
  },

  clearAddError: () => set({ addError: null }),
  clearError: () => set({ error: null }),
}))

export default useMcpStore
