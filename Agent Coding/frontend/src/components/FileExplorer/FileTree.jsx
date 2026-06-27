import React, { useState, useCallback } from 'react'
import { ChevronRight, ChevronDown, FilePlus, FolderPlus, Trash2, RotateCcw } from 'lucide-react'
import useFileStore from '../../stores/fileStore'
import { getFileIcon } from '../../utils/fileUtils'
import './FileTree.css'

function TreeNode({ node, depth = 0 }) {
  const [expanded, setExpanded] = useState(depth === 0)
  const { openFile, activeFilePath, deleteFile } = useFileStore()

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
          <button className="tree-action-btn" onClick={handleDelete} title="Delete">
            <Trash2 size={12} />
          </button>
        </div>
      </div>
      {isDir && expanded && node.children && (
        <div className="tree-children">
          {node.children.map((child, i) => (
            <TreeNode key={child.path || i} node={child} depth={depth + 1} />
          ))}
          {node.children.length === 0 && (
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

  const handleCreateFile = async () => {
    const name = prompt('File name:')
    if (name && workspace) {
      await createFile(`${workspace}/${name}`)
    }
  }

  const handleCreateDir = async () => {
    const name = prompt('Folder name:')
    if (name && workspace) {
      await createDirectory(`${workspace}/${name}`)
    }
  }

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
