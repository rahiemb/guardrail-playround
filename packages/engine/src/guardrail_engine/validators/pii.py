"""PIIDetector — detect and redact PII using Microsoft Presidio (optional dep)."""

from __future__ import annotations

from guardrail_engine.pipeline.models import ValidationResult
from guardrail_engine.validators.base import BaseValidator

_PRESIDIO_AVAILABLE = False
try:
    from presidio_analyzer import AnalyzerEngine
    from presidio_anonymizer import AnonymizerEngine

    _analyzer = AnalyzerEngine()
    _anonymizer = AnonymizerEngine()
    _PRESIDIO_AVAILABLE = True
except ImportError:
    _analyzer = None  # type: ignore[assignment]
    _anonymizer = None  # type: ignore[assignment]


_DEFAULT_ENTITIES = [
    "PERSON",
    "EMAIL_ADDRESS",
    "PHONE_NUMBER",
    "US_SSN",
    "CREDIT_CARD",
    "LOCATION",
    "DATE_TIME",
    "IP_ADDRESS",
    "URL",
]


class PIIDetector(BaseValidator):
    """Detect and redact personally identifiable information via Presidio.

    Falls back to a warn result when presidio is not installed.

    Config keys:
        entities (list[str]): Presidio entity types to detect.
            Defaults to a standard set of 9 common types.
        language (str): Text language code. Default "en".
        action (str): "redact" (default) or "block".
    """

    def validate(self, text: str, config: dict) -> tuple[str, ValidationResult]:
        if not _PRESIDIO_AVAILABLE:
            return text, ValidationResult(
                guardrail_id="",
                guardrail_name="",
                status="warn",
                message="presidio-analyzer not installed — PII detection skipped. "
                        "Run: pip install presidio-analyzer presidio-anonymizer && "
                        "python -m spacy download en_core_web_lg",
            )

        entities: list[str] = config.get("entities", _DEFAULT_ENTITIES)
        language: str = config.get("language", "en")
        action: str = config.get("action", "redact")

        results = _analyzer.analyze(text=text, entities=entities, language=language)

        if not results:
            return text, ValidationResult(
                guardrail_id="",
                guardrail_name="",
                status="pass",
                message="No PII detected",
                metadata={"entities_checked": entities},
            )

        if action == "block":
            detected = [r.entity_type for r in results]
            return text, ValidationResult(
                guardrail_id="",
                guardrail_name="",
                status="fail",
                message=f"PII detected: {', '.join(detected)}",
                metadata={"detected_entities": detected, "count": len(results)},
            )

        # Redact
        anonymized = _anonymizer.anonymize(text=text, analyzer_results=results)
        detected = [r.entity_type for r in results]
        return anonymized.text, ValidationResult(
            guardrail_id="",
            guardrail_name="",
            status="modify",
            message=f"Redacted {len(results)} PII entity/entities: {', '.join(detected)}",
            modified_text=anonymized.text,
            metadata={"detected_entities": detected, "count": len(results)},
        )
