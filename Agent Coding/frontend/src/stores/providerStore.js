import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '../utils/api'
import { encryptObject, decryptObject } from '../utils/crypto'

export const PROVIDER_MODELS = {
  google: {
    name: 'Google',
    icon: 'https://unpkg.com/@lobehub/icons-static-svg@latest/icons/gemini-color.svg',
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
    icon: '/openai.png',
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
    icon: 'https://unpkg.com/@lobehub/icons-static-svg@latest/icons/claude-color.svg',
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
    icon: '/openrouter.png',
    color: '#7c3aed',
    models: [] // Dynamic / user-added
  },
  ollama: {
    name: 'Ollama',
    icon: '/ollama.png',
    color: '#f97316',
    models: [] // Detected locally
  },
  lmstudio: {
    name: 'LM Studio',
    icon: '/lmstudio.png',
    color: '#06b6d4',
    models: [] // Detected locally
  },
  custom: {
    name: 'Custom Endpoint',
    icon: null,
    color: '#3b82f6',
    models: [] // Custom/User added
  },
  '9router': {
    name: '9Router',
    icon: '/nine-router.png',
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
      modelErrors: {}, // { providerId: errorMessage }

      // Sync config with backend on startup
      syncWithBackend: async () => {
        try {
          const config = await api.getConfig()
          set(state => {
            const updatedProviders = { ...state.providers }
            const envKeys = {
              google: 'GOOGLE_API_KEY',
              openai: 'OPENAI_API_KEY',
              anthropic: 'ANTHROPIC_API_KEY',
              openrouter: 'OPENROUTER_API_KEY',
              custom: 'CUSTOM_API_KEY',
              '9router': 'NINEROUTER_API_KEY'
            }

            Object.keys(updatedProviders).forEach(pid => {
              const envKey = envKeys[pid]
              if (envKey) {
                const hasKey = config[envKey] && config[envKey].length > 0
                if (hasKey) {
                  updatedProviders[pid].connected = true
                  if (!updatedProviders[pid].apiKey) {
                    updatedProviders[pid].apiKey = config[envKey]
                  }
                }
              }
            })

            let activeProvider = state.activeProvider
            let activeModel = state.activeModel
            if (!activeProvider) {
              const firstConnected = Object.keys(updatedProviders).find(pid => updatedProviders[pid].connected)
              if (firstConnected) {
                activeProvider = firstConnected
                const models = PROVIDER_MODELS[firstConnected]?.models || []
                activeModel = models[0]?.id || null
              }
            }

            return {
              providers: updatedProviders,
              activeProvider,
              activeModel
            }
          })
        } catch (err) {
          console.warn('Failed to sync provider config with backend:', err.message)
        }
      },

      // Check if any provider is configured
      isConfigured: () => {
        const { providers } = get()
        return (
          (providers.google.apiKey && providers.google.connected) ||
          (providers.openai.apiKey && providers.openai.connected) ||
          (providers.anthropic.apiKey && providers.anthropic.connected) ||
          (providers.openrouter.apiKey && providers.openrouter.connected) ||
          (providers['9router']?.connected) ||
          (providers.custom?.connected) ||
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

      // Add custom model (with validation)
      addCustomModel: async (providerId, modelName) => {
        if (!modelName.trim()) return { success: false, error: 'Model name is required' }

        const prov = get().providers[providerId]
        if (!prov) return { success: false, error: 'Provider not found' }

        // Check if provider has API key (required for non-local providers)
        const needsKey = ['google', 'openai', 'anthropic', 'openrouter', '9router', 'custom'].includes(providerId)
        if (needsKey && !prov.apiKey) {
          return { success: false, error: `API key required. Please add an API key for ${providerId} first.` }
        }

        // Validate model exists in provider
        try {
          const result = await api.validateModel(providerId, modelName.trim(), prov.apiKey)
          if (!result.valid) {
            // Clear any previous error for this provider
            set(state => ({
              modelErrors: { ...state.modelErrors, [providerId]: result.error }
            }))
            return { success: false, error: result.error, suggestion: result.suggestion, available: result.available }
          }

          // Model is valid — add it
          set(state => {
            const deleted = (state.providers[providerId].deletedModels || []).filter(id => id !== modelName.trim())
            const existing = state.providers[providerId].customModels || []
            // Don't add duplicates
            if (existing.some(m => m.id === modelName.trim())) return {}
            const custom = [
              ...existing,
              { id: modelName.trim(), name: result.model?.name || modelName.trim(), contextWindow: result.model?.contextWindow || 128000, free: result.model?.isFree || false }
            ]
            return {
              providers: {
                ...state.providers,
                [providerId]: {
                  ...state.providers[providerId],
                  customModels: custom,
                  deletedModels: deleted
                }
              },
              modelErrors: { ...state.modelErrors, [providerId]: null }
            }
          })
          return { success: true, model: result.model }
        } catch (err) {
          const errorMsg = `Could not validate model: ${err.message}`
          set(state => ({ modelErrors: { ...state.modelErrors, [providerId]: errorMsg } }))
          return { success: false, error: errorMsg }
        }
      },

      // Clear model error
      clearModelError: (providerId) => {
        set(state => ({ modelErrors: { ...state.modelErrors, [providerId]: null } }))
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
        if (!model) return false
        const nameMatch = typeof model.name === 'string' && model.name.toLowerCase().includes('free')
        const idMatch = typeof model.id === 'string' && model.id.toLowerCase().includes('free')
        return model.free === true || nameMatch || idMatch
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
        modelErrors: {},
      }),
      // Custom serialize/deserialize — use JSON for reliability
      // (async Web Crypto encryption is split into export/import only)
      serialize: (state) => {
        try {
          return JSON.stringify({ ...state, _v: 2 }) // version 2 = plaintext
        } catch (e) {
          console.warn('Serialize failed:', e)
          return '{}'
        }
      },
      deserialize: (str) => {
        try {
          const parsed = JSON.parse(str)
          // Version check: if old encrypted format (no _v or _v < 2), reset
          if (!parsed._v || parsed._v < 2) {
            console.log('[providerStore] Clearing old format localStorage')
            return undefined
          }
          delete parsed._v
          // Migrate: ensure all provider entries have customModels/deletedModels arrays
          if (parsed.providers) {
            Object.keys(parsed.providers).forEach(pid => {
              if (!parsed.providers[pid].customModels) parsed.providers[pid].customModels = []
              if (!parsed.providers[pid].deletedModels) parsed.providers[pid].deletedModels = []
              if (!parsed.providers[pid].localModels) parsed.providers[pid].localModels = []
            })
          }
          return parsed
        } catch (e) {
          console.warn('Deserialize failed, resetting:', e.message)
          return undefined
        }
      },
    }
  )
)

export default useProviderStore
