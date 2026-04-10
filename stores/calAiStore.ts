import { create } from 'zustand'
import { NutritionScanResult } from '../types/database'

interface CalAiStore {
  pendingScan: NutritionScanResult | null
  isScanning: boolean
  setPendingScan: (result: NutritionScanResult | null) => void
  setIsScanning: (scanning: boolean) => void
}

export const useCalAiStore = create<CalAiStore>((set) => ({
  pendingScan: null,
  isScanning: false,
  setPendingScan: (result) => set({ pendingScan: result }),
  setIsScanning: (scanning) => set({ isScanning: scanning }),
}))
