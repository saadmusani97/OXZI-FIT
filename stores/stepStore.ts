import { create } from 'zustand'

interface StepStore {
  todaySteps: number
  goalReached: boolean
  setSteps: (steps: number) => void
  setGoalReached: (reached: boolean) => void
}

export const useStepStore = create<StepStore>((set) => ({
  todaySteps: 0,
  goalReached: false,
  setSteps: (steps) => set({ todaySteps: steps }),
  setGoalReached: (reached) => set({ goalReached: reached }),
}))
