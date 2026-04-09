import { create } from 'zustand'
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from '@xyflow/react'
import type {
  Guardrail,
  GuardrailNodeData,
  GuardrailType,
  InputNodeData,
  LLMNodeData,
  OutputNodeData,
  PipelineRunResult,
} from '../types'
import { runPipeline as apiRunPipeline, streamEndToEnd } from '../api/client'
import type { EndToEndRunRequest, LLMConfig, ValidationResult } from '../types'
import { useAnalyticsStore } from './analyticsStore'

// ─────────────────────────────────────────────
// Defaults
// ─────────────────────────────────────────────

function defaultConfig(type: GuardrailType): Record<string, unknown> {
  switch (type) {
    case 'regex':            return { pattern: '', flags: 'i' }
    case 'keyword':          return { deny_list: [], allow_list: [] }
    case 'length':           return { min_chars: 0, max_chars: 2000 }
    case 'pii':              return { entities: ['PERSON', 'EMAIL_ADDRESS', 'PHONE_NUMBER'] }
    case 'toxicity':         return { threshold: 0.5 }
    case 'prompt_injection': return { sensitivity: 0.75 }
    case 'topic':            return { blocked_topics: [], allowed_topics: [] }
    case 'format':           return { expected_format: 'json' }
  }
}

const TYPE_NAMES: Record<GuardrailType, string> = {
  regex:            'Regex Filter',
  keyword:          'Keyword Filter',
  length:           'Length Limiter',
  pii:              'PII Detector',
  toxicity:         'Toxicity Filter',
  prompt_injection: 'Prompt Injection',
  topic:            'Topic Validator',
  format:           'Format Validator',
}

