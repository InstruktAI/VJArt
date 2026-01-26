---
id: guide/vj-steering
type: guide
scope: project
description: Creative guide for steering the VJ Art Engine using AI.
---

# Steering the VJ Art Engine

The VJ Art Engine is designed for continuous, organic evolution steered by AI.

## Two-Phase Mapping
1. **Creator AI**: Captures human intent (e.g., "Make it more turbulent and glitchy").
2. **Operator AI**: Maps this to control-plane changes (e.g., increase `glitch.intensity` and `curl_noise.strength`).

## Continuity
Avoid hard cuts unless requested. Use `transition.duration_seconds` to smoothly morph between states.

## Temporary UI
You can "spawn" interfaces by defining `ui_sprite` segments. These auto-hide after inactivity, allowing for interactive "play" without permanent UI clutter.
