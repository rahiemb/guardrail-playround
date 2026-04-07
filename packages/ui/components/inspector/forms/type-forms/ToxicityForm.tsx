'use client'

interface Props {
  config:   Record<string, unknown>
  onChange: (patch: Record<string, unknown>) => void
}

const CATEGORIES = [
  { key: 'toxicity',        label: 'Toxicity',       color: '#ef4444' },
  { key: 'obscenity',       label: 'Obscenity',      color: '#f97316' },
  { key: 'threat',          label: 'Threat',         color: '#f59e0b' },
  { key: 'insult',          label: 'Insult',         color: '#a855f7' },
  { key: 'identity_attack', label: 'Identity Attack', color: '#6366f1' },
]

function SliderRow({ label, value, color, onChange }: { label: string; value: number; color: string; onChange: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontFamily: 'var(--font-sans)', color: 'var(--color-text-muted)' }}>{label}</span>
        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color, fontWeight: 600 }}>{value.toFixed(2)}</span>
      </div>
      <input type="range" min={0} max={1} step={0.01} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ width: '100%', accentColor: color, cursor: 'pointer' }} />
    </div>
  )
}

export default function ToxicityForm({ config, onChange }: Props) {
  const threshold = (config.threshold as number) ?? 0.5

  function getCat(key: string) { return (config[`${key}_threshold`] as number) ?? threshold }
  function setCat(key: string, value: number) { onChange({ [`${key}_threshold`]: value }) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Global threshold</div>
        <SliderRow label="Default" value={threshold} color="#ef4444" onChange={(v) => onChange({ threshold: v })} />
      </div>
      <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)' }} />
      <div>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Per-category overrides</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {CATEGORIES.map(({ key, label, color }) => (
            <SliderRow key={key} label={label} value={getCat(key)} color={color} onChange={(v) => setCat(key, v)} />
          ))}
        </div>
      </div>
    </div>
  )
}
