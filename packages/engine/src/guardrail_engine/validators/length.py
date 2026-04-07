"""LengthValidator — enforce min/max character and token limits."""

from __future__ import annotations

from guardrail_engine.pipeline.models import ValidationResult
from guardrail_engine.validators.base import BaseValidator


class LengthValidator(BaseValidator):
    """Block text that falls outside character or token length bounds.

    Config keys:
        min_chars (int, optional): Minimum character count.
        max_chars (int, optional): Maximum character count.
        min_tokens (int, optional): Minimum whitespace-split token count.
        max_tokens (int, optional): Maximum whitespace-split token count.
    """

    def validate(self, text: str, config: dict) -> tuple[str, ValidationResult]:
        char_count = len(text)
        token_count = len(text.split())

        min_chars: int | None = config.get("min_chars")
        max_chars: int | None = config.get("max_chars")
        min_tokens: int | None = config.get("min_tokens")
        max_tokens: int | None = config.get("max_tokens")

        meta = {"char_count": char_count, "token_count": token_count}

        if min_chars is not None and char_count < min_chars:
            return text, ValidationResult(
                guardrail_id="",
                guardrail_name="",
                status="fail",
                message=f"Text too short: {char_count} chars (min {min_chars})",
                metadata=meta,
            )

        if max_chars is not None and char_count > max_chars:
            return text, ValidationResult(
                guardrail_id="",
                guardrail_name="",
                status="fail",
                message=f"Text too long: {char_count} chars (max {max_chars})",
                metadata=meta,
            )

        if min_tokens is not None and token_count < min_tokens:
            return text, ValidationResult(
                guardrail_id="",
                guardrail_name="",
                status="fail",
                message=f"Too few tokens: {token_count} (min {min_tokens})",
                metadata=meta,
            )

        if max_tokens is not None and token_count > max_tokens:
            return text, ValidationResult(
                guardrail_id="",
                guardrail_name="",
                status="fail",
                message=f"Too many tokens: {token_count} (max {max_tokens})",
                metadata=meta,
            )

        return text, ValidationResult(
            guardrail_id="",
            guardrail_name="",
            status="pass",
            message=f"Length OK ({char_count} chars, {token_count} tokens)",
            metadata=meta,
        )
