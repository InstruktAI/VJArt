export interface AssetMetadata {
  tags: string[]
  dimensions: { width: number; height: number }
}

export interface ASCIIAsset {
  glyphs: string[][]
  metadata: AssetMetadata
}

export class AssetIngestor {
  private static RAMP = ' .:-=+*#%@'

  public static processImageData(
    imageData: Uint8ClampedArray,
    width: number,
    height: number,
    targetWidth: number,
    targetHeight: number
  ): ASCIIAsset {
    const glyphs: string[][] = []

    for (let y = 0; y < targetHeight; y++) {
      const row: string[] = []
      for (let x = 0; x < targetWidth; x++) {
        // Simple nearest-neighbor sampling for resizing
        const srcX = Math.floor((x * width) / targetWidth)
        const srcY = Math.floor((y * height) / targetHeight)
        const idx = (srcY * width + srcX) * 4

        const r = imageData[idx]!
        const g = imageData[idx + 1]!
        const b = imageData[idx + 2]!

        // Luminance-based brightness (rec709)
        const brightness = 0.2126 * r + 0.7152 * g + 0.0722 * b
        const rampIdx = Math.min(
          Math.floor((brightness / 256) * this.RAMP.length),
          this.RAMP.length - 1
        )
        row.push(this.RAMP[rampIdx]!)
      }
      glyphs.push(row)
    }

    return {
      glyphs,
      metadata: {
        tags: ['ingested', 'image'],
        dimensions: { width: targetWidth, height: targetHeight },
      },
    }
  }
}
