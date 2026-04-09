import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Home from '@/app/page'

vi.mock('next/dynamic', () => ({
  default: () => () => <div data-testid="flow-canvas-mock">FlowCanvas</div>
}))
vi.mock('@/components/common/Header', () => ({ default: () => <div data-testid="header-mock">Header</div> }))
vi.mock('@/components/sidebar/GuardrailPalette', () => ({ default: () => <div data-testid="palette-mock">Palette</div> }))
vi.mock('@/components/inspector/InspectorPanel', () => ({ default: () => <div data-testid="inspector-mock">InspectorPanel</div> }))
vi.mock('@/components/testing/TestPanel', () => ({ default: () => <div>TestPanel</div> }))
vi.mock('@/components/testing/TestSuitePanel', () => ({ default: () => <div>TestSuitePanel</div> }))
vi.mock('@/components/inspector/VersionPanel', () => ({ default: () => <div>VersionPanel</div> }))

const mockDeserializePipeline = vi.fn()
vi.mock('@/lib/store/pipelineStore', () => ({
  usePipelineStore: () => ({
    deserializePipeline: mockDeserializePipeline
  })
}))

describe('Home Page URL Hash Parsing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.location.hash = ''
    window.alert = vi.fn()
  })

  it('renders correctly without crash', () => {
    render(<Home />)
    expect(screen.getByTestId('header-mock')).toBeInTheDocument()
    expect(screen.getByTestId('flow-canvas-mock')).toBeInTheDocument()
  })

  it('safely catches completely invalid payload strings without crashing', () => {
    const errorSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    window.location.hash = '#pipeline=not_base64_+++___'
    
    expect(() => render(<Home />)).not.toThrow()
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to safely parse pipeline from URL hash:'),
      expect.anything()
    )
    expect(mockDeserializePipeline).not.toHaveBeenCalled()
    
    errorSpy.mockRestore()
  })

  it('parses valid hashed pipelines and calls deserialize', () => {
    const validPipeline = { nodes: [], edges: [] }
    const jsonStr = JSON.stringify(validPipeline)
    const bytes = new TextEncoder().encode(jsonStr)
    const encoded = btoa(String.fromCharCode(...bytes))
    
    window.location.hash = `#pipeline=${encoded}`
    render(<Home />)
    
    expect(mockDeserializePipeline).toHaveBeenCalledWith(jsonStr)
  })
})
