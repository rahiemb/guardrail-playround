'use client'

import { useState } from 'react'
import { useTestStore } from '@/lib/store/testStore'
import type { Guardrail, GuardrailType, GuardrailAction, ValidationStatus } from '@/lib/types'

// ─────────────────────────────────────────────────────────────
// Quick-add guardrail presets for the test panel
// ─────────────────────────────────────────────────────────────

interface GuardrailPreset {
  id: string
  name: string
  icon: string
  type: GuardrailType
  action: GuardrailAction
  config: Record<string, unknown>
}

const PRESETS: GuardrailPreset[] = [
  {
    id: 'preset-ssn',
    name: 'SSN Redactor',
    icon: '🔒',
    type: 'regex',
    action: 'modify',
    config: { pattern: '\\d{3}-\\d{2}-\\d{4}', replacement: '[SSN REDACTED]' },
  },
  {
    id: 'preset-keyword',
    name: 'Keyword Block',
    icon: '🏷️',
    type: 'keyword',
    action: 'block',
    config: { deny_list: ['bomb', 'weapon', 'hack', 'exploit'] },
  },
  {
    id: 'preset-injection',
    name: 'Injection Guard',
    icon: '⚠️',
    type: 'prompt_injection',
    action: 'block',
    config: { sensitivity: 0.5 },
  },
  {
    id: 'preset-length',
    name: 'Length Cap',
    icon: '📏',
    type: 'length',
    action: 'block',
    config: { max_chars: 500 },
  },
  {
    id: 'preset-pii',
    name: 'PII Detector',
    icon: '🛡️',
    type: 'pii',
    action: 'modify',
    config: { action: 'redact' },
  },
  {
    id: 'preset-json',
    name: 'JSON Format',
    icon: '📋',
    type: 'format',
    action: 'block',
    config: { format: 'json' },
  },
]

// ─────────────────────────────────────────────────────────────
// Status helpers
// ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ValidationStatus, { label: string; color: string; bg: string; icon: string }> = {
  pass: { label: 'PASS', color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: '✓' },
  fail: { label: 'FAIL', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', icon: '✗' },
  warn: { label: 'WARN', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: '⚠' },
  modify: { label: 'MOD', color: '#6366f1', bg: 'rgba(99,102,241,0.12)', icon: '✎' },
}

