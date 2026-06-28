import React, { useState, useEffect, useCallback } from 'react'
import { X, Folder, FolderOpen, ChevronRight, ArrowUp, Home, File, Image,
  FileText, FileCode, Settings, Check } from 'lucide-react'
import { api } from '../../utils/api'
import { useTranslation } from '../../utils/translations'

// File icon by extension
function getIconForFile(name) {
  const ext = name.split('.').pop()?.toLowerCase()
  if (['png','jpg','jpeg','gif','svg','webp','bmp'].includes(ext)) return <Image size={13} style={{ color: '#4fc3f7' }} />
  if (['txt','md','json','yaml','yml','toml','xml','ini','cfg'].includes(ext)) return <FileText size={13} style={{ color: '#81c784' }} />
  if (['js','jsx','ts','tsx','py','java','c','cpp','rs','go','rb','php','vue','svelte'].includes(ext)) return <FileCode size={13} style={{ color: '#ffb74d' }} />
  if (['css','scss','sass','less','html','htm'].includes(ext)) return <FileCode size={13} style={{ color: '#ba68c8' }} />
  if (['env','gitignore','dockerfile','sh','bat','ps1','lock'].includes(ext) || name.startsWith('.')) return <Settings size={13} style={{ color: '#90a4ae' }} />
  return <File size={13} style={{ color: 'var(--text-muted)' }} />
}

// Format file size
function formatSize(bytes) {
  if (bytes < 1024) return bytes + 'B'
  if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + 'KB'
  return (bytes/(1024*1024)).toFixed(1) + 'MB'
}