function makeGuardrail(type: GuardrailType): Guardrail {
  return {
    id:       `guardrail-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name:     TYPE_NAMES[type],
    type,
    position: 'input',
    config:   defaultConfig(type),
    action:   'block',
    severity: 'medium',
    enabled:  true,
  }
}

// ─────────────────────────────────────────────
// Initial state
// ─────────────────────────────────────────────

const INITIAL_NODES: Node[] = [
  {
    id:        'input',
    type:      'inputNode',
    position:  { x: 80, y: 260 },
    data:      { label: 'Input', sampleText: 'Hello, my name is John. My SSN is 123-45-6789.' } as InputNodeData,
    deletable: false,
  },
  {
    id:        'llm',
    type:      'llmNode',
    position:  { x: 560, y: 240 },
    data:      { label: 'LLM', provider: 'openai', model: 'gpt-4o' } as LLMNodeData,
    deletable: false,
  },
  {
    id:        'output',
    type:      'outputNode',
    position:  { x: 1040, y: 260 },
    data:      { label: 'Output' } as OutputNodeData,
    deletable: false,
  },
]

const INITIAL_EDGES: Edge[] = [
  {
    id:       'e-input-llm',
    source:   'input',
    target:   'llm',
    type:     'animatedEdge',
    animated: false,
    style:    { stroke: 'var(--color-border)', strokeWidth: 2 },
  },
  {
    id:       'e-llm-output',
    source:   'llm',
    target:   'output',
    type:     'animatedEdge',
    animated: false,
    style:    { stroke: 'var(--color-border)', strokeWidth: 2 },
  },
]

// ─────────────────────────────────────────────
// localStorage persistence helpers
// ─────────────────────────────────────────────

const STORAGE_KEY = 'guardrail-playground-pipeline'
const VERSIONS_KEY = 'guardrail-playground-versions'
const MAX_VERSIONS = 10

export interface PipelineVersion {
  timestamp: number
  label: string
  nodes: Node[]
  edges: Edge[]
}

function stripApiKey(nodes: Node[]): Node[] {
  return nodes.map(n => {
    if (n.type !== 'llmNode' || typeof n.data !== 'object' || n.data === null) return n
    const { api_key, ...restData } = n.data as any
    return { ...n, data: restData }
  })
}

function persist(nodes: Node[], edges: Edge[]) {
  try {
    const storableNodes = stripApiKey(nodes)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes: storableNodes, edges }))
  } catch {
    // ignore quota errors
  }
}

function hydrate(): { nodes: Node[]; edges: Edge[] } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as { nodes: Node[]; edges: Edge[] }
  } catch {
    return null
  }
}

function loadVersions(): PipelineVersion[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(VERSIONS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as PipelineVersion[]
  } catch {
    return []
  }
}

function persistVersions(versions: PipelineVersion[]) {
  try {
    localStorage.setItem(VERSIONS_KEY, JSON.stringify(versions))
  } catch {
    // ignore quota errors
  }
}

// ─────────────────────────────────────────────
// Store interface
// ─────────────────────────────────────────────

interface PipelineState {
  nodes:          Node[]
  edges:          Edge[]
  selectedNodeId: string | null
  isRunning:      boolean
  lastRunResult:  PipelineRunResult | null
  runError:       string | null

  // React Flow handlers
  onNodesChange:  (changes: NodeChange[]) => void
  onEdgesChange:  (changes: EdgeChange[]) => void
  onConnect:      (connection: Connection) => void

  // Selection
  setSelectedNodeId: (id: string | null) => void

  // Guardrail CRUD
  addGuardrailNode:       (type: GuardrailType, flowPos: { x: number; y: number }) => void
  removeGuardrailNode:    (id: string) => void
  updateGuardrailConfig:  (id: string, patch: Partial<Guardrail>) => void
  updateGuardrailStatus:  (id: string, status: GuardrailNodeData['status']) => void
  updateNodeData:         (id: string, patch: Record<string, unknown>) => void

  // Pipeline execution
  runPipeline: (inputText?: string) => Promise<void>
  clearRunResult: () => void

  // Serialization
  serializePipeline:   () => string
  deserializePipeline: (json: string) => void
  resetPipeline:       () => void

  // Versioning
  versions:     PipelineVersion[]
  saveVersion:  (label?: string) => void
  loadVersion:  (index: number) => void
}

// ─────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────

const saved = hydrate()

export const usePipelineStore = create<PipelineState>((set, get) => ({
  nodes:         saved?.nodes  ?? INITIAL_NODES,
  edges:         saved?.edges  ?? INITIAL_EDGES,
  selectedNodeId: null,
  isRunning:      false,
  lastRunResult:  null,
  runError:       null,
  versions:       loadVersions(),

  // ── React Flow handlers ──────────────────────────────
  onNodesChange: (changes) =>
    set((state) => {
      const nodes = applyNodeChanges(changes, state.nodes)
      persist(nodes, state.edges)
      return { nodes }
    }),

  onEdgesChange: (changes) =>
    set((state) => {
      const edges = applyEdgeChanges(changes, state.edges)
      persist(state.nodes, edges)
      return { edges }
    }),

  onConnect: (connection) =>
    set((state) => {
      const edges = addEdge({ ...connection, type: 'animatedEdge' }, state.edges)
      persist(state.nodes, edges)
      return { edges }
    }),

  setSelectedNodeId: (id) => set({ selectedNodeId: id }),

  // ── Guardrail CRUD ───────────────────────────────────
  addGuardrailNode: (type, flowPos) => {
    const guardrail = makeGuardrail(type)
    const nodeId = guardrail.id

    set((state) => {
      const newNode: Node = {
        id:   nodeId,
        type: 'guardrailNode',
        position: flowPos,
        data: { guardrail, status: 'idle' } as unknown as Node['data'],
      }

      // Auto-wire: insert between Input and LLM by splitting the input→llm edge
      const inputLlmEdge = state.edges.find(
        (e) => e.source === 'input' && e.target === 'llm'
      )

      let newEdges = state.edges
      if (inputLlmEdge) {
        newEdges = [
          ...state.edges.filter((e) => e.id !== inputLlmEdge.id),
          {
            id:     `e-input-${nodeId}`,
            source: 'input',
            target: nodeId,
            type:   'animatedEdge',
            style:  { stroke: 'var(--color-border)', strokeWidth: 2 },
          },
          {
            id:     `e-${nodeId}-llm`,
            source: nodeId,
            target: 'llm',
            type:   'animatedEdge',
            style:  { stroke: 'var(--color-border)', strokeWidth: 2 },
          },
        ]
      } else {
        newEdges = state.edges
      }

      const nodes = [...state.nodes, newNode]
      persist(nodes, newEdges)
      return { nodes, edges: newEdges }
    })
  },

  removeGuardrailNode: (id) =>
    set((state) => {
      const inEdge  = state.edges.find((e) => e.target === id)
      const outEdge = state.edges.find((e) => e.source === id)

      let newEdges = state.edges.filter((e) => e.source !== id && e.target !== id)

      if (inEdge && outEdge) {
        newEdges = [
          ...newEdges,
          {
            id:     `e-${inEdge.source}-${outEdge.target}`,
            source: inEdge.source,
            target: outEdge.target,
            type:   'animatedEdge',
            style:  { stroke: 'var(--color-border)', strokeWidth: 2 },
          },
        ]
      }

      const nodes = state.nodes.filter((n) => n.id !== id)
      persist(nodes, newEdges)
      return { nodes, edges: newEdges, selectedNodeId: null }
    }),

  updateGuardrailConfig: (id, patch) =>
    set((state) => {
      const nodes = state.nodes.map((n) => {
        if (n.id !== id || n.type !== 'guardrailNode') return n
        const d = n.data as unknown as GuardrailNodeData
        return { ...n, data: { ...d, guardrail: { ...d.guardrail, ...patch } } }
      })
      persist(nodes, state.edges)
      return { nodes }
    }),

  updateGuardrailStatus: (id, status) =>
    set((state) => ({
      nodes: state.nodes.map((n) => {
        if (n.id !== id || n.type !== 'guardrailNode') return n
        return { ...n, data: { ...(n.data as object), status } }
      }),
    })),

  updateNodeData: (id, patch) =>
    set((state) => {
      const nodes = state.nodes.map((n) =>
        n.id === id ? { ...n, data: { ...(n.data as object), ...patch } } : n
      )
      persist(nodes, state.edges)
      return { nodes }
    }),

  // ── Pipeline execution ───────────────────────────────
  runPipeline: async (inputText) => {
    const state = get()
    const input = inputText
      ?? (state.nodes.find((n) => n.id === 'input')?.data as InputNodeData | undefined)?.sampleText
      ?? ''

    if (!input.trim()) return

    // Auto-save a version before every run
    get().saveVersion('Auto-save before run')

    const guardrailNodes = state.nodes.filter((n) => n.type === 'guardrailNode')
    const guardrails = guardrailNodes
      .map((n) => (n.data as unknown as GuardrailNodeData).guardrail)
      .filter((g) => g.enabled)

    const inEdgesToLlm = state.edges.filter(e => e.target === 'llm').map(e => e.source)
    const outEdgesFromLlm = state.edges.filter(e => e.source === 'llm').map(e => e.target)

    const llmNode = state.nodes.find(n => n.type === 'llmNode')
    const llmData = (llmNode?.data as unknown as LLMNodeData)
    const llmConfig: LLMConfig = {
      provider: llmData?.provider || 'openai',
      model: llmData?.model || 'gpt-4o',
      api_key: llmData?.api_key,
      max_tokens: llmData?.max_tokens ?? 1024,
      temperature: llmData?.temperature ?? 0.5
    }

    set({ isRunning: true, runError: null, lastRunResult: null })
    guardrailNodes.forEach((n) => get().updateGuardrailStatus(n.id, 'idle'))
    
    // Also reset LLM Node status!
    if (llmNode) {
      get().updateNodeData(llmNode.id, { status: 'idle' })
    }

    const inputGuardrails = guardrails.filter(g => g.position === 'input' || g.position === 'both')
    const outputGuardrails = guardrails.filter(g => g.position === 'output')

    const request: EndToEndRunRequest = {
      text: input,
      input_guardrails: inputGuardrails,
      output_guardrails: outputGuardrails,
      llm_config: llmConfig,
      mode: 'run_all'
    }

    const startTime = performance.now()

    try {
      const outputNode = state.nodes.find(n => n.type === 'outputNode')
      if (outputNode) {
        get().updateNodeData(outputNode.id, { content: undefined })
      }

      await streamEndToEnd(request, (event) => {
        if (event.stage === 'llm') {
           if (llmNode) {
             get().updateNodeData(llmNode.id, { status: event.status, content: event.content, error: event.error })
           }
           if (outputNode && event.content) {
             get().updateNodeData(outputNode.id, { content: event.content })
           }
        } else {
           const node = guardrailNodes.find((n) => {
             const d = n.data as unknown as GuardrailNodeData
             return d.guardrail.id === event.guardrail_id
           })
           if (node) {
             get().updateGuardrailStatus(node.id, event.result?.status || 'fail')
           }
           if (outputNode && event.current_text) {
             get().updateNodeData(outputNode.id, { content: event.current_text })
           }
        }
      })
      
      const endTime = performance.now()
      set({ isRunning: false })
      
      // Accumulate the final statuses from nodes for analytics
      const endStateNodes = get().nodes
      const results: ValidationResult[] = []
      let anyBlocked = false
      
      for (const n of endStateNodes) {
        if (n.type === 'guardrailNode') {
           const d = n.data as unknown as GuardrailNodeData
           if (d.guardrail.enabled) {
              results.push({
                 guardrail_id: d.guardrail.id,
                 guardrail_name: d.guardrail.name,
                 status: d.status || 'idle',
                 message: '',
                 metadata: {},
                 execution_time_ms: 0
              })
              if (d.status === 'fail' && d.guardrail.action === 'block') {
                 anyBlocked = true
              }
           }
        }
      }
      
      useAnalyticsStore.getState().recordRun({
        totalTimeMs: endTime - startTime,
        blocked: anyBlocked,
        guardrailResults: results
      })
      
      // To properly set lastRunResult we would accumulate events, but for Live Preview we mostly rely on node status
    } catch (err) {
      set({ isRunning: false, runError: (err as Error).message })
      guardrailNodes.forEach((n) => get().updateGuardrailStatus(n.id, 'idle'))
      if (llmNode) {
        get().updateNodeData(llmNode.id, { status: 'idle' })
      }
    }
  },

  clearRunResult: () => set({ lastRunResult: null, runError: null }),

  // ── Serialization ─────────────────────────────────────
  serializePipeline: () => {
    const { nodes, edges } = get()
    const storableNodes = stripApiKey(nodes)
    return JSON.stringify({ nodes: storableNodes, edges }, null, 2)
  },

  deserializePipeline: (json) => {
    try {
      const { nodes, edges } = JSON.parse(json) as { nodes: Node[]; edges: Edge[] }
      persist(nodes, edges)
      set({ nodes, edges, selectedNodeId: null })
    } catch {
      // ignore malformed input
    }
  },

  resetPipeline: () => {
    persist(INITIAL_NODES, INITIAL_EDGES)
    set({ nodes: INITIAL_NODES, edges: INITIAL_EDGES, selectedNodeId: null, lastRunResult: null })
  },

  // ── Versioning ────────────────────────────────────────
  saveVersion: (label = 'Manual save') => {
    const { nodes, edges } = get()
    const storableNodes = stripApiKey(nodes)
    const snapshot: PipelineVersion = {
      timestamp: Date.now(),
      label,
      nodes: storableNodes,
      edges,
    }
    const updated = [snapshot, ...get().versions].slice(0, MAX_VERSIONS)
    persistVersions(updated)
    set({ versions: updated })
  },

  loadVersion: (index) => {
    const version = get().versions[index]
    if (!version) return
    persist(version.nodes, version.edges)
    set({ nodes: version.nodes, edges: version.edges, selectedNodeId: null })
  },
}))
