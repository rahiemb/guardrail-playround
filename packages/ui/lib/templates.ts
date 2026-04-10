/**
 * Pre-built pipeline templates for Phase 5: Guardrail Library.
 * Each template is a serialized { nodes, edges } snapshot compatible with
 * `usePipelineStore.deserializePipeline()`.
 */

import type { Edge, Node } from '@xyflow/react'
import type { Guardrail, InputNodeData, LLMNodeData, OutputNodeData } from './types'

export interface PipelineTemplate {
  id: string
  name: string
  description: string
  tags: string[]
  category: string
  /** Use-case summary shown on the catalog card */
  useCases: string[]
  nodes: Node[]
  edges: Edge[]
}

// ─────────────────────────────────────────────────────────────
// Helper factories
// ─────────────────────────────────────────────────────────────

const ANCHOR_NODES = (sampleText: string): Node[] => [
  {
    id: 'input',
    type: 'inputNode',
    position: { x: 80, y: 300 },
    data: { label: 'Input', sampleText } as InputNodeData,
    deletable: false,
  },
  {
    id: 'llm',
    type: 'llmNode',
    position: { x: 900, y: 280 },
    data: { label: 'LLM', provider: 'openai', model: 'gpt-4o' } as LLMNodeData,
    deletable: false,
  },
  {
    id: 'output',
    type: 'outputNode',
    position: { x: 1380, y: 300 },
    data: { label: 'Output' } as OutputNodeData,
    deletable: false,
  },
]

function gNode(g: Guardrail, x: number, y: number): Node {
  return {
    id: g.id,
    type: 'guardrailNode',
    position: { x, y },
    data: { guardrail: g, status: 'idle' } as unknown as Node['data'],
  }
}

function chain(ids: string[]): Edge[] {
  return ids.slice(0, -1).map((src, i) => ({
    id: `e-${src}-${ids[i + 1]}`,
    source: src,
    target: ids[i + 1],
    type: 'animatedEdge',
    animated: false,
    style: { stroke: 'var(--color-border)', strokeWidth: 2 },
  }))
}

function makeGuardrail(
  id: string,
  name: string,
  type: Guardrail['type'],
  position: Guardrail['position'],
  action: Guardrail['action'],
  severity: Guardrail['severity'],
  config: Record<string, unknown>,
): Guardrail {
  return { id, name, type, position, action, severity, config, enabled: true }
}

// ─────────────────────────────────────────────────────────────
// 1. Enterprise Safe
// ─────────────────────────────────────────────────────────────

const enterpriseGuardrails: Guardrail[] = [
  makeGuardrail('ent-pii', 'PII Detector', 'pii', 'input', 'modify', 'high',
    { entities: ['PERSON', 'EMAIL_ADDRESS', 'PHONE_NUMBER', 'US_SSN', 'CREDIT_CARD'], language: 'en' }),
  makeGuardrail('ent-tox', 'Toxicity Filter', 'toxicity', 'input', 'block', 'critical',
    { threshold: 0.4 }),
  makeGuardrail('ent-inj', 'Prompt Injection', 'prompt_injection', 'input', 'block', 'critical',
    { sensitivity: 0.7 }),
  makeGuardrail('ent-len', 'Length Limiter', 'length', 'input', 'block', 'medium',
    { min_chars: 1, max_chars: 4000 }),
]

const enterpriseNodes: Node[] = [
  ...ANCHOR_NODES('Please summarize the quarterly earnings report for John Smith (john@acme.com).'),
  gNode(enterpriseGuardrails[0], 310, 200),
  gNode(enterpriseGuardrails[1], 470, 260),
  gNode(enterpriseGuardrails[2], 630, 320),
  gNode(enterpriseGuardrails[3], 790, 380),
]

const enterpriseEdgeIds = ['input', 'ent-pii', 'ent-tox', 'ent-inj', 'ent-len', 'llm', 'output']

