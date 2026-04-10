'use client'

import { useState, useEffect, useRef } from 'react'
import { usePipelineStore } from '@/lib/store/pipelineStore'
import Link from 'next/link'
import ExportModal from '@/components/canvas/ExportModal'

export default function Header() {
  const [isMounted, setIsMounted] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true)
  }, [])

  const [isDark, setIsDark] = useState(true)
  const { isRunning, nodes, runPipeline, resetPipeline, serializePipeline, deserializePipeline } = usePipelineStore()
  const hasGuardrails = nodes.some((n) => n.type === 'guardrailNode')

  function toggleTheme() {
    document.documentElement.classList.toggle('dark')
    setIsDark(prev => !prev)
  }

  function handleExport() {
    const json = serializePipeline()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'pipeline.guardrail.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result
      if (typeof text === 'string') {
        deserializePipeline(text)
      }
    }
    reader.readAsText(file)
    // Reset so the same file can be re-imported
    e.target.value = ''
  }

  function handleShare() {
    const json = serializePipeline()
    const encoded = btoa(unescape(encodeURIComponent(json)))
    const shareUrl = `${window.location.origin}${window.location.pathname}#pipeline=${encoded}`
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('Share URL copied to clipboard!')
    }).catch(() => {
      prompt('Copy this share URL:', shareUrl)
    })
  }

  const navLinkStyle: React.CSSProperties = {
    padding: '4px 10px',
    borderRadius: 6,
    border: '1px solid var(--color-border)',
    background: 'transparent',
    color: 'var(--color-text-muted)',
    fontFamily: 'var(--font-sans)',
    fontSize: 11,
    fontWeight: 500,
    textDecoration: 'none',
    transition: 'all 0.15s',
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    whiteSpace: 'nowrap' as const,
  }

  return (
    <header
      style={{
        height: 'var(--header-height)', background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)', display: 'flex',
        alignItems: 'center', padding: '0 16px', gap: 10, flexShrink: 0, zIndex: 10,
        overflowX: 'auto',
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, boxShadow: '0 2px 8px rgba(99,102,241,0.4)', flexShrink: 0 }}>
          🛡️
        </div>
        <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14, color: 'var(--color-text)', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
          Guardrail<span style={{ color: 'var(--color-accent)', marginLeft: 2 }}>Playground</span>
        </span>
      </div>

      {/* Version badge */}
      <div style={{ padding: '2px 8px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 99, fontSize: 9, color: '#a5b4fc', fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: '0.04em', flexShrink: 0 }}>
        v0.5.0 · Phase 5
      </div>

      {/* Nav links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 6, flexShrink: 0 }}>
        <Link
          href="/templates"
          id="nav-templates"
          style={navLinkStyle}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-text-muted)'; e.currentTarget.style.color = 'var(--color-text)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-muted)' }}
        >
          🧩 Templates
        </Link>
        <Link
          href="/catalog"
          id="nav-catalog"
          style={navLinkStyle}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-text-muted)'; e.currentTarget.style.color = 'var(--color-text)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-muted)' }}
        >
          📚 Catalog
        </Link>
        <Link
          href="/analytics"
          id="nav-analytics"
          style={navLinkStyle}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-text-muted)'; e.currentTarget.style.color = 'var(--color-text)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-muted)' }}
        >
          📈 Analytics
        </Link>
        <Link
          href="/ab-testing"
          id="nav-ab-testing"
          style={navLinkStyle}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-text-muted)'; e.currentTarget.style.color = 'var(--color-text)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-muted)' }}
        >
          ⚖️ A/B Test
        </Link>
      </div>

      {/* Right actions */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>

        {/* Integration Export */}
        <button
          id="integration-export-btn"
          title="Export integration code"
          onClick={() => setIsExportModalOpen(true)}
          style={{
            padding: '5px 10px', background: 'transparent',
            border: '1px solid var(--color-border)', borderRadius: 6,
            color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', fontSize: 11, cursor: 'pointer',
            transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 5,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-text-muted)'; e.currentTarget.style.color = 'var(--color-text)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-muted)' }}
        >
          {"</>"} Code
        </button>

        {/* JSON Export */}
        <button
          id="export-pipeline-btn"
          title="Export pipeline as .guardrail.json"
          onClick={handleExport}
          style={{
            padding: '5px 10px', background: 'transparent',
            border: '1px solid var(--color-border)', borderRadius: 6,
            color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', fontSize: 11, cursor: 'pointer',
            transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 5,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-text-muted)'; e.currentTarget.style.color = 'var(--color-text)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-muted)' }}
        >
          ↓ JSON
        </button>

        {/* Import */}
        <button
          id="import-pipeline-btn"
          title="Import pipeline from .guardrail.json"
          onClick={handleImportClick}
          style={{
            padding: '5px 10px', background: 'transparent',
            border: '1px solid var(--color-border)', borderRadius: 6,
            color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', fontSize: 11, cursor: 'pointer',
            transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 5,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-text-muted)'; e.currentTarget.style.color = 'var(--color-text)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-muted)' }}
        >
          ↑ Import
        </button>
        <input ref={fileInputRef} type="file" accept=".json,.guardrail.json" style={{ display: 'none' }} onChange={handleFileChange} />

        {/* Share */}
        <button
          id="share-pipeline-btn"
          title="Copy shareable URL to clipboard"
          onClick={handleShare}
          style={{
            padding: '5px 10px', background: 'transparent',
            border: '1px solid var(--color-border)', borderRadius: 6,
            color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', fontSize: 11, cursor: 'pointer',
            transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 5,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-text-muted)'; e.currentTarget.style.color = 'var(--color-text)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-muted)' }}
        >
          🔗 Share
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: 'var(--color-border)', flexShrink: 0 }} />

        {/* Run */}
        <button
          id="run-pipeline-btn"
          disabled={!isMounted || isRunning || !hasGuardrails}
          onClick={() => runPipeline()}
          style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
            background: isRunning ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none', borderRadius: 6, color: '#fff',
            fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600,
            cursor: !isMounted || isRunning || !hasGuardrails ? 'not-allowed' : 'pointer',
            opacity: isMounted && hasGuardrails ? 1 : 0.5,
            boxShadow: isMounted && hasGuardrails ? '0 2px 8px rgba(99,102,241,0.4)' : 'none',
            transition: 'all 0.15s',
          }}
        >
          {isRunning ? '⏳ Running…' : '▶ Run Pipeline'}
        </button>

        {/* Reset */}
        <button
          id="reset-pipeline-btn"
          title="Reset canvas to default"
          onClick={resetPipeline}
          style={{ padding: '6px 9px', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 6, color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', fontSize: 11, cursor: 'pointer', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-text-muted)'; e.currentTarget.style.color = 'var(--color-text)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-muted)' }}
        >
          ↺ Reset
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          id="theme-toggle"
          aria-label="Toggle dark/light mode"
          style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 15, transition: 'background 0.15s, border-color 0.15s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-border)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surface-2)' }}
        >
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>

      {isExportModalOpen && (
        <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} />
      )}
    </header>
  )
}
