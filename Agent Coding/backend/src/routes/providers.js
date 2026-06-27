import { Router } from 'express';
import { fetchProviderModels as discoverModels, testConnection as testProvider } from '../services/llmRouter.js';
import fetch from 'node-fetch';


const router = Router();

// ─── Static Provider Definitions ─────────────────────────────────────────────
const PROVIDERS = {
  google: {
    id: 'google',
    name: 'Google Gemini',
    description: 'State-of-the-art multimodal models from Google DeepMind',
    icon: 'https://unpkg.com/@lobehub/icons-static-svg@latest/icons/gemini.svg',
    requiresKey: true,
    envKey: 'GOOGLE_API_KEY',
    docsUrl: 'https://aistudio.google.com/app/apikey',
    models: [
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', contextWindow: 2000000, isFree: false },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', contextWindow: 1000000, isFree: false },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', contextWindow: 1000000, isFree: false },
      { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite', contextWindow: 1000000, isFree: true },
      { id: 'gemini-2.0-pro-exp', name: 'Gemini 2.0 Pro Exp', contextWindow: 1000000, isFree: true },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', contextWindow: 2000000, isFree: false },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', contextWindow: 1000000, isFree: true },
      { id: 'gemini-1.5-flash-8b', name: 'Gemini 1.5 Flash 8B', contextWindow: 1000000, isFree: true },
    ],
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4o, o3, and cutting-edge models from OpenAI',
    icon: 'https://unpkg.com/@lobehub/icons-static-svg@latest/icons/openai.svg',
    requiresKey: true,
    envKey: 'OPENAI_API_KEY',
    docsUrl: 'https://platform.openai.com/api-keys',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', contextWindow: 128000, isFree: false },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', contextWindow: 128000, isFree: false },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', contextWindow: 128000, isFree: false },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', contextWindow: 16385, isFree: false },
      { id: 'o1', name: 'o1', contextWindow: 200000, isFree: false },
      { id: 'o1-mini', name: 'o1 Mini', contextWindow: 128000, isFree: false },
      { id: 'o3-mini', name: 'o3 Mini', contextWindow: 200000, isFree: false },
      { id: 'o4-mini', name: 'o4 Mini', contextWindow: 200000, isFree: false },
    ],
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude models — safe, harmless, and helpful AI',
    icon: 'https://unpkg.com/@lobehub/icons-static-svg@latest/icons/claude.svg',
    requiresKey: true,
    envKey: 'ANTHROPIC_API_KEY',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    models: [
      { id: 'claude-opus-4-5-20251101', name: 'Claude Opus 4.5', contextWindow: 200000, isFree: false },
      { id: 'claude-sonnet-4-5-20251101', name: 'Claude Sonnet 4.5', contextWindow: 200000, isFree: false },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', contextWindow: 200000, isFree: false },
      { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet', contextWindow: 200000, isFree: false },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', contextWindow: 200000, isFree: false },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', contextWindow: 200000, isFree: false },
    ],
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'Access 300+ models with a single API key',
    icon: 'https://unpkg.com/@lobehub/icons-static-svg@latest/icons/openrouter.svg',
    requiresKey: true,
    envKey: 'OPENROUTER_API_KEY',
    docsUrl: 'https://openrouter.ai/keys',
    models: [], // Dynamic
  },
  ollama: {
    id: 'ollama',
    name: 'Ollama',
    description: 'Run open-source LLMs locally',
    icon: 'https://unpkg.com/@lobehub/icons-static-svg@latest/icons/ollama.svg',
    requiresKey: false,
    baseUrl: 'http://localhost:11434',
    models: [], // Dynamic
  },
  lmstudio: {
    id: 'lmstudio',
    name: 'LM Studio',
    description: 'Run models locally with LM Studio',
    icon: 'https://unpkg.com/@lobehub/icons-static-svg@latest/icons/lmstudio.svg',
    requiresKey: false,
    baseUrl: 'http://localhost:1234',
    models: [], // Dynamic
  },
  custom: {
    id: 'custom',
    name: 'Custom Endpoint',
    description: 'Self-hosted or custom OpenAI-compatible endpoint',
    icon: 'https://unpkg.com/@lobehub/icons-static-svg@latest/icons/lobe.svg',
    requiresKey: false,
    envKey: 'CUSTOM_API_KEY',
    baseUrl: 'http://127.0.0.1:8000/v1',
    models: [], // Dynamic / user-added
  },
  '9router': {
    id: '9router',
    name: '9Router',
    description: 'Smart LLM proxy and gateway',
    icon: 'https://9router.com/favicon.ico',
    requiresKey: false,
    envKey: 'NINEROUTER_API_KEY',
    baseUrl: 'http://localhost:20128/v1',
    models: [], // Dynamic / user-added
  },
};

