/* ========================================
   AudioGenerator - Node.js 端纯 JS 音频合成
   生成高质量 PCM 数据用于 WAV 导出
   ======================================== */

// ============ 工具函数 ============

function rnd(): number { return Math.random() * 2 - 1 }

/** 粉红噪声生成器（状态机） */
class PinkNoiseGen {
  private b0=0;b1=0;b2=0;b3=0;b4=0;b5=0;b6=0
  next(): number {
    const w = rnd()
    this.b0 = 0.99886*this.b0 + w*0.0555179
    this.b1 = 0.99332*this.b1 + w*0.0750759
    this.b2 = 0.96900*this.b2 + w*0.1538520
    this.b3 = 0.86650*this.b3 + w*0.3104856
    this.b4 = 0.55000*this.b4 + w*0.5329522
    this.b5 = -0.7616*this.b5 - w*0.0168980
    const out = (this.b0+this.b1+this.b2+this.b3+this.b4+this.b5+this.b6+w*0.5362)*0.11
    this.b6 = w*0.115926
    return out
  }
}

/** 布朗噪声生成器 */
class BrownNoiseGen {
  private lo = 0
  next(): number {
    const w = rnd()
    this.lo = (this.lo + 0.02*w) / 1.02
    return this.lo * 3.5
  }
}

/** 简单一阶低通滤波器 */
function lowpass1(sample: number, prev: number, alpha: number): number {
  return prev + alpha * (sample - prev)
}

/** 混响效果 */
function applyReverb(input: Float32Array, sampleRate: number, mix: number, decay: number): Float32Array {
  const delaySamples = Math.floor(sampleRate * 0.03)
  const output = new Float32Array(input.length)
  const delayBuf = new Float32Array(delaySamples)
  let di = 0

  for (let i = 0; i < input.length; i++) {
    const delayed = delayBuf[di]
    output[i] = input[i] * (1 - mix) + delayed * mix
    delayBuf[di] = input[i] + delayed * decay
    di = (di + 1) % delaySamples
  }
  return output
}

// ============ 声音生成器 ============

export type SoundCategory =
  | 'white' | 'pink' | 'brown'
  | 'rain_gentle' | 'rain_heavy' | 'rain_window'
  | 'ocean' | 'stream' | 'waterfall' | 'river'
  | 'wind_breeze' | 'wind_strong'
  | 'thunder' | 'fire' | 'fan' | 'airplane'
  | 'binaural' | 'tibetan_bowl' | 'solfeggio'

export interface SoundChannels {
  left: Float32Array
  right: Float32Array
}

export interface GenerationConfig {
  type: SoundCategory
  durationSec: number
  sampleRate: number
  volume: number  // 0-1
  options?: Record<string, number>
}

/**
 * 主生成器：根据类型生成双声道 PCM 音频
 */
export function generateSound(config: GenerationConfig): SoundChannels {
  const sr = config.sampleRate
  const len = config.durationSec * sr
  const vol = clamp(config.volume)

  const left = new Float32Array(len)
  const right = new Float32Array(len)

  switch (config.type) {
    case 'white':     fillWhiteNoise(left, right, vol); break
    case 'pink':      fillPinkNoise(left, right, vol); break
    case 'brown':     fillBrownNoise(left, right, vol); break
    case 'rain_gentle': fillRainGentle(left, right, sr, vol); break
    case 'rain_heavy':  fillRainHeavy(left, right, sr, vol); break
    case 'rain_window': fillRainWindow(left, right, sr, vol); break
    case 'ocean':     fillOcean(left, right, sr, vol); break
    case 'stream':    fillStream(left, right, sr, vol); break
    case 'waterfall': fillWaterfall(left, right, sr, vol); break
    case 'river':     fillRiver(left, right, sr, vol); break
    case 'wind_breeze': fillWindBreeze(left, right, sr, vol, false); break
    case 'wind_strong': fillWindBreeze(left, right, sr, vol, true); break
    case 'thunder':   fillThunder(left, right, sr, vol); break
    case 'fire':      fillFire(left, right, sr, vol); break
    case 'fan':       fillFan(left, right, sr, vol); break
    case 'airplane':  fillAirplane(left, right, sr, vol); break
    case 'binaural':  fillBinaural(left, right, sr, vol, config.options?.carrier ?? 200, config.options?.beat ?? 4); break
    case 'tibetan_bowl': fillTibetanBowl(left, right, sr, vol); break
    case 'solfeggio': fillSolfeggio(left, right, sr, vol, config.options?.freq ?? 528); break
    default: console.warn(`Unknown type: ${config.type}`)
  }

  // 添加淡入淡出防止爆音
  applyFade(left, sr, 2)
  applyFade(right, sr, 2)

  return { left, right }
}

