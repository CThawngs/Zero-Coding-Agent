import { spawn } from 'child_process';
import readline from 'readline';
import { promises as fs, existsSync } from 'fs';
import { resolve } from 'path';

const CONFIG_FILE = resolve('./data/mcp/config.json');

class McpManager {
  constructor() {
    this.servers = {}; // serverId -> { config, process, status, tools, requestCallbacks, nextId }
  }

  async init() {
    console.log('[MCP] Initializing MCP Manager...');
    try {
      await this.loadAndStartServers();
    } catch (err) {
      console.error('[MCP] Init error:', err.message);
    }
  }

  async loadAndStartServers() {
    if (!existsSync(CONFIG_FILE)) {
      console.log('[MCP] No configuration file found.');
      return;
    }

    try {
      const data = await fs.readFile(CONFIG_FILE, 'utf-8');
      const config = JSON.parse(data);
      const serversConfig = config.mcpServers || config.servers || {};

      for (const [id, srvConfig] of Object.entries(serversConfig)) {
        await this.startServer(id, srvConfig);
      }
    } catch (err) {
      console.error('[MCP] Failed to load servers config:', err.message);
    }
  }

  async startServer(id, config) {
    if (this.servers[id]) {
      await this.stopServer(id);
    }

    console.log(`[MCP] Starting server "${id}" using ${config.command} ${config.args.join(' ')}`);

    this.servers[id] = {
      config,
      process: null,
      status: 'disconnected',
      tools: [],
      requestCallbacks: {},
      nextId: 1
    };

    try {
      // For Windows, run command via shell if needed, or spawn directly
      // On Windows, npx is often npx.cmd. We should handle npx wrapper.
      let command = config.command;
      let args = config.args || [];

      if (process.platform === 'win32') {
        if (command === 'npx' || command === 'npm') {
          command = `${command}.cmd`;
        }
      }

      const proc = spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env }
      });

      this.servers[id].process = proc;
      this.servers[id].status = 'connecting';

      // Read lines from stdout
      const rl = readline.createInterface({
        input: proc.stdout,
        terminal: false
      });

      rl.on('line', (line) => {
        this.handleMessage(id, line);
      });

      // Log stderr for debugging
      const errRl = readline.createInterface({
        input: proc.stderr,
        terminal: false
      });
      errRl.on('line', (line) => {
        console.error(`[MCP][${id}][STDERR]`, line);
      });

      proc.on('close', (code) => {
        console.log(`[MCP][${id}] Process exited with code ${code}`);
        if (this.servers[id]) {
          this.servers[id].status = 'disconnected';
          this.servers[id].process = null;
          this.servers[id].tools = [];
        }
      });

      proc.on('error', (err) => {
        console.error(`[MCP][${id}] Process spawn error:`, err.message);
        if (this.servers[id]) {
          this.servers[id].status = 'error';
          this.servers[id].errorMessage = err.message;
        }
      });

      // Perform handshake
      await this.performHandshake(id);
      
      // Load tools
      await this.loadTools(id);

    } catch (err) {
      console.error(`[MCP][${id}] Failed to start:`, err.message);
      if (this.servers[id]) {
        this.servers[id].status = 'error';
        this.servers[id].errorMessage = err.message;
      }
    }
  }

  async stopServer(id) {
    const server = this.servers[id];
    if (!server) return;

    console.log(`[MCP] Stopping server "${id}"`);
    if (server.process) {
      server.process.kill();
    }
    delete this.servers[id];
  }

  async shutdown() {
    console.log('[MCP] Shutting down all MCP servers...');
    for (const id of Object.keys(this.servers)) {
      await this.stopServer(id);
    }
  }

  handleMessage(serverId, line) {
    try {
      const msg = JSON.parse(line.trim());
      const server = this.servers[serverId];
      if (!server) return;

      // Handle response
      if (msg.id !== undefined) {
        const callback = server.requestCallbacks[msg.id];
        if (callback) {
          delete server.requestCallbacks[msg.id];
          if (msg.error) {
            callback.reject(new Error(msg.error.message || JSON.stringify(msg.error)));
          } else {
            callback.resolve(msg.result);
          }
        }
      } else {
        // Log notifications or requests from server
        console.log(`[MCP][${serverId}] Received notification/request:`, msg.method);
      }
    } catch (err) {
      console.error(`[MCP][${serverId}] Failed to parse message line:`, line, err.message);
    }
  }

  sendRequest(serverId, method, params = {}) {
    return new Promise((resolve, reject) => {
      const server = this.servers[serverId];
      if (!server || !server.process || server.process.killed) {
        return reject(new Error(`Server "${serverId}" is not connected`));
      }

      const id = server.nextId++;
      const payload = {
        jsonrpc: '2.0',
        id,
        method,
        params
      };

      server.requestCallbacks[id] = { resolve, reject };
      server.process.stdin.write(JSON.stringify(payload) + '\n');
    });
  }

  sendNotification(serverId, method, params = {}) {
    const server = this.servers[serverId];
    if (!server || !server.process || server.process.killed) {
      return;
    }

    const payload = {
      jsonrpc: '2.0',
      method,
      params
    };

    server.process.stdin.write(JSON.stringify(payload) + '\n');
  }

  async performHandshake(serverId) {
    try {
      console.log(`[MCP][${serverId}] Performing initialize handshake...`);
      const result = await this.sendRequest(serverId, 'initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'antigravity-web-client',
          version: '1.0.0'
        }
      });

      console.log(`[MCP][${serverId}] Handshake successful. Server Info:`, result.serverInfo?.name);
      
      this.sendNotification(serverId, 'notifications/initialized', {});
      
      const server = this.servers[serverId];
      if (server) {
        server.status = 'connected';
      }
    } catch (err) {
      console.error(`[MCP][${serverId}] Handshake failed:`, err.message);
      const server = this.servers[serverId];
      if (server) {
        server.status = 'error';
        server.errorMessage = `Handshake failed: ${err.message}`;
      }
      throw err;
    }
  }

  async loadTools(serverId) {
    try {
      console.log(`[MCP][${serverId}] Querying tools list...`);
      const result = await this.sendRequest(serverId, 'tools/list', {});
      const server = this.servers[serverId];
      if (server) {
        server.tools = result.tools || [];
        console.log(`[MCP][${serverId}] Loaded ${server.tools.length} tools`);
      }
    } catch (err) {
      console.error(`[MCP][${serverId}] Failed to load tools:`, err.message);
    }
  }

  async callTool(serverId, name, params = {}) {
    console.log(`[MCP][${serverId}] Calling tool "${name}" with params:`, JSON.stringify(params));
    try {
      const result = await this.sendRequest(serverId, 'tools/call', {
        name,
        arguments: params
      });
      return result;
    } catch (err) {
      console.error(`[MCP][${serverId}] Tool call "${name}" failed:`, err.message);
      throw err;
    }
  }

  getAllTools() {
    const list = [];
    for (const [serverId, server] of Object.entries(this.servers)) {
      if (server.status === 'connected') {
        for (const tool of server.tools) {
          list.push({
            serverId,
            ...tool,
            fullName: `mcp_${serverId}_${tool.name}`
          });
        }
      }
    }
    return list;
  }

  getServersStatus() {
    const result = {};
    for (const [id, server] of Object.entries(this.servers)) {
      result[id] = {
        status: server.status,
        errorMessage: server.errorMessage,
        toolsCount: server.tools.length,
        tools: server.tools,
        config: server.config
      };
    }
    return result;
  }
}

const mcpManager = new McpManager();
export default mcpManager;
