<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useAudioStore } from '@/stores/audioStore'

const store = useAudioStore()
const visible = ref(false)
const customMinutes = ref(25)

const presets = [15, 30, 45, 60, 90, 120]

function open() { visible.value = true; if (store.isTimerActive) customMinutes.value = store.timerRemaining }
function close() { visible.value = false }

function setPreset(min: number) {
  if (min === 0) { store.clearTimer() }
  else { store.setTimer(min) }
  close()
}

function setCustom() {
  if (customMinutes.value > 0 && customMinutes.value <= 480) {
    store.setTimer(customMinutes.value)
    close()
  }
}

onMounted(() => window.addEventListener('open-timer', open))
onUnmounted(() => window.removeEventListener('open-timer', open))
</script>

<template>
  <div class="modal-overlay" :class="{ show: visible }" @click.self="close">
    <div class="modal">
      <div class="modal-header">
        <h3>定时关闭</h3>
        <button class="modal-close" @click="close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="modal-body">
        <div class="timer-presets">
          <button v-for="m in presets" :key="m" class="timer-preset" @click="setPreset(m)">
            {{ m >= 60 ? `${m/60} 小时` : `${m} 分钟` }}
          </button>
          <button class="timer-preset cancel-btn" @click="setPreset(0)">关闭定时</button>
        </div>
        <div class="timer-custom">
          <label>自定义（分钟）</label>
          <div class="timer-custom-row">
            <input type="number" v-model.number="customMinutes" min="1" max="480" placeholder="1-480" @keydown.enter="setCustom">
            <button @click="setCustom">设置</button>
          </div>
        </div>
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
  width: 90%; max-width: 380px; box-shadow: 0 8px 48px rgba(0,0,0,0.5);
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
.modal-body { padding: 0 20px 20px; }
.timer-presets {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 16px;
}
.timer-preset {
  padding: 10px 8px; border: 1px solid #222230; border-radius: 10px;
  background: #18181f; color: #8888a0; font-size: 0.82rem;
  cursor: pointer; transition: 0.2s; font-family: inherit;
}
.timer-preset:hover { border-color: #7c6ff7; color: #a89bf8; background: rgba(124,111,247,0.08); }
.cancel-btn { grid-column: 1/-1; border-color: rgba(248,113,113,0.3); }
.cancel-btn:hover { border-color: #f87171; color: #f87171; background: rgba(248,113,113,0.08); }
.timer-custom { padding-top: 14px; border-top: 1px solid #222230; }
.timer-custom label { display: block; font-size: 0.8rem; color: #8888a0; margin-bottom: 8px; }
.timer-custom-row { display: flex; gap: 8px; }
.timer-custom-row input {
  flex: 1; padding: 9px 12px; border: 1px solid #222230; border-radius: 10px;
  background: #18181f; color: #e8e8f0; font-size: 0.9rem; font-family: inherit; outline: none;
}
.timer-custom-row input:focus { border-color: #7c6ff7; box-shadow: 0 0 0 3px rgba(124,111,247,0.1); }
.timer-custom-row button {
  padding: 9px 16px; border: none; border-radius: 10px; background: #7c6ff7;
  color: white; font-size: 0.85rem; font-weight: 500; cursor: pointer; transition: 0.2s; font-family: inherit;
}
.timer-custom-row button:hover { background: #a89bf8; }
</style>
