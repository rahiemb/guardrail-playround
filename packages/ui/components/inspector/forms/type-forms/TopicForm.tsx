'use client'

import { useState } from 'react'

interface Props {
  config:   Record<string, unknown>
  onChange: (patch: Record<string, unknown>) => void
}

function TagInput({ label, tags, onAdd, onRemove, color }: { label: string; tags: string[]; onAdd: (t: string) => void; onRemove: (t: string) => void; color: string }) {
  const [draft, setDraft] = useState('')

  function commit() {
    const trimmed = draft.trim()
    if (trimmed && !tags.includes(trimmed)) onAdd(trimmed)
    setDraft('')
  }

  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, minHeight: 32, padding: '4px 6px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
        {tags.map((t) => (
          <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontFamily: 'var(--font-mono)', color, background: `${color}18`, border: `1px solid ${color}40`, borderRadius: 4, padding: '1px 6px' }}>
            {t}
            <button onClick={() => onRemove(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', color, fontSize: 11, padding: 0, lineHeight: 1 }}>×</button>
          </span>
        ))}
        <input placeholder="Add, Enter" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commit() } }} onBlur={commit} style={{ background: 'none', border: 'none', outline: 'none', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text)', minWidth: 80, flex: 1 }} />
      </div>
    </div>
  )
}

export default function TopicForm({ config, onChange }: Props) {
  const blockedConfig = (config.blocked_topics as Record<string, string[]>) ?? {}
  const blocked = Object.keys(blockedConfig)

  const allowedConfig = (config.allowed_topics as Record<string, string[]>) ?? {}
  const allowed = Object.keys(allowedConfig)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <TagInput label="Blocked topics" tags={blocked} color="#ef4444"
        onAdd={(t) => onChange({ blocked_topics: { ...blockedConfig, [t]: [t] } })}
        onRemove={(t) => {
          const next = { ...blockedConfig }
          delete next[t]
          onChange({ blocked_topics: next })
        }} />
      <TagInput label="Allowed topics" tags={allowed} color="#10b981"
        onAdd={(t) => onChange({ allowed_topics: { ...allowedConfig, [t]: [t] } })}
        onRemove={(t) => {
          const next = { ...allowedConfig }
          delete next[t]
          onChange({ allowed_topics: next })
        }} />
    </div>
  )
}
