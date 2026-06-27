import { Router } from 'express';
import { promises as fs, existsSync } from 'fs';
import { resolve } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { streamLLM, parseToolCallsFromText, AGENT_SYSTEM_PROMPT } from '../services/llmRouter.js';
import {
  readFile,
  writeFile,
  createFile,
  deleteFile,
  listDirectory,
  createDirectory,
  searchFiles,
} from '../services/fileSystem.js';
import { readRepo } from '../services/githubReader.js';
import { fetchUrl } from '../services/urlFetcher.js';
import mcpManager from '../services/mcpManager.js';
import {
  addPendingCommand,
  approvePendingCommand,
  executeCommand,
  getPendingCommand,
} from '../services/terminalService.js';
import {
  addPendingTool,
  getPendingTool,
  approvePendingTool,
  rejectPendingTool,
} from '../services/pendingToolService.js';
import {
  createConversation,
  getConversation,
  updateConversation,
  deleteConversation,
  listConversations,
  addMessage,
} from '../services/conversationStore.js';
import { checkAndLearnFromPraise } from '../services/memoryManager.js';

const router = Router();

// Helper to determine if a tool call requires explicit user confirmation
function requiresUserApproval(tool, params, permissionMode) {
  if (permissionMode === 'autonomous') return false;
  
  // Safe read-only tools
  const safeTools = ['read_file', 'list_directory', 'search_files', 'fetch_url', 'read_github_repo'];
  if (safeTools.includes(tool)) return false;
  
  // Strict mode: all non-read tools require user confirmation
  if (permissionMode === 'strict') return true;
  
  // Balanced mode: only terminal commands require user confirmation
  if (permissionMode === 'balanced' && tool === 'run_terminal_command') return true;
  
  return false;
}


// ─── SSE Helpers ──────────────────────────────────────────────────────────────
function sseSetup(res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();
}

