"""PipelineExecutor — runs text through an ordered list of guardrails."""

from __future__ import annotations

import time
from collections.abc import AsyncGenerator

from guardrail_engine.pipeline.models import (
    Guardrail,
    GuardrailType,
    PipelineRunResult,
    PipelineStageEvent,
    ValidationResult,
)
from guardrail_engine.validators.base import BaseValidator
from guardrail_engine.validators.format import FormatValidator
from guardrail_engine.validators.keyword import KeywordValidator
from guardrail_engine.validators.length import LengthValidator
from guardrail_engine.validators.pii import PIIDetector
from guardrail_engine.validators.prompt_injection import PromptInjectionDetector
from guardrail_engine.validators.regex import RegexValidator
from guardrail_engine.validators.topic import TopicValidator
from guardrail_engine.validators.toxicity import ToxicityDetector

_REGISTRY: dict[GuardrailType, BaseValidator] = {
    GuardrailType.regex: RegexValidator(),
    GuardrailType.keyword: KeywordValidator(),
    GuardrailType.length: LengthValidator(),
    GuardrailType.pii: PIIDetector(),
    GuardrailType.toxicity: ToxicityDetector(),
    GuardrailType.prompt_injection: PromptInjectionDetector(),
    GuardrailType.topic: TopicValidator(),
    GuardrailType.format: FormatValidator(),
}


class PipelineExecutor:
    """Execute an ordered chain of guardrail validators against a text input.

    Modes:
        run_all       — evaluate every enabled guardrail regardless of failures.
        short_circuit — stop at the first blocking failure.
    """

    def run(
        self,
        text: str,
        guardrails: list[Guardrail],
        mode: str = "run_all",
    ) -> PipelineRunResult:
        pipeline_start = time.perf_counter()
        current_text = text
        results: list[ValidationResult] = []
        blocked = False

        for guardrail in guardrails:
            validator = _REGISTRY.get(guardrail.type)
            if validator is None:
                results.append(
                    ValidationResult(
                        guardrail_id=guardrail.id,
                        guardrail_name=guardrail.name,
                        status="warn",
                        message=f"No validator registered for type: {guardrail.type}",
                    )
                )
                continue

            output_text, result = validator.run(current_text, guardrail)
            results.append(result)

            # Text advances only on successful modify
            if result.status == "modify" and result.modified_text is not None:
                current_text = result.modified_text
            elif result.status == "fail":
                blocked = True
                if mode == "short_circuit":
                    break
                # run_all: keep current_text unchanged, continue

        total_ms = round((time.perf_counter() - pipeline_start) * 1000, 2)
        return PipelineRunResult(
            input_text=text,
            output_text=current_text if not blocked else text,
            results=results,
            blocked=blocked,
            total_time_ms=total_ms,
        )

    async def stream(
        self,
        text: str,
        guardrails: list[Guardrail],
        mode: str = "run_all",
    ) -> AsyncGenerator[PipelineStageEvent, None]:
        """Async generator that yields a PipelineStageEvent after each guardrail."""
        current_text = text
        blocked = False

        for i, guardrail in enumerate(guardrails):
            validator = _REGISTRY.get(guardrail.type)
            if validator is None:
                result = ValidationResult(
                    guardrail_id=guardrail.id,
                    guardrail_name=guardrail.name,
                    status="warn",
                    message=f"No validator registered for type: {guardrail.type}",
                )
                yield PipelineStageEvent(
                    stage=i,
                    guardrail_id=guardrail.id,
                    result=result,
                    current_text=current_text,
                    blocked=blocked,
                )
                continue

            output_text, result = validator.run(current_text, guardrail)

            if result.status == "modify" and result.modified_text is not None:
                current_text = result.modified_text
            elif result.status == "fail":
                blocked = True

            yield PipelineStageEvent(
                stage=i,
                guardrail_id=guardrail.id,
                result=result,
                current_text=current_text,
                blocked=blocked,
            )

            if blocked and mode == "short_circuit":
                break
