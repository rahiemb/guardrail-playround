'use client'

interface Props {
  config:   Record<string, unknown>
  onChange: (patch: Record<string, unknown>) => void
}

const PII_ENTITIES = ['PERSON','EMAIL_ADDRESS','PHONE_NUMBER','US_SSN','CREDIT_CARD','LOCATION','URL','IP_ADDRESS','IBAN_CODE','DATE_TIME']

export default function PIIForm({ config, onChange }: Props) {
  const entities = (config.entities as string[]) ?? []

  function toggle(entity: string) {
    if (entities.includes(entity)) {
      onChange({ entities: entities.filter((e) => e !== entity) })
    } else {
      onChange({ entities: [...entities, entity] })
    }
  }

  const allSelected = PII_ENTITIES.every((e) => entities.includes(e))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 0 8px', borderBottom: '1px solid var(--color-border)' }}>
        <input type="checkbox" checked={allSelected} onChange={() => onChange({ entities: allSelected ? [] : [...PII_ENTITIES] })} style={{ accentColor: 'var(--color-accent)', cursor: 'pointer' }} />
        <span style={{ fontSize: 11, fontFamily: 'var(--font-sans)', fontWeight: 600, color: 'var(--color-text-muted)' }}>All entities</span>
      </label>
      {PII_ENTITIES.map((entity) => {
        const checked = entities.includes(entity)
        return (
          <label key={entity} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={checked} onChange={() => toggle(entity)} style={{ accentColor: '#8b5cf6', cursor: 'pointer' }} />
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: checked ? '#c4b5fd' : 'var(--color-text-dim)', transition: 'color 0.15s' }}>
              {entity}
            </span>
          </label>
        )
      })}
      <div style={{ fontSize: 10, color: 'var(--color-text-dim)', fontFamily: 'var(--font-sans)', marginTop: 4 }}>
        {entities.length} / {PII_ENTITIES.length} selected
      </div>
    </div>
  )
}
