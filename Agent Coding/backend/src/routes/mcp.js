import express from 'express';
import { promises as fs, existsSync } from 'fs';
import { resolve } from 'path';
import mcpManager from '../services/mcpManager.js';

const router = express.Router();
const CONFIG_FILE = resolve('./data/mcp/config.json');

// Helper to read MCP config
async function readConfig() {
  try {
    if (!existsSync(CONFIG_FILE)) {
      return { mcpServers: {} };
    }
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    if (!parsed.mcpServers) {
      parsed.mcpServers = {};
    }
    return parsed;
  } catch {
    return { mcpServers: {} };
  }
}

// Helper to write MCP config
async function writeConfig(config) {
  await fs.mkdir(resolve('./data/mcp'), { recursive: true });
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

// GET /api/mcp/servers - list all configured servers & status
router.get('/servers', (req, res) => {
  try {
    const statuses = mcpManager.getServersStatus();
    res.json({ servers: statuses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/mcp/servers - add or update an MCP server
router.post('/servers', async (req, res) => {
  try {
    const { id, command, args = [], transport = 'stdio' } = req.body;
    if (!id || !command) {
      return res.status(400).json({ error: 'id and command are required' });
    }

    const config = await readConfig();
    const serverConfig = { command, args, transport };
    config.mcpServers[id] = serverConfig;

    await writeConfig(config);

    // Start server in background
    mcpManager.startServer(id, serverConfig)
      .then(() => console.log(`[MCP] Automatically started server ${id}`))
      .catch(err => console.error(`[MCP] Failed to start server ${id}:`, err.message));

    res.json({ success: true, message: `MCP server "${id}" registered. Connecting...` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/mcp/servers/:id - remove an MCP server
router.delete('/servers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const config = await readConfig();

    if (!config.mcpServers[id]) {
      return res.status(404).json({ error: `Server "${id}" not found` });
    }

    delete config.mcpServers[id];
    await writeConfig(config);

    // Stop process
    await mcpManager.stopServer(id);

    res.json({ success: true, message: `MCP server "${id}" removed.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/mcp/call - call tool on a specific server manually
router.post('/call', async (req, res) => {
  try {
    const { serverId, name, arguments: toolArgs } = req.body;
    if (!serverId || !name) {
      return res.status(400).json({ error: 'serverId and name are required' });
    }

    const result = await mcpManager.callTool(serverId, name, toolArgs);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
