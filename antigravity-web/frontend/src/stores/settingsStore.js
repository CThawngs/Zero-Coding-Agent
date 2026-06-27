import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useSettingsStore = create(
  persist(
    (set) => ({
      theme: 'dark',
      language: 'vi',
      setTheme: (theme) => {
        set({ theme })
        // Apply theme to document body
        if (theme === 'light') {
          document.body.classList.add('theme-light')
          document.body.classList.remove('theme-dark')
        } else {
          document.body.classList.remove('theme-light')
          document.body.classList.add('theme-dark')
        }
      },
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'antigravity-settings',
    }
  )
)

export default useSettingsStore
