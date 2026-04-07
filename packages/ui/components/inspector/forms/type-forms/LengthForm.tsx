'use client'

interface Props {
  config:   Record<string, unknown>
  onChange: (patch: Record<string, unknown>) => void
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)', color: 'var(--color-text)', fontFamily: 'var(--font-mono)',
  fontSize: 12, padding: '6px 10px', outline: 'none', boxSizing: 'border-box',
}

export default function LengthForm({ config, onChange }: Props) {
  const minChars = (config.min_chars as number) ?? 0
  const maxChars = (config.max_chars as number) ?? 2000

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Min chars</div>
          <input type="number" min={0} style={inputStyle} value={minChars} onChange={(e) => onChange({ min_chars: Number(e.target.value) })} />
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Max chars</div>
          <input type="number" min={1} style={inputStyle} value={maxChars} onChange={(e) => onChange({ max_chars: Number(e.target.value) })} />
        </div>
      </div>
      <div style={{ fontSize: 10, color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)', padding: '6px 10px', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
        Allowed: {minChars} – {maxChars} characters
      </div>
    </div>
  )
}
