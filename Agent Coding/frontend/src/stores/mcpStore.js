import { create } from 'zustand'
import { api } from '../utils/api'

const useMcpStore = create((set, get) => ({
  servers: {},
  isLoading: false,
  error: null,

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
    set({ isLoading: true, error: null })
    try {
      await api.addMcpServer({ id, command, args, transport })
      await get().fetchServers()
      return true
    } catch (err) {
      set({ error: err.message, isLoading: false })
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
  }
}))

export default useMcpStore
