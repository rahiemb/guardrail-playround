'use client'

import { useState } from 'react'
import { usePipelineStore } from '@/lib/store/pipelineStore'

export default function Header() {
  const [isDark, setIsDark] = useState(true)
  const { isRunning, nodes, runPipeline, resetPipeline } = usePipelineStore()
  const hasGuardrails = nodes.some((n) => n.type === 'guardrailNode')

  function toggleTheme() {
    const html = document.documentElement
    if (isDark) {
      html.classList.remove('dark')
      html.style.setProperty('--color-bg', '#f8fafc')
      html.style.setProperty('--color-surface', '#ffffff')
      html.style.setProperty('--color-surface-2', '#f1f5f9')
      html.style.setProperty('--color-border', '#e2e8f0')
      html.style.setProperty('--color-border-subtle', '#f0f4f8')
      html.style.setProperty('--color-text', '#0f172a')
      html.style.setProperty('--color-text-muted', '#64748b')
      html.style.setProperty('--color-text-dim', '#94a3b8')
    } else {
      html.classList.add('dark')
      html.style.removeProperty('--color-bg')
      html.style.removeProperty('--color-surface')
      html.style.removeProperty('--color-surface-2')
      html.style.removeProperty('--color-border')
      html.style.removeProperty('--color-border-subtle')
      html.style.removeProperty('--color-text')
      html.style.removeProperty('--color-text-muted')
      html.style.removeProperty('--color-text-dim')
    }
    setIsDark(!isDark)
  }

  return (
    <header
      style={{
        height: 'var(--header-height)', background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)', display: 'flex',
        alignItems: 'center', padding: '0 20px', gap: 12, flexShrink: 0, zIndex: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, boxShadow: '0 2px 8px rgba(99,102,241,0.4)', flexShrink: 0 }}>
          🛡️
        </div>
        <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 15, color: 'var(--color-text)', letterSpacing: '-0.01em' }}>
          Guardrail<span style={{ color: 'var(--color-accent)', marginLeft: 2 }}>Playground</span>
        </span>
      </div>

      <div style={{ padding: '2px 10px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 99, fontSize: 10, color: '#a5b4fc', fontFamily: 'var(--font-sans)', fontWeight: 500, letterSpacing: '0.04em' }}>
        v0.3.0 · Phase 3
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          id="run-pipeline-btn"
          disabled={isRunning || !hasGuardrails}
          onClick={() => runPipeline()}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
            background: isRunning ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff',
            fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600,
            cursor: isRunning || !hasGuardrails ? 'not-allowed' : 'pointer',
            opacity: hasGuardrails ? 1 : 0.5,
            boxShadow: hasGuardrails ? '0 2px 8px rgba(99,102,241,0.4)' : 'none',
            transition: 'all 0.15s',
          }}
        >
          {isRunning ? '⏳ Running…' : '▶ Run Pipeline'}
        </button>

        <button
          id="reset-pipeline-btn"
          title="Reset canvas to default"
          onClick={resetPipeline}
          style={{ padding: '6px 10px', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', fontSize: 11, cursor: 'pointer', transition: 'all 0.15s' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-text-muted)'; e.currentTarget.style.color = 'var(--color-text)' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-muted)' }}
        >
          ↺ Reset
        </button>

        <button
          onClick={toggleTheme}
          id="theme-toggle"
          aria-label="Toggle dark/light mode"
          style={{ width: 34, height: 34, borderRadius: 'var(--radius-sm)', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16, transition: 'background 0.15s, border-color 0.15s' }}
          onMouseEnter={(e) => { ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--color-border)' }}
          onMouseLeave={(e) => { ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surface-2)' }}
        >
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  )
}
