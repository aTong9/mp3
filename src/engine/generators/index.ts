/* ========================================
   声音生成器 - 30+ 种真实 ASMR 声音
   ======================================== */

import type { SoundController, SoundType } from '@/types'
import type { NoiseBufferSet } from '../NoiseBuffers'

// ============ 工具函数 ============

function vol(v: number) { return Math.max(0, Math.min(1, v / 100)) }

function biquad(ctx: AudioContext, type: BiquadFilterType, freq: number, Q = 0.5) {
  const f = ctx.createBiquadFilter()
  f.type = type; f.frequency.value = freq; f.Q.value = Q
  return f
}

function gainNode(ctx: AudioContext, value = 0.5) {
  const g = ctx.createGain(); g.gain.value = value; return g
}

function createLooper(ctx: AudioContext, buffer: AudioBuffer): AudioBufferSourceNode {
  const src = ctx.createBufferSource()
  src.buffer = buffer; src.loop = true; return src
}

function lfo(ctx: AudioContext, freq: number, type: OscillatorType = 'sine', depth = 1) {
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = type; osc.frequency.value = freq
  g.gain.value = depth
  osc.connect(g); osc.start()
  return { osc, gain: g }
}

function fadeIn(ctx: AudioContext, g: GainNode, target: number, time = 0.8) {
  g.gain.setTargetAtTime(target, ctx.currentTime, time)
}
function fadeOut(ctx: AudioContext, g: GainNode, time = 0.3) {
  g.gain.setTargetAtTime(0, ctx.currentTime, time)
}

// ============ 生成器上下文 ============

interface GenCtx {
  ctx: AudioContext
  master: GainNode
  buffers: NoiseBufferSet
}