/** 混合多个声音 */
export function mixSounds(sounds: SoundChannels[], volumes: number[]): SoundChannels {
  if (sounds.length === 0) throw new Error('No sounds to mix')
  const len = sounds[0].left.length
  const left = new Float32Array(len)
  const right = new Float32Array(len)

  for (let i = 0; i < sounds.length; i++) {
    const v = volumes[i] ?? 1
    for (let j = 0; j < len; j++) {
      left[j] += sounds[i].left[j] * v
      right[j] += sounds[i].right[j] * v
    }
  }

  // 归一化防止溢出
  const peak = Math.max(
    maxAbs(left), maxAbs(right)
  )
  if (peak > 1) {
    const scale = 0.95 / peak
    for (let i = 0; i < len; i++) {
      left[i] *= scale; right[i] *= scale
    }
  }

  return { left, right }
}

// ============ 填充函数 ============

function clamp(v: number): number { return Math.max(0, Math.min(1, v)) }
function maxAbs(arr: Float32Array): number {
  let m = 0; for (let i = 0; i < arr.length; i++) { if (Math.abs(arr[i]) > m) m = Math.abs(arr[i]) }
  return m
}

function applyFade(arr: Float32Array, sr: number, sec: number) {
  const fade = Math.floor(sr * sec)
  const end = arr.length - fade
  for (let i = 0; i < fade; i++) {
    arr[i] *= i / fade
    if (end + i < arr.length) arr[end + i] *= 1 - i / fade
  }
}

function fillWhiteNoise(l: Float32Array, r: Float32Array, vol: number) {
  for (let i = 0; i < l.length; i++) {
    l[i] = rnd() * vol * 0.35
    r[i] = rnd() * vol * 0.35
  }
}

function fillPinkNoise(l: Float32Array, r: Float32Array, vol: number) {
  const gen = new PinkNoiseGen()
  for (let i = 0; i < l.length; i++) {
    l[i] = gen.next() * vol * 0.4
    r[i] = gen.next() * vol * 0.4
  }
}

function fillBrownNoise(l: Float32Array, r: Float32Array, vol: number) {
  const gen = new BrownNoiseGen()
  for (let i = 0; i < l.length; i++) {
    const s = gen.next() * vol * 0.5
    l[i] = s; r[i] = s
  }
}

/** 轻柔雨声：双层噪声+滤波模拟 */
function fillRainGentle(l: Float32Array, r: Float32Array, sr: number, vol: number) {
  const pink = new PinkNoiseGen()
  const brown = new BrownNoiseGen()
  let lp1 = 0, lp2 = 0
  const alpha1 = 600 / (sr / 2)  // 高通截止频率归一化
  const alpha2 = 2500 / (sr / 2)

  for (let i = 0; i < l.length; i++) {
    // 底层：布朗噪声高通（模拟沙沙声）
    const b = brown.next()
    lp1 = lowpass1(b, lp1, 0.95)  // 积分器转高通
    const bass = (b - lp1) * vol * 0.22

    // 上层：粉红噪声共振（模拟雨滴感）
    const p = pink.next()
    lp2 = lowpass1(p, lp2, alpha2 * 0.5)
    const tex = lp2 * vol * 0.1

    // 轻微随机调制
    const mod = 1 + Math.sin(i * 0.0003) * 0.15

    const s = (bass + tex) * mod
    l[i] = s
    r[i] = s + (rnd() * vol * 0.01) // 微小区分左右
  }
}

function fillRainHeavy(l: Float32Array, r: Float32Array, sr: number, vol: number) {
  const pink = new PinkNoiseGen()
  const brown = new BrownNoiseGen()
  let lp1 = 0

  for (let i = 0; i < l.length; i++) {
    const b = brown.next()
    lp1 = lowpass1(b, lp1, 0.92)
    const bass = (b - lp1) * vol * 0.38

    const p = pink.next() * vol * 0.2
    const mod = 1 + Math.sin(i * 0.0005) * 0.2

    l[i] = (bass + p) * mod
    r[i] = l[i] + rnd() * vol * 0.02
  }
}

