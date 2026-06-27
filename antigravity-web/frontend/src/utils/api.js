// ============================================================
// API Client for Antigravity Backend (port 3747)
// ============================================================

let BASE_URL = '/api';

if (typeof window !== 'undefined') {
  const isCloud = window.location.hostname !== 'localhost' && 
                  window.location.hostname !== '127.0.0.1' && 
                  window.location.hostname !== '[::1]';
  if (isCloud) {
    // Connect Cloud-hosted UI to user's Local Agent backend running on port 3747
    BASE_URL = 'http://localhost:3747/api';
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
  // --- Conversations ---
  // Backend routes: GET/POST /api/conversations, GET/PUT/DELETE /api/conversations/:id
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
  listDirectory: (dirPath) =>
    request(`/files/list?path=${encodeURIComponent(dirPath)}`),
  getDrives: () =>
    request('/files/drives'),
  resolveFolder: (folderName) =>
    request('/files/resolve-folder', { method: 'POST', body: { folderName } }),
  selectDirectory: () =>
    request('/files/select-directory', { method: 'POST' }),

  // --- Terminal Approval ---
  approveCommand: (commandId) =>
    request('/approve-command', { method: 'POST', body: { commandId } }),
  rejectCommand: (commandId) =>
    request('/terminal/reject', { method: 'POST', body: { commandId } }),

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
export async function streamChat(
  { conversationId, content, attachments, provider, model, contextWindow, messages, customApiKey, customBaseURL, permissionMode },
  onChunk,
  onToolCall,
  onDone,
  onError
) {
  // Backend stream endpoint is POST /api/stream
  const url = `${BASE_URL}/stream`
  
  // Build messages array if not provided
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

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new ApiError(`HTTP ${response.status}: ${errText}`, response.status)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let fullContent = ''
    let toolCalls = []

    while (true) {
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

            case 'tool_call':
              toolCalls.push(parsed)
              onToolCall({ ...parsed, requiresApproval: false }) // Let backend dictate requireApproval
              break

            case 'tool_result':
              // Tool result - no action needed on frontend side
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
    console.error('Stream error:', err)
    onError(err)
  }
}

export default api
