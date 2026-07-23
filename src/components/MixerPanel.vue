<script setup lang="ts">
import { computed } from 'vue'
import { useAudioStore } from '@/stores/audioStore'

const store = useAudioStore()

const channels = computed(() => [...store.activeSounds.values()])

const masterVol = computed({
  get: () => store.masterVolume,
  set: (v: number) => store.setMasterVolume(v)
})
</script>

<template>
  <aside class="mixer-panel" v-if="channels.length > 0">
    <div class="mixer-header">
      <h3>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
        混音台
      </h3>
      <span class="mixer-count">{{ store.activeCount }} 个声音</span>
    </div>

    <div class="mixer-channels">
      <div
        v-for="ch in channels"
        :key="ch.def.id"
        class="mixer-channel"
      >
        <div class="mixer-channel-icon">{{ ch.def.icon }}</div>
        <div class="mixer-channel-name">{{ ch.def.name }}</div>
        <input
          type="range"
          class="mixer-channel-volume"
          min="0" max="100"
          :value="ch.volume"
          step="1"
          @input="store.setSoundVolume(ch.def.id, parseInt(($event.target as HTMLInputElement).value))"
        >
        <button
          class="mixer-channel-remove"
          @click="store.stopSound(ch.def.id)"
          title="移除"
        >✕</button>
      </div>
    </div>

    <div class="mixer-footer">
      <div class="master-volume">
        <label>主音量</label>
        <input type="range" min="0" max="100" v-model="masterVol" step="1">
        <span>{{ masterVol }}%</span>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.mixer-panel {
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 90;
  background: rgba(13,13,21,0.95); border-top: 1px solid #222230;
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  max-height: 185px; overflow-y: auto;
}
.mixer-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 24px; border-bottom: 1px solid #222230;
}
.mixer-header h3 { display: flex; align-items: center; gap: 6px; font-size: 0.825rem; font-weight: 600; color: #8888a0; }
.mixer-count { font-size: 0.75rem; color: #555570; }
.mixer-channels { display: flex; gap: 8px; padding: 10px 24px; flex-wrap: wrap; }
.mixer-channel {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 10px 8px; background: #18181f; border: 1px solid #222230;
  border-radius: 10px; min-width: 72px; transition: 0.2s;
}
.mixer-channel:hover { border-color: #2a2a3a; }
.mixer-channel-icon { font-size: 1.1rem; }
.mixer-channel-name { font-size: 0.675rem; color: #8888a0; max-width: 60px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: center; }
.mixer-channel-volume {
  width: 60px; -webkit-appearance: none; height: 3px; border-radius: 2px;
  background: #2a2a3a; outline: none; cursor: pointer; transform: rotate(-90deg); margin: 16px 0;
}
.mixer-channel-volume::-webkit-slider-thumb {
  -webkit-appearance: none; width: 10px; height: 10px; border-radius: 50%; background: #7c6ff7; cursor: pointer;
}
.mixer-channel-remove {
  width: 20px; height: 20px; border: none; border-radius: 50%;
  background: transparent; color: #555570; font-size: 0.65rem;
  cursor: pointer; transition: 0.2s;
}
.mixer-channel-remove:hover { background: rgba(248,113,113,0.2); color: #f87171; }
.mixer-footer {
  display: flex; justify-content: center; padding: 8px 24px 12px; border-top: 1px solid #222230;
}
.master-volume { display: flex; align-items: center; gap: 10px; }
.master-volume label { font-size: 0.75rem; color: #8888a0; white-space: nowrap; }
.master-volume input[type="range"] {
  -webkit-appearance: none; width: 100px; height: 4px; border-radius: 2px;
  background: #2a2a3a; outline: none; cursor: pointer;
}
.master-volume input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%;
  background: #7c6ff7; cursor: pointer; box-shadow: 0 0 10px rgba(124,111,247,0.3);
}
.master-volume span { font-size: 0.75rem; color: #8888a0; min-width: 32px; }
</style>
