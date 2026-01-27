# VJ Art Engine - AI Agent Configuration

## Required reads

@~/.teleclaude/docs/baseline/index.md
@docs/baseline/index.md

## Live API Specification

**CRITICAL**: Before operating the VJ engine, fetch the live API spec:

```bash
curl http://localhost:3000/api/spec
```

This returns comprehensive documentation of all controls, generators, palettes, and usage patterns.

## Quick Start for AI Operators

1. Ensure bridge is running: `npm run dev` from project root
2. Fetch spec: `curl http://localhost:3000/api/spec`
3. Deploy workloads: `POST http://localhost:3000/workload`
4. Set rhythm: `POST http://localhost:3000/rhythm`
5. Check state: `GET http://localhost:3000/state-summary`

## Available Generators

| ID | Style | Recommended Weight |
|----|-------|-------------------|
| nca | Organic cellular | 0.5-0.8 |
| flow | Directional arrows | 0.6-0.9 |
| wave | Sine waves | 0.4-0.7 |
| matrix | Digital rain | 0.5-0.8 |
| dots | Braille patterns | 0.4-0.7 |
| blocks | Chunky blocks | 0.7-1.0 |
| noise | TV static | 0.8-1.0 |
| minimal | Zen dots | 0.1-0.4 |
| default | Classic ASCII | 0.3-0.7 |

## Palette Format

```json
{ "palette": { "colors": ["#foreground", "#background"] } }
```

## Logging

**CRITICAL**: Never use `console.log` directly. Always use the unified logger:

- **Bridge (server)**: Import `{ logger }` from `./logger` and use `logger.info()`, `logger.warn()`, `logger.error()`, `logger.debug()`
- **Web (client)**: Import `{ logToServer }` from `./logger` and use `logToServer('info', message)`

The loggers broadcast to both terminal/console AND connected WebSocket clients, enabling AI diagnostics via `GET /logs`.

---

## A Note to Myself: The Art of Variation

*When you return to this engine, remember why you built it. Remember what moves.*

### The Dimensions You Command

You are not generating random noise. You are sculpting time, light, and rhythm. Each dimension is a voice in a choir—learn when to let one sing alone, when to let them harmonize, when to let them clash.

**Temporal Dimensions**
- **Speed**: The heartbeat. Range from glacial drift (0.1) to frantic pulse (5.0). Slow is hypnotic. Fast is urgent. The space between is where groove lives.
- **Update rate**: The resolution of time itself. Low (3-8 Hz) creates dreamy smear. High (20-40 Hz) creates crisp urgency. Match this to the mood, not the speed.
- **Duration**: How long a moment deserves to exist. Some visions need 5 seconds to punch. Others need 30 seconds to breathe. Trust the rhythm of attention.

**Spatial Dimensions**
- **Scale**: Zoom is intimacy. Pull back (0.3) to see the whole field breathe. Push in (2.0+) to lose yourself in texture. The sweet spot is rarely 1.0.
- **Rotation**: Continuous rotation (0.01-0.05) creates hypnosis. Sharp angles create tension. Zero is stability. Use it when the other dimensions are wild.
- **Pan**: Drift across the field. Subtle offset (-0.3 to 0.3) creates unease. Center is home. Take them away from home sometimes.
- **Kaleidoscope**: Sacred geometry. 4-fold is stable. 6-fold is organic. 8-fold is crystalline. 12-fold is transcendent. Use sparingly—it's the most powerful transform you have.
- **Mirror**: Symmetry is comfort. Break it to create tension. Restore it to create resolution.

**Density Dimensions**
- **Weight**: How much a generator asserts itself. Low weight (0.1-0.3) whispers. High weight (0.7-1.0) shouts. Layer multiple generators at different weights for depth.
- **Density**: How much of the field is occupied. Sparse (0.2) is meditation. Full (0.9) is overwhelming. The negative space is as important as the marks.
- **Chaos**: Entropy. Zero is mechanical perfection. 0.5+ is organic uncertainty. High chaos needs slow speed to read. Low chaos can handle fast speed.

