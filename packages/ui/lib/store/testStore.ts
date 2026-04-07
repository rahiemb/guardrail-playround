import { create } from 'zustand'
import { runPipeline } from '../api/client'
import type { Guardrail, PipelineRunResult } from '../types'

interface TestState {
  inputText: string
  selectedGuardrails: Guardrail[]
  mode: 'run_all' | 'short_circuit'
  results: PipelineRunResult | null
  isRunning: boolean
  error: string | null

  setInputText: (text: string) => void
  setMode: (mode: 'run_all' | 'short_circuit') => void
  addGuardrail: (g: Guardrail) => void
  removeGuardrail: (id: string) => void
  clearGuardrails: () => void
  runTest: () => Promise<void>
  clearResults: () => void
}

export const useTestStore = create<TestState>((set, get) => ({
  inputText: 'Hello! My name is John Smith and my SSN is 123-45-6789.',
  selectedGuardrails: [],
  mode: 'run_all',
  results: null,
  isRunning: false,
  error: null,

  setInputText: (text) => set({ inputText: text }),
  setMode: (mode) => set({ mode }),

  addGuardrail: (g) =>
    set((state) => {
      if (state.selectedGuardrails.some((x) => x.id === g.id)) return state
      return { selectedGuardrails: [...state.selectedGuardrails, g] }
    }),

  removeGuardrail: (id) =>
    set((state) => ({
      selectedGuardrails: state.selectedGuardrails.filter((g) => g.id !== id),
    })),

  clearGuardrails: () => set({ selectedGuardrails: [] }),

  runTest: async () => {
    const { inputText, selectedGuardrails, mode } = get()
    if (!inputText.trim() || selectedGuardrails.length === 0) return

    set({ isRunning: true, error: null, results: null })
    try {
      const result = await runPipeline(inputText, selectedGuardrails, mode)
      set({ results: result, isRunning: false })
    } catch (err) {
      set({ error: (err as Error).message, isRunning: false })
    }
  },

  clearResults: () => set({ results: null, error: null }),
}))