function sseSend(res, data) {
  if (res.writableEnded) return;
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function sseEnd(res) {
  if (!res.writableEnded) res.end();
}

// ─── Process Attachments ──────────────────────────────────────────────────────
async function processAttachments(attachments = []) {
  const results = [];
  for (const att of attachments) {
    try {
      if (att.type === 'file' && att.path) {
        const result = await readFile(att.path);
        results.push({ type: 'file', path: att.path, content: result.content, isBinary: result.isBinary });
      } else if (att.type === 'url' && att.url) {
        const result = await fetchUrl(att.url);
        results.push({ type: 'url', url: att.url, title: result.title, content: result.content });
      } else if (att.type === 'github' && att.url) {
        const result = await readRepo(att.url, att.token);
        const summary = result.files.slice(0, 20)
          .map((f) => `### ${f.path}\n\`\`\`\n${(f.content || '').slice(0, 2000)}\n\`\`\``)
          .join('\n\n');
        results.push({
          type: 'github',
          url: att.url,
          repo: `${result.owner}/${result.repo}`,
          content: `Repository: ${result.owner}/${result.repo}\nLanguage: ${result.language}\nDescription: ${result.description}\n\nFiles:\n${summary}`,
        });
      }
    } catch (err) {
      results.push({ type: att.type, error: err.message });
    }
  }
  return results;
}

// ─── Build Attachment Context ─────────────────────────────────────────────────
function buildAttachmentContext(processed) {
  if (!processed.length) return '';
  let ctx = '\n\n---\n**Attached Context:**\n';
  for (const att of processed) {
    if (att.error) ctx += `\n[Error loading ${att.type}: ${att.error}]\n`;
    else if (att.type === 'file') ctx += `\n**File: ${att.path}**\n\`\`\`\n${att.content || '[binary file]'}\n\`\`\`\n`;
    else if (att.type === 'url') ctx += `\n**URL: ${att.url}**\n${att.title ? `Title: ${att.title}\n` : ''}${att.content}\n`;
    else if (att.type === 'github') ctx += `\n**GitHub Repo: ${att.repo}**\n${att.content}\n`;
  }
  return ctx;
}

// ─── Execute Tool Call ────────────────────────────────────────────────────────
async function executeToolCall(toolCall, res, permissionMode = 'balanced', conversationId = null) {
  const { tool, params } = toolCall;

  try {
    // 1. Handle MCP dynamic tool calls
    const activeTools = mcpManager.getAllTools();
    const matchedTool = activeTools.find(t => t.fullName === tool);
    if (matchedTool) {
      if (requiresUserApproval(tool, params, permissionMode)) {
        const pendingId = addPendingTool(toolCall, conversationId);
        if (res) {
          sseSend(res, {
            type: 'approval_required',
            commandId: pendingId,
            tool,
            params,
          });
        }
        return { success: true, pending: true, commandId: pendingId, message: `MCP tool queued for approval: ${tool}` };
      }
      const result = await mcpManager.callTool(matchedTool.serverId, matchedTool.name, params);
      return { success: true, ...result };
    }

    // 2. Core tools approval check
    if (requiresUserApproval(tool, params, permissionMode)) {
      const pendingId = addPendingTool(toolCall, conversationId);
      if (res) {
        sseSend(res, {
          type: 'approval_required',
          commandId: pendingId,
          tool,
          params,
        });
      }
      return { success: true, pending: true, commandId: pendingId, message: `Tool queued for approval: ${tool}` };
    }

    switch (tool) {
      case 'read_file': {
        const result = await readFile(params.path);
        return { success: true, ...result };
      }
      case 'write_file': {
        const result = await writeFile(params.path, params.content);
        return { success: true, ...result, message: `Wrote ${result.size} bytes to ${params.path}` };
      }
      case 'create_file': {
        const result = await createFile(params.path, params.content || '');
        return { success: true, ...result };
      }
      case 'delete_file': {
        const result = await deleteFile(params.path);
        return { success: true, ...result };
      }
      case 'list_directory': {
        const result = await listDirectory(params.path);
        return { success: true, ...result };
      }
      case 'create_directory': {
        const result = await createDirectory(params.path);
        return { success: true, ...result };
      }
      case 'search_files': {
        const result = await searchFiles(params.root, params.pattern);
        return { success: true, ...result };
      }
      case 'fetch_url': {
        const result = await fetchUrl(params.url);
        return { success: true, ...result };
      }
      case 'read_github_repo': {
        const result = await readRepo(params.url, params.token);
        return { success: true, ...result };
      }
      case 'run_terminal_command': {
        const result = await executeCommand(params.command, { cwd: params.cwd });
        return { success: true, ...result };
      }
      case 'connect_mcp_server': {
        const { id, command, args = [], transport = 'stdio' } = params;
        if (!id || !command) {
          throw new Error('id and command are required');
        }
        
        // 1. Read existing config.json
        const mcpRouteFile = resolve('./data/mcp/config.json');
        let config = { mcpServers: {} };
        if (existsSync(mcpRouteFile)) {
          const raw = await fs.readFile(mcpRouteFile, 'utf-8');
          config = JSON.parse(raw);
          if (!config.mcpServers) config.mcpServers = {};
        }
        
        // 2. Add to config
        const serverConfig = { command, args, transport };
        config.mcpServers[id] = serverConfig;
        
        // 3. Write back config
        await fs.mkdir(resolve('./data/mcp'), { recursive: true });
        await fs.writeFile(mcpRouteFile, JSON.stringify(config, null, 2), 'utf-8');
        
        // 4. Start the server in mcpManager
        await mcpManager.startServer(id, serverConfig);
        
        return { 
          success: true, 
          message: `Successfully connected MCP server "${id}". Current status: ${mcpManager.getServersStatus()[id]?.status || 'unknown'}` 
        };
      }
      case 'delegate_to_agent': {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(params.agentUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'task.create',
            params: { prompt: params.prompt }
          })
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
        
        const taskId = data.result.taskId;
        
        // Poll status up to 5 seconds for synchronous response
        let status = 'running';
        let taskResult = null;
        for (let i = 0; i < 5; i++) {
          await new Promise(r => setTimeout(r, 1000));
          const statusRes = await fetch(params.agentUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: i + 2,
              method: 'task.status',
              params: { taskId }
            })
          });
          const statusData = await statusRes.json();
          status = statusData.result.status;
          if (status === 'completed') {
            taskResult = statusData.result.result;
            break;
          }
          if (status === 'failed') {
            throw new Error(statusData.result.error || 'Delegated task failed');
          }
        }
        
        return {
          success: true,
          taskId,
          status,
          result: taskResult || 'Task is still running in the background.'
        };
      }
      default:
        return { success: false, error: `Unknown tool: ${tool}` };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ─── POST /api/stream — Main SSE Streaming Endpoint ──────────────────────────
