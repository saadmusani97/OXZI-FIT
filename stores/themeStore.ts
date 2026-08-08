import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface ThemeStore {
  isDark: boolean
  toggleTheme: () => void
  loadTheme: () => Promise<void>
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  isDark: true,
  toggleTheme: async () => {
    const next = !get().isDark
    set({ isDark: next })
    await AsyncStorage.setItem('theme', next ? 'dark' : 'light')
  },
  loadTheme: async () => {
    const saved = await AsyncStorage.getItem('theme')
    if (saved) set({ isDark: saved === 'dark' })
  },
}))
