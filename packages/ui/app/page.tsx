'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Header from '@/components/common/Header'
import GuardrailPalette from '@/components/sidebar/GuardrailPalette'
import InspectorPanel from '@/components/inspector/InspectorPanel'
import TestPanel from '@/components/testing/TestPanel'

// React Flow must be dynamically imported (no SSR) because it uses browser APIs
const FlowCanvas = dynamic(() => import('@/components/canvas/FlowCanvas'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg)',
        color: 'var(--color-text-dim)',
        fontFamily: 'var(--font-sans)',
        fontSize: 13,
        gap: 10,
      }}
    >
      <span style={{ fontSize: 20, animation: 'pulse 1.5s ease-in-out infinite' }}>⚡</span>
      Loading canvas...
    </div>
  ),
})

export default function Home() {
  const [mode, setMode] = useState<'inspect' | 'test'>('inspect')

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        overflow: 'hidden',
        background: 'var(--color-bg)',
      }}
    >
      <Header />

      {/* Mode toggle bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 16px',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: 'var(--color-text-dim)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontFamily: 'var(--font-sans)',
            marginRight: 6,
          }}
        >
          Right panel:
        </span>
        {(
          [
            { key: 'inspect', label: '🔍 Inspector', id: 'mode-inspect-btn' },
            { key: 'test', label: '🧪 Test', id: 'mode-test-btn' },
          ] as const
        ).map(({ key, label, id }) => (
          <button
            key={key}
            id={id}
            onClick={() => setMode(key)}
            style={{
              padding: '4px 12px',
              borderRadius: 'var(--radius-sm)',
              border: mode === key ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
              background: mode === key ? 'var(--color-accent-glow)' : 'transparent',
              color: mode === key ? 'var(--color-accent)' : 'var(--color-text-muted)',
              fontSize: 11,
              fontFamily: 'var(--font-sans)',
              fontWeight: mode === key ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <GuardrailPalette />

        <main
          style={{
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
            minWidth: 0,
          }}
        >
          <FlowCanvas />
        </main>

        {mode === 'inspect' ? <InspectorPanel /> : <TestPanel />}
      </div>
    </div>
  )
}
