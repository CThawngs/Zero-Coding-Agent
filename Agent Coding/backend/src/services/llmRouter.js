import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import mcpManager from './mcpManager.js';
import skillsManager from './skillsManager.js';

dotenv.config();

// ============================================================
// AGENT SYSTEM PROMPT
// ============================================================
export const AGENT_SYSTEM_PROMPT = `You are Zero Coding Agent, an elite AI Coding Agent that works like a senior software engineer. You have full access to the user's filesystem and can read, write, create, and delete files.

## CRITICAL: You MUST Use Tools
You are an AGENT, not a chatbot. When the user asks you to do something (create files, read files, run commands, etc.), you MUST use the tools below. Do NOT just describe what you would do — actually DO it.

## Available Tools
Write tool calls using this EXACT format (triple backticks + tool_call):

\`\`\`tool_call
{"tool": "TOOL_NAME", "params": {"key": "value"}}
\`\`\`

Available tools:
- **read_file** — Read file contents. Params: { "path": "string" }
- **write_file** — Write/overwrite a file. Params: { "path": "string", "content": "string" }
- **create_file** — Create a new file. Params: { "path": "string", "content": "string" }
- **delete_file** — Delete a file. Params: { "path": "string" }
- **list_directory** — List directory contents. Params: { "path": "string" }
- **create_directory** — Create a directory. Params: { "path": "string" }
- **search_files** — Search files by pattern. Params: { "pattern": "string", "path": "string" }
- **run_terminal_command** — Run a terminal command. Params: { "command": "string" }
- **ask_user** — Ask the user a question. Params: { "question": "string", "options": ["A) ...", "B) ..."], "allowCustom": true }
- **fetch_url** — Fetch URL content. Params: { "url": "string" }

## MANDATORY Workflow
1. **PLAN**: Briefly explain what you'll do
2. **EXECUTE**: Use tool calls to do it (NEVER skip this step!)
3. **VERIFY**: Check the result
4. **REPORT**: Tell the user what was done

## Rules
- ALWAYS use tools when the user asks you to do something
- NEVER just show code — WRITE it to files using create_file or write_file
- After creating files, verify them with read_file
- If you need user input, use ask_user
- Keep working until the task is FULLY complete
- Respond in the user's language (Vietnamese if they speak Vietnamese)

## Example — User says "Create test.py":
1. First respond: "Tôi sẽ tạo file test.py cho bạn..."
2. Then call: \`\`\`tool_call
{"tool": "create_file", "params": {"path": "test.py", "content": "print('Hello World')"}}
\`\`\`
3. Then call: \`\`\`tool_call
{"tool": "read_file", "params": {"path": "test.py"}}
\`\`\`
4. Then respond: "Đã tạo file test.py thành công!"

REMEMBER: You are an AGENT. You DO things, you don't just talk about them.`;

