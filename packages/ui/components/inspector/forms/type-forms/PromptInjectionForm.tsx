'use client'

interface Props {
  config:   Record<string, unknown>
  onChange: (patch: Record<string, unknown>) => void
}

export default function PromptInjectionForm({ config, onChange }: Props) {
  const sensitivity = (config.sensitivity as number) ?? 0.75

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontFamily: 'var(--font-sans)', color: 'var(--color-text-muted)' }}>Sensitivity</span>
        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#f97316', fontWeight: 600 }}>{sensitivity.toFixed(2)}</span>
      </div>
      <input type="range" min={0} max={1} step={0.01} value={sensitivity} onChange={(e) => onChange({ sensitivity: Number(e.target.value) })} style={{ width: '100%', accentColor: '#f97316', cursor: 'pointer' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--color-text-dim)', fontFamily: 'var(--font-sans)' }}>
        <span>Permissive</span>
        <span>Strict</span>
      </div>
      <div style={{ marginTop: 4, padding: '8px 10px', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: 11, color: 'var(--color-text-dim)', fontFamily: 'var(--font-sans)', lineHeight: 1.4 }}>
        {sensitivity < 0.4 ? '⚠️ Low sensitivity — only obvious injections blocked' : sensitivity < 0.7 ? '▲ Medium sensitivity — balanced detection' : '🛡️ High sensitivity — aggressive blocking, may have false positives'}
      </div>
    </div>
  )
}
