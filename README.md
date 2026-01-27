# VJ Art Engine

An AI-orchestrated ASCII VJ engine.

## Quick Start

```bash
npm install
npm run dev
```

Opens bridge server + web app with hot reload.

## Structure

- `apps/web` - React/Vite renderer
- `packages/engine` - Core engine logic and types
- `packages/bridge` - WebSocket/HTTP bridge server

## AI Flow

- **Creator**: User -> Intent
- **Operator**: Intent -> Workload
- **Engine**: Workload -> ASCII Field
