/**
 * Typed API client for the Guardrail Engine backend.
 * Base URL is configurable via NEXT_PUBLIC_API_URL (defaults to localhost:8000).
 */

import type {
  Guardrail,
  GuardrailTypeMeta,
  PipelineRunRequest,
  PipelineRunResult,
  PipelineStageEvent,
  ValidateRequest,
  ValidateResponse,
  EndToEndRunRequest,
  EndToEndRunResult,
  LLMGenerationEvent,
} from '../types'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
const WS_URL = BASE_URL.replace(/^http/, 'ws')

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const resp = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!resp.ok) {
    const text = await resp.text().catch(() => resp.statusText)
    throw new Error(`API ${resp.status}: ${text}`)
  }
  return resp.json() as Promise<T>
}

// ─────────────────────────────────────────────────────────────
// Endpoints
// ─────────────────────────────────────────────────────────────

/** Fetch all available guardrail type metadata from the engine. */
export async function getGuardrailTypes(): Promise<GuardrailTypeMeta[]> {
  return apiFetch<GuardrailTypeMeta[]>('/api/guardrails/types')
}

/** Validate text against a single guardrail. */
export async function validateSingle(
  text: string,
  guardrail: Guardrail,
): Promise<ValidateResponse> {
  const body: ValidateRequest = { text, guardrail }
  return apiFetch<ValidateResponse>('/api/validate', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

/** Run text through an ordered list of guardrails synchronously. */
export async function runPipeline(
  text: string,
  guardrails: Guardrail[],
  mode: 'run_all' | 'short_circuit' = 'run_all',
): Promise<PipelineRunResult> {
  const body: PipelineRunRequest = { text, guardrails, mode }
  return apiFetch<PipelineRunResult>('/api/pipeline/run', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}


/**
 * Stream a full end-to-end pipeline run over WebSocket.
 */
export function streamEndToEnd(
  request: EndToEndRunRequest,
  onEvent: (event: PipelineStageEvent | LLMGenerationEvent) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${WS_URL}/api/pipeline/stream_full`)

    ws.onopen = () => {
      ws.send(JSON.stringify(request))
    }

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data as string) as (PipelineStageEvent | LLMGenerationEvent) & { done?: boolean; error?: string }
      if (data.done) {
        ws.close()
        resolve()
        return
      }
      if (data.error && (data as unknown as Record<string, unknown>).stage === undefined) {
        ws.close()
        reject(new Error(data.error))
        return
      }
      onEvent(data)
    }

    ws.onerror = () => reject(new Error('WebSocket connection error'))
    ws.onclose = () => resolve()
  })
}

/** Run the full end-to-end pipeline synchronously. */
export async function runEndToEndPipeline(
  request: EndToEndRunRequest
): Promise<EndToEndRunResult> {
  return apiFetch<EndToEndRunResult>('/api/pipeline/execute_full', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}
