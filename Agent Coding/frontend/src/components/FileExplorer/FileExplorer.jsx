import React, { useState, useRef, useEffect, useCallback } from 'react'
import { FolderOpen, ChevronRight, ChevronDown, File, Folder, FolderOpen as FolderOpenIcon,
  RefreshCw, FilePlus, FolderPlus, Trash2, Edit3, Download, X, Check, FolderUp } from 'lucide-react'
import useFileStore from '../../stores/fileStore'
import useSettingsStore from '../../stores/settingsStore'
import { useTranslation } from '../../utils/translations'
import { api } from '../../utils/api'
import { getFileIcon } from '../../utils/fileUtils'
import './FileExplorer.css'
import FileTree from './FileTree'
import CodeEditor from './CodeEditor'

export default function FileExplorer() {
  const { workspace, setWorkspace, fileTree, refreshTree, openFiles, activeFilePath } = useFileStore()
  const language = useSettingsStore(state => state.language)
  const t = useTranslation(language)
  const [showPathInput, setShowPathInput] = useState(false)
  const [pathInput, setPathInput] = useState('')
  const [pickerStatus, setPickerStatus] = useState(null) // 'opening' | null
  const pathInputRef = useRef(null)

  useEffect(() => {
    if (showPathInput && pathInputRef.current) {
      pathInputRef.current.focus()
    }
  }, [showPathInput])

  // Open native OS folder picker with proper focus management
  const openNativePicker = useCallback(async () => {
    // STEP 1: Show a toast so user knows a dialog is about to open
    setPickerStatus('opening')

    // STEP 2: Yield to the browser event loop so the toast renders
    // and the browser window stays in the foreground
    await new Promise(r => setTimeout(r, 200))

    // STEP 3: Call native picker (may be blocked by browser on localhost)
    if (typeof window !== 'undefined' && 'showDirectoryPicker' in window) {
      try {
        const handle = await window.showDirectoryPicker({ mode: 'readwrite' })
        // Restore focus after dialog closes
        window.focus()
        window.__workspaceHandle = handle
        try {
          const dirPath = await api.resolveFolder(handle.name)
          if (dirPath && dirPath.path) {
            setWorkspace(dirPath.path)
            setPickerStatus(null)
            return
          }
        } catch { /* fallback */ }
        setWorkspace(`./workspace/${handle.name}`)
        setPickerStatus(null)
        return
      } catch (err) {
        window.focus()
        if (err.name === 'AbortError') {
          setPickerStatus(null)
          return
        }
        // Picker failed — fall through to inline input
      }
    }

    // STEP 4: No native picker available — try server-side
    try {
      const res = await api.selectDirectory()
      if (res && res.success && res.path) {
        setWorkspace(res.path)
        setPickerStatus(null)
        return
      }
    } catch { /* server picker unavailable */ }

    // STEP 5: Final fallback — inline path input (VSCode-style)
    setPickerStatus(null)
    setShowPathInput(true)
    setPathInput(workspace || '')
  }, [workspace, setWorkspace])

  const handleOpenFolder = () => {
    openNativePicker()
  }

  const handlePathSubmit = () => {
    const trimmed = pathInput.trim()
    if (!trimmed) return
    const connMode = api.getConnectionMode()
    if (connMode === 'cloud') {
      setWorkspace(`./workspace/${trimmed}`)
    } else {
      setWorkspace(trimmed)
    }
    setShowPathInput(false)
  }

  const handlePathKeyDown = (e) => {
    if (e.key === 'Enter') handlePathSubmit()
    if (e.key === 'Escape') setShowPathInput(false)
  }

  return (
    <div className="file-explorer">
      {/* Header */}
      <div className="explorer-header">
        <div className="explorer-title">
          <FolderOpen size={16} />
          <span>{t('fileExplorerTitle') || 'File Explorer'}</span>
        </div>
        <div className="explorer-actions">
          <button className="icon-btn" onClick={handleOpenFolder} title={t('openFolderBtn') || 'Open folder'} disabled={pickerStatus === 'opening'}>
            {pickerStatus === 'opening' ? (
              <FolderUp size={14} className="animate-bounce" />
            ) : (
              <FolderOpen size={14} />
            )}
          </button>
          <button className="icon-btn" onClick={refreshTree} title={t('refreshBtn') || 'Refresh'}>
            <RefreshCw size={14} />
          </button>
          {api.getConnectionMode() === 'cloud' && workspace && (
            <button
              className="icon-btn"
              onClick={() => {
                const url = api.downloadWorkspace(workspace)
                window.open(url, '_blank')
              }}
              title={language === 'vi' ? 'Tải xuống ZIP dự án' : 'Download project ZIP'}
              style={{ color: 'var(--success)' }}
            >
              <Download size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Toast notification for picker status */}
      {pickerStatus === 'opening' && (
        <div className="picker-toast" style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '6px 10px', background: 'var(--accent)',
          color: 'var(--text-primary)', fontSize: '11px',
          borderBottom: '1px solid var(--border)'
        }}>
          <FolderOpen size={13} />
          <span>Opening OS folder dialog... Check behind your browser if not visible.</span>
        </div>
      )}

      {/* Inline path input (VSCode-style) */}
      {showPathInput && (
        <div className="explorer-path-input" style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          padding: '4px 8px', borderBottom: '1px solid var(--border)',
          background: 'var(--bg-secondary)'
        }}>
          <input
            ref={pathInputRef}
            type="text"
            className="settings-input"
            value={pathInput}
            onChange={e => setPathInput(e.target.value)}
            onKeyDown={handlePathKeyDown}
            placeholder={api.getConnectionMode() === 'cloud' ? 'e.g. project-1' : 'e.g. C:\\Users\\nguye\\Projects\\my-app'}
            style={{ flex: 1, fontSize: '12px', padding: '4px 8px' }}
          />
          <button className="icon-btn icon-btn-sm" onClick={handlePathSubmit} title="Open">
            <Check size={13} style={{ color: 'var(--success)' }} />
          </button>
          <button className="icon-btn icon-btn-sm" onClick={() => setShowPathInput(false)} title="Cancel">
            <X size={13} />
          </button>
        </div>
      )}

      {/* Workspace path */}
      {workspace && !showPathInput && (
        <div className="workspace-path" style={{ cursor: 'pointer' }} onClick={handleOpenFolder} title="Click to change workspace">
          <span title={workspace}>{workspace}</span>
        </div>
      )}

      <div className="explorer-body">
        {/* File tree */}
        <div className="explorer-tree-panel">
          {!workspace ? (
            <div className="explorer-empty">
              <FolderOpen size={32} />
              <p>{t('emptyWorkspace') || 'No folder opened'}</p>
              <button className="btn-primary btn-sm" onClick={handleOpenFolder}>
                {t('openFolderBtn') || 'Open Folder'}
              </button>
            </div>
          ) : (
            <FileTree />
          )}
        </div>

        {/* Code editor */}
        {activeFilePath && (
          <div className="explorer-editor-panel">
            <CodeEditor />
          </div>
        )}
      </div>
    </div>
  )
}
