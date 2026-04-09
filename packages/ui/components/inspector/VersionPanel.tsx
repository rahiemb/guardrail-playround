'use client'

import { useState } from 'react'
import { usePipelineStore } from '@/lib/store/pipelineStore'
import type { PipelineVersion } from '@/lib/store/pipelineStore'
import type { Node } from '@xyflow/react'
import type { GuardrailNodeData } from '@/lib/types'

function formatTime(ts: number): string {
  const d = new Date(ts)
  return (
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
    ', ' +
    d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  )
}

function guardrailsFromNodes(nodes: Node[]): string[] {
  return nodes
    .filter(n => n.type === 'guardrailNode')
    .map(n => (n.data as unknown as GuardrailNodeData).guardrail.name)
}

// ─────────────────────────────────────────────────────────────
// Diff helpers
// ─────────────────────────────────────────────────────────────

interface DiffLine {
  name: string
  state: 'same' | 'added' | 'removed'
}

function diffGuardrails(aNames: string[], bNames: string[]): { a: DiffLine[]; b: DiffLine[] } {
  const aSet = new Set(aNames)
  const bSet = new Set(bNames)
  const allNames = Array.from(new Set([...aNames, ...bNames]))

  const a: DiffLine[] = allNames
    .filter(n => aSet.has(n))
    .map(n => ({ name: n, state: bSet.has(n) ? 'same' : 'removed' }))

  const b: DiffLine[] = allNames
    .filter(n => bSet.has(n))
    .map(n => ({ name: n, state: aSet.has(n) ? 'same' : 'added' }))

  return { a, b }
}

const DIFF_COLORS: Record<DiffLine['state'], { bg: string; text: string; border: string }> = {
  same:    { bg: 'transparent',             text: 'var(--color-text-muted)', border: 'transparent' },
  added:   { bg: 'rgba(16,185,129,0.10)',   text: '#6ee7b7',                 border: 'rgba(16,185,129,0.25)' },
  removed: { bg: 'rgba(239,68,68,0.10)',    text: '#fca5a5',                 border: 'rgba(239,68,68,0.25)' },
}

// ─────────────────────────────────────────────────────────────
// Compare section
// ─────────────────────────────────────────────────────────────

