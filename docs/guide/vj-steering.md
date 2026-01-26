---
id: guide/vj-steering
type: guide
scope: project
description: Creative guide for steering the VJ Art Engine using AI.
---

# Steering the VJ Art Engine

The VJ Art Engine is designed for continuous, organic evolution steered by AI.

## AI Tutorial: Steering the Engine

As an AI Operator, you control the "vibe" of the visual output by adjusting the generator parameters and UI overlays.

### 1. Understanding the Loop
- **Analyze**: Read the `state-summary` from the bridge to understand current metrics (energy, density).
- **Interpret**: Take high-level intent from the Creator (e.g., "Deep sea atmosphere").
- **Apply**: Send a `WORKLOAD` to the bridge with appropriate generator weights (e.g., low-frequency `curl_noise` for swaying).

### 2. Transitioning
Use `transition.duration_seconds` to avoid jarring changes. 
- For organic growth: 2.0 - 5.0s
- For rhythmic stabs: 0.1 - 0.3s

## Creative Heuristics

- **Energy vs. Density**: High energy (motion) often looks better with lower density (fewer characters) to avoid "mush".
- **Rhythmic Coupling**: Use the `pulse` from the rhythm detector to modulate `gen_weight`.
- **Character Choice**: Use sharp characters (`#`, `@`) for high energy and soft characters (`.`, `:`) for ambient states.

## VJ-Oriented Examples

### "Glitch Storm"
- Generator: `nca`
- Weight: 0.8
- Intent: High turbulence, rapid character shifts.
- Binding: `GEN_WEIGHT_INC` repeatedly.

### "Ambient Flow"
- Generator: `flow_field`
- Weight: 0.3
- Intent: Smooth, liquid-like movement.
- Characters: `~`, `-`, `.`.

### "Beat Reactive Banner"
- UI: `banner` sprite.
- Coupling: Scale or opacity mapped to `rhythm.pulse`.

