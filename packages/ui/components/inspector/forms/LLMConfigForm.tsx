'use client'

import type { LLMNodeData } from '@/lib/types'

const PROVIDERS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
]

const MODELS: Record<string, { value: string; label: string }[]> = {
  openai: [
    { value: 'gpt-5.2', label: 'GPT-5.2' },
    { value: 'gpt-5-mini', label: 'GPT-5 Mini' },
    { value: 'gpt-4.1', label: 'GPT-4.1' },
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' }
  ],
  anthropic: [
    { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
    { value: 'claude-opus-4-6', label: 'Claude Opus 4.6' },
    { value: 'claude-sonnet-4.5', label: 'Claude Sonnet 4.5' },
    { value: 'claude-opus-4.5', label: 'Claude Opus 4.5' },
    { value: 'claude-haiku-4.5', label: 'Claude Haiku 4.5' }
  ],
}

const selectStyle: React.CSSProperties = {
  width: '100%', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)', color: 'var(--color-text)', fontFamily: 'var(--font-sans)',
  fontSize: 12, padding: '6px 10px', outline: 'none', cursor: 'pointer', boxSizing: 'border-box',
}

import { usePipelineStore } from '@/lib/store/pipelineStore'

interface Props { nodeId: string; data: LLMNodeData }

export default function LLMConfigForm({ nodeId, data }: Props) {
  const { updateNodeData } = usePipelineStore()

  const models = MODELS[data.provider] ?? []

  const handleChange = (key: keyof LLMNodeData, value: string | number) => {
    updateNodeData(nodeId, { [key]: value })
  }

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
        <select
          style={selectStyle}
          value={data.provider}
          onChange={(e) => {
            const nextProv = e.target.value;
            const nextModels = MODELS[nextProv] ?? [];
            handleChange('provider', nextProv);
            if (nextModels.length > 0) handleChange('model', nextModels[0].value);
          }}
        >
          {PROVIDERS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>
      <div>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-sans)', marginBottom: 6 }}>Model</div>
        <select style={selectStyle} value={data.model} onChange={(e) => handleChange('model', e.target.value)}>
          {models.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </div>

      <div>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-sans)', marginBottom: 6 }}>API Key</div>
        <input
          type="password"
          placeholder="Session only, never saved"
          style={{ ...selectStyle, fontFamily: 'var(--font-mono)' }}
          value={data.api_key || ''}
          onChange={(e) => handleChange('api_key', e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-sans)', marginBottom: 6 }}>Max Tokens ({data.max_tokens ?? 1024})</div>
          <input
            type="range" min="1" max="4096" step="1"
            style={{ width: '100%', accentColor: 'var(--color-accent)' }}
            value={data.max_tokens ?? 1024}
            onChange={(e) => handleChange('max_tokens', parseInt(e.target.value))}
          />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-sans)', marginBottom: 6 }}>Temp ({data.temperature ?? 0.5})</div>
          <input
            type="range" min="0" max="2" step="0.1"
            style={{ width: '100%', accentColor: 'var(--color-accent)' }}
            value={data.temperature ?? 0.5}
            onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
          />
        </div>
      </div>
    </div>
  )
}
