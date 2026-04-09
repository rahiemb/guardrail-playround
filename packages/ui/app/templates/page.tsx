'use client'

import { ALL_TEMPLATES } from '@/lib/templates'
import Link from 'next/link'
import { TemplateCard } from '@/components/templates/TemplateCard'

export default function TemplatesPage() {
  return (
    <div className="min-h-[100dvh] bg-[var(--color-bg)] flex flex-col">
      {/* Page header */}
      <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)] py-5 px-8 flex items-center gap-4">
        <Link 
          href="/" 
          className="flex items-center gap-2 no-underline py-1.5 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-muted)] font-sans text-xs transition-all duration-150"
        >
          ← Back to Canvas
        </Link>

        <div>
          <h1 className="font-sans text-[22px] font-extrabold text-[var(--color-text)] m-0 tracking-[-0.02em]">
            🧩 Pipeline Templates
          </h1>
          <p className="font-sans text-[13px] text-[var(--color-text-dim)] mt-1 mb-0">
            Pre-built guardrail pipelines for common use cases. Click &quot;Use Template&quot; to load onto the canvas.
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="py-1 px-3 bg-[#6366f11f] border border-[#6366f140] rounded-full text-[11px] text-[#a5b4fc] font-sans font-semibold">
            {ALL_TEMPLATES.length} templates
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 p-8 grid grid-cols-[repeat(auto-fill,minmax(360px,1fr))] gap-6 content-start">
        {ALL_TEMPLATES.map(template => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>
    </div>
  )
}
