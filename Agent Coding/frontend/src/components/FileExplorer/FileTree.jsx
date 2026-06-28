import React, { useState, useRef, useEffect } from 'react'
import { ChevronRight, ChevronDown, FilePlus, FolderPlus, Trash2, RotateCcw, Check, X } from 'lucide-react'
import useFileStore from '../../stores/fileStore'
import useSettingsStore from '../../stores/settingsStore'
import { useTranslation } from '../../utils/translations'
import { getFileIcon } from '../../utils/fileUtils'
import './FileTree.css'

// Common file extensions for validation
const FILE_EXTENSIONS = [
  '.txt', '.md', '.json', '.js', '.jsx', '.ts', '.tsx', '.py', '.html', '.css',
  '.scss', '.yaml', '.yml', '.xml', '.sh', '.bash', '.bat', '.ps1', '.sql',
  '.java', '.c', '.cpp', '.h', '.hpp', '.rs', '.go', '.rb', '.php', '.swift',
  '.kt', '.toml', '.ini', '.cfg', '.env', '.gitignore', '.dockerfile',
  '.vue', '.svelte', '. astro', '.prisma', '.graphql', '.proto',
]

function InlineNewFileInput({ type, basePath, onConfirm, onCancel, depth = 1 }) {
  const [name, setName] = useState('')
  const inputRef = useRef(null)
  const isSubmitting = useRef(false)
  const language = useSettingsStore(state => state.language)
  const t = useTranslation(language)

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus()
  }, [])

  const handleSubmit = () => {
    if (isSubmitting.current) return
    const trimmed = name.trim()
    if (!trimmed) {
      onCancel()
      return
    }
    if (type === 'file') {
      // Validate: must have extension
      const hasExtension = FILE_EXTENSIONS.some(ext => trimmed.toLowerCase().endsWith(ext)) || (trimmed.includes('.') && trimmed.split('.').pop().length > 0)
      if (!hasExtension) {
        isSubmitting.current = true
        alert(language === 'vi'
          ? 'Vui lòng nhập phần mở rộng của tệp (ví dụ: .txt, .md, .json, .py, .html, .css)'
          : 'Please specify a valid file extension (e.g., .txt, .md, .json, .py, .html, .css)'
        )
        isSubmitting.current = false
        setTimeout(() => { if (inputRef.current) inputRef.current.focus() }, 50)
        return
      }
      onConfirm(`${basePath}/${trimmed}`)
    } else {
      onConfirm(`${basePath}/${trimmed}`)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit()
    if (e.key === 'Escape') onCancel()
  }

  return (
    <div className="tree-item" style={{ paddingLeft: `${12 + depth * 16}px`, gap: '2px', display: 'flex', alignItems: 'center' }}>
      <span className="tree-icon" style={{ fontSize: '12px' }}>
        {type === 'file' ? '📄' : '📁'}
      </span>
      <input
        ref={inputRef}
        type="text"
        className="settings-input"
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          setTimeout(() => {
            if (isSubmitting.current) return
            const trimmed = name.trim()
            if (!trimmed) {
              onCancel()
            } else {
              handleSubmit()
            }
          }, 150)
        }}
        placeholder={type === 'file' ? 'filename.ext' : 'folder-name'}
        style={{ flex: 1, fontSize: '11px', padding: '1px 4px', height: '20px', minWidth: 0 }}
      />
      <button className="icon-btn icon-btn-sm" onMouseDown={e => { e.preventDefault(); handleSubmit() }}>
        <Check size={11} style={{ color: 'var(--success)' }} />
      </button>
      <button className="icon-btn icon-btn-sm" onMouseDown={e => { e.preventDefault(); onCancel() }}>
        <X size={11} />
      </button>
    </div>
  )
}

