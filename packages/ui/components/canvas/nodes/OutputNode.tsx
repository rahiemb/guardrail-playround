'use client'

import { memo, useState } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { motion, AnimatePresence } from 'framer-motion'
import type { OutputNodeData } from '@/lib/types'

function OutputNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as OutputNodeData
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
        border: `2px solid ${selected ? 'var(--color-success)' : 'rgba(16,185,129,0.4)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: '14px 18px',
        minWidth: 160,
        maxWidth: 280,
        boxShadow: selected ? 'var(--glow-success)' : '0 4px 20px rgba(0,0,0,0.4)',
        transition: 'box-shadow 0.2s, border-color 0.2s',
        position: 'relative',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: 'var(--color-success)', borderColor: 'var(--color-bg)' }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: 'rgba(16,185,129,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
          }}
        >
          📤
        </div>
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontWeight: 600,
            fontSize: 13,
            color: '#6ee7b7',
            letterSpacing: '0.02em',
          }}
        >
          {nodeData.label || 'Output'}
        </span>
      </div>

      <div
        style={{
          fontSize: 10,
          color: 'rgba(110,231,183,0.6)',
          fontFamily: 'var(--font-mono)',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Final response</span>
          {nodeData.content && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#a7f3d0',
                borderRadius: 'var(--radius-sm)',
                padding: '2px 6px',
                fontSize: 9,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(16, 185, 129, 0.3)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)')}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </button>
          )}
        </div>
        
        {nodeData.content && !isExpanded && (
          <div
            className="nodrag nowheel"
            style={{
              padding: '8px 10px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: 'var(--radius-sm)',
              color: '#a7f3d0',
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
              maxHeight: 120,
              overflowY: 'hidden',
              WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
              maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
              fontSize: 11,
              lineHeight: 1.5,
              fontFamily: 'var(--font-sans)',
              cursor: 'text',
              userSelect: 'text',
            }}
          >
            {nodeData.content}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isExpanded && nodeData.content && (
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
              width: 380,
              padding: '16px 18px',
              background: 'rgba(6, 78, 59, 0.85)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
              zIndex: 50,
              userSelect: 'text',
              cursor: 'text',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, borderBottom: '1px solid rgba(16,185,129,0.2)', paddingBottom: 8 }}>
               <span style={{ fontSize: 11, fontWeight: 700, color: '#6ee7b7', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                 Full Output
               </span>
               <button
                 onClick={() => setIsExpanded(false)}
                 style={{ background: 'transparent', border: 'none', color: '#a7f3d0', cursor: 'pointer', fontSize: 14 }}
               >
                 ✕
               </button>
            </div>
            <div
              style={{
                fontSize: 12,
                color: '#d1fae5',
                fontFamily: 'var(--font-sans)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                lineHeight: 1.6,
                maxHeight: 350,
                overflowY: 'auto',
                paddingRight: 6,
              }}
            >
              {nodeData.content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default memo(OutputNode)