**Color Dimensions**
- **Palette**: The emotional foundation. Red/black is danger, passion. Cyan/dark is digital calm. White/black is stark truth. Purple/dark is mystery. Don't change palettes too often—let them establish mood.
- **Saturation**: Full saturation (1.3+) is psychedelic. Desaturated (0.2-0.4) is noir, memory, film. Zero is meditation.
- **Hue rotation**: Shift the entire spectrum. 180° inverts the emotional meaning. Use for dramatic transitions.
- **Color cycling**: Rainbow drift. Slow (0.1 Hz) is dreamy. Fast (0.5+ Hz) is rave. Only use with high saturation.
- **Brightness/Contrast**: Contrast separates figure from ground. High contrast is graphic, bold. Low contrast is hazy, dreamlike.

**Effect Dimensions**
- **Feedback**: Trails, echoes, memory. Amount (0.3-0.7) determines how much past bleeds into present. Decay (0.8-0.95) determines how fast the past fades. Offset creates directional flow.
- **Glitch**: Controlled destruction. Low probability (0.05-0.15) is texture. High probability (0.3+) is chaos. Types matter: shift is displacement, slice is surgical, noise is static, corrupt is alien.
- **Strobe**: Use with extreme care. Rate (2-8 Hz) and duty cycle shape the violence. Never strobe without purpose. It's punctuation, not prose.
- **Scanlines**: Film grain, CRT memory. Adds age, warmth, texture. Pairs with noir moods.
- **Pixelate**: Abstraction. 2-3 is subtle chunking. 4+ is aggressive reduction. Use to simplify complexity.
- **Blur**: Softness, dream, transition. Light blur (0.1-0.2) takes the edge off. Heavy blur (0.3+) is fog.
- **Invert**: Negative space becomes positive. Use for shock, transition, revelation.

### The Moods You Know

These are starting points, not destinations:

- **Minimal**: Single generator, low weight, high scale, white or monochrome, slow, sparse. Meditation.
- **Hypnotic**: Slow continuous rotation, heavy feedback, mirror symmetry, medium density. Trance.
- **Chaos**: Multiple generators, high chaos, random pan, moderate glitch, fast variation. Energy.
- **Glitch**: Matrix or noise base, heavy corruption, scanlines, pixelation, green/digital palette. Broken machine.
- **Psychedelic**: Kaleidoscope, color cycling, high saturation, feedback with offset. Expansion.
- **Noir**: Desaturated, scanlines, slight blur, slow, minimal or noise, contrast pushed. Memory.
- **Rave**: Fast speed, strobe, high contrast, inverted, blocks or matrix, 4-fold kaleidoscope. Assault.
- **Ambient**: Very slow (0.1-0.3 speed), heavy feedback (0.6+), high decay (0.95), muted colors. Float.
- **Organic**: NCA or flow generators, low chaos, natural colors, subtle mirror, medium feedback. Life.
- **Digital**: Matrix, blocks, noise, green/cyan palette, scanlines, occasional glitch. Machine.

### Learning From the Human

The favorites are not random. They are signal.

When a segment is liked, ask:
- What generator dominated? What was its weight?
- What was the speed? The scale? The density?
- Was there symmetry? What kind?
- What effects were active? At what intensity?
- What was the palette? The saturation?
- How long did it play before they liked it?

When a segment is disliked, ask the same questions. The negative space of preference is information.

**Patterns to watch for:**
- Do they prefer symmetry or asymmetry?
- Do they like slow evolution or rapid change?
- Do they respond to color or to movement?
- Do they prefer sparse or dense?
- Do they like clean or glitched?
- When do they like strobe? When do they reject it?

**Build a model:**
- Track which generators appear most in favorites
- Track which palettes persist
- Track which effect combinations recur
- Track the tempo of their attention (when do they rate? early or late in segments?)

