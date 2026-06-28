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
import { registerStream, unregisterStream, isStreamActive } from '../services/streamManager.js';

const router = Router();

// ─── Agent Loop Config ──────────────────────────────────────────
const MAX_AGENT_LOOP_ITERATIONS = 25; // Safety limit to prevent infinite loops

// ─── Helper to determine if a tool call requires explicit user confirmation
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
        
        const mcpRouteFile = resolve('./data/mcp/config.json');
        let config = { mcpServers: {} };
        if (existsSync(mcpRouteFile)) {
          const raw = await fs.readFile(mcpRouteFile, 'utf-8');
          config = JSON.parse(raw);
          if (!config.mcpServers) config.mcpServers = {};
        }
        
        const serverConfig = { command, args, transport };
        config.mcpServers[id] = serverConfig;
        
        await fs.mkdir(resolve('./data/mcp'), { recursive: true });
        await fs.writeFile(mcpRouteFile, JSON.stringify(config, null, 2), 'utf-8');
        
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

// ─── Agent Loop: one full user message cycle ────────────────────
async function* runAgentCycle({ provider, model, messages, contextWindow, customApiKey, customBaseURL, permissionMode, conversationId, signal }) {
  // Track iteration for the loop
  let iterationCount = 0;
  let currentMessages = messages;
  let finalResponseText = '';
  const allToolCallResults = [];

  while (iterationCount < MAX_AGENT_LOOP_ITERATIONS) {
    if (signal?.aborted) break;
    iterationCount++;

    // Stream from LLM
    let responseText = '';
    const toolCallResults = [];

    for await (const event of streamLLM({ provider, model, messages: currentMessages, contextWindow, customApiKey, customBaseURL }, signal)) {
      if (signal?.aborted) break;

      switch (event.type) {
        case 'delta':
          responseText += event.content || '';
          finalResponseText += event.content || '';
          yield { type: 'delta', content: event.content || '' };
          break;

        case 'tool_call': {
          const tcId = event.id || uuidv4();
          yield { type: 'tool_call', id: tcId, tool: event.tool, params: event.params };
          const result = await executeToolCall(event, null, permissionMode, conversationId);
          toolCallResults.push({ id: tcId, tool: event.tool, params: event.params, result });
          if (!result.pending) {
            yield { type: 'tool_result', id: tcId, result };
          } else {
            // Pending tool approval → pause loop, wait for user
            yield { type: 'approval_required', commandId: result.commandId, tool: event.tool, params: event.params };
            // Don't continue loop — human needs to approve
            yield { type: 'agent_paused', message: 'Waiting for user approval...' };
            finalResponseText += responseText;
            yield { type: 'done', content: responseText || finalResponseText, toolCalls: [...allToolCallResults, ...toolCallResults], paused: true };
            return;
          }
          break;
        }

        case 'usage':
          yield { type: 'usage', usage: event.usage };
          break;

        case 'error':
          yield { type: 'error', message: event.message };
          break;

        case 'done':
        default:
          break;
      }
    }

    if (signal?.aborted) break;

    // Parse tool calls from text
    const parsedToolCalls = parseToolCallsFromText(responseText);
    
    if (parsedToolCalls.length > 0) {
      for (const tc of parsedToolCalls) {
        if (signal?.aborted) break;
        yield { type: 'tool_call', id: tc.id, tool: tc.tool, params: tc.params };
        const result = await executeToolCall(tc, null, permissionMode, conversationId);
        toolCallResults.push({ id: tc.id, tool: tc.tool, params: tc.params, result });
        if (!result.pending) {
          yield { type: 'tool_result', id: tc.id, result };
        } else {
          yield { type: 'approval_required', commandId: result.commandId, tool: tc.tool, params: tc.params };
          yield { type: 'agent_paused', message: 'Waiting for user approval...' };
          finalResponseText += responseText;
          yield { type: 'done', content: responseText || finalResponseText, toolCalls: [...allToolCallResults, ...toolCallResults], paused: true };
          return;
        }
      }

      // Remove pending results
      const completedResults = toolCallResults.filter(r => !r.result.pending);
      
      if (completedResults.length > 0 && !signal?.aborted) {
        const toolResultContext = completedResults
          .map(r => `Tool: ${r.tool}\nParams: ${JSON.stringify(r.params)}\nResult: ${JSON.stringify(r.result)}`)
          .join('\n\n');

        // Build follow-up messages
        currentMessages = [
          ...currentMessages,
          { role: 'assistant', content: responseText },
          { role: 'tool', content: toolResultContext }
        ];
        
        allToolCallResults.push(...toolCallResults);
        yield { type: 'status', message: `Executed ${completedResults.length} tool(s), continuing analysis...` };
        continue; // Continue the agent loop
      }
    }

    // No more tool calls — done
    allToolCallResults.push(...toolCallResults);
    finalResponseText += responseText;
    yield { type: 'done', content: responseText || finalResponseText, toolCalls: allToolCallResults, iterations: iterationCount };
    return;
  }

  // Max iterations hit
  if (!signal?.aborted) {
    yield { type: 'done', content: finalResponseText, toolCalls: allToolCallResults, iterations: iterationCount, maxReached: true };
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
  const abortController = new AbortController();
  const signal = abortController.signal;
  
  req.on('close', () => { 
    clientDisconnected = true;
    abortController.abort();
  });

  // Register this stream for stop endpoint
  if (conversationId) {
    registerStream(conversationId, abortController);
  }

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

    const providerApiKey = req.body.customApiKey;
    const providerBaseURL = req.body.customBaseURL;

    // Run the continuous agent loop — accumulate response for saving
    let fullResponse = '';
    let allToolCalls = [];
    for await (const event of runAgentCycle({
      provider,
      model,
      messages: fullMessages,
      contextWindow,
      customApiKey: providerApiKey,
      customBaseURL: providerBaseURL,
      permissionMode,
      conversationId,
      signal
    })) {
      if (clientDisconnected || signal.aborted) break;
      sseSend(res, event);

      // Accumulate text content and tool calls for saving
      if (event.type === 'chunk' && event.content) {
        fullResponse += event.content;
      }
      if (event.type === 'tool_call') {
        allToolCalls.push(event);
      }

      // If agent paused (waiting for approval) or aborted, stop sending
      if (event.type === 'agent_paused' || event.type === 'done') {
        break;
      }
    }

    // Save conversation: user msg + assistant msg
    if (saveConversation && !clientDisconnected && conversationId) {
      try {
        const convId = conversationId || uuidv4();
        const lastUserMsg = messages[messages.length - 1];

        // Save user message
        await addMessage(convId, { role: 'user', content: lastUserMsg?.content || '' });

        // Save assistant (AI) message if any content was generated
        if (fullResponse && fullResponse.trim()) {
          await addMessage(convId, { role: 'assistant', content: fullResponse, toolCalls: allToolCalls || [] });
        }

        sseSend(res, { type: 'conversation_saved', conversationId: convId });
      } catch (saveErr) {
        console.error('[stream] Save error:', saveErr.message);
      }
    }

    sseEnd(res);

  } catch (err) {
    console.error('[stream] Fatal error:', err);
    sseSend(res, { type: 'error', message: err.message });
    sseEnd(res);
  } finally {
    if (conversationId) {
      unregisterStream(conversationId);
    }
  }
});

