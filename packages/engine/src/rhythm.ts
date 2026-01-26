export interface BeatEvent {
  timestamp: number
  tempo: number
  isPeak: boolean
}

export class RhythmDetector {
  private lastBeatTime: number = 0
  private beatIntervals: number[] = []
  private currentTempo: number = 120

  public tap(): BeatEvent {
    const now = Date.now()
    if (this.lastBeatTime !== 0) {
      const interval = now - this.lastBeatTime
      if (interval < 2000) {
        // Only consider intervals < 2s (30bpm+)
        this.beatIntervals.push(interval)
        if (this.beatIntervals.length > 8) this.beatIntervals.shift()

        const avgInterval =
          this.beatIntervals.reduce((a, b) => a + b, 0) / this.beatIntervals.length
        this.currentTempo = 60000 / avgInterval
      } else {
        this.beatIntervals = []
      }
    }
    this.lastBeatTime = now
    return {
      timestamp: now,
      tempo: this.currentTempo,
      isPeak: true,
    }
  }

  public processAudioStream(analyzer: AnalyserNode): BeatEvent | null {
    const bufferLength = analyzer.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    analyzer.getByteFrequencyData(dataArray)

    // Simple peak detection in the low-end (bass)
    const bassRange = Math.floor(bufferLength * 0.1)
    let sum = 0
    for (let i = 0; i < bassRange; i++) {
      sum += dataArray[i]!
    }
    const average = sum / bassRange

    // This is a very crude beat detection stub
    // In a real implementation, we would use a sliding window and threshold
    if (average > 200) {
      const now = Date.now()
      if (now - this.lastBeatTime > 300) {
        // Debounce
        this.lastBeatTime = now
        return {
          timestamp: now,
          tempo: this.currentTempo,
          isPeak: true,
        }
      }
    }

    return null
  }

  public getTempo(): number {
    return this.currentTempo
  }
}