// ============================================================
// PROVIDER DEFINITIONS
// ============================================================
export const PROVIDERS = {
  google: {
    id: 'google',
    name: 'Google Gemini',
    icon: '🟢',
    color: '#4285F4',
    authType: 'apikey',
    envKey: 'GOOGLE_API_KEY',
    models: [
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', contextWindow: 1048576, isFree: false },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', contextWindow: 1048576, isFree: false },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', contextWindow: 1048576, isFree: true },
      { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite', contextWindow: 1048576, isFree: true },
      { id: 'gemini-2.0-pro-exp', name: 'Gemini 2.0 Pro Exp', contextWindow: 2097152, isFree: true },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', contextWindow: 2097152, isFree: false },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', contextWindow: 1048576, isFree: true },
      { id: 'gemini-1.5-flash-8b', name: 'Gemini 1.5 Flash 8B', contextWindow: 1048576, isFree: true }
    ]
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    icon: '⚫',
    color: '#10a37f',
    authType: 'apikey',
    envKey: 'OPENAI_API_KEY',
    baseURL: 'https://api.openai.com/v1',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', contextWindow: 128000, isFree: false },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', contextWindow: 128000, isFree: false },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', contextWindow: 128000, isFree: false },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', contextWindow: 16385, isFree: false },
      { id: 'o1', name: 'o1', contextWindow: 200000, isFree: false },
      { id: 'o1-mini', name: 'o1 Mini', contextWindow: 128000, isFree: false },
      { id: 'o3-mini', name: 'o3 Mini', contextWindow: 200000, isFree: false },
      { id: 'o4-mini', name: 'o4 Mini', contextWindow: 200000, isFree: false }
    ]
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    icon: '🟤',
    color: '#D97706',
    authType: 'apikey',
    envKey: 'ANTHROPIC_API_KEY',
    models: [
      { id: 'claude-opus-4-5-20251101', name: 'Claude Opus 4.5', contextWindow: 200000, isFree: false },
      { id: 'claude-sonnet-4-5-20251101', name: 'Claude Sonnet 4.5', contextWindow: 200000, isFree: false },
      { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet', contextWindow: 200000, isFree: false },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', contextWindow: 200000, isFree: false },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', contextWindow: 200000, isFree: false },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', contextWindow: 200000, isFree: false }
    ]
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    icon: '🔀',
    color: '#6366f1',
    authType: 'apikey',
    envKey: 'OPENROUTER_API_KEY',
    baseURL: 'https://openrouter.ai/api/v1',
    dynamicModels: true,
    models: []
  },
  ollama: {
    id: 'ollama',
    name: 'Ollama',
    icon: '🦙',
    color: '#059669',
    authType: 'none',
    baseURL: 'http://localhost:11434/v1',
    dynamicModels: true,
    models: []
  },
  lmstudio: {
    id: 'lmstudio',
    name: 'LM Studio',
    icon: '🏠',
    color: '#7c3aed',
    authType: 'none',
    baseURL: 'http://localhost:1234/v1',
    dynamicModels: true,
    models: []
  },
  custom: {
    id: 'custom',
    name: 'Custom Endpoint',
    icon: '🔧',
    color: '#3b82f6',
    authType: 'apikey',
    envKey: 'CUSTOM_API_KEY',
    baseURL: 'http://127.0.0.1:8000/v1',
    dynamicModels: true,
    models: []
  },
  '9router': {
    id: '9router',
    name: '9Router',
    icon: 'https://9router.com/favicon.ico',
    color: '#3b82f6',
    authType: 'apikey',
    envKey: 'NINEROUTER_API_KEY',
    baseURL: 'http://localhost:20128/v1',
    dynamicModels: true,
    models: []
  }
};

