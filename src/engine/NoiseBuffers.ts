/* ========================================
   噪声缓冲区 - 白/粉/棕/蓝/紫噪声预生成
   ======================================== */

export interface NoiseBufferSet {
  white: AudioBuffer
  pink: AudioBuffer
  brown: AudioBuffer
  blue: AudioBuffer
  violet: AudioBuffer
}

/** 生成所有噪声颜色缓冲区（4秒循环） */
export function generateNoiseBuffers(ctx: AudioContext): NoiseBufferSet {
  const sr = ctx.sampleRate
  const dur = 4
  const len = sr * dur

  return {
    white:  generateWhiteNoiseBuffer(ctx, len, sr),
    pink:   generatePinkNoiseBuffer(ctx, len, sr),
    brown:  generateBrownNoiseBuffer(ctx, len, sr),
    blue:   generateBlueNoiseBuffer(ctx, len, sr),
    violet: generateVioletNoiseBuffer(ctx, len, sr),
  }
}

function generateWhiteNoiseBuffer(ctx: AudioContext, len: number, _sr: number): AudioBuffer {
  const buf = ctx.createBuffer(1, len, _sr)
  const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
  return buf
}

/** 粉红噪声 - Paul Kellet 精炼算法 */
function generatePinkNoiseBuffer(ctx: AudioContext, len: number, sr: number): AudioBuffer {
  const buf = ctx.createBuffer(1, len, sr)
  const d = buf.getChannelData(0)
  let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1
    b0 = 0.99886*b0 + w*0.0555179
    b1 = 0.99332*b1 + w*0.0750759
    b2 = 0.96900*b2 + w*0.1538520
    b3 = 0.86650*b3 + w*0.3104856
    b4 = 0.55000*b4 + w*0.5329522
    b5 = -0.7616*b5 - w*0.0168980
    d[i] = (b0+b1+b2+b3+b4+b5+b6+w*0.5362) * 0.11
    b6 = w * 0.115926
  }
  return buf
}

/** 布朗噪声（红噪声）- 积分法 */
function generateBrownNoiseBuffer(ctx: AudioContext, len: number, sr: number): AudioBuffer {
  const buf = ctx.createBuffer(1, len, sr)
  const d = buf.getChannelData(0)
  let lo = 0
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1
    d[i] = (lo + 0.02*w) / 1.02
    lo = d[i]
    d[i] *= 3.5
  }
  return buf
}

/** 蓝噪声 - 白噪声微分（高通） */
function generateBlueNoiseBuffer(ctx: AudioContext, len: number, sr: number): AudioBuffer {
  const buf = ctx.createBuffer(1, len, sr)
  const d = buf.getChannelData(0)
  let prev = 0
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1
    d[i] = (w - prev) * 2.5
    prev = w
  }
  return buf
}

/** 紫噪声 - 白噪声二次微分（更陡峭的高通） */
function generateVioletNoiseBuffer(ctx: AudioContext, len: number, sr: number): AudioBuffer {
  const buf = ctx.createBuffer(1, len, sr)
  const d = buf.getChannelData(0)
  let prev1 = 0, prev2 = 0
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1
    d[i] = (w - 2*prev1 + prev2) * 3
    prev2 = prev1
    prev1 = w
  }
  return buf
}
