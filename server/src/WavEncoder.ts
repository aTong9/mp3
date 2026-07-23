/* ========================================
   WavEncoder - Node.js 端 WAV 文件编码器
   支持 16/24/32 位 PCM，输出 Buffer
   ======================================== */

import { writeFileSync } from 'fs'

export interface WavOptions {
  sampleRate: 44100 | 48000 | 96000
  bitDepth: 16 | 24 | 32
  numChannels: number
}

/**
 * 将多声道 PCM 数据编码为 WAV Buffer
 */
export function encodeWavBuffer(
  channels: Float32Array[],
  opts: WavOptions
): Buffer {
  const { sampleRate, bitDepth, numChannels } = opts
  const bytesPerSample = bitDepth / 8
  const totalSamples = channels[0].length
  const dataSize = totalSamples * numChannels * bytesPerSample
  const headerSize = 44
  const buffer = Buffer.alloc(headerSize + dataSize)

  // RIFF header
  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + dataSize, 4)
  buffer.write('WAVE', 8)
  // fmt chunk
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(bitDepth === 32 ? 3 : 1, 20) // 1=PCM, 3=IEEE float
  buffer.writeUInt16LE(numChannels, 22)
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(sampleRate * numChannels * bytesPerSample, 28)
  buffer.writeUInt16LE(numChannels * bytesPerSample, 32)
  buffer.writeUInt16LE(bitDepth, 34)
  // data chunk
  buffer.write('data', 36)
  buffer.writeUInt32LE(dataSize, 40)

  // PCM samples
  let off = 44
  if (bitDepth === 16) {
    for (let i = 0; i < totalSamples; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const s = clamp(channels[ch]?.[i] ?? 0)
        buffer.writeInt16LE(s < 0 ? s * 0x8000 : s * 0x7FFF, off)
        off += 2
      }
    }
  } else if (bitDepth === 24) {
    for (let i = 0; i < totalSamples; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const s = clamp(channels[ch]?.[i] ?? 0)
        const val = s < 0 ? s * 0x800000 : s * 0x7FFFFF
        buffer.writeUInt8(val & 0xFF, off)
        buffer.writeUInt8((val >> 8) & 0xFF, off + 1)
        buffer.writeUInt8((val >> 16) & 0xFF, off + 2)
        off += 3
      }
    }
  } else { // 32-bit float
    for (let i = 0; i < totalSamples; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        buffer.writeFloatLE(channels[ch]?.[i] ?? 0, off)
        off += 4
      }
    }
  }

  return buffer
}

function clamp(v: number): number {
  return Math.max(-1, Math.min(1, v))
}

/**
 * 写入 WAV 文件到磁盘
 */
export function writeWavFile(
  filepath: string,
  channels: Float32Array[],
  opts: WavOptions
): void {
  const buf = encodeWavBuffer(channels, opts)
  writeFileSync(filepath, buf)
  console.log(`  ✓ 写入: ${filepath} (${(buf.length / 1024 / 1024).toFixed(1)} MB)`)
}
