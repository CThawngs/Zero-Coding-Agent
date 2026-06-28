// ============================================================
// API Client for Antigravity Backend (port 3747)
// ============================================================

let BASE_URL = '/api';

if (typeof window !== 'undefined') {
  const isCloud = window.location.hostname !== 'localhost' && 
                  window.location.hostname !== '127.0.0.1' && 
                  window.location.hostname !== '[::1]';
                  
  const savedMode = localStorage.getItem('antigravity_conn_mode');
  const connMode = savedMode || (isCloud ? 'cloud' : 'local');
  
  if (connMode === 'local') {
    BASE_URL = 'http://localhost:3747/api';
  } else {
    BASE_URL = '/api';
  }
}

class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body)
  }

  try {
    const response = await fetch(url, config)

    if (!response.ok) {
      let errorData
      try { errorData = await response.json() } catch { errorData = null }
      throw new ApiError(
        errorData?.message || errorData?.error || `HTTP ${response.status}`,
        response.status,
        errorData
      )
    }

    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      return response.json()
    }
    return response.text()
  } catch (err) {
    if (err instanceof ApiError) throw err
    throw new ApiError(err.message || 'Network error', 0, null)
  }
}

// ============================================================
// API Methods
// ============================================================
export const api = {
  getConnectionMode: () => {
    if (typeof window === 'undefined') return 'local';
    const isCloud = window.location.hostname !== 'localhost' && 
                    window.location.hostname !== '127.0.0.1' && 
                    window.location.hostname !== '[::1]';
    return localStorage.getItem('antigravity_conn_mode') || (isCloud ? 'cloud' : 'local');
  },
  setConnectionMode: (mode) => {
    localStorage.setItem('antigravity_conn_mode', mode);
    window.location.reload();
  },

  // --- Conversations ---
  getConversations: () => request('/conversations'),
  getConversation: (id) => request(`/conversations/${id}`),
  createConversation: (data) => request('/conversations', { method: 'POST', body: data }),
  updateConversation: (id, data) => request(`/conversations/${id}`, { method: 'PUT', body: data }),
  deleteConversation: (id) => request(`/conversations/${id}`, { method: 'DELETE' }),

  // --- Messages ---
  sendMessage: (convId, data) => request(`/conversations/${convId}/messages`, { method: 'POST', body: data }),

  // --- Providers ---
  getProviders: () => request('/providers'),
  verifyProvider: (provider, apiKey) =>
    request(`/providers/${provider}/test`, { method: 'POST', body: { apiKey } }),
  validateModel: (provider, modelId, apiKey) =>
    request(`/providers/${provider}/validate-model`, { method: 'POST', body: { modelId, apiKey } }),
  getModels: (provider) => request(`/providers/${provider}/models`),
  saveApiKey: (provider, apiKey) =>
    request('/config/apikey', { method: 'POST', body: { provider, key: apiKey } }),

  // --- Local Providers ---
  connectOllama: (baseUrl) =>
    request('/providers/ollama/connect', { method: 'POST', body: { baseUrl } }),
  connectLMStudio: (baseUrl) =>
    request('/providers/lmstudio/connect', { method: 'POST', body: { baseUrl } }),

  // --- File System ---
  getFileTree: (workspacePath) =>
    request(`/files/tree?path=${encodeURIComponent(workspacePath)}`),
  readFile: (filePath) =>
    request(`/files/read?path=${encodeURIComponent(filePath)}`),
  writeFile: (filePath, content) =>
    request('/files/write', { method: 'POST', body: { path: filePath, content } }),
  createFile: (filePath, content = '') =>
    request('/files/create', { method: 'POST', body: { path: filePath, content } }),
  deleteFile: (filePath) =>
    request(`/files/delete?path=${encodeURIComponent(filePath)}`, { method: 'DELETE' }),
  createDirectory: (dirPath) =>
    request('/files/mkdir', { method: 'POST', body: { path: dirPath } }),
  searchFiles: (rootPath, pattern) =>
    request(`/files/search?root=${encodeURIComponent(rootPath)}&pattern=${encodeURIComponent(pattern)}`),
  rename: (oldPath, newPath) =>
    request('/files/rename', { method: 'POST', body: { oldPath, newPath } }),
  // Pagination APIs
  getConversationsPage: (workspace, page, limit) =>
    request(`/conversations?workspace=${encodeURIComponent(workspace || '')}&page=${page}&limit=${limit}`),
  getConversationPage: (id, page, limit) =>
    request(`/conversations/${id}?page=${page}&limit=${limit}`),
  getConversationMessagesPage: (id, page, limit) =>
    request(`/conversations/${id}/messages?page=${page}&limit=${limit}`),
  listDirectory: (dirPath) =>
    request(`/files/list?path=${encodeURIComponent(dirPath)}`),
  getDrives: () =>
    request('/files/drives'),
  selectDirectory: async () => {
    // In local connection mode, always use the backend's server-side picker to get the real absolute path
    if (api.getConnectionMode() === 'local') {
      return request('/files/select-directory', { method: 'POST' })
    }

    // Try browser-native File System Access API first (only in cloud/remote mode)
    if (typeof window !== 'undefined' && 'showDirectoryPicker' in window) {
      try {
        const handle = await window.showDirectoryPicker({ mode: 'readwrite' })
        // Store handle for future OPFS/file operations in browser
        window.__workspaceHandle = handle
        // Get the full path via the backend if available (local mode), otherwise use name
        try {
          const dirPath = await request('/files/resolve-directory', {
            method: 'POST',
            body: { name: handle.name }
          })
          if (dirPath && dirPath.path) {
            return { success: true, path: dirPath.path }
          }
        } catch {
          // Fallback: just use the directory name as workspace name
        }
        return { success: true, path: `./workspace/${handle.name}` }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('showDirectoryPicker failed:', err)
        }
        return { success: false, message: 'Selection cancelled' }
      }
    }
    // Fallback: server-side directory picker
    return request('/files/select-directory', { method: 'POST' })
  },
  getDefaultWorkspace: () =>
    request('/files/default-workspace'),
  downloadWorkspace: (workspacePath) => {
    return `${BASE_URL}/files/download?path=${encodeURIComponent(workspacePath)}`;
  },
  // --- Folder Browser (in-app, for Cloud Run / Linux) ---
  browseDirs: (dirPath) => {
    const q = dirPath ? `?path=${encodeURIComponent(dirPath)}` : '';
    return request(`/files/browse-dirs${q}`);
  },

  // --- Terminal Approval ---
  approveCommand: (commandId) =>
    request('/approve-command', { method: 'POST', body: { commandId } }),
  rejectCommand: (commandId) =>
    request('/terminal/reject', { method: 'POST', body: { commandId } }),

  // --- Stream Control ---
  stopStream: (conversationId) =>
    request('/stream/stop', { method: 'POST', body: { conversationId } }),

  // --- Config ---
  getConfig: () => request('/config'),

  // --- GitHub ---
  verifyGitHub: (token) => request('/github/verify', { method: 'POST', body: { token } }),
  readRepo: (url, token) => request(`/github/repo?url=${encodeURIComponent(url)}&token=${token || ''}`),

  // --- URL Fetching ---
  fetchUrl: (url) => request('/url/fetch', { method: 'POST', body: { url } }),

  // --- MCP (Model Context Protocol) ---
  getMcpServers: () => request('/mcp/servers'),
  addMcpServer: (data) => request('/mcp/servers', { method: 'POST', body: data }),
  deleteMcpServer: (id) => request(`/mcp/servers/${id}`, { method: 'DELETE' }),
  callMcpTool: (data) => request('/mcp/call', { method: 'POST', body: data }),
}