// ─── Check provider availability ──────────────────────────────────────────────
function getProviderStatus(providerId) {
  const provider = PROVIDERS[providerId];
  if (!provider) return 'unknown';

  if (provider.requiresKey) {
    const key = process.env[provider.envKey];
    return key ? 'configured' : 'not_configured';
  }

  return 'local'; // Ollama/LM Studio — availability checked separately
}

// ─── GET /api/providers ───────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const providers = Object.values(PROVIDERS).map((p) => ({
    ...p,
    status: getProviderStatus(p.id),
    hasKey: p.requiresKey ? !!process.env[p.envKey] : null,
  }));
  res.json(providers);
});

// ─── GET /api/providers/:id ───────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  const provider = PROVIDERS[req.params.id];
  if (!provider) return res.status(404).json({ error: 'Provider not found' });

  res.json({
    ...provider,
    status: getProviderStatus(provider.id),
    hasKey: provider.requiresKey ? !!process.env[provider.envKey] : null,
  });
});

// ─── GET /api/providers/:id/models ───────────────────────────────────────────
router.get('/:id/models', async (req, res) => {
  const { id } = req.params;
  const provider = PROVIDERS[id];
  if (!provider) return res.status(404).json({ error: 'Provider not found' });

  try {
    if (id === 'ollama' || id === 'lmstudio' || id === 'openrouter' || id === '9router' || id === 'custom') {
      const apiKey = req.query.key || process.env[provider.envKey];
      const baseURL = req.query.baseUrl || provider.baseUrl;
      const dynamic = await discoverModels(id, apiKey, baseURL);
      return res.json({ provider: id, models: dynamic });
    }

    res.json({ provider: id, models: provider.models });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/providers/:id/test ─────────────────────────────────────────────
router.post('/:id/test', async (req, res) => {
  const { id } = req.params;
  const { key, baseUrl } = req.body;

  if (!PROVIDERS[id]) return res.status(404).json({ error: 'Provider not found' });

  const apiKey = key || process.env[PROVIDERS[id]?.envKey];
  const baseURL = baseUrl || PROVIDERS[id]?.baseUrl;

  try {
    const result = await testProvider(id, apiKey, baseURL);
    res.json(result);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── GET /api/models?filter=free ─────────────────────────────────────────────
router.get('/models/all', async (req, res) => {
  const { filter } = req.query;

  try {
    const allModels = [];

    for (const [providerId, provider] of Object.entries(PROVIDERS)) {
      let models = provider.models;

      // Dynamic providers
      if (['ollama', 'lmstudio', 'openrouter', '9router', 'custom'].includes(providerId)) {
        try {
          const apiKey = process.env[provider.envKey];
          const baseURL = provider.baseUrl;
          models = await discoverModels(providerId, apiKey, baseURL);
        } catch {
          models = [];
        }
      }

      for (const model of models) {
        if (filter === 'free' && !model.isFree) continue;
        allModels.push({
          ...model,
          provider: providerId,
          providerName: provider.name,
        });
      }
    }

    res.json(allModels);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/providers/ollama/connect ──────────────────────────────────────
router.post('/ollama/connect', async (req, res) => {
  const { baseUrl = 'http://localhost:11434' } = req.body;

  try {
    const response = await fetch(`${baseUrl}/api/tags`, { timeout: 5000 });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    res.json({
      connected: true,
      baseUrl,
      models: (data.models || []).map((m) => ({ id: m.name, name: m.name })),
    });
  } catch (err) {
    res.json({ connected: false, error: `Ollama not reachable at ${baseUrl}: ${err.message}` });
  }
});

// ─── POST /api/providers/lmstudio/connect ────────────────────────────────────
router.post('/lmstudio/connect', async (req, res) => {
  const { baseUrl = 'http://localhost:1234' } = req.body;

  try {
    const response = await fetch(`${baseUrl}/v1/models`, { timeout: 5000 });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    res.json({
      connected: true,
      baseUrl,
      models: (data.data || []).map((m) => ({ id: m.id, name: m.id })),
    });
  } catch (err) {
    res.json({ connected: false, error: `LM Studio not reachable at ${baseUrl}: ${err.message}` });
  }
});

export default router;