function CompareSection({
  versionA, versionB, indexA, indexB, onClear,
}: {
  versionA: PipelineVersion
  versionB: PipelineVersion
  indexA: number
  indexB: number
  onClear: () => void
}) {
  const aNamesRaw = guardrailsFromNodes(versionA.nodes)
  const bNamesRaw = guardrailsFromNodes(versionB.nodes)
  const { a: diffA, b: diffB } = diffGuardrails(aNamesRaw, bNamesRaw)
  const hasChanges = diffA.some(d => d.state !== 'same') || diffB.some(d => d.state !== 'same')

  return (
    <div style={{
      borderTop: '1px solid var(--color-border)',
      background: 'var(--color-surface-2)',
    }}>
      {/* Compare header */}
      <div style={{
        padding: '10px 14px 8px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a5b4fc', fontFamily: 'var(--font-sans)' }}>
          ⚖️ Comparing v{indexA + 1} vs v{indexB + 1}
        </span>
        <button
          onClick={onClear}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-text-dim)', fontFamily: 'var(--font-sans)', fontSize: 11,
            padding: '2px 6px',
          }}
        >
          ✕ Clear
        </button>
      </div>

      {!hasChanges ? (
        <div style={{ padding: '12px 14px', fontSize: 12, color: 'var(--color-text-dim)', fontFamily: 'var(--font-sans)', textAlign: 'center' }}>
          ✓ Identical guardrail sets
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
          {/* Column A */}
          <div style={{ borderRight: '1px solid var(--color-border)', padding: '0 0 10px' }}>
            <div style={{ padding: '4px 10px 6px', fontSize: 9, fontWeight: 700, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-sans)' }}>
              v{indexA + 1}
            </div>
            {diffA.length === 0 ? (
              <div style={{ padding: '4px 10px', fontSize: 11, color: 'var(--color-text-dim)', fontFamily: 'var(--font-sans)', fontStyle: 'italic' }}>empty</div>
            ) : diffA.map((line, i) => {
              const c = DIFF_COLORS[line.state]
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '3px 10px',
                  background: c.bg,
                  borderLeft: `2px solid ${c.border}`,
                  marginLeft: 2,
                }}>
                  {line.state === 'removed' && <span style={{ fontSize: 9, color: c.text }}>−</span>}
                  {line.state === 'same' && <span style={{ fontSize: 9, color: 'var(--color-text-dim)', opacity: 0 }}>·</span>}
                  <span style={{ fontSize: 11, color: c.text, fontFamily: 'var(--font-sans)', fontWeight: line.state === 'same' ? 400 : 600 }}>
                    {line.name}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Column B */}
          <div style={{ padding: '0 0 10px' }}>
            <div style={{ padding: '4px 10px 6px', fontSize: 9, fontWeight: 700, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-sans)' }}>
              v{indexB + 1}
            </div>
            {diffB.length === 0 ? (
              <div style={{ padding: '4px 10px', fontSize: 11, color: 'var(--color-text-dim)', fontFamily: 'var(--font-sans)', fontStyle: 'italic' }}>empty</div>
            ) : diffB.map((line, i) => {
              const c = DIFF_COLORS[line.state]
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '3px 10px',
                  background: c.bg,
                  borderLeft: `2px solid ${c.border}`,
                  marginLeft: 2,
                }}>
                  {line.state === 'added' && <span style={{ fontSize: 9, color: c.text }}>+</span>}
                  {line.state === 'same' && <span style={{ fontSize: 9, opacity: 0 }}>·</span>}
                  <span style={{ fontSize: 11, color: c.text, fontFamily: 'var(--font-sans)', fontWeight: line.state === 'same' ? 400 : 600 }}>
                    {line.name}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main panel
// ─────────────────────────────────────────────────────────────

export default function VersionPanel() {
  const { versions, saveVersion, loadVersion } = usePipelineStore()
  const [selected, setSelected] = useState<number[]>([])

  function handleManualSave() {
    const label = window.prompt('Version label (optional):', 'Manual save')
    if (label === null) return
    saveVersion(label || 'Manual save')
  }

  function toggleSelect(i: number) {
    setSelected(prev => {
      if (prev.includes(i)) return prev.filter(x => x !== i)
      if (prev.length >= 2) return [prev[1], i] // slide window — drop oldest
      return [...prev, i]
    })
  }

  const isComparing = selected.length === 2
  const [idxA, idxB] = isComparing ? [Math.min(...selected), Math.max(...selected)] : [-1, -1]

  return (
    <aside style={{
      width: 'var(--inspector-width)',
      height: '100%',
      background: 'var(--color-surface)',
      borderLeft: '1px solid var(--color-border)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--color-border)' }}>
        <h2 style={{
          fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700,
          color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0,
        }}>
          Version History
        </h2>
        <p style={{ fontSize: 11, color: 'var(--color-text-dim)', marginTop: 4, fontFamily: 'var(--font-sans)' }}>
          {selected.length === 0
            ? 'Select 2 versions to compare'
            : selected.length === 1
              ? 'Select 1 more to compare'
              : 'Comparing below ↓'}
        </p>
      </div>

      {/* Save button */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border)' }}>
        <button
          id="save-version-btn"
          onClick={handleManualSave}
          style={{
            width: '100%', padding: '7px 12px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none', borderRadius: 8,
            color: '#fff', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', transition: 'opacity 0.15s',
            boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          💾 Save Current Version
        </button>
      </div>

      {/* Version list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {versions.length === 0 ? (
          <div style={{
            padding: '40px 16px', textAlign: 'center',
            color: 'var(--color-text-dim)', fontFamily: 'var(--font-sans)', fontSize: 12,
          }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>🕒</div>
            No versions yet.
            <br />Run a pipeline or save manually.
          </div>
        ) : (
          <>
            {versions.map((v, i) => {
              const guardrailCount = v.nodes.filter(n => n.type === 'guardrailNode').length
              const isAutoSave = v.label.startsWith('Auto-save')
              const isSelected = selected.includes(i)
              const isNewest = i === 0

              return (
                <div
                  key={v.timestamp}
                  style={{
                    padding: '10px 14px',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex', gap: 8, alignItems: 'flex-start',
                    transition: 'background 0.1s',
                    background: isSelected ? 'rgba(99,102,241,0.06)' : 'transparent',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--color-surface-2)' }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                >
                  {/* Compare checkbox */}
                  <label
                    title={isSelected ? 'Deselect for comparison' : 'Select for comparison'}
                    style={{
                      marginTop: 3, width: 14, height: 14, flexShrink: 0,
                      display: 'flex', alignItems: 'center', cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      id={`compare-check-${i}`}
                      checked={isSelected}
                      onChange={() => toggleSelect(i)}
                      style={{ width: 13, height: 13, cursor: 'pointer', accentColor: '#6366f1' }}
                    />
                  </label>

                  {/* Index badge */}
                  <div style={{
                    width: 22, height: 22, borderRadius: 5, flexShrink: 0,
                    background: isNewest ? 'rgba(99,102,241,0.2)' : 'var(--color-surface-2)',
                    border: `1px solid ${isNewest ? 'rgba(99,102,241,0.4)' : 'var(--color-border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 700, color: isNewest ? '#a5b4fc' : 'var(--color-text-dim)',
                    fontFamily: 'var(--font-sans)',
                  }}>
                    {i + 1}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{
                        fontSize: 12, fontWeight: 600, color: 'var(--color-text)',
                        fontFamily: 'var(--font-sans)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                      }}>
                        {v.label}
                      </span>
                      {isAutoSave && (
                        <span style={{
                          fontSize: 9, padding: '1px 5px', borderRadius: 3, flexShrink: 0,
                          background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)',
                          color: '#6ee7b7', fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: '0.04em',
                        }}>AUTO</span>
                      )}
                    </div>

                    <div style={{ fontSize: 10, color: 'var(--color-text-dim)', fontFamily: 'var(--font-sans)', marginTop: 2 }}>
                      {formatTime(v.timestamp)} · {guardrailCount} guardrail{guardrailCount !== 1 ? 's' : ''}
                    </div>

                    <button
                      id={`restore-version-${i}`}
                      onClick={() => loadVersion(i)}
                      style={{
                        marginTop: 6, padding: '3px 9px',
                        background: 'transparent',
                        border: '1px solid var(--color-border)',
                        borderRadius: 5,
                        color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', fontSize: 11,
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = 'var(--color-accent)'
                        e.currentTarget.style.color = 'var(--color-accent)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'var(--color-border)'
                        e.currentTarget.style.color = 'var(--color-text-muted)'
                      }}
                    >
                      ↩ Restore
                    </button>
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>

      {/* Footer count */}
      {versions.length > 0 && !isComparing && (
        <div style={{ padding: '8px 14px', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: 10, color: 'var(--color-text-dim)', textAlign: 'center', fontFamily: 'var(--font-sans)' }}>
            {versions.length} / 10 snapshots stored
          </div>
        </div>
      )}

      {/* Compare section */}
      {isComparing && versions[idxA] && versions[idxB] && (
        <CompareSection
          versionA={versions[idxA]}
          versionB={versions[idxB]}
          indexA={idxA}
          indexB={idxB}
          onClear={() => setSelected([])}
        />
      )}
    </aside>
  )
}
