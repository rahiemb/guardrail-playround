"""ToxicityDetector — detect toxic content using detoxify (optional dep)."""

from __future__ import annotations

from guardrail_engine.pipeline.models import ValidationResult
from guardrail_engine.validators.base import BaseValidator

_DETOXIFY_AVAILABLE = False
_model = None

try:
    from detoxify import Detoxify  # type: ignore[import-untyped]

    _model = Detoxify("original")
    _DETOXIFY_AVAILABLE = True
except ImportError:
    pass


_ALL_CATEGORIES = [
    "toxicity",
    "severe_toxicity",
    "obscene",
    "threat",
    "insult",
    "identity_attack",
]


class ToxicityDetector(BaseValidator):
    """Detect toxic language via the detoxify library.

    Falls back to a warn result when detoxify is not installed.

    Config keys:
        threshold (float): Score above which a category triggers. Default 0.5.
        categories (list[str]): Subset of detoxify categories to check.
            Defaults to all six Unitary original-model categories.
    """

    def validate(self, text: str, config: dict) -> tuple[str, ValidationResult]:
        if not _DETOXIFY_AVAILABLE or _model is None:
            return text, ValidationResult(
                guardrail_id="",
                guardrail_name="",
                status="warn",
                message="detoxify not installed — toxicity detection skipped. "
                        "Run: pip install detoxify",
            )

        threshold: float = float(config.get("threshold", 0.5))
        categories: list[str] = config.get("categories", _ALL_CATEGORIES)

        scores: dict[str, float] = _model.predict(text)

        triggered = {
            cat: round(float(scores[cat]), 4)
            for cat in categories
            if cat in scores and scores[cat] >= threshold
        }

        if not triggered:
            all_scores = {cat: round(float(scores[cat]), 4) for cat in categories if cat in scores}
            return text, ValidationResult(
                guardrail_id="",
                guardrail_name="",
                status="pass",
                message="No toxicity detected above threshold",
                metadata={"scores": all_scores, "threshold": threshold},
            )

        return text, ValidationResult(
            guardrail_id="",
            guardrail_name="",
            status="fail",
            message=f"Toxic content detected: {', '.join(triggered.keys())}",
            metadata={"triggered": triggered, "threshold": threshold},
        )
