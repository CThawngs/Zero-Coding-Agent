import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '../utils/api'

export const PROVIDER_MODELS = {
  google: {
    name: 'Google',
    icon: 'https://unpkg.com/@lobehub/icons-static-svg@latest/icons/gemini.svg',
    color: '#4285f4',
    models: [
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', contextWindow: 1000000, free: false },
      { id: 'gemini-2.0-flash-thinking', name: 'Gemini 2.0 Flash Thinking', contextWindow: 1000000, free: false },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', contextWindow: 2000000, free: false },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', contextWindow: 1000000, free: false },
      { id: 'gemini-1.5-flash-8b', name: 'Gemini 1.5 Flash 8B', contextWindow: 1000000, free: false },
    ]
  },
  openai: {
    name: 'OpenAI',
    icon: 'https://unpkg.com/@lobehub/icons-static-svg@latest/icons/openai.svg',
    color: '#10a37f',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', contextWindow: 128000, free: false },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', contextWindow: 128000, free: false },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', contextWindow: 128000, free: false },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', contextWindow: 16385, free: false },
      { id: 'o1-preview', name: 'o1 Preview', contextWindow: 128000, free: false },
      { id: 'o1-mini', name: 'o1 Mini', contextWindow: 128000, free: false },
    ]
  },
  anthropic: {
    name: 'Anthropic',
    icon: 'https://unpkg.com/@lobehub/icons-static-svg@latest/icons/claude.svg',
    color: '#cc785c',
    models: [
      { id: 'claude-opus-4-5', name: 'Claude Opus 4.5', contextWindow: 200000, free: false },
      { id: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5', contextWindow: 200000, free: false },
      { id: 'claude-haiku-3-5', name: 'Claude Haiku 3.5', contextWindow: 200000, free: false },
      { id: 'claude-opus-4', name: 'Claude Opus 4', contextWindow: 200000, free: false },
      { id: 'claude-sonnet-4', name: 'Claude Sonnet 4', contextWindow: 200000, free: false },
    ]
  },
  openrouter: {
    name: 'OpenRouter',
    icon: 'https://unpkg.com/@lobehub/icons-static-svg@latest/icons/openrouter.svg',
    color: '#7c3aed',
    models: [] // Dynamic / user-added
  },
  ollama: {
    name: 'Ollama',
    icon: 'https://unpkg.com/@lobehub/icons-static-svg@latest/icons/ollama.svg',
    color: '#f97316',
    models: [] // Detected locally
  },
  lmstudio: {
    name: 'LM Studio',
    icon: 'https://unpkg.com/@lobehub/icons-static-svg@latest/icons/lmstudio.svg',
    color: '#06b6d4',
    models: [] // Detected locally
  },
  custom: {
    name: 'Custom Endpoint',
    icon: 'https://unpkg.com/@lobehub/icons-static-svg@latest/icons/lobe.svg',
    color: '#3b82f6',
    models: [] // Custom/User added
  },
  '9router': {
    name: '9Router',
    icon: 'https://9router.com/favicon.ico',
    color: '#3b82f6',
    models: []
  }
}

