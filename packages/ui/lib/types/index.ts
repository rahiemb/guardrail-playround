// ─────────────────────────────────────────────
// Guardrail domain types
// ─────────────────────────────────────────────

export type GuardrailType =
  | 'regex'
  | 'keyword'
  | 'length'
  | 'pii'
  | 'toxicity'
  | 'prompt_injection'
  | 'topic'
  | 'format'

export type GuardrailPosition = 'input' | 'output' | 'both'
export type GuardrailAction = 'block' | 'warn' | 'modify' | 'log'
export type GuardrailSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface Guardrail {
  id: string
  name: string
  type: GuardrailType
  position: GuardrailPosition
  config: Record<string, unknown>
  action: GuardrailAction
  severity: GuardrailSeverity
  enabled: boolean
}

export interface GuardrailTypeMeta {
  id: GuardrailType
  name: string
  description: string
  category: string
  config_schema: Record<string, string>
}

// ─────────────────────────────────────────────
// Canvas node types
// ─────────────────────────────────────────────

export type CanvasNodeType = 'inputNode' | 'llmNode' | 'outputNode' | 'guardrailNode'

export interface InputNodeData {
  label: string
  sampleText?: string
  [key: string]: unknown
}

export interface LLMNodeData {
  label: string
  provider: string
  model: string
  [key: string]: unknown
}

export interface OutputNodeData {
  label: string
  [key: string]: unknown
}

export interface GuardrailNodeData {
  guardrail: Guardrail
  status?: 'idle' | 'running' | 'pass' | 'fail' | 'warn' | 'modify'
}

// ─────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────

export type ValidationStatus = 'pass' | 'fail' | 'warn' | 'modify'

export interface ValidationResult {
  guardrail_id: string
  guardrail_name: string
  status: ValidationStatus
  message?: string
  modified_text?: string
  metadata?: Record<string, unknown>
  execution_time_ms: number
}

// ─────────────────────────────────────────────────────────────
// Pipeline I/O types (mirror backend Pydantic models)
// ─────────────────────────────────────────────────────────────

export interface ValidateRequest {
  text: string
  guardrail: Guardrail
}

export interface ValidateResponse {
  result: ValidationResult
  output_text: string
}

export interface PipelineRunRequest {
  text: string
  guardrails: Guardrail[]
  mode: 'run_all' | 'short_circuit'
}

export interface PipelineRunResult {
  input_text: string
  output_text: string
  results: ValidationResult[]
  blocked: boolean
  total_time_ms: number
}

export interface PipelineStageEvent {
  stage: number
  guardrail_id: string
  result: ValidationResult
  current_text: string
  blocked: boolean
}
