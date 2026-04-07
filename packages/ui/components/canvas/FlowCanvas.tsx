'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  type Node,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { usePipelineStore } from '@/lib/store/pipelineStore'
import type { GuardrailType } from '@/lib/types'
import InputNode    from './nodes/InputNode'
import LLMNode      from './nodes/LLMNode'
import OutputNode   from './nodes/OutputNode'
import GuardrailNode from './nodes/GuardrailNode'
import AnimatedEdge from './AnimatedEdge'

const nodeTypes = {
  inputNode:     InputNode,
  llmNode:       LLMNode,
  outputNode:    OutputNode,
  guardrailNode: GuardrailNode,
}

const edgeTypes = {
  animatedEdge: AnimatedEdge,
}

interface DragPayload {
  type: GuardrailType
  name: string
}

interface ContextMenu {
  nodeId: string
  x:      number
  y:      number
}

function getMinimapNodeColor(node: Node): string {
  switch (node.type) {
    case 'inputNode':
    case 'outputNode':    return '#10b981'
    case 'llmNode':       return '#6366f1'
    case 'guardrailNode': return '#f59e0b'
    default:              return '#f59e0b'
  }
}

function FlowCanvasInner() {
  const {
    nodes, edges,
    onNodesChange, onEdgesChange, onConnect,
    setSelectedNodeId, addGuardrailNode, removeGuardrailNode,
  } = usePipelineStore()

  const { screenToFlowPosition } = useReactFlow()
  const dragOver = useRef(false)
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null)

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNodeId(node.id)
      setContextMenu(null)
    },
    [setSelectedNodeId]
  )

  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null)
    setContextMenu(null)
  }, [setSelectedNodeId])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('application/guardrail')) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
      dragOver.current = true
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      dragOver.current = false

      const raw = e.dataTransfer.getData('application/guardrail')
      if (!raw) return

      let payload: DragPayload
      try {
        payload = JSON.parse(raw) as DragPayload
      } catch {
        return
      }

      const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      addGuardrailNode(payload.type, flowPos)
    },
    [screenToFlowPosition, addGuardrailNode]
  )

  const handleNodeContextMenu = useCallback((e: React.MouseEvent, node: Node) => {
    if (node.type !== 'guardrailNode') return
    e.preventDefault()
    setSelectedNodeId(node.id)
    setContextMenu({ nodeId: node.id, x: e.clientX, y: e.clientY })
  }, [setSelectedNodeId])

  const memoNodeTypes = useMemo(() => nodeTypes, [])
  const memoEdgeTypes = useMemo(() => edgeTypes, [])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onNodeContextMenu={handleNodeContextMenu}
        nodeTypes={memoNodeTypes}
        edgeTypes={memoEdgeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.3}
        maxZoom={2}
        deleteKeyCode="Delete"
        style={{ background: 'var(--color-bg)' }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="rgba(255,255,255,0.06)"
        />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={getMinimapNodeColor}
          maskColor="rgba(10,11,15,0.7)"
          style={{ bottom: 16, right: 16 }}
        />
      </ReactFlow>

      {contextMenu && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 999 }}
            onClick={() => setContextMenu(null)}
          />
          <div
            style={{
              position:     'fixed',
              left:         contextMenu.x,
              top:          contextMenu.y,
              zIndex:       1000,
              background:   'var(--color-surface)',
              border:       '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              boxShadow:    '0 8px 32px rgba(0,0,0,0.5)',
              padding:      4,
              minWidth:     140,
              animation:    'fade-in-up 0.15s ease',
            }}
          >
            <button
              onClick={() => {
                removeGuardrailNode(contextMenu.nodeId)
                setContextMenu(null)
              }}
              style={{
                width:        '100%',
                display:      'flex',
                alignItems:   'center',
                gap:          8,
                padding:      '8px 12px',
                background:   'transparent',
                border:       'none',
                borderRadius: 'var(--radius-sm)',
                color:        '#ef4444',
                fontSize:     12,
                fontFamily:   'var(--font-sans)',
                cursor:       'pointer',
                transition:   'background 0.1s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{ fontSize: 14 }}>🗑️</span>
              Remove guardrail
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default function FlowCanvas() {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner />
    </ReactFlowProvider>
  )
}
