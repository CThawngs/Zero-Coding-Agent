import React, { useEffect, useRef, useState, useCallback } from 'react'
import { EditorView } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { basicSetup } from 'codemirror'
import { oneDark } from '@codemirror/theme-one-dark'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { css } from '@codemirror/lang-css'
import { html } from '@codemirror/lang-html'
import { json } from '@codemirror/lang-json'
import { markdown } from '@codemirror/lang-markdown'

import { Save, X, Circle } from 'lucide-react'
import useFileStore from '../../stores/fileStore'
import { getLanguage } from '../../utils/fileUtils'
import './CodeEditor.css'

function getLanguageExtension(filename) {
  const lang = getLanguage(filename)
  switch (lang) {
    case 'javascript': return javascript({ jsx: true })
    case 'typescript': return javascript({ typescript: true, jsx: true })
    case 'python': return python()
    case 'css': return css()
    case 'html': return html()
    case 'json': return json()
    case 'markdown': return markdown()
    default: return []
  }
}

export default function CodeEditor() {
  const editorRef = useRef(null)
  const viewRef = useRef(null)
  const { activeFilePath, openFiles, saveFile, closeFile, modifiedFiles } = useFileStore()

  const activeFile = openFiles.find(f => f.path === activeFilePath)
  const isModified = modifiedFiles[activeFilePath] !== undefined

  useEffect(() => {
    if (!editorRef.current || !activeFile) return

    // Destroy old view
    if (viewRef.current) {
      viewRef.current.destroy()
      viewRef.current = null
    }

    const content = modifiedFiles[activeFilePath] ?? activeFile.content ?? ''
    const langExt = getLanguageExtension(activeFile.name || activeFile.path?.split('/').pop() || '')

    const state = EditorState.create({
      doc: content,
      extensions: [
        basicSetup,
        oneDark,
        langExt,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const newContent = update.state.doc.toString()
            useFileStore.getState().setModified(activeFilePath, newContent)
          }
        }),
        EditorView.theme({
          '&': { height: '100%', fontSize: '13px' },
          '.cm-scroller': { overflow: 'auto', fontFamily: "'JetBrains Mono', 'Fira Code', monospace" },
          '.cm-editor': { height: '100%' },
        }),
      ],
    })

    viewRef.current = new EditorView({ state, parent: editorRef.current })

    return () => {
      viewRef.current?.destroy()
      viewRef.current = null
    }
  }, [activeFilePath, activeFile?.content])

  const handleSave = useCallback(async () => {
    if (!activeFilePath || !isModified) return
    const content = modifiedFiles[activeFilePath]
    await saveFile(activeFilePath, content)
  }, [activeFilePath, isModified, modifiedFiles, saveFile])

  // Ctrl+S
  useEffect(() => {
    const handleKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleSave])

  if (!activeFile) return null

  const filename = activeFile.name || activeFile.path?.split(/[\\/]/).pop() || 'file'

  return (
    <div className="code-editor">
      {/* Tabs */}
      <div className="editor-tabs">
        {openFiles.map(f => {
          const name = f.name || f.path?.split(/[\\/]/).pop() || 'file'
          const mod = modifiedFiles[f.path] !== undefined
          return (
            <div
              key={f.path}
              className={`editor-tab ${f.path === activeFilePath ? 'active' : ''}`}
              onClick={() => useFileStore.getState().setActiveFile(f.path)}
            >
              {mod && <Circle size={8} className="tab-dot" fill="currentColor" />}
              <span>{name}</span>
              <button
                className="tab-close"
                onClick={(e) => { e.stopPropagation(); closeFile(f.path) }}
              >
                <X size={12} />
              </button>
            </div>
          )
        })}
      </div>

      {/* Action bar */}
      <div className="editor-bar">
        <span className="editor-filename">{filename}</span>
        <div className="editor-bar-actions">
          {isModified && (
            <button className="btn-primary btn-sm" onClick={handleSave}>
              <Save size={12} /> Save
            </button>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="editor-container" ref={editorRef} />
    </div>
  )
}
