# Guardrail Playground

Visual tool for designing, testing, and composing input/output guardrails for LLM applications.

## Architecture

- **`packages/ui`** — Next.js 15 frontend with React Flow canvas
- **`packages/engine`** — Python 3.12 + FastAPI guardrail engine

## Quick Start

```bash
# Install frontend deps
pnpm install

# Set up Python env
cd packages/engine
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -e ".[dev]"

# Run both services
pnpm dev:ui         # Next.js on :3000
pnpm dev:engine     # FastAPI on :8000
```

## Env

Copy `.env.example` to `.env.local` in `packages/ui/` and fill in API keys.

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 15, React 19, TypeScript |
| Canvas | React Flow (@xyflow/react) |
| UI | shadcn/ui, Tailwind CSS 4, Framer Motion |
| State | Zustand |
| Backend | FastAPI, Python 3.12 |
| LLM | LiteLLM |

## Roadmap

See [ROADMAP.md](./ROADMAP.md).
