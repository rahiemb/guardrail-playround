'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { motion, AnimatePresence } from 'framer-motion'
import type { LLMNodeData } from '@/lib/types'

const PROVIDER_LABELS: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  azure: 'Azure',
  ollama: 'Ollama',
}

function LLMNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as LLMNodeData
  const providerLabel = PROVIDER_LABELS[nodeData.provider] ?? nodeData.provider
  
  const isGenerating = nodeData.status === 'generating'
  const isFail = nodeData.status === 'fail'
  
  let borderColor = selected ? 'var(--color-node-llm)' : 'rgba(99,102,241,0.4)'
  let boxShadow = selected ? 'var(--glow-accent)' : '0 4px 20px rgba(0,0,0,0.4)'
  
  if (isGenerating) {
    borderColor = '#ffffff'
    boxShadow = '0 0 20px #ffffff'
  } else if (isFail) {
    borderColor = 'var(--color-fail)'
    boxShadow = 'var(--glow-fail)'
  }

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
        border: `2px solid ${borderColor}`,
        borderRadius: 'var(--radius-lg)',
        padding: '14px 18px',
        minWidth: 180,
        boxShadow,
        transition: 'all 0.3s ease',
      }}
      className={isGenerating ? 'animate-pulse' : ''}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: 'var(--color-node-llm)', borderColor: 'var(--color-bg)' }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: 'rgba(99,102,241,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
          }}
        >
          🧠
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: 600,
              fontSize: 13,
              color: '#a5b4fc',
              letterSpacing: '0.02em',
            }}
          >
            {nodeData.label || 'LLM'}
          </span>
          {isGenerating && (
            <span style={{ fontSize: 9, color: '#ffffff', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              generating...
            </span>
          )}
          {isFail && (
            <span style={{ fontSize: 9, color: 'var(--color-fail)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              failed
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span
          style={{
            fontSize: 10,
            color: 'rgba(165,180,252,0.5)',
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {providerLabel}
        </span>
        <span
          style={{
            fontSize: 11,
            color: 'rgba(165,180,252,0.8)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {nodeData.model}
        </span>
      </div>

      <AnimatePresence>
        {isFail && nodeData.error && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="nodrag nowheel"
            style={{
              position: 'absolute',
              top: 'calc(100% + 12px)',
              left: 0,
              width: 260,
              padding: '12px 14px',
              background: 'rgba(30, 27, 75, 0.7)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 8px 32px rgba(239, 68, 68, 0.25), inset 0 1px 0 rgba(255,255,255,0.05)',
              zIndex: 50,
              userSelect: 'text',
              cursor: 'text',
              pointerEvents: 'auto'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, borderBottom: '1px solid rgba(239,68,68,0.2)', paddingBottom: 6 }}>
               <span style={{ fontSize: 13 }}>⚠️</span>
               <span style={{ fontSize: 10, fontWeight: 700, color: '#fca5a5', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Generation Failure</span>
            </div>
            <div
              style={{
                fontSize: 10,
                color: '#fecaca',
                fontFamily: 'var(--font-mono)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                lineHeight: 1.5,
                maxHeight: 140,
                overflowY: 'auto',
                paddingRight: 4
              }}
            >
              {nodeData.error}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Handle
        type="source"
        position={Position.Right}
        style={{ background: 'var(--color-node-llm)', borderColor: 'var(--color-bg)' }}
      />
    </div>
  )
}

export default memo(LLMNode)
