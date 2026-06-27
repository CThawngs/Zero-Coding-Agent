import React, { useState, useCallback, useEffect, useRef } from 'react'
import Sidebar from '../Sidebar/Sidebar'
import ChatWindow from '../Chat/ChatWindow'
import FileExplorer from '../FileExplorer/FileExplorer'
import SettingsModal from '../Settings/SettingsModal'
import './AppLayout.css'

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [explorerOpen, setExplorerOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(280)
  const [explorerWidth, setExplorerWidth] = useState(360)
  const [dragging, setDragging] = useState(null)
  const startXRef = useRef(0)
  const startWidthRef = useRef(0)

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e) => {
      const isMac = navigator.platform.includes('Mac')
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey

      if (ctrlOrCmd && e.key === 'b') {
        e.preventDefault()
        setSidebarOpen(v => !v)
      }
      if (ctrlOrCmd && e.key === 'e') {
        e.preventDefault()
        setExplorerOpen(v => !v)
      }
      if (ctrlOrCmd && e.key === ',') {
        e.preventDefault()
        setShowSettings(v => !v)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  // Resize handlers
  const startResize = useCallback((panel) => (e) => {
    e.preventDefault()
    setDragging(panel)
    startXRef.current = e.clientX
    startWidthRef.current = panel === 'sidebar' ? sidebarWidth : explorerWidth

    const onMove = (ev) => {
      const dx = ev.clientX - startXRef.current
      if (panel === 'sidebar') {
        setSidebarWidth(Math.max(200, Math.min(480, startWidthRef.current - dx)))
      } else {
        setExplorerWidth(Math.max(240, Math.min(600, startWidthRef.current + dx)))
      }
    }
    const onUp = () => {
      setDragging(null)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [sidebarWidth, explorerWidth])

  return (
    <div className="app-layout">
      {/* File Explorer (Left Panel now) */}
      <div
        className={`explorer-panel ${explorerOpen ? 'open' : 'collapsed'} ${dragging === 'explorer' ? 'no-transition' : ''}`}
        style={{ width: explorerOpen ? explorerWidth : 0 }}
      >
        {explorerOpen && <FileExplorer />}
      </div>

      {/* Explorer Resize Handle */}
      {explorerOpen && (
        <div
          className="resize-handle"
          onMouseDown={startResize('explorer')}
          title="Drag to resize"
        />
      )}

      {/* Main Chat Area (Center Panel) */}
      <div className="chat-panel">
        <ChatWindow
          onToggleSidebar={() => setSidebarOpen(v => !v)}
          onToggleExplorer={() => setExplorerOpen(v => !v)}
          sidebarOpen={sidebarOpen}
          explorerOpen={explorerOpen}
        />
      </div>

      {/* Sidebar Resize Handle */}
      {sidebarOpen && (
        <div
          className="resize-handle"
          onMouseDown={startResize('sidebar')}
          title="Drag to resize"
        />
      )}

      {/* Sidebar (Conversations history / Right Panel now) */}
      <div
        className={`sidebar-panel ${sidebarOpen ? 'open' : 'collapsed'} ${dragging === 'sidebar' ? 'no-transition' : ''}`}
        style={{ width: sidebarOpen ? sidebarWidth : 0 }}
      >
        <Sidebar
          onSettings={() => setShowSettings(true)}
          onExplorerToggle={() => setExplorerOpen(v => !v)}
        />
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  )
}
