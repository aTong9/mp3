/* ========================================
   AudioExporter - WAV 文件导出（浏览器端）
   用于实时预览导出，服务端批量导出见 server/
   ======================================== */

import type { ExportConfig } from '@/types'

/** PCM 数据 → WAV Blob */
export function encodeWav(
  samples: Float32Array[],
  sampleRate: number,
  numChannels: number,
  bitDepth: 16 | 24 | 32 = 16
): Blob {
  const bytesPerSample = bitDepth / 8
  const totalSamples = samples[0].length
  const dataSize = totalSamples * numChannels * bytesPerSample
  const headerSize = 44
  const buffer = new ArrayBuffer(headerSize + dataSize)
  const view = new DataView(buffer)

  // === WAV Header ===
  const writeStr = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i))
  }

  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true)           // PCM = 1
  view.setUint16(20, 1, true)            // format = 1 (PCM)
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * numChannels * bytesPerSample, true)
  view.setUint16(32, numChannels * bytesPerSample, true)
  view.setUint16(34, bitDepth, true)
  writeStr(36, 'data')
  view.setUint32(40, dataSize, true)

  // === PCM Data ===
  let off = 44
  if (bitDepth === 16) {
    for (let i = 0; i < totalSamples; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const s = Math.max(-1, Math.min(1, samples[ch]?.[i] ?? 0))
        view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
        off += 2
      }
    }
  } else if (bitDepth === 24) {
    for (let i = 0; i < totalSamples; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const s = Math.max(-1, Math.min(1, samples[ch]?.[i] ?? 0))
        const val = s < 0 ? s * 0x800000 : s * 0x7FFFFF
        view.setUint8(off, val & 0xFF)
        view.setUint8(off + 1, (val >> 8) & 0xFF)
        view.setUint8(off + 2, (val >> 16) & 0xFF)
        off += 3
      }
    }
  } else { // 32-bit float
    for (let i = 0; i < totalSamples; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const s = samples[ch]?.[i] ?? 0
        view.setFloat32(off, s, true)
        off += 4
      }
    }
    // 32-bit float needs different header
    view.setUint16(20, 3, true) // IEEE float
  }

  return new Blob([buffer], { type: 'audio/wav' })
}

/** 将 AudioBuffer 导出为 WAV Blob */
export function audioBufferToWav(buffer: AudioBuffer, bitDepth: 16 | 24 | 32 = 16): Blob {
  const channels: Float32Array[] = []
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    channels.push(buffer.getChannelData(ch))
  }
  return encodeWav(channels, buffer.sampleRate, buffer.numberOfChannels, bitDepth)
}

/** 触发浏览器下载 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** 生成一个纯噪声的 WAV 文件（用于导出测试） */
export function generateNoiseWav(durationSec: number, sampleRate: number = 44100): Blob {
  const len = durationSec * sampleRate
  const samples = new Float32Array(len)

  // 粉红噪声
  let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0
  for (let i = 0; i < len; i++) {
    const w = Math.random()*2-1
    b0=0.99886*b0+w*0.0555179; b1=0.99332*b1+w*0.0750759
    b2=0.96900*b2+w*0.1538520; b3=0.86650*b3+w*0.3104856
    b4=0.55000*b4+w*0.5329522; b5=-0.7616*b5-w*0.0168980
    samples[i]=(b0+b1+b2+b3+b4+b5+b6+w*0.5362)*0.11
    b6=w*0.115926
  }

  return encodeWav([samples], sampleRate, 1, 16)
}

/** 生成白噪声 WAV */
export function generateWhiteNoiseWav(durationSec: number, sampleRate: number = 44100): Blob {
  const len = durationSec * sampleRate
  const samples = new Float32Array(len)
  for (let i = 0; i < len; i++) samples[i] = Math.random()*2-1
  return encodeWav([samples], sampleRate, 1, 16)
}

/** 生成布朗噪声 WAV */
export function generateBrownNoiseWav(durationSec: number, sampleRate: number = 44100): Blob {
  const len = durationSec * sampleRate
  const samples = new Float32Array(len)
  let lo = 0
  for (let i = 0; i < len; i++) {
    const w = Math.random()*2-1
    samples[i] = (lo + 0.02*w) / 1.02
    lo = samples[i]
    samples[i] *= 3.5
  }
  return encodeWav([samples], sampleRate, 1, 16)
}
