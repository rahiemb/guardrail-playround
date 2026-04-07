"""BaseValidator abstract class — all validators implement this interface."""

from __future__ import annotations

import time
from abc import ABC, abstractmethod

from guardrail_engine.pipeline.models import Guardrail, ValidationResult


class BaseValidator(ABC):
    """Abstract base for all guardrail validators."""

    @abstractmethod
    def validate(self, text: str, config: dict) -> tuple[str, ValidationResult]:
        """Validate *text* against *config*.

        Returns:
            (output_text, ValidationResult) — output_text may differ from the
            input when action is "modify".
        """

    def run(self, text: str, guardrail: Guardrail) -> tuple[str, ValidationResult]:
        """Validate text and apply the guardrail action.

        Handles timing, enabled-check, and assembles the final result.
        """
        if not guardrail.enabled:
            return text, ValidationResult(
                guardrail_id=guardrail.id,
                guardrail_name=guardrail.name,
                status="pass",
                message="Guardrail disabled — skipped",
            )

        start = time.perf_counter()
        output_text, result = self.validate(text, guardrail.config)
        elapsed = (time.perf_counter() - start) * 1000

        result.guardrail_id = guardrail.id
        result.guardrail_name = guardrail.name
        result.execution_time_ms = round(elapsed, 2)
        return output_text, result