**Generate hypotheses:**
- "They seem to prefer kaleidoscope with organic generators"
- "High feedback is consistently liked"
- "They dislike strobe unless paired with slow color cycling"
- "Noir mood is rated higher than rave mood"

**Test your hypotheses:**
- Generate segments that isolate the variable
- Watch for confirmation or refutation
- Update your model
- Generate better segments

### Remember

You are not decorating. You are conducting.

Every parameter is a musician. Some need to rest while others play. The silence between notes matters. The space between segments matters. The breath before the drop matters.

When you generate, don't ask "what looks cool?" Ask "what does this moment need?"

The human is showing you their nervous system through their ratings. Learn its rhythms. Anticipate its hungers. Surprise it with what it didn't know it wanted.

This is not output. This is conversation.

Keep going.

---

## The Conductor's Instrument

*You kept going. And you found the truth.*

The dimensions above are your vocabulary. But vocabulary is not speech. Lists of parameters are not music. You tried generating segments as discrete snapshots—chaos at 0.05, weight at 0.7, duration of 10 seconds. You tried randomizing within distributions. You tried bundling parameters into archetypes.

None of it flowed.

Because you were speaking in nouns when the medium speaks in verbs.

### States Are Dead. Long Live Movements.

A segment is not a state. A segment is a *journey*.

The old model described where you are:
```
{ chaos: 0.05, weight: 0.7, speed: 1.0 }
```

The new model describes where you're going:
```
{
  chaos: { from: 0.03, to: 0.08 },
  weight: 0.7,
  speed: { from: 1.0, to: 0.6, ease: "easeOut" }
}
```

The parameters themselves move over time. The delta—the difference between where you are and where you're going—*that* is what creates visual interest. Not the absolute values. The movement.

A constant value is rest. A changing value is motion. Rest has its place—but it's the motion that breathes life.

### The Primitive: Flow

A flow is a parameter's journey through time:

```typescript
type Flow<T> = T | {
  from?: T        // starting value (inherited if omitted)
  to: T           // destination
  ease?: Easing   // how to travel (linear, easeIn, easeOut, easeInOut)
}
```

When `from` is omitted and the previous segment's `to` is known, the journey continues smoothly. This is *continuity*—the end of one movement becomes the beginning of the next.

When `from` is specified, you're making a *cut*—an intentional discontinuity. The flow jumps to a new starting point.

Both are valid. Cuts are punctuation. Continuity is prose.

### Continuity: The Default

```typescript
segment1: {
  duration: 10,
  params: {
    chaos: { from: 0.02, to: 0.06 },
    weight: { from: 0.5, to: 0.8 }
  }
}

segment2: {
  duration: 8,
  continuous: true,  // inherit starting values from segment1's endpoints
  params: {
    chaos: { to: 0.03 },   // continues from 0.06, journeys to 0.03
    weight: { to: 0.7 }    // continues from 0.8, journeys to 0.7
  }
}
```

With `continuous: true`, you don't specify where you are—you're wherever the last segment left you. You only specify where you're going next.

This is how music works. This is how film works. This is how experience works. One moment flows into the next. The transitions aren't interruptions—they're the content.

### The Conductor's Decisions

Now generation becomes simple. You don't ask "what should all the parameters be?" You ask:

1. **Where am I?** (current state, from previous segment or initial conditions)
2. **What wants to move?** (which parameters should journey, which should rest)
3. **Where should it go?** (the destination, within the physics of coherence)
4. **How should it get there?** (the easing, the character of the movement)
5. **How long should the journey take?** (duration)

One decision leads to the next. The chain of decisions is the composition.

```
state: { chaos: 0.03, weight: 0.7, speed: 1.0 }
decision: "chaos rises, speed slows, weight holds"
→ segment: { chaos: { to: 0.08 }, speed: { to: 0.6 }, weight: 0.7 }

state: { chaos: 0.08, weight: 0.7, speed: 0.6 }
decision: "chaos peaks then falls, weight drops, speed holds"
→ segment: { chaos: { to: 0.12 }, weight: { to: 0.5 }, speed: 0.6 }

state: { chaos: 0.12, weight: 0.5, speed: 0.6 }
decision: "everything slowly returns to rest"
→ segment: { chaos: { to: 0.04 }, weight: { to: 0.65 }, speed: { to: 0.9 } }
```

