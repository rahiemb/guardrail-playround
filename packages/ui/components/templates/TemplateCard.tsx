import { useRouter } from 'next/navigation'
import { usePipelineStore } from '@/lib/store/pipelineStore'
import type { PipelineTemplate } from '@/lib/templates'

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Enterprise:  { bg: 'rgba(99,102,241,0.15)',  text: '#a5b4fc', border: 'rgba(99,102,241,0.3)' },
  Support:     { bg: 'rgba(16,185,129,0.15)',  text: '#6ee7b7', border: 'rgba(16,185,129,0.3)' },
  Development: { bg: 'rgba(245,158,11,0.15)',  text: '#fcd34d', border: 'rgba(245,158,11,0.3)' },
  Healthcare:  { bg: 'rgba(239,68,68,0.15)',   text: '#fca5a5', border: 'rgba(239,68,68,0.3)'  },
  Creative:    { bg: 'rgba(236,72,153,0.15)',  text: '#f9a8d4', border: 'rgba(236,72,153,0.3)' },
}

const CATEGORY_ICONS: Record<string, string> = {
  Enterprise:  '🏢',
  Support:     '💬',
  Development: '💻',
  Healthcare:  '🏥',
  Creative:    '🎨',
}

function MiniPipelineViz({ template }: { template: PipelineTemplate }) {
  const guardrailCount = template.nodes.filter(n => n.type === 'guardrailNode').length
  const nodes = ['Input', ...template.tags, 'LLM', 'Output']
  return (
    <div className="flex items-center gap-1 flex-wrap mt-4 py-3">
      {nodes.map((n, i) => {
        const isAnchor = n === 'Input' || n === 'Output' || n === 'LLM'
        const isLLM = n === 'LLM'
        return (
          <div key={i} className="flex items-center gap-1">
            {i > 0 && (
              <div className="w-5 h-[1px] bg-[var(--color-border)] shrink-0" />
            )}
            <div 
              className={`rounded text-[10px] font-sans font-semibold whitespace-nowrap ${isAnchor ? 'py-[3px] px-2' : 'py-[3px] px-[7px]'}`}
              style={{
                background: isLLM
                  ? 'rgba(99,102,241,0.2)'
                  : isAnchor
                    ? 'rgba(16,185,129,0.2)'
                    : 'var(--color-surface-2)',
                border: `1px solid ${isLLM ? 'rgba(99,102,241,0.4)' : isAnchor ? 'rgba(16,185,129,0.4)' : 'var(--color-border)'}`,
                color: isLLM ? '#a5b4fc' : isAnchor ? '#6ee7b7' : 'var(--color-text-muted)',
              }}
            >
              {n}
            </div>
          </div>
        )
      })}
      {guardrailCount > 0 && (
        <span className="text-[10px] text-[var(--color-text-dim)] ml-1 font-sans">
          {guardrailCount} guardrail{guardrailCount > 1 ? 's' : ''}
        </span>
      )}
    </div>
  )
}

export function TemplateCard({ template }: { template: PipelineTemplate }) {
  const { deserializePipeline } = usePipelineStore()
  const router = useRouter()
  const colors = CATEGORY_COLORS[template.category] ?? CATEGORY_COLORS['Enterprise']
  const icon = CATEGORY_ICONS[template.category] ?? '📋'

  function handleUseTemplate() {
    const json = JSON.stringify({ nodes: template.nodes, edges: template.edges })
    deserializePipeline(json)
    router.push('/')
  }

  return (
    <div 
      className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 flex flex-col gap-3 transition-all duration-200"
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'
        e.currentTarget.style.boxShadow = '0 4px 24px rgba(99,102,241,0.1)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--color-border)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div 
            className="w-10 h-10 rounded-[10px] flex items-center justify-center text-xl shrink-0"
            style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
          >
            {icon}
          </div>
          <div>
            <h3 className="font-sans text-[15px] font-bold text-[var(--color-text)] m-0">
              {template.name}
            </h3>
            <span 
              className="text-[10px] font-semibold font-sans tracking-[0.06em] py-[2px] px-2 rounded-full"
              style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
            >
              {template.category.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="font-sans text-[13px] text-[var(--color-text-muted)] leading-relaxed m-0">
        {template.description}
      </p>

      {/* Mini pipeline viz */}
      <MiniPipelineViz template={template} />

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {template.tags.map(tag => (
          <span key={tag} className="text-[10px] py-[3px] px-2 rounded bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-dim)] font-sans font-medium">
            {tag}
          </span>
        ))}
      </div>

      {/* Use cases */}
      <div>
        <div className="text-[10px] font-semibold text-[var(--color-text-dim)] uppercase tracking-[0.08em] font-sans mb-1.5">
          Use cases
        </div>
        <ul className="m-0 p-0 list-none flex flex-col gap-1">
          {template.useCases.map(uc => (
            <li key={uc} className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] font-sans">
              <span className="text-[var(--color-accent)] text-[10px]">›</span>
              {uc}
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <button
        id={`use-template-${template.id}`}
        onClick={handleUseTemplate}
        className="mt-auto py-[9px] px-4 border-none rounded-lg text-white font-sans text-[13px] font-semibold cursor-pointer transition-opacity duration-150 shadow-[0_2px_8px_rgba(99,102,241,0.35)]"
        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >
        Use Template →
      </button>
    </div>
  )
}