function fillRainWindow(l: Float32Array, r: Float32Array, sr: number, vol: number) {
  const pink = new PinkNoiseGen()
  const brown = new BrownNoiseGen()
  let lp1 = 0

  for (let i = 0; i < l.length; i++) {
    const b = brown.next()
    lp1 = lowpass1(b, lp1, 0.93)
    const bass = (b - lp1) * vol * 0.18

    const p = pink.next()
    // 窗边雨声更高频
    const hp = p * vol * 0.08

    // 模拟雨滴打在玻璃上
    const tapAmount = Math.random() > 0.9997 ? Math.random() * 0.15 : 0

    l[i] = bass + hp + tapAmount
    r[i] = l[i] + rnd() * vol * 0.01
  }
}

function fillOcean(l: Float32Array, r: Float32Array, sr: number, vol: number) {
  const brown = new BrownNoiseGen()
  let lp = 0, lfo = 0

  for (let i = 0; i < l.length; i++) {
    const b = brown.next()
    lp = lowpass1(b, lp, 0.08)  // 重度低通
    // LFO 模拟潮汐 (0.12 Hz ≈ 8秒周期)
    lfo += 0.12 / sr * Math.PI * 2
    const tide = 0.7 + 0.3 * Math.sin(lfo)

    const s = lp * vol * 0.45 * tide
    l[i] = s
    r[i] = s + rnd() * vol * 0.02
  }
}

function fillStream(l: Float32Array, r: Float32Array, sr: number, vol: number) {
  const pink = new PinkNoiseGen()
  let lp = 0

  for (let i = 0; i < l.length; i++) {
    const p = pink.next()
    lp = lowpass1(p, lp, 0.25)
    // 溪流是高频+调制的粉红噪声
    const mod = 1 + Math.sin(i * 0.0002) * 0.15
    const s = (p - lp) * vol * 0.25 * mod
    l[i] = s
    r[i] = s + rnd() * vol * 0.01
  }
}

function fillWaterfall(l: Float32Array, r: Float32Array, sr: number, vol: number) {
  const pink = new PinkNoiseGen()
  const white_lp_prev = { l: 0, r: 0 }

  for (let i = 0; i < l.length; i++) {
    const p = pink.next()
    const wl = rnd(), wr = rnd()
    white_lp_prev.l = lowpass1(wl, white_lp_prev.l, 0.3)
    white_lp_prev.r = lowpass1(wr, white_lp_prev.r, 0.3)

    const mod = 1 + Math.sin(i * 0.0003) * 0.2
    l[i] = (p * 0.35 + white_lp_prev.l * 0.12) * vol * mod
    r[i] = (p * 0.35 + white_lp_prev.r * 0.12) * vol * mod
  }
}

function fillRiver(l: Float32Array, r: Float32Array, sr: number, vol: number) {
  const pink = new PinkNoiseGen()
  let lp = 0

  for (let i = 0; i < l.length; i++) {
    lp = lowpass1(pink.next(), lp, 0.15)
    const mod = 1 + Math.sin(i * 0.00015) * 0.25
    const s = lp * vol * 0.35 * mod
    l[i] = s
    r[i] = s + rnd() * vol * 0.015
  }
}

function fillWindBreeze(l: Float32Array, r: Float32Array, sr: number, vol: number, strong: boolean) {
  const pink = new PinkNoiseGen()
  let lp = 0, lfo1 = 0, lfo2 = 0
  const mul = strong ? 0.45 : 0.3

  for (let i = 0; i < l.length; i++) {
    lp = lowpass1(pink.next(), lp, strong ? 0.1 : 0.06)
    lfo1 += 0.07 / sr * Math.PI * 2      // 慢调制
    lfo2 += 0.15 / sr * Math.PI * 2      // 快调制
    const mod = 0.7 + 0.3 * (Math.sin(lfo1) * 0.7 + Math.sin(lfo2) * 0.3)

    const s = lp * vol * mul * mod
    l[i] = s
    r[i] = s + rnd() * vol * 0.02
  }
}