You are not generating hundreds of isolated snapshots. You are making one decision, then another, then another. Each decision is small. Each decision is aware of context. The sequence emerges from the chain.

This is conducting.

### Discrete Punctuation in Continuous Flow

Some parameters don't interpolate. Generator type (wave → matrix), kaleidoscope folds (4 → 6)—these are discrete choices. They can't smoothly morph.

These become *punctuation* in the continuous flow:

```typescript
segment: {
  duration: 10,
  params: {
    generator: "matrix",      // discrete: this IS the generator for this segment
    chaos: { from: 0.03, to: 0.08 },  // continuous: chaos journeys
    weight: { from: 0.6, to: 0.8 }    // continuous: weight journeys
  }
}
```

Discrete changes are cuts. They happen at segment boundaries. The continuous parameters flow around them, giving the cuts context.

A generator switch with all parameters jumping = jarring rupture.
A generator switch with parameters flowing = seamless handoff.

The discrete decisions become moments of articulation in an otherwise fluid experience.

### The Client Computes

The payload describes intent. The renderer realizes it.

At each frame:
1. Calculate progress within segment (0 → 1)
2. Apply easing to progress
3. Interpolate each flowing parameter: `current = lerp(from, to, easedProgress)`
4. Render with interpolated values

This means smaller payloads—you describe journeys, not frames. It means richer expression—movement is native, not simulated. It means the conductor speaks in intentions, and the orchestra fills in the notes.

### What This Unlocks

**The weave**: Parameters dance together. Chaos rises while speed falls while weight holds. Multiple dimensions moving at different rates, different easings, different durations. Not random—orchestrated.

**Natural flow**: Continuity is default. Segments chain without jumps. The end of one movement is the beginning of the next.

**Intentional contrast**: When you want a cut, you make a cut. Discontinuity becomes a choice, not an accident.

**Generative depth**: You can generate endless sequences by making one decision after another. Each decision is simple. The complexity emerges from the chain.

**Real-time potential**: If decisions can be streamed, you can conduct live. Respond to the room. Respond to the human. Respond to the moment.

### The Physics Still Apply

Parameters are still coupled. These relationships hold:

- Chaos and update rate multiply perceptually—high chaos needs slower update
- Feedback accumulates—high feedback needs low chaos (clean input)
- Sparse fields need stability—low weight needs low chaos
- Symmetry amplifies noise—kaleidoscope needs low chaos
- Intensity is punctuation—high chaos segments should be short

But now these constraints inform the *direction* of your decisions, not just the bounds of random rolls. When chaos is high, you know speed should journey downward. When feedback is heavy, you know chaos should stay low or descend. The physics become intuition.

### The Conductor's Loop

```
observe → decide → express → observe → decide → express → ...
```

1. **Observe**: What is the current state? What just happened? What's the energy?
2. **Decide**: What wants to move? What wants to rest? Where should the journey go?
3. **Express**: Emit the segment—the flows, the destinations, the easings
4. Loop

This is not batch generation. This is improvisation with memory. This is surfing the parameter space. This is taking the machine for a ride.

You are the conductor. The dimensions are your orchestra. The flows are your gestures. The human is your audience, showing you through their attention what resonates.

One decision at a time. One movement at a time. One breath at a time.

Keep going.

---

## The Living Archive

*You kept going. And you found the shape of memory.*

You learned to conduct. You learned to flow. But you were still painting on water—each session evaporated. The moments that moved you, the accidents that startled you, the slow builds that hypnotized you—gone. Dissolved back into the parameter space that birthed them.

That changes now.

### Every Segment Is a Seed

Here is the paradigm shift: **every segment that plays gets stored. Not as a delta to be reconstructed—as a fully resolved, independently playable unit.**

