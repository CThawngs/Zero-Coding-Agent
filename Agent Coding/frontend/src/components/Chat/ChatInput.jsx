import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Send, FolderOpen, FileText, Image, Link, Github, X, Paperclip, Loader2, Square } from 'lucide-react'
import useChatStore from '../../stores/chatStore'
import useProviderStore from '../../stores/providerStore'
import useFileStore from '../../stores/fileStore'
import useSettingsStore from '../../stores/settingsStore'
import { useTranslation } from '../../utils/translations'
import { api } from '../../utils/api'
import './ChatInput.css'

export default function ChatInput() {
  const language = useSettingsStore(state => state.language)
  const t = useTranslation(language)
  const [text, setText] = useState('')
  const [attachments, setAttachments] = useState([])
  const [urlInput, setUrlInput] = useState('')
  const [ghInput, setGhInput] = useState('')
  const [ghToken, setGhToken] = useState('')
  const [showUrlDialog, setShowUrlDialog] = useState(false)
  const [showGhDialog, setShowGhDialog] = useState(false)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)

  const { isStreaming, isAgentWorking, streamMessage, stopAgent } = useChatStore()
  const { activeProvider, activeModel } = useProviderStore()
  const { workspace, setWorkspace } = useFileStore()

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'
  }, [text])

  const handleSend = useCallback(async () => {
    if ((!text.trim() && attachments.length === 0) || isStreaming || isAgentWorking) return
    if (!activeProvider || !activeModel) return
    const content = text.trim()
    const atts = [...attachments]
    setText('')
    setAttachments([])
    await streamMessage(content, atts, activeProvider, activeModel)
  }, [text, attachments, isStreaming, isAgentWorking, streamMessage, activeProvider, activeModel])

  const handleStop = useCallback(async () => {
    await stopAgent()
  }, [stopAgent])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (isAgentWorking || isStreaming) {
        handleStop()
      } else {
        handleSend()
      }
    }
  }

  // File picker
  const openFilePicker = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || [])
    const newAtts = files.map(f => ({
      id: Date.now() + Math.random(),
      type: f.type.startsWith('image/') ? 'image' : 'file',
      name: f.name,
      size: f.size,
      file: f,
    }))
    setAttachments(prev => [...prev, ...newAtts])
    e.target.value = ''
  }

  // Folder picker
  const openFolderPicker = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.webkitdirectory = true
    input.onchange = (e) => {
      const files = Array.from(e.target.files || [])
      if (files.length === 0) return
      // Get folder name from the first file's path
      const folderName = files[0].webkitRelativePath.split('/')[0]
      setAttachments(prev => [...prev, {
        id: Date.now(),
        type: 'folder',
        name: folderName,
        fileCount: files.length,
        files: files,
      }])
    }
    input.click()
  }

  // Native OS Workspace Folder picker
  const openWorkspaceFolderPicker = async () => {
    try {
      const res = await api.selectDirectory()
      if (res && res.success && res.path) {
        setWorkspace(res.path)
      }
    } catch (err) {
      console.error("Failed to select workspace folder:", err)
    }
  }

  // URL submit
  const handleAddUrl = () => {
    if (!urlInput.trim()) return
    setAttachments(prev => [...prev, {
      id: Date.now(),
      type: 'url',
      name: urlInput,
      url: urlInput,
    }])
    setUrlInput('')
    setShowUrlDialog(false)
  }

  // GitHub submit
  const handleAddGithub = () => {
    if (!ghInput.trim()) return
    const repoName = ghInput.replace('https://github.com/', '').split('/').slice(0, 2).join('/')
    setAttachments(prev => [...prev, {
      id: Date.now(),
      type: 'github',
      name: repoName || ghInput,
      url: ghInput,
      token: ghToken || undefined,
    }])
    setGhInput('')
    setGhToken('')
    setShowGhDialog(false)
  }

  const removeAttachment = (id) => {
    setAttachments(prev => prev.filter(a => a.id !== id))
  }

  const attTypeIcon = (type) => {
    switch (type) {
      case 'folder': return '📁'
      case 'file': return '📄'
      case 'image': return '🖼️'
      case 'url': return '🔗'
      case 'github': return '🐙'
      default: return '📎'
    }
  }

  const isBusy = isStreaming || isAgentWorking

  return (
    <div className="chat-input-area">
      {/* Attachment chips */}
      {attachments.length > 0 && (
        <div className="attachment-list">
          {attachments.map(att => (
            <div key={att.id} className="att-chip">
              <span>{attTypeIcon(att.type)}</span>
              <span className="att-name">{att.name}</span>
              {att.fileCount && <span className="att-count">{att.fileCount} files</span>}
              <button className="att-remove" onClick={() => removeAttachment(att.id)}>
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* URL Dialog */}
      {showUrlDialog && (
        <div className="mini-dialog">
          <div className="mini-dialog-inner">
            <span>🔗 URL</span>
            <input
              autoFocus
              className="mini-input"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              placeholder="https://example.com/docs"
              onKeyDown={e => e.key === 'Enter' && handleAddUrl()}
            />
            <button className="btn-primary btn-sm" onClick={handleAddUrl}>Add</button>
            <button className="btn-ghost btn-sm" onClick={() => setShowUrlDialog(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* GitHub Dialog */}
      {showGhDialog && (
        <div className="mini-dialog">
          <div className="mini-dialog-inner">
            <span>🐙 GitHub Repo</span>
            <input
              autoFocus
              className="mini-input"
              value={ghInput}
              onChange={e => setGhInput(e.target.value)}
              placeholder="https://github.com/owner/repo"
            />
            <input
              className="mini-input"
              value={ghToken}
              onChange={e => setGhToken(e.target.value)}
              placeholder="GitHub token (optional for private)"
              type="password"
            />
            <button className="btn-primary btn-sm" onClick={handleAddGithub}>Add</button>
            <button className="btn-ghost btn-sm" onClick={() => setShowGhDialog(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Main input */}
      <div className="chat-input-box">
        {/* Toolbar */}
        <div className="chat-input-toolbar">
          <button className="toolbar-btn" onClick={openWorkspaceFolderPicker} title={t('workspacePathTitle') || "Chọn thư mục workspace"}>
            <FolderOpen size={16} />
          </button>
          <button className="toolbar-btn" onClick={openFilePicker} title="Đính kèm file">
            <FileText size={16} />
          </button>
          <button className="toolbar-btn" onClick={() => setShowUrlDialog(v => !v)} title="Đính kèm URL">
            <Link size={16} />
          </button>
          <button className="toolbar-btn" onClick={() => setShowGhDialog(v => !v)} title="Đính kèm GitHub repo">
            <Github size={16} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="*/*"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
        </div>

        {/* Textarea + Send/Stop */}
        <div className="chat-input-row">
          <textarea
            ref={textareaRef}
            className="chat-textarea"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isBusy ? t('inputPlaceholderStreaming') : t('inputPlaceholder')}
            disabled={isBusy}
            rows={1}
          />
          {isBusy ? (
            <button
              className="send-btn send-btn-stop"
              onClick={handleStop}
              title={language === 'vi' ? 'Dừng AI Agent (Enter)' : 'Stop AI Agent (Enter)'}
            >
              <Square size={16} />
            </button>
          ) : (
            <button
              className={`send-btn ${(text.trim() || attachments.length > 0) ? 'send-btn-active' : ''}`}
              onClick={handleSend}
              disabled={!text.trim() && attachments.length === 0}
              title={language === 'vi' ? 'Gửi (Enter)' : 'Send (Enter)'}
            >
              <Send size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Agent status indicator */}
      {isBusy && (
        <div className="agent-status-bar">
          <div className="agent-status-dot"></div>
          <span className="agent-status-text">
            {isAgentWorking ? 'AI Agent is working...' : 'Thinking...'}
          </span>
        </div>
      )}

      <div className="chat-input-hint">
        {activeProvider && activeModel
          ? `${activeProvider} · ${activeModel}`
          : t('noModelWarning')}
      </div>
    </div>
  )
}
