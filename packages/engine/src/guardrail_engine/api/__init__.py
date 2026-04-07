"""API routes — guardrail type metadata and validation endpoints."""

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


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
        config_schema={"pattern": "string", "flags": "string"},
    ),
    GuardrailTypeMeta(
        id="keyword",
        name="Keyword Filter",
        description="Block or allow text based on keyword deny/allow lists",
        category="Content",
        config_schema={"deny_list": "string[]", "allow_list": "string[]"},
    ),
    GuardrailTypeMeta(
        id="length",
        name="Length Limiter",
        description="Enforce minimum and maximum character/token limits",
        category="Format",
        config_schema={"min_chars": "number", "max_chars": "number"},
    ),
    GuardrailTypeMeta(
        id="pii",
        name="PII Detector",
        description="Detect and redact personally identifiable information via Microsoft Presidio",
        category="Privacy",
        config_schema={"entities": "string[]", "action": "redact|block"},
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
        description="Detect prompt injection and jailbreak attempts",
        category="Security",
        config_schema={"sensitivity": "number"},
    ),
    GuardrailTypeMeta(
        id="topic",
        name="Topic Validator",
        description="Block or allow specific topics via keyword expansion",
        category="Content",
        config_schema={"blocked_topics": "string[]", "allowed_topics": "string[]"},
    ),
    GuardrailTypeMeta(
        id="format",
        name="Format Validator",
        description="Enforce structured output format (JSON, XML, Markdown)",
        category="Format",
        config_schema={"format": "json|xml|markdown", "schema": "object"},
    ),
]


@router.get("/guardrails/types", response_model=list[GuardrailTypeMeta], tags=["guardrails"])
async def list_guardrail_types() -> list[GuardrailTypeMeta]:
    """Return metadata for all available guardrail validator types."""
    return GUARDRAIL_TYPES