function fillThunder(l: Float32Array, r: Float32Array, sr: number, vol: number) {
  // 雷声是间歇性的 - 随机间隔产生低沉隆隆声
  const brown = new BrownNoiseGen()
  const minGap = sr * 3   // 最少3秒间隔
  const maxGap = sr * 15  // 最多15秒间隔

  let nextThunder = minGap + Math.random() * (maxGap - minGap)
  let thunderActive = 0
  let thunderPos = 0
  const thunderLen = Math.floor(sr * (1.5 + Math.random() * 3))

  for (let i = 0; i < l.length; i++) {
    let s = 0

    if (i >= nextThunder) {
      thunderActive = Math.floor(sr * (1.5 + Math.random() * 3))
      thunderPos = 0
      nextThunder = i + minGap + Math.random() * (maxGap - minGap)
    }

    if (thunderPos < thunderActive) {
      const b = brown.next()
      const env = Math.exp(-thunderPos / (sr * 1.5)) * (1 - Math.exp(-thunderPos / (sr * 0.04)))
      s = b * 2 * env * vol * 0.7
      thunderPos++
    }

    l[i] = s
    r[i] = s + rnd() * vol * 0.01
  }
}

function fillFire(l: Float32Array, r: Float32Array, sr: number, vol: number) {
  const brown = new BrownNoiseGen()
  let llo = 0

  for (let i = 0; i < l.length; i++) {
    // 低频层
    llo = lowpass1(brown.next(), llo, 0.02)
    const bass = llo * vol * 0.25

    // 噼啪层：快变调制的白噪声
    const crackle = rnd() * (Math.random() > 0.7 ? 1 : 0.05) * vol * 0.12

    // 火焰跳动调制
    const flicker = 1 + Math.sin(i * 0.001) * 0.2 + Math.sin(i * 0.003) * 0.1

    l[i] = (bass + crackle) * flicker
    r[i] = l[i] + rnd() * vol * 0.02
  }
}

function fillFan(l: Float32Array, r: Float32Array, sr: number, vol: number) {
  // 低频振荡（风扇转动频率）+白噪声
  for (let i = 0; i < l.length; i++) {
    const t = i / sr
    // 120Hz 基频
    const tone = Math.sin(2 * Math.PI * 120 * t) * vol * 0.06
    const noise = rnd() * vol * 0.18
    const u = tone + noise
    l[i] = u
    r[i] = u
  }
}

function fillAirplane(l: Float32Array, r: Float32Array, sr: number, vol: number) {
  const white_prev = { l: 0, r: 0 }

  for (let i = 0; i < l.length; i++) {
    white_prev.l = lowpass1(rnd() * 2, white_prev.l, 0.02)
    white_prev.r = lowpass1(rnd() * 2, white_prev.r, 0.02)
    const mod = 1 + Math.sin(i * 0.00004) * 0.1
    l[i] = white_prev.l * vol * 0.4 * mod
    r[i] = white_prev.r * vol * 0.4 * mod
  }
}

function fillBinaural(l: Float32Array, r: Float32Array, sr: number, vol: number, carrier: number, beat: number) {
  for (let i = 0; i < l.length; i++) {
    const t = i / sr
    l[i] = Math.sin(2 * Math.PI * carrier * t) * vol * 0.3
    r[i] = Math.sin(2 * Math.PI * (carrier + beat) * t) * vol * 0.3
  }
}

function fillTibetanBowl(l: Float32Array, r: Float32Array, sr: number, vol: number) {
  // 多谐波衰减
  const harmonics = [
    { f: 220, a: 1.0 },
    { f: 564, a: 0.6 },
    { f: 1012, a: 0.35 },
    { f: 1590, a: 0.18 },
    { f: 2275, a: 0.08 },
  ]

  for (let i = 0; i < l.length; i++) {
    const t = i / sr
    const env = Math.exp(-t * 0.25) // 缓慢衰减
    const env2 = 1 - Math.exp(-t * 8) // 快速起音
    let s = 0

    for (const h of harmonics) {
      s += Math.sin(2 * Math.PI * h.f * t) * h.a
    }

    s *= env * env2 * vol * 0.15
    l[i] = s
    r[i] = s
  }
}

function fillSolfeggio(l: Float32Array, r: Float32Array, sr: number, vol: number, freq: number) {
  for (let i = 0; i < l.length; i++) {
    const t = i / sr
    const s = Math.sin(2 * Math.PI * freq * t) * vol * 0.18
    const h = Math.sin(2 * Math.PI * freq * 2 * t) * vol * 0.03
    l[i] = s + h
    r[i] = s + h
  }
}