// ============================================================
// SSE Stream Handler - matches backend POST /api/stream
// ============================================================
export function streamChat(
  { conversationId, content, attachments, provider, model, contextWindow, messages, customApiKey, customBaseURL, permissionMode },
  onChunk,
  onToolCall,
  onDone,
  onError,
  onActivity,
  onAskUser,
) {
  const url = `${BASE_URL}/stream`
  
  const msgArray = messages || [{ role: 'user', content }]
  
  const body = JSON.stringify({
    messages: msgArray,
    provider: provider || 'google',
    model,
    contextWindow: contextWindow || 128000,
    conversationId,
    attachments: attachments || [],
    saveConversation: true,
    customApiKey,
    customBaseURL,
    permissionMode: permissionMode || 'balanced',
  })

  // Use provided signal or create a local one
  const abortController = new AbortController();
  const fetchSignal = signal || abortController.signal;

  let fullContent = ''
  let toolCalls = []

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    signal: fetchSignal,
  })
  .then(async (response) => {
    if (!response.ok) {
      const errText = await response.text()
      throw new ApiError(`HTTP ${response.status}: ${errText}`, response.status)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    return readLoop(reader, decoder, buffer, fullContent, toolCalls, onChunk, onToolCall, onDone, onError, onActivity, onAskUser, fetchSignal)
  })
  .catch(err => {
    if (err.name === 'AbortError') {
      // Stream was intentionally aborted (user clicked stop)
      onDone(fullContent, toolCalls)
    } else {
      console.error('Stream error:', err)
      onError(err)
    }
  })

  // Return the abort function so consumer can cancel
  return () => abortController.abort()
}

