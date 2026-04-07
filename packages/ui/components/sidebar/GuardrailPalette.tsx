'use client'

import { useState } from 'react'

interface GuardrailEntry {
  id: string
  name: string
  icon: string
  description: string
  category: string
}

const GUARDRAILS: GuardrailEntry[] = [
  { id: 'pii',              name: 'PII Detector',      icon: '🔒', description: 'Redact personal information',  category: 'Privacy' },
  { id: 'toxicity',         name: 'Toxicity Filter',   icon: '🛡️', description: 'Block harmful content',        category: 'Safety' },
  { id: 'prompt_injection', name: 'Prompt Injection',  icon: '⚠️', description: 'Detect jailbreak attempts',    category: 'Security' },
  { id: 'regex',            name: 'Regex Filter',      icon: '🔍', description: 'Pattern-based matching',       category: 'Content' },
  { id: 'keyword',          name: 'Keyword Filter',    icon: '🏷️', description: 'Deny/allow word lists',        category: 'Content' },
  { id: 'length',           name: 'Length Limiter',    icon: '📏', description: 'Min/max token limits',         category: 'Format' },
  { id: 'topic',            name: 'Topic Validator',   icon: '🗂️', description: 'Block/allow topics',           category: 'Content' },
  { id: 'format',           name: 'Format Validator',  icon: '📋', description: 'Enforce JSON/XML/MD',          category: 'Format' },
]

const CATEGORIES = Array.from(new Set(GUARDRAILS.map((g) => g.category)))

const CATEGORY_COLORS: Record<string, string> = {
  Privacy:  '#8b5cf6',
  Safety:   '#ef4444',
  Security: '#f59e0b',
  Content:  '#3b82f6',
  Format:   '#10b981',
}

export default function GuardrailPalette() {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(CATEGORIES))

  function toggleCategory(cat: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) { next.delete(cat) } else { next.add(cat) }
      return next
    })
  }

  return (
    <aside
      style={{
        width:         'var(--sidebar-width)',
        height:        '100%',
        background:    'var(--color-surface)',
        borderRight:   '1px solid var(--color-border)',
        display:       'flex',
        flexDirection: 'column',
        overflow:      'hidden',
        flexShrink:    0,
      }}
    >
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--color-border)' }}>
        <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Guardrail Palette
        </h2>
        <p style={{ fontSize: 11, color: 'var(--color-text-dim)', marginTop: 4 }}>
          Drag to place on canvas
        </p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {CATEGORIES.map((category) => {
          const isExpanded = expandedCategories.has(category)
          const items = GUARDRAILS.filter((g) => g.category === category)
          const color = CATEGORY_COLORS[category] ?? '#6366f1'

          return (
            <div key={category}>
              <button
                onClick={() => toggleCategory(category)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 16px', background: 'transparent', border: 'none',
                  cursor: 'pointer', color: 'var(--color-text-muted)',
                  fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.08em', transition: 'color 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
              >
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
                {category}
                <span style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.5 }}>{isExpanded ? '▾' : '▸'}</span>
              </button>

              {isExpanded && (
                <div style={{ paddingBottom: 4 }}>
                  {items.map((item) => (
                    <div
                      key={item.id}
                      draggable
                      title={`Drag "${item.name}" onto the canvas`}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/guardrail', JSON.stringify({ type: item.id, name: item.name }))
                        e.dataTransfer.effectAllowed = 'copy'
                        ;(e.currentTarget as HTMLDivElement).style.opacity = '0.5'
                      }}
                      onDragEnd={(e) => { ;(e.currentTarget as HTMLDivElement).style.opacity = '1' }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 16px 8px 28px', cursor: 'grab',
                        transition: 'background 0.15s, opacity 0.15s', userSelect: 'none',
                      }}
                      onMouseEnter={(e) => { ;(e.currentTarget as HTMLDivElement).style.background = 'var(--color-surface-2)' }}
                      onMouseLeave={(e) => { ;(e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
                    >
                      <span style={{ fontSize: 15, flexShrink: 0 }}>{item.icon}</span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text)', fontFamily: 'var(--font-sans)' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--color-text-dim)', fontFamily: 'var(--font-sans)', marginTop: 1 }}>
                          {item.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--color-border)' }}>
        <div style={{ fontSize: 10, color: 'var(--color-text-dim)', textAlign: 'center', fontFamily: 'var(--font-sans)' }}>
          {GUARDRAILS.length} validators available
        </div>
      </div>
    </aside>
  )
}
