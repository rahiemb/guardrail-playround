'use client'

import { usePipelineStore } from '@/lib/store/pipelineStore'
import type { InputNodeData } from '@/lib/types'

interface Props {
  nodeId: string
  data:   InputNodeData
}

const textareaStyle: React.CSSProperties = {
  width: '100%', minHeight: 120, background: 'var(--color-surface-2)',
  border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
  color: 'var(--color-text)', fontFamily: 'var(--font-mono)', fontSize: 12,
  padding: '8px 10px', outline: 'none', resize: 'vertical', lineHeight: 1.5, boxSizing: 'border-box',
}

export default function InputConfigForm({ nodeId, data }: Props) {
  const updateNodeData = usePipelineStore((s) => s.updateNodeData)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 20 }}>📥</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', fontFamily: 'var(--font-sans)' }}>Input Node</div>
          <div style={{ fontSize: 10, color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>source terminal</div>
        </div>
      </div>
      <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)' }} />
      <div>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-sans)', marginBottom: 6 }}>Sample text</div>
        <textarea
          style={textareaStyle}
          value={data.sampleText ?? ''}
          placeholder="Enter sample input text to test the pipeline..."
          onChange={(e) => updateNodeData(nodeId, { sampleText: e.target.value })}
        />
        <div style={{ marginTop: 4, fontSize: 10, color: 'var(--color-text-dim)', fontFamily: 'var(--font-sans)' }}>
          {(data.sampleText ?? '').length} characters · This text is used as the pipeline input
        </div>
      </div>
    </div>
  )
}
