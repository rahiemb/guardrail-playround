'use client'

import React, { useState } from 'react'
import { usePipelineStore } from '@/lib/store/pipelineStore'
import { GuardrailNodeData } from '@/lib/types'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
}

type ExportLanguage = 'python' | 'typescript' | 'curl'

export default function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const { nodes } = usePipelineStore()
  const [language, setLanguage] = useState<ExportLanguage>('typescript')
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const guardrails = nodes
    .filter((n) => n.type === 'guardrailNode')
    .map((n) => (n.data as unknown as GuardrailNodeData).guardrail)
    .filter((g) => g.enabled)

  const generateTypeScript = () => {
    let code = `import { z } from 'zod';\n\n`
    code += `// Guardrail Playground - Integration Export\n`
    code += `export const pipelineSchema = z.string()\n`
    
    for (const g of guardrails) {
      if (g.type === 'length') {
         code += `  .min(${g.config.min_chars || 0}, '${g.name} failed: too short')\n`
         if (g.config.max_chars) {
           code += `  .max(${g.config.max_chars}, '${g.name} failed: too long')\n`
         }
      } else if (g.type === 'regex') {
         code += `  .regex(new RegExp('${g.config.pattern}', '${g.config.flags || ''}'), '${g.name} failed')\n`
      } else {
         code += `  .refine(val => { \n    // TODO: implement custom validation for ${g.type}\n    return true \n  }, '${g.name} failed')\n`
      }
    }
    code += `;\n`
    return code
  }

  const generatePython = () => {
    let code = `from guardrails import Guard\n`
    code += `from guardrails.hub import RegexMatch\n\n`
    code += `# Guardrail Playground - Integration Export\n`
    code += `guard = Guard()\n`
    
    for (const g of guardrails) {
      if (g.type === 'regex') {
        code += `guard.use(RegexMatch(regex=r"${g.config.pattern}"))\n`
      } else if (g.type === 'length') {
        // Pseudo-guardrails AI integration for length
        code += `guard.use("length", min=${Math.floor(Number(g.config.min_chars) || 0)}, max=${Math.floor(Number(g.config.max_chars) || 9999)})\n`
      } else {
        code += `guard.use("${g.type}") # Configuration required\n`
      }
    }
    
    code += `\n# Run validation\n`
    code += `result = guard.validate("YOUR_INPUT_TEXT")\n`
    code += `print(result)\n`
    return code
  }

  const generateCurl = () => {
    const payload = JSON.stringify({
      text: "YOUR_INPUT_TEXT",
      guardrails: guardrails,
      mode: "run_all"
    }, null, 2)
    
    return `curl -X POST http://localhost:8000/api/pipeline/run \\
  -H "Content-Type: application/json" \\
  -d '${payload}'`
  }

  const getCode = () => {
    switch (language) {
      case 'typescript': return generateTypeScript()
      case 'python': return generatePython()
      case 'curl': return generateCurl()
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(getCode())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-xl w-full max-w-3xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
          <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Integration Export</h2>
          <button 
            onClick={onClose}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer p-1"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 min-h-[400px]">
          {/* Sidebar Tabs */}
          <div className="w-48 border-r border-[var(--color-border)] bg-[var(--color-bg)] flex flex-col p-2 gap-1">
            <button
              onClick={() => setLanguage('typescript')}
              className={`text-left px-3 py-2 rounded text-[13px] font-sans ${language === 'typescript' ? 'bg-[var(--color-surface-2)] text-[var(--color-text)] font-semibold' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]'}`}
            >
              TypeScript (Zod)
            </button>
            <button
              onClick={() => setLanguage('python')}
              className={`text-left px-3 py-2 rounded text-[13px] font-sans ${language === 'python' ? 'bg-[var(--color-surface-2)] text-[var(--color-text)] font-semibold' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]'}`}
            >
              Python (Guardrails AI)
            </button>
            <button
              onClick={() => setLanguage('curl')}
              className={`text-left px-3 py-2 rounded text-[13px] font-sans ${language === 'curl' ? 'bg-[var(--color-surface-2)] text-[var(--color-text)] font-semibold' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]'}`}
            >
              cURL (API Request)
            </button>
          </div>
          
          {/* Code Area */}
          <div className="flex-1 flex flex-col relative bg-[#1e1e1e]">
            <div className="absolute top-3 right-3">
              <button 
                onClick={handleCopy}
                className="bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] px-3 py-1.5 rounded text-[12px] hover:bg-[var(--color-surface-2)] cursor-pointer transition-colors shadow-sm"
              >
                {copied ? '✓ Copied!' : '📋 Copy to Clipboard'}
              </button>
            </div>
            <pre className="p-4 overflow-auto text-[13px] font-mono text-[#d4d4d4] flex-1">
              <code>{getCode()}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
