"""Smoke tests for the FastAPI health endpoint."""

import pytest
from httpx import ASGITransport, AsyncClient

from guardrail_engine.main import app


@pytest.mark.asyncio
async def test_health_returns_ok() -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


@pytest.mark.asyncio
async def test_guardrail_types_returns_list() -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/guardrails/types")
    assert response.status_code == 200
    types = response.json()
    assert len(types) >= 7
    assert all("id" in t and "name" in t for t in types)