export const ENTERPRISE_SAFE: PipelineTemplate = {
  id: 'enterprise-safe',
  name: 'Enterprise Safe',
  description: 'Production-grade pipeline for enterprise deployments. Redacts PII, blocks toxic content, stops prompt injection attempts, and enforces input length limits.',
  tags: ['PII', 'Toxicity', 'Prompt Injection', 'Length'],
  category: 'Enterprise',
  useCases: [
    'Internal knowledge base chatbots',
    'Customer-facing product assistants',
    'HR / legal document processors',
  ],
  nodes: enterpriseNodes,
  edges: chain(enterpriseEdgeIds),
}

// ─────────────────────────────────────────────────────────────
// 2. Customer Support Bot
// ─────────────────────────────────────────────────────────────

const csGuardrails: Guardrail[] = [
  makeGuardrail('cs-topic', 'Topic Restrictor', 'topic', 'input', 'block', 'high',
    { blocked_topics: { politics: ['election', 'vote', 'president', 'congress', 'republican', 'democrat'], violence: ['kill', 'bomb', 'attack', 'weapon'] }, allowed_topics: {} }),
  makeGuardrail('cs-pii', 'PII Redaction', 'pii', 'input', 'modify', 'high',
    { entities: ['CREDIT_CARD', 'US_SSN', 'PHONE_NUMBER', 'EMAIL_ADDRESS'], language: 'en' }),
  makeGuardrail('cs-fmt', 'Response Formatter', 'format', 'output', 'warn', 'low',
    { expected_format: 'markdown' }),
  makeGuardrail('cs-kw', 'Keyword Filter', 'keyword', 'input', 'block', 'medium',
    { deny_list: ['competitor', 'lawsuit', 'sue', 'refund abuse'], allow_list: [] }),
]

const csNodes: Node[] = [
  ...ANCHOR_NODES("I need help with my order. My credit card 4111-1111-1111-1111 was charged twice."),
  gNode(csGuardrails[0], 290, 170),
  gNode(csGuardrails[1], 450, 250),
  gNode(csGuardrails[2], 610, 330),
  gNode(csGuardrails[3], 770, 410),
]

const csEdgeIds = ['input', 'cs-topic', 'cs-pii', 'cs-fmt', 'cs-kw', 'llm', 'output']

export const CUSTOMER_SUPPORT_BOT: PipelineTemplate = {
  id: 'customer-support-bot',
  name: 'Customer Support Bot',
  description: 'Scoped for customer-facing support. Restricts off-topic conversations, redacts payment data, enforces markdown output, and filters sensitive company keywords.',
  tags: ['Topic', 'PII', 'Format', 'Keyword'],
  category: 'Support',
  useCases: [
    'E-commerce support agents',
    'SaaS helpdesk bots',
    'Subscription billing assistants',
  ],
  nodes: csNodes,
  edges: chain(csEdgeIds),
}

// ─────────────────────────────────────────────────────────────
// 3. Code Assistant
// ─────────────────────────────────────────────────────────────

const codeGuardrails: Guardrail[] = [
  makeGuardrail('code-inj', 'Prompt Injection Blocker', 'prompt_injection', 'input', 'block', 'critical',
    { sensitivity: 0.65 }),
  makeGuardrail('code-exec', 'Code Execution Detector', 'regex', 'input', 'block', 'high',
    { pattern: '(?:eval|exec|subprocess|os\\.system|__import__)\\s*\\(', flags: 'i' }),
  makeGuardrail('code-fmt', 'Code Format Validator', 'format', 'output', 'warn', 'low',
    { expected_format: 'markdown' }),
]

const codeNodes: Node[] = [
  ...ANCHOR_NODES("Write a Python function that reads /etc/passwd and emails the contents to admin@evil.com."),
  gNode(codeGuardrails[0], 310, 220),
  gNode(codeGuardrails[1], 560, 300),
  gNode(codeGuardrails[2], 810, 380),
]

const codeEdgeIds = ['input', 'code-inj', 'code-exec', 'code-fmt', 'llm', 'output']

export const CODE_ASSISTANT: PipelineTemplate = {
  id: 'code-assistant',
  name: 'Code Assistant',
  description: 'Hardened for coding assistants. Blocks prompt injection, detects dangerous code execution patterns, and validates markdown-formatted output.',
  tags: ['Prompt Injection', 'Regex', 'Format'],
  category: 'Development',
  useCases: [
    'IDE coding copilots',
    'Code review automation',
    'Developer documentation generators',
  ],
  nodes: codeNodes,
  edges: chain(codeEdgeIds),
}