const useProviderStore = create(
  persist(
    (set, get) => ({
      // State
      providers: {
        google: { apiKey: '', connected: false, customModels: [], deletedModels: [] },
        openai: { apiKey: '', connected: false, customModels: [], deletedModels: [] },
        anthropic: { apiKey: '', connected: false, customModels: [], deletedModels: [] },
        openrouter: { apiKey: '', connected: false, customModels: [], deletedModels: [] },
        ollama: { connected: false, localModels: [], baseUrl: 'http://localhost:11434', customModels: [], deletedModels: [] },
        lmstudio: { connected: false, localModels: [], baseUrl: 'http://localhost:1234', customModels: [], deletedModels: [] },
        custom: { apiKey: '', connected: false, baseUrl: 'http://127.0.0.1:8000/v1', customName: 'Custom Endpoint', customModels: [], deletedModels: [] },
        '9router': { apiKey: '', connected: false, baseUrl: 'http://localhost:20128/v1', customName: '9Router', customModels: [], deletedModels: [] },
      },
      activeProvider: null,
      activeModel: null,
      contextWindow: 'auto',
      showFreeOnly: false,

      // Check if any provider is configured
      isConfigured: () => {
        const { providers } = get()
        return (
          (providers.google.apiKey && providers.google.connected) ||
          (providers.openai.apiKey && providers.openai.connected) ||
          (providers.anthropic.apiKey && providers.anthropic.connected) ||
          (providers.openrouter.apiKey && providers.openrouter.connected) ||
          (providers['9router']?.apiKey && providers['9router']?.connected) ||
          providers.ollama.connected ||
          providers.lmstudio.connected
        )
      },

      // Save API key
      saveApiKey: async (providerId, key) => {
        set(state => ({
          providers: {
            ...state.providers,
            [providerId]: { ...state.providers[providerId], apiKey: key }
          }
        }))

        // Save to backend .env file
        try {
          await api.saveApiKey(providerId, key)
        } catch (err) {
          console.warn('Could not persist key to backend:', err.message)
        }

        // Verify connection
        try {
          const result = await api.verifyProvider(providerId, key)
          const connected = result.success === true || result.valid === true
          set(state => ({
            providers: {
              ...state.providers,
              [providerId]: { ...state.providers[providerId], connected }
            }
          }))
          return connected
        } catch {
          // Optimistic: mark as connected if key was entered
          if (key && key.length > 10) {
            set(state => ({
              providers: {
                ...state.providers,
                [providerId]: { ...state.providers[providerId], connected: true }
              }
            }))
            return true
          }
          return false
        }
      },

      // Update provider config (e.g. custom endpoints or keys)
      updateProviderConfig: (providerId, config) => {
        set(state => ({
          providers: {
            ...state.providers,
            [providerId]: {
              ...state.providers[providerId],
              ...config
            }
          }
        }))
      },

      // Select provider
      selectProvider: (providerId) => {
        const models = get().getModelsForProvider(providerId)
        const firstModel = models[0]?.id || null
        set({
          activeProvider: providerId,
          activeModel: firstModel,
        })
      },

      // Select model
      selectModel: (modelId) => {
        set({ activeModel: modelId })
      },

      // Set context window
      setContextWindow: (value) => {
        set({ contextWindow: value })
      },

      // Add custom model
      addCustomModel: (providerId, modelName) => {
        if (!modelName.trim()) return
        set(state => {
          const prov = state.providers[providerId] || {}
          const deleted = (prov.deletedModels || []).filter(id => id !== modelName)
          const custom = [
            ...(prov.customModels || []),
            { id: modelName, name: modelName, contextWindow: 128000, free: false }
          ].filter((m, i, arr) => arr.findIndex(x => x.id === m.id) === i)

          return {
            providers: {
              ...state.providers,
              [providerId]: {
                ...prov,
                customModels: custom,
                deletedModels: deleted
              }
            }
          }
        })
      },

      // Remove / Delete any model from the provider
      removeCustomModel: (providerId, modelId) => {
        set(state => {
          const prov = state.providers[providerId] || {}
          const isCustom = (prov.customModels || []).some(m => m.id === modelId)
          
          let newCustom = prov.customModels || []
          let newDeleted = prov.deletedModels || []

          if (isCustom) {
            newCustom = newCustom.filter(m => m.id !== modelId)
          } else {
            // It's a base or local model, add to deletedModels list to hide it
            if (!newDeleted.includes(modelId)) {
              newDeleted = [...newDeleted, modelId]
            }
          }

          return {
            providers: {
              ...state.providers,
              [providerId]: {
                ...prov,
                customModels: newCustom,
                deletedModels: newDeleted
              }
            }
          }
        })

        // If active model was removed, reset to first available model
        if (get().activeModel === modelId) {
          const remaining = get().getModelsForProvider(providerId)
          set({ activeModel: remaining[0]?.id || null })
        }
      },

      // Get models for a provider
      getModelsForProvider: (providerId) => {
        const state = get()
        const prov = state.providers[providerId]
        if (!prov) return []
        const base = PROVIDER_MODELS[providerId]?.models || []
        const custom = prov.customModels || []
        const local = prov.localModels || []
        const deleted = prov.deletedModels || []
        return [...base, ...custom, ...local].filter(m => !deleted.includes(m.id))
      },

      // Fetch available models (for OpenRouter or local providers)
      fetchModels: async (providerId) => {
        try {
          const models = await api.getModels(providerId)
          set(state => ({
            providers: {
              ...state.providers,
              [providerId]: { ...state.providers[providerId], customModels: models }
            }
          }))
        } catch (err) {
          console.error('Failed to fetch models:', err)
        }
      },

      // Connect Ollama
      connectOllama: async () => {
        const { providers } = get()
        const baseUrl = providers.ollama.baseUrl || 'http://localhost:11434'
        try {
          const result = await api.connectOllama(baseUrl)
          set(state => ({
            providers: {
              ...state.providers,
              ollama: {
                ...state.providers.ollama,
                connected: true,
                localModels: (result.models || []).map(m => ({
                  id: m.name,
                  name: m.name,
                  contextWindow: m.context_length || 4096,
                  free: true,
                  size: m.size
                }))
              }
            }
          }))
          return true
        } catch (err) {
          console.error('Ollama connection failed:', err)
          set(state => ({
            providers: {
              ...state.providers,
              ollama: { ...state.providers.ollama, connected: false }
            }
          }))
          return false
        }
      },

      // Connect LM Studio
      connectLMStudio: async () => {
        const { providers } = get()
        const baseUrl = providers.lmstudio.baseUrl || 'http://localhost:1234'
        try {
          const result = await api.connectLMStudio(baseUrl)
          set(state => ({
            providers: {
              ...state.providers,
              lmstudio: {
                ...state.providers.lmstudio,
                connected: true,
                localModels: (result.models || []).map(m => ({
                  id: m.id,
                  name: m.id,
                  contextWindow: m.context_length || 4096,
                  free: true
                }))
              }
            }
          }))
          return true
        } catch (err) {
          console.error('LMStudio connection failed:', err)
          set(state => ({
            providers: {
              ...state.providers,
              lmstudio: { ...state.providers.lmstudio, connected: false }
            }
          }))
          return false
        }
      },

      // Toggle free filter
      toggleFreeFilter: () => {
        set(state => ({ showFreeOnly: !state.showFreeOnly }))
      },

      // Check if model is free
      isModelFree: (model) => {
        return model?.free === true
      },

      // Set base URL for local providers
      setBaseUrl: (providerId, url) => {
        set(state => ({
          providers: {
            ...state.providers,
            [providerId]: { ...state.providers[providerId], baseUrl: url }
          }
        }))
      },
    }),
    {
      name: 'antigravity-providers',
      partialize: (state) => ({
        providers: state.providers,
        activeProvider: state.activeProvider,
        activeModel: state.activeModel,
        contextWindow: state.contextWindow,
        showFreeOnly: state.showFreeOnly,
      })
    }
  )
)

export default useProviderStore
