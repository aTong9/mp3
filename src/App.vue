<script setup lang="ts">
import { onMounted } from 'vue'
import { useAudioStore } from '@/stores/audioStore'
import AppHeader from '@/components/AppHeader.vue'
import SoundGrid from '@/components/SoundGrid.vue'
import MixerPanel from '@/components/MixerPanel.vue'
import TimerModal from '@/components/TimerModal.vue'
import ExportPanel from '@/components/ExportPanel.vue'

const store = useAudioStore()

onMounted(async () => {
  await store.initEngine()
  await store.loadCustomSoundsFromDB()
})
</script>

<template>
  <div class="bg-ambient" />
  <AppHeader />
  <main class="main-content">
    <SoundGrid />
  </main>
  <MixerPanel />
  <TimerModal />
  <ExportPanel />
  <div class="toast-container" id="toastContainer" />
</template>

<style scoped>
@import '@/styles/global.css';
</style>
