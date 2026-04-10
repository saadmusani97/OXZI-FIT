import { create } from 'zustand'
import type { ActivitySummary } from '../lib/routeMetrics'

interface ActivityShareStore {
  summary: ActivitySummary | null
  setSummary: (summary: ActivitySummary) => void
  clearSummary: () => void
}

export const useActivityShareStore = create<ActivityShareStore>((set) => ({
  summary: null,
  setSummary: (summary) => set({ summary }),
  clearSummary: () => set({ summary: null }),
}))
