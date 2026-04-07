'use client'

import { memo } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react'

interface AnimatedEdgeData {
  active?: boolean
  label?:  string
  [key: string]: unknown
}

function AnimatedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps) {
  const edgeData = (data ?? {}) as AnimatedEdgeData
  const active   = edgeData.active ?? false
  const label    = edgeData.label

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  })

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke:          selected ? 'var(--color-accent)' : active ? '#10b981' : 'var(--color-border)',
          strokeWidth:     2,
          strokeDasharray: active ? '8 4' : undefined,
          animation:       active ? 'flow-dash 0.6s linear infinite' : undefined,
          transition:      'stroke 0.3s',
        }}
      />

      {active && (
        <circle r={5} fill="#10b981" opacity={0.9}>
          <animateMotion dur="1.2s" repeatCount="indefinite">
            <mpath href={`#${id}`} />
          </animateMotion>
        </circle>
      )}

      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position:      'absolute',
              transform:     `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
              fontSize:      9,
              fontFamily:    'var(--font-mono)',
              color:         '#3b82f6',
              background:    'rgba(59,130,246,0.1)',
              border:        '1px solid rgba(59,130,246,0.25)',
              borderRadius:  4,
              padding:       '2px 6px',
              whiteSpace:    'nowrap',
              zIndex:        1000,
            }}
            className="nodrag nopan"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

export default memo(AnimatedEdge)
