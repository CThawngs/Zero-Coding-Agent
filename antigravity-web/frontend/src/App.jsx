import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppLayout from './components/Layout/AppLayout'
import SetupModal from './components/SetupModal'
import useProviderStore from './stores/providerStore'
import useChatStore from './stores/chatStore'
import useSettingsStore from './stores/settingsStore'

import useFileStore from './stores/fileStore'

export default function App() {
  const [showSetup, setShowSetup] = useState(false)
  const { isConfigured, providers } = useProviderStore()
  const { loadConversations, activeConversation } = useChatStore()
  const workspace = useFileStore(state => state.workspace)

  const theme = useSettingsStore(state => state.theme)

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('theme-light')
      document.body.classList.remove('theme-dark')
    } else {
      document.body.classList.remove('theme-light')
      document.body.classList.add('theme-dark')
    }
  }, [theme])

  useEffect(() => {
    // Reset active conversation if it belongs to a different workspace
    if (activeConversation && activeConversation.workspace !== workspace) {
      useChatStore.setState({ activeConversationId: null, activeConversation: null })
    }
  }, [workspace, activeConversation])

  useEffect(() => {
    // Check if any provider is configured on mount
    const configured = isConfigured()
    if (!configured) {
      setShowSetup(true)
    }
    // Load conversations
    loadConversations()

    // Automatically load default workspace on localhost if not set
    const isCloud = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    if (!workspace && !isCloud) {
      fetch('/api/files/default-workspace')
        .then(res => res.json())
        .then(data => {
          if (data && data.success && data.path) {
            useFileStore.getState().setWorkspace(data.path)
          }
        })
        .catch(err => console.error('Failed to load default workspace:', err))
    }
  }, [])

  const handleSetupComplete = () => {
    setShowSetup(false)
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={
          <>
            <AppLayout />
            {showSetup && (
              <SetupModal onComplete={handleSetupComplete} />
            )}
          </>
        } />
      </Routes>
    </BrowserRouter>
  )
}
