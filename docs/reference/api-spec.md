---
id: reference/api-spec
type: reference
scope: project
description: Live API specification for the VJ Art Engine bridge server.
---

# API Specification Reference

The VJ Art Engine exposes a comprehensive API specification at runtime.

## Fetching the Spec

**IMPORTANT**: Before operating the engine, always fetch the live spec:

```bash
curl http://localhost:3000/api/spec
```

This returns a complete JSON specification including:
- All available generators and their characteristics
- Palette/color options with examples
- Weight ranges and effects
- UI sprite structure
- Modulator sources
- Sequencing capabilities
- AI usage guide with workflow and tips

## Why Fetch Live

The live spec is always authoritative. As the engine evolves, the spec updates automatically. AI agents should:

1. Fetch `/api/spec` at session start
2. Use the returned data to understand available controls
3. Follow the `ai_usage_guide` section for best practices

## Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/spec` | GET | Full API specification (AI should read this first) |
| `/workload` | POST | Deploy visual workload |
| `/rhythm` | POST | Set BPM and pulse |
| `/state-summary` | GET | Current engine state |
| `/control-index` | GET | Available generators and channels |

## Quick Reference

### Generators
`nca`, `flow`, `wave`, `matrix`, `dots`, `blocks`, `noise`, `minimal`, `default`

### Palette
```json
{ "palette": { "colors": ["#foreground", "#background"] } }
```

### Weight
`0.0` (empty) to `1.0` (full density)

### Example Workload
```json
{
  "segments": [{
    "state": {
      "field_program": {
        "generators": [{ "id": "wave", "weight": 0.6 }]
      },
      "palette": {
        "colors": ["#00ffff", "#000022"]
      },
      "ui": []
    }
  }]
}
```
