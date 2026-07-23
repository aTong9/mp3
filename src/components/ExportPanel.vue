<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAudioStore } from '@/stores/audioStore'
import { downloadBlob } from '@/engine/AudioExporter'

const store = useAudioStore()
const visible = ref(false)
const title = ref('My ASMR Soundscape')
const duration = ref(600) // 10 分钟默认
const format = ref<'wav' | 'mp3'>('wav')
const sampleRate = ref<44100 | 48000>(48000)
const isExporting = ref(false)
const exportProgress = ref(0)

const durations = [
  { label: '5 分钟', val: 300 },
  { label: '10 分钟', val: 600 },
  { label: '30 分钟', val: 1800 },
  { label: '1 小时', val: 3600 },
  { label: '3 小时', val: 10800 },
  { label: '8 小时', val: 28800 },
]

const activeCount = computed(() => store.activeCount)

function open() { visible.value = true }
function close() { visible.value = false }

async function startExport() {
  if (activeCount.value === 0) {
    toast('请先选择至少一个声音')
    return
  }

  isExporting.value = true
  exportProgress.value = 0

  try {
    // 模拟进度更新
    const progressInterval = setInterval(() => {
      exportProgress.value = Math.min(exportProgress.value + Math.random() * 15, 90)
    }, 500)

    // 实际导出：录制 10 秒预览（完整时长导出需服务端）
    const actualDuration = Math.min(duration.value, 30) // 浏览器端限制30秒预览
    const buffer = await recordAudio(actualDuration)

    clearInterval(progressInterval)
    exportProgress.value = 100

    const blob = await bufferToWavBlob(buffer)
    const filename = `${title.value.replace(/\s+/g, '_')}_${sampleRate.value}Hz_${actualDuration}s.wav`
    downloadBlob(blob, filename)

    toast(`导出完成：${filename}（预览版 ${actualDuration}秒）`)

    // 提示完整版导出
    if (duration.value > 30) {
      setTimeout(() => {
        toast('提示：完整时长（' + formatDuration(duration.value) + '）音频请使用服务端批量导出', true)
      }, 2000)
    }
  } catch (e) {
    toast('导出失败，请重试')
    console.error(e)
  } finally {
    isExporting.value = false
    exportProgress.value = 0
  }
}

async function recordAudio(durSec: number): Promise<AudioBuffer> {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({
    sampleRate: sampleRate.value
  })
  // 简化：使用 OfflineAudioContext
  const offlineCtx = new OfflineAudioContext(2, durSec * sampleRate.value, sampleRate.value)

  // 创建主增益
  const masterGain = offlineCtx.createGain()
  masterGain.gain.value = store.masterVolume / 100
  masterGain.connect(offlineCtx.destination)

  // 为每个活跃声音创建播放（简化处理：生成粉色噪声作为代理）
  for (const [id, entry] of store.activeSounds) {
    const vol = entry.volume / 100
    // 创建噪声源（占位，实际应该使用各声音的精确模拟）
    const noiseLen = offlineCtx.sampleRate * 2
    const noiseBuf = offlineCtx.createBuffer(1, noiseLen, offlineCtx.sampleRate)
    const data = noiseBuf.getChannelData(0)
    // 粉红噪声
    let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0
    for (let i = 0; i < noiseLen; i++) {
      const w = Math.random()*2-1
      b0=0.99886*b0+w*0.0555179; b1=0.99332*b1+w*0.0750759
      b2=0.96900*b2+w*0.1538520; b3=0.86650*b3+w*0.3104856
      b4=0.55000*b4+w*0.5329522; b5=-0.7616*b5-w*0.0168980
      data[i]=(b0+b1+b2+b3+b4+b5+b6+w*0.5362)*0.11
      b6=w*0.115926
    }
    const src = offlineCtx.createBufferSource()
    src.buffer = noiseBuf; src.loop = true
    const gain = offlineCtx.createGain()
    gain.gain.value = vol * 0.15
    src.connect(gain); gain.connect(masterGain)
    src.start(0)
  }

  return await offlineCtx.startRendering()
}

