<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAudioStore } from '@/stores/audioStore'
import { getCategorySounds, combos } from '@/presets'
import SoundCard from './SoundCard.vue'
import type { SoundDef } from '@/types'

const store = useAudioStore()
const $customFile = ref<HTMLInputElement>()

const sounds = computed(() => getCategorySounds(store.currentCategory))

const isCustom = computed(() => store.currentCategory === 'custom')
const customList = computed(() => [...store.customSounds.values()])
const hasCustoms = computed(() => customList.value.length > 0)

const categoryCombos = computed(() => {
  const map: Record<string, string[]> = {
    sleep: ['deep_sleep', 'rainy_night_sleep', 'cabin_retreat'],
    focus: ['ultimate_focus', 'night_calm'],
    nature: ['forest_retreat', 'beach_paradise', 'storm_watcher', 'spring_morning'],
    meditation: ['meditation_pro', 'healing_frequencies'],
    ambience: ['cabin_retreat', 'storm_watcher', 'beach_paradise'],
    tone: ['healing_frequencies'],
    mechanical: ['jet_engine_sleep'],
    custom: []
  }
  return (map[store.currentCategory] || []).map(k => ({ key: k, ...combos[k] })).filter(c => c.name)
})

function handleFileUpload(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (files && files.length > 0) {
    Array.from(files).forEach(f => {
      if (f.type.startsWith('audio/')) store.addCustomSound(f)
    })
  }
  (e.target as HTMLInputElement).value = ''
}

async function playCombo(comboKey: string) {
  await store.initEngine()
  const combo = combos[comboKey]
  if (!combo) return
  const { sounds: allSounds } = await import('@/presets')
  for (const s of combo.sounds) {
    const soundDef = allSounds[s.id]
    if (soundDef && !store.activeSounds.has(s.id)) {
      store.playSound(soundDef, s.vol)
    }
  }
}

function deleteCustom(id: string) {
  store.deleteCustomSound(id)
}

function toggleCustom(id: string) {
  const def: SoundDef = {
    id: id as any, type: 'custom' as any, icon: '🎵',
    name: store.customSounds.get(id)?.name ?? '自定义',
    description: '', tags: ['自定义'], category: 'custom'
  }
  if (store.activeSounds.has(id)) {
    store.stopSound(id)
  } else {
    store.playCustomSound(id)
  }
}

const customVol = (id: string) => store.activeSounds.get(id)?.volume ?? 50
</script>

<template>
  <section class="sound-grid">
    <!-- 内置声音 -->
    <template v-if="!isCustom">
      <SoundCard v-for="s in sounds" :key="s.id" :sound="s" />

      <!-- 推荐组合 -->
      <div
        v-for="combo in categoryCombos"
        :key="combo.key"
        class="sound-card combo-card"
        @click="playCombo(combo.key)"
      >
        <div class="sound-card-icon">🌟</div>
        <div class="sound-card-name">{{ combo.name }}</div>
      </div>
    </template>

    <!-- 自定义素材 -->
    <template v-else>
      <div v-if="!hasCustoms" class="empty-state">
        <div class="empty-icon">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
        </div>
        <h3>还没有自定义素材</h3>
        <p>上传你自己的高品质音频素材（雨声、海浪等实地录音更佳）</p>
        <label class="upload-btn">
          <input ref="$customFile" type="file" accept="audio/*" multiple hidden @change="handleFileUpload">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          上传音频
        </label>
        <p class="hint">支持 MP3 / WAV / OGG / FLAC / AAC</p>
      </div>

      <template v-else>
        <div
          v-for="cs in customList"
          :key="cs.id"
          class="sound-card"
          :class="{ active: store.activeSounds.has(cs.id) }"
          @click="toggleCustom(cs.id)"
        >
          <div class="sound-card-icon">{{ cs.icon }}</div>
          <div class="sound-card-name">{{ cs.name }}</div>
          <div class="sound-card-volume" @click.stop>
            <input type="range" min="0" max="100" :value="customVol(cs.id)" step="1"
              @input="store.setSoundVolume(cs.id, parseInt(($event.target as HTMLInputElement).value))">
          </div>
          <button class="delete-btn" @click.stop="deleteCustom(cs.id)" title="删除素材">✕</button>
        </div>
        <div style="grid-column:1/-1;display:flex;justify-content:center;margin-top:16px">
          <label class="upload-btn-small">
            <input type="file" accept="audio/*" multiple hidden @change="handleFileUpload">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            添加更多素材
          </label>
        </div>
      </template>
    </template>
  </section>
</template>

<style scoped>
.sound-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(135px, 1fr));
  gap: 12px;
}
.combo-card {
  border-color: rgba(124,111,247,0.2) !important;
  background: linear-gradient(135deg, rgba(124,111,247,0.06), rgba(96,165,250,0.04)) !important;
}
.empty-state {
  grid-column: 1/-1;
  display: flex; flex-direction: column; align-items: center;
  padding: 60px 20px; text-align: center; gap: 12px;
}
.empty-icon { color: #555570; margin-bottom: 4px; }
.empty-state h3 { font-size: 1.15rem; font-weight: 500; color: #8888a0; }
.empty-state p { color: #555570; font-size: 0.85rem; max-width: 320px; }
.hint { font-size: 0.75rem !important; color: #444460 !important; }
.upload-btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 12px 24px; background: #7c6ff7; color: white;
  border-radius: 10px; font-size: 0.9rem; font-weight: 500;
  cursor: pointer; transition: 0.2s; margin-top: 8px;
}
.upload-btn:hover { background: #a89bf8; box-shadow: 0 4px 20px rgba(124,111,247,0.3); transform: translateY(-1px); }
.upload-btn-small {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 10px 18px; border: 1px dashed #2a2a3a; border-radius: 10px;
  color: #8888a0; font-size: 0.8rem; cursor: pointer; transition: 0.2s;
}
.upload-btn-small:hover { border-color: #7c6ff7; color: #a89bf8; }
.delete-btn {
  position: absolute; top: 6px; right: 6px;
  width: 20px; height: 20px; border: none; border-radius: 50%;
  background: rgba(248,113,113,0.1); color: #555570; font-size: 0.6rem;
  cursor: pointer; opacity: 0; transition: 0.2s; z-index: 5;
}
.sound-card:hover .delete-btn { opacity: 1; }
.delete-btn:hover { background: rgba(248,113,113,0.3); color: #f87171; }
</style>
