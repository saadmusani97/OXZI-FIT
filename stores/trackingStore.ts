import { create } from 'zustand'
import { Coordinate } from '../types/database'

type ActivityType = 'run' | 'walk' | 'cycle'

interface TrackingStore {
  isRecording: boolean
  coordinates: Coordinate[]
  elapsedSeconds: number
  distanceKm: number
  currentPace: number
  activityType: ActivityType
  startRecording: (type: ActivityType) => void
  addCoordinate: (coord: Coordinate) => void
  setElapsed: (seconds: number) => void
  setDistance: (km: number) => void
  setPace: (pace: number) => void
  stopRecording: () => Coordinate[]
  reset: () => void
}

export const useTrackingStore = create<TrackingStore>((set, get) => ({
  isRecording: false,
  coordinates: [],
  elapsedSeconds: 0,
  distanceKm: 0,
  currentPace: 0,
  activityType: 'run',
  startRecording: (type) => set({ isRecording: true, activityType: type, coordinates: [], elapsedSeconds: 0, distanceKm: 0, currentPace: 0 }),
  addCoordinate: (coord) => set((state) => ({ coordinates: [...state.coordinates, coord] })),
  setElapsed: (seconds) => set({ elapsedSeconds: seconds }),
  setDistance: (km) => set({ distanceKm: km }),
  setPace: (pace) => set({ currentPace: pace }),
  stopRecording: () => {
    const coords = get().coordinates
    set({ isRecording: false })
    return coords
  },
  reset: () => set({ isRecording: false, coordinates: [], elapsedSeconds: 0, distanceKm: 0, currentPace: 0 }),
}))
