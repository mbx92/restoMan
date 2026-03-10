/**
 * A lightweight client-side ESC/POS command generator
 * Returns Uint8Array to be sent over Web Bluetooth
 */

export class EscPosBuilder {
  private buffer: number[] = []

  constructor() {
    this.init()
  }

  // Initialize printer
  init() {
    this.buffer.push(0x1B, 0x40)
    return this
  }

  // Write exact text as bytes (assumes CP437/ASCII for basic thermal)
  text(str: string) {
    for (let i = 0; i < str.length; i++) {
      let code = str.charCodeAt(i)
      // Basic ASCII map, if extended characters are needed, a proper codepage encoder is required
      if (code > 255) code = 63 // '?'
      this.buffer.push(code)
    }
    return this
  }

  // Print text + newline
  println(str: string = '') {
    this.text(str)
    this.buffer.push(0x0A) // LF
    return this
  }

  // Set alignment (0=Left, 1=Center, 2=Right)
  align(align: 'left' | 'center' | 'right') {
    const val = align === 'left' ? 0 : align === 'center' ? 1 : 2
    this.buffer.push(0x1B, 0x61, val)
    return this
  }

  // Toggle bold
  bold(on: boolean) {
    this.buffer.push(0x1B, 0x45, on ? 1 : 0)
    return this
  }

  // Set text size (1-8 for width/height multiplier)
  size(widthMulti: number, heightMulti: number) {
    const w = Math.max(1, Math.min(8, widthMulti)) - 1
    const h = Math.max(1, Math.min(8, heightMulti)) - 1
    const val = (w << 4) | h
    this.buffer.push(0x1D, 0x21, val)
    return this
  }

  // Reset text format
  normal() {
    this.bold(false)
    this.size(1, 1)
    return this
  }

  // Full paper cut
  cut() {
    // Feed a few lines before cut to ensure it clears the blade
    this.buffer.push(0x0A, 0x0A, 0x0A)
    this.buffer.push(0x1D, 0x56, 0x41, 0x00)
    return this
  }

  // Generate the final byte array
  build(): Uint8Array {
    return new Uint8Array(this.buffer)
  }
}
