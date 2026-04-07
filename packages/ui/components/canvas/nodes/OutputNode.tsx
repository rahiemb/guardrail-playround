'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { OutputNodeData } from '@/lib/types'

function OutputNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as OutputNodeData
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
        border: `2px solid ${selected ? 'var(--color-success)' : 'rgba(16,185,129,0.4)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: '14px 18px',
        minWidth: 160,
        boxShadow: selected ? 'var(--glow-success)' : '0 4px 20px rgba(0,0,0,0.4)',
        transition: 'box-shadow 0.2s, border-color 0.2s',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: 'var(--color-success)', borderColor: 'var(--color-bg)' }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: 'rgba(16,185,129,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
          }}
        >
          📤
        </div>
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontWeight: 600,
            fontSize: 13,
            color: '#6ee7b7',
            letterSpacing: '0.02em',
          }}
        >
          {nodeData.label || 'Output'}
        </span>
      </div>

      <div
        style={{
          fontSize: 10,
          color: 'rgba(110,231,183,0.6)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        Final response
      </div>
    </div>
  )
}

export default memo(OutputNode)
