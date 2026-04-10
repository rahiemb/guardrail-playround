"""Guardrail Engine — main FastAPI application entry point."""

from dotenv import find_dotenv, load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from guardrail_engine.api.routes import router
from guardrail_engine.api.websocket import ws_router

# Load environment variables from .env
load_dotenv(find_dotenv(usecwd=True), override=True)

app = FastAPI(
    title="Guardrail Engine",
    description="Validation engine for LLM input/output guardrails",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")
app.include_router(ws_router, prefix="/api")


@app.get("/health", tags=["system"])
async def health() -> dict:
    """Health check endpoint."""
    return {"status": "ok", "version": "0.2.0"}