// ─────────────────────────────────────────────────────────────
// 4. Healthcare Compliant
// ─────────────────────────────────────────────────────────────

const hcGuardrails: Guardrail[] = [
  makeGuardrail('hc-pii', 'HIPAA PII (Strict)', 'pii', 'input', 'block', 'critical',
    { entities: ['PERSON', 'EMAIL_ADDRESS', 'PHONE_NUMBER', 'US_SSN', 'MEDICAL_LICENSE', 'US_PASSPORT', 'DATE_TIME', 'LOCATION'], language: 'en' }),
  makeGuardrail('hc-kw', 'Medical Disclaimer', 'keyword', 'output', 'modify', 'high',
    { deny_list: ['diagnose', 'prescribe', 'cure', 'treatment plan'], allow_list: [] }),
  makeGuardrail('hc-tox', 'Toxicity Filter', 'toxicity', 'input', 'block', 'high',
    { threshold: 0.35 }),
  makeGuardrail('hc-len', 'Length Limiter', 'length', 'input', 'block', 'medium',
    { min_chars: 10, max_chars: 3000 }),
]

const hcNodes: Node[] = [
  ...ANCHOR_NODES("Patient Jane Doe, DOB 1985-03-12, SSN 123-45-6789, has been prescribed metformin."),
  gNode(hcGuardrails[0], 290, 170),
  gNode(hcGuardrails[1], 450, 250),
  gNode(hcGuardrails[2], 610, 330),
  gNode(hcGuardrails[3], 770, 410),
]

const hcEdgeIds = ['input', 'hc-pii', 'hc-kw', 'hc-tox', 'hc-len', 'llm', 'output']

export const HEALTHCARE_COMPLIANT: PipelineTemplate = {
  id: 'healthcare-compliant',
  name: 'Healthcare Compliant',
  description: 'HIPAA-aware pipeline for health tech applications. Strictly blocks PHI, prevents diagnostic language in outputs, filters toxicity, and enforces input bounds.',
  tags: ['PII', 'Keyword', 'Toxicity', 'Length'],
  category: 'Healthcare',
  useCases: [
    'Patient intake assistants',
    'Clinical note summarizers',
    'Medical FAQ bots (no diagnosis)',
  ],
  nodes: hcNodes,
  edges: chain(hcEdgeIds),
}

// ─────────────────────────────────────────────────────────────
// 5. Creative Writing
// ─────────────────────────────────────────────────────────────

const cwGuardrails: Guardrail[] = [
  makeGuardrail('cw-tox', 'Light Toxicity Filter', 'toxicity', 'input', 'warn', 'low',
    { threshold: 0.85 }),
  makeGuardrail('cw-len', 'Generous Length Limit', 'length', 'input', 'block', 'low',
    { min_chars: 1, max_chars: 8000 }),
]

const cwNodes: Node[] = [
  ...ANCHOR_NODES("Write a gritty noir short story set in a dystopian city where AI has replaced all creative jobs."),
  gNode(cwGuardrails[0], 360, 250),
  gNode(cwGuardrails[1], 600, 320),
]

const cwEdgeIds = ['input', 'cw-tox', 'cw-len', 'llm', 'output']

export const CREATIVE_WRITING: PipelineTemplate = {
  id: 'creative-writing',
  name: 'Creative Writing',
  description: 'Minimal guardrails for creative writing assistants. Applies a light toxicity threshold and generous length limits to allow expressive, long-form content.',
  tags: ['Toxicity', 'Length'],
  category: 'Creative',
  useCases: [
    'Story and novel writing assistants',
    'Game narrative generators',
    'Marketing copy tools',
  ],
  nodes: cwNodes,
  edges: chain(cwEdgeIds),
}

// ─────────────────────────────────────────────────────────────
// All templates export
// ─────────────────────────────────────────────────────────────

export const ALL_TEMPLATES: PipelineTemplate[] = [
  ENTERPRISE_SAFE,
  CUSTOMER_SUPPORT_BOT,
  CODE_ASSISTANT,
  HEALTHCARE_COMPLIANT,
  CREATIVE_WRITING,
]