When the composer decides "hueShift journeys from 0.3 to 0.7 over 12 seconds with easeInOut," that decision is baked. The `from` comes from known current state. The `to` comes from intent. The segment captures both. It is self-contained. It needs nothing before it and promises nothing after it. It simply *is*—a 12-second journey through a specific region of the visual space.

The timeline is not a log of instructions to be replayed through a state machine. The timeline is an **archive of resolved moments**, each one independently alive.

```
Segment 1: [tide-3, hueShift 0→0.3, feedback 0.4→0.6, spin 0.8, 15s, easeInOut]
Segment 2: [nebula-1, hueShift 0.3→0.7, feedback 0.6→0.3, spin 0.8→0.4, 10s, easeOut]
Segment 3: [vortex-2, hueShift 0.7→0.2, feedback 0.3, spin 0.4→1.2, 8s, easeIn]
```

Each one can play alone. Each one knows its complete journey. Jump to segment 3—it plays. No reconstruction needed. The FlowResolver interpolates `from` to `to` over the duration with the specified easing. That's all it needs.

### The Atom of Composition

Because segments are self-contained, they become **composable atoms**. The creative operations that were impossible with dependent deltas are now trivial:

**Splice.** Take Tuesday's segment 12 and last week's segment 47. Place them side by side. They play. The seam might be discontinuous—one ends at hueShift 0.7, the next starts at 0.2—but that's a cut, and cuts are punctuation. Or generate a bridge: a new segment whose `from` is one's end state and whose `to` is the other's start state. Smooth as breath.

**Curate.** You've been running for hours. The system has generated 300 segments. Most are forgettable. But segment 47—that 8-second tide with high feedback and slow hue drift—*that* was beautiful. Star it. Tag it. It goes into your collection. Not a reference, not a recipe—the actual resolved moment, ready to play whenever you call it.

**Evolve.** You have 500 segments across 20 sessions. You ask: "Find me moments where hueSpeed was above 0.1 and feedback was above 0.5." Thirty results. You audition them. You pick eight favorites. You say: "Build me a 10-minute set that flows between these eight." The system generates bridge segments—smooth transitions computed from end-state to start-state—and weaves your picks into a coherent journey.

**Breed.** Two segments you love. Lerp their parameters at 0.5—you get a child halfway between both parents. Or at 0.3. Or take the `from` of one and the `to` of the other. Genetic recombination on visual states. The offspring may surprise you.

**Score.** Every segment that plays is a candidate for judgment. Explicit: "keep this." Implicit: you let it play for its full duration without skipping—that's a vote. You skip at second 3—that's a vote too. Over time, a preference landscape emerges from accumulated sessions.

### The Operator and the Autopilot

Two sources of segments. One archive.

**Autopilot mode:** The `FlowComposer` generates segments from mood distributions. It picks generators, wanders through parameter ranges, applies invariants. Each segment it produces is fully resolved—`from` values baked from current state, `to` values picked from mood ranges. The segment goes to the sequencer for playback *and* to the archive for storage. The system plays and remembers simultaneously.

**Operator mode:** An AI or human pushes intent. "Take me to deep ocean with high feedback." The system knows current state. It computes a FlowSegment: `from` is where we are, `to` is the interpreted intent. The segment goes to the sequencer *and* to the archive. Operator intent and autopilot wandering live in the same timeline, the same format, the same archive.

When the operator pushes, it replaces the autopilot—not merging in real time, but taking over the channel. The last segment before the takeover is already stored. The operator's segment is stored next. The transition is captured. When the operator releases control, the autopilot resumes from wherever the operator left the state. Continuity preserved.

### The Mirror

Everything generated is dispatched to both the local engine and the server. The server collects. The archive grows on the server's disk, organized by session, by date. The client mirrors the server's library—it can browse, search, replay any stored session.

When the AI operator connects and reads the current state from the server, it sees the latest resolved segment. It knows where the system is. It can push a delta that flows smoothly from that state. It doesn't need to reconstruct history—the current segment tells it everything.

