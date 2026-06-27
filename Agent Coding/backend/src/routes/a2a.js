import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { streamLLM } from '../services/llmRouter.js';
import { readFile, writeFile, createFile, deleteFile, listDirectory, createDirectory, searchFiles } from '../services/fileSystem.js';
import { readRepo } from '../services/githubReader.js';
import { fetchUrl } from '../services/urlFetcher.js';
import { executeCommand } from '../services/terminalService.js';

const router = express.Router();

// Simple in-memory tasks registry for A2A
const tasks = {};

// Helper to execute tool calls for A2A background tasks
async function executeA2AToolCall(toolCall) {
  const { tool, params } = toolCall;
  try {
    switch (tool) {
      case 'read_file': return await readFile(params.path);
      case 'write_file': return await writeFile(params.path, params.content);
      case 'create_file': return await createFile(params.path, params.content || '');
      case 'delete_file': return await deleteFile(params.path);
      case 'list_directory': return await listDirectory(params.path);
      case 'create_directory': return await createDirectory(params.path);
      case 'search_files': return await searchFiles(params.root, params.pattern);
      case 'fetch_url': return await fetchUrl(params.url);
      case 'read_github_repo': return await readRepo(params.url, params.token);
      case 'run_terminal_command': 
        // Auto-approve terminal commands in A2A for convenience OR fail them
        return await executeCommand(params.command, { cwd: params.cwd });
      default:
        return { error: `Unknown tool: ${tool}` };
    }
  } catch (err) {
    return { error: err.message };
  }
}

// GET /api/a2a/agent-card - returns the Agent Card
router.get('/agent-card', (req, res) => {
  res.json({
    schemaVersion: '1.0.0',
    name: 'antigravity-web-agent',
    description: 'Elite AI Coding Agent running on localhost with direct filesystem access.',
    endpoints: {
      a2a: `http://localhost:${process.env.PORT || 3747}/api/a2a`
    },
    skills: [
      {
        name: 'file-operations',
        description: 'Read, write, create, list, and delete files on the local workspace.'
      },
      {
        name: 'terminal-execution',
        description: 'Run shell commands and scripts directly in the workspace environment.'
      }
    ]
  });
});

// POST /api/a2a - JSON-RPC 2.0 endpoint for agent collaboration
router.post('/', async (req, res) => {
  const { jsonrpc, method, params, id } = req.body;

  if (jsonrpc !== '2.0') {
    return res.status(400).json({
      jsonrpc: '2.0',
      error: { code: -32600, message: 'Invalid Request: Expected JSON-RPC 2.0' },
      id: id || null
    });
  }

  try {
    switch (method) {
      case 'task.create': {
        const { prompt } = params || {};
        if (!prompt) {
          return res.json({
            jsonrpc: '2.0',
            error: { code: -32602, message: 'Invalid params: prompt is required' },
            id
          });
        }

        const taskId = uuidv4();
        tasks[taskId] = { status: 'running', result: null, error: null };

        // Run the agent loop in the background
        (async () => {
          try {
            console.log(`[A2A] Starting background task ${taskId} for prompt: "${prompt}"`);
            const messages = [{ role: 'user', content: prompt }];
            let textResult = '';
            const toolResults = [];

            // Perform first LLM turn
            for await (const event of streamLLM({
              provider: 'google',
              model: 'gemini-2.0-flash',
              messages
            })) {
              if (event.type === 'delta') {
                textResult += event.content || '';
              } else if (event.type === 'tool_call') {
                const res = await executeA2AToolCall(event);
                toolResults.push({ tool: event.tool, params: event.params, result: res });
              } else if (event.type === 'error') {
                throw new Error(event.message || 'LLM streaming error');
              }
            }

            tasks[taskId].status = 'completed';
            tasks[taskId].result = { text: textResult, toolCalls: toolResults };
            console.log(`[A2A] Task ${taskId} completed successfully.`);
          } catch (err) {
            tasks[taskId].status = 'failed';
            tasks[taskId].error = err.message;
            console.error(`[A2A] Task ${taskId} failed:`, err.message);
          }
        })();

        return res.json({
          jsonrpc: '2.0',
          result: { taskId, status: 'running' },
          id
        });
      }

      case 'task.status': {
        const { taskId } = params || {};
        if (!taskId || !tasks[taskId]) {
          return res.json({
            jsonrpc: '2.0',
            error: { code: -32602, message: `Invalid params: Task ID "${taskId}" not found` },
            id
          });
        }

        const task = tasks[taskId];
        return res.json({
          jsonrpc: '2.0',
          result: {
            taskId,
            status: task.status,
            result: task.result,
            error: task.error
          },
          id
        });
      }

      case 'task.cancel': {
        const { taskId } = params || {};
        if (!taskId || !tasks[taskId]) {
          return res.json({
            jsonrpc: '2.0',
            error: { code: -32602, message: `Invalid params: Task ID "${taskId}" not found` },
            id
          });
        }
        tasks[taskId].status = 'cancelled';
        return res.json({
          jsonrpc: '2.0',
          result: { taskId, status: 'cancelled' },
          id
        });
      }

      default:
        return res.json({
          jsonrpc: '2.0',
          error: { code: -32601, message: `Method not found: ${method}` },
          id
        });
    }
  } catch (err) {
    return res.json({
      jsonrpc: '2.0',
      error: { code: -32603, message: err.message },
      id
    });
  }
});

export default router;