async function readLoop(reader, decoder, buffer, fullContent, toolCalls, onChunk, onToolCall, onDone, onError, onActivity, onAskUser, signal) {
  try {
    while (true) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.trim() || !line.startsWith('data: ')) continue
        const data = line.slice(6).trim()

        if (data === '[DONE]') {
          onDone(fullContent, toolCalls)
          return
        }

        try {
          const parsed = JSON.parse(data)

          switch (parsed.type) {
            case 'delta':
              if (parsed.content) {
                fullContent += parsed.content
                onChunk(parsed.content)
              }
              break

            case 'activity':
              if (onActivity && parsed.message) {
                onActivity(parsed.message, parsed.iteration || 0)
              }
              break

            case 'ask_user':
              if (onAskUser && parsed.question) {
                onAskUser(parsed.question, parsed.options || [], parsed.allowCustom !== false)
              }
              break

            case 'tool_call':
              toolCalls.push(parsed)
              onToolCall({ ...parsed, requiresApproval: false })
              break

            case 'tool_result':
              break

            case 'approval_required':
              onToolCall({
                id: parsed.commandId || parsed.id,
                tool: parsed.tool || 'run_terminal_command',
                command: parsed.command || parsed.params?.command,
                cwd: parsed.cwd || parsed.params?.cwd,
                params: parsed.params,
                requiresApproval: true,
              })
              break

            case 'agent_paused':
              // Agent is paused waiting for approval
              onDone(fullContent, toolCalls)
              return

            case 'done':
              onDone(parsed.content || fullContent, parsed.toolCalls || toolCalls)
              return

            case 'error':
              throw new Error(parsed.message || 'Stream error')

            default:
              if (parsed.content) {
                fullContent += parsed.content
                onChunk(parsed.content)
              }
          }
        } catch (parseErr) {
          if (data && data !== '[DONE]' && !data.startsWith('{')) {
            fullContent += data
            onChunk(data)
          }
        }
      }
    }
    // Stream ended without done event
    onDone(fullContent, toolCalls)
  } catch (err) {
    if (err.name === 'AbortError') {
      onDone(fullContent, toolCalls)
    } else {
      console.error('Stream error:', err)
      onError(err)
    }
  }
}

export default api
