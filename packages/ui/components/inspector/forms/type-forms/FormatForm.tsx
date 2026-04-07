'use client'

interface Props {
  config:   Record<string, unknown>
  onChange: (patch: Record<string, unknown>) => void
}

const FORMATS = [
  { value: 'json',     label: 'JSON',       icon: '{ }' },
  { value: 'xml',      label: 'XML',        icon: '<>'  },
  { value: 'markdown', label: 'Markdown',   icon: '## ' },
  { value: 'text',     label: 'Plain text', icon: '¶'   },
]

export default function FormatForm({ config, onChange }: Props) {
  const expected = (config.expected_format as string) ?? 'json'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Expected format</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {FORMATS.map(({ value, label, icon }) => {
          const active = expected === value
          return (
            <button
              key={value}
              onClick={() => onChange({ expected_format: value })}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                padding: '10px 8px',
                background: active ? 'rgba(16,185,129,0.1)' : 'var(--color-surface-2)',
                border: `1px solid ${active ? '#10b981' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-sm)',
                color: active ? '#10b981' : 'var(--color-text-muted)',
                cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'var(--font-mono)',
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 700 }}>{icon}</span>
              <span style={{ fontSize: 10 }}>{label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
