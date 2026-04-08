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
import type { EndToEndRunRequest, LLMConfig } from '../types'

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

function persist(nodes: Node[], edges: Edge[]) {
  try {
    // Strip api_key from llmNode data before saving
    const storableNodes = nodes.map(n => {
      if (n.type === 'llmNode' && typeof n.data === 'object' && n.data !== null) {
        const { api_key, ...restData } = n.data as any
        return { ...n, data: restData }
      }
      return n
    })
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

    const guardrailNodes = state.nodes.filter((n) => n.type === 'guardrailNode')
    const guardrails = guardrailNodes
      .map((n) => (n.data as unknown as GuardrailNodeData).guardrail)
      .filter((g) => g.enabled)

    // Separate input vs output guardrails by their connection relative to LLM Node
    // Wait, the edges define the order, but for simplicity we can assume nodes before LLM are input, after are output.
    // Let's do a simple topographical sort or simply find all edges connected to LLM.
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

    // Since our edges are simple chains, we will just pass all guardrails as input_guardrails for now
    // UNLESS we explicitly track their place. We can just trust the `state.nodes` array order for now.
    const inputGuardrails = guardrails.filter(g => g.position === 'input' || g.position === 'both')
    const outputGuardrails = guardrails.filter(g => g.position === 'output')

    const request: EndToEndRunRequest = {
      text: input,
      input_guardrails: inputGuardrails,
      output_guardrails: outputGuardrails,
      llm_config: llmConfig,
      mode: 'run_all'
    }

    try {
      const outputNode = state.nodes.find(n => n.type === 'outputNode')
      if (outputNode) {
        get().updateNodeData(outputNode.id, { content: undefined })
      }

      await streamEndToEnd(request, (event) => {
        if (event.stage === 'llm') {
           const e = event as any;
           if (llmNode) {
             get().updateNodeData(llmNode.id, { status: e.status, content: e.content, error: e.error })
           }
           if (outputNode && e.content) {
             get().updateNodeData(outputNode.id, { content: e.content })
           }
        } else {
           const e = event as any;
           const node = guardrailNodes.find((n) => {
             const d = n.data as unknown as GuardrailNodeData
             return d.guardrail.id === e.guardrail_id
           })
           if (node) {
             get().updateGuardrailStatus(node.id, e.result?.status || 'fail')
           }
           if (outputNode && e.current_text) {
             get().updateNodeData(outputNode.id, { content: e.current_text })
           }
        }
      })
      set({ isRunning: false })
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
    const storableNodes = nodes.map(n => {
      if (n.type === 'llmNode' && typeof n.data === 'object' && n.data !== null) {
        const { api_key, ...restData } = n.data as any
        return { ...n, data: restData }
      }
      return n
    })
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
}))
