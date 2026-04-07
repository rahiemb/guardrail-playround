"""WebSocket endpoint for real-time pipeline streaming."""

from __future__ import annotations

import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from guardrail_engine.pipeline.executor import PipelineExecutor
from guardrail_engine.pipeline.models import PipelineRunRequest

ws_router = APIRouter()
_executor = PipelineExecutor()


@ws_router.websocket("/pipeline/stream")
async def pipeline_stream(websocket: WebSocket) -> None:
    """Stream pipeline stage results in real time.

    Expects a single JSON message matching PipelineRunRequest schema,
    then emits one PipelineStageEvent JSON object per guardrail.
    Closes with a final {"done": true} message.
    """
    await websocket.accept()
    try:
        raw = await websocket.receive_text()
        request = PipelineRunRequest.model_validate_json(raw)

        async for event in _executor.stream(
            request.text, request.guardrails, request.mode
        ):
            await websocket.send_text(event.model_dump_json())

        await websocket.send_text(json.dumps({"done": True}))
    except WebSocketDisconnect:
        pass
    except Exception as exc:  # noqa: BLE001
        await websocket.send_text(json.dumps({"error": str(exc)}))
        await websocket.close()