function StatusBadge({ status }: { status: ValidationStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 700,
        fontFamily: 'var(--font-mono)',
        letterSpacing: '0.06em',
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.color}33`,
      }}
    >
      {cfg.icon} {cfg.label}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────
// TestPanel component
// ─────────────────────────────────────────────────────────────

export default function TestPanel() {
  const {
    inputText,
    selectedGuardrails,
    mode,
    results,
    isRunning,
    error,
    setInputText,
    setMode,
    addGuardrail,
    removeGuardrail,
    runTest,
    clearResults,
  } = useTestStore()

  const [hoveredPreset, setHoveredPreset] = useState<string | null>(null)

  function handleAddPreset(preset: GuardrailPreset) {
    const g: Guardrail = {
      id: preset.id,
      name: preset.name,
      type: preset.type,
      position: 'input',
      config: preset.config,
      action: preset.action,
      severity: 'medium',
      enabled: true,
    }
    addGuardrail(g)
  }

  const charCount = inputText.length
  const isReady = inputText.trim().length > 0 && selectedGuardrails.length > 0

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
      {/* Header */}
      <div
        style={{
          padding: '16px 16px 12px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            🧪 Test Panel
          </h2>
          <p style={{ fontSize: 10, color: 'var(--color-text-dim)', marginTop: 3 }}>
            Validate text against guardrails
          </p>
        </div>
        {results && (
          <button
            onClick={clearResults}
            title="Clear results"
            style={{
              background: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-text-dim)',
              fontSize: 11,
              padding: '3px 8px',
              cursor: 'pointer',
            }}
          >
            ✕ Clear
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0 }}>
        {/* Input textarea */}
        <section style={{ padding: 16, borderBottom: '1px solid var(--color-border-subtle)' }}>
          <label
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              display: 'block',
              marginBottom: 8,
              fontFamily: 'var(--font-sans)',
            }}
          >
            Input Text
          </label>
          <textarea
            id="test-panel-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={5}
            placeholder="Type text to test against your guardrails…"
            style={{
              width: '100%',
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-text)',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              padding: '8px 10px',
              resize: 'vertical',
              outline: 'none',
              lineHeight: 1.5,
              transition: 'border-color 0.15s',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--color-accent)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 4,
              fontSize: 10,
              color: 'var(--color-text-dim)',
              fontFamily: 'var(--font-sans)',
            }}
          >
            <span>{charCount} chars</span>
            <span>{inputText.trim().split(/\s+/).filter(Boolean).length} tokens</span>
          </div>
        </section>

        {/* Guardrail selector */}
        <section style={{ padding: 16, borderBottom: '1px solid var(--color-border-subtle)' }}>
          <label
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              display: 'block',
              marginBottom: 8,
              fontFamily: 'var(--font-sans)',
            }}
          >
            Guardrails ({selectedGuardrails.length})
          </label>

          {/* Quick-add presets */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {PRESETS.map((preset) => {
              const isActive = selectedGuardrails.some((g) => g.id === preset.id)
              const isHovered = hoveredPreset === preset.id
              return (
                <button
                  key={preset.id}
                  onClick={() => (isActive ? removeGuardrail(preset.id) : handleAddPreset(preset))}
                  onMouseEnter={() => setHoveredPreset(preset.id)}
                  onMouseLeave={() => setHoveredPreset(null)}
                  title={isActive ? `Remove ${preset.name}` : `Add ${preset.name}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '4px 9px',
                    borderRadius: 'var(--radius-sm)',
                    border: isActive
                      ? '1px solid var(--color-accent)'
                      : '1px solid var(--color-border)',
                    background: isActive
                      ? 'var(--color-accent-glow)'
                      : isHovered
                      ? 'var(--color-surface-2)'
                      : 'transparent',
                    color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
                    fontSize: 11,
                    fontFamily: 'var(--font-sans)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  <span style={{ fontSize: 12 }}>{preset.icon}</span>
                  {preset.name}
                  {isActive && <span style={{ fontSize: 10, opacity: 0.7 }}>✕</span>}
                </button>
              )
            })}
          </div>

          {/* Selected guardrail chips */}
          {selectedGuardrails.length === 0 && (
            <p
              style={{
                fontSize: 11,
                color: 'var(--color-text-dim)',
                fontFamily: 'var(--font-sans)',
                fontStyle: 'italic',
              }}
            >
              Click a preset above to add guardrails.
            </p>
          )}
        </section>

        {/* Mode selector */}
        <section style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border-subtle)' }}>
          <label
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              display: 'block',
              marginBottom: 8,
              fontFamily: 'var(--font-sans)',
            }}
          >
            Pipeline Mode
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['run_all', 'short_circuit'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  flex: 1,
                  padding: '6px 0',
                  borderRadius: 'var(--radius-sm)',
                  border: mode === m ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                  background: mode === m ? 'var(--color-accent-glow)' : 'var(--color-surface-2)',
                  color: mode === m ? 'var(--color-accent)' : 'var(--color-text-muted)',
                  fontSize: 11,
                  fontFamily: 'var(--font-sans)',
                  fontWeight: mode === m ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {m === 'run_all' ? 'Run All' : 'Short Circuit'}
              </button>
            ))}
          </div>
        </section>

        {/* Results */}
        {(results || error) && (
          <section
            className="animate-fade-in-up"
            style={{ padding: 16, borderBottom: '1px solid var(--color-border-subtle)' }}
          >
            <label
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                display: 'block',
                marginBottom: 10,
                fontFamily: 'var(--font-sans)',
              }}
            >
              Results
            </label>

            {error && (
              <div
                style={{
                  padding: '10px 12px',
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 11,
                  color: '#ef4444',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                ⚠ {error}
              </div>
            )}

            {results && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Summary row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: results.blocked ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
                    border: `1px solid ${results.blocked ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: results.blocked ? '#ef4444' : '#10b981',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    {results.blocked ? '✗ BLOCKED' : '✓ PASSED'}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      color: 'var(--color-text-dim)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {results.total_time_ms.toFixed(1)}ms
                  </span>
                </div>

                {/* Per-guardrail results */}
                {results.results.map((r, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '8px 10px',
                      background: 'var(--color-surface-2)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: r.message ? 4 : 0 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          color: 'var(--color-text)',
                          fontFamily: 'var(--font-sans)',
                        }}
                      >
                        {r.guardrail_name}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 10, color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)' }}>
                          {r.execution_time_ms.toFixed(1)}ms
                        </span>
                        <StatusBadge status={r.status as ValidationStatus} />
                      </div>
                    </div>
                    {r.message && (
                      <p
                        style={{
                          fontSize: 10,
                          color: 'var(--color-text-dim)',
                          fontFamily: 'var(--font-sans)',
                          lineHeight: 1.4,
                        }}
                      >
                        {r.message}
                      </p>
                    )}
                  </div>
                ))}

                {/* Output text */}
                {!results.blocked && results.output_text !== results.input_text && (
                  <div>
                    <div
                      style={{
                        fontSize: 10,
                        color: 'var(--color-text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        fontWeight: 600,
                        marginBottom: 4,
                        fontFamily: 'var(--font-sans)',
                      }}
                    >
                      Modified Output
                    </div>
                    <div
                      style={{
                        padding: '8px 10px',
                        background: 'rgba(99,102,241,0.08)',
                        border: '1px solid rgba(99,102,241,0.25)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 11,
                        color: 'var(--color-text)',
                        fontFamily: 'var(--font-mono)',
                        lineHeight: 1.5,
                        wordBreak: 'break-word',
                      }}
                    >
                      {results.output_text}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </div>

      {/* Run button */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--color-border)',
        }}
      >
        <button
          id="test-panel-run-btn"
          onClick={() => void runTest()}
          disabled={!isReady || isRunning}
          style={{
            width: '100%',
            padding: '10px 0',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: isReady && !isRunning ? 'var(--color-accent)' : 'var(--color-surface-2)',
            color: isReady && !isRunning ? '#fff' : 'var(--color-text-dim)',
            fontSize: 13,
            fontWeight: 600,
            fontFamily: 'var(--font-sans)',
            cursor: isReady && !isRunning ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
          onMouseEnter={(e) => {
            if (isReady && !isRunning)
              e.currentTarget.style.background = 'var(--color-accent-hover)'
          }}
          onMouseLeave={(e) => {
            if (isReady && !isRunning)
              e.currentTarget.style.background = 'var(--color-accent)'
          }}
        >
          {isRunning ? (
            <>
              <span style={{ animation: 'spin 0.8s linear infinite', display: 'inline-block' }}>⟳</span>
              Running…
            </>
          ) : (
            <>▶ Run Pipeline</>
          )}
        </button>

        {!isReady && !isRunning && (
          <p
            style={{
              fontSize: 10,
              color: 'var(--color-text-dim)',
              textAlign: 'center',
              marginTop: 6,
              fontFamily: 'var(--font-sans)',
            }}
          >
            {inputText.trim() === '' ? 'Enter some text above' : 'Select at least one guardrail'}
          </p>
        )}
      </div>
    </aside>
  )
}
