'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { LLMNodeData } from '@/lib/types'

const PROVIDER_LABELS: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  azure: 'Azure',
  ollama: 'Ollama',
}

function LLMNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as LLMNodeData
  const providerLabel = PROVIDER_LABELS[nodeData.provider] ?? nodeData.provider

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
        border: `2px solid ${selected ? 'var(--color-node-llm)' : 'rgba(99,102,241,0.4)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: '14px 18px',
        minWidth: 180,
        boxShadow: selected ? 'var(--glow-accent)' : '0 4px 20px rgba(0,0,0,0.4)',
        transition: 'box-shadow 0.2s, border-color 0.2s',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: 'var(--color-node-llm)', borderColor: 'var(--color-bg)' }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: 'rgba(99,102,241,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
          }}
        >
          🧠
        </div>
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontWeight: 600,
            fontSize: 13,
            color: '#a5b4fc',
            letterSpacing: '0.02em',
          }}
        >
          {nodeData.label || 'LLM'}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span
          style={{
            fontSize: 10,
            color: 'rgba(165,180,252,0.5)',
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {providerLabel}
        </span>
        <span
          style={{
            fontSize: 11,
            color: 'rgba(165,180,252,0.8)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {nodeData.model}
        </span>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        style={{ background: 'var(--color-node-llm)', borderColor: 'var(--color-bg)' }}
      />
    </div>
  )
}

export default memo(LLMNode)
