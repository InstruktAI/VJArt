# VJ Art Engine — Requirements (Unified, Complete)

## 1) Vision
- A real‑time engine centered on **characters on the screen**.
- A **single, continuous field** that evolves constantly and organically.
- AI is the **primary controller**; humans prompt the AI.
- The ASCII aesthetic is preserved while embracing **modern GPU capability**.
- The architecture remains open to evolving requirements over time.

## 2) Architecture (control plane + renderers)
### 2.1 Control plane (base layer)
- A **single, renderer‑agnostic control graph** is the source of truth.
- The control graph is **predictable and compact** so AI can steer it reliably.
- The control plane supports **diff updates** (partial changes only).
- The control plane exposes a **discoverable control index** (read‑only) so AI can
  inspect what is available before mapping intent to controls.

### 2.2 Renderer plugins (capability discovery)
- Renderers **register capabilities** at runtime (algorithm support, cost tiers, resolution limits).
- The control plane **adapts** outputs based on renderer capabilities.
- The primary renderer is **WebGL** in the browser.
### 2.3 Client-first execution
- The engine runs **client-side in the browser** as a single-page application.
- A tiny **local bridge** delivers workloads (WebSocket) from the AI runtime to the client.
- The client executes the control-plane locally; no frame streaming.

## 3) AI control philosophy
- AI sends **diff updates** to a minimal, learnable control surface.
- The system provides a **compact state summary** so AI can continue coherently.
- Creative guidance and example prompts are first‑class documentation.
- Updates feel like **steering**, not switching.
- AI operates by **mapping intent into control values**, not by emitting scripts.
- The repo targets **Gemini** or **Claude Code** as the runtime entry point.
- The runtime reads **AGENTS.md** and loads the **Creator** role snippet.
- The runtime spawns a **sub‑agent Operator** defined under `.agents/agents/operator.md`
  and distributed by the agent artifact tooling.
### 3.0) Agent runtime wiring (must be implemented)
- `AGENTS.md` at repo root **must** include required reads that load:
  - `docs/role/creator.md`
  - `docs/baseline/index.md`
- `.agents/agents/operator.md` **must** exist and follow the agent artifact schema.

### 3.1) Control-plane contracts
- The Operator workload is defined by **strict YAML schemas**.
- A separate **control-plane schema** defines generators, channels, enums, and ranges.
- These schemas are the source of truth for payload composition.
- OpenAPI will be **generated from the API server** later to avoid stale specs.

### 3.2) Creator → Operator flow
- **Creator AI** (front‑line):
  - Receives all human inputs (prompts, asset drops, rhythm cues).
  - Forwards the user intent as **plain-language context** to the Operator.
  - Batches or sequences user requests as needed.
- **Operator AI** (downstream):
  - Receives Creator context directly (no intermediate intent schema).
  - Produces strict **workloads** using the control-plane schema.
- The Operator can run on a **faster model tier** for low latency.
- The Creator can dispatch multiple Operator jobs in series or parallel to keep
  output flowing without interruption.

### 3.3) Schema artifacts
- Operator workload schema (v2 YAML): `schemas/operator-workload.schema.yaml`
- Control-plane schema (v2 YAML): `schemas/control-plane.schema.yaml`

### 3.5) Automation inputs (system‑provided)
- Asset drops are processed automatically into ASCII assets + tags.
- Asset registry exposes handles and ASCII JSON for Operator use.
- Rhythm inputs (tap/mic) are exposed as signals for Creator/Operator.

## 4) Continuous real‑time behavior
- The engine evolves continuously between AI updates.
- Randomness is part of the system and remains **steerable** by the AI.
- AI may provide **workloads** via the API that run until the next update.

## 5) Input artifacts (ingested media)
- Artifacts refer to **ingested inputs** that exist in the system (e.g., ASCII assets).
- These artifacts are merged into the field and can be blended or made opaque.
- Placement, motion, and blending are determined by the Operator workload.
- A folder of images can be ingested into ASCII assets by name.
- Assets are available as ASCII JSON representations addressable by handle.
- Assets are tagged using a **controlled vocabulary** and grouped into simple categories.
- Creator AI expresses **input‑artifact intent**; Operator AI resolves handles and embeds them.
- Operator AI places artifacts into workloads with chosen transitions
  (blend, fade, distort, drift, or opaque placement).

