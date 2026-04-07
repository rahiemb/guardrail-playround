'use client'

import { useState } from 'react'

interface Props {
  config:   Record<string, unknown>
  onChange: (patch: Record<string, unknown>) => void
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)', color: 'var(--color-text)', fontFamily: 'var(--font-mono)',
  fontSize: 12, padding: '6px 10px', outline: 'none', boxSizing: 'border-box',
}

export default function RegexForm({ config, onChange }: Props) {
  const pattern = (config.pattern as string) ?? ''
  const flags   = (config.flags   as string) ?? 'i'

  const [testStr, setTestStr]   = useState('')
  const [matchHit, setMatchHit] = useState<boolean | null>(null)

  function runTest() {
    try {
      const re = new RegExp(pattern, flags)
      setMatchHit(re.test(testStr))
    } catch {
      setMatchHit(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Pattern</div>
        <input style={inputStyle} placeholder="e.g. \d{3}-\d{2}-\d{4}" value={pattern} onChange={(e) => onChange({ pattern: e.target.value })} />
      </div>
      <div>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Flags</div>
        <input style={{ ...inputStyle, maxWidth: 80 }} placeholder="i" value={flags} onChange={(e) => onChange({ flags: e.target.value })} />
      </div>
      <div>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Live Tester</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            style={{ ...inputStyle, flex: 1 }}
            placeholder="Test string..."
            value={testStr}
            onChange={(e) => { setTestStr(e.target.value); setMatchHit(null) }}
            onKeyDown={(e) => e.key === 'Enter' && runTest()}
          />
          <button onClick={runTest} style={{ padding: '6px 10px', background: 'var(--color-accent)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: 11, fontFamily: 'var(--font-sans)', cursor: 'pointer', flexShrink: 0 }}>
            Test
          </button>
        </div>
        {matchHit !== null && (
          <div style={{ marginTop: 6, fontSize: 11, fontFamily: 'var(--font-mono)', color: matchHit ? 'var(--color-success)' : 'var(--color-text-dim)', padding: '4px 8px', background: matchHit ? 'rgba(16,185,129,0.08)' : 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)', border: `1px solid ${matchHit ? 'rgba(16,185,129,0.25)' : 'var(--color-border)'}` }}>
            {matchHit ? '✓ match found' : '✗ no match'}
          </div>
        )}
      </div>
    </div>
  )
}
