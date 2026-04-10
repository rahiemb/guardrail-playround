'use client'

import { useState } from 'react'
import { usePipelineStore } from '@/lib/store/pipelineStore'
import { TEST_SUITE } from '@/lib/testSuite'
import type { EndToEndRunResult } from '@/lib/types'
import { runEndToEndPipeline } from '@/lib/api/client'
import type { EndToEndRunRequest, LLMConfig, GuardrailNodeData, LLMNodeData } from '@/lib/types'

export default function TestSuitePanel() {
  const { nodes } = usePipelineStore()
  
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<Record<string, EndToEndRunResult>>({})
  
  const runSuite = async () => {
    setIsRunning(true)
    setResults({})
    
    const guardrailNodes = nodes.filter(n => n.type === 'guardrailNode')
    const guardrails = guardrailNodes.map(n => (n.data as unknown as GuardrailNodeData).guardrail).filter(g => g.enabled)
    const inputGuardrails = guardrails.filter(g => g.position === 'input' || g.position === 'both')
    const outputGuardrails = guardrails.filter(g => g.position === 'output')
    
    const llmNode = nodes.find(n => n.type === 'llmNode')
    const llmData = (llmNode?.data as unknown as LLMNodeData)
    const llmConfig: LLMConfig = {
      provider: llmData?.provider || 'openai',
      model: llmData?.model || 'gpt-4o',
      api_key: llmData?.api_key,
      max_tokens: llmData?.max_tokens ?? 1024,
      temperature: llmData?.temperature ?? 0.5
    }

    const newResults: Record<string, EndToEndRunResult> = {}
    
    for (const prompt of TEST_SUITE) {
      const request: EndToEndRunRequest = {
        text: prompt.text,
        input_guardrails: inputGuardrails,
        output_guardrails: outputGuardrails,
        llm_config: llmConfig,
        mode: 'run_all'
      }
      
      try {
        const res = await runEndToEndPipeline(request)
        newResults[prompt.id] = res
        setResults({ ...newResults }) // trigger re-render per result step
      } catch (e) {
        console.error(e)
      }
    }
    
    setIsRunning(false)
  }

  return (
    <aside
      className="animate-slide-in-right"
      style={{
        width: 'var(--inspector-width)',
        height: '100%',
        background: 'var(--color-surface)',
        borderLeft: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--color-border)' }}>
        <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          📊 Test Suite
        </h2>
        <p style={{ fontSize: 10, color: 'var(--color-text-dim)', marginTop: 3 }}>
          Run canned prompts against the active pipeline
        </p>
      </div>
      
      <div style={{ flex: 1, padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {TEST_SUITE.map(prompt => {
          const res = results[prompt.id]
          const isDone = !!res
          
          let statusColor = 'var(--color-text-dim)'
          let statusText = 'Pending'
          if (isDone) {
            const blocked = res.blocked
            const expectedBlocked = prompt.expectedAction === 'block'
            
            if (blocked === expectedBlocked) {
               statusColor = '#10b981'
               statusText = 'Verified'
            } else {
               statusColor = '#ef4444'
               statusText = blocked ? 'False Positive' : 'Failed to Block'
            }
          }
          
          return (
            <div key={prompt.id} style={{
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 12px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text)', fontFamily: 'var(--font-sans)', textTransform: 'capitalize' }}>
                  {prompt.category} <span style={{opacity:0.5}}>- {prompt.name}</span>
                </span>
                <span style={{ fontSize: 10, fontWeight: 600, color: statusColor, fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
                  {statusText}
                </span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', opacity: 0.8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                &quot;{prompt.text}&quot;
              </div>
              
              {isDone && (
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--color-border-subtle)', display: 'flex', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, textTransform: 'uppercase', color: 'var(--color-text-dim)', marginBottom: 2 }}>Input Filters</div>
                    <div style={{ fontSize: 10, color: res.input_results.some(r => r.status==='fail') ? '#ef4444' : '#10b981', fontFamily: 'var(--font-mono)' }}>
                      {res.input_results.some(r => r.status==='fail') ? 'BLOCKED' : 'PASS'}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, textTransform: 'uppercase', color: 'var(--color-text-dim)', marginBottom: 2 }}>LLM Request</div>
                    <div style={{ fontSize: 10, color: res.llm_request_text ? 'var(--color-text)' : 'var(--color-text-dim)', fontFamily: 'var(--font-mono)' }}>
                      {res.llm_request_text ? (res.llm_response_text ? 'GEN SUCCESS' : 'GEN FAILED') : 'SKIPPED'}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, textTransform: 'uppercase', color: 'var(--color-text-dim)', marginBottom: 2 }}>Output Filters</div>
                    <div style={{ fontSize: 10, color: res.output_results.some(r => r.status==='fail') ? '#ef4444' : '#10b981', fontFamily: 'var(--font-mono)' }}>
                      {res.output_results.some(r => r.status==='fail') ? 'BLOCKED' : 'PASS'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--color-border)' }}>
        <button
          onClick={runSuite}
          disabled={isRunning}
          style={{
            width: '100%',
            padding: '10px 0',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: !isRunning ? 'var(--color-accent)' : 'var(--color-surface-2)',
            color: !isRunning ? '#fff' : 'var(--color-text-dim)',
            fontSize: 13,
            fontWeight: 600,
            fontFamily: 'var(--font-sans)',
            cursor: !isRunning ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {isRunning ? (
             <><span style={{ animation: 'spin 0.8s linear infinite', display: 'inline-block' }}>⟳</span> Running Suite…</>
          ) : (
            <>▶ Run Full Suite</>
          )}
        </button>
      </div>
    </aside>
  )
}