## 6) UI intent (AI‑authored, in‑field)
- All **generated UI** (banners, scrollers, input tools) is expressed as UI intent.
- UI is generated dynamically and rendered in‑field.
- UI input is **configuration intent**, interpreted by the AI into control changes.
- The system supports **dynamic hotkeys** and lightweight input bindings the AI can define.
- Interfaces can auto‑hide on inactivity and be removed on request.
- When UI is present, the field **may** stabilize:
  - core parameters can hold steady
  - peripheral motion can continue

## 7) Human input signals
- Mouse/keyboard input influences the field indirectly (signal, not literal cursor).
- Input influence decays gradually back to full dynamics.
- Input can be used by the AI to shape temporary interface behavior.

## 8) Control surface (systems‑level)
This is a **system‑level control surface**. The AI steers **generators and their interactions**,
not just aesthetic sliders.

1) **Field generators (families)**
   - Flow fields / curl noise / turbulence  
   - Reaction‑diffusion / cellular  
   - Fractal / domain‑warped fBm  
   - Wave interference / lattice fields  
   - Kaleidoscopic / symmetry transforms  
   - Glitch / quantization / discrete operators  

2) **Field interactions**
   - Blend, mask, feed‑forward (field A modulates field B)  
   - Warp (field A bends field B)  
   - Entrain (field A synchronizes phase of field B)  
   - Threshold / gate (field A enables field B)  

3) **Multi‑scale dynamics**
   - Macro structure scale  
   - Meso texture scale  
   - Micro grain scale  
   - Each scale can be driven by different generators  

4) **Glyph as a field**
   - Glyph density is dynamic  
   - Glyph selection follows local energy/curvature/entropy  
   - Glyph drift can differ from color drift  

5) **Color as a field**
   - Color is driven by interacting fields  
   - Palette is a mapping, not a static ramp  
   - Local hue discontinuities and gradients are allowed  

6) **Artifacts as events**
   - Events can spawn distortions, imprints, or short‑lived structure  
   - Artifacts can be blended or opaque and participate in field dynamics  

7) **Interaction coupling**
   - Input signals can influence generators or interaction weights  
   - Stabilization can target core generators while peripherals evolve  

## 8.1) Non‑repetition and diversity goals
- Favor **emergent behavior** with rich field interaction diversity.
- Allow slow drift in generator weights to keep the field alive between AI updates.

## 9) State representation for AI
- Current control values + last AI updates.
- Small visual metrics (motion energy, contrast, density).
- Compact enough for frequent AI steering.
- **Snapshots** capture full control state **with tags and a screenshot** for later recall.

## 9.1) Layered control mapping
- **Layer 0 (Base controls):** the raw control graph that drives the engine.
- **Layer 1 (Intent mapping):** AI maps user intent into a **small subset** of base controls.
- The layered approach exists to:
  - keep the AI interface compact and safe
  - reduce cognitive load
  - allow high‑level prompts without flooding the AI with every control

### Example A (two‑phase mapping)
1) AI queries the control index (what is available)
2) AI selects a subset and maps intent into values
3) AI sends a workload segment that runs until superseded

### Example B (temporary UI)
1) User: “Give me a banner lab”
2) AI creates UI intent and binds inputs to an intent mapping
3) Inputs update a small subset of base controls

## 10) Algorithm taxonomy (by visual intent)
- Algorithms are organized by **visual outcomes**.
- Core spectra include:
  - periodic ↔ organic
  - geometric ↔ fluid
  - symmetric ↔ chaotic
  - smooth ↔ turbulent
  - structured ↔ noisy
  - symbolic ↔ abstract

## 11) Target algorithm families (non‑exhaustive)
- Flow fields / curl noise / turbulence
- Reaction‑diffusion / cellular patterns
- Interference / wave lattices / moiré fields
- Kaleidoscopic / mirror / tessellation fields
- Fractal / fBm / domain‑warp fields
- Glitch / quantization / pixel‑sort‑like fields
- Image‑driven glyph mapping (optional assets)

