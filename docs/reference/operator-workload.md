---
id: reference/operator-workload
type: reference
scope: project
description: Reference guide for the Operator workload payload.
---

# Operator Workload Reference

The Operator Workload is a strict YAML/JSON payload composed by the Operator AI.

## Structure
- `segments`: Array of workload segments.
  - `state`: The field program, coupling, spatial, symbol, and palette state.
  - `transition`: Duration and blend profile for the state change.
  - `exit`: Timing or events that trigger the end of the segment.

## UI Intent
UI is expressed as `ui_sprite` objects with:
- `region`: Placement in normalized [0,1] coordinates.
- `render`: ASCII glyph rows and optional color/alpha grids.
- `input_bindings`: Mapping of events to control paths.
