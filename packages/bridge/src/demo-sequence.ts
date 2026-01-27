import { OperatorWorkload } from '@vj-art/engine'

/**
 * THE JOURNEY - A 10-minute VJ demonstration
 *
 * Act 1: The Machine Breathes (segments 1-12) ~2 min
 * Act 2: The Build (segments 13-30) ~3 min
 * Act 3: The Drop (segments 31-42) ~2 min
 * Act 4: The Return (segments 43-60) ~3 min
 */

export const demoSequence: OperatorWorkload = {
  segments: [
    // ============================================
    // ACT 1: THE MACHINE BREATHES
    // Emergence from void. Slow. Minimal. Hypnotic.
    // ============================================

    // 1. Darkness. Single dot pulses.
    {
      state: {
        field_program: {
          generators: [{ id: 'minimal', weight: 0.05, params: { speed: 0.3 } }],
          update_rate_hz: 4
        },
        palette: { colors: ['#333333', '#000000'] }
      },
      exit: { time_seconds: 8 },
      transition: { duration_seconds: 2 }
    },

    // 2. Dots emerge. Barely visible.
    {
      state: {
        field_program: {
          generators: [{ id: 'dots', weight: 0.1, params: { speed: 0.4, density: 0.3 } }],
          update_rate_hz: 5
        },
        palette: { colors: ['#444444', '#000000'] }
      },
      exit: { time_seconds: 7 },
      transition: { duration_seconds: 3 }
    },

    // 3. First color. Deep blue. Like opening eyes underwater.
    {
      state: {
        field_program: {
          generators: [{ id: 'dots', weight: 0.15, params: { speed: 0.5, density: 0.4 } }],
          update_rate_hz: 6
        },
        palette: { colors: ['#0044aa', '#000011'] }
      },
      exit: { time_seconds: 8 },
      transition: { duration_seconds: 4 }
    },

    // 4. Wave enters. Slow breathing rhythm.
    {
      state: {
        field_program: {
          generators: [
            { id: 'dots', weight: 0.1 },
            { id: 'wave', weight: 0.2, params: { speed: 0.3, scale: 2 } }
          ],
          update_rate_hz: 6
        },
        palette: { colors: ['#0066cc', '#000022'] }
      },
      modulators: [
        { target_path: 'generators[1].weight', source: 'sine', range: [0.1, 0.3], rate_hz: 0.1 }
      ],
      exit: { time_seconds: 10 },
      transition: { duration_seconds: 3 }
    },

    // 5. Cyan shift. Temperature rising.
    {
      state: {
        field_program: {
          generators: [
            { id: 'wave', weight: 0.25, params: { speed: 0.4, scale: 1.5 } }
          ],
          update_rate_hz: 7
        },
        palette: { colors: ['#00aacc', '#001122'] }
      },
      exit: { time_seconds: 8 },
      transition: { duration_seconds: 2 }
    },

    // 6. NCA awakens. Cellular life begins.
    {
      state: {
        field_program: {
          generators: [
            { id: 'wave', weight: 0.15 },
            { id: 'nca', weight: 0.2, params: { speed: 0.5 } }
          ],
          update_rate_hz: 8
        },
        palette: { colors: ['#00ccaa', '#002211'] }
      },
      exit: { time_seconds: 9 },
      transition: { duration_seconds: 3 }
    },

    // 7. Green emergence. Life.
    {
      state: {
        field_program: {
          generators: [{ id: 'nca', weight: 0.3, params: { speed: 0.6, chaos: 0.1 } }],
          update_rate_hz: 8
        },
        palette: { colors: ['#00ff66', '#001a0a'] }
      },
      exit: { time_seconds: 8 },
      transition: { duration_seconds: 2 }
    },

    // 8. Flow field introduces direction.
    {
      state: {
        field_program: {
          generators: [
            { id: 'nca', weight: 0.2 },
            { id: 'flow', weight: 0.2, params: { speed: 0.5, direction: 0 } }
          ],
          update_rate_hz: 9
        },
        palette: { colors: ['#44ff88', '#002a11'] }
      },
      modulators: [
        { target_path: 'generators[1].params.direction', source: 'sine', range: [0, Math.PI], rate_hz: 0.05 }
      ],
      exit: { time_seconds: 10 },
      transition: { duration_seconds: 2 }
    },

    // 9. Yellow warmth enters.
    {
      state: {
        field_program: {
          generators: [{ id: 'flow', weight: 0.35, params: { speed: 0.6 } }],
          update_rate_hz: 9
        },
        palette: { colors: ['#aaff00', '#111a00'] }
      },
      exit: { time_seconds: 7 },
      transition: { duration_seconds: 3 }
    },

    // 10. Feedback trails begin. Memory.
    {
      state: {
        field_program: {
          generators: [{ id: 'flow', weight: 0.4, params: { speed: 0.7 } }],
          update_rate_hz: 10,
          post_processing: {
            feedback: { amount: 0.3, decay: 0.9, offset: [1, 0] }
          }
        },
        palette: { colors: ['#ffcc00', '#1a1100'] }
      },
      exit: { time_seconds: 8 },
      transition: { duration_seconds: 2 }
    },

    // 11. Orange. Heat building.
    {
      state: {
        field_program: {
          generators: [
            { id: 'flow', weight: 0.3 },
            { id: 'wave', weight: 0.2, params: { speed: 0.8 } }
          ],
          update_rate_hz: 10,
          post_processing: {
            feedback: { amount: 0.4, decay: 0.85 }
          }
        },
        palette: { colors: ['#ff8800', '#1a0a00'] }
      },
      exit: { time_seconds: 8 },
      transition: { duration_seconds: 2 }
    },

    // 12. Red hints. Danger approaching.
    {
      state: {
        field_program: {
          generators: [
            { id: 'wave', weight: 0.35, params: { speed: 0.9, scale: 1.2 } }
          ],
          update_rate_hz: 11,
          post_processing: {
            feedback: { amount: 0.5, decay: 0.8 }
          }
        },
        palette: { colors: ['#ff4400', '#1a0500'] }
      },
      exit: { time_seconds: 7 },
      transition: { duration_seconds: 1.5 }
    },

    // ============================================
    // ACT 2: THE BUILD
    // Energy rising. Layers. Complexity. Anticipation.
    // ============================================

    // 13. Multi-generator blend begins.
    {
      state: {
        field_program: {
          generators: [
            { id: 'wave', weight: 0.3 },
            { id: 'flow', weight: 0.25 },
            { id: 'nca', weight: 0.2 }
          ],
          update_rate_hz: 12
        },
        palette: { colors: ['#ff3300', '#110000'] }
      },
      exit: { time_seconds: 8 },
      transition: { duration_seconds: 1.5 }
    },

    // 14. Rotation begins. World tilts.
    {
      state: {
        field_program: {
          generators: [
            { id: 'flow', weight: 0.4, params: { speed: 1.0 } },
            { id: 'nca', weight: 0.25 }
          ],
          update_rate_hz: 12,
          transforms: { rotation: 0.1 }
        },
        palette: { colors: ['#ff0044', '#110005'] }
      },
      modulators: [
        { target_path: 'transforms.rotation', source: 'sine', range: [0, 0.3], rate_hz: 0.1 }
      ],
      exit: { time_seconds: 9 },
      transition: { duration_seconds: 1 }
    },

    // 15. Magenta shift. Psychedelic.
    {
      state: {
        field_program: {
          generators: [
            { id: 'nca', weight: 0.45, params: { speed: 1.1, chaos: 0.15 } }
          ],
          update_rate_hz: 13,
          transforms: { rotation: 0.15 }
        },
        palette: { colors: ['#ff00aa', '#110011'] }
      },
      exit: { time_seconds: 7 },
      transition: { duration_seconds: 1.5 }
    },

    // 16. Purple depth.
    {
      state: {
        field_program: {
          generators: [
            { id: 'nca', weight: 0.35 },
            { id: 'dots', weight: 0.25, params: { density: 0.6 } }
          ],
          update_rate_hz: 13,
          transforms: { scale: 1.1 }
        },
        palette: { colors: ['#aa00ff', '#0a0011'] }
      },
      exit: { time_seconds: 8 },
      transition: { duration_seconds: 1 }
    },

    // 17. Kaleidoscope begins. Reality fragments.
    {
      state: {
        field_program: {
          generators: [
            { id: 'flow', weight: 0.4, params: { speed: 1.2 } }
          ],
          update_rate_hz: 14,
          transforms: {
            mirror: { kaleidoscope: 4 }
          }
        },
        palette: { colors: ['#8800ff', '#050011'] }
      },
      exit: { time_seconds: 8 },
      transition: { duration_seconds: 2 }
    },

    // 18. 6-fold symmetry. Deeper.
    {
      state: {
        field_program: {
          generators: [
            { id: 'flow', weight: 0.35 },
            { id: 'wave', weight: 0.25, params: { speed: 1.3 } }
          ],
          update_rate_hz: 14,
          transforms: {
            mirror: { kaleidoscope: 6 },
            rotation: 0.2
          }
        },
        palette: { colors: ['#6600ff', '#000511'] }
      },
      modulators: [
        { target_path: 'transforms.rotation', source: 'saw', range: [0, 0.4], rate_hz: 0.08 }
      ],
      exit: { time_seconds: 9 },
      transition: { duration_seconds: 1 }
    },

    // 19. Speed increase. Pulse quickens.
    {
      state: {
        field_program: {
          generators: [
            { id: 'wave', weight: 0.5, params: { speed: 1.5, scale: 0.8 } }
          ],
          update_rate_hz: 16,
          transforms: {
            mirror: { kaleidoscope: 6 }
          },
          timing: { tempo_mult: 1.2 }
        },
        palette: { colors: ['#4400ff', '#000311'] }
      },
      exit: { time_seconds: 6 },
      transition: { duration_seconds: 1 }
    },

    // 20. Blue electric.
    {
      state: {
        field_program: {
          generators: [
            { id: 'matrix', weight: 0.4, params: { speed: 1.5 } },
            { id: 'wave', weight: 0.2 }
          ],
          update_rate_hz: 16,
          transforms: {
            mirror: { kaleidoscope: 4 }
          }
        },
        palette: { colors: ['#0066ff', '#000511'] }
      },
      exit: { time_seconds: 7 },
      transition: { duration_seconds: 1 }
    },

    // 21. Matrix rain intensifies.
    {
      state: {
        field_program: {
          generators: [
            { id: 'matrix', weight: 0.55, params: { speed: 1.8 } }
          ],
          update_rate_hz: 18
        },
        palette: { colors: ['#00ff44', '#001105'] }
      },
      exit: { time_seconds: 6 },
      transition: { duration_seconds: 1 }
    },

    // 22. Glitch hints. System stress.
    {
      state: {
        field_program: {
          generators: [
            { id: 'matrix', weight: 0.5 },
            { id: 'noise', weight: 0.15 }
          ],
          update_rate_hz: 18,
          random: {
            glitch: { probability: 0.05, intensity: 0.3, types: ['shift'] }
          }
        },
        palette: { colors: ['#00ff88', '#001108'] }
      },
      exit: { time_seconds: 7 },
      transition: { duration_seconds: 0.8 }
    },

    // 23. Cyan surge.
    {
      state: {
        field_program: {
          generators: [
            { id: 'matrix', weight: 0.4 },
            { id: 'flow', weight: 0.3, params: { speed: 2.0 } }
          ],
          update_rate_hz: 20,
          random: {
            glitch: { probability: 0.08, intensity: 0.4, types: ['shift', 'slice'] }
          }
        },
        palette: { colors: ['#00ffcc', '#001111'] }
      },
      exit: { time_seconds: 6 },
      transition: { duration_seconds: 0.8 }
    },

    // 24. White hot. Energy peak approaching.
    {
      state: {
        field_program: {
          generators: [
            { id: 'flow', weight: 0.5, params: { speed: 2.2 } },
            { id: 'noise', weight: 0.2 }
          ],
          update_rate_hz: 20,
          color_controls: { brightness: 0.1, contrast: 1.2 }
        },
        palette: { colors: ['#aaffff', '#001515'] }
      },
      exit: { time_seconds: 5 },
      transition: { duration_seconds: 0.6 }
    },

    // 25. Feedback intensifies. Trails everywhere.
    {
      state: {
        field_program: {
          generators: [
            { id: 'flow', weight: 0.55, params: { speed: 2.5 } }
          ],
          update_rate_hz: 22,
          post_processing: {
            feedback: { amount: 0.6, decay: 0.75, offset: [2, 1] }
          }
        },
        palette: { colors: ['#ffffff', '#111111'] }
      },
      exit: { time_seconds: 5 },
      transition: { duration_seconds: 0.5 }
    },

    // 26. Pink flash.
    {
      state: {
        field_program: {
          generators: [
            { id: 'blocks', weight: 0.45, params: { speed: 2.0 } },
            { id: 'flow', weight: 0.25 }
          ],
          update_rate_hz: 22
        },
        palette: { colors: ['#ff0088', '#110008'] }
      },
      exit: { time_seconds: 5 },
      transition: { duration_seconds: 0.5 }
    },

    // 27. Blocks emerge. Heavy.
    {
      state: {
        field_program: {
          generators: [
            { id: 'blocks', weight: 0.6, params: { speed: 2.2 } }
          ],
          update_rate_hz: 22,
          transforms: { scale: 1.2 }
        },
        palette: { colors: ['#ff0066', '#110006'] }
      },
      exit: { time_seconds: 5 },
      transition: { duration_seconds: 0.5 }
    },

    // 28. Red alert.
    {
      state: {
        field_program: {
          generators: [
            { id: 'blocks', weight: 0.7, params: { speed: 2.5 } },
            { id: 'noise', weight: 0.15 }
          ],
          update_rate_hz: 24,
          random: {
            glitch: { probability: 0.12, intensity: 0.5, types: ['shift', 'slice', 'corrupt'] }
          }
        },
        palette: { colors: ['#ff0033', '#110003'] }
      },
      exit: { time_seconds: 4 },
      transition: { duration_seconds: 0.4 }
    },

    // 29. Maximum tension.
    {
      state: {
        field_program: {
          generators: [
            { id: 'blocks', weight: 0.75 },
            { id: 'noise', weight: 0.2 }
          ],
          update_rate_hz: 24,
          random: {
            glitch: { probability: 0.15, intensity: 0.6, types: ['shift', 'slice', 'corrupt'] },
            chaos: 0.3
          }
        },
        palette: { colors: ['#ff0000', '#110000'] }
      },
      exit: { time_seconds: 4 },
      transition: { duration_seconds: 0.3 }
    },

    // 30. The edge. Breath before the drop.
    {
      state: {
        field_program: {
          generators: [
            { id: 'blocks', weight: 0.8 },
            { id: 'noise', weight: 0.25 }
          ],
          update_rate_hz: 24,
          random: {
            glitch: { probability: 0.2, intensity: 0.7, types: ['shift', 'slice', 'corrupt', 'noise'] }
          },
          post_processing: {
            scanlines: { density: 0.5, intensity: 0.4 }
          }
        },
        palette: { colors: ['#ff0000', '#000000'] }
      },
      exit: { time_seconds: 3 },
      transition: { duration_seconds: 0.2 }
    },

    // ============================================
    // ACT 3: THE DROP
    // Peak intensity. Chaos. Strobe. Inversion.
    // ============================================

    // 31. THE DROP. Full chaos.
    {
      state: {
        field_program: {
          generators: [
            { id: 'blocks', weight: 0.9 },
            { id: 'noise', weight: 0.4 }
          ],
          update_rate_hz: 24,
          random: {
            glitch: { probability: 0.3, intensity: 0.9, types: ['shift', 'slice', 'corrupt', 'noise'] },
            chaos: 0.5
          },
          post_processing: {
            strobe: { rate_hz: 8, duty: 0.3 }
          }
        },
        palette: { colors: ['#ffffff', '#000000'] }
      },
      exit: { time_seconds: 4 },
      transition: { duration_seconds: 0.1 }
    },

    // 32. INVERT. World flips.
    {
      state: {
        field_program: {
          generators: [
            { id: 'blocks', weight: 0.85 },
            { id: 'noise', weight: 0.35 }
          ],
          update_rate_hz: 24,
          post_processing: {
            invert: true,
            strobe: { rate_hz: 6, duty: 0.4 }
          },
          random: {
            glitch: { probability: 0.25, intensity: 0.8, types: ['shift', 'corrupt'] }
          }
        },
        palette: { colors: ['#000000', '#ffffff'] }
      },
      exit: { time_seconds: 3 },
      transition: { duration_seconds: 0.1 }
    },

    // 33. Back. Strobe continues.
    {
      state: {
        field_program: {
          generators: [
            { id: 'blocks', weight: 0.8 },
            { id: 'flow', weight: 0.3, params: { speed: 3.0 } }
          ],
          update_rate_hz: 24,
          post_processing: {
            strobe: { rate_hz: 10, duty: 0.25 }
          }
        },
        palette: { colors: ['#ff00ff', '#000000'] }
      },
      exit: { time_seconds: 3 },
      transition: { duration_seconds: 0.1 }
    },

    // 34. Kaleidoscope chaos.
    {
      state: {
        field_program: {
          generators: [
            { id: 'flow', weight: 0.7, params: { speed: 3.5 } },
            { id: 'noise', weight: 0.3 }
          ],
          update_rate_hz: 24,
          transforms: {
            mirror: { kaleidoscope: 8 },
            rotation: 0.5
          },
          post_processing: {
            strobe: { rate_hz: 6, duty: 0.3 }
          }
        },
        palette: { colors: ['#00ffff', '#000000'] }
      },
      modulators: [
        { target_path: 'transforms.rotation', source: 'saw', range: [0, Math.PI], rate_hz: 0.5 }
      ],
      exit: { time_seconds: 4 },
      transition: { duration_seconds: 0.2 }
    },

    // 35. Yellow explosion.
    {
      state: {
        field_program: {
          generators: [
            { id: 'blocks', weight: 0.75 },
            { id: 'wave', weight: 0.35, params: { speed: 3.0 } }
          ],
          update_rate_hz: 22,
          transforms: {
            scale: 1.5,
            mirror: { kaleidoscope: 6 }
          }
        },
        palette: { colors: ['#ffff00', '#000000'] }
      },
      exit: { time_seconds: 3 },
      transition: { duration_seconds: 0.2 }
    },

    // 36. Green surge.
    {
      state: {
        field_program: {
          generators: [
            { id: 'matrix', weight: 0.7, params: { speed: 3.0 } },
            { id: 'blocks', weight: 0.3 }
          ],
          update_rate_hz: 22,
          random: {
            glitch: { probability: 0.2, intensity: 0.6, types: ['slice', 'shift'] }
          }
        },
        palette: { colors: ['#00ff00', '#000000'] }
      },
      exit: { time_seconds: 3 },
      transition: { duration_seconds: 0.2 }
    },

    // 37. Orange heat.
    {
      state: {
        field_program: {
          generators: [
            { id: 'flow', weight: 0.65, params: { speed: 2.8 } },
            { id: 'blocks', weight: 0.25 }
          ],
          update_rate_hz: 20,
          post_processing: {
            feedback: { amount: 0.5, decay: 0.7 }
          }
        },
        palette: { colors: ['#ff6600', '#000000'] }
      },
      exit: { time_seconds: 4 },
      transition: { duration_seconds: 0.3 }
    },

    // 38. Pink pulse.
    {
      state: {
        field_program: {
          generators: [
            { id: 'wave', weight: 0.6, params: { speed: 2.5 } },
            { id: 'dots', weight: 0.3 }
          ],
          update_rate_hz: 18,
          transforms: {
            mirror: { horizontal: true, vertical: true }
          }
        },
        palette: { colors: ['#ff0099', '#110011'] }
      },
      exit: { time_seconds: 4 },
      transition: { duration_seconds: 0.4 }
    },

    // 39. Blue cool begins.
    {
      state: {
        field_program: {
          generators: [
            { id: 'flow', weight: 0.55, params: { speed: 2.2 } }
          ],
          update_rate_hz: 16,
          post_processing: {
            feedback: { amount: 0.4, decay: 0.8 }
          }
        },
        palette: { colors: ['#0088ff', '#000511'] }
      },
      exit: { time_seconds: 5 },
      transition: { duration_seconds: 0.5 }
    },

    // 40. Purple descent.
    {
      state: {
        field_program: {
          generators: [
            { id: 'wave', weight: 0.5, params: { speed: 2.0 } },
            { id: 'nca', weight: 0.2 }
          ],
          update_rate_hz: 14
        },
        palette: { colors: ['#8800ff', '#050011'] }
      },
      exit: { time_seconds: 5 },
      transition: { duration_seconds: 0.8 }
    },

    // 41. Cooling continues.
    {
      state: {
        field_program: {
          generators: [
            { id: 'nca', weight: 0.45, params: { speed: 1.8 } }
          ],
          update_rate_hz: 12
        },
        palette: { colors: ['#6644ff', '#030011'] }
      },
      exit: { time_seconds: 6 },
      transition: { duration_seconds: 1 }
    },

    // 42. Deep breath.
    {
      state: {
        field_program: {
          generators: [
            { id: 'nca', weight: 0.4, params: { speed: 1.5, chaos: 0.1 } }
          ],
          update_rate_hz: 10
        },
        palette: { colors: ['#4422ff', '#020011'] }
      },
      exit: { time_seconds: 7 },
      transition: { duration_seconds: 1.5 }
    },

    // ============================================
    // ACT 4: THE RETURN
    // Cooling. Reflection. Space. Resolution.
    // ============================================

    // 43. Blue meditation.
    {
      state: {
        field_program: {
          generators: [
            { id: 'wave', weight: 0.35, params: { speed: 1.2, scale: 1.5 } }
          ],
          update_rate_hz: 9,
          post_processing: {
            feedback: { amount: 0.3, decay: 0.88 }
          }
        },
        palette: { colors: ['#2244ff', '#010022'] }
      },
      exit: { time_seconds: 8 },
      transition: { duration_seconds: 2 }
    },

    // 44. Cyan peace.
    {
      state: {
        field_program: {
          generators: [
            { id: 'wave', weight: 0.3, params: { speed: 1.0 } },
            { id: 'dots', weight: 0.15, params: { density: 0.4 } }
          ],
          update_rate_hz: 8
        },
        palette: { colors: ['#00aacc', '#001115'] }
      },
      exit: { time_seconds: 9 },
      transition: { duration_seconds: 2 }
    },

    // 45. Teal drift.
    {
      state: {
        field_program: {
          generators: [
            { id: 'flow', weight: 0.3, params: { speed: 0.8, direction: Math.PI/4 } }
          ],
          update_rate_hz: 8
        },
        palette: { colors: ['#00ccaa', '#001511'] }
      },
      modulators: [
        { target_path: 'generators[0].params.direction', source: 'sine', range: [0, Math.PI/2], rate_hz: 0.03 }
      ],
      exit: { time_seconds: 10 },
      transition: { duration_seconds: 2.5 }
    },

    // 46. Green memory.
    {
      state: {
        field_program: {
          generators: [
            { id: 'nca', weight: 0.25, params: { speed: 0.7 } }
          ],
          update_rate_hz: 7,
          post_processing: {
            feedback: { amount: 0.25, decay: 0.9 }
          }
        },
        palette: { colors: ['#00ff88', '#001508'] }
      },
      exit: { time_seconds: 10 },
      transition: { duration_seconds: 3 }
    },

    // 47. Lime whisper.
    {
      state: {
        field_program: {
          generators: [
            { id: 'dots', weight: 0.2, params: { speed: 0.6, density: 0.35 } }
          ],
          update_rate_hz: 6
        },
        palette: { colors: ['#88ff00', '#0a1500'] }
      },
      exit: { time_seconds: 9 },
      transition: { duration_seconds: 3 }
    },

    // 48. Yellow warmth returns.
    {
      state: {
        field_program: {
          generators: [
            { id: 'wave', weight: 0.2, params: { speed: 0.5, scale: 2 } }
          ],
          update_rate_hz: 6
        },
        palette: { colors: ['#ccff00', '#111500'] }
      },
      exit: { time_seconds: 10 },
      transition: { duration_seconds: 3 }
    },

    // 49. Gold glow.
    {
      state: {
        field_program: {
          generators: [
            { id: 'minimal', weight: 0.2, params: { speed: 0.4 } },
            { id: 'wave', weight: 0.15 }
          ],
          update_rate_hz: 5
        },
        palette: { colors: ['#ffcc00', '#151100'] }
      },
      exit: { time_seconds: 10 },
      transition: { duration_seconds: 3.5 }
    },

    // 50. Amber sunset.
    {
      state: {
        field_program: {
          generators: [
            { id: 'flow', weight: 0.2, params: { speed: 0.4 } }
          ],
          update_rate_hz: 5
        },
        palette: { colors: ['#ff9900', '#110800'] }
      },
      exit: { time_seconds: 11 },
      transition: { duration_seconds: 4 }
    },

    // 51. Coral horizon.
    {
      state: {
        field_program: {
          generators: [
            { id: 'wave', weight: 0.18, params: { speed: 0.35, scale: 2.5 } }
          ],
          update_rate_hz: 5
        },
        palette: { colors: ['#ff6644', '#100500'] }
      },
      exit: { time_seconds: 12 },
      transition: { duration_seconds: 4 }
    },

    // 52. Rose dusk.
    {
      state: {
        field_program: {
          generators: [
            { id: 'dots', weight: 0.15, params: { speed: 0.3, density: 0.3 } }
          ],
          update_rate_hz: 4
        },
        palette: { colors: ['#ff4466', '#0a0005'] }
      },
      exit: { time_seconds: 12 },
      transition: { duration_seconds: 4.5 }
    },

    // 53. Violet twilight.
    {
      state: {
        field_program: {
          generators: [
            { id: 'minimal', weight: 0.12, params: { speed: 0.25 } }
          ],
          update_rate_hz: 4
        },
        palette: { colors: ['#aa44ff', '#050008'] }
      },
      exit: { time_seconds: 13 },
      transition: { duration_seconds: 5 }
    },

    // 54. Indigo night.
    {
      state: {
        field_program: {
          generators: [
            { id: 'dots', weight: 0.1, params: { speed: 0.2, density: 0.25 } }
          ],
          update_rate_hz: 4
        },
        palette: { colors: ['#4444aa', '#030008'] }
      },
      exit: { time_seconds: 14 },
      transition: { duration_seconds: 5 }
    },

    // 55. Deep blue.
    {
      state: {
        field_program: {
          generators: [
            { id: 'minimal', weight: 0.08, params: { speed: 0.15 } }
          ],
          update_rate_hz: 3
        },
        palette: { colors: ['#2244aa', '#020008'] }
      },
      exit: { time_seconds: 14 },
      transition: { duration_seconds: 5 }
    },

    // 56. Starfield.
    {
      state: {
        field_program: {
          generators: [
            { id: 'dots', weight: 0.06, params: { speed: 0.1, density: 0.15 } }
          ],
          update_rate_hz: 3
        },
        palette: { colors: ['#aaaaff', '#010008'] }
      },
      exit: { time_seconds: 15 },
      transition: { duration_seconds: 6 }
    },

    // 57. Fading stars.
    {
      state: {
        field_program: {
          generators: [
            { id: 'minimal', weight: 0.04, params: { speed: 0.08 } }
          ],
          update_rate_hz: 3
        },
        palette: { colors: ['#666688', '#000005'] }
      },
      exit: { time_seconds: 15 },
      transition: { duration_seconds: 6 }
    },

    // 58. Almost nothing.
    {
      state: {
        field_program: {
          generators: [
            { id: 'dots', weight: 0.03, params: { speed: 0.05, density: 0.1 } }
          ],
          update_rate_hz: 2
        },
        palette: { colors: ['#444455', '#000003'] }
      },
      exit: { time_seconds: 16 },
      transition: { duration_seconds: 7 }
    },

    // 59. Breath.
    {
      state: {
        field_program: {
          generators: [
            { id: 'minimal', weight: 0.02, params: { speed: 0.03 } }
          ],
          update_rate_hz: 2
        },
        palette: { colors: ['#333344', '#000002'] }
      },
      exit: { time_seconds: 18 },
      transition: { duration_seconds: 8 }
    },

    // 60. Void. The cycle complete.
    {
      state: {
        field_program: {
          generators: [
            { id: 'minimal', weight: 0.01, params: { speed: 0.02 } }
          ],
          update_rate_hz: 2
        },
        palette: { colors: ['#222233', '#000001'] }
      },
      exit: { time_seconds: 20 },
      transition: { duration_seconds: 10 }
    }
  ]
}