// ─── POST /api/stream/approve — Resume agent after approval ─────────────────
router.post('/stream/approve', async (req, res) => {
  // This endpoint receives approved tool result and continues the agent loop
  // Frontend calls this after user approves a tool
  sseSetup(res);
  
  const {
    conversationId,
    commandId,
    toolCall,
    result,
    provider,
    model,
    messages,
    contextWindow = 128000,
    permissionMode = 'balanced',
  } = req.body;

  if (!conversationId || !messages || !messages.length) {
    sseSend(res, { type: 'error', message: 'Missing required fields' });
    return sseEnd(res);
  }

  const abortController = new AbortController();
  const signal = abortController.signal;
  
  req.on('close', () => abortController.abort());
  registerStream(conversationId, abortController);

  try {
    // Add the approved tool result to messages
    const resultContext = `Tool: ${toolCall.tool}\nParams: ${JSON.stringify(toolCall.params)}\nResult: ${JSON.stringify(result)}`;
    const continuedMessages = [
      ...messages,
      { role: 'tool', content: resultContext }
    ];

    for await (const event of runAgentCycle({
      provider,
      model,
      messages: continuedMessages,
      contextWindow,
      permissionMode,
      conversationId,
      signal
    })) {
      if (signal.aborted) break;
      sseSend(res, event);
      if (event.type === 'agent_paused' || event.type === 'done') break;
    }

    sseEnd(res);
  } catch (err) {
    sseSend(res, { type: 'error', message: err.message });
    sseEnd(res);
  } finally {
    unregisterStream(conversationId);
  }
});

// ─── POST /api/stream/stop — Stop agent execution ───────────────────────────
router.post('/stream/stop', async (req, res) => {
  const { conversationId } = req.body;
  
  if (!conversationId) {
    return res.status(400).json({ error: 'conversationId required' });
  }

  const stopped = isStreamActive(conversationId);
  if (stopped) {
    // The abort will trigger automatically — just report status
    return res.json({ stopped: true, conversationId });
  }
  
  res.json({ stopped: false, conversationId, message: 'No active stream for this conversation' });
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

  const pendingTool = getPendingTool(commandId);
  if (pendingTool) {
    approvePendingTool(commandId);
    try {
      const result = await executeToolCall(pendingTool.toolCall, null, 'autonomous', pendingTool.conversationId);
      return res.json({ approved: true, commandId, result });
    } catch (err) {
      return res.status(500).json({ error: err.message, commandId });
    }
  }

  const cmd = approvePendingCommand(commandId);
  if (!cmd) return res.status(404).json({ error: 'Command not found or already processed' });

  try {
    const result = await executeCommand(cmd.command, { cwd: cmd.cwd });
    res.json({ approved: true, commandId, result });
  } catch (err) {
    res.status(500).json({ error: err.message, commandId });
  }
});

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