## 12) VJ‑oriented use cases (examples, coverage‑driven)
- Kinetic title cards (text appears, fragments, dissolves)
- Call‑and‑response banners (scrolling phrases)
- Beat‑hit glyph bursts (symbol explosions on pulse)
- Reactive logo drift (floating symbol with breathing motion)
- Ghost‑trail portraits (fading faces moving across field)
- **Temporary AI‑authored interface**: “Build a banner lab for 30 seconds”
  - AI spawns a minimal in‑field UI, auto‑hides on inactivity.
  - User enters banner text and a motion vibe.
  - AI interprets inputs into multiple control changes (motion + glyph + color).
  - UI closes; field resumes full dynamics.
- **Ephemeral palette dial**
  - Prompt: “Give me a tiny color mixer for 20 seconds.”
  - AI invents a compact control surface (not prebuilt) to steer hue center/range.
  - Input maps to multiple color controls under the hood.
  - UI dissolves; changes persist in the field.
- **Motion steering panel**
  - Prompt: “Let me steer speed + turbulence with two inputs.”
  - AI generates a transient UI with two controls and a live preview cue.
  - AI maps them to multiple motion parameters.
  - UI auto‑hides after inactivity.
- **Glyph selection sandbox**
  - Prompt: “Give me a quick glyph texture picker for 15 seconds.”
  - AI shows a small text‑based picker; user types a glyph mood (e.g., ‘blocks’, ‘symbols’).
  - AI translates to density + glyph entropy + symbol bias changes.
- **Input‑artifact placement**
  - Prompt: “Use the dropped face and let it drift across the field.”
  - Operator resolves the asset handle and blends it with the field.
  - Motion/opacity are driven by the workload.
- **Interface‑as‑experiment**
  - Prompt: “Make a 3‑input experiment panel to explore this look.”
  - AI chooses three meaningful inputs for the current state and offers a short‑lived UI.
  - AI binds those inputs to multiple control changes with gentle smoothing.
- **Tap‑tempo morph**
  - User taps a tempo; AI maps pulse to generator weights and glyph density.
  - Rhythm can be toggled off to return to free dynamics.
- **Prompt‑to‑scene sketch**
  - Prompt: “C64 demoscene skyline with drifting scanlines.”
  - AI translates into field program + glyph mapping + palette mapping.
- **Artifact‑as‑texture**
  - Prompt: “Blend the dropped image into the field like porous fabric.”
  - Operator embeds the asset as a field texture with deformation and drift.
- **Multi‑focus layout**
  - Prompt: “Reserve a thin top lane for a ticker and keep the rest chaotic.”
  - AI defines regions and anchors to keep the ticker stable while the field evolves.
- **Micro‑UI for live text**
  - Prompt: “Give me a small text input for changing the headline.”
  - AI creates a small UI sprite, binds text submit to a text layer update.

## 13) Documentation as a first‑class deliverable
- AI tutorial on steering the engine.
- Creative heuristics (what combinations work well).
- VJ‑oriented use cases and example prompts.
- Guidance on **snapshot recall**.
- A `README.md` that explains the project intent and how to run the client locally.
- **Builder requirement:** Before authoring or updating docs, the builder must call
  `get_context` to learn the repo’s documentation taxonomy and authoring rules,
  and then place docs according to that taxonomy. This is part of Definition of Done.

## 13.1) Definition of Done (global)
- The project follows the global Definition of Done:
  `~/.teleclaude/docs/software-development/standards/definition-of-done.md`.
- Any reference to global docs must use the `~/.teleclaude/docs/` prefix so agents can resolve it reliably.
- This is required for all build phases and documentation updates.

## 14) Performance posture
- WebGL path targets smooth real‑time output on modern laptops.
- ASCII look is produced via grid sizing and glyph mapping.

## 15) Timing & sync input
- The engine can accept an external **clock/BPM** signal for rhythm‑aware motion.
- **Tap‑tempo** input is supported for manual rhythm entry.
- **Microphone rhythm detection** is supported for optional beat extraction.

## 16) Rhythm control (toggleable)
- Rhythm input can be **enabled or disabled**.
- When enabled, only selected behaviors are synchronized.
- When disabled, the AI resumes full control of temporal behavior.

## 17) UI intent schema (AI‑readable)
- AI uses a **layout‑oriented schema** to request temporary interfaces:
  - placement, width/height, alignment, padding
  - text content, glyph style, color intent
  - optional visual style tags (e.g., “C64”, “demoscene”, “Mario Kart”)
- UI schema remains **loose**, not a fixed component library.
