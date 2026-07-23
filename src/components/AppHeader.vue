<script setup lang="ts">
import { computed } from 'vue'
import { useAudioStore } from '@/stores/audioStore'
import { categories } from '@/presets'
import type { CategoryId } from '@/types'

const store = useAudioStore()

const categoryEntries = computed(() => Object.values(categories))

const timerDisplay = computed(() => {
  if (!store.isTimerActive) return '定时'
  const m = store.timerRemaining
  const h = Math.floor(m / 60)
  const mm = m % 60
  return h > 0 ? `${h}时${mm}分` : `${mm}分钟`
})

function switchCategory(id: CategoryId) {
  store.currentCategory = id
}

function emit(name: string) {
  window.dispatchEvent(new CustomEvent(name))
}
</script>

<template>
  <header class="header">
    <div class="header-left">
      <div class="logo">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M2 12h2"/><path d="M6 8v8"/><path d="M10 5v14"/>
          <path d="M14 9v6"/><path d="M18 7v10"/><path d="M20 12h2"/>
        </svg>
        <span>Whisper ASMR</span>
      </div>
    </div>

    <nav class="header-nav">
      <button
        v-for="cat in categoryEntries"
        :key="cat.id"
        class="nav-btn"
        :class="{ active: store.currentCategory === cat.id }"
        @click="switchCategory(cat.id)"
        :title="cat.description"
      >
        {{ cat.icon }} {{ cat.name }}
      </button>
    </nav>

    <div class="header-right">
      <button class="header-action-btn" @click="emit('open-export')" title="导出音频">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      </button>
      <button
        class="header-action-btn"
        :class="{ 'has-timer': store.isTimerActive }"
        @click="emit('open-timer')"
        title="定时关闭"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        <span>{{ timerDisplay }}</span>
      </button>
      <button class="header-action-btn stop-btn" @click="store.stopAll()" title="停止全部 [空格键]">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>
      </button>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: sticky; top: 0; z-index: 100;
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 24px; gap: 16px;
  background: rgba(10,10,15,0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid #222230;
}
.header-left { flex-shrink: 0; }
.logo { display: flex; align-items: center; gap: 10px; font-size: 1.2rem; font-weight: 700; letter-spacing: -0.02em; }
.logo svg { color: #7c6ff7; }
.header-nav { display: flex; gap: 4px; flex-wrap: wrap; justify-content: center; }
.nav-btn {
  padding: 7px 14px; border: 1px solid transparent; border-radius: 8px;
  background: transparent; color: #8888a0; font-size: 0.825rem; font-weight: 500;
  cursor: pointer; transition: 0.2s; white-space: nowrap; font-family: inherit;
}
.nav-btn:hover { color: #e8e8f0; background: rgba(255,255,255,0.04); }
.nav-btn.active { color: #a89bf8; background: rgba(124,111,247,0.12); border-color: rgba(124,111,247,0.3); }
.header-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.header-action-btn {
  display: flex; align-items: center; gap: 6px; padding: 8px 12px;
  border: 1px solid #222230; border-radius: 8px;
  background: rgba(255,255,255,0.03); color: #8888a0;
  font-size: 0.8rem; cursor: pointer; transition: 0.2s; font-family: inherit;
}
.header-action-btn:hover { border-color: #7c6ff7; color: #e8e8f0; }
.header-action-btn.has-timer { border-color: #7c6ff7; color: #a89bf8; background: rgba(124,111,247,0.1); }
.header-action-btn.stop-btn:hover { background: rgba(248,113,113,0.15); color: #f87171; border-color: #f87171; }

@media (max-width: 768px) {
  .header { flex-wrap: wrap; padding: 10px 14px; }
  .header-nav { order: 3; width: 100%; overflow-x: auto; justify-content: flex-start; padding-bottom: 4px; }
  .nav-btn { font-size: 0.75rem; padding: 6px 10px; }
}
</style>
