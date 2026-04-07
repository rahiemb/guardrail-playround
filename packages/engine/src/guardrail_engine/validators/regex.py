"""RegexValidator — pattern-based text matching."""

from __future__ import annotations

import re

from guardrail_engine.pipeline.models import ValidationResult
from guardrail_engine.validators.base import BaseValidator


class RegexValidator(BaseValidator):
    """Block or modify text that matches a regular expression.

    Config keys:
        pattern (str): The regex pattern to match against.
        flags (str, optional): Comma-separated re flag names, e.g. "IGNORECASE,MULTILINE".
        replacement (str, optional): Replacement string when action is "modify".
            Defaults to "[REDACTED]".
    """

    def validate(self, text: str, config: dict) -> tuple[str, ValidationResult]:
        pattern = config.get("pattern", "")
        if not pattern:
            return text, ValidationResult(
                guardrail_id="",
                guardrail_name="",
                status="pass",
                message="No pattern configured",
            )

        flag_names = [f.strip() for f in str(config.get("flags", "")).split(",") if f.strip()]
        flags = 0
        for name in flag_names:
            flags |= getattr(re, name, 0)

        try:
            compiled = re.compile(pattern, flags)
        except re.error as exc:
            return text, ValidationResult(
                guardrail_id="",
                guardrail_name="",
                status="warn",
                message=f"Invalid regex pattern: {exc}",
            )

        match = compiled.search(text)
        if not match:
            return text, ValidationResult(
                guardrail_id="",
                guardrail_name="",
                status="pass",
                message="No match found",
            )

        # Match found — apply action based on configured replacement
        replacement = str(config.get("replacement", "[REDACTED]"))
        modified = compiled.sub(replacement, text)

        return modified, ValidationResult(
            guardrail_id="",
            guardrail_name="",
            status="modify",
            message=f"Pattern matched: {match.group()!r}",
            modified_text=modified,
            metadata={"match": match.group(), "pattern": pattern},
        )
