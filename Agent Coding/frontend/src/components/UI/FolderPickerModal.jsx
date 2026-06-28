import React, { useState, useEffect } from 'react'
import { Folder, FolderOpen, ChevronRight, HardDrive, ArrowUp, X, Check, Search, RefreshCw } from 'lucide-react'
import useFileStore from '../../stores/fileStore'
import useSettingsStore from '../../stores/settingsStore'
import { useTranslation } from '../../utils/translations'
import { api } from '../../utils/api'
import './FolderPickerModal.css'

export default function FolderPickerModal() {
  const { isFolderPickerOpen, closeFolderPicker, setWorkspace, workspace } = useFileStore()
  const language = useSettingsStore(state => state.language)
  const t = useTranslation(language)

  const [currentPath, setCurrentPath] = useState('')
  const [drives, setDrives] = useState([])
  const [folders, setFolders] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Fetch drives on load
  useEffect(() => {
    if (!isFolderPickerOpen) return

    const fetchDrives = async () => {
      try {
        const res = await api.getDrives()
        if (res && res.drives) {
          setDrives(res.drives)
        }
      } catch (err) {
        console.error('Failed to fetch drives:', err)
      }
    }
    fetchDrives()
  }, [isFolderPickerOpen])

  // Initialize path
  useEffect(() => {
    if (!isFolderPickerOpen) return

    const initPath = async () => {
      if (workspace) {
        setCurrentPath(workspace)
      } else {
        try {
          const res = await api.getDefaultWorkspace()
          if (res && res.success && res.path) {
            setCurrentPath(res.path)
          } else {
            setCurrentPath('/')
          }
        } catch {
          setCurrentPath('/')
        }
      }
    }
    initPath()
  }, [isFolderPickerOpen, workspace])

  // Load directories whenever currentPath changes
  useEffect(() => {
    if (!isFolderPickerOpen || !currentPath) return

    const loadDirs = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const res = await api.listDirectory(currentPath)
        if (Array.isArray(res)) {
          // Filter folders only
          setFolders(res.filter(item => item.isDirectory))
        } else {
          setFolders([])
        }
      } catch (err) {
        setError(err.message || 'Failed to read directory')
        setFolders([])
      } finally {
        setIsLoading(false)
      }
    }
    loadDirs()
  }, [isFolderPickerOpen, currentPath])

  if (!isFolderPickerOpen) return null

  // Helpers for path manipulation
  const getParentPath = (path) => {
    if (!path) return ''
    const isWin = path.includes('\\') || /^[a-zA-Z]:/.test(path)
    const separator = isWin ? '\\' : '/'
    const parts = path.split(separator).filter(Boolean)
    
    if (parts.length <= 1) {
      if (isWin) return '' // Drive root
      return '/'
    }
    
    parts.pop()
    let parent = parts.join(separator)
    if (!isWin && !parent.startsWith('/')) {
      parent = '/' + parent
    }
    if (isWin && parent.endsWith(':')) {
      parent += '\\'
    }
    return parent
  }

  const getBreadcrumbs = (path) => {
    if (!path) return []
    const isWin = path.includes('\\') || /^[a-zA-Z]:/.test(path)
    const separator = isWin ? '\\' : '/'
    const parts = path.split(separator).filter(Boolean)
    
    const crumbs = []
    let accumulated = ''
    
    if (!isWin) {
      crumbs.push({ name: 'Root (/)', path: '/' })
    }
    
    parts.forEach((part, index) => {
      if (index === 0 && isWin) {
        accumulated = part + '\\'
        crumbs.push({ name: part, path: accumulated })
      } else {
        if (isWin) {
          accumulated += (accumulated.endsWith('\\') ? '' : '\\') + part
        } else {
          accumulated += '/' + part
        }
        crumbs.push({ name: part, path: accumulated })
      }
    })
    
    return crumbs
  }

  const handleSelectDrive = (drive) => {
    setCurrentPath(drive)
  }

  const handleGoUp = () => {
    const parent = getParentPath(currentPath)
    if (parent) {
      setCurrentPath(parent)
    }
  }

  const handleSelectFolder = (folderPath) => {
    setCurrentPath(folderPath)
  }

  const handleConfirm = () => {
    if (currentPath) {
      setWorkspace(currentPath)
      closeFolderPicker()
    }
  }

  const filteredFolders = folders.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const breadcrumbs = getBreadcrumbs(currentPath)
  const hasParent = !!getParentPath(currentPath)

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeFolderPicker()}>
      <div className="folder-picker-modal modal-container">
        <div className="modal-header">
          <div className="modal-title">
            <span className="modal-title-icon">📂</span>
            <span>{language === 'vi' ? 'Chọn Thư mục làm việc (Workspace)' : 'Select Workspace Folder'}</span>
          </div>
          <button className="icon-btn" onClick={closeFolderPicker} title="Close">
            <X size={16} />
          </button>
        </div>

        <div className="modal-body folder-picker-body">
          {/* Path bar & navigation */}
          <div className="folder-picker-nav">
            {drives.length > 1 && (
              <div className="drive-select-wrapper">
                <HardDrive size={14} className="drive-icon" />
                <select
                  className="settings-input drive-select"
                  value={drives.find(d => currentPath.startsWith(d)) || ''}
                  onChange={e => handleSelectDrive(e.target.value)}
                >
                  <option value="" disabled>Drive</option>
                  {drives.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            )}

            <button
              className="icon-btn up-btn"
              onClick={handleGoUp}
              disabled={!hasParent}
              title={language === 'vi' ? 'Thư mục cha' : 'Up One Level'}
            >
              <ArrowUp size={14} />
            </button>

            {/* Breadcrumbs */}
            <div className="folder-picker-breadcrumbs">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={crumb.path}>
                  {idx > 0 && <ChevronRight size={10} className="breadcrumb-separator" />}
                  <span
                    className="breadcrumb-item"
                    onClick={() => setCurrentPath(crumb.path)}
                  >
                    {crumb.name}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Current Path Input */}
          <div className="folder-picker-path-input-wrapper">
            <input
              type="text"
              className="settings-input path-text-input"
              value={currentPath}
              onChange={e => setCurrentPath(e.target.value)}
              placeholder="C:\path\to\folder"
            />
            <button className="icon-btn" onClick={() => setCurrentPath(currentPath)} title="Reload">
              <RefreshCw size={14} />
            </button>
          </div>

          {/* Search filter */}
          <div className="folder-picker-search">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              className="settings-input search-input"
              placeholder={language === 'vi' ? 'Lọc thư mục...' : 'Filter folders...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Folders List */}
          <div className="folders-list-container">
            {isLoading ? (
              <div className="picker-loading">
                <RefreshCw size={24} className="spinner" />
                <span>{language === 'vi' ? 'Đang đọc thư mục...' : 'Reading directory...'}</span>
              </div>
            ) : error ? (
              <div className="picker-error">
                <span>⚠️ {error}</span>
              </div>
            ) : filteredFolders.length === 0 ? (
              <div className="picker-empty">
                <span>{language === 'vi' ? 'Không tìm thấy thư mục con nào' : 'No subfolders found'}</span>
              </div>
            ) : (
              <div className="folders-grid">
                {filteredFolders.map(folder => (
                  <div
                    key={folder.path}
                    className="folder-grid-item"
                    onDoubleClick={() => handleSelectFolder(folder.path)}
                    onClick={() => setCurrentPath(folder.path)}
                  >
                    <Folder className="folder-item-icon" size={24} />
                    <span className="folder-item-name" title={folder.name}>
                      {folder.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <div className="folder-picker-footer-left">
            <span className="selected-path-preview">
              {language === 'vi' ? 'Thư mục đang chọn: ' : 'Selected: '}
              <strong>{currentPath}</strong>
            </span>
          </div>
          <div className="folder-picker-actions">
            <button className="btn btn-secondary" onClick={closeFolderPicker}>
              {language === 'vi' ? 'Hủy' : 'Cancel'}
            </button>
            <button className="btn btn-primary" onClick={handleConfirm} disabled={!currentPath || isLoading}>
              <Check size={14} style={{ marginRight: '6px' }} />
              {language === 'vi' ? 'Chọn thư mục này' : 'Select Folder'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
