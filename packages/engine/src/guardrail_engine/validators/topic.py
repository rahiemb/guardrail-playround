"""TopicValidator — keyword-expansion based topic allow/block lists."""

from __future__ import annotations

from guardrail_engine.pipeline.models import ValidationResult
from guardrail_engine.validators.base import BaseValidator


class TopicValidator(BaseValidator):
    """Block or allow text based on detected topics.

    Topics are defined as keyword lists. A topic is "detected" when any
    keyword in that topic's list appears in the text.

    Config keys:
        blocked_topics (dict[str, list[str]]): Mapping of topic name →
            list of trigger keywords. Any hit blocks the text.
        allowed_topics (dict[str, list[str]]): If provided, text must
            match at least one allowed topic or it is blocked.
        case_sensitive (bool): Default False.

    Example config::

        {
            "blocked_topics": {
                "violence": ["kill", "murder", "attack", "weapon"],
                "finance": ["buy stock", "insider trading"]
            }
        }
    """

    def validate(self, text: str, config: dict) -> tuple[str, ValidationResult]:
        blocked_topics: dict[str, list[str]] = config.get("blocked_topics", {})
        allowed_topics: dict[str, list[str]] = config.get("allowed_topics", {})
        case_sensitive: bool = bool(config.get("case_sensitive", False))

        check_text = text if case_sensitive else text.lower()

        # Blocked topic check
        for topic, keywords in blocked_topics.items():
            for kw in keywords:
                needle = kw if case_sensitive else kw.lower()
                if needle in check_text:
                    return text, ValidationResult(
                        guardrail_id="",
                        guardrail_name="",
                        status="fail",
                        message=f"Blocked topic detected: {topic!r} (keyword: {kw!r})",
                        metadata={"topic": topic, "triggered_keyword": kw},
                    )

        # Allowed topic check (only enforced when non-empty)
        if allowed_topics:
            matched_topic = None
            for topic, keywords in allowed_topics.items():
                for kw in keywords:
                    needle = kw if case_sensitive else kw.lower()
                    if needle in check_text:
                        matched_topic = topic
                        break
                if matched_topic:
                    break

            if matched_topic is None:
                return text, ValidationResult(
                    guardrail_id="",
                    guardrail_name="",
                    status="fail",
                    message="Text does not match any allowed topic",
                    metadata={"allowed_topics": list(allowed_topics.keys())},
                )

        return text, ValidationResult(
            guardrail_id="",
            guardrail_name="",
            status="pass",
            message="No topic violations",
        )
