import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

// Routes
import chatRoutes from './routes/chat.js';
import filesRoutes from './routes/files.js';
import providersRoutes from './routes/providers.js';
import configRoutes from './routes/config.js';
import terminalRoutes from './routes/terminal.js';
import githubRoutes from './routes/github.js';
import urlRoutes from './routes/url.js';
import mcpRoutes from './routes/mcp.js';
import a2aRoutes from './routes/a2a.js';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || './data';

// Ensure data directories exist
mkdirSync(join(DATA_DIR, 'conversations'), { recursive: true });
mkdirSync(join(DATA_DIR, 'mcp'), { recursive: true });

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3747;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5743';

// Middleware
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:5743', 'http://127.0.0.1:5743', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Rate limiting - generous for localhost
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  skip: (req) => req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1'
});
app.use('/api', limiter);

// Request logger
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Mount routes
app.use('/api', chatRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/providers', providersRoutes);
app.use('/api/config', configRoutes);
app.use('/api/terminal', terminalRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/url', urlRoutes);
app.use('/api/mcp', mcpRoutes);
app.use('/api/a2a', a2aRoutes);

// Well-known Agent Card
app.get('/.well-known/agent-card.json', (req, res) => {
  res.redirect('/api/a2a/agent-card');
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() });
});

// WebSocket for file watching
wss.on('connection', (ws, req) => {
  console.log('[WS] Client connected');
  
  ws.on('message', async (data) => {
    try {
      const msg = JSON.parse(data.toString());
      
      if (msg.type === 'watch') {
        const { default: chokidar } = await import('chokidar');
        const watcher = chokidar.watch(msg.path, {
          ignored: /(^|[\/\\])\..|(node_modules)/,
          persistent: true,
          ignoreInitial: true
        });
        
        watcher.on('all', (event, filePath) => {
          if (ws.readyState === 1) {
            ws.send(JSON.stringify({ type: 'file_change', event, path: filePath }));
          }
        });
        
        ws.on('close', () => watcher.close());
      }
    } catch (err) {
      console.error('[WS] Error:', err.message);
    }
  });
  
  ws.on('close', () => console.log('[WS] Client disconnected'));
  ws.on('error', (err) => console.error('[WS] Error:', err.message));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.path });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message, err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

import mcpManager from './services/mcpManager.js';
import skillsManager from './services/skillsManager.js';

// Start server
server.listen(PORT, async () => {
  console.log('\n🚀 Antigravity Web Backend');
  console.log(`   Server:    http://localhost:${PORT}`);
  console.log(`   WebSocket: ws://localhost:${PORT}`);
  console.log(`   Frontend:  ${FRONTEND_URL}`);
  console.log(`   Data dir:  ${DATA_DIR}`);
  console.log('\n✅ Ready to receive requests\n');

  // Initialize MCP Manager & load Skills
  await mcpManager.init();
  await skillsManager.loadSkills();
});

// Shutdown hooks to clean up MCP sub-processes
const handleShutdown = async () => {
  console.log('\n[SERVER] Shutdown signal received.');
  await mcpManager.shutdown();
  process.exit(0);
};

process.on('SIGTERM', handleShutdown);
process.on('SIGINT', handleShutdown);

export default app;
