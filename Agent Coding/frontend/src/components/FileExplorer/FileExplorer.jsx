import React, { useState, useRef, useEffect } from 'react'
import { FolderOpen, ChevronRight, ChevronDown, File, Folder, FolderOpen as FolderOpenIcon,
  RefreshCw, FilePlus, FolderPlus, Trash2, Edit3, Download, X, Check } from 'lucide-react'
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
  const pathInputRef = useRef(null)
  const folderInputRef = useRef(null)

  useEffect(() => {
    if (showPathInput && pathInputRef.current) {
      pathInputRef.current.focus()
    }
  }, [showPathInput])

  // Open native OS folder dialog via hidden input
  const handleOpenFolder = () => {
    if (folderInputRef.current) {
      folderInputRef.current.click()
    }
  }

  const handleFolderSelected = (e) => {
    const files = e.target.files
    if (files && files.length > 0) {
      // Get folder path from first file's webkitRelativePath
      // e.g. "FolderName/sub/file.txt" → workspace = "FolderName"
      const parts = files[0].webkitRelativePath.split('/')
      if (parts.length > 0) {
        // The root folder name is the workspace
        const folderName = parts[0]
        setWorkspace(`./workspace/${folderName}`)
        // For cloud mode, set directly
        if (api.getConnectionMode() !== 'cloud') {
          // Try to get full path from file path if available
          try {
            const filePath = files[0].name ? `${folderName}` : folderName
            setWorkspace(filePath)
          } catch {
            setWorkspace(`./workspace/${folderName}`)
          }
        }
      }
    }
    // Reset input so we can select same folder again
    e.target.value = null
  }

  // Inline path input as fallback
  const handleWorkspaceIconClick = () => {
    if (!showPathInput) {
      setShowPathInput(true)
      setPathInput(workspace || '')
    }
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
          <button className="icon-btn" onClick={handleOpenFolder} title={t('openFolderBtn') || 'Open folder'}>
            <FolderOpen size={14} />
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

      {/* Workspace path (click to browse via native dialog) */}
      {workspace && (
        <div className="workspace-path" style={{ cursor: 'pointer' }} onClick={handleOpenFolder} title="Click to change workspace (opens OS dialog)">
          <FolderOpen size={12} style={{ marginRight: '4px', flexShrink: 0 }} />
          <span title={workspace}>{workspace}</span>
        </div>
      )}

      {/* Hidden input for native OS folder picker */}
      <input
        ref={folderInputRef}
        type="file"
        webkitdirectory=""
        directory=""
        multiple
        style={{ display: 'none' }}
        onChange={handleFolderSelected}
      />

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