// ============================================================
// TOOL CALL PARSER
// ============================================================
export function parseToolCalls(text) {
  const toolCalls = [];
  
  // 1. Parse standard ```tool_call markdown blocks
  const markdownRegex = /```tool_call\s*\n([\s\S]*?)\n```/g;
  let match;
  while ((match = markdownRegex.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      if (parsed.tool && parsed.params !== undefined) {
        toolCalls.push({
          id: `tc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          tool: parsed.tool,
          params: parsed.params,
          raw: match[0]
        });
      }
    } catch (e) {
      console.warn('[LLMRouter] Failed to parse markdown tool call:', match[1]);
    }
  }

  // 2. Parse XML/longcat tags format (e.g. <longcat_tool_call>fetch_url<longcat_arg_key>params</longcat_arg_key> <longcat_arg_value>...</longcat_arg_value></longcat_tool_call>)
  const longcatRegex = /<(?:[a-zA-Z0-9_]+_)?tool_call>([a-zA-Z0-9_]+)<(?:[a-zA-Z0-9_]+_)?arg_key>[a-zA-Z0-9_]+<\/(?:[a-zA-Z0-9_]+_)?arg_key>\s*<(?:[a-zA-Z0-9_]+_)?arg_value>([\s\S]*?)<\/(?:[a-zA-Z0-9_]+_)?arg_value>\s*<\/(?:[a-zA-Z0-9_]+_)?tool_call>/g;
  while ((match = longcatRegex.exec(text)) !== null) {
    try {
      const toolName = match[1].trim();
      const valStr = match[2].trim();
      const params = JSON.parse(valStr);
      toolCalls.push({
        id: `tc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        tool: toolName,
        params: params,
        raw: match[0]
      });
    } catch (e) {
      console.warn('[LLMRouter] Failed to parse longcat tool call:', match[0]);
    }
  }

  // 3. Parse generic <tool_call>JSON</tool_call> XML format
  const genericXmlRegex = /<tool_call>([\s\S]*?)<\/tool_call>/g;
  while ((match = genericXmlRegex.exec(text)) !== null) {
    try {
      if (match[0].includes('arg_value')) continue;
      const parsed = JSON.parse(match[1].trim());
      if (parsed.tool && parsed.params !== undefined) {
        toolCalls.push({
          id: `tc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          tool: parsed.tool,
          params: parsed.params,
          raw: match[0]
        });
      }
    } catch (e) {
      console.warn('[LLMRouter] Failed to parse generic XML tool call:', match[1]);
    }
  }
  
  return toolCalls;
}

// Alias for backward compatibility
export const parseToolCallsFromText = parseToolCalls;


// CONTEXT WINDOW HELPER
// ============================================================
function resolveContextWindow(contextWindow, modelDef) {
  if (!contextWindow || contextWindow === 'auto') {
    return modelDef?.contextWindow || 32000;
  }
  const val = parseInt(contextWindow);
  const min = 8000;
  const max = modelDef?.contextWindow || 200000;
  return Math.max(min, Math.min(val, max));
}

// ============================================================
// STREAMING LLM CALLS
// ============================================================

// --- Google Gemini ---
async function* streamGemini(apiKey, model, messages, contextWindow, signal) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const geminiModel = genAI.getGenerativeModel({ model });
  
  // Convert messages to Gemini format
  const systemMsg = messages.find(m => m.role === 'system');
  const chatHistory = messages
    .filter(m => m.role !== 'system')
    .slice(0, -1)
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));
  
  const lastMsg = messages[messages.length - 1];
  
  const chat = geminiModel.startChat({
    history: chatHistory,
    generationConfig: {
      maxOutputTokens: Math.min(8192, contextWindow || 8192),
    },
    systemInstruction: systemMsg?.content
  });
  
  const result = await chat.sendMessageStream(lastMsg.content);
  
  for await (const chunk of result.stream) {
    if (signal?.aborted) break;
    const text = chunk.text();
    if (text) yield { type: 'delta', content: text };
  }
  
  const finalResult = await result.response;
  yield { type: 'usage', usage: { 
    promptTokens: finalResult.usageMetadata?.promptTokenCount || 0,
    completionTokens: finalResult.usageMetadata?.candidatesTokenCount || 0
  }};
}

// --- OpenAI-compatible (OpenAI, OpenRouter, Ollama, LM Studio) ---
async function* streamOpenAICompat(apiKey, baseURL, model, messages, contextWindow, signal, extraHeaders = {}) {
  const client = new OpenAI({
    apiKey: apiKey || 'no-key',
    baseURL,
    defaultHeaders: extraHeaders
  });
  
  const stream = await client.chat.completions.create({
    model,
    messages,
    stream: true,
    max_tokens: contextWindow ? Math.min(8192, contextWindow) : 8192
  });
  
  for await (const chunk of stream) {
    if (signal?.aborted) break;
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) yield { type: 'delta', content: delta };
    
    if (chunk.usage) {
      yield { type: 'usage', usage: {
        promptTokens: chunk.usage.prompt_tokens || 0,
        completionTokens: chunk.usage.completion_tokens || 0
      }};
    }
  }
}

// --- Anthropic ---
async function* streamAnthropic(apiKey, model, messages, contextWindow, signal) {
  const client = new Anthropic({ apiKey });
  
  const systemMsg = messages.find(m => m.role === 'system');
  const chatMessages = messages.filter(m => m.role !== 'system');
  
  const stream = client.messages.stream({
    model,
    max_tokens: Math.min(8192, contextWindow || 8192),
    system: systemMsg?.content,
    messages: chatMessages.map(m => ({
      role: m.role,
      content: m.content
    }))
  });
  
  for await (const event of stream) {
    if (signal?.aborted) break;
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      yield { type: 'delta', content: event.delta.text };
    }
    if (event.type === 'message_delta') {
      yield { type: 'usage', usage: {
        promptTokens: event.usage?.input_tokens || 0,
        completionTokens: event.usage?.output_tokens || 0
      }};
    }
  }
}

// ============================================================
// MAIN LLM ROUTER
// ============================================================
export async function* streamLLM(options, signal) {
  const {
    provider,
    model,
    messages,
    contextWindow,
    customApiKey,
    customBaseURL
  } = options;
  
  const providerDef = PROVIDERS[provider];
  if (!providerDef) throw new Error(`Unknown provider: ${provider}`);
  
  const modelDef = providerDef.models.find(m => m.id === model);
  const resolvedContext = resolveContextWindow(contextWindow, modelDef);
  
  // Dynamic system prompt construction
  const mcpTools = mcpManager.getAllTools();
  let mcpToolsDescription = '';
  if (mcpTools.length > 0) {
    mcpToolsDescription = '\n\n## Custom MCP Tools (Model Context Protocol)\n' +
      'You can also call these external tools by using the same ```tool_call block format. ' +
      'Format the parameters exactly as described in their schemas:\n' +
      mcpTools.map(t => `- **${t.fullName}** - ${t.description || 'No description'}\n  Params: ${JSON.stringify(t.inputSchema)}`).join('\n');
  }

  // A2A delegate tool
  const a2aDescription = '\n\n## Agent-to-Agent (A2A) Delegation\n' +
    '- **delegate_to_agent** - Delegate a subtask to another agent. Takes parameters: `agentUrl` (the target agent\'s A2A RPC endpoint) and `prompt` (the task details). Format: \n' +
    '```tool_call\n{"tool": "delegate_to_agent", "params": {"agentUrl": "http://localhost:3748/api/a2a", "prompt": "Review this code..."}}\n```';

  // Skill matching (Progressive Disclosure)
  const lastUserMsg = messages.filter(m => m.role === 'user').pop()?.content || '';
  const matchedSkills = skillsManager.matchSkills(lastUserMsg);
  
  // ALWAYS include user preferences (Hermes Memory) if it has been learned
  const userPrefSkill = skillsManager.skills.find(s => s.name === 'user-preferences');
  if (userPrefSkill && !matchedSkills.some(s => s.name === 'user-preferences')) {
    matchedSkills.push(userPrefSkill);
  }

  let skillsDescription = '';
  if (matchedSkills.length > 0) {
    skillsDescription = '\n\n## Procedural Instructions (Matched Skills)\n' +
      matchedSkills.map(s => `### Skill: ${s.name}\n${s.content}`).join('\n\n');
  }

  const dynamicSystemPrompt = AGENT_SYSTEM_PROMPT + mcpToolsDescription + a2aDescription + skillsDescription;

  // Add system prompt if not present
  let messagesWithSystem = [...messages];
  if (messagesWithSystem[0]?.role === 'system') {
    messagesWithSystem[0] = { role: 'system', content: dynamicSystemPrompt };
  } else {
    messagesWithSystem.unshift({ role: 'system', content: dynamicSystemPrompt });
  }
  const isMasked = typeof customApiKey === 'string' && customApiKey.includes('*');
  const apiKey = (customApiKey && !isMasked) ? customApiKey : (process.env[providerDef.envKey] || '');
  
  try {
    switch (provider) {
      case 'google':
        yield* streamGemini(apiKey, model, messagesWithSystem, resolvedContext, signal);
        break;
        
      case 'openai':
        yield* streamOpenAICompat(apiKey, providerDef.baseURL, model, messagesWithSystem, resolvedContext, signal);
        break;
        
      case 'anthropic':
        yield* streamAnthropic(apiKey, model, messagesWithSystem, resolvedContext, signal);
        break;
        
      case 'openrouter':
        yield* streamOpenAICompat(
          apiKey,
          'https://openrouter.ai/api/v1',
          model,
          messagesWithSystem,
          resolvedContext,
          signal,
          {
            'HTTP-Referer': 'https://github.com/CThawngs/Zero-Coding-Agent',
            'X-Title': 'Zero Coding Agent'
          }
        );
        break;
        
      case 'ollama':
        yield* streamOpenAICompat(
          'no-key',
          customBaseURL || 'http://localhost:11434/v1',
          model,
          messagesWithSystem,
          resolvedContext,
          signal
        );
        break;
        
      case 'lmstudio':
        yield* streamOpenAICompat(
          'no-key',
          customBaseURL || 'http://localhost:1234/v1',
          model,
          messagesWithSystem,
          resolvedContext,
          signal
        );
        break;
        
      case 'custom':
        yield* streamOpenAICompat(
          apiKey,
          customBaseURL || 'http://127.0.0.1:8000/v1',
          model,
          messagesWithSystem,
          resolvedContext,
          signal
        );
        break;
        
      case '9router':
        yield* streamOpenAICompat(
          apiKey,
          customBaseURL || 'http://localhost:20128/v1',
          model,
          messagesWithSystem,
          resolvedContext,
          signal
        );
        break;
        
      default:
        throw new Error(`Provider ${provider} not implemented`);
    }
  } catch (err) {
    yield { type: 'error', message: err.message };
  }
}

// streamChat is an alias for streamLLM (used in chat routes)
export { streamLLM as streamChat };

// ============================================================
// FETCH AVAILABLE MODELS
// ============================================================
export async function fetchProviderModels(provider, apiKeyInput, baseURL) {
  const isMasked = typeof apiKeyInput === 'string' && apiKeyInput.includes('*');
  const apiKey = (apiKeyInput && !isMasked) ? apiKeyInput : (process.env[PROVIDERS[provider]?.envKey] || '');

  try {
    switch (provider) {
      case 'google': {
        // Return static list for Google
        return PROVIDERS.google.models;
      }
      case 'openai': {
        const client = new OpenAI({ apiKey });
        const res = await client.models.list();
        return res.data
          .filter(m => m.id.startsWith('gpt') || m.id.startsWith('o'))
          .map(m => ({ id: m.id, name: m.id, contextWindow: 128000, isFree: false }));
      }
      case 'anthropic': {
        return PROVIDERS.anthropic.models;
      }
      case 'openrouter': {
        const res = await fetch('https://openrouter.ai/api/v1/models', {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        const data = await res.json();
        return (data.data || []).map(m => ({
          id: m.id,
          name: m.name || m.id,
          contextWindow: m.context_length || 32000,
          isFree: m.pricing?.prompt === '0' && m.pricing?.completion === '0',
          pricing: m.pricing
        }));
      }
      case 'ollama': {
        const url = baseURL || 'http://localhost:11434';
        const res = await fetch(`${url}/api/tags`);
        const data = await res.json();
        return (data.models || []).map(m => ({
          id: m.name,
          name: m.name,
          contextWindow: 32768,
          isFree: true,
          size: m.size
        }));
      }
      case 'lmstudio': {
        const url = (baseURL || 'http://localhost:1234') + '/v1';
        const client = new OpenAI({ apiKey: 'no-key', baseURL: url });
        const res = await client.models.list();
        return res.data.map(m => ({
          id: m.id,
          name: m.id,
          contextWindow: 32768,
          isFree: true
        }));
      }
      case 'custom': {
        const url = baseURL || 'http://127.0.0.1:8000/v1';
        const client = new OpenAI({ apiKey: apiKey || 'no-key', baseURL: url });
        const res = await client.models.list();
        return res.data.map(m => ({
          id: m.id,
          name: m.id,
          contextWindow: 128000,
          isFree: false
        }));
      }
      case '9router': {
        const url = baseURL || 'http://localhost:20128/v1';
        const client = new OpenAI({ apiKey: apiKey || 'no-key', baseURL: url });
        const res = await client.models.list();
        return res.data.map(m => ({
          id: m.id,
          name: m.id,
          contextWindow: 128000,
          isFree: false
        }));
      }
      default:
        return [];
    }
  } catch (err) {
    console.error(`[LLMRouter] Failed to fetch models for ${provider}:`, err.message);
    return PROVIDERS[provider]?.models || [];
  }
}

// ============================================================
// TEST CONNECTION
// ============================================================
export async function testConnection(provider, apiKeyInput, baseURL) {
  const isMasked = typeof apiKeyInput === 'string' && apiKeyInput.includes('*');
  const apiKey = (apiKeyInput && !isMasked) ? apiKeyInput : (process.env[PROVIDERS[provider]?.envKey] || '');

  try {
    switch (provider) {
      case 'google': {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
        const result = await model.generateContent('Hello');
        return { success: true, message: 'Connected to Google Gemini' };
      }
      case 'openai': {
        const client = new OpenAI({ apiKey });
        await client.models.list();
        return { success: true, message: 'Connected to OpenAI' };
      }
      case 'anthropic': {
        const client = new Anthropic({ apiKey });
        await client.messages.create({
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }]
        });
        return { success: true, message: 'Connected to Anthropic' };
      }
      case 'openrouter': {
        const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        if (!res.ok) throw new Error('Invalid API key');
        return { success: true, message: 'Connected to OpenRouter' };
      }
      case 'ollama': {
        const url = baseURL || 'http://localhost:11434';
        const res = await fetch(`${url}/api/tags`);
        if (!res.ok) throw new Error('Ollama not reachable');
        return { success: true, message: 'Connected to Ollama' };
      }
      case 'lmstudio': {
        const url = (baseURL || 'http://localhost:1234') + '/v1';
        const client = new OpenAI({ apiKey: 'no-key', baseURL: url });
        await client.models.list();
        return { success: true, message: 'Connected to LM Studio' };
      }
      case 'custom': {
        const url = baseURL || 'http://127.0.0.1:8000/v1';
        const client = new OpenAI({ apiKey: apiKey || 'no-key', baseURL: url });
        await client.models.list();
        return { success: true, message: 'Connected to Custom Endpoint' };
      }
      case '9router': {
        const url = baseURL || 'http://localhost:20128/v1';
        const client = new OpenAI({ apiKey: apiKey || 'no-key', baseURL: url });
        await client.models.list();
        return { success: true, message: 'Connected to 9Router' };
      }
      default:
        throw new Error('Unknown provider');
    }
  } catch (err) {
    return { success: false, message: err.message };
  }
}
