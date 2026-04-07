'use client'

import { usePipelineStore } from '@/lib/store/pipelineStore'
import type { GuardrailNodeData, InputNodeData, LLMNodeData } from '@/lib/types'
import GuardrailConfigForm from './forms/GuardrailConfigForm'
import InputConfigForm     from './forms/InputConfigForm'
import LLMConfigForm       from './forms/LLMConfigForm'

export default function InspectorPanel() {
  const { selectedNodeId, nodes } = usePipelineStore()
  const selectedNode = nodes.find((n) => n.id === selectedNodeId)

  return (
    <aside
      style={{
        width:         'var(--inspector-width)',
        height:        '100%',
        background:    'var(--color-surface)',
        borderLeft:    '1px solid var(--color-border)',
        display:       'flex',
        flexDirection: 'column',
        overflow:      'hidden',
        flexShrink:    0,
      }}
    >
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
        <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Inspector
        </h2>
        {selectedNode && (
          <div style={{ fontSize: 10, color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
            {selectedNode.id}
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }} className="animate-fade-in-up">
        {!selectedNode ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, paddingBottom: 60 }}>
            <div style={{ fontSize: 36, opacity: 0.2 }}>🔍</div>
            <p style={{ fontSize: 12, color: 'var(--color-text-dim)', textAlign: 'center', fontFamily: 'var(--font-sans)', lineHeight: 1.6 }}>
              Click a node on the canvas
              <br />
              to inspect and configure it.
            </p>
            <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: 10, color: 'var(--color-text-dim)', fontFamily: 'var(--font-sans)', lineHeight: 1.5, textAlign: 'center' }}>
              Drag guardrails from the left sidebar onto the canvas to add them
            </div>
          </div>
        ) : (
          <div key={selectedNode.id} className="animate-fade-in-up">
            {selectedNode.type === 'guardrailNode' && (
              <GuardrailConfigForm
                nodeId={selectedNode.id}
                guardrail={(selectedNode.data as unknown as GuardrailNodeData).guardrail}
              />
            )}
            {selectedNode.type === 'inputNode' && (
              <InputConfigForm nodeId={selectedNode.id} data={selectedNode.data as unknown as InputNodeData} />
            )}
            {selectedNode.type === 'llmNode' && (
              <LLMConfigForm data={selectedNode.data as unknown as LLMNodeData} />
            )}
            {selectedNode.type === 'outputNode' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>📤</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', fontFamily: 'var(--font-sans)' }}>Output Node</div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>sink terminal</div>
                  </div>
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)' }} />
                <p style={{ fontSize: 11, color: 'var(--color-text-dim)', fontFamily: 'var(--font-sans)', lineHeight: 1.6 }}>
                  The Output node is the final stage of the pipeline. After all guardrails run, the processed text arrives here.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
