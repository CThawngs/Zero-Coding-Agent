import express from 'express';
import { promises as fs, existsSync } from 'fs';
import { resolve } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const ENV_FILE = resolve('.env');

// Helper to read .env file
async function readEnvFile() {
  try {
    if (!existsSync(ENV_FILE)) return {};
    const content = await fs.readFile(ENV_FILE, 'utf-8');
    const env = {};
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      env[key] = value;
    }
    return env;
  } catch { return {}; }
}

// Helper to write .env file
async function writeEnvFile(envObj) {
  let content = '# Antigravity Web - API Keys\n# Managed via the UI\n\n';
  for (const [key, value] of Object.entries(envObj)) {
    content += `${key}=${value}\n`;
  }
  await fs.writeFile(ENV_FILE, content, 'utf-8');
}

// Mask API key for display
function maskKey(key) {
  if (!key || key.length < 8) return key ? '***' : '';
  return key.slice(0, 4) + '****' + key.slice(-4);
}

// ============================================================
// GET CONFIG (masked)
// ============================================================
router.get('/', async (req, res) => {
  try {
    const env = await readEnvFile();
    res.json({
      GOOGLE_API_KEY: maskKey(env.GOOGLE_API_KEY),
      OPENAI_API_KEY: maskKey(env.OPENAI_API_KEY),
      ANTHROPIC_API_KEY: maskKey(env.ANTHROPIC_API_KEY),
      OPENROUTER_API_KEY: maskKey(env.OPENROUTER_API_KEY),
      GITHUB_TOKEN: maskKey(env.GITHUB_TOKEN),
      PORT: env.PORT || '3747',
      FRONTEND_URL: env.FRONTEND_URL || 'http://localhost:5743'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// SAVE API KEY
// ============================================================
router.post('/apikey', async (req, res) => {
  try {
    const { provider, key } = req.body;
    
    const PROVIDER_ENV_MAP = {
      google: 'GOOGLE_API_KEY',
      openai: 'OPENAI_API_KEY',
      anthropic: 'ANTHROPIC_API_KEY',
      openrouter: 'OPENROUTER_API_KEY',
      custom: 'CUSTOM_API_KEY',
      '9router': 'NINEROUTER_API_KEY'
    };
    
    const envKey = PROVIDER_ENV_MAP[provider];
    if (!envKey) return res.status(400).json({ error: 'Invalid provider' });
    
    // Read current .env
    const env = await readEnvFile();
    
    // Update key
    env[envKey] = key;
    
    // Write back
    await writeEnvFile(env);
    
    // Update process.env immediately
    process.env[envKey] = key;
    
    res.json({ 
      success: true, 
      provider, 
      message: `API key saved for ${provider}`,
      masked: maskKey(key)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// SAVE GITHUB TOKEN
// ============================================================
router.post('/github-token', async (req, res) => {
  try {
    const { token } = req.body;
    
    const env = await readEnvFile();
    env.GITHUB_TOKEN = token;
    await writeEnvFile(env);
    process.env.GITHUB_TOKEN = token;
    
    res.json({ success: true, masked: maskKey(token) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/github-token', async (req, res) => {
  try {
    const env = await readEnvFile();
    res.json({ masked: maskKey(env.GITHUB_TOKEN), hasToken: !!(env.GITHUB_TOKEN) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// MCP CONFIG
// ============================================================
const MCP_CONFIG_FILE = resolve('./data/mcp/config.json');

router.get('/mcp', async (req, res) => {
  try {
    if (!existsSync(MCP_CONFIG_FILE)) {
      return res.json({ servers: [] });
    }
    const raw = await fs.readFile(MCP_CONFIG_FILE, 'utf-8');
    res.json(JSON.parse(raw));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/mcp', async (req, res) => {
  try {
    const { promises: fsPromises } = await import('fs');
    await fsPromises.mkdir(resolve('./data/mcp'), { recursive: true });
    await fs.writeFile(MCP_CONFIG_FILE, JSON.stringify(req.body, null, 2), 'utf-8');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
