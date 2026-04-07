'use client'

import { useCallback } from 'react'
import type { Guardrail, GuardrailAction, GuardrailPosition, GuardrailSeverity, GuardrailType } from '@/lib/types'
import { usePipelineStore } from '@/lib/store/pipelineStore'
import RegexForm           from './type-forms/RegexForm'
import KeywordForm         from './type-forms/KeywordForm'
import LengthForm          from './type-forms/LengthForm'
import PIIForm             from './type-forms/PIIForm'
import ToxicityForm        from './type-forms/ToxicityForm'
import PromptInjectionForm from './type-forms/PromptInjectionForm'
import TopicForm           from './type-forms/TopicForm'
import FormatForm          from './type-forms/FormatForm'

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-sans)', marginBottom: 4 }}>
      {children}
    </div>
  )
}

function FieldBox({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{children}</div>
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)', color: 'var(--color-text)', fontFamily: 'var(--font-mono)',
  fontSize: 12, padding: '6px 10px', outline: 'none', boxSizing: 'border-box',
}

const selectStyle: React.CSSProperties = { ...inputStyle, fontFamily: 'var(--font-sans)', cursor: 'pointer' }

const TYPE_ICONS: Record<GuardrailType, string> = {
  regex: '🔍', keyword: '🏷️', length: '📏', pii: '🔒',
  toxicity: '🛡️', prompt_injection: '⚠️', topic: '🗂️', format: '📋',
}

interface Props {
  nodeId:    string
  guardrail: Guardrail
}

export default function GuardrailConfigForm({ nodeId, guardrail }: Props) {
  const updateGuardrailConfig = usePipelineStore((s) => s.updateGuardrailConfig)

  const update = useCallback(
    (patch: Partial<Guardrail>) => updateGuardrailConfig(nodeId, patch),
    [nodeId, updateGuardrailConfig]
  )

  const updateConfig = useCallback(
    (configPatch: Record<string, unknown>) =>
      update({ config: { ...guardrail.config, ...configPatch } }),
    [update, guardrail.config]
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 20 }}>{TYPE_ICONS[guardrail.type]}</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', fontFamily: 'var(--font-sans)' }}>
            {guardrail.name}
          </div>
          <div style={{ fontSize: 10, color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {guardrail.type}
          </div>
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)' }} />

      <FieldBox>
        <Label>Name</Label>
        <input style={inputStyle} value={guardrail.name} onChange={(e) => update({ name: e.target.value })} />
      </FieldBox>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <FieldBox>
          <Label>Action</Label>
          <select style={selectStyle} value={guardrail.action} onChange={(e) => update({ action: e.target.value as GuardrailAction })}>
            <option value="block">block</option>
            <option value="warn">warn</option>
            <option value="modify">modify</option>
            <option value="log">log</option>
          </select>
        </FieldBox>

        <FieldBox>
          <Label>Position</Label>
          <select style={selectStyle} value={guardrail.position} onChange={(e) => update({ position: e.target.value as GuardrailPosition })}>
            <option value="input">input</option>
            <option value="output">output</option>
            <option value="both">both</option>
          </select>
        </FieldBox>

        <FieldBox>
          <Label>Severity</Label>
          <select style={selectStyle} value={guardrail.severity} onChange={(e) => update({ severity: e.target.value as GuardrailSeverity })}>
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
            <option value="critical">critical</option>
          </select>
        </FieldBox>

        <FieldBox>
          <Label>Enabled</Label>
          <div style={{ display: 'flex', alignItems: 'center', height: 34 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={guardrail.enabled}
                onChange={(e) => update({ enabled: e.target.checked })}
                style={{ width: 14, height: 14, accentColor: 'var(--color-accent)', cursor: 'pointer' }}
              />
              <span style={{ fontSize: 11, color: guardrail.enabled ? 'var(--color-success)' : 'var(--color-text-dim)', fontFamily: 'var(--font-sans)' }}>
                {guardrail.enabled ? 'on' : 'off'}
              </span>
            </label>
          </div>
        </FieldBox>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)' }} />

      <div>
        <Label>Configuration</Label>
        <div style={{ marginTop: 8 }}>
          {guardrail.type === 'regex'            && <RegexForm           config={guardrail.config} onChange={updateConfig} />}
          {guardrail.type === 'keyword'          && <KeywordForm         config={guardrail.config} onChange={updateConfig} />}
          {guardrail.type === 'length'           && <LengthForm          config={guardrail.config} onChange={updateConfig} />}
          {guardrail.type === 'pii'              && <PIIForm             config={guardrail.config} onChange={updateConfig} />}
          {guardrail.type === 'toxicity'         && <ToxicityForm        config={guardrail.config} onChange={updateConfig} />}
          {guardrail.type === 'prompt_injection' && <PromptInjectionForm config={guardrail.config} onChange={updateConfig} />}
          {guardrail.type === 'topic'            && <TopicForm           config={guardrail.config} onChange={updateConfig} />}
          {guardrail.type === 'format'           && <FormatForm          config={guardrail.config} onChange={updateConfig} />}
        </div>
      </div>
    </div>
  )
}
