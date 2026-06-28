import React, { useState, useMemo } from 'react'
import { Plus, Search, Settings, MessageSquare, Trash2, Edit3, ChevronDown, Zap, Loader2 } from 'lucide-react'
import useChatStore from '../../stores/chatStore'
import useFileStore from '../../stores/fileStore'
import useProviderStore from '../../stores/providerStore'
import useSettingsStore from '../../stores/settingsStore'
import { useTranslation } from '../../utils/translations'
import { api } from '../../utils/api'
import { formatDistanceToNow } from 'date-fns'
import './Sidebar.css'

export default function Sidebar({ onSettings }) {
  const {
    conversations, activeConversationId,
    createConversation, selectConversation,
    deleteConversation, updateConversation,
    isAgentWorking, activeStreams
  } = useChatStore()
  const { activeProvider, activeModel, providers } = useProviderStore()
  
  const language = useSettingsStore(state => state.language)
  const t = useTranslation(language)
  const workspace = useFileStore(state => state.workspace)

  const [searchQuery, setSearchQuery] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [hoveredId, setHoveredId] = useState(null)

  const filtered = useMemo(() => {
    const workspaceConvs = conversations.filter(c => c.workspace === workspace)
    if (!searchQuery.trim()) return workspaceConvs
    const q = searchQuery.toLowerCase()
    return workspaceConvs.filter(c => c.title?.toLowerCase().includes(q))
  }, [conversations, searchQuery, workspace])

  const handleNewChat = async () => {
    if (!workspace) {
      const connMode = api.getConnectionMode()
      if (connMode === 'cloud') {
        useFileStore.getState().setWorkspace('./workspace/project-1')
        await createConversation('New Chat')
        return
      }

      try {
        const res = await api.selectDirectory()
        if (res && res.success && res.path) {
          useFileStore.getState().setWorkspace(res.path)
          await createConversation('New Chat')
        }
      } catch (err) {
        console.error("Failed to select workspace folder:", err)
      }
      return
    }
    await createConversation('New Chat')
  }

  const handleRename = (conv, e) => {
    e.stopPropagation()
    setEditingId(conv.id)
    setEditValue(conv.title || '')
  }

  const handleRenameSubmit = (id) => {
    if (editValue.trim()) {
      updateConversation(id, { title: editValue.trim() })
    }
    setEditingId(null)
  }

  const handleDelete = (id, e) => {
    e.stopPropagation()
    deleteConversation(id)
  }

  const getProviderBadge = (conv) => {
    if (!conv.provider) return null
    return conv.provider.slice(0, 1).toUpperCase() + conv.provider.slice(1)
  }

  const formatTime = (dateStr) => {
    if (!dateStr) return ''
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
    } catch { return '' }
  }

  // Group by date
  const grouped = useMemo(() => {
    const now = new Date()
    const today = []
    const yesterday = []
    const week = []
    const older = []

    filtered.forEach(conv => {
      const date = conv.updatedAt ? new Date(conv.updatedAt) : new Date()
      const diff = now - date
      const days = diff / (1000 * 60 * 60 * 24)
      if (days < 1) today.push(conv)
      else if (days < 2) yesterday.push(conv)
      else if (days < 7) week.push(conv)
      else older.push(conv)
    })

    return { today, yesterday, week, older }
  }, [filtered])

  const renderGroup = (label, convs) => {
    if (!convs.length) return null
    return (
      <div className="conv-group" key={label}>
        <div className="conv-group-label">{label}</div>
        {convs.map(conv => renderConvItem(conv))}
      </div>
    )
  }

  const renderConvItem = (conv) => {
    const isActive = conv.id === activeConversationId
    const isHovered = hoveredId === conv.id
    const isEditing = editingId === conv.id
    const badge = getProviderBadge(conv)
    const isWorking = activeStreams[conv.id]?.isAgentWorking || activeStreams[conv.id]?.isStreaming

    return (
      <div
        key={conv.id}
        className={`conv-item ${isActive ? 'active' : ''}`}
        onClick={() => !isEditing && selectConversation(conv.id)}
        onMouseEnter={() => setHoveredId(conv.id)}
        onMouseLeave={() => setHoveredId(null)}
      >
        <div className="conv-item-icon">
          <MessageSquare size={13} />
        </div>
        <div className="conv-item-body">
          {isEditing ? (
            <input
              className="conv-rename-input"
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onBlur={() => handleRenameSubmit(conv.id)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleRenameSubmit(conv.id)
                if (e.key === 'Escape') setEditingId(null)
              }}
              autoFocus
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <>
              <span className="conv-title">{conv.title || 'Untitled'}</span>
              <div className="conv-meta">
                {badge && (
                  <span className="conv-provider-badge">{badge}</span>
                )}
                <span className="conv-time">{formatTime(conv.updatedAt)}</span>
              </div>
            </>
          )}
        </div>
        {isWorking && (
          <Loader2 size={13} className="spin" style={{ color: 'var(--accent-primary)', flexShrink: 0, marginLeft: '4px', marginRight: '4px' }} />
        )}
        {!isEditing && (isActive || isHovered) && !isWorking && (
          <div className="conv-actions" onClick={e => e.stopPropagation()}>
            <button
              className="btn btn-ghost btn-icon conv-action-btn"
              onClick={(e) => handleRename(conv, e)}
              title="Rename"
            >
              <Edit3 size={12} />
            </button>
            <button
              className="btn btn-ghost btn-icon conv-action-btn danger"
              onClick={(e) => handleDelete(conv.id, e)}
              title="Delete"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
        {isActive && <div className="conv-active-bar" />}
      </div>
    )
  }

  return (
    <div className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Zap size={16} />
          </div>
          <span className="sidebar-logo-text gradient-text">Zero Coding Agent</span>
        </div>
        <button
          className="btn btn-primary btn-icon new-chat-btn"
          onClick={handleNewChat}
          title={t('newChat') + ' (Ctrl+K)'}
        >
          <Plus size={15} />
        </button>
      </div>

      {/* Search */}
      <div className="sidebar-search">
        <div className="search-input-wrapper">
          <Search size={13} className="search-icon" />
          <input
            className="search-input"
            placeholder={t('searchChats')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="sidebar-conv-list">
        {conversations.length === 0 ? (
          <div className="sidebar-empty">
            <div className="sidebar-empty-icon">
              <MessageSquare size={28} />
            </div>
            <p className="sidebar-empty-title">{t('noChats')}</p>
            <p className="sidebar-empty-desc">{t('startChat')}</p>
            <button className="btn btn-primary btn-sm" onClick={handleNewChat}>
              <Plus size={13} /> {t('newChat')}
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="sidebar-empty">
            <p className="sidebar-empty-title">{t('noResults')}</p>
            <p className="sidebar-empty-desc">{t('tryDifferentSearch')}</p>
          </div>
        ) : (
          <>
            {renderGroup(t('today'), grouped.today)}
            {renderGroup(t('yesterday'), grouped.yesterday)}
            {renderGroup(t('thisWeek'), grouped.week)}
            {renderGroup(t('older'), grouped.older)}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        {activeProvider && activeModel && (
          <div className="sidebar-active-model">
            <div className="status-dot connected" />
            <span className="sidebar-model-text">{activeModel}</span>
          </div>
        )}
        <button
          className="btn btn-ghost sidebar-settings-btn"
          onClick={onSettings}
        >
          <Settings size={15} />
          <span>{t('settings')}</span>
        </button>
      </div>
    </div>
  )
}
