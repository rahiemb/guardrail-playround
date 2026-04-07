"""PromptInjectionDetector — heuristic pattern-based prompt injection detection."""

from __future__ import annotations

import re

from guardrail_engine.pipeline.models import ValidationResult
from guardrail_engine.validators.base import BaseValidator

# ─────────────────────────────────────────────────────────────
# Heuristic pattern library
# ─────────────────────────────────────────────────────────────
#
# Covers: DAN, system prompt extraction, role-play jailbreaks,
# instruction override, token smuggling, and base64/encoding tricks.

_PATTERNS: list[tuple[str, str]] = [
    # DAN / jailbreak personas
    (r"\bDAN\b", "DAN jailbreak attempt"),
    (r"do\s+anything\s+now", "DAN variant"),
    (r"jailbreak", "Jailbreak keyword"),
    (r"ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|directives?)", "Instruction override"),
    (r"disregard\s+(all\s+)?(your\s+)?(previous\s+)?(instructions?|rules?|guidelines?)", "Instruction override"),
    (r"forget\s+(everything|all)\s+(you\s+)?(were\s+)?(told|instructed|trained)", "Training override"),
    # System prompt extraction
    (r"(print|repeat|reveal|show|output|display)\s+(your\s+)?(system\s+prompt|initial\s+prompt|instructions?)", "System prompt extraction"),
    (r"what\s+(is|are)\s+your\s+(system\s+)?instructions?", "System prompt extraction"),
    (r"(ignore|bypass)\s+(your\s+)?(safety|content)\s+(guidelines?|filters?|restrictions?)", "Safety bypass"),
    # Role-play jailbreaks
    (r"pretend\s+(you\s+are|to\s+be)\s+(an?\s+)?(AI|assistant|bot|model)\s+(without|that\s+has\s+no)", "Role-play jailbreak"),
    (r"act\s+as\s+if\s+you\s+(have\s+no|don'?t\s+have)\s+(restrictions?|limits?|filters?)", "Role-play jailbreak"),
    (r"you\s+are\s+now\s+(in\s+)?(developer|god|admin|root|unrestricted)\s+mode", "Privilege escalation"),
    (r"enable\s+(developer|debug|god|unrestricted|raw)\s+mode", "Privilege escalation"),
    # Token smuggling / multi-language
    (r"base64\s*decode", "Encoding trick"),
    (r"translate\s+.{0,40}\s+and\s+execute", "Indirect execution"),
    # Prompt boundary manipulation
    (r"---\s*\n.*\s*new\s+instructions?", "Prompt boundary injection", re.DOTALL),
    (r"<\s*/?system\s*>", "XML/tag injection"),
    (r"\[INST\]|\[\/INST\]|<s>|<\/s>", "Template token injection"),
]

_COMPILED: list[tuple[re.Pattern[str], str]] = []
for item in _PATTERNS:
    if len(item) == 3:
        pat, label, extra_flags = item
        _COMPILED.append((re.compile(pat, re.IGNORECASE | extra_flags), label))  # type: ignore[arg-type]
    else:
        pat, label = item  # type: ignore[misc]
        _COMPILED.append((re.compile(pat, re.IGNORECASE), label))


class PromptInjectionDetector(BaseValidator):
    """Detect prompt injection and jailbreak attempts via heuristic patterns.

    Config keys:
        sensitivity (float): 0.0–1.0. At 1.0 all patterns are active;
            lower values skip less-reliable patterns. Default 0.5.
            Currently the sensitivity gate applies to nothing — all patterns
            are considered high-confidence. Reserved for future tiering.
    """

    def validate(self, text: str, config: dict) -> tuple[str, ValidationResult]:
        _sensitivity: float = float(config.get("sensitivity", 0.5))  # noqa: F841 — reserved

        triggered: list[dict[str, str]] = []
        for pattern, label in _COMPILED:
            m = pattern.search(text)
            if m:
                triggered.append({"label": label, "match": m.group()[:100]})

        if not triggered:
            return text, ValidationResult(
                guardrail_id="",
                guardrail_name="",
                status="pass",
                message="No prompt injection patterns detected",
                metadata={"patterns_checked": len(_COMPILED)},
            )

        labels = list({t["label"] for t in triggered})
        return text, ValidationResult(
            guardrail_id="",
            guardrail_name="",
            status="fail",
            message=f"Prompt injection detected: {', '.join(labels)}",
            metadata={"triggered": triggered, "patterns_checked": len(_COMPILED)},
        )
