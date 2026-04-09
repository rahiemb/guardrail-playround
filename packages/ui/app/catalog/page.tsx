'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { CATALOG } from '@/lib/catalogData'
import { CatalogCard } from '@/components/catalog/CatalogCard'

const ALL_CATEGORIES = Array.from(new Set(CATALOG.map(g => g.category)))

export default function CatalogPage() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return CATALOG.filter(entry => {
      const matchesSearch = !q ||
        entry.name.toLowerCase().includes(q) ||
        entry.description.toLowerCase().includes(q) ||
        entry.category.toLowerCase().includes(q) ||
        entry.useCases.some(uc => uc.toLowerCase().includes(q))
      const matchesCategory = !activeCategory || entry.category === activeCategory
      return matchesSearch && matchesCategory
    })
  }, [search, activeCategory])

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
            📚 Guardrail Catalog
          </h1>
          <p className="font-sans text-[13px] text-[var(--color-text-dim)] mt-1 mb-0">
            Detailed documentation for all {CATALOG.length} available validator types.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="py-4 px-8 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-[1_1_240px] max-w-[340px]">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[14px] text-[var(--color-text-dim)] pointer-events-none">
            🔍
          </span>
          <input
            id="catalog-search"
            type="text"
            placeholder="Search validators…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full py-2 pr-3 pl-[34px] bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] font-sans text-[13px] outline-none box-border"
          />
        </div>

        {/* Category chips */}
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveCategory(null)}
            className="py-[5px] px-3 rounded-full font-sans text-[11px] font-semibold cursor-pointer"
            style={{
              border: `1px solid ${!activeCategory ? 'rgba(99,102,241,0.5)' : 'var(--color-border)'}`,
              background: !activeCategory ? 'rgba(99,102,241,0.12)' : 'transparent',
              color: !activeCategory ? '#a5b4fc' : 'var(--color-text-muted)',
            }}
          >
            All
          </button>
          {ALL_CATEGORIES.map(cat => {
            const active = activeCategory === cat
            const entry = CATALOG.find(e => e.category === cat)
            const color = entry?.categoryColor ?? '#6366f1'
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(active ? null : cat)}
                className="py-[5px] px-3 rounded-full font-sans text-[11px] font-semibold cursor-pointer transition-all duration-150"
                style={{
                  border: `1px solid ${active ? color + '80' : 'var(--color-border)'}`,
                  background: active ? color + '20' : 'transparent',
                  color: active ? color : 'var(--color-text-muted)',
                }}
              >
                {cat}
              </button>
            )
          })}
        </div>

        <div className="ml-auto text-xs text-[var(--color-text-dim)] font-sans">
          {filtered.length} of {CATALOG.length}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 p-8 grid grid-cols-[repeat(auto-fill,minmax(380px,1fr))] gap-6 content-start">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-20 text-[var(--color-text-dim)] font-sans text-sm">
            No validators match your search. <button onClick={() => { setSearch(''); setActiveCategory(null) }} className="bg-transparent border-none text-[var(--color-accent)] cursor-pointer font-sans text-sm p-0 ml-1">Clear filters</button>
          </div>
        ) : (
          filtered.map(entry => <CatalogCard key={entry.id} entry={entry} />)
        )}
      </div>
    </div>
  )
}
