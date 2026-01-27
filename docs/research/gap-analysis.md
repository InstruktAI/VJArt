# Gap Analysis: AsciiEngine vs VJArt

Research date: 2026-01-27. Based on analysis of both codebases.

## Executive Summary

VJArt has the engine infrastructure (generators, flow resolver, sequencer, HSV color, attractors) but **under-exploits its own renderer and under-drives its own parameters**. The old AsciiEngine was simpler but looked better because every visual control was always active.

---

## 1. Renderer Under-Utilization

### What AsciiEngine's Three.js renderer (AsciiTerminal.jsx) exposes:

| Feature | AsciiEngine | VJArt | Gap |
|---------|-------------|-------|-----|
| Per-char RGB color | Full HSV→RGB per pixel | Has colorBuffer but intensity used as binary on/off | **Intensity not modulating color brightness** |
| Bloom/Glow | Dynamic, 0-2.5 range, user-controllable | Static prop (1.35), not driven by engine | **Bloom should vary with mood/attractor** |
| Chromatic aberration | User slider 0-0.01 | Not present | **Missing** |
| Scanlines | User slider 0-0.4 | Present but static | **Should be driven by engine postProcessing params** |
| charGamma | User slider 0.6-1.8, applied in render loop | Computed in engine but renderer doesn't apply it separately | OK (engine handles) |
| Invert | Toggle | Not exposed | Minor |
| Brightness/Contrast | Per-frame in render loop | Engine computes but renderer doesn't re-apply | Engine handles; OK |
| Zoom | 60-120, user slider | Fixed camera | **Should be driveable** |

### What Three.js can do that neither engine uses:

- **Per-character scale** (InstancedMesh supports setScaleAt) — ~20 lines
- **Per-character rotation** — ~30 lines
- **Dynamic background** (gradient/animated instead of solid color)
- **Custom distortion shaders** (lens warp, wave, pixelation)
- **Particle overlay** for sparkle/trail effects
- **Depth-of-field** with perspective camera

## 2. Engine Parameter Gaps

### AsciiEngine PatternSynth drives these per-frame:
- `speed`, `freq_x`, `freq_y`, `warp`, `spin`, `drift`, `noise`
- `hue_shift`, `hue_range`, `hue_speed`, `sat`, `val`

### VJArt engine has all of these PLUS:
- `feedback`, `feedbackDecay`, `blur`, `scanlines`, `pixelate`, `glitch`, `strobe`
- `charGamma`, `saturation`, `contrast`, `brightness`, `hueRotate`, `colorCycle`
- `scale`, `rotation`, `panX`, `panY`
- Post-processing chain: feedback → blur → pixelate → scanlines → glitch

**The problem is not missing params. The problem is the composer emits narrow ranges that converge.**

Key issues:
1. **Post-processing params have near-zero default ranges** — blur [0, 0.1], glitch [0, 0.03], scanlines [0, 0.1]. These are barely visible.
2. **No attractor targets post-processing params** — attractors set pattern params but not blur/scanlines/glitch/feedback
3. **Mood ranges are timid** — designed for "safe" output, not VJ-quality visual impact

## 3. Color System Gap

### AsciiEngine color pipeline:
```
pattern_value (0-1) → hue = (value * hue_range + hue_shift + t * hue_speed) % 1.0
                     → RGB = hsv_to_rgb(hue, sat, val)
```
- **sat and val are uniform** per frame (0.8-1.0 typical)
- Color varies ONLY via hue, driven by pattern intensity

### VJArt color pipeline:
```
pattern_value (0-1) → hue = (value * hueRange + hueShift + t * hueSpeed) % 1.0
                     → RGB = hsvToRgb(hue, sat, val * pattern)
```
- **val is multiplied by pattern** — darker areas get dimmer
- Has brightness/contrast post-processing on top

**VJArt's color system is actually MORE capable. But the renderer throws away the nuance by using intensity as a binary gate (< 0.01 = black, else = full color).**

Fix: In ThreeRenderer, multiply color by intensity for smooth falloff instead of binary.

## 4. Transition System Gap

### AsciiEngine transitions:
- Linear frame crossfade (`blend_frames`)
- Knob tweening (linear interpolation of any param over segment duration)
- Mode switch with configurable transition_sec

### VJArt transitions:
- FlowResolver with easing functions (easeIn, easeOut, easeInOut, linear)
- Per-param flow targets with from/to values
- Attractor drift (gradual parameter convergence)
- Mood crossfade over N segments

**VJArt's transition system is MORE sophisticated.** The gap is not in the system but in what gets transitioned — the ranges are too narrow so transitions are imperceptible.

## 5. Sequence / Session System Gap

### AsciiEngine:
- `/ai/sequence` endpoint: multi-segment scripted sequences with knob ramps
- Auto-cycling with configurable interval
- Prompt-to-mode mapping

### VJArt:
- FlowSegment sequences with duration + flows
- Sequencer with scrub/pause/speed controls
- Composer auto-generates segments
- Bridge WebSocket for external control

**VJArt's sequencer is MORE capable.** But it only plays composer-generated content. No import of curated sequences, no external sequence loading beyond bridge messages.

## 6. What to Fix (Priority Order)

### A. Make existing params LOUD (no code architecture change)

1. **Widen attractor params** to include post-processing:
   - Add `feedback`, `blur`, `scanlines`, `glitch`, `pixelate` to select attractors
   - e.g., "Digital Rain" should have `scanlines: 0.3, glitch: 0.1`
   - e.g., "Static Burst" should have `glitch: 0.2, pixelate: 0.15`

2. **Widen DEFAULT_RANGES** for post-processing params:
   - `blur`: [0, 0.3] instead of [0, 0.1]
   - `scanlines`: [0, 0.3] instead of [0, 0.1]
   - `glitch`: [0, 0.15] instead of [0, 0.03]
   - `feedback`: [0.2, 0.8] instead of [0.3, 0.6]
   - `strobe`: [0, 0.3] instead of [0, 0]

3. **Widen mood ranges** — every mood should push SOME effect hard

### B. Fix renderer color handling (~5 lines)

4. In ThreeRenderer `useFrame`, multiply color by intensity:
   ```
   color.setRGB(colors[ci] * intensity, colors[ci+1] * intensity, colors[ci+2] * intensity)
   ```
   Instead of binary on/off at 0.01 threshold.

### C. Expose renderer controls to engine (~50 lines)

5. Pass `bloom`, `scanlineOpacity`, `chromaticAberration` as state from engine
6. Drive these from composer/attractor params
7. Add zoom as a driveable param

### D. Add per-instance visual richness (~80 lines)

8. Per-character scale based on intensity (pulsing characters)
9. Per-character rotation based on phase angle

### E. Import curated sequences (design work)

10. Define a JSON format for "VJ sets" — named sequences of FlowSegments
11. Ship 5-10 hand-crafted sets that look great
12. Allow loading via bridge or file drop
