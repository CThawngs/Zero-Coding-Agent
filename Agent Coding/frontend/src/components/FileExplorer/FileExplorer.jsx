import React, { useEffect, useRef } from 'react'
import { FolderOpen, ChevronRight, ChevronDown, File, Folder, FolderOpen as FolderOpenIcon,
  RefreshCw, FilePlus, FolderPlus, Trash2, Edit3, Download } from 'lucide-react'
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

  const handleOpenFolder = async () => {
    const connMode = api.getConnectionMode()
    if (connMode === 'cloud') {
      const folderName = prompt(
        language === 'vi' 
          ? 'Nhập tên thư mục dự án Sandbox trên Cloud (ví dụ: project-2):' 
          : 'Enter Cloud Sandbox project directory name (e.g., project-2):',
        'project-1'
      )
      if (folderName && folderName.trim()) {
        setWorkspace(`./workspace/${folderName.trim()}`)
      }
      return
    }

    try {
      const res = await api.selectDirectory()
      if (res && res.success && res.path) {
        setWorkspace(res.path)
      }
    } catch (err) {
      console.error("Failed to select workspace folder:", err)
    }
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

      {/* Workspace path */}
      {workspace && (
        <div className="workspace-path">
          <span title={workspace}>{workspace}</span>
        </div>
      )}

      <div className="explorer-body">
        {/* File tree */}
        <div className="explorer-tree-panel">
          {!workspace ? (
            <div className="explorer-empty">
              <FolderOpen size={32} />
              <p>{t('emptyWorkspace') || 'Chưa mở folder nào'}</p>
              <button className="btn-primary btn-sm" onClick={handleOpenFolder}>
                {t('openFolderBtn') || 'Mở Folder'}
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
