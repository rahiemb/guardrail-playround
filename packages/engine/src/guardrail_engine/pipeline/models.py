"""Pydantic models for guardrail configuration and pipeline results."""

from __future__ import annotations

from enum import StrEnum
from typing import Any

from pydantic import BaseModel, Field

# ─────────────────────────────────────────────────────────────
# Enums
# ─────────────────────────────────────────────────────────────


class GuardrailType(StrEnum):
    regex = "regex"
    keyword = "keyword"
    length = "length"
    pii = "pii"
    toxicity = "toxicity"
    prompt_injection = "prompt_injection"
    topic = "topic"
    format = "format"


class GuardrailPosition(StrEnum):
    input = "input"
    output = "output"
    both = "both"


class GuardrailAction(StrEnum):
    block = "block"
    warn = "warn"
    modify = "modify"
    log = "log"


class GuardrailSeverity(StrEnum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class ValidationStatus(StrEnum):
    pass_ = "pass"
    fail = "fail"
    warn = "warn"
    modify = "modify"

    # JSON serialises as the value, not the attribute name
    def __str__(self) -> str:  # noqa: D105
        return self.value


# ─────────────────────────────────────────────────────────────
# Core domain models
# ─────────────────────────────────────────────────────────────


class Guardrail(BaseModel):
    """A single guardrail configuration node."""

    id: str
    name: str
    type: GuardrailType
    position: GuardrailPosition = GuardrailPosition.input
    config: dict[str, Any] = Field(default_factory=dict)
    action: GuardrailAction = GuardrailAction.block
    severity: GuardrailSeverity = GuardrailSeverity.medium
    enabled: bool = True


# ─────────────────────────────────────────────────────────────
# Validation result
# ─────────────────────────────────────────────────────────────


class ValidationResult(BaseModel):
    """Result of a single validator execution."""

    guardrail_id: str
    guardrail_name: str
    status: str  # "pass" | "fail" | "warn" | "modify"
    message: str | None = None
    modified_text: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    execution_time_ms: float = 0.0


# ─────────────────────────────────────────────────────────────
# Pipeline I/O
# ─────────────────────────────────────────────────────────────


class ValidateRequest(BaseModel):
    """Single-guardrail validation request."""

    text: str
    guardrail: Guardrail


class ValidateResponse(BaseModel):
    """Single-guardrail validation response."""

    result: ValidationResult
    output_text: str  # text after applying action (may equal input)


class PipelineRunRequest(BaseModel):
    """Run text through an ordered list of guardrails."""

    text: str
    guardrails: list[Guardrail]
    mode: str = Field(default="run_all", pattern="^(run_all|short_circuit)$")


class PipelineRunResult(BaseModel):
    """Full pipeline execution result."""

    input_text: str
    output_text: str
    results: list[ValidationResult]
    blocked: bool
    total_time_ms: float


# ─────────────────────────────────────────────────────────────
# End-to-End I/O (Phase 4)
# ─────────────────────────────────────────────────────────────


class LLMConfig(BaseModel):
    """Configuration for LiteLLM generation."""

    provider: str
    model: str
    api_key: str | None = None
    max_tokens: int = 1024
    temperature: float = 0.5


class EndToEndRunRequest(BaseModel):
    """Run text through input guardrails -> LLM -> output guardrails."""

    text: str
    input_guardrails: list[Guardrail]
    output_guardrails: list[Guardrail]
    llm_config: LLMConfig
    mode: str = Field(default="run_all", pattern="^(run_all|short_circuit)$")


class EndToEndRunResult(BaseModel):
    """Full end-to-end execution result."""

    input_text: str
    llm_request_text: str | None = None
    llm_response_text: str | None = None
    output_text: str
    input_results: list[ValidationResult]
    output_results: list[ValidationResult]
    blocked: bool
    total_time_ms: float


# ─────────────────────────────────────────────────────────────
# WebSocket streaming event
# ─────────────────────────────────────────────────────────────


class PipelineStageEvent(BaseModel):
    """Emitted over WebSocket for each stage as it completes."""

    stage: int
    guardrail_id: str
    result: ValidationResult | None = None
    current_text: str
    blocked: bool

class LLMGenerationEvent(BaseModel):
    """Emitted over WebSocket while LLM is generating or starts generating."""

    stage: str = "llm"
    status: str = "generating"
    content: str | None = None
    error: str | None = None