router.post('/stream', async (req, res) => {
  sseSetup(res);

  const {
    messages = [],
    provider = 'google',
    model,
    contextWindow = 128000,
    conversationId,
    attachments = [],
    saveConversation = true,
    permissionMode = 'balanced',
  } = req.body;

  if (!messages.length) {
    sseSend(res, { type: 'error', message: 'No messages provided' });
    return sseEnd(res);
  }

  let clientDisconnected = false;
  req.on('close', () => { clientDisconnected = true; });

  try {
    // Process attachments
    let processedAttachments = [];
    if (attachments.length) {
      sseSend(res, { type: 'status', message: 'Processing attachments...' });
      processedAttachments = await processAttachments(attachments);
    }

    // Enrich last user message with attachment context
    const enrichedMessages = [...messages];
    if (processedAttachments.length) {
      const last = enrichedMessages[enrichedMessages.length - 1];
      if (last.role === 'user') {
        const attContext = buildAttachmentContext(processedAttachments);
        enrichedMessages[enrichedMessages.length - 1] = {
          ...last,
          content: (typeof last.content === 'string' ? last.content : '') + attContext,
        };
      }
    }

    // System prompt injection
    const hasSystem = enrichedMessages.some((m) => m.role === 'system');
    const fullMessages = hasSystem ? enrichedMessages : [
      { role: 'system', content: AGENT_SYSTEM_PROMPT },
      ...enrichedMessages,
    ];

    // Stream from LLM using async generator
    let fullResponseText = '';
    const toolCallResults = [];
    const providerKey = req.body.customApiKey;
    const providerBaseURL = req.body.customBaseURL;

    for await (const event of streamLLM({ provider, model, messages: fullMessages, contextWindow, customApiKey: providerKey, customBaseURL: providerBaseURL })) {
      if (clientDisconnected) break;

      switch (event.type) {
        case 'delta':
          fullResponseText += event.content || '';
          sseSend(res, { type: 'delta', content: event.content || '' });
          break;

        case 'tool_call': {
          const tcId = event.id || uuidv4();
          sseSend(res, { type: 'tool_call', id: tcId, tool: event.tool, params: event.params });
          const result = await executeToolCall(event, res, permissionMode, conversationId);
          toolCallResults.push({ id: tcId, tool: event.tool, params: event.params, result });
          if (!result.pending) {
            sseSend(res, { type: 'tool_result', id: tcId, result });
          }
          break;
        }

        case 'usage':
          sseSend(res, { type: 'usage', usage: event.usage });
          break;

        case 'error':
          sseSend(res, { type: 'error', message: event.message });
          break;

        case 'done':
        default:
          break;
      }
    }

    // Parse tool calls from text if any exist in response
    const parsedToolCalls = parseToolCallsFromText(fullResponseText);
    if (parsedToolCalls.length > 0) {
      for (const tc of parsedToolCalls) {
        if (clientDisconnected) break;
        sseSend(res, { type: 'tool_call', id: tc.id, tool: tc.tool, params: tc.params });
        const result = await executeToolCall(tc, res, permissionMode, conversationId);
        toolCallResults.push({ id: tc.id, tool: tc.tool, params: tc.params, result });
        if (!result.pending) {
          sseSend(res, { type: 'tool_result', id: tc.id, result });
          // Follow-up if needed
        }
      }

      // Second pass with tool results
      if (toolCallResults.filter(r => !r.result.pending).length > 0 && !clientDisconnected) {
        const toolResultContext = toolCallResults
          .filter(r => !r.result.pending)
          .map(r => `Tool: ${r.tool}\nParams: ${JSON.stringify(r.params)}\nResult: ${JSON.stringify(r.result)}`)
          .join('\n\n');

        if (toolResultContext) {
          const followUpMessages = [
            ...fullMessages,
            { role: 'assistant', content: fullResponseText },
            { role: 'user', content: `Tool execution results:\n\n${toolResultContext}\n\nPlease continue based on these results.` },
          ];

          sseSend(res, { type: 'status', message: 'Processing tool results...' });

          for await (const event of streamLLM({ provider, model, messages: followUpMessages, contextWindow })) {
            if (clientDisconnected) break;
            if (event.type === 'delta') {
              fullResponseText += event.content || '';
              sseSend(res, { type: 'delta', content: event.content || '' });
            }
          }
        }
      }
    }

    // Save conversation
    if (saveConversation && !clientDisconnected) {
      try {
        const convId = conversationId || uuidv4();
        const lastUserMsg = messages[messages.length - 1];

        await addMessage(convId, { role: 'user', content: lastUserMsg?.content || '' });
        await addMessage(convId, {
          role: 'assistant',
          content: fullResponseText,
          model,
          toolCalls: toolCallResults,
        });

        sseSend(res, { type: 'conversation_saved', conversationId: convId });

        // Trigger Hermes self-reflection learning
        if (lastUserMsg?.content) {
          checkAndLearnFromPraise(lastUserMsg.content, [
            ...messages,
            { role: 'assistant', content: fullResponseText }
          ]).catch(err => console.error('[Hermes Memory] trigger error:', err));
        }
      } catch (saveErr) {
        console.error('[stream] Save error:', saveErr.message);
      }
    }

    sseSend(res, { type: 'done', toolCalls: toolCallResults });
    sseEnd(res);

  } catch (err) {
    console.error('[stream] Fatal error:', err);
    sseSend(res, { type: 'error', message: err.message });
    sseEnd(res);
  }
});

