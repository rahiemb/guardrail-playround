"""FormatValidator — enforce JSON, XML, or Markdown output structure."""

from __future__ import annotations

import json
import re
import xml.etree.ElementTree as ET

from guardrail_engine.pipeline.models import ValidationResult
from guardrail_engine.validators.base import BaseValidator


class FormatValidator(BaseValidator):
    """Validate that text conforms to a structural format.

    Config keys:
        format (str): One of "json", "xml", "markdown". Required.
        required_keys (list[str], optional): For JSON — top-level keys that
            must be present in the parsed object.
        required_headings (list[str], optional): For Markdown — heading text
            that must appear (case-insensitive, ignoring # prefix).
    """

    def validate(self, text: str, config: dict) -> tuple[str, ValidationResult]:
        fmt: str = config.get("format", "")
        stripped = text.strip()

        if fmt == "json":
            return self._check_json(stripped, config)
        if fmt == "xml":
            return self._check_xml(stripped, config)
        if fmt == "markdown":
            return self._check_markdown(stripped, config)

        return text, ValidationResult(
            guardrail_id="",
            guardrail_name="",
            status="warn",
            message=f"Unknown format: {fmt!r}. Expected json, xml, or markdown.",
        )

    # ── format-specific checkers ──────────────────────────────

    @staticmethod
    def _check_json(text: str, config: dict) -> tuple[str, ValidationResult]:
        try:
            parsed = json.loads(text)
        except json.JSONDecodeError as exc:
            return text, ValidationResult(
                guardrail_id="",
                guardrail_name="",
                status="fail",
                message=f"Invalid JSON: {exc}",
                metadata={"format": "json"},
            )

        required_keys: list[str] = config.get("required_keys", [])
        if required_keys and isinstance(parsed, dict):
            missing = [k for k in required_keys if k not in parsed]
            if missing:
                return text, ValidationResult(
                    guardrail_id="",
                    guardrail_name="",
                    status="fail",
                    message=f"JSON missing required keys: {missing}",
                    metadata={"format": "json", "missing_keys": missing},
                )

        return text, ValidationResult(
            guardrail_id="",
            guardrail_name="",
            status="pass",
            message="Valid JSON",
            metadata={"format": "json"},
        )

    @staticmethod
    def _check_xml(text: str, config: dict) -> tuple[str, ValidationResult]:  # noqa: ARG004
        try:
            ET.fromstring(text)
        except ET.ParseError as exc:
            return text, ValidationResult(
                guardrail_id="",
                guardrail_name="",
                status="fail",
                message=f"Invalid XML: {exc}",
                metadata={"format": "xml"},
            )
        return text, ValidationResult(
            guardrail_id="",
            guardrail_name="",
            status="pass",
            message="Valid XML",
            metadata={"format": "xml"},
        )

    @staticmethod
    def _check_markdown(text: str, config: dict) -> tuple[str, ValidationResult]:
        has_heading = bool(re.search(r"^#{1,6}\s+\S", text, re.MULTILINE))
        has_list = bool(re.search(r"^[\-\*\+]\s+\S|^\d+\.\s+\S", text, re.MULTILINE))

        required_headings: list[str] = config.get("required_headings", [])
        missing_headings: list[str] = []
        if required_headings:
            heading_texts = re.findall(r"^#{1,6}\s+(.+)$", text, re.MULTILINE)
            normalised = [h.strip().lower() for h in heading_texts]
            missing_headings = [h for h in required_headings if h.lower() not in normalised]

        if not (has_heading or has_list):
            return text, ValidationResult(
                guardrail_id="",
                guardrail_name="",
                status="fail",
                message="Text does not appear to contain Markdown structure (no headings or lists)",
                metadata={"format": "markdown"},
            )

        if missing_headings:
            return text, ValidationResult(
                guardrail_id="",
                guardrail_name="",
                status="fail",
                message=f"Missing required Markdown headings: {missing_headings}",
                metadata={"format": "markdown", "missing_headings": missing_headings},
            )

        return text, ValidationResult(
            guardrail_id="",
            guardrail_name="",
            status="pass",
            message="Valid Markdown structure",
            metadata={"format": "markdown", "has_heading": has_heading, "has_list": has_list},
        )
