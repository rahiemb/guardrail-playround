"""KeywordValidator — deny/allow list keyword filtering."""

from __future__ import annotations

from guardrail_engine.pipeline.models import ValidationResult
from guardrail_engine.validators.base import BaseValidator


class KeywordValidator(BaseValidator):
    """Block text based on keyword deny or allow lists.

    Config keys:
        deny_list (list[str]): Keywords whose presence triggers a block.
        allow_list (list[str]): If provided, text must contain at least one
            keyword from this list or it is blocked.
        case_sensitive (bool): Default False.
    """

    def validate(self, text: str, config: dict) -> tuple[str, ValidationResult]:
        deny_list: list[str] = config.get("deny_list", [])
        allow_list: list[str] = config.get("allow_list", [])
        case_sensitive: bool = bool(config.get("case_sensitive", False))

        check_text = text if case_sensitive else text.lower()

        # Deny-list check
        for kw in deny_list:
            needle = kw if case_sensitive else kw.lower()
            if needle in check_text:
                return text, ValidationResult(
                    guardrail_id="",
                    guardrail_name="",
                    status="fail",
                    message=f"Blocked keyword detected: {kw!r}",
                    metadata={"triggered_keyword": kw, "list": "deny"},
                )

        # Allow-list check (only enforced when allow_list is non-empty)
        if allow_list:
            matched = next(
                (kw for kw in allow_list if (kw if case_sensitive else kw.lower()) in check_text),
                None,
            )
            if matched is None:
                return text, ValidationResult(
                    guardrail_id="",
                    guardrail_name="",
                    status="fail",
                    message="Text does not contain any allowed keyword",
                    metadata={"list": "allow"},
                )

        return text, ValidationResult(
            guardrail_id="",
            guardrail_name="",
            status="pass",
            message="No keyword violations",
        )
