'use client'

import type { LLMNodeData } from '@/lib/types'

const PROVIDERS = [
  { value: 'openai',    label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'azure',     label: 'Azure OpenAI' },
  { value: 'ollama',    label: 'Ollama (local)' },
]

const MODELS: Record<string, { value: string; label: string }[]> = {
  openai:    [{ value: 'gpt-4o', label: 'GPT-4o' }, { value: 'gpt-4o-mini', label: 'GPT-4o mini' }, { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' }],
  anthropic: [{ value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' }, { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' }],
  azure:     [{ value: 'gpt-4o', label: 'GPT-4o (Azure)' }, { value: 'gpt-4', label: 'GPT-4 (Azure)' }],
  ollama:    [{ value: 'llama3', label: 'Llama 3' }, { value: 'mistral', label: 'Mistral' }, { value: 'codellama', label: 'Code Llama' }],
}

const selectStyle: React.CSSProperties = {
  width: '100%', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)', color: 'var(--color-text)', fontFamily: 'var(--font-sans)',
  fontSize: 12, padding: '6px 10px', outline: 'none', cursor: 'pointer', boxSizing: 'border-box',
}

interface Props { data: LLMNodeData }

export default function LLMConfigForm({ data }: Props) {
  const models = MODELS[data.provider] ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 20 }}>🧠</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', fontFamily: 'var(--font-sans)' }}>LLM Node</div>
          <div style={{ fontSize: 10, color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>language model</div>
        </div>
      </div>
      <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)' }} />
      <div>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-sans)', marginBottom: 6 }}>Provider</div>
        <select style={selectStyle} value={data.provider} disabled>
          {PROVIDERS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>
      <div>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-sans)', marginBottom: 6 }}>Model</div>
        <select style={selectStyle} value={data.model} disabled>
          {models.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </div>
      <div style={{ padding: '10px 12px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 'var(--radius-sm)', fontSize: 11, color: 'var(--color-text-dim)', fontFamily: 'var(--font-sans)', lineHeight: 1.5 }}>
        🔌 Live LLM connection wires in <strong style={{ color: 'var(--color-accent)' }}>Phase 4</strong> — provider, model and API key config will be editable then.
      </div>
    </div>
  )
}
