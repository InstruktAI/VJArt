# VJ Art Engine

An AI-orchestrated ASCII VJ engine.

## Structure
- `apps/web`: React/Vite SPA (The Renderer).
- `packages/engine`: Core engine logic and types.
- `packages/bridge`: Local bridge server (WebSocket/HTTP).

## Getting Started
1. Install dependencies: `npm install`
2. Build everything: `npm run build`
3. Start the bridge: `cd packages/bridge && npm start`
4. Start the web app: `cd apps/web && npm run dev`

## AI Flow
- **Creator**: User -> Intent
- **Operator**: Intent -> Workload
- **Engine**: Workload -> ASCII Field
