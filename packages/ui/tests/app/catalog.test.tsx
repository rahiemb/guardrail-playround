import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import CatalogPage from '@/app/catalog/page'

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>
}))

describe('Catalog Page Filtering', () => {
  it('renders all items by default', () => {
    render(<CatalogPage />)
    expect(screen.getByText('8 of 8')).toBeInTheDocument()
    expect(screen.getByText('PII Detector')).toBeInTheDocument()
  })

  it('filters by search input', () => {
    render(<CatalogPage />)
    const input = screen.getByPlaceholderText('Search validators…')
    fireEvent.change(input, { target: { value: 'prompt' } })
    
    expect(screen.getByText('Prompt Injection Detector')).toBeInTheDocument()
    expect(screen.getByText('Length Limiter')).toBeInTheDocument()
    expect(screen.queryByText('Toxicity Filter')).not.toBeInTheDocument()
    expect(screen.getByText(/2 of 8/)).toBeInTheDocument() 
  })

  it('filters by category chip', () => {
    render(<CatalogPage />)
    const chip = screen.getByText('Privacy')
    fireEvent.click(chip)
    
    expect(screen.getByText('PII Detector')).toBeInTheDocument()
    expect(screen.queryByText('Toxicity Filter')).not.toBeInTheDocument()
    
    // clicking again removes filter
    fireEvent.click(chip)
    expect(screen.getByText('Toxicity Filter')).toBeInTheDocument()
  })
})
