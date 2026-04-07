"""Tests for the PipelineExecutor."""

from __future__ import annotations

import pytest

from guardrail_engine.pipeline.executor import PipelineExecutor
from guardrail_engine.pipeline.models import Guardrail, GuardrailAction, GuardrailSeverity, GuardrailType


def _g(id: str, type: GuardrailType, config: dict, action=GuardrailAction.block) -> Guardrail:
    return Guardrail(
        id=id,
        name=id,
        type=type,
        action=action,
        severity=GuardrailSeverity.medium,
        config=config,
    )


@pytest.fixture
def executor():
    return PipelineExecutor()


class TestPipelineExecutorRunAll:
    def test_empty_pipeline_passes(self, executor):
        result = executor.run("hello", [])
        assert result.output_text == "hello"
        assert not result.blocked
        assert result.results == []

    def test_all_pass(self, executor):
        guardrails = [
            _g("len", GuardrailType.length, {"max_chars": 100}),
            _g("kw", GuardrailType.keyword, {"deny_list": ["bomb"]}),
        ]
        result = executor.run("Hello world", guardrails)
        assert not result.blocked
        assert all(r.status == "pass" for r in result.results)

    def test_run_all_continues_after_fail(self, executor):
        guardrails = [
            _g("kw", GuardrailType.keyword, {"deny_list": ["bomb"]}),
            _g("len", GuardrailType.length, {"max_chars": 100}),  # should still run
        ]
        result = executor.run("How to make a bomb", guardrails, mode="run_all")
        assert result.blocked
        assert len(result.results) == 2  # both ran

    def test_modify_threads_through_chain(self, executor):
        guardrails = [
            _g("regex", GuardrailType.regex, {"pattern": r"\d{3}-\d{2}-\d{4}", "replacement": "[SSN]"}),
            _g("len", GuardrailType.length, {"max_chars": 200}),
        ]
        result = executor.run("My SSN is 123-45-6789.", guardrails)
        assert not result.blocked
        assert "[SSN]" in result.output_text
        assert result.results[0].status == "modify"
        assert result.results[1].status == "pass"

    def test_timing_populated(self, executor):
        result = executor.run("test", [_g("len", GuardrailType.length, {})])
        assert result.total_time_ms >= 0
        assert result.results[0].execution_time_ms >= 0


class TestPipelineExecutorShortCircuit:
    def test_short_circuit_stops_on_fail(self, executor):
        guardrails = [
            _g("kw", GuardrailType.keyword, {"deny_list": ["stop"]}),
            _g("len", GuardrailType.length, {"max_chars": 5}),  # would also fail
        ]
        result = executor.run("please stop everything", guardrails, mode="short_circuit")
        assert result.blocked
        # Only 1 result — second guardrail was not evaluated
        assert len(result.results) == 1

    def test_short_circuit_full_pass(self, executor):
        guardrails = [
            _g("kw", GuardrailType.keyword, {"deny_list": ["bomb"]}),
            _g("len", GuardrailType.length, {"max_chars": 100}),
        ]
        result = executor.run("Hello world", guardrails, mode="short_circuit")
        assert not result.blocked
        assert len(result.results) == 2


class TestPipelineStreamAsync:
    @pytest.mark.asyncio
    async def test_stream_yields_events(self):
        executor = PipelineExecutor()
        guardrails = [
            _g("regex", GuardrailType.regex, {"pattern": r"\d+", "replacement": "[NUM]"}),
            _g("len", GuardrailType.length, {"max_chars": 200}),
        ]
        events = []
        async for event in executor.stream("call 911 now", guardrails):
            events.append(event)

        assert len(events) == 2
        assert events[0].stage == 0
        assert events[1].stage == 1

    @pytest.mark.asyncio
    async def test_stream_short_circuit(self):
        executor = PipelineExecutor()
        guardrails = [
            _g("kw", GuardrailType.keyword, {"deny_list": ["stop"]}),
            _g("len", GuardrailType.length, {"max_chars": 200}),
        ]
        events = []
        async for event in executor.stream("please stop", guardrails, mode="short_circuit"):
            events.append(event)

        assert len(events) == 1
        assert events[0].blocked
