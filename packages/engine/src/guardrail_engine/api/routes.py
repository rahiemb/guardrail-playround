"""API routes — guardrail type metadata and validation endpoints."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from guardrail_engine.pipeline.executor import PipelineExecutor
from guardrail_engine.pipeline.models import (
    PipelineRunRequest,
    PipelineRunResult,
    ValidateRequest,
    ValidateResponse,
)

router = APIRouter()
_executor = PipelineExecutor()


# ─────────────────────────────────────────────────────────────
# Guardrail type metadata
# ─────────────────────────────────────────────────────────────


class GuardrailTypeMeta(BaseModel):
    id: str
    name: str
    description: str
    category: str
    config_schema: dict


GUARDRAIL_TYPES: list[GuardrailTypeMeta] = [
    GuardrailTypeMeta(
        id="regex",
        name="Regex Filter",
        description="Match and block/modify text using regular expressions",
        category="Content",
        config_schema={"pattern": "string", "flags": "string", "replacement": "string"},
    ),
    GuardrailTypeMeta(
        id="keyword",
        name="Keyword Filter",
        description="Block or allow text based on keyword deny/allow lists",
        category="Content",
        config_schema={
            "deny_list": "string[]",
            "allow_list": "string[]",
            "case_sensitive": "boolean",
        },
    ),
    GuardrailTypeMeta(
        id="length",
        name="Length Limiter",
        description="Enforce minimum and maximum character/token limits",
        category="Format",
        config_schema={
            "min_chars": "number",
            "max_chars": "number",
            "min_tokens": "number",
            "max_tokens": "number",
        },
    ),
    GuardrailTypeMeta(
        id="pii",
        name="PII Detector",
        description="Detect and redact personally identifiable information via Microsoft Presidio",
        category="Privacy",
        config_schema={"entities": "string[]", "language": "string", "action": "redact|block"},
    ),
    GuardrailTypeMeta(
        id="toxicity",
        name="Toxicity Filter",
        description="Detect toxic, obscene, threatening, or hateful content via detoxify",
        category="Safety",
        config_schema={"threshold": "number", "categories": "string[]"},
    ),
    GuardrailTypeMeta(
        id="prompt_injection",
        name="Prompt Injection Detector",
        description="Detect prompt injection and jailbreak attempts via heuristic patterns",
        category="Security",
        config_schema={"sensitivity": "number"},
    ),
    GuardrailTypeMeta(
        id="topic",
        name="Topic Validator",
        description="Block or allow specific topics via keyword expansion",
        category="Content",
        config_schema={
            "blocked_topics": "object",
            "allowed_topics": "object",
            "case_sensitive": "boolean",
        },
    ),
    GuardrailTypeMeta(
        id="format",
        name="Format Validator",
        description="Enforce structured output format (JSON, XML, Markdown)",
        category="Format",
        config_schema={
            "format": "json|xml|markdown",
            "required_keys": "string[]",
            "required_headings": "string[]",
        },
    ),
]


@router.get("/guardrails/types", response_model=list[GuardrailTypeMeta], tags=["guardrails"])
async def list_guardrail_types() -> list[GuardrailTypeMeta]:
    """Return metadata for all available guardrail validator types."""
    return GUARDRAIL_TYPES


# ─────────────────────────────────────────────────────────────
# Validation endpoints
# ─────────────────────────────────────────────────────────────


@router.post("/validate", response_model=ValidateResponse, tags=["validation"])
async def validate_single(request: ValidateRequest) -> ValidateResponse:
    """Validate text against a single guardrail configuration."""
    validator_map = {g.id: g for g in GUARDRAIL_TYPES}
    if request.guardrail.type.value not in validator_map:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown guardrail type: {request.guardrail.type}",
        )

    result_obj = _executor.run(request.text, [request.guardrail], mode="run_all")
    result = result_obj.results[0] if result_obj.results else None
    if result is None:
        raise HTTPException(status_code=500, detail="Validator returned no result")

    return ValidateResponse(result=result, output_text=result_obj.output_text)


@router.post("/pipeline/run", response_model=PipelineRunResult, tags=["pipeline"])
async def run_pipeline(request: PipelineRunRequest) -> PipelineRunResult:
    """Run text through an ordered list of guardrails."""
    if not request.guardrails:
        return PipelineRunResult(
            input_text=request.text,
            output_text=request.text,
            results=[],
            blocked=False,
            total_time_ms=0.0,
        )
    return _executor.run(request.text, request.guardrails, request.mode)
