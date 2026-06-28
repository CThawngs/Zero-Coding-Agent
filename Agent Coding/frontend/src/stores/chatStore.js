import { create } from 'zustand'
import { api, streamChat } from '../utils/api'
import useProviderStore from './providerStore'
import useFileStore from './fileStore'
import useSettingsStore from './settingsStore'

// Play a pleasant double-chime notification sound using native Web Audio API
function playNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    const playTone = (freq, startTime, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    };
    
    playTone(587.33, ctx.currentTime, 0.35); // D5
    playTone(880.00, ctx.currentTime + 0.12, 0.45); // A5
  } catch (err) {
    console.warn('AudioContext failed to play sound:', err);
  }
}

const useChatStore = create((set, get) => ({
  // State
  conversations: [],
  activeConversationId: null,
  activeConversation: null,
  isLoading: false,
  isStreaming: false,
  streamingContent: '',
  streamingMessageId: null,
  pendingApprovals: [],
  error: null,
  activeStreams: {},            // conversationId -> { abortController, streamingContent, streamingMessageId, isAgentWorking, isStreaming, agentStatus, agentIterationCount }
  // Agent loop state
  isAgentWorking: false,        // True when agent is in multi-turn coding loop
  agentStatus: '',              // Current status text (e.g. "Executing tool...")
  agentIterationCount: 0,       // How many loop iterations done
  _abortController: null,       // AbortController for the active stream

  // Load all conversations
  loadConversations: async () => {
    try {
      const data = await api.getConversations()
      set({ conversations: data || [] })
    } catch (err) {
      console.error('Failed to load conversations:', err)
      set({ conversations: [] })
    }
  },

  // Create new conversation
  createConversation: async (title = 'New Chat', permissionMode = null) => {
    try {
      set({ isLoading: true })
      const workspace = useFileStore.getState().workspace
      const conv = await api.createConversation({ title, workspace, permissionMode })
      set(state => ({
        conversations: [conv, ...state.conversations],
        activeConversationId: conv.id,
        activeConversation: { ...conv, messages: [] },
        isLoading: false
      }))
      return conv
    } catch (err) {
      console.error('Failed to create conversation:', err)
      // Optimistic creation for demo
      const tempConv = {
        id: `temp-${Date.now()}`,
        title,
        workspace: useFileStore.getState().workspace || null,
        permissionMode,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
        provider: null,
        model: null,
      }
      set(state => ({
        conversations: [tempConv, ...state.conversations],
        activeConversationId: tempConv.id,
        activeConversation: tempConv,
        isLoading: false
      }))
      return tempConv
    }
  },

  // Select conversation
  selectConversation: async (id) => {
    if (get().activeConversationId === id) return
    try {
      set({ isLoading: true, activeConversationId: id })
      const conv = await api.getConversation(id)
      
      const stream = get().activeStreams[id] || {
        isStreaming: false,
        isAgentWorking: false,
        streamingContent: '',
        streamingMessageId: null,
        agentStatus: '',
        agentIterationCount: 0,
        abortController: null,
      }

      set({
        activeConversation: conv,
        isLoading: false,
        isStreaming: stream.isStreaming,
        isAgentWorking: stream.isAgentWorking,
        streamingContent: stream.streamingContent,
        streamingMessageId: stream.streamingMessageId,
        agentStatus: stream.agentStatus,
        agentIterationCount: stream.agentIterationCount,
        _abortController: stream.abortController,
      })
    } catch (err) {
      console.error('Failed to load conversation:', err)
      const conv = get().conversations.find(c => c.id === id)
      
      const stream = get().activeStreams[id] || {
        isStreaming: false,
        isAgentWorking: false,
        streamingContent: '',
        streamingMessageId: null,
        agentStatus: '',
        agentIterationCount: 0,
        abortController: null,
      }

      set({
        activeConversation: conv ? { ...conv, messages: [] } : null,
        isLoading: false,
        isStreaming: stream.isStreaming,
        isAgentWorking: stream.isAgentWorking,
        streamingContent: stream.streamingContent,
        streamingMessageId: stream.streamingMessageId,
        agentStatus: stream.agentStatus,
        agentIterationCount: stream.agentIterationCount,
        _abortController: stream.abortController,
      })
    }
  },

  // Update conversation meta
  updateConversation: async (id, data) => {
    try {
      const updated = await api.updateConversation(id, data)
      set(state => {
        const { messages, ...metaOnly } = updated
        return {
          conversations: state.conversations.map(c => c.id === id ? { ...c, ...metaOnly } : c),
          activeConversation: state.activeConversationId === id
            ? { ...state.activeConversation, ...metaOnly }
            : state.activeConversation
        }
      })
    } catch (err) {
      // Optimistic update
      set(state => {
        const { messages, ...metaOnly } = data
        return {
          conversations: state.conversations.map(c => c.id === id ? { ...c, ...metaOnly } : c),
          activeConversation: state.activeConversationId === id
            ? { ...state.activeConversation, ...metaOnly }
            : state.activeConversation
        }
      })
    }
  },

  // Delete conversation
  deleteConversation: async (id) => {
    try {
      await api.deleteConversation(id)
    } catch (err) {
      console.error('Failed to delete conversation:', err)
    }
    set(state => {
      const conversations = state.conversations.filter(c => c.id !== id)
      const isActive = state.activeConversationId === id
      return {
        conversations,
        activeConversationId: isActive ? null : state.activeConversationId,
        activeConversation: isActive ? null : state.activeConversation,
      }
    })
  },

  // Send message (non-streaming)
  sendMessage: async (content, attachments = []) => {
    const { activeConversationId, activeConversation } = get()
    if (!content.trim() && attachments.length === 0) return

    let convId = activeConversationId
    let conv = activeConversation

    // Auto-create conversation if none active
    if (!convId) {
      const newConv = await get().createConversation(
        content.slice(0, 60) || 'New Chat'
      )
      convId = newConv.id
      conv = newConv
    }

    const userMsg = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      attachments,
      timestamp: new Date().toISOString(),
    }

    // Optimistically add user message
    set(state => ({
      activeConversation: {
        ...state.activeConversation,
        messages: [...(state.activeConversation?.messages || []), userMsg]
      }
    }))

    set({ isLoading: true })

    try {
      const response = await api.sendMessage(convId, { content, attachments })
      const assistantMsg = {
        id: response.messageId || `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: response.content,
        toolCalls: response.toolCalls || [],
        timestamp: new Date().toISOString(),
      }
      set(state => ({
        activeConversation: {
          ...state.activeConversation,
          messages: [...(state.activeConversation?.messages || []), assistantMsg]
        },
        isLoading: false,
        conversations: state.conversations.map(c =>
          c.id === convId ? { ...c, updatedAt: new Date().toISOString(), title: c.title === 'New Chat' ? content.slice(0, 50) : c.title } : c
        )
      }))
    } catch (err) {
      console.error('Send message failed:', err)
      set({ isLoading: false, error: err.message })
    }
  },

  // Stream message via SSE - Antigravity-style continuous agent loop
  streamMessage: async (content, attachments = [], provider, model) => {
    const { activeConversationId, activeConversation } = get()
    if (!content.trim() && attachments.length === 0) return

    let convId = activeConversationId
    let conv = activeConversation

    if (!convId) {
      const newConv = await get().createConversation(
        content.slice(0, 60) || 'New Chat'
      )
      convId = newConv.id
      conv = newConv
    }

    const userMsg = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content,
      attachments,
      timestamp: new Date().toISOString(),
    }

    const assistantMsgId = `msg-ai-${Date.now()}`

    // Build messages array for the API call (all history + new message)
    const existingMessages = (conv?.messages || []).map(m => ({
      role: m.role,
      content: m.content,
    }))
    const messagesForApi = [...existingMessages, { role: 'user', content }]

    const abortController = new AbortController();

    const activeStreamState = {
      isStreaming: true,
      isAgentWorking: true,
      agentStatus: 'Thinking...',
      agentIterationCount: 0,
      streamingContent: '',
      streamingMessageId: assistantMsgId,
      abortController
    }

    set(state => {
      const nextStreams = {
        ...state.activeStreams,
        [convId]: activeStreamState
      }
      const isCurrent = state.activeConversationId === convId
      return {
        activeStreams: nextStreams,
        conversations: state.conversations.map(c => 
          c.id === convId ? { ...c, isWorking: true } : c
        ),
        ...(isCurrent ? {
          activeConversation: {
            ...state.activeConversation,
            messages: [...(state.activeConversation?.messages || []), userMsg]
          },
          isStreaming: true,
          isAgentWorking: true,
          agentStatus: 'Thinking...',
          agentIterationCount: 0,
          streamingContent: '',
          streamingMessageId: assistantMsgId,
          _abortController: abortController
        } : {})
      }
    })

    try {
      const providerState = useProviderStore.getState().providers[provider]
      const customApiKey = providerState?.apiKey
      const customBaseURL = providerState?.baseUrl

      const cancelStream = streamChat(
        {
          conversationId: convId,
          content,
          attachments,
          provider,
          model,
          contextWindow: 128000,
          messages: messagesForApi,
          customApiKey,
          customBaseURL,
          permissionMode: conv?.permissionMode || 'balanced',
        },
        // onChunk
        (chunk) => {
          set(state => {
            const currentStream = state.activeStreams[convId] || {}
            const nextStreams = {
              ...state.activeStreams,
              [convId]: {
                ...currentStream,
                streamingContent: (currentStream.streamingContent || '') + chunk,
                agentStatus: 'Coding...'
              }
            }
            const isCurrent = state.activeConversationId === convId
            return {
              activeStreams: nextStreams,
              ...(isCurrent ? {
                streamingContent: nextStreams[convId].streamingContent,
                agentStatus: nextStreams[convId].agentStatus
              } : {})
            }
          })
        },
        // onToolCall
        (toolCall) => {
          set(state => {
            const currentStream = state.activeStreams[convId] || {}
            const isApproval = toolCall.requiresApproval
            const status = isApproval ? '⏸ Awaiting approval...' : `▶ Executing: ${(toolCall.tool || '').replace(/_/g, ' ')}...`
            
            if (isApproval) {
              get().addPendingApproval({ ...toolCall, conversationId: convId })
            }

            const nextStreams = {
              ...state.activeStreams,
              [convId]: {
                ...currentStream,
                agentStatus: status,
                agentIterationCount: (currentStream.agentIterationCount || 0) + 1
              }
            }
            const isCurrent = state.activeConversationId === convId
            return {
              activeStreams: nextStreams,
              ...(isCurrent ? {
                agentStatus: status,
                agentIterationCount: nextStreams[convId].agentIterationCount
              } : {})
            }
          })
        },
        // onDone
        (finalContent, toolCalls, extra) => {
          const currentStream = get().activeStreams[convId] || {}
          const assistantMsg = {
            id: assistantMsgId,
            role: 'assistant',
            content: finalContent || currentStream.streamingContent || '',
            toolCalls: toolCalls || [],
            timestamp: new Date().toISOString(),
          }

          set(state => {
            const isPaused = extra?.paused === true
            const nextStreams = { ...state.activeStreams }
            if (isPaused) {
              nextStreams[convId] = {
                ...nextStreams[convId],
                isStreaming: false,
                isAgentWorking: true,
                agentStatus: '⏸ Awaiting approval...',
              }
            } else {
              delete nextStreams[convId]
            }
            
            const isCurrent = state.activeConversationId === convId
            let activeConvUpdate = {}
            if (isCurrent) {
              activeConvUpdate = {
                activeConversation: {
                  ...state.activeConversation,
                  messages: [...(state.activeConversation?.messages || []), assistantMsg]
                },
                isStreaming: false,
                isAgentWorking: isPaused,
                agentStatus: isPaused ? '⏸ Awaiting approval...' : '',
                streamingContent: '',
                streamingMessageId: null,
                _abortController: null,
              }
            }
            
            // Play notification sound if background task completed
            if (!isCurrent && !isPaused) {
              playNotificationSound()
            }
            
            return {
              activeStreams: nextStreams,
              conversations: state.conversations.map(c =>
                c.id === convId
                  ? { ...c, updatedAt: new Date().toISOString(), title: c.title === 'New Chat' ? content.slice(0, 50) : c.title }
                  : c
              ),
              ...activeConvUpdate
            }
          })
        },
        // onError
        (err) => {
          console.error('Stream error:', err)
          set(state => {
            const currentStream = state.activeStreams[convId] || {}
            const errMsg = {
              id: assistantMsgId,
              role: 'assistant',
              content: currentStream.streamingContent || `❌ Error: ${err.message || 'Stream failed'}`,
              error: true,
              timestamp: new Date().toISOString(),
            }
            
            const nextStreams = { ...state.activeStreams }
            delete nextStreams[convId]
            
            const isCurrent = state.activeConversationId === convId
            let activeConvUpdate = {}
            if (isCurrent) {
              activeConvUpdate = {
                activeConversation: {
                  ...state.activeConversation,
                  messages: [...(state.activeConversation?.messages || []), errMsg]
                },
                isStreaming: false,
                isAgentWorking: false,
                agentStatus: '',
                streamingContent: '',
                streamingMessageId: null,
                _abortController: null,
              }
            }
            
            return {
              activeStreams: nextStreams,
              ...activeConvUpdate
            }
          })
        },
        abortController.signal
      )

      set(state => {
        const currentStream = state.activeStreams[convId] || {}
        return {
          activeStreams: {
            ...state.activeStreams,
            [convId]: {
              ...currentStream,
              cancelStream
            }
          }
        }
      })

    } catch (err) {
      console.error('Stream failed:', err)
      set(state => {
        const nextStreams = { ...state.activeStreams }
        delete nextStreams[convId]
        const isCurrent = state.activeConversationId === convId
        return {
          activeStreams: nextStreams,
          ...(isCurrent ? {
            isStreaming: false,
            isAgentWorking: false,
            streamingContent: '',
            streamingMessageId: null,
            _abortController: null
          } : {})
        }
      })
    }
  },

  // Stop the agent immediately
  stopAgent: async (convId = null) => {
    const targetId = convId || get().activeConversationId
    if (!targetId) return

    const stream = get().activeStreams[targetId]
    if (stream && stream.abortController) {
      stream.abortController.abort()
    }

    try {
      await api.stopStream(targetId)
    } catch (err) {
      console.error('Stop stream API call failed:', err)
    }

    const streamingContent = stream?.streamingContent || ''

    set(state => {
      const nextStreams = { ...state.activeStreams }
      delete nextStreams[targetId]

      const isCurrent = state.activeConversationId === targetId
      let activeUpdate = {}

      if (isCurrent) {
        let messages = state.activeConversation?.messages || []
        if (streamingContent) {
          messages = [
            ...messages,
            {
              id: `msg-stop-${Date.now()}`,
              role: 'assistant',
              content: streamingContent + '\n\n*(Agent stopped by user)*',
              timestamp: new Date().toISOString(),
            }
          ]
        }
        activeUpdate = {
          activeConversation: {
            ...state.activeConversation,
            messages
          },
          isStreaming: false,
          isAgentWorking: false,
          agentStatus: '⏹ Stopped',
          streamingContent: '',
          streamingMessageId: null,
          _abortController: null,
        }
      }

      return {
        activeStreams: nextStreams,
        ...activeUpdate
      }
    })
  },

  // HITL - Approve command
  approveCommand: async (commandId) => {
    try {
      const res = await api.approveCommand(commandId)
      // Automatically send the tool execution results back to the LLM to continue!
      if (res && res.result) {
        const { activeProvider, activeModel } = useProviderStore.getState()
        const language = useSettingsStore.getState().language
        
        let resultText;
        if (res.result.success) {
          resultText = language === 'vi' 
            ? `Thao tác đã được đồng ý và thực hiện thành công. Kết quả:\n\`\`\`json\n${JSON.stringify(res.result, null, 2)}\n\`\`\``
            : `Operation approved and executed successfully. Result:\n\`\`\`json\n${JSON.stringify(res.result, null, 2)}\n\`\`\``;
        } else {
          resultText = language === 'vi'
            ? `Thao tác thất bại. Lỗi: ${res.result.error || 'Lỗi không xác định'}`
            : `Operation failed. Error: ${res.result.error || 'Unknown error'}`;
        }
        
        // After approval, resume the agent loop by sending the result
        get().streamMessage(resultText, [], activeProvider, activeModel)
      }
    } catch (err) {
      console.error('Approve failed:', err)
    }
    get().removePendingApproval(commandId)
  },

  // HITL - Reject command
  rejectCommand: async (commandId, feedback) => {
    try {
      await api.rejectCommand(commandId)
      if (feedback && feedback.trim()) {
        const { activeProvider, activeModel } = useProviderStore.getState()
        get().streamMessage(feedback.trim(), [], activeProvider, activeModel)
      }
    } catch (err) {
      console.error('Reject failed:', err)
    }
    get().removePendingApproval(commandId)
  },

  // Add pending approval
  addPendingApproval: (approval) => {
    // 1. Play Web Audio D5-A5 chime
    playNotificationSound();

    // 2. Browser HTML5 Notification
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        const language = useSettingsStore.getState().language;
        const title = language === 'vi' ? 'Yêu cầu Cấp Quyền AI Coding Agent' : 'AI Coding Agent Approval Required';
        const body = language === 'vi' 
          ? `AI Agent đang yêu cầu phê duyệt hành động: ${approval.tool || 'run_terminal_command'}`
          : `AI Agent requires approval for: ${approval.tool || 'run_terminal_command'}`;
        new Notification(title, { body });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }

    set(state => ({
      pendingApprovals: [...state.pendingApprovals, {
        ...approval,
        timestamp: new Date().toISOString()
      }]
    }))
  },

  // Remove pending approval
  removePendingApproval: (commandId) => {
    set(state => ({
      pendingApprovals: state.pendingApprovals.filter(a => a.id !== commandId)
    }))
  },

  // Clear error
  clearError: () => set({ error: null }),
}))

export default useChatStore