async function bufferToWavBlob(buffer: AudioBuffer): Promise<Blob> {
  // 使用 OfflineAudioContext 生成的 buffer 直接编码
  const numChannels = buffer.numberOfChannels
  const channels: Float32Array[] = []
  for (let ch = 0; ch < numChannels; ch++) {
    channels.push(buffer.getChannelData(ch))
  }

  const bytesPerSample = 2 // 16-bit
  const dataSize = buffer.length * numChannels * bytesPerSample
  const headerSize = 44
  const arrayBuffer = new ArrayBuffer(headerSize + dataSize)
  const view = new DataView(arrayBuffer)

  const ws = (o: number, s: string) => { for (let i=0;i<s.length;i++) view.setUint8(o+i,s.charCodeAt(i)) }
  ws(0,'RIFF'); view.setUint32(4,36+dataSize,true); ws(8,'WAVE'); ws(12,'fmt ')
  view.setUint32(16,16,true); view.setUint16(20,1,true); view.setUint16(22,numChannels,true)
  view.setUint32(24,buffer.sampleRate,true); view.setUint32(28,buffer.sampleRate*numChannels*bytesPerSample,true)
  view.setUint16(32,numChannels*bytesPerSample,true); view.setUint16(34,16,true) // 16-bit
  ws(36,'data'); view.setUint32(40,dataSize,true)

  let off = 44
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const s = Math.max(-1, Math.min(1, channels[ch][i]))
      view.setInt16(off, s<0?s*0x8000:s*0x7FFF, true)
      off += 2
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' })
}

function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  if (h > 0) return `${h}小时${m}分钟`
  return `${m}分钟`
}

let toastTimer: ReturnType<typeof setTimeout> | null = null
function toast(msg: string, long = false) {
  const container = document.getElementById('toastContainer')
  if (!container) return
  const el = document.createElement('div')
  el.className = 'toast-item'
  el.textContent = msg
  container.appendChild(el)
  setTimeout(() => { if (el.parentNode) el.remove() }, long ? 5000 : 3000)
}

onMounted(() => window.addEventListener('open-export', open))
onUnmounted(() => window.removeEventListener('open-export', open))
</script>

