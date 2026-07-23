/* ========================================
   AudioEngine - Web Audio API 声音引擎核心
   ======================================== */

import type { SoundController, SoundType } from '@/types'
import { generateNoiseBuffers, type NoiseBufferSet } from './NoiseBuffers'
import { makeGen } from './generators'

export class AudioEngine {
  ctx: AudioContext | null = null
  masterGain: GainNode | null = null
  activeSounds = new Map<string, SoundController>()
  buffers: NoiseBufferSet | null = null
  private generators: Record<SoundType, (v: number) => SoundController> | null = null
  private initialized = false

  async init() {
    if (this.initialized) return
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    this.masterGain = this.ctx.createGain()
    this.masterGain.gain.value = 0.8
    this.masterGain.connect(this.ctx.destination)
    this.buffers = generateNoiseBuffers(this.ctx)
    this.generators = makeGen({
      ctx: this.ctx,
      master: this.masterGain,
      buffers: this.buffers
    }) as any
    this.initialized = true
  }

  async resume() {
    if (this.ctx?.state === 'suspended') await this.ctx.resume()
    if (!this.initialized) await this.init()
  }

  get isReady() { return this.initialized }

  play(id: string, type: SoundType, vol = 50, extra?: Record<string, number>): SoundController | null {
    if (this.activeSounds.has(id)) return null
    if (!this.generators || !this.ctx) return null

    const gen = this.generators[type]
    if (!gen) { console.warn(`Unknown sound type: ${type}`); return null }

    try {
      if (type === 'binaural') {
        const ctrl = gen(vol) as any
        ctrl.__setFreq = (f: number) => { /* 不支持动态修改 */ }
        this.activeSounds.set(id, ctrl)
        return ctrl
      }
      const ctrl = gen(vol)
      this.activeSounds.set(id, ctrl)
      return ctrl
    } catch (e) {
      console.error(`Failed to create sound ${type}:`, e)
      return null
    }
  }

  stop(id: string) {
    const ctrl = this.activeSounds.get(id)
    if (!ctrl) return
    try {
      // 停止子声音
      if (ctrl.subSounds) {
        ctrl.subSounds.forEach(s => { try { s.stop() } catch {} })
      }
      ctrl.stop()
    } catch {}
    this.activeSounds.delete(id)
  }

  setVolume(id: string, vol: number) {
    const ctrl = this.activeSounds.get(id)
    if (ctrl?.setVolume) ctrl.setVolume(vol)
  }

  setMasterVolume(vol: number) {
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, vol/100)), this.ctx!.currentTime, 0.1)
    }
  }

  stopAll() {
    this.activeSounds.forEach(ctrl => {
      try {
        if (ctrl.subSounds) ctrl.subSounds.forEach(s => { try { s.stop() } catch {} })
        ctrl.stop()
      } catch {}
    })
    this.activeSounds.clear()
  }

  getActiveCount() { return this.activeSounds.size }
  getActiveIds() { return [...this.activeSounds.keys()] }

  destroy() {
    this.stopAll()
    this.ctx?.close()
    this.ctx = null
    this.masterGain = null
    this.buffers = null
    this.generators = null
    this.initialized = false
  }
}

export const engine = new AudioEngine()
