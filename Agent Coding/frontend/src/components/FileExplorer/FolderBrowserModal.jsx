import React, { useState, useEffect, useCallback } from 'react'
import { X, Folder, FolderOpen, ChevronRight, FolderPlus, Home, ArrowUp } from 'lucide-react'
import { api } from '../../utils/api'
import { useTranslation } from '../../utils/translations'

export default function FolderBrowserModal({ isOpen, onClose, onSelect, currentWorkspace }) {
  const t = useTranslation()
  const [currentPath, setCurrentPath] = useState('')
  const [directories, setDirectories] = useState([])
  const [parent, setParent] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isOpen) return
    // Start from workspace root or home
    if (currentWorkspace) {
      setCurrentPath(currentWorkspace)
      loadDirs(currentWorkspace)
    } else {
      loadDirs('')
    }
  }, [isOpen, currentWorkspace])

  const loadDirs = useCallback(async (dirPath) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.browseDirs(dirPath)
      if (res && res.error === 'cannot_read') {
        setError(t?.('cannotReadFolder') || 'Cannot read this folder')
        setDirectories([])
      } else if (res) {
        setDirectories(res.directories || [])
        setCurrentPath(res.path || dirPath)
        setParent(res.parent)
      }
    } catch (err) {
      setError(err.message || 'Failed to load directories')
    } finally {
      setLoading(false)
    }
  }, [t])

  const handleClickDir = (dir) => {
    loadDirs(dir.path)
    setCurrentPath(dir.path)
  }

  const handleDoubleClickDir = (dir) => {
    loadDirs(dir.path)
    setCurrentPath(dir.path)
  }

  const handleParent = () => {
    if (parent) {
      loadDirs(parent)
      setCurrentPath(parent)
    }
  }

  const handleSelect = () => {
    if (currentPath) {
      onSelect(currentPath)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div className="modal-overlay" onClick={onClose} style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.5)', zIndex: 9999
      }} />
      {/* Modal */}
      <div className="modal-container" style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: '520px', maxHeight: '400px', background: 'var(--bg-primary)',
        border: '1px solid var(--border)', borderRadius: '8px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)', zIndex: 10000,
        display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', borderBottom: '1px solid var(--border)'
        }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--text-primary)', fontWeight: 600, fontSize: '13px' }}>
            <FolderOpen size={16} />
            <span>{t?.('workspaceBrowser') || 'Browse Workspace Folder'}</span>
          </div>
          <button className="icon-btn" onClick={onClose} title="Close">
            <X size={16} />
          </button>
        </div>

        {/* Breadcrumb path */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          padding: '6px 14px', borderBottom: '1px solid var(--border)',
          background: 'var(--bg-secondary)', fontSize: '11px', color: 'var(--text-secondary)',
          overflow: 'hidden'
        }}>
          <button className="icon-btn icon-btn-sm" onClick={() => loadDirs('')} title="Home / Root">
            <Home size={12} />
          </button>
          <button className="icon-btn icon-btn-sm" onClick={handleParent} disabled={!parent}>
            <ArrowUp size={12} />
          </button>
          <span style={{ marginLeft: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {currentPath}
          </span>
        </div>

        {/* Directory list */}
        <div style={{ flex: 1, overflow: 'auto', padding: '4px 0', minHeight: '200px' }}>
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '160px', color: 'var(--text-muted)', fontSize: '12px' }}>
              <div className="loading-spinner" style={{ width: 16, height: 16 }} /> Loading...
            </div>
          )}
          {error && (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
              {error}
            </div>
          )}
          {!loading && !error && directories.length === 0 && (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
              {t?.('emptyFolder') || 'Empty folder'}
            </div>
          )}
          {!loading && !error && directories.map(dir => (
            <div
              key={dir.path}
              className="browser-dir-item"
              onClick={() => handleClickDir(dir)}
              onDoubleClick={() => handleDoubleClickDir(dir)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '4px 14px', cursor: 'pointer',
                fontSize: '12px', color: 'var(--text-primary)',
                transition: 'background 0.1s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Folder size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {dir.name}
              </span>
              <ChevronRight size={10} style={{ color: 'var(--text-muted)', marginLeft: 'auto', flexShrink: 0 }} />
            </div>
          ))}
        </div>

        {/* Footer actions */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', borderTop: '1px solid var(--border)'
        }}>
          <span style={{
            fontSize: '11px', color: 'var(--text-muted)',
            overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px'
          }}>
            {currentPath}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>
              {t?.('cancel') || 'Cancel'}
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleSelect} disabled={!currentPath}>
              {t?.('selectFolder') || 'Select Folder'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
