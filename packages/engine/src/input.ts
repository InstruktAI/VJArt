export type InputIntent =
  | 'GEN_WEIGHT_INC'
  | 'GEN_WEIGHT_DEC'
  | 'UI_TOGGLE'
  | 'RHYTHM_TAP'
  | 'CLEAR'
  // Timeline control
  | 'SCRUB_LEFT'
  | 'SCRUB_RIGHT'
  | 'NEXT_SEGMENT'
  | 'PREV_SEGMENT'
  | 'PAUSE_TOGGLE'
  | 'SPEED_UP'
  | 'SPEED_DOWN'
  // Rating
  | 'THUMBS_UP'
  | 'THUMBS_DOWN'
  // Transforms
  | 'ROTATE_CW'
  | 'ROTATE_CCW'
  | 'ZOOM_IN'
  | 'ZOOM_OUT'
  | 'MIRROR_H'
  | 'MIRROR_V'
  // Effects
  | 'INVERT'
  | 'FREEZE'
  | 'GLITCH'
  // Favorites
  | 'SAVE_FAVORITE'
  | 'PLAY_FAVORITES'
  | 'RANDOM_MIX'

export interface InputBinding {
  key: string
  intent: InputIntent
}

export class InputDispatcher {
  private bindings: InputBinding[] = []

  constructor() {
    // Default bindings
    this.bindings = [
      // Weight controls
      { key: '+', intent: 'GEN_WEIGHT_INC' },
      { key: '=', intent: 'GEN_WEIGHT_INC' }, // For keyboards without numpad
      { key: '-', intent: 'GEN_WEIGHT_DEC' },
      { key: '_', intent: 'GEN_WEIGHT_DEC' },

      // Rhythm
      { key: 't', intent: 'RHYTHM_TAP' },
      { key: 'T', intent: 'RHYTHM_TAP' },
      { key: ' ', intent: 'RHYTHM_TAP' }, // Spacebar for tap

      // UI
      { key: 'u', intent: 'UI_TOGGLE' },
      { key: 'U', intent: 'UI_TOGGLE' },
      { key: 'c', intent: 'CLEAR' },
      { key: 'C', intent: 'CLEAR' },

      // Timeline control (arrows scrub, shift+arrows jump segments - handled in App)
      { key: 'ArrowRight', intent: 'SCRUB_RIGHT' },
      { key: 'ArrowLeft', intent: 'SCRUB_LEFT' },
      { key: ']', intent: 'SPEED_UP' },
      { key: '[', intent: 'SPEED_DOWN' },

      // Rating
      { key: 'ArrowUp', intent: 'THUMBS_UP' },
      { key: 'ArrowDown', intent: 'THUMBS_DOWN' },

      // Playback
      { key: 'p', intent: 'PAUSE_TOGGLE' },
      { key: 'P', intent: 'PAUSE_TOGGLE' },

      // Transforms
      { key: 'r', intent: 'ROTATE_CW' },
      { key: 'R', intent: 'ROTATE_CCW' },
      { key: 'z', intent: 'ZOOM_IN' },
      { key: 'Z', intent: 'ZOOM_OUT' },
      { key: 'h', intent: 'MIRROR_H' },
      { key: 'H', intent: 'MIRROR_H' },
      { key: 'v', intent: 'MIRROR_V' },
      { key: 'V', intent: 'MIRROR_V' },

      // Effects
      { key: 'i', intent: 'INVERT' },
      { key: 'I', intent: 'INVERT' },
      { key: 'f', intent: 'FREEZE' },
      { key: 'F', intent: 'FREEZE' },
      { key: 'g', intent: 'GLITCH' },
      { key: 'G', intent: 'GLITCH' },

      // Favorites
      { key: 's', intent: 'SAVE_FAVORITE' },
      { key: 'S', intent: 'SAVE_FAVORITE' },
      { key: 'l', intent: 'PLAY_FAVORITES' },
      { key: 'L', intent: 'PLAY_FAVORITES' },
      { key: 'x', intent: 'RANDOM_MIX' },
      { key: 'X', intent: 'RANDOM_MIX' },
    ]
  }

  public dispatch(key: string): InputIntent | null {
    const binding = this.bindings.find(b => b.key === key)
    return binding ? binding.intent : null
  }

  public addBinding(binding: InputBinding) {
    this.bindings.push(binding)
  }

  public getBindings(): InputBinding[] {
    return [...this.bindings]
  }
}