function makeGen(ctx: GenCtx) {
  const {ctx:ac, master, buffers:b} = ctx
  const $ = { ctx: ac, master, buffers: b, vol, biquad, gainNode, createLooper, lfo, fadeIn, fadeOut }

  // ================================================================
  // 噪声颜色
  // ================================================================

  function whiteNoise(v: number): SoundController {
    const src = createLooper(ac, b.white)
    const lp = biquad(ac, 'lowpass', 8000, 0.7)
    const g = gainNode(ac, vol(v) * 0.35)
    src.connect(lp); lp.connect(g); g.connect(master)
    src.start()
    return { type:'white', stop:()=>{try{src.stop()}catch{}}, setVolume:(nv)=>g.gain.setTargetAtTime(vol(nv)*0.35,ac.currentTime,0.1) }
  }

  function pinkNoise(v: number): SoundController {
    const src = createLooper(ac, b.pink)
    const g = gainNode(ac, vol(v) * 0.4)
    src.connect(g); g.connect(master)
    src.start()
    return { type:'pink', stop:()=>{try{src.stop()}catch{}}, setVolume:(nv)=>g.gain.setTargetAtTime(vol(nv)*0.4,ac.currentTime,0.1) }
  }

  function brownNoise(v: number): SoundController {
    const src = createLooper(ac, b.brown)
    const lp = biquad(ac, 'lowpass', 250, 0.5)
    const g = gainNode(ac, vol(v) * 0.55)
    src.connect(lp); lp.connect(g); g.connect(master)
    src.start()
    return { type:'brown', stop:()=>{try{src.stop()}catch{}}, setVolume:(nv)=>g.gain.setTargetAtTime(vol(nv)*0.55,ac.currentTime,0.1) }
  }

  function blueNoise(v: number): SoundController {
    const src = createLooper(ac, b.blue)
    const g = gainNode(ac, vol(v) * 0.25)
    src.connect(g); g.connect(master)
    src.start()
    return { type:'blue', stop:()=>{try{src.stop()}catch{}}, setVolume:(nv)=>g.gain.setTargetAtTime(vol(nv)*0.25,ac.currentTime,0.1) }
  }

  function violetNoise(v: number): SoundController {
    const src = createLooper(ac, b.violet)
    const g = gainNode(ac, vol(v) * 0.2)
    src.connect(g); g.connect(master)
    src.start()
    return { type:'violet', stop:()=>{try{src.stop()}catch{}}, setVolume:(nv)=>g.gain.setTargetAtTime(vol(nv)*0.2,ac.currentTime,0.1) }
  }

  // ================================================================
  // 雨声生成器（5 种变体）
  // ================================================================
  function _rainCore(v: number, hpFreq: number, bpFreq: number, bpQ: number, bassG: number, texG: number, extraMod = false): SoundController {
    const vv = vol(v)
    // 底层：布朗噪声高通 → 雨的基础沙沙声
    const src1 = createLooper(ac, b.brown)
    const hp1 = biquad(ac, 'highpass', hpFreq, 0.5)
    const gain1 = gainNode(ac, vv * bassG)
    // 上层：粉红噪声带通 → 雨滴质感
    const src2 = createLooper(ac, b.pink)
    const bp = biquad(ac, 'bandpass', bpFreq, bpQ)
    const gain2 = gainNode(ac, vv * texG)

    src1.connect(hp1); hp1.connect(gain1); gain1.connect(master)
    src2.connect(bp); bp.connect(gain2); gain2.connect(master)
    src1.start(); src2.start()

    let cleanup: (() => void)[] = []

    if (extraMod) {
      const { osc, gain:lg } = lfo(ac, 0.3, 'sine', 0.15)
      lg.connect(gain2.gain)
      cleanup.push(() => { try{osc.stop()}catch{} })
    }

    return {
      type: 'rain_gentle',
      nodes: [src1,hp1,gain1, src2,bp,gain2],
      stop:()=>{
        try{src1.stop();src2.stop()}catch{}
        cleanup.forEach(fn => fn())
      },
      setVolume:(nv)=>{
        const nv2 = vol(nv)
        gain1.gain.setTargetAtTime(nv2*bassG, ac.currentTime, 0.1)
        gain2.gain.setTargetAtTime(nv2*texG, ac.currentTime, 0.1)
      }
    }
  }

  function rainGentle(v: number)   { return _rainCore(v, 550, 2200, 0.3, 0.25, 0.12, true) }
  function rainModerate(v: number) { return _rainCore(v, 450, 2000, 0.35, 0.32, 0.18, true) }
  function rainHeavy(v: number)    { return _rainCore(v, 350, 1800, 0.4, 0.42, 0.25, true) }
  function rainWindow(v: number)   { return _rainCore(v, 800, 3500, 0.22, 0.2, 0.1, false) }
  function rainLeaves(v: number)   { return _rainCore(v, 700, 2800, 0.25, 0.22, 0.08, false) }

  // ================================================================
  // 海浪
  // ================================================================
  function oceanGentle(v: number): SoundController {
    const vv = vol(v)
    const src = createLooper(ac, b.brown)
    const lp = biquad(ac, 'lowpass', 350, 0.3)
    const g = gainNode(ac, vv * 0.45)
    const { osc, gain:lg } = lfo(ac, 0.12, 'sine', 0.25)
    lg.connect(g.gain)

    src.connect(lp); lp.connect(g); g.connect(master)
    src.start()
    return {
      type:'ocean_gentle', nodes:[src,lp,g,osc,lg],
      stop:()=>{try{src.stop();osc.stop()}catch{}},
      setVolume:(nv)=>g.gain.setTargetAtTime(vol(nv)*0.45, ac.currentTime, 0.2)
    }
  }

  function oceanStorm(v: number): SoundController {
    const vv = vol(v)
    const src1 = createLooper(ac, b.brown)
    const lp1 = biquad(ac, 'lowpass', 500, 0.4)
    const g1 = gainNode(ac, vv * 0.5)
    // 加强低频冲击
    const src2 = createLooper(ac, b.white)
    const hp = biquad(ac, 'highpass', 2000, 0.3)
    const g2 = gainNode(ac, vv * 0.1)

    // 两个 LFO 模拟不规则波浪
    const l1 = lfo(ac, 0.09, 'sine', 0.3); l1.gain.connect(g1.gain)
    const l2 = lfo(ac, 0.15, 'triangle', 0.15); l2.gain.connect(g1.gain)

    src1.connect(lp1); lp1.connect(g1); g1.connect(master)
    src2.connect(hp); hp.connect(g2); g2.connect(master)
    src1.start(); src2.start()

    return {
      type:'ocean_storm', nodes:[src1,lp1,g1, src2,hp,g2, l1.osc,l1.gain, l2.osc,l2.gain],
      stop:()=>{
        try{src1.stop();src2.stop();l1.osc.stop();l2.osc.stop()}catch{}
      },
      setVolume:(nv)=>{
        const nv2 = vol(nv)
        g1.gain.setTargetAtTime(nv2*0.5, ac.currentTime, 0.2)
        g2.gain.setTargetAtTime(nv2*0.1, ac.currentTime, 0.2)
      }
    }
  }

  // ================================================================
  // 溪流
  // ================================================================
  function stream(v: number): SoundController {
    const vv = vol(v)
    const src = createLooper(ac, b.pink)
    const hp = biquad(ac, 'highpass', 800, 0.5)
    const bp = biquad(ac, 'bandpass', 2800, 0.35)
    const g = gainNode(ac, vv * 0.28)
    const { osc, gain:lg } = lfo(ac, 0.4, 'sine', 0.1)
    lg.connect(g.gain)

    src.connect(hp); hp.connect(bp); bp.connect(g); g.connect(master)
    src.start()
    return {
      type:'stream', nodes:[src,hp,bp,g,osc,lg],
      stop:()=>{try{src.stop();osc.stop()}catch{}},
      setVolume:(nv)=>g.gain.setTargetAtTime(vol(nv)*0.28, ac.currentTime, 0.15)
    }
  }

  // ================================================================
  // 瀑布
  // ================================================================
  function waterfall(v: number): SoundController {
    const vv = vol(v)
    // 底层：强烈的粉红噪声
    const src1 = createLooper(ac, b.pink)
    const bp = biquad(ac, 'bandpass', 1500, 0.5)
    const g1 = gainNode(ac, vv * 0.4)
    // 上层：高频白噪声 → 水花飞溅感
    const src2 = createLooper(ac, b.white)
    const hp = biquad(ac, 'highpass', 3000, 0.4)
    const g2 = gainNode(ac, vv * 0.15)

    const { osc, gain:lg } = lfo(ac, 0.25, 'sine', 0.2)
    lg.connect(g1.gain)

    src1.connect(bp); bp.connect(g1); g1.connect(master)
    src2.connect(hp); hp.connect(g2); g2.connect(master)
    src1.start(); src2.start()

    return {
      type:'waterfall', nodes:[src1,bp,g1, src2,hp,g2, osc,lg],
      stop:()=>{try{src1.stop();src2.stop();osc.stop()}catch{}},
      setVolume:(nv)=>{
        const nv2 = vol(nv)
        g1.gain.setTargetAtTime(nv2*0.4, ac.currentTime, 0.15)
        g2.gain.setTargetAtTime(nv2*0.15, ac.currentTime, 0.15)
      }
    }
  }

  // ================================================================
  // 河流
  // ================================================================
  function river(v: number): SoundController {
    const vv = vol(v)
    const src = createLooper(ac, b.pink)
    const bp = biquad(ac, 'bandpass', 600, 0.4)
    const g = gainNode(ac, vv * 0.35)
    const { osc, gain:lg } = lfo(ac, 0.2, 'sine', 0.2)
    lg.connect(g.gain)
    src.connect(bp); bp.connect(g); g.connect(master)
    src.start()
    return {
      type:'river', nodes:[src,bp,g,osc,lg],
      stop:()=>{try{src.stop();osc.stop()}catch{}},
      setVolume:(nv)=>g.gain.setTargetAtTime(vol(nv)*0.35, ac.currentTime, 0.15)
    }
  }

  // ================================================================
  // 湖水
  // ================================================================
  function lake(v: number): SoundController {
    const vv = vol(v)
    const src = createLooper(ac, b.brown)
    const lp = biquad(ac, 'lowpass', 400, 0.4)
    const g = gainNode(ac, vv * 0.3)
    const { osc, gain:lg } = lfo(ac, 0.06, 'sine', 0.35)
    lg.connect(g.gain)
    src.connect(lp); lp.connect(g); g.connect(master)
    src.start()
    return {
      type:'lake', nodes:[src,lp,g,osc,lg],
      stop:()=>{try{src.stop();osc.stop()}catch{}},
      setVolume:(nv)=>g.gain.setTargetAtTime(vol(nv)*0.3, ac.currentTime, 0.2)
    }
  }

  // ================================================================
  // 风声（4 种）
  // ================================================================
  function _windCore(v: number, lpFreq: number, gainMul: number, modDepth: number, modFreq: number): SoundController {
    const vv = vol(v)
    const src = createLooper(ac, b.pink)
    const lp = biquad(ac, 'lowpass', lpFreq, 0.5)
    const g = gainNode(ac, vv * gainMul)

    const l1 = lfo(ac, modFreq, 'sine', modDepth); l1.gain.connect(g.gain)
    // 额外调制滤波器
    const l2 = lfo(ac, modFreq * 1.7, 'triangle', lpFreq * 0.3); l2.gain.connect(lp.frequency)

    src.connect(lp); lp.connect(g); g.connect(master)
    src.start()
    return {
      type:'wind_breeze', nodes:[src,lp,g,l1.osc,l1.gain,l2.osc,l2.gain],
      stop:()=>{try{src.stop();l1.osc.stop();l2.osc.stop()}catch{}},
      setVolume:(nv)=>g.gain.setTargetAtTime(vol(nv)*gainMul, ac.currentTime, 0.2)
    }
  }

  function windBreeze(v: number) { return _windCore(v, 500, 0.3, 0.15, 0.07) }
  function windStrong(v: number) { return _windCore(v, 700, 0.45, 0.3, 0.12) }
  function windTrees(v: number)  { return _windCore(v, 400, 0.35, 0.25, 0.1) }
  function windDesert(v: number) { return _windCore(v, 300, 0.4, 0.2, 0.06) }

  // ================================================================
  // 雷声（2 种）
  // ================================================================
  function _thunderCore(v: number, minDelay: number, maxDelay: number, gainMul: number, lpLow: number, lpHigh: number): SoundController {
    let timers: number[] = []
    let activeSrcs: AudioBufferSourceNode[] = []

    const playRumble = () => {
      const dur = 1.5 + Math.random() * 3
      const sr = ac.sampleRate
      const buf = ac.createBuffer(1, Math.floor(sr*dur), sr)
      const data = buf.getChannelData(0)
      let lo = 0
      for (let i = 0; i < data.length; i++) {
        const w = Math.random()*2-1
        data[i] = (lo + 0.005*w) / 1.005
        lo = data[i]; data[i] *= 2
        const env = Math.exp(-i/(sr*1.2)) * (1-Math.exp(-i/(sr*0.03)))
        data[i] *= env
      }
      const src = ac.createBufferSource(); src.buffer = buf
      const lp = biquad(ac, 'lowpass', lpLow + Math.random()*(lpHigh-lpLow))
      const g = gainNode(ac, vol(v) * gainMul * (0.5+Math.random()*0.5))
      src.connect(lp); lp.connect(g); g.connect(master)
      src.start(); activeSrcs.push(src)
      src.onended = () => { activeSrcs = activeSrcs.filter(s=>s!==src) }
    }

    const schedule = () => {
      const delay = minDelay + Math.random() * maxDelay
      const t = window.setTimeout(() => { playRumble(); schedule() }, delay)
      timers.push(t)
    }
    schedule()
    playRumble()

    return {
      type:'thunder_distant', nodes:[],
      stop:()=>{ timers.forEach(t=>clearTimeout(t)); activeSrcs.forEach(s=>{try{s.stop()}catch{}}) },
      setVolume:()=>{}
    }
  }

  function thunderDistant(v: number) { return _thunderCore(v, 4000, 12000, 0.6, 60, 120) }
  function thunderClose(v: number)   { return _thunderCore(v, 2500, 8000, 0.9, 80, 200) }

  // ================================================================
  // 火声
  // ================================================================
  function _fireCore(v: number, crackleVol: number, rumbleVol: number, lfoFreq: number): SoundController {
    const vv = vol(v)
    // 噼啪层
    const src1 = createLooper(ac, b.white)
    const hp = biquad(ac, 'highpass', 1500)
    const g1 = gainNode(ac, vv * crackleVol)
    // 低频隆隆
    const src2 = createLooper(ac, b.brown)
    const lp = biquad(ac, 'lowpass', 100)
    const g2 = gainNode(ac, vv * rumbleVol)
    // 跳跃调制
    const { osc, gain:lg } = lfo(ac, lfoFreq, 'triangle', 0.15)
    lg.connect(g1.gain)

    src1.connect(hp); hp.connect(g1); g1.connect(master)
    src2.connect(lp); lp.connect(g2); g2.connect(master)
    src1.start(); src2.start()

    return {
      type:'fire_campfire', nodes:[src1,hp,g1, src2,lp,g2, osc,lg],
      stop:()=>{try{src1.stop();src2.stop();osc.stop()}catch{}},
      setVolume:(nv)=>{
        const nv2 = vol(nv)
        g1.gain.setTargetAtTime(nv2*crackleVol, ac.currentTime, 0.1)
        g2.gain.setTargetAtTime(nv2*rumbleVol, ac.currentTime, 0.1)
      }
    }
  }

  function fireCampfire(v: number)  { return _fireCore(v, 0.15, 0.25, 3) }
  function fireFireplace(v: number) { return _fireCore(v, 0.1, 0.3, 2) }
  function fireBonfire(v: number)   { return _fireCore(v, 0.22, 0.4, 4) }

  // ================================================================
  // 鸟鸣
  // ================================================================
  function birdsForest(v: number): SoundController {
    let timers: number[] = [], activeOscs: OscillatorNode[] = []
    const rng = (lo:number, hi:number) => lo + Math.random()*(hi-lo)

    const chirp = () => {
      const dur = 0.06 + Math.random()*0.25
      const freq = 1800 + Math.random()*3500
      const osc = ac.createOscillator(); osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ac.currentTime)
      osc.frequency.exponentialRampToValueAtTime(freq * rng(0.7,1.3), ac.currentTime+dur)
      const g = ac.createGain()
      g.gain.setValueAtTime(0, ac.currentTime)
      g.gain.linearRampToValueAtTime(vol(v)*0.04, ac.currentTime+0.01)
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime+dur)
      const hp = biquad(ac, 'highpass', 1800)
      osc.connect(hp); hp.connect(g); g.connect(master)
      osc.start(); osc.stop(ac.currentTime+dur+0.1)
      activeOscs.push(osc)
      osc.onended = ()=>{ activeOscs = activeOscs.filter(o=>o!==osc) }
    }

    const schedule = () => {
      const delay = 100 + Math.random()*2000
      const t = window.setTimeout(()=>{
        chirp()
        if(Math.random()>0.3){ window.setTimeout(chirp, 50+Math.random()*200) }
        if(Math.random()>0.5){ window.setTimeout(chirp, 100+Math.random()*300) }
        schedule()
      }, delay)
      timers.push(t)
    }
    schedule(); chirp()

    return {
      type:'birds_forest', nodes:[],
      stop:()=>{ timers.forEach(t=>clearTimeout(t)); activeOscs.forEach(o=>{try{o.stop()}catch{}}) },
      setVolume:()=>{}
    }
  }

  function birdsGarden(v: number): SoundController {
    let timers: number[] = [], activeOscs: OscillatorNode[] = []
    const chirp = () => {
      const dur = 0.04+Math.random()*0.15
      const freq = 3000+Math.random()*4000
      const osc = ac.createOscillator(); osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ac.currentTime)
      osc.frequency.exponentialRampToValueAtTime(freq*(0.85+Math.random()*0.3), ac.currentTime+dur)
      const g = ac.createGain()
      g.gain.setValueAtTime(0, ac.currentTime)
      g.gain.linearRampToValueAtTime(vol(v)*0.03, ac.currentTime+0.005)
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime+dur)
      const hp = biquad(ac, 'highpass', 2500)
      osc.connect(hp); hp.connect(g); g.connect(master)
      osc.start(); osc.stop(ac.currentTime+dur+0.1)
      activeOscs.push(osc)
      osc.onended = ()=>{ activeOscs = activeOscs.filter(o=>o!==osc) }
    }
    const schedule = () => {
      const t = window.setTimeout(()=>{ chirp(); schedule() }, 300+Math.random()*1200)
      timers.push(t)
    }
    schedule(); chirp()
    return {
      type:'birds_garden', nodes:[],
      stop:()=>{ timers.forEach(t=>clearTimeout(t)); activeOscs.forEach(o=>{try{o.stop()}catch{}}) },
      setVolume:()=>{}
    }
  }

  // ================================================================
  // 蟋蟀
  // ================================================================
  function crickets(v: number): SoundController {
    let timers: number[] = [], activeOscs: OscillatorNode[] = []
    const buzz = () => {
      const dur = 0.08+Math.random()*0.15
      const freq = 3500+Math.random()*1500
      const osc = ac.createOscillator(); osc.type = 'square'
      osc.frequency.value = freq
      const g = ac.createGain()
      g.gain.setValueAtTime(0, ac.currentTime)
      g.gain.linearRampToValueAtTime(vol(v)*0.02, ac.currentTime+0.005)
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime+dur)
      osc.connect(g); g.connect(master)
      osc.start(); osc.stop(ac.currentTime+dur+0.1)
      activeOscs.push(osc)
      osc.onended = ()=>{ activeOscs = activeOscs.filter(o=>o!==osc) }
    }
    // 多只蟋蟀异步鸣叫
    const sched = (id: number) => {
      const t = window.setTimeout(()=>{
        buzz()
        if(Math.random()>0.2) window.setTimeout(buzz, 40+Math.random()*100)
        sched(id)
      }, 200+Math.random()*1500)
      timers.push(t)
    }
    sched(1); sched(2); sched(3)
    return {
      type:'crickets', nodes:[],
      stop:()=>{ timers.forEach(t=>clearTimeout(t)); activeOscs.forEach(o=>{try{o.stop()}catch{}}) },
      setVolume:()=>{}
    }
  }

  // ================================================================
  // 猫头鹰
  // ================================================================
  function owl(v: number): SoundController {
    let timers: number[] = [], activeOscs: OscillatorNode[] = []
    const hoot = () => {
      const dur = 0.35
      const osc = ac.createOscillator(); osc.type = 'sine'
      osc.frequency.setValueAtTime(450, ac.currentTime)
      osc.frequency.setValueAtTime(420, ac.currentTime+0.1)
      osc.frequency.setValueAtTime(440, ac.currentTime+0.25)
      const g = ac.createGain()
      g.gain.setValueAtTime(0, ac.currentTime)
      g.gain.linearRampToValueAtTime(vol(v)*0.1, ac.currentTime+0.02)
      g.gain.setValueAtTime(vol(v)*0.1, ac.currentTime+0.25)
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime+dur)
      osc.connect(g); g.connect(master)
      osc.start(); osc.stop(ac.currentTime+dur+0.2)
      activeOscs.push(osc)
      osc.onended = ()=>{ activeOscs = activeOscs.filter(o=>o!==osc) }
    }
    const schedule = () => {
      const t = window.setTimeout(()=>{ hoot(); schedule() }, 3000+Math.random()*10000)
      timers.push(t)
    }
    schedule(); hoot()
    return {
      type:'owl', nodes:[],
      stop:()=>{ timers.forEach(t=>clearTimeout(t)); activeOscs.forEach(o=>{try{o.stop()}catch{}}) },
      setVolume:()=>{}
    }
  }

  // ================================================================
  // 心跳
  // ================================================================
  function heartbeat(v: number): SoundController {
    const bpm = 60; const beatDur = 60/bpm
    const sr = ac.sampleRate
    const buf = ac.createBuffer(1, Math.floor(sr*beatDur), sr)
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) {
      const t = i/sr
      const t1 = t-0.02; const p1 = t1>0 ? Math.exp(-t1*12)*Math.sin(t1*400) : 0
      const t2 = t-0.15; const p2 = t2>0 ? Math.exp(-t2*15)*Math.sin(t2*350)*0.6 : 0
      d[i] = (p1+p2)*0.6
    }
    const src = ac.createBufferSource(); src.buffer = buf; src.loop = true
    const lp = biquad(ac, 'lowpass', 200)
    const g = gainNode(ac, vol(v)*0.6)
    src.connect(lp); lp.connect(g); g.connect(master)
    src.start()
    return {
      type:'heartbeat', nodes:[src,lp,g],
      stop:()=>{try{src.stop()}catch{}},
      setVolume:(nv)=>g.gain.setTargetAtTime(vol(nv)*0.6, ac.currentTime, 0.1)
    }
  }

  // ================================================================
  // 双耳节拍
  // ================================================================
  function binaural(v: number, carrierFreq = 200, beatFreq = 4): SoundController {
    const vv = vol(v)
    const merger = ac.createChannelMerger(2)
    const oscL = ac.createOscillator(); oscL.type='sine'; oscL.frequency.value=carrierFreq
    const gL = gainNode(ac, vv*0.3); oscL.connect(gL); gL.connect(merger,0,0)
    const oscR = ac.createOscillator(); oscR.type='sine'; oscR.frequency.value=carrierFreq+beatFreq
    const gR = gainNode(ac, vv*0.3); oscR.connect(gR); gR.connect(merger,0,1)
    merger.connect(master)
    oscL.start(); oscR.start()
    return {
      type:'binaural', nodes:[oscL,gL,oscR,gR,merger],
      stop:()=>{try{oscL.stop();oscR.stop()}catch{}},
      setVolume:(nv)=>{
        const nv2=vol(nv)*0.3
        gL.gain.setTargetAtTime(nv2,ac.currentTime,0.1)
        gR.gain.setTargetAtTime(nv2,ac.currentTime,0.1)
      }
    }
  }

  // ================================================================
  // 颂钵
  // ================================================================
  function singingBowl(v: number): SoundController {
    const harmonics = [
      {f:220,a:1},{f:564,a:0.6},{f:1012,a:0.35},{f:1590,a:0.18},{f:2275,a:0.08}
    ]
    const dur = 15; const now = ac.currentTime
    let oscs: OscillatorNode[] = []
    harmonics.forEach(h=>{
      const osc = ac.createOscillator(); osc.type='sine'; osc.frequency.value=h.f
      osc.frequency.setTargetAtTime(h.f*0.998, now+dur, 3)
      const g = ac.createGain()
      g.gain.setValueAtTime(vol(v)*h.a*0.15, now)
      g.gain.exponentialRampToValueAtTime(0.0001, now+dur)
      osc.connect(g); g.connect(master)
      osc.start(now); osc.stop(now+dur+0.5)
      oscs.push(osc)
    })
    return {
      type:'singing_bowl', nodes:[],
      stop:()=>{ oscs.forEach(o=>{try{o.stop()}catch{}}) },
      setVolume:()=>{}
    }
  }

  function crystalBowl(v: number): SoundController {
    const harmonics = [
      {f:432,a:1},{f:864,a:0.5},{f:1296,a:0.3},{f:1728,a:0.15},{f:2160,a:0.06}
    ]
    const dur = 18; const now = ac.currentTime
    let oscs: OscillatorNode[] = []
    harmonics.forEach(h=>{
      const osc = ac.createOscillator(); osc.type='sine'; osc.frequency.value=h.f
      const g = ac.createGain()
      g.gain.setValueAtTime(vol(v)*h.a*0.12, now)
      g.gain.exponentialRampToValueAtTime(0.0001, now+dur)
      osc.connect(g); g.connect(master)
      osc.start(now); osc.stop(now+dur+0.5)
      oscs.push(osc)
    })
    return {
      type:'crystal_bowl', nodes:[],
      stop:()=>{ oscs.forEach(o=>{try{o.stop()}catch{}}) },
      setVolume:()=>{}
    }
  }

  // ================================================================
  // Solfeggio 频率
  // ================================================================
  function solfeggio(v: number, freq = 528): SoundController {
    const vv = vol(v)
    const osc = ac.createOscillator(); osc.type='sine'; osc.frequency.value=freq
    const g = gainNode(ac, vv * 0.2)
    // 添加轻微谐波
    const osc2 = ac.createOscillator(); osc2.type='sine'; osc2.frequency.value=freq*2
    const g2 = gainNode(ac, vv * 0.04)
    osc.connect(g); g.connect(master)
    osc2.connect(g2); g2.connect(master)
    osc.start(); osc2.start()
    return {
      type:'solfeggio', nodes:[osc,g,osc2,g2],
      stop:()=>{try{osc.stop();osc2.stop()}catch{}},
      setVolume:(nv)=>{
        const nv2=vol(nv)
        g.gain.setTargetAtTime(nv2*0.2, ac.currentTime, 0.1)
        g2.gain.setTargetAtTime(nv2*0.04, ac.currentTime, 0.1)
      }
    }
  }

  // ================================================================
  // 等时脉冲
  // ================================================================
  function isochronic(v: number, freq = 10): SoundController {
    const vv = vol(v)
    const osc = ac.createOscillator(); osc.type='sine'; osc.frequency.value=200
    // 用第二个振荡器做调幅
    const modOsc = ac.createOscillator(); modOsc.type='square'; modOsc.frequency.value=freq
    const modG = ac.createGain(); modG.gain.value = vv * 0.25
    const outG = gainNode(ac, 1)
    osc.connect(outG)
    modOsc.connect(modG); modG.connect(outG.gain)
    outG.connect(master)
    osc.start(); modOsc.start()
    return {
      type:'isochronic', nodes:[osc,modOsc,modG,outG],
      stop:()=>{try{osc.stop();modOsc.stop()}catch{}},
      setVolume:(nv)=>{ modG.gain.setTargetAtTime(vol(nv)*0.25, ac.currentTime, 0.1) }
    }
  }

  // ================================================================
  // 机械声
  // ================================================================
  function fan(v: number): SoundController {
    const vv = vol(v)
    const osc = ac.createOscillator(); osc.type='sine'; osc.frequency.value=120
    const oscG = gainNode(ac, vv*0.08)
    const src = createLooper(ac, b.white)
    const lp = biquad(ac, 'lowpass', 500)
    const noiseG = gainNode(ac, vv*0.2)
    osc.connect(oscG); oscG.connect(master)
    src.connect(lp); lp.connect(noiseG); noiseG.connect(master)
    osc.start(); src.start()
    return {
      type:'fan', nodes:[osc,oscG,src,lp,noiseG],
      stop:()=>{try{osc.stop();src.stop()}catch{}},
      setVolume:(nv)=>{
        const nv2=vol(nv)
        oscG.gain.setTargetAtTime(nv2*0.08,ac.currentTime,0.1)
        noiseG.gain.setTargetAtTime(nv2*0.2,ac.currentTime,0.1)
      }
    }
  }

  function acHum(v: number): SoundController {
    const vv = vol(v)
    const osc = ac.createOscillator(); osc.type='sine'; osc.frequency.value=55
    const osc2 = ac.createOscillator(); osc2.type='sine'; osc2.frequency.value=110
    const oscG = gainNode(ac, vv*0.06)
    const src = createLooper(ac, b.white)
    const lp = biquad(ac, 'lowpass', 300)
    const noiseG = gainNode(ac, vv*0.15)
    osc.connect(oscG); osc2.connect(oscG)
    oscG.connect(master)
    src.connect(lp); lp.connect(noiseG); noiseG.connect(master)
    osc.start(); osc2.start(); src.start()
    return {
      type:'ac_hum', nodes:[osc,osc2,oscG,src,lp,noiseG],
      stop:()=>{try{osc.stop();osc2.stop();src.stop()}catch{}},
      setVolume:(nv)=>{
        const nv2=vol(nv)
        oscG.gain.setTargetAtTime(nv2*0.06,ac.currentTime,0.1)
        noiseG.gain.setTargetAtTime(nv2*0.15,ac.currentTime,0.1)
      }
    }
  }

  function train(v: number): SoundController {
    const vv = vol(v)
    // 铁轨规律声
    const src1 = createLooper(ac, b.brown)
    const lp1 = biquad(ac, 'lowpass', 200)
    const g1 = gainNode(ac, vv*0.3)
    // 火车节奏调制
    const { osc:modOsc, gain:modG } = lfo(ac, 1.2, 'sine', 0.3)
    modG.connect(g1.gain)
    // 高频铁轨摩擦
    const src2 = createLooper(ac, b.white)
    const hp = biquad(ac, 'highpass', 2500)
    const g2 = gainNode(ac, vv*0.08)

    src1.connect(lp1); lp1.connect(g1); g1.connect(master)
    src2.connect(hp); hp.connect(g2); g2.connect(master)
    src1.start(); src2.start()

    return {
      type:'train', nodes:[src1,lp1,g1,modOsc,modG, src2,hp,g2],
      stop:()=>{try{src1.stop();src2.stop();modOsc.stop()}catch{}},
      setVolume:(nv)=>{
        const nv2=vol(nv)
        g1.gain.setTargetAtTime(nv2*0.3,ac.currentTime,0.15)
        g2.gain.setTargetAtTime(nv2*0.08,ac.currentTime,0.15)
      }
    }
  }

  function airplane(v: number): SoundController {
    const vv = vol(v)
    const src = createLooper(ac, b.white)
    const bp = biquad(ac, 'bandpass', 400, 0.3)
    const g = gainNode(ac, vv*0.4)
    const { osc, gain:lg } = lfo(ac, 0.04, 'sine', 0.1)
    lg.connect(g.gain)
    src.connect(bp); bp.connect(g); g.connect(master)
    src.start()
    return {
      type:'airplane', nodes:[src,bp,g,osc,lg],
      stop:()=>{try{src.stop();osc.stop()}catch{}},
      setVolume:(nv)=>g.gain.setTargetAtTime(vol(nv)*0.4,ac.currentTime,0.15)
    }
  }

  function coffeeShop(v: number): SoundController {
    const vv = vol(v)
    // 人声低语：带通噪声
    const src1 = createLooper(ac, b.pink)
    const bp = biquad(ac, 'bandpass', 800, 0.3)
    const g1 = gainNode(ac, vv*0.12)
    // 杯碟碰击：偶尔高频
    const src2 = createLooper(ac, b.white)
    const hp = biquad(ac, 'highpass', 3000)
    const g2 = gainNode(ac, vv*0.05)
    // 低频嗡嗡
    const src3 = createLooper(ac, b.brown)
    const lp = biquad(ac, 'lowpass', 200)
    const g3 = gainNode(ac, vv*0.08)

    src1.connect(bp); bp.connect(g1); g1.connect(master)
    src2.connect(hp); hp.connect(g2); g2.connect(master)
    src3.connect(lp); lp.connect(g3); g3.connect(master)
    src1.start(); src2.start(); src3.start()

    return {
      type:'coffee_shop', nodes:[src1,bp,g1, src2,hp,g2, src3,lp,g3],
      stop:()=>{try{src1.stop();src2.stop();src3.stop()}catch{}},
      setVolume:(nv)=>{
        const nv2=vol(nv)
        g1.gain.setTargetAtTime(nv2*0.12,ac.currentTime,0.15)
        g2.gain.setTargetAtTime(nv2*0.05,ac.currentTime,0.15)
        g3.gain.setTargetAtTime(nv2*0.08,ac.currentTime,0.15)
      }
    }
  }

  // ================================================================
  // 组合场景
  // ================================================================
  function forestDay(v: number): SoundController {
    const wind = windTrees(v*0.7)
    const birds = birdsForest(v*0.6)
    // 树叶沙沙
    const leafSrc = createLooper(ac, b.white)
    const leafHp = biquad(ac, 'highpass', 2500, 0.3)
    const leafG = gainNode(ac, vol(v)*0.05)
    const { osc, gain:lg } = lfo(ac, 0.5, 'sine', 0.3)
    lg.connect(leafG.gain)
    leafSrc.connect(leafHp); leafHp.connect(leafG); leafG.connect(master)
    leafSrc.start()
    return {
      type:'forest_day', nodes:[osc,lg,leafSrc,leafHp,leafG],
      subSounds:[wind,birds],
      stop:()=>{
        wind.stop(); birds.stop()
        try{leafSrc.stop();osc.stop()}catch{}
      },
      setVolume:(nv)=>{
        wind.setVolume(nv*0.7); birds.setVolume(nv*0.6)
        leafG.gain.setTargetAtTime(vol(nv)*0.05,ac.currentTime,0.15)
      }
    }
  }

  function forestNight(v: number): SoundController {
    const cric = crickets(v*0.7)
    const ow = owl(v*0.5)
    const wind = windBreeze(v*0.3)
    return {
      type:'forest_night', nodes:[], subSounds:[cric,ow,wind],
      stop:()=>{ cric.stop(); ow.stop(); wind.stop() },
      setVolume:(nv)=>{
        cric.setVolume(nv*0.7); ow.setVolume(nv*0.5); wind.setVolume(nv*0.3)
      }
    }
  }

  function beach(v: number): SoundController {
    const ocean = oceanGentle(v*0.8)
    const wind = windBreeze(v*0.3)
    return {
      type:'beach', nodes:[], subSounds:[ocean,wind],
      stop:()=>{ ocean.stop(); wind.stop() },
      setVolume:(nv)=>{
        ocean.setVolume(nv*0.8); wind.setVolume(nv*0.3)
      }
    }
  }

  function jungle(v: number): SoundController {
    const rain = rainLeaves(v*0.6)
    const birds = birdsForest(v*0.3)
    const cric = crickets(v*0.4)
    return {
      type:'jungle', nodes:[], subSounds:[rain,birds,cric],
      stop:()=>{ rain.stop(); birds.stop(); cric.stop() },
      setVolume:(nv)=>{
        rain.setVolume(nv*0.6); birds.setVolume(nv*0.3); cric.setVolume(nv*0.4)
      }
    }
  }

  function mountain(v: number): SoundController {
    const wind = windStrong(v*0.5)
    const streamSnd = stream(v*0.3)
    return {
      type:'mountain', nodes:[], subSounds:[wind,streamSnd],
      stop:()=>{ wind.stop(); streamSnd.stop() },
      setVolume:(nv)=>{
        wind.setVolume(nv*0.5); streamSnd.setVolume(nv*0.3)
      }
    }
  }

  function cityRain(v: number): SoundController {
    const rain = rainWindow(v*0.8)
    // 城市低频
    const src = createLooper(ac, b.brown)
    const lp = biquad(ac, 'lowpass', 100, 0.3)
    const g = gainNode(ac, vol(v)*0.08)
    src.connect(lp); lp.connect(g); g.connect(master)
    src.start()
    return {
      type:'city_rain', nodes:[src,lp,g], subSounds:[rain],
      stop:()=>{ rain.stop(); try{src.stop()}catch{} },
      setVolume:(nv)=>{
        rain.setVolume(nv*0.8)
        g.gain.setTargetAtTime(vol(nv)*0.08,ac.currentTime,0.15)
      }
    }
  }

  function cozyCabin(v: number): SoundController {
    const fire = fireFireplace(v*0.7)
    const rain = rainWindow(v*0.4)
    const w = windBreeze(v*0.2)
    return {
      type:'cozy_cabin', nodes:[], subSounds:[fire,rain,w],
      stop:()=>{ fire.stop(); rain.stop(); w.stop() },
      setVolume:(nv)=>{
        fire.setVolume(nv*0.7); rain.setVolume(nv*0.4); w.setVolume(nv*0.2)
      }
    }
  }

  function stormNight(v: number): SoundController {
    const rain = rainHeavy(v*0.7)
    const wind = windStrong(v*0.5)
    const thunder = thunderClose(v*0.6)
    return {
      type:'storm_night', nodes:[], subSounds:[rain,wind,thunder],
      stop:()=>{ rain.stop(); wind.stop(); thunder.stop() },
      setVolume:(nv)=>{
        rain.setVolume(nv*0.7); wind.setVolume(nv*0.5)
      }
    }
  }

  // ================================================================
  // 导出映射
  // ================================================================
  const generatorMap: Record<SoundType, (v:number) => SoundController> = {
    white:whiteNoise, pink:pinkNoise, brown:brownNoise, blue:blueNoise, violet:violetNoise,
    rain_gentle:rainGentle, rain_moderate:rainModerate, rain_heavy:rainHeavy,
    rain_window:rainWindow, rain_leaves:rainLeaves,
    ocean_gentle:oceanGentle, ocean_storm:oceanStorm,
    stream, waterfall, river, lake,
    wind_breeze:windBreeze, wind_strong:windStrong, wind_trees:windTrees, wind_desert:windDesert,
    thunder_distant:thunderDistant, thunder_close:thunderClose,
    fire_campfire:fireCampfire, fire_fireplace:fireFireplace, fire_bonfire:fireBonfire,
    birds_forest:birdsForest, birds_garden:birdsGarden, crickets, owl,
    heartbeat,
    binaural, singing_bowl:singingBowl, crystal_bowl:crystalBowl, solfeggio, isochronic,
    fan, ac_hum:acHum, train, airplane, coffee_shop:coffeeShop,
    forest_day:forestDay, forest_night:forestNight, beach, jungle, mountain,
    city_rain:cityRain, cozy_cabin:cozyCabin, storm_night:stormNight,
    custom: ()=>null as unknown as SoundController,
  }

  return generatorMap
}

export { makeGen }
export default makeGen
