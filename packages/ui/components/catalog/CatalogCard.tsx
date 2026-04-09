import type { GuardrailCatalogEntry } from '@/lib/catalogData'

export function CatalogCard({ entry }: { entry: GuardrailCatalogEntry }) {
  return (
    <div
      className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden flex flex-col transition-all duration-200"
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = `${entry.categoryColor}55`
        e.currentTarget.style.boxShadow = `0 4px 20px ${entry.categoryColor}18`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--color-border)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Color accent bar */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${entry.categoryColor}, ${entry.categoryColor}88)` }} />

      <div className="p-6 flex flex-col gap-4 flex-1">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-[10px] shrink-0 flex items-center justify-center text-[22px]"
            style={{
              background: `${entry.categoryColor}20`,
              border: `1px solid ${entry.categoryColor}40`,
            }}
          >
            {entry.icon}
          </div>
          <div>
            <h3 className="font-sans text-[15px] font-bold text-[var(--color-text)] m-0">
              {entry.name}
            </h3>
            <span
              className="text-[10px] font-semibold tracking-[0.06em] font-sans opacity-[0.85]"
              style={{ color: entry.categoryColor }}
            >
              {entry.category.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="font-sans text-[13px] text-[var(--color-text-muted)] leading-relaxed m-0">
          {entry.description}
        </p>

        {/* Use cases */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-dim)] font-sans mb-1.5">
            Use cases
          </div>
          <ul className="m-0 p-0 list-none flex flex-col gap-1">
            {entry.useCases.map(uc => (
              <li key={uc} className="flex gap-1.5 text-xs text-[var(--color-text-muted)] font-sans">
                <span className="text-[10px] mt-px shrink-0" style={{ color: entry.categoryColor }}>›</span>
                {uc}
              </li>
            ))}
          </ul>
        </div>

        {/* Config params */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-dim)] font-sans mb-2">
            Configuration
          </div>
          <div className="flex flex-col gap-1.5">
            {entry.configParams.map(p => (
              <div key={p.name} className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-md py-2 px-2.5">
                <div className="flex items-center gap-2 mb-[3px]">
                  <code className="text-[11px] font-semibold font-mono" style={{ color: entry.categoryColor }}>
                    {p.name}
                  </code>
                  <span className="text-[10px] py-[1px] px-1.5 rounded-[3px] bg-[var(--color-border)] text-[var(--color-text-dim)] font-mono">
                    {p.type}
                  </span>
                </div>
                <div className="text-[11px] text-[var(--color-text-dim)] font-sans leading-relaxed">
                  {p.description}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance note */}
        <div className="py-2 px-3 bg-[#6366f10f] border border-[#6366f126] rounded-md mt-auto">
          <span className="text-[10px] font-bold text-[#a5b4fc] font-sans uppercase tracking-[0.06em]">
            ⚡ Performance:{' '}
          </span>
          <span className="text-[11px] text-[var(--color-text-dim)] font-sans">
            {entry.performanceNote}
          </span>
        </div>
      </div>
    </div>
  )
}