// ─── POST /api/chat — Non-streaming ──────────────────────────────────────────
router.post('/', async (req, res) => {
  const { messages = [], provider = 'google', model, contextWindow = 128000 } = req.body;

  if (!messages.length) {
    return res.status(400).json({ error: 'No messages provided' });
  }

  try {
    let fullText = '';
    const toolCallResults = [];

    for await (const event of streamLLM({ provider, model, messages, contextWindow })) {
      if (event.type === 'delta') fullText += event.content || '';
      else if (event.type === 'tool_call') {
        const result = await executeToolCall(event, null);
        toolCallResults.push({ tool: event.tool, params: event.params, result });
      }
    }

    res.json({ text: fullText, toolCalls: toolCallResults });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Conversation CRUD ────────────────────────────────────────────────────────
router.get('/conversations', async (req, res) => {
  try {
    const list = await listConversations();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/conversations', async (req, res) => {
  try {
    const conv = await createConversation(req.body);
    res.status(201).json(conv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/conversations/:id', async (req, res) => {
  try {
    const conv = await getConversation(req.params.id);
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });
    res.json(conv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Support both PUT and PATCH for conversation update
router.put('/conversations/:id', async (req, res) => {
  try {
    const updated = await updateConversation(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(err.message.includes('not found') ? 404 : 500).json({ error: err.message });
  }
});

router.patch('/conversations/:id', async (req, res) => {
  try {
    const updated = await updateConversation(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(err.message.includes('not found') ? 404 : 500).json({ error: err.message });
  }
});

router.delete('/conversations/:id', async (req, res) => {
  try {
    await deleteConversation(req.params.id);
    res.json({ deleted: true, id: req.params.id });
  } catch (err) {
    res.status(err.message.includes('not found') ? 404 : 500).json({ error: err.message });
  }
});

router.post('/conversations/:id/messages', async (req, res) => {
  try {
    const updated = await addMessage(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/approve-command', async (req, res) => {
  const { commandId } = req.body;
  if (!commandId) return res.status(400).json({ error: 'commandId required' });

  // 1. Try to resolve using new pendingToolService (for generalized file & command HITL)
  const pendingTool = getPendingTool(commandId);
  if (pendingTool) {
    approvePendingTool(commandId);
    try {
      // Force 'autonomous' permissionMode so that it executes immediately instead of queueing again
      const result = await executeToolCall(pendingTool.toolCall, null, 'autonomous', pendingTool.conversationId);
      return res.json({ approved: true, commandId, result });
    } catch (err) {
      return res.status(500).json({ error: err.message, commandId });
    }
  }

  // 2. Fallback to old pendingCommands registry
  const cmd = approvePendingCommand(commandId);
  if (!cmd) return res.status(404).json({ error: 'Command not found or already processed' });

  try {
    const result = await executeCommand(cmd.command, { cwd: cmd.cwd });
    res.json({ approved: true, commandId, result });
  } catch (err) {
    res.status(500).json({ error: err.message, commandId });
  }
});

// ─── POST /api/reject-command ─────────────────────────────────────────────────
router.post('/reject-command', async (req, res) => {
  const { commandId } = req.body;
  if (!commandId) return res.status(400).json({ error: 'commandId required' });
  
  const pendingTool = getPendingTool(commandId);
  if (pendingTool) {
    rejectPendingTool(commandId);
    return res.json({ rejected: true, commandId });
  }

  const cmd = getPendingCommand(commandId);
  res.json({ rejected: true, commandId });
});

export default router;
