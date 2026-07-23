<script setup lang="ts">
import { computed } from 'vue'
import { useAudioStore } from '@/stores/audioStore'
import type { SoundDef } from '@/types'

const props = defineProps<{ sound: SoundDef }>()
const store = useAudioStore()

const isActive = computed(() => store.activeSounds.has(props.sound.id))
const entry = computed(() => store.activeSounds.get(props.sound.id))
const volume = computed({
  get: () => entry.value?.volume ?? 50,
  set: (v: number) => store.setSoundVolume(props.sound.id, v)
})

function toggle() {
  if (isActive.value) {
    store.stopSound(props.sound.id)
  } else {
    store.playSound(props.sound, volume.value)
  }
}

function onVolumeInput(e: Event) {
  const v = parseInt((e.target as HTMLInputElement).value)
  volume.value = v
}
</script>

<template>
  <div
    class="sound-card"
    :class="{ active: isActive }"
    :data-sound-id="sound.id"
    @click="toggle"
  >
    <div class="sound-card-icon">{{ sound.icon }}</div>
    <div class="sound-card-name">{{ sound.name }}</div>
    <div
      class="sound-card-volume"
      title="音量"
      @click.stop
    >
      <input type="range" min="0" max="100" :value="volume" step="1" @input="onVolumeInput">
    </div>
  </div>
</template>

<style scoped>
.sound-card {
  position: relative; display: flex; flex-direction: column; align-items: center;
  gap: 8px; padding: 18px 14px 16px; border-radius: 14px;
  background: #18181f; border: 1px solid #222230;
  cursor: pointer; transition: 0.25s; user-select: none; overflow: hidden;
}
.sound-card::before {
  content: ''; position: absolute; inset: 0; border-radius: 14px;
  opacity: 0; transition: opacity 0.3s; pointer-events: none;
}
.sound-card:hover { background: #1e1e28; border-color: #2a2a3a; transform: translateY(-2px); box-shadow: 0 4px 24px rgba(0,0,0,0.3); }
.sound-card.active { background: #1a1a2e; border-color: rgba(124,111,247,0.4); }
.sound-card.active::before {
  background: radial-gradient(circle at center, rgba(124,111,247,0.3), transparent 70%);
  opacity: 1;
}
.sound-card-icon {
  width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;
  font-size: 1.6rem; border-radius: 50%; background: rgba(255,255,255,0.04);
  position: relative; z-index: 1; transition: 0.25s;
}
.sound-card.active .sound-card-icon { background: rgba(124,111,247,0.15); }
.sound-card.active .sound-card-icon::after {
  content: ''; position: absolute; inset: -3px; border-radius: 50%;
  border: 2px solid rgba(124,111,247,0.4); animation: pulse 1.5s ease-in-out infinite;
}
@keyframes pulse {
  0%,100% { transform: scale(1); opacity: 0.4; }
  50% { transform: scale(1.12); opacity: 0; }
}
.sound-card-name { font-size: 0.8rem; font-weight: 500; color: #e8e8f0; text-align: center; z-index: 1; }
.sound-card-volume { width: 100%; z-index: 1; }
.sound-card-volume input[type="range"] {
  -webkit-appearance: none; width: 100%; height: 3px; border-radius: 2px;
  background: #2a2a3a; outline: none; cursor: pointer;
}
.sound-card-volume input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none; width: 12px; height: 12px; border-radius: 50%;
  background: #7c6ff7; cursor: pointer; border: 2px solid #1a1a2e;
  box-shadow: 0 0 8px rgba(124,111,247,0.3);
  opacity: 0; transition: opacity 0.2s;
}
.sound-card:hover .sound-card-volume input[type="range"]::-webkit-slider-thumb,
.sound-card.active .sound-card-volume input[type="range"]::-webkit-slider-thumb { opacity: 1; }
</style>
