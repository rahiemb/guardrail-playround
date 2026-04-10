'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { motion, AnimatePresence } from 'framer-motion'
import type { GuardrailNodeData, GuardrailType } from '@/lib/types'
import { usePipelineStore } from '@/lib/store/pipelineStore'

const TYPE_META: Record<GuardrailType, { icon: string; color: string; label: string }> = {
  regex:            { icon: '🔍', color: '#f59e0b', label: 'Regex' },
  keyword:          { icon: '🏷️', color: '#3b82f6', label: 'Keyword' },
  length:           { icon: '📏', color: '#10b981', label: 'Length' },
  pii:              { icon: '🔒', color: '#8b5cf6', label: 'PII' },
  toxicity:         { icon: '🛡️', color: '#ef4444', label: 'Toxicity' },
  prompt_injection: { icon: '⚠️', color: '#f97316', label: 'Prompt Inj.' },
  topic:            { icon: '🗂️', color: '#06b6d4', label: 'Topic' },
  format:           { icon: '📋', color: '#10b981', label: 'Format' },
}

const STATUS_STYLES: Record<
  string,
  { border: string; glow: string; badge: string; badgeColor: string; badgeBg: string }
> = {
  idle:    { border: 'rgba(245,158,11,0.35)', glow: 'none',                             badge: 'idle',    badgeColor: '#7a7f94', badgeBg: 'rgba(122,127,148,0.12)' },
  running: { border: '#f59e0b',               glow: '0 0 18px rgba(245,158,11,0.4)',    badge: 'running', badgeColor: '#f59e0b', badgeBg: 'rgba(245,158,11,0.12)' },
  pass:    { border: '#10b981',               glow: '0 0 18px rgba(16,185,129,0.35)',   badge: 'pass',    badgeColor: '#10b981', badgeBg: 'rgba(16,185,129,0.12)' },
  fail:    { border: '#ef4444',               glow: '0 0 18px rgba(239,68,68,0.35)',    badge: 'fail',    badgeColor: '#ef4444', badgeBg: 'rgba(239,68,68,0.12)' },
  warn:    { border: '#f59e0b',               glow: '0 0 18px rgba(245,158,11,0.35)',   badge: 'warn',    badgeColor: '#f59e0b', badgeBg: 'rgba(245,158,11,0.12)' },
  modify:  { border: '#3b82f6',               glow: '0 0 18px rgba(59,130,246,0.35)',   badge: 'modify',  badgeColor: '#3b82f6', badgeBg: 'rgba(59,130,246,0.12)' },
}

function configSummary(type: GuardrailType, config: Record<string, unknown>): string {
  switch (type) {
    case 'regex':   return config.pattern ? `pattern: ${String(config.pattern).slice(0, 24)}` : 'no pattern set'
    case 'keyword': {
      const deny = (config.deny_list as string[] | undefined) ?? []
      return deny.length > 0 ? `deny: ${deny.slice(0, 2).join(', ')}${deny.length > 2 ? '…' : ''}` : 'no keywords'
    }
    case 'length':  return `${config.min_chars ?? 0}–${config.max_chars ?? '∞'} chars`
    case 'pii':     {
      const ents = (config.entities as string[] | undefined) ?? []
      return ents.length > 0 ? ents.slice(0, 2).join(', ') : 'all entities'
    }
    case 'toxicity':         return `threshold: ${config.threshold ?? 0.5}`
    case 'prompt_injection': return `sensitivity: ${config.sensitivity ?? 0.75}`
    case 'topic':   {
      const blocked = (config.blocked_topics as Record<string, string[]> | undefined) ?? {}
      const keys = Object.keys(blocked)
      return keys.length > 0 ? `block: ${keys.slice(0, 2).join(', ')}` : 'no topics'
    }
    case 'format':  return `format: ${config.expected_format ?? 'any'}`
    default:        return 'configured'
  }
}

function GuardrailNode({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as GuardrailNodeData
  const { guardrail, status = 'idle' } = nodeData
  const meta = TYPE_META[guardrail.type]
  const styles = STATUS_STYLES[status] ?? STATUS_STYLES.idle
  const removeGuardrailNode = usePipelineStore((s) => s.removeGuardrailNode)

  const isRunning = status === 'running'

  return (
    <motion.div
      animate={status === 'fail' ? { x: [0, -4, 4, -4, 4, 0] } : {}}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      style={{ position: 'relative' }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: meta.color, borderColor: 'var(--color-bg)' }}
      />

      <motion.div
        animate={{ boxShadow: styles.glow, borderColor: styles.border }}
        transition={{ duration: 0.3 }}
        style={{
          background: 'linear-gradient(135deg, #1a1720 0%, #201d2a 100%)',
          border: `2px solid ${selected ? meta.color : styles.border}`,
          borderRadius: 'var(--radius-lg)',
          padding: '12px 16px',
          minWidth: 172,
          maxWidth: 220,
          boxShadow: selected ? `0 0 0 1px ${meta.color}40, ${styles.glow}` : styles.glow,
          transition: 'border-color 0.2s',
          cursor: 'grab',
        }}
      >
        <AnimatePresence>
          {isRunning && (
            <motion.div
              key="pulse"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: [0.6, 0], scale: [1, 1.2] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, repeat: Infinity }}
              style={{
                position: 'absolute',
                inset: -3,
                borderRadius: 'calc(var(--radius-lg) + 3px)',
                border: `2px solid ${meta.color}`,
                pointerEvents: 'none',
              }}
            />
          )}
        </AnimatePresence>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div
            style={{
              width: 26, height: 26, borderRadius: 7,
              background: `${meta.color}20`, border: `1px solid ${meta.color}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, flexShrink: 0,
            }}
          >
            {meta.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 12, color: 'var(--color-text)', letterSpacing: '0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {guardrail.name}
            </div>
            <div style={{ fontSize: 9, color: meta.color, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.8, marginTop: 1 }}>
              {meta.label}
            </div>
          </div>

          <motion.div
            key={status}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              fontSize: 8, fontFamily: 'var(--font-mono)', fontWeight: 700,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              color: styles.badgeColor, background: styles.badgeBg,
              border: `1px solid ${styles.badgeColor}40`, borderRadius: 4,
              padding: '2px 5px', flexShrink: 0,
            }}
          >
            {styles.badge}
          </motion.div>
        </div>

        <div style={{ fontSize: 10, color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingTop: 6, borderTop: '1px solid var(--color-border-subtle)' }}>
          {configSummary(guardrail.type, guardrail.config)}
        </div>

        <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
          {[guardrail.action, guardrail.position].map((tag) => (
            <span key={tag} style={{ fontSize: 8, fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 3, padding: '1px 5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {tag}
            </span>
          ))}
        </div>

        {selected && (
          <button
            title="Remove guardrail"
            onClick={(e) => { e.stopPropagation(); removeGuardrailNode(id) }}
            style={{
              position: 'absolute', top: -10, right: -10,
              width: 20, height: 20, borderRadius: '50%',
              background: '#ef4444', border: '2px solid var(--color-bg)',
              color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              lineHeight: 1, zIndex: 10,
            }}
          >
            ×
          </button>
        )}
      </motion.div>

      <Handle
        type="source"
        position={Position.Right}
        style={{ background: meta.color, borderColor: 'var(--color-bg)' }}
      />
    </motion.div>
  )
}

export default memo(GuardrailNode)