export default function FolderBrowserModal({ isOpen, onClose, onSelect, currentWorkspace }) {
  const t = useTranslation()
  const [currentPath, setCurrentPath] = useState('')
  const [items, setItems] = useState([])
  const [parent, setParent] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedDir, setSelectedDir] = useState(null)

  const loadPath = useCallback(async (dirPath) => {
    setLoading(true)
    setError(null)
    setSelectedDir(null)
    try {
      const res = await api.browseDirs(dirPath)
      if (res && res.error === 'cannot_read') {
        setError(t?.('cannotReadFolder') || 'Cannot read this folder')
        setItems([])
      } else if (res) {
        const sorted = [...(res.entries || [])].sort((a, b) => {
          if (a.isDir && !b.isDir) return -1
          if (!a.isDir && b.isDir) return 1
          return a.name.localeCompare(b.name)
        })
        setItems(sorted)
        setCurrentPath(res.path || dirPath)
        setParent(res.parent)
      }
    } catch (err) {
      setError(err.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    if (isOpen) {
      if (currentWorkspace) {
        loadPath(currentWorkspace)
      } else {
        loadPath('')
      }
    }
  }, [isOpen, loadPath, currentWorkspace])

  // Handle folder click = attach & close immediately
  const handleFolderClick = (item) => {
    // Attach this folder as workspace and close modal
    onSelect(item.path)
    onClose()
  }

  // Handle folder to preview (just highlight/select it, user can then click Attach)
  const handleFolderPreview = (item) => {
    setSelectedDir(item)
  }

  const handleParent = () => {
    if (parent) {
      loadPath(parent)
      setCurrentPath(parent)
    }
  }

  const handleRoot = () => {
    loadPath('')
  }

  const handleAttach = () => {
    // Attach highlighted folder as workspace
    const target = selectedDir || items.find(i => i.isDir && currentWorkspace && i.path === currentWorkspace)
    if (target) {
      onSelect(target.path)
      onClose()
    }
  }

  if (!isOpen) return null

  const dirs = items.filter(i => i.isDir)
  const files = items.filter(i => !i.isDir)

  return (
    <>
      <div className="modal-overlay" onClick={onClose} style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.55)', zIndex: 9999
      }} />
      <div className="folder-browser-modal" style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: '600px', maxHeight: '500px', background: 'var(--bg-primary)',
        border: '1px solid var(--border)', borderRadius: '10px',
        boxShadow: '0 12px 48px rgba(0,0,0,0.4)', zIndex: 10000,
        display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', borderBottom: '1px solid var(--border)'
        }}>
          <div style={{
            fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <FolderOpen size={16} />
            <span>{t?.('workspaceBrowser') || 'Browse Workspace Folder'}</span>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Path bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          padding: '6px 16px', borderBottom: '1px solid var(--border)',
          background: 'var(--bg-secondary)', fontSize: '11px'
        }}>
          <button className="icon-btn icon-btn-sm" onClick={handleRoot} title="Home / Root">
            <Home size={12} />
          </button>
          <button className="icon-btn icon-btn-sm" onClick={handleParent} disabled={!parent} title="Go to parent">
            <ArrowUp size={12} />
          </button>
          <span style={{
            marginLeft: '6px', color: 'var(--text-secondary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}>
            {currentPath || '/'}
          </span>
        </div>

        {/* Content: list of entries (folders + files) */}
        <div style={{
          flex: 1, overflow: 'auto', minHeight: '240px'
        }}>
          {loading && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              height: '200px', color: 'var(--text-muted)', fontSize: '12px', gap: '8px'
            }}>
              <div className="loading-spinner" /> Loading...
            </div>
          )}
          {error && !loading && (
            <div style={{
              padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px'
            }}>
              {error}
            </div>
          )}
          {!loading && !error && items.length === 0 && (
            <div style={{
              padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px'
            }}>
              {t?.('emptyFolder') || 'This folder is empty'}
            </div>
          )}
          {!loading && !error && (
            <>
              {/* Folders */}
              {dirs.map(item => {
                const isAttached = currentWorkspace && item.path === currentWorkspace
                const isSelected = selectedDir && selectedDir.path === item.path
                return (
                  <div
                    key={item.path + '-dir'}
                    className="browser-entry"
                    onClick={() => handleFolderPreview(item)}
                    onDoubleClick={() => handleFolderClick(item)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '5px 20px', cursor: 'pointer',
                      fontSize: '12px', color: 'var(--text-primary)',
                      transition: 'background 0.1s',
                      background: isSelected ? 'var(--accent-subtle)' : 'transparent',
                      borderLeft: isAttached ? '2px solid var(--accent)' : isSelected ? '2px solid var(--border)' : '2px solid transparent'
                    }}
                  >
                    {isAttached ? (
                      <Check size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                    ) : (
                      <Folder size={13} style={{ color: '#ffd54f', flexShrink: 0 }} />
                    )}
                    <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: isAttached ? 600 : 400 }}>
                      {item.name}
                    </span>
                    {!isAttached && (
                      <ChevronRight size={10} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    )}
                  </div>
                )
              })}

              {/* Separator */}
              {dirs.length > 0 && files.length > 0 && (
                <div style={{
                  margin: '2px 20px', borderTop: '1px solid var(--border)',
                  opacity: 0.5
                }} />
              )}

              {/* Files */}
              {files.map(item => (
                <div
                  key={item.path + '-file'}
                  className="browser-entry"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '5px 20px', cursor: 'default',
                    fontSize: '12px', color: 'var(--text-secondary)',
                    transition: 'background 0.1s'
                  }}
                >
                  {getIconForFile(item.name)}
                  <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.name}
                  </span>
                  {item.size != null && (
                    <span style={{ color: 'var(--text-muted)', fontSize: '10px', flexShrink: 0 }}>
                      {formatSize(item.size)}
                    </span>
                  )}
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', borderTop: '1px solid var(--border)',
          background: 'var(--bg-secondary)'
        }}>
          <span style={{
            fontSize: '11px', color: 'var(--text-muted)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '350px'
          }}>
            {selectedDir ? selectedDir.name : (currentPath ? currentPath.split('/').pop() : (t?.('rootPath') || 'Root'))}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>
              {t?.('cancel') || 'Cancel'}
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleAttach} disabled={!selectedDir && !currentPath}>
              <FolderOpen size={13} style={{ marginRight: '4px', display: 'inline', verticalAlign: 'text-bottom' }} />
              {t?.('open') || 'Open'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