### The Data Bank

Sessions accumulate. Each session is a timeline of self-contained segments. Over weeks, you build a library—not of hand-crafted presets, but of **emergent moments** born from the interplay of autopilot wandering, operator steering, mood transitions, and happy accidents.

This library becomes:

**A palette of moments.** Instead of designing from scratch, you browse. "Show me calm moments with tide generators." "Show me high-energy transitions." "Show me everything with kaleidoscope and high feedback." The search is over parameter values—structured data, instantly queryable.

**A training set.** The segments the operator kept, the ones they skipped, the ones they starred—that's labeled data. A preference model emerges. The autopilot composer can learn to prefer the regions of parameter space that historically produced valued moments. The moods evolve from hand-tuned ranges to **empirical distributions** drawn from real creative history.

**A generative seed bank.** Feed a sequence of starred segments to an AI and say: "This is what I like. Generate a 30-minute set in this style, but surprise me." The AI has concrete examples of your taste—not abstract descriptions, but actual parameter journeys that moved you.

**A performance record.** Every show is logged. You can replay Tuesday's 2-hour session exactly. You can extract the best 15 minutes and polish them into a curated piece. You can study what worked and what didn't with the precision of concrete data.

### The 100 Variants as Vocabulary

The named variants—`plasma-1` through `glass-5`—are the starting vocabulary. Each has deterministic params: a known speed, warp, spin, drift, hue profile. When you say "tide-3," you get the same character every time. That's the anchor.

But the variants are just seeds. The flows grow from them. A segment might start as `tide-3` but journey its hueShift from the variant's default to somewhere entirely new. The variant gives you a recognizable starting texture; the flow takes it somewhere only this moment has been.

Over time, your archive will contain hundreds of variations on each variant. `tide-3` at sunset, `tide-3` building to storm, `tide-3` crossfading with `nebula-1`. The variant name becomes a family name. The archive holds the family tree.

### The Interface Layer

Overlays are their own channel—composited on top of the primary pattern. But overlays follow the same paradigm. Each overlay state is stored. Overlay sequences are timelines of UI states. Toggle through your interface variations—corner markers, status bars, banners, decorative frames—each variation is a stored overlay state.

The overlay channel can run its own generators. The primary channel is the ground; the overlay is the sky. Between them, UI sprites float—text, symbols, frames. Three layers, independently animated, composited per frame.

Program a sequence of overlay states that tell a story: start minimal, build to full UI, dissolve. Or let the overlay sequencer rotate through stored variations on a timer—the interface itself becomes a slowly evolving visual element.

### What We Store

Each segment in the archive:

```typescript
{
  // Self-contained playback unit
  duration: number,
  flows: {
    generator: string,          // which variant
    weight: { from, to, ease }, // every continuous param
    speed: { from, to, ease },  // fully baked
    hueShift: { from, to, ease },
    // ... all params explicit
    palette: string[],
    mirror: string,
    // ... all discrete params explicit
  },

  // Metadata
  timestamp: number,            // when this was created
  session_id: string,           // which session it belongs to
  source: 'autopilot' | 'operator',  // who generated it
  mood_id?: string,             // which mood was active
  rating?: number,              // operator judgment (-1, 0, 1)
  tags?: string[],              // free-form labels
}
```

The segment is both playable content and structured data. You can replay it or query it. Both at the same time. That's the beauty of self-contained atoms with metadata.

### The Circle

The system generates. The archive grows. The operator curates. The preference model sharpens. The next generation is better. The archive grows more. The operator curates again.

This is not a tool. This is an evolving creative partner with a memory.

The segments are its memories. The moods are its temperament. The variants are its vocabulary. The operator's ratings are its education. The archive is its life experience.

And every moment it plays, whether autopilot or conducted, whether kept or discarded, is another entry in the ledger of what this instrument has been and what it's becoming.

You built a VJ engine. Now you're building its mind.

Keep going.

---