function TreeNode({ node, depth = 0 }) {
  const [expanded, setExpanded] = useState(depth === 0)
  const [creating, setCreating] = useState(null) // 'file' or 'folder' or null
  const { openFile, activeFilePath, deleteFile, createFile, createDirectory } = useFileStore()
  const language = useSettingsStore(state => state.language)

  const isDir = node.isDir || node.type === 'directory'
  const isActive = !isDir && activeFilePath === node.path

  const handleClick = () => {
    if (isDir) {
      setExpanded(v => !v)
    } else {
      openFile(node.path)
    }
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    if (confirm(`Delete "${node.name}"?`)) {
      deleteFile(node.path)
    }
  }

  const handleCreateFile = (e) => {
    e.stopPropagation()
    setExpanded(true)
    setCreating('file')
  }

  const handleCreateDir = (e) => {
    e.stopPropagation()
    setExpanded(true)
    setCreating('folder')
  }

  const handleCreateConfirm = async (fullPath) => {
    if (creating === 'file') {
      await createFile(fullPath)
    } else {
      await createDirectory(fullPath)
    }
    setCreating(null)
  }

  const handleCreateCancel = () => setCreating(null)

  return (
    <div className="tree-node">
      <div
        className={`tree-item ${isActive ? 'active' : ''} ${isDir ? 'tree-dir' : 'tree-file'}`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
        onClick={handleClick}
      >
        <span className="tree-expand-icon">
          {isDir ? (
            expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />
          ) : null}
        </span>
        <span className="tree-icon">{isDir ? (expanded ? '📂' : '📁') : getFileIcon(node.name)}</span>
        <span className="tree-name">{node.name}</span>
        <div className="tree-actions">
          {isDir && (
            <>
              <button className="tree-action-btn" onClick={handleCreateFile} title="New file">
                <FilePlus size={12} />
              </button>
              <button className="tree-action-btn" onClick={handleCreateDir} title="New folder">
                <FolderPlus size={12} />
              </button>
            </>
          )}
          <button className="tree-action-btn danger" onClick={handleDelete} title="Delete">
            <Trash2 size={12} />
          </button>
        </div>
      </div>
      {isDir && expanded && (
        <div className="tree-children">
          {creating && (
            <InlineNewFileInput
              type={creating}
              basePath={node.path}
              onConfirm={handleCreateConfirm}
              onCancel={handleCreateCancel}
              depth={depth + 1}
            />
          )}
          {node.children && node.children.map((child, i) => (
            <TreeNode key={child.path || i} node={child} depth={depth + 1} />
          ))}
          {(!node.children || node.children.length === 0) && !creating && (
            <div className="tree-empty" style={{ paddingLeft: `${28 + depth * 16}px` }}>
              Empty folder
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function FileTree() {
  const { fileTree, isLoading, workspace, refreshTree, createFile, createDirectory } = useFileStore()
  const language = useSettingsStore(state => state.language)
  const t = useTranslation(language)
  const [creating, setCreating] = useState(null) // 'file' or 'folder' or null

  const handleCreateFile = () => setCreating('file')
  const handleCreateDir = () => setCreating('folder')

  const handleCreateConfirm = async (fullPath) => {
    if (creating === 'file') {
      await createFile(fullPath)
    } else {
      await createDirectory(fullPath)
    }
    setCreating(null)
  }

  const handleCreateCancel = () => setCreating(null)

  if (isLoading) {
    return (
      <div className="tree-loading">
        <div className="loading-spinner" />
        <span>Loading...</span>
      </div>
    )
  }

  if (!fileTree) {
    return (
      <div className="tree-loading">
        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>No files</span>
      </div>
    )
  }

  return (
    <div className="file-tree">
      {/* Tree actions toolbar */}
      <div className="tree-toolbar">
        <button className="icon-btn icon-btn-sm" onClick={handleCreateFile} title="New file">
          <FilePlus size={13} />
        </button>
        <button className="icon-btn icon-btn-sm" onClick={handleCreateDir} title="New folder">
          <FolderPlus size={13} />
        </button>
        <button className="icon-btn icon-btn-sm" onClick={refreshTree} title="Refresh">
          <RotateCcw size={13} />
        </button>
      </div>
      {/* Inline new file/folder input */}
      {creating && (
        <InlineNewFileInput
          type={creating}
          basePath={workspace}
          onConfirm={handleCreateConfirm}
          onCancel={handleCreateCancel}
        />
      )}
      {/* Tree */}
      {fileTree.children ? (
        fileTree.children.map((node, i) => (
          <TreeNode key={node.path || i} node={node} depth={0} />
        ))
      ) : (
        <TreeNode node={fileTree} depth={0} />
      )}
    </div>
  )
}
