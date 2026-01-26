export type InputIntent =
  | 'GEN_WEIGHT_INC'
  | 'GEN_WEIGHT_DEC'
  | 'UI_TOGGLE'
  | 'RHYTHM_TAP'
  | 'CLEAR'

export interface InputBinding {
  key: string
  intent: InputIntent
}

export class InputDispatcher {
  private bindings: InputBinding[] = []

  constructor() {
    // Default bindings
    this.bindings = [
      { key: '+', intent: 'GEN_WEIGHT_INC' },
      { key: '-', intent: 'GEN_WEIGHT_DEC' },
      { key: 't', intent: 'RHYTHM_TAP' },
      { key: 'u', intent: 'UI_TOGGLE' },
      { key: 'c', intent: 'CLEAR' },
    ]
  }

  public dispatch(key: string): InputIntent | null {
    const binding = this.bindings.find(b => b.key === key)
    return binding ? binding.intent : null
  }

  public addBinding(binding: InputBinding) {
    this.bindings.push(binding)
  }
}
