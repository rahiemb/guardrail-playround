import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ValidationResult } from '../types'

export interface PipelineRunLog {
  id: string
  timestamp: number
  totalTimeMs: number
  blocked: boolean
  guardrailResults: ValidationResult[]
}

interface AnalyticsState {
  runs: PipelineRunLog[]
  recordRun: (run: Omit<PipelineRunLog, 'id' | 'timestamp'>) => void
  clearAnalytics: () => void
}

export const useAnalyticsStore = create<AnalyticsState>()(
  persist(
    (set) => ({
      runs: [],
      recordRun: (run) =>
        set((state) => ({
          runs: [
            ...state.runs,
            {
              ...run,
              id: `run-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              timestamp: Date.now(),
            },
          ],
        })),
      clearAnalytics: () => set({ runs: [] }),
    }),
    {
      name: 'guardrail-playground-analytics',
    }
  )
)