<template>
  <div class="modal-overlay" :class="{ show: visible }" @click.self="close">
    <div class="modal export-modal">
      <div class="modal-header">
        <h3>导出音频文件</h3>
        <button class="modal-close" @click="close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="modal-body">
        <!-- 标题 -->
        <div class="form-group">
          <label>作品标题</label>
          <input v-model="title" type="text" placeholder="输入音频标题">
        </div>

        <!-- 当前混音 -->
        <div class="form-group">
          <label>当前混音（{{ activeCount }} 个声音）</label>
          <div class="active-sounds-list" v-if="activeCount > 0">
            <span v-for="s in [...store.activeSounds.values()]" :key="s.def.id" class="active-sound-tag">
              {{ s.def.icon }} {{ s.def.name }}
            </span>
          </div>
          <p v-else class="no-sounds">请先在主页选择要混音的声音</p>
        </div>

        <!-- 时长 -->
        <div class="form-group">
          <label>导出时长</label>
          <div class="duration-presets">
            <button
              v-for="d in durations" :key="d.val"
              class="dur-btn" :class="{ active: duration === d.val }"
              @click="duration = d.val"
            >{{ d.label }}</button>
          </div>
        </div>

        <!-- 格式和采样率 -->
        <div class="form-row">
          <div class="form-group">
            <label>格式</label>
            <select v-model="format">
              <option value="wav">WAV（无损）</option>
              <option value="mp3" disabled>MP3（需服务端）</option>
            </select>
          </div>
          <div class="form-group">
            <label>采样率</label>
            <select v-model="sampleRate">
              <option :value="44100">44.1 kHz</option>
              <option :value="48000">48 kHz</option>
            </select>
          </div>
        </div>

        <!-- 进度条 -->
        <div v-if="isExporting" class="progress-bar">
          <div class="progress-fill" :style="{ width: exportProgress + '%' }" />
          <span>{{ Math.round(exportProgress) }}%</span>
        </div>

        <!-- 按钮 -->
        <button class="export-btn" :disabled="isExporting || activeCount === 0" @click="startExport">
          <span v-if="isExporting">生成中...</span>
          <span v-else>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            导出 WAV 文件
          </span>
        </button>

        <p class="export-note">
          完整 8 小时长音频请使用服务端每日自动生成（命令：<code>npm run generate</code>）
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0; z-index: 200;
  background: rgba(0,0,0,0.7); backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center;
  opacity: 0; visibility: hidden; transition: 0.3s;
}
.modal-overlay.show { opacity: 1; visibility: visible; }
.modal {
  background: #111118; border: 1px solid #222230; border-radius: 16px;
  width: 90%; max-width: 480px; max-height: 85vh; overflow-y: auto;
  box-shadow: 0 8px 48px rgba(0,0,0,0.5);
  transform: translateY(10px); transition: transform 0.3s;
}
.modal-overlay.show .modal { transform: translateY(0); }
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 20px 14px;
}
.modal-header h3 { font-size: 1.05rem; font-weight: 600; }
.modal-close {
  display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border: none; border-radius: 50%;
  background: transparent; color: #8888a0; cursor: pointer; transition: 0.2s;
}
.modal-close:hover { background: #222230; color: #e8e8f0; }
.modal-body { padding: 0 20px 20px; display: flex; flex-direction: column; gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 0.78rem; color: #8888a0; font-weight: 500; }
.form-group input, .form-group select {
  padding: 9px 12px; border: 1px solid #222230; border-radius: 8px;
  background: #18181f; color: #e8e8f0; font-size: 0.9rem; font-family: inherit; outline: none;
}
.form-group input:focus, .form-group select:focus { border-color: #7c6ff7; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.duration-presets { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.dur-btn {
  padding: 8px 6px; border: 1px solid #222230; border-radius: 8px;
  background: #18181f; color: #8888a0; font-size: 0.78rem;
  cursor: pointer; transition: 0.2s; font-family: inherit;
}
.dur-btn:hover { border-color: #7c6ff7; color: #a89bf8; }
.dur-btn.active { border-color: #7c6ff7; color: #a89bf8; background: rgba(124,111,247,0.12); }
.active-sounds-list { display: flex; flex-wrap: wrap; gap: 6px; }
.active-sound-tag {
  padding: 4px 10px; background: rgba(124,111,247,0.1); border: 1px solid rgba(124,111,247,0.2);
  border-radius: 20px; font-size: 0.75rem; color: #a89bf8;
}
.no-sounds { font-size: 0.8rem; color: #555570; margin: 0; }
.progress-bar {
  height: 6px; background: #222230; border-radius: 3px; overflow: hidden; position: relative;
}
.progress-fill { height: 100%; background: linear-gradient(90deg, #7c6ff7, #4ade80); border-radius: 3px; transition: width 0.3s; }
.progress-bar span { position: absolute; right: 0; top: -18px; font-size: 0.7rem; color: #8888a0; }
.export-btn {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 12px; border: none; border-radius: 10px;
  background: #7c6ff7; color: white; font-size: 0.95rem; font-weight: 600;
  cursor: pointer; transition: 0.2s; font-family: inherit; width: 100%;
}
.export-btn:hover:not(:disabled) { background: #a89bf8; box-shadow: 0 4px 20px rgba(124,111,247,0.3); }
.export-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.export-note {
  font-size: 0.72rem; color: #555570; margin: 0; text-align: center;
}
.export-note code {
  padding: 2px 6px; background: #222230; border-radius: 4px; font-size: 0.75rem;
}
</style>
