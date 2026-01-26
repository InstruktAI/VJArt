# VJ Art Engine — Implementation Plan (Draft)

## Goal
Deliver a minimal, AI‑orchestrated ASCII VJ engine with:
- Creator/Operator two‑phase AI flow
- Intent → workload pipeline
- WebGL primary + TUI secondary renderers
- Asset ingestion + rhythm input
- Temporary AI‑authored UI intents
- Strict YAML schemas for control plane + operator workloads
- Client‑side execution with local workload bridge

## Phase 0 — Schemas + Roles
1) [x] Finalize intent/workload schemas (v1).
2) [x] Define Creator/Operator roles and system prompts.
3) [x] Author `.agents/agents/operator.md` using agent artifact schema.
4) [x] Create docs scaffolding for snippets and prompt context.
5) [x] Store system prompts in `docs/role/` and reference schemas.
6) [x] Create `schemas/` and add:
   - `control-plane.schema.yaml`
   - `operator-workload.schema.yaml`
7) [x] Wire agent runtime bootstrapping:
   - `AGENTS.md` required reads load Creator role + baseline.
   - Ensure `.agents/agents/operator.md` exists and is referenced by the repo.

## Phase 1 — Core API + Orchestration
1) Intent endpoint (Creator → Operator handoff).
2) Workload endpoint (Operator → engine execution).
3) Control index endpoint (read‑only discovery).
4) State summary endpoint (compact field metrics).
5) Defer OpenAPI until server exists; generate from code and embed schemas.

## Phase 1.5 — Local bridge
1) Minimal Node-based local bridge (WebSocket workload stream).
2) Client subscribes to workloads and runs engine locally.

## Phase 2 — Input Automation
1) Asset ingestion pipeline (drop → ASCII JSON + tags).
2) Asset registry endpoints (list, fetch by handle).
3) Rhythm inputs: tap‑tempo + mic beat detection.

## Phase 3 — Rendering
1) WebGL renderer (primary) with ASCII grid mapping.
2) TUI renderer (secondary) driven by same control graph.
3) Renderer capability discovery + adaptation.

## Repo layout (proposed)
- `apps/web` — Vite SPA (renderer + engine runtime)
- `packages/engine` — control plane runtime + field engine
- `packages/bridge` — local workload bridge (WS/HTTP)
- `schemas` — YAML control-plane + operator workload

## Bootstrap checklist (implementation-time)
- Tooling: TypeScript, strict config, linting, formatter.
- Git hooks: pre-commit wiring for lint/test.
- Package manager: npm/yarn/pnpm (builder choice).
- Workspace layout: monorepo with apps/packages.

## Phase 4 — UI intent execution
1) Operator → UI payload generation (glyph matrix + input map).
2) Input binding dispatch (keyboard/mouse to mapped controls).
3) UI lifecycle behavior (visible/hidden/removed per intent).

## Phase 5 — Documentation
1) Creator/Operator prompt docs.
2) Intent schema guide.
3) Operator workload guide.
4) VJ‑oriented examples.
5) Verify Definition of Done:
   `software-development/standards/definition-of-done`.
6) Add `README.md` describing intent + local run instructions.

## Open questions
- Exact L0 control graph shape (first concrete draft).
- Renderer capability descriptor format.
- Asset tagging vocabulary source of truth.
