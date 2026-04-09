'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Header from '@/components/common/Header'
import GuardrailPalette from '@/components/sidebar/GuardrailPalette'
import InspectorPanel from '@/components/inspector/InspectorPanel'
import TestPanel from '@/components/testing/TestPanel'
import TestSuitePanel from '@/components/testing/TestSuitePanel'
import VersionPanel from '@/components/inspector/VersionPanel'
import { usePipelineStore } from '@/lib/store/pipelineStore'
import { pipelineSchema } from '@/lib/schema/pipelineSchema'

// React Flow must be dynamically imported (no SSR) because it uses browser APIs
const FlowCanvas = dynamic(() => import('@/components/canvas/FlowCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-[var(--color-bg)] text-[var(--color-text-dim)] font-sans text-[13px] gap-2.5">
      <span className="text-[20px] animate-pulse">⚡</span>
      Loading canvas...
    </div>
  ),
})

export default function Home() {
  const [mode, setMode] = useState<'inspect' | 'test' | 'suite' | 'versions'>('inspect')
  const { deserializePipeline } = usePipelineStore()

  // Restore pipeline from shareable URL hash on first mount
  useEffect(() => {
    const hash = window.location.hash
    const match = hash.match(/^#pipeline=(.+)$/)
    if (match) {
      try {
        const bytes = Uint8Array.from(atob(match[1]), c => c.charCodeAt(0))
        const json = new TextDecoder().decode(bytes)
        const parsed = JSON.parse(json)
        
        // Zod validation throws error on invalid schemas
        pipelineSchema.parse(parsed)
        
        deserializePipeline(json)
        // Clean the hash from the URL without a page reload
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
      } catch (error) {
        console.warn('Failed to safely parse pipeline from URL hash:', error)
      }
    }
  }, [deserializePipeline])

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-[var(--color-bg)]">
      <Header />

      {/* Mode toggle bar */}
      <div className="flex items-center gap-1.5 py-1.5 px-4 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <span className="text-[10px] font-semibold text-[var(--color-text-dim)] uppercase tracking-[0.08em] font-sans mr-1.5">
          Right panel:
        </span>
        {(
          [
            { key: 'inspect',  label: '🔍 Inspector', id: 'mode-inspect-btn' },
            { key: 'test',     label: '🧪 Test',      id: 'mode-test-btn' },
            { key: 'suite',    label: '📊 Suite',     id: 'mode-suite-btn' },
            { key: 'versions', label: '🕒 Versions',  id: 'mode-versions-btn' },
          ] as const
        ).map(({ key, label, id }) => (
          <button
            key={key}
            id={id}
            onClick={() => setMode(key)}
            className={`py-1 px-3 rounded text-[11px] font-sans cursor-pointer transition-all duration-150 ${
              mode === key 
                ? 'border border-[var(--color-accent)] bg-[var(--color-accent-glow)] text-[var(--color-accent)] font-semibold' 
                : 'border border-[var(--color-border)] bg-transparent text-[var(--color-text-muted)] font-normal'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        <GuardrailPalette />

        <main
          id="canvas-drop-zone"
          className="flex-1 relative overflow-hidden min-w-0"
          onDragOver={(e) => {
            if (e.dataTransfer.types.includes('Files')) {
              e.preventDefault()
              e.dataTransfer.dropEffect = 'copy'
            }
          }}
          onDrop={(e) => {
            const file = e.dataTransfer.files[0]
            if (!file) return // guardrail palette drop
            e.preventDefault()
            e.stopPropagation()
            
            // Defend against arbitrary malicious/incompatible local file types
            if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
              console.error('Dropped file is not a valid JSON pipeline stream: ', file.type)
              alert('Dropped file must be a JSON pipeline architecture structure!')
              return
            }

            const reader = new FileReader()
            reader.onload = (ev) => {
              if (typeof ev.target?.result === 'string') {
                try {
                  const parsed = JSON.parse(ev.target.result)
                  pipelineSchema.parse(parsed)
                  deserializePipeline(ev.target.result)
                } catch (error) {
                  console.error('Invalid JSON pipeline payload dropped:', error)
                  alert('Invalid pipeline node structure detected!')
                }
              }
            }
            reader.readAsText(file) // Expect UTF-8 encoded text blob
          }}
        >
          <FlowCanvas />
        </main>

        {mode === 'inspect'  && <InspectorPanel />}
        {mode === 'test'     && <TestPanel />}
        {mode === 'suite'    && <TestSuitePanel />}
        {mode === 'versions' && <VersionPanel />}
      </div>
    </div>
  )
}
