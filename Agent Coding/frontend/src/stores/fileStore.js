import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '../utils/api'
import { getLanguage, isTextFile } from '../utils/fileUtils'

const useFileStore = create(
  persist(
    (set, get) => ({
      // State
      workspace: null,
      fileTree: null,
      activeFilePath: null,
      openFile: null,
      openFiles: [], // [{path, content, language, modified}]
      modifiedFiles: {}, // {path: newContent}
      isLoading: false,
      error: null,
      _ws: null,
      isFolderPickerOpen: false,

      openFolderPicker: () => set({ isFolderPickerOpen: true }),
      closeFolderPicker: () => set({ isFolderPickerOpen: false }),

      // Set workspace
      setWorkspace: async (path) => {
        set({ workspace: path, isLoading: true })
        await get().refreshTree()
        get().setupFileWatcher()
      },

      // Setup WebSocket File Watcher
      setupFileWatcher: () => {
        const { workspace, _ws } = get()
        if (_ws) {
          try {
            _ws.close()
          } catch (e) {}
          set({ _ws: null })
        }
        if (!workspace) return

        let wsUrl = ''
        if (api.getConnectionMode() === 'local') {
          wsUrl = 'ws://localhost:3747'
        } else {
          const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
          wsUrl = `${protocol}//${window.location.host}`
        }

        try {
          const ws = new WebSocket(wsUrl)
          
          ws.onopen = () => {
            console.log('[Watcher] WebSocket connected for path:', workspace)
            ws.send(JSON.stringify({ type: 'watch', path: workspace }))
          }

          ws.onmessage = (e) => {
            try {
              const msg = JSON.parse(e.data)
              if (msg.type === 'file_change') {
                get().refreshTree()
                
                // Realtime reload file content if it is modified externally
                const { activeFilePath, modifiedFiles } = get()
                if (activeFilePath && msg.path && msg.event === 'change') {
                  const normMsgPath = msg.path.replace(/\\/g, '/').toLowerCase()
                  const normActivePath = activeFilePath.replace(/\\/g, '/').toLowerCase()
                  if (normMsgPath === normActivePath && !modifiedFiles[activeFilePath]) {
                    get().reloadActiveFile()
                  }
                }
              }
            } catch (err) {
              console.error('[Watcher] WS parse error:', err)
            }
          }

          ws.onclose = () => {
            set({ _ws: null })
          }

          ws.onerror = (err) => {
            console.error('[Watcher] WebSocket error:', err)
          }

          set({ _ws: ws })
        } catch (err) {
          console.error('[Watcher] Failed to create WebSocket:', err)
        }
      },

      reloadActiveFile: async () => {
        const { activeFilePath } = get()
        if (!activeFilePath) return
        try {
          const res = await api.readFile(activeFilePath)
          const content = typeof res === 'object' && res !== null ? (res.content ?? '') : (res ?? '')
          set(state => {
            const updatedOpenFiles = state.openFiles.map(f => {
              if (f.path === activeFilePath) {
                return { ...f, content, modified: false }
              }
              return f
            })
            const activeOpen = updatedOpenFiles.find(f => f.path === activeFilePath)
            
            const newModified = { ...state.modifiedFiles }
            delete newModified[activeFilePath]

            return {
              openFiles: updatedOpenFiles,
              openFile: activeOpen || state.openFile,
              modifiedFiles: newModified
            }
          })
        } catch (err) {
          console.error('Failed to reload active file:', err)
        }
      },

      // Refresh file tree
      refreshTree: async () => {
        const { workspace } = get()
        if (!workspace) return
        try {
          set({ isLoading: true })
          const tree = await api.getFileTree(workspace)
          set({ fileTree: tree, isLoading: false })
        } catch (err) {
          console.error('Failed to load file tree:', err)
          set({ isLoading: false, fileTree: null })
        }
      },

      // Open file in editor
      openFileInEditor: async (path) => {
        const { openFiles, modifiedFiles } = get()

        // Check if already open
        const existing = openFiles.find(f => f.path === path)
        if (existing) {
          set({ activeFilePath: path, openFile: existing })
          return
        }

        if (!isTextFile(path)) {
          console.warn('Binary file, cannot open in editor:', path)
          return
        }

        try {
          set({ isLoading: true })
          const res = await api.readFile(path)
          const content = typeof res === 'object' && res !== null ? (res.content ?? '') : (res ?? '')
          const language = getLanguage(path)
          const fileEntry = { path, content, language, modified: false }

          set(state => ({
            openFiles: [...state.openFiles, fileEntry],
            activeFilePath: path,
            openFile: fileEntry,
            isLoading: false
          }))
        } catch (err) {
          console.error('Failed to open file:', err)
          set({ isLoading: false })
        }
      },

      // Select open file tab
      selectFile: (path) => {
        const { openFiles, modifiedFiles } = get()
        const file = openFiles.find(f => f.path === path)
        if (!file) return
        const content = modifiedFiles[path] !== undefined ? modifiedFiles[path] : file.content
        set({
          activeFilePath: path,
          openFile: { ...file, content }
        })
      },

      // Update file content (in memory)
      updateFileContent: (path, content) => {
        set(state => {
          const original = state.openFiles.find(f => f.path === path)
          const isModified = original ? content !== original.content : true
          return {
            modifiedFiles: isModified
              ? { ...state.modifiedFiles, [path]: content }
              : (() => { const m = { ...state.modifiedFiles }; delete m[path]; return m })(),
            openFiles: state.openFiles.map(f =>
              f.path === path ? { ...f, modified: isModified } : f
            ),
            openFile: state.activeFilePath === path
              ? { ...state.openFile, content, modified: isModified }
              : state.openFile
          }
        })
      },

      // Save file - accepts optional content param (for CodeEditor which passes content)
      saveFile: async (path, contentOverride) => {
        const { modifiedFiles } = get()
        const content = contentOverride !== undefined ? contentOverride : modifiedFiles[path]
        if (content === undefined) return

        try {
          await api.writeFile(path, content)
          set(state => {
            const m = { ...state.modifiedFiles }
            delete m[path]
            return {
              modifiedFiles: m,
              openFiles: state.openFiles.map(f =>
                f.path === path ? { ...f, content, modified: false } : f
              ),
              openFile: state.activeFilePath === path
                ? { ...state.openFile, content, modified: false }
                : state.openFile
            }
          })
        } catch (err) {
          console.error('Failed to save file:', err)
        }
      },

      // Alias: setModified (used by CodeEditor)
      setModified: (path, content) => {
        set(state => ({
          modifiedFiles: { ...state.modifiedFiles, [path]: content }
        }))
      },

      // Alias: setActiveFile (used by CodeEditor tabs)
      setActiveFile: (path) => {
        const { openFiles, modifiedFiles } = get()
        const file = openFiles.find(f => f.path === path)
        if (!file) return
        set({ activeFilePath: path, openFile: file })
      },

      // Alias: openFile -> openFileInEditor (used by FileTree)
      openFile: async (path) => {
        return get().openFileInEditor(path)
      },

      // Close file tab
      closeFile: (path) => {
        set(state => {
          const newOpenFiles = state.openFiles.filter(f => f.path !== path)
          const newModified = { ...state.modifiedFiles }
          delete newModified[path]

          let newActivePath = state.activeFilePath
          let newOpenFile = state.openFile

          if (state.activeFilePath === path) {
            const idx = state.openFiles.findIndex(f => f.path === path)
            const next = newOpenFiles[Math.max(0, idx - 1)]
            newActivePath = next?.path || null
            newOpenFile = next || null
          }

          return {
            openFiles: newOpenFiles,
            modifiedFiles: newModified,
            activeFilePath: newActivePath,
            openFile: newOpenFile
          }
        })
      },

      // Create file
      createFile: async (path) => {
        try {
          await api.createFile(path)
          await get().refreshTree()
          await get().openFileInEditor(path)
        } catch (err) {
          console.error('Failed to create file:', err)
        }
      },

      // Delete file
      deleteFile: async (path) => {
        try {
          await api.deleteFile(path)
          get().closeFile(path)
          await get().refreshTree()
        } catch (err) {
          console.error('Failed to delete file:', err)
        }
      },

      // Create directory
      createDirectory: async (path) => {
        try {
          await api.createDirectory(path)
          await get().refreshTree()
        } catch (err) {
          console.error('Failed to create directory:', err)
        }
      },

      // Rename
      rename: async (oldPath, newPath) => {
        try {
          await api.rename(oldPath, newPath)
          await get().refreshTree()
          // Update open files
          set(state => ({
            openFiles: state.openFiles.map(f =>
              f.path === oldPath ? { ...f, path: newPath } : f
            ),
            activeFilePath: state.activeFilePath === oldPath ? newPath : state.activeFilePath,
            openFile: state.activeFilePath === oldPath
              ? { ...state.openFile, path: newPath }
              : state.openFile
          }))
        } catch (err) {
          console.error('Rename failed:', err)
        }
      },

      // Clear workspace
      clearWorkspace: () => {
        const { _ws } = get()
        if (_ws) {
          try {
            _ws.close()
          } catch (e) {}
        }
        set({
          workspace: null,
          fileTree: null,
          activeFilePath: null,
          openFile: null,
          openFiles: [],
          modifiedFiles: {},
          _ws: null
        })
      }
    }),
    {
      name: 'antigravity-filestore',
      // Only persist workspace path - not file contents (too large)
      partialize: (state) => ({
        workspace: state.workspace,
      }),
      // On rehydrate, auto-refresh tree if workspace exists
      onRehydrateStorage: () => (state) => {
        if (state && state.workspace) {
          // Defer refresh to next tick so store is fully initialized
          setTimeout(() => {
            state.refreshTree()
            state.setupFileWatcher()
          }, 100)
        }
      }
    }
  )
)

export default useFileStore
