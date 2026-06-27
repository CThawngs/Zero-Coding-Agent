import React, { useEffect, useRef, useState } from 'react'
import { PanelLeft, PanelRight, Settings, Plus, Folder } from 'lucide-react'
import useChatStore from '../../stores/chatStore'
import useFileStore from '../../stores/fileStore'
import useProviderStore from '../../stores/providerStore'
import useSettingsStore from '../../stores/settingsStore'
import { useTranslation } from '../../utils/translations'
import { api } from '../../utils/api'
import MessageItem from './MessageItem'
import ChatInput from './ChatInput'
import ModelSelector from '../ModelSelector'
import TerminalApproval from './TerminalApproval'
import PermissionModal from './PermissionModal'
import './ChatWindow.css'

export default function ChatWindow({ onToggleSidebar, onToggleExplorer, sidebarOpen, explorerOpen }) {
  const messagesEndRef = useRef(null)
  const workspace = useFileStore(state => state.workspace)
  const { activeConversation, isStreaming, streamingContent, streamingMessageId, pendingApprovals } = useChatStore()
  const { activeProvider, activeModel } = useProviderStore()
  
  const language = useSettingsStore(state => state.language)
  const t = useTranslation(language)
  const [manualPath, setManualPath] = useState('')

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeConversation?.messages, streamingContent])

  const messages = activeConversation?.messages || []
  const isEmpty = messages.length === 0

  const suggestions = [
    t('sugg1'),
    t('sugg2'),
    t('sugg3'),
    t('sugg4'),
    t('sugg5'),
    t('sugg6'),
  ]

  if (!workspace) {
    return (
      <div className="chat-window" style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Minimal topbar */}
        <div className="chat-topbar">
          <div className="chat-topbar-left">
            <button className="icon-btn" onClick={onToggleSidebar} title={sidebarOpen ? t('hideSidebar') : t('showSidebar')}>
              <PanelLeft size={18} />
            </button>
            <span className="chat-title">Zero Coding Agent</span>
          </div>
          <div className="chat-topbar-right">
            <button className="icon-btn" onClick={onToggleExplorer} title={explorerOpen ? t('hideExplorer') : t('showExplorer')}>
              <PanelRight size={18} />
            </button>
          </div>
        </div>

        {/* Workspace select overlay */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: '24px' }}>
          <div className="setup-modal-card" style={{ maxWidth: '480px', padding: '40px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
            <div style={{ 
              display: 'flex', 
              padding: '16px', 
              borderRadius: '50%', 
              background: 'rgba(99, 102, 241, 0.1)', 
              border: '1px solid rgba(99, 102, 241, 0.2)',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.15)'
            }}>
              <Folder size={36} style={{ color: 'var(--accent-primary)' }} />
            </div>
            <div>
              <h2 className="gradient-text" style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>
                {language === 'vi' ? 'Chọn Workspace để bắt đầu' : 'Select Workspace to Begin'}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.5 }}>
                {language === 'vi'
                  ? 'AI Agent cần một thư mục làm việc để đọc/ghi file và thực thi lệnh trực tiếp trên ổ đĩa của bạn.'
                  : 'The AI Agent requires a workspace folder to read/write files and run terminal commands directly on your local disk.'}
              </p>
            </div>
            <button 
              className="btn btn-primary" 
              onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.webkitdirectory = true
                input.onchange = async (e) => {
                  const files = Array.from(e.target.files || [])
                  if (files.length === 0) return
                  const folderName = files[0].webkitRelativePath.split('/')[0]
                  try {
                    const res = await api.resolveFolder(folderName)
                    if (res && res.path) {
                      useFileStore.getState().setWorkspace(res.path)
                    }
                  } catch (err) {
                    console.error("Failed to resolve workspace folder:", err)
                  }
                }
                input.click()
              }}
              style={{ padding: '12px 24px', fontSize: '14px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)' }}
            >
              <Folder size={16} />
              {language === 'vi' ? 'Mở Thư mục làm việc' : 'Open Workspace Folder'}
            </button>

            {/* Or manual input */}
            <div style={{ width: '100%', borderTop: '1px solid var(--border)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                {language === 'vi' ? 'Hoặc nhập đường dẫn tuyệt đối thư mục local:' : 'Or enter local absolute path manually:'}
              </p>
              <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                <input 
                  type="text"
                  placeholder={language === 'vi' ? 'Ví dụ: C:\\Projects\\MyAwesomeApp' : 'Example: C:\\Projects\\MyAwesomeApp'}
                  value={manualPath}
                  onChange={(e) => setManualPath(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                    transition: 'border 0.2s ease',
                    textAlign: 'left'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                />
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    if (manualPath.trim()) {
                      useFileStore.getState().setWorkspace(manualPath.trim())
                    }
                  }}
                  style={{ padding: '0 16px', fontSize: '13px', borderRadius: '8px' }}
                >
                  {language === 'vi' ? 'Xác nhận' : 'Confirm'}
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="chat-window">
      {/* Top bar */}
      <div className="chat-topbar">
        <div className="chat-topbar-left">
          <button
            className="icon-btn"
            onClick={onToggleSidebar}
            title={sidebarOpen ? t('hideSidebar') : t('showSidebar')}
          >
            <PanelLeft size={18} />
          </button>
          {activeConversation && (
            <span className="chat-title">{activeConversation.title || 'New Chat'}</span>
          )}
        </div>
        <div className="chat-topbar-center">
          <ModelSelector />
        </div>
        <div className="chat-topbar-right">
          <button
            className="icon-btn"
            onClick={onToggleExplorer}
            title={explorerOpen ? t('hideExplorer') : t('showExplorer')}
          >
            <PanelRight size={18} />
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="chat-messages">
        {isEmpty ? (
          <div className="chat-empty">
            <div className="chat-empty-logo">
              <div className="logo-glow">
                <span className="logo-icon">⚡</span>
              </div>
              <h1 className="gradient-text">Zero Coding Agent</h1>
              <p className="chat-empty-subtitle">AI Coding Agent · Localhost Edition</p>
            </div>
            <p className="chat-empty-desc" dangerouslySetInnerHTML={{ __html: t('emptyDesc') }} />
            <div className="suggestion-grid">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  className="suggestion-chip"
                  onClick={() => {
                    const text = s.replace(/^[\u{1F300}-\u{1F9FF}]\s*/u, '')
                    useChatStore.getState().streamMessage(s, [], activeProvider, activeModel)
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
            {!activeProvider && (
              <div className="no-provider-warning">
                {t('noProviderWarning')}
              </div>
            )}
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageItem
                key={msg.id}
                message={msg}
                isStreaming={isStreaming && msg.id === streamingMessageId}
                streamingContent={msg.id === streamingMessageId ? streamingContent : ''}
              />
            ))}
            {isStreaming && !streamingMessageId && (
              <MessageItem
                key="streaming"
                message={{ id: 'streaming', role: 'assistant', content: streamingContent }}
                isStreaming={true}
                streamingContent={streamingContent}
              />
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Pending approvals */}
      {pendingApprovals.length > 0 && (
        <div className="approvals-container">
          {pendingApprovals.map(approval => (
            <TerminalApproval key={approval.id} approval={approval} />
          ))}
        </div>
      )}

      {/* Input */}
      <ChatInput />

      {/* Permission Mode Modal Popup */}
      {activeConversation && !activeConversation.permissionMode && (
        <PermissionModal conversationId={activeConversation.id} />
      )}
    </div>
  )
}
