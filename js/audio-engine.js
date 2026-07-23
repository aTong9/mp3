/* ========================================
   Audio Engine - Web Audio API 程序化声音合成
   ======================================== */

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.activeSounds = new Map(); // id -> { type, stop, setVolume, nodes }
    this.noiseBuffers = {};
    this._initialized = false;
  }

  /** 初始化 AudioContext（需用户交互后调用） */
  async init() {
    if (this._initialized) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.8;
    this.masterGain.connect(this.ctx.destination);
    this._generateNoiseBuffers();
    this._initialized = true;
  }

  /** 恢复被浏览器挂起的 AudioContext */
  async resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    if (!this._initialized) await this.init();
  }

  get isInitialized() { return this._initialized; }

  // =============================================
  // 噪声缓冲区生成
  // =============================================
  _generateNoiseBuffers() {
    const sr = this.ctx.sampleRate;
    const dur = 4;

    // --- 白噪声 ---
    const wb = this.ctx.createBuffer(1, sr * dur, sr);
    const wd = wb.getChannelData(0);
    for (let i = 0; i < wd.length; i++) wd[i] = Math.random() * 2 - 1;
    this.noiseBuffers.white = wb;

    // --- 粉红噪声 (Paul Kellet refined) ---
    const pb = this.ctx.createBuffer(1, sr * dur, sr);
    const pd = pb.getChannelData(0);
    let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
    for (let i = 0; i < pd.length; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886*b0 + w*0.0555179;
      b1 = 0.99332*b1 + w*0.0750759;
      b2 = 0.96900*b2 + w*0.1538520;
      b3 = 0.86650*b3 + w*0.3104856;
      b4 = 0.55000*b4 + w*0.5329522;
      b5 = -0.7616*b5 - w*0.0168980;
      pd[i] = (b0+b1+b2+b3+b4+b5+b6+w*0.5362) * 0.11;
      b6 = w * 0.115926;
    }
    this.noiseBuffers.pink = pb;

    // --- 布朗噪声 ---
    const bb = this.ctx.createBuffer(1, sr * dur, sr);
    const bd = bb.getChannelData(0);
    let lo = 0;
    for (let i = 0; i < bd.length; i++) {
      const w = Math.random() * 2 - 1;
      bd[i] = (lo + 0.02*w) / 1.02;
      lo = bd[i];
      bd[i] *= 3.5;
    }
    this.noiseBuffers.brown = bb;
  }

  // =============================================
  // 工具方法
  // =============================================
  _createBS(buffer) {
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    return src;
  }

  _createGain(val = 0.5) {
    const g = this.ctx.createGain();
    g.gain.value = val;
    return g;
  }

  _fadeIn(gNode, target, time = 0.8) {
    gNode.gain.setTargetAtTime(target, this.ctx.currentTime, time);
  }

  _fadeOut(gNode, time = 0.5) {
    gNode.gain.setTargetAtTime(0, this.ctx.currentTime, time);
  }

  /** 解析音量值（0-100 => 0-1） */
  _vol(v) { return Math.max(0, Math.min(1, (v ?? 50) / 100)); }

  // =============================================
  // 声音生成器
  // =============================================

  /** 白噪声 - 风扇/空调基础音 */
  createWhiteNoise(vol = 50) {
    const src = this._createBS(this.noiseBuffers.white);
    const gain = this._createGain(this._vol(vol) * 0.35);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 4000;
    filter.Q.value = 0.7;

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start();

    return {
      type: 'white',
      nodes: [src, filter, gain],
      stop: () => { try { src.stop(); } catch(e){} },
      setVolume: (v) => { gain.gain.setTargetAtTime(this._vol(v) * 0.35, this.ctx.currentTime, 0.1); }
    };
  }

  /** 粉红噪声 - 雨声、瀑布基础 */
  createPinkNoise(vol = 50) {
    const src = this._createBS(this.noiseBuffers.pink);
    const gain = this._createGain(this._vol(vol) * 0.4);
    src.connect(gain);
    gain.connect(this.masterGain);
    src.start();

    return {
      type: 'pink',
      nodes: [src, gain],
      stop: () => { try { src.stop(); } catch(e){} },
      setVolume: (v) => { gain.gain.setTargetAtTime(this._vol(v) * 0.4, this.ctx.currentTime, 0.1); }
    };
  }

  /** 布朗噪声 - 深眠低音 */
  createBrownNoise(vol = 50) {
    const src = this._createBS(this.noiseBuffers.brown);
    const gain = this._createGain(this._vol(vol) * 0.5);
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 300;
    lp.Q.value = 0.5;

    src.connect(lp);
    lp.connect(gain);
    gain.connect(this.masterGain);
    src.start();

    return {
      type: 'brown',
      nodes: [src, lp, gain],
      stop: () => { try { src.stop(); } catch(e){} },
      setVolume: (v) => { gain.gain.setTargetAtTime(this._vol(v) * 0.5, this.ctx.currentTime, 0.1); }
    };
  }

  /** 雨声 */
  createRain(vol = 50) {
    const v = this._vol(vol);

    // 底层：布朗噪声高通 → 雨的基础沙沙声
    const src1 = this._createBS(this.noiseBuffers.brown);
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 600;
    hp.Q.value = 0.4;
    const gain1 = this._createGain(v * 0.25);

    // 上层：粉红噪声带通 → 雨滴质感
    const src2 = this._createBS(this.noiseBuffers.pink);
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 2500;
    bp.Q.value = 0.25;
    const gain2 = this._createGain(v * 0.12);

    src1.connect(hp); hp.connect(gain1); gain1.connect(this.masterGain);
    src2.connect(bp); bp.connect(gain2); gain2.connect(this.masterGain);
    src1.start(); src2.start();

    return {
      type: 'rain',
      nodes: [src1, hp, gain1, src2, bp, gain2],
      stop: () => { try { src1.stop(); src2.stop(); } catch(e){} },
      setVolume: (nv) => {
        const nv2 = this._vol(nv);
        gain1.gain.setTargetAtTime(nv2 * 0.25, this.ctx.currentTime, 0.1);
        gain2.gain.setTargetAtTime(nv2 * 0.12, this.ctx.currentTime, 0.1);
      }
    };
  }

  /** 海浪声 */
  createOceanWaves(vol = 50) {
    const v = this._vol(vol);
    const src = this._createBS(this.noiseBuffers.brown);
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 400;
    lp.Q.value = 0.3;
    const gain = this._createGain(v * 0.45);

    // LFO 模拟潮汐节奏
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 0.25;
    lfo.frequency.value = 0.12; // ~8秒周期
    lfo.type = 'sine';
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    lfo.start();

    src.connect(lp); lp.connect(gain); gain.connect(this.masterGain);
    src.start();

    return {
      type: 'ocean',
      nodes: [src, lp, gain, lfo, lfoGain],
      stop: () => { try { src.stop(); lfo.stop(); } catch(e){} },
      setVolume: (nv) => {
        gain.gain.setTargetAtTime(this._vol(nv) * 0.45, this.ctx.currentTime, 0.2);
      }
    };
  }

  /** 风声 */
  createWind(vol = 50) {
    const v = this._vol(vol);
    const src = this._createBS(this.noiseBuffers.pink);
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 500;
    lp.Q.value = 0.5;
    const gain = this._createGain(v * 0.35);

    // LFO 模拟阵风
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 0.2;
    lfo.frequency.value = 0.08;
    lfo.type = 'sine';
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    lfo.start();

    // 第二个 LFO 调制滤波器频率
    const lfo2 = this.ctx.createOscillator();
    const lfo2Gain = this.ctx.createGain();
    lfo2Gain.gain.value = 200;
    lfo2.frequency.value = 0.15;
    lfo2.type = 'triangle';
    lfo2.connect(lfo2Gain);
    lfo2Gain.connect(lp.frequency);
    lfo2.start();

    src.connect(lp); lp.connect(gain); gain.connect(this.masterGain);
    src.start();

    return {
      type: 'wind',
      nodes: [src, lp, gain, lfo, lfoGain, lfo2, lfo2Gain],
      stop: () => { try { src.stop(); lfo.stop(); lfo2.stop(); } catch(e){} },
      setVolume: (nv) => {
        gain.gain.setTargetAtTime(this._vol(nv) * 0.35, this.ctx.currentTime, 0.2);
      }
    };
  }

  /** 雷声（间歇性） */
  createThunder(vol = 50) {
    const v = this._vol(vol);
    let timerId;
    let activeSources = [];

    const playRumble = () => {
      const dur = 1.5 + Math.random() * 3;
      const sr = this.ctx.sampleRate;
      const buf = this.ctx.createBuffer(1, Math.floor(sr * dur), sr);
      const data = buf.getChannelData(0);

      // 生成低频隆隆声
      let lo = 0;
      for (let i = 0; i < data.length; i++) {
        const w = Math.random() * 2 - 1;
        data[i] = (lo + 0.005*w) / 1.005;
        lo = data[i];
        data[i] *= 2;
        // 包络
        const env = Math.exp(-i / (sr * 1.2)) * (1 - Math.exp(-i / (sr * 0.05)));
        data[i] *= env;
      }

      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 80 + Math.random() * 60;
      const gain = this._createGain(v * (0.5 + Math.random() * 0.5));
      src.connect(lp); lp.connect(gain); gain.connect(this.masterGain);
      src.start();
      activeSources.push(src);
      src.onended = () => {
        activeSources = activeSources.filter(s => s !== src);
      };
    };

    // 随机触发雷声
    const scheduleNext = () => {
      const delay = 4000 + Math.random() * 12000;
      timerId = setTimeout(() => {
        playRumble();
        scheduleNext();
      }, delay);
    };
    scheduleNext();
    playRumble(); // 立即来一声

    return {
      type: 'thunder',
      nodes: [],
      stop: () => {
        clearTimeout(timerId);
        activeSources.forEach(s => { try { s.stop(); } catch(e){} });
        activeSources = [];
      },
      setVolume: (nv) => {} // 下一声会使用新音量
    };
  }

  /** 篝火噼啪声 */
  createFireCrackling(vol = 50) {
    const v = this._vol(vol);

    // 底层：低频隆隆声
    const src1 = this._createBS(this.noiseBuffers.brown);
    const lp1 = this.ctx.createBiquadFilter();
    lp1.type = 'lowpass';
    lp1.frequency.value = 100;
    const gain1 = this._createGain(v * 0.25);

    // 噼啪层：高频噪声快速调制
    const src2 = this._createBS(this.noiseBuffers.white);
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 1500;
    const gain2 = this._createGain(v * 0.15);

    // LFO 模拟火焰跳动
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 0.15;
    lfo.frequency.value = 3; // 3Hz 快速跳动
    lfo.type = 'triangle';
    lfo.connect(lfoGain);
    lfoGain.connect(gain2.gain);
    lfo.start();

    src1.connect(lp1); lp1.connect(gain1); gain1.connect(this.masterGain);
    src2.connect(hp); hp.connect(gain2); gain2.connect(this.masterGain);
    src1.start(); src2.start();

    return {
      type: 'fire',
      nodes: [src1, lp1, gain1, src2, hp, gain2, lfo, lfoGain],
      stop: () => { try { src1.stop(); src2.stop(); lfo.stop(); } catch(e){} },
      setVolume: (nv) => {
        const nv2 = this._vol(nv);
        gain1.gain.setTargetAtTime(nv2 * 0.25, this.ctx.currentTime, 0.1);
        gain2.gain.setTargetAtTime(nv2 * 0.15, this.ctx.currentTime, 0.1);
      }
    };
  }

  /** 风扇/空调声 */
  createFan(vol = 50) {
    const v = this._vol(vol);

    // 低频持续嗡声
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 120;
    const oscGain = this._createGain(v * 0.08);

    // 噪声层
    const src = this._createBS(this.noiseBuffers.white);
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 600;
    const noiseGain = this._createGain(v * 0.2);

    osc.connect(oscGain); oscGain.connect(this.masterGain);
    src.connect(lp); lp.connect(noiseGain); noiseGain.connect(this.masterGain);
    osc.start(); src.start();

    return {
      type: 'fan',
      nodes: [osc, oscGain, src, lp, noiseGain],
      stop: () => { try { osc.stop(); src.stop(); } catch(e){} },
      setVolume: (nv) => {
        const nv2 = this._vol(nv);
        oscGain.gain.setTargetAtTime(nv2 * 0.08, this.ctx.currentTime, 0.1);
        noiseGain.gain.setTargetAtTime(nv2 * 0.2, this.ctx.currentTime, 0.1);
      }
    };
  }

  /** 心跳声 */
  createHeartbeat(vol = 50) {
    const v = this._vol(vol);
    const sr = this.ctx.sampleRate;
    const bpm = 60;
    const beatDur = 60 / bpm;
    const bufLen = Math.floor(sr * beatDur);
    const buf = this.ctx.createBuffer(1, bufLen, sr);
    const data = buf.getChannelData(0);

    // 双脉冲模拟心跳
    for (let i = 0; i < bufLen; i++) {
      const t = i / sr;
      // 第一跳
      const t1 = t - 0.02;
      const p1 = t1 > 0 ? Math.exp(-t1 * 12) * Math.sin(t1 * 400) : 0;
      // 第二跳（稍弱）
      const t2 = t - 0.15;
      const p2 = t2 > 0 ? Math.exp(-t2 * 15) * Math.sin(t2 * 350) * 0.6 : 0;
      data[i] = (p1 + p2) * 0.6;
    }

    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 200;
    const gain = this._createGain(v * 0.6);
    src.connect(lp); lp.connect(gain); gain.connect(this.masterGain);
    src.start();

    return {
      type: 'heartbeat',
      nodes: [src, lp, gain],
      stop: () => { try { src.stop(); } catch(e){} },
      setVolume: (nv) => {
        gain.gain.setTargetAtTime(this._vol(nv) * 0.6, this.ctx.currentTime, 0.1);
      }
    };
  }

  /** 鸟鸣声 */
  createBirds(vol = 50) {
    const v = this._vol(vol);
    let timers = [];
    let activeOscs = [];

    const chirp = () => {
      const dur = 0.08 + Math.random() * 0.2;
      const freq = 2500 + Math.random() * 3000;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * (0.8 + Math.random() * 0.4), this.ctx.currentTime + dur);

      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0, this.ctx.currentTime);
      g.gain.linearRampToValueAtTime(v * 0.04, this.ctx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);

      const hp = this.ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 2000;

      osc.connect(hp); hp.connect(g); g.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + dur);
      activeOscs.push(osc);
      osc.onended = () => { activeOscs = activeOscs.filter(o => o !== osc); };
    };

    const scheduleChirps = () => {
      const delay = 200 + Math.random() * 1500;
      const timer = setTimeout(() => {
        chirp();
        // 有时连续叫几声
        if (Math.random() > 0.4) {
          setTimeout(chirp, 80 + Math.random() * 200);
        }
        scheduleChirps();
      }, delay);
      timers.push(timer);
    };
    scheduleChirps();
    chirp();

    return {
      type: 'birds',
      nodes: [],
      stop: () => {
        timers.forEach(t => clearTimeout(t));
        timers = [];
        activeOscs.forEach(o => { try { o.stop(); } catch(e){} });
        activeOscs = [];
      },
      setVolume: (nv) => { /* 下一次鸟鸣使用新音量 */ }
    };
  }

  /** 双耳节拍 */
  createBinauralBeats(freq = 200, beatFreq = 4, vol = 50) {
    const v = this._vol(vol);

    const merger = this.ctx.createChannelMerger(2);

    // 左耳
    const oscL = this.ctx.createOscillator();
    oscL.type = 'sine';
    oscL.frequency.value = freq;
    const gainL = this._createGain(v * 0.3);
    oscL.connect(gainL);
    gainL.connect(merger, 0, 0);

    // 右耳（频率略高，产生节拍感）
    const oscR = this.ctx.createOscillator();
    oscR.type = 'sine';
    oscR.frequency.value = freq + beatFreq;
    const gainR = this._createGain(v * 0.3);
    oscR.connect(gainR);
    gainR.connect(merger, 0, 1);

    merger.connect(this.masterGain);
    oscL.start(); oscR.start();

    return {
      type: 'binaural',
      nodes: [oscL, gainL, oscR, gainR, merger],
      freq, beatFreq,
      stop: () => { try { oscL.stop(); oscR.stop(); } catch(e){} },
      setVolume: (nv) => {
        const nv2 = this._vol(nv) * 0.3;
        gainL.gain.setTargetAtTime(nv2, this.ctx.currentTime, 0.1);
        gainR.gain.setTargetAtTime(nv2, this.ctx.currentTime, 0.1);
      },
      setFrequency: (newFreq) => {
        oscL.frequency.setTargetAtTime(newFreq, this.ctx.currentTime, 0.1);
        oscR.frequency.setTargetAtTime(newFreq + beatFreq, this.ctx.currentTime, 0.1);
      },
      setBeatFrequency: (newBeat) => {
        const cf = oscL.frequency.value;
        oscR.frequency.setTargetAtTime(cf + newBeat, this.ctx.currentTime, 0.1);
      }
    };
  }

  /** 西藏颂钵 */
  createTibetanBowl(vol = 50) {
    const v = this._vol(vol);
    const dur = 15;
    const harmonics = [
      { freq: 220, amp: 1.0 },
      { freq: 564, amp: 0.6 },
      { freq: 1012, amp: 0.35 },
      { freq: 1590, amp: 0.18 },
      { freq: 2275, amp: 0.08 },
    ];

    let activeOscs = [];
    const now = this.ctx.currentTime;

    harmonics.forEach(h => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = h.freq;
      osc.frequency.setTargetAtTime(h.freq * 0.998, now + dur, 3);

      const g = this.ctx.createGain();
      g.gain.setValueAtTime(v * h.amp * 0.15, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + dur + 0.5);
      activeOscs.push(osc);
    });

    return {
      type: 'bowl',
      nodes: [],
      stop: () => {
        activeOscs.forEach(o => { try { o.stop(); } catch(e){} });
        activeOscs = [];
      },
      setVolume: (nv) => { /* 颂钵是一次性的，不支持音量调节 */ }
    };
  }

  /** 溪流声 */
  createStream(vol = 50) {
    const v = this._vol(vol);

    const src = this._createBS(this.noiseBuffers.pink);
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 900;
    hp.Q.value = 0.5;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 3000;
    bp.Q.value = 0.4;
    const gain = this._createGain(v * 0.28);

    // LFO 模拟水流变化
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 0.1;
    lfo.frequency.value = 0.5;
    lfo.type = 'sine';
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    lfo.start();

    src.connect(hp); hp.connect(bp); bp.connect(gain); gain.connect(this.masterGain);
    src.start();

    return {
      type: 'stream',
      nodes: [src, hp, bp, gain, lfo, lfoGain],
      stop: () => { try { src.stop(); lfo.stop(); } catch(e){} },
      setVolume: (nv) => {
        gain.gain.setTargetAtTime(this._vol(nv) * 0.28, this.ctx.currentTime, 0.15);
      }
    };
  }

  /** 森林氛围（鸟鸣 + 风声 + 树叶沙沙） */
  createForest(vol = 50) {
    const sounds = [];
    sounds.push(this.createWind(Math.min(vol * 0.6, 30)));
    sounds.push(this.createBirds(Math.min(vol * 0.5, 40)));
    // 树叶沙沙：高频白噪声
    const v2 = this._vol(vol);
    const src = this._createBS(this.noiseBuffers.white);
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 3000;
    const gain = this._createGain(v2 * 0.06);
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 0.4;
    lfo.frequency.value = 0.6;
    lfo.type = 'sine';
    lfo.connect(lfoGain); lfoGain.connect(gain.gain);
    lfo.start();
    src.connect(hp); hp.connect(gain); gain.connect(this.masterGain);
    src.start();

    const leafNodes = [src, hp, gain, lfo, lfoGain];

    return {
      type: 'forest',
      nodes: [],
      _subSounds: sounds,
      _leafNodes: leafNodes,
      stop: () => {
        sounds.forEach(s => { try { s.stop(); } catch(e){} });
        try { src.stop(); lfo.stop(); } catch(e) {}
      },
      setVolume: (nv) => {
        const nv2 = this._vol(nv);
        sounds.forEach(s => { try { s.setVolume(nv * 0.6); } catch(e){} });
        gain.gain.setTargetAtTime(nv2 * 0.06, this.ctx.currentTime, 0.15);
      }
    };
  }

  /** 雨声+雷声 */
  createRainWithThunder(vol = 50) {
    const rain = this.createRain(vol);
    const thunder = this.createThunder(Math.min(vol * 0.8, 40));
    return {
      type: 'rainthunder',
      nodes: [],
      _subSounds: [rain, thunder],
      stop: () => { rain.stop(); thunder.stop(); },
      setVolume: (nv) => {
        rain.setVolume(nv);
      }
    };
  }

  /** 篝火营地 */
  createCampfire(vol = 50) {
    const fire = this.createFireCrackling(vol);

    // 添加轻微的风声
    const v2 = this._vol(vol);
    const src = this._createBS(this.noiseBuffers.pink);
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 300;
    const gain = this._createGain(v2 * 0.08);
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 0.2;
    lfo.frequency.value = 0.05;
    lfo.connect(lfoGain); lfoGain.connect(gain.gain);
    lfo.start();
    src.connect(lp); lp.connect(gain); gain.connect(this.masterGain);
    src.start();

    return {
      type: 'campfire',
      nodes: [],
      _subSound: fire,
      _ambNodes: [src, lp, gain, lfo, lfoGain],
      stop: () => {
        fire.stop();
        try { src.stop(); lfo.stop(); } catch(e) {}
      },
      setVolume: (nv) => {
        fire.setVolume(nv);
        gain.gain.setTargetAtTime(this._vol(nv) * 0.08, this.ctx.currentTime, 0.15);
      }
    };
  }

  /** 钟声/音叉 */
  createChime(freq = 528, vol = 50) {
    const v = this._vol(vol);
    const dur = 8;
    const now = this.ctx.currentTime;
    const harms = [
      { f: freq, a: 1.0 },
      { f: freq * 2.76, a: 0.3 },
      { f: freq * 5.4, a: 0.12 },
    ];

    let activeOscs = [];
    harms.forEach(h => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = h.f;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(v * h.a * 0.12, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      osc.connect(g); g.connect(this.masterGain);
      osc.start(now); osc.stop(now + dur + 0.5);
      activeOscs.push(osc);
    });

    return {
      type: 'chime',
      nodes: [],
      stop: () => { activeOscs.forEach(o => { try { o.stop(); } catch(e){} }); },
      setVolume: () => {}
    };
  }

  /** 城市雨声（雨 + 远处交通低频） */
  createCityRain(vol = 50) {
    const rain = this.createRain(vol);
    const v2 = this._vol(vol);

    const src = this._createBS(this.noiseBuffers.brown);
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 120;
    const gain = this._createGain(v2 * 0.06);
    src.connect(lp); lp.connect(gain); gain.connect(this.masterGain);
    src.start();

    return {
      type: 'cityrain',
      nodes: [],
      _subSound: rain,
      _droneNodes: [src, lp, gain],
      stop: () => { rain.stop(); try { src.stop(); } catch(e){} },
      setVolume: (nv) => {
        rain.setVolume(nv);
        gain.gain.setTargetAtTime(this._vol(nv) * 0.06, this.ctx.currentTime, 0.15);
      }
    };
  }

  // =============================================
  // 公开接口
  // =============================================
  play(id, soundType, vol = 50, extra = {}) {
    if (this.activeSounds.has(id)) return null;

    let sound;
    switch (soundType) {
      case 'white':    sound = this.createWhiteNoise(vol); break;
      case 'pink':     sound = this.createPinkNoise(vol); break;
      case 'brown':    sound = this.createBrownNoise(vol); break;
      case 'rain':     sound = this.createRain(vol); break;
      case 'ocean':    sound = this.createOceanWaves(vol); break;
      case 'wind':     sound = this.createWind(vol); break;
      case 'thunder':  sound = this.createThunder(vol); break;
      case 'fire':     sound = this.createFireCrackling(vol); break;
      case 'fan':      sound = this.createFan(vol); break;
      case 'heartbeat':sound = this.createHeartbeat(vol); break;
      case 'birds':    sound = this.createBirds(vol); break;
      case 'stream':   sound = this.createStream(vol); break;
      case 'forest':   sound = this.createForest(vol); break;
      case 'rainthunder': sound = this.createRainWithThunder(vol); break;
      case 'campfire': sound = this.createCampfire(vol); break;
      case 'bowl':     sound = this.createTibetanBowl(vol); break;
      case 'chime':    sound = this.createChime(extra.freq || 528, vol); break;
      case 'cityrain': sound = this.createCityRain(vol); break;
      case 'binaural':
        sound = this.createBinauralBeats(extra.freq || 200, extra.beatFreq || 4, vol);
        break;
      default:
        console.warn(`Unknown sound type: ${soundType}`);
        return null;
    }

    this.activeSounds.set(id, sound);
    return sound;
  }

  stop(id) {
    const sound = this.activeSounds.get(id);
    if (!sound) return;
    try { sound.stop(); } catch (e) { /* ignore */ }
    this.activeSounds.delete(id);
  }

  setVolume(id, vol) {
    const sound = this.activeSounds.get(id);
    if (sound && sound.setVolume) {
      sound.setVolume(vol);
    }
  }

  setMasterVolume(vol) {
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this._vol(vol), this.ctx.currentTime, 0.1);
    }
  }

  stopAll() {
    this.activeSounds.forEach((sound) => {
      try { sound.stop(); } catch (e) { /* ignore */ }
    });
    this.activeSounds.clear();
  }

  getActiveCount() {
    return this.activeSounds.size;
  }

  getActiveIds() {
    return [...this.activeSounds.keys()];
  }

  destroy() {
    this.stopAll();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
    this._initialized = false;
  }
}

// 导出单例
window.AudioEngine = AudioEngine;
