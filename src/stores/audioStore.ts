/* ========================================
   Audio Store - Pinia 状态管理
   ======================================== */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CategoryId, SoundDef, SoundType, ActiveSound, CustomSound, ExportConfig } from '@/types'
import { engine } from '@/engine/AudioEngine'

export const useAudioStore = defineStore('audio', () => {
  // === 状态 ===
  const activeSounds = ref<Map<string, ActiveSound>>(new Map())
  const customSounds = ref<Map<string, CustomSound>>(new Map())
  const currentCategory = ref<CategoryId>('sleep')
  const masterVolume = ref(80)
  const timerEndTime = ref<number | null>(null)
  const timerMinutes = ref(0)
  const customIdCounter = ref(0)
  const isEngineReady = ref(false)

  // === 计算属性 ===
  const activeCount = computed(() => activeSounds.value.size)
  const activeIds = computed(() => [...activeSounds.value.keys()])

  const timerRemaining = computed(() => {
    if (!timerEndTime.value) return 0
    return Math.max(0, Math.ceil((timerEndTime.value - Date.now()) / 60000))
  })

  const isTimerActive = computed(() => timerEndTime.value !== null && timerRemaining.value > 0)

  // === 引擎初始化 ===
  async function initEngine() {
    await engine.resume()
    isEngineReady.value = true
    engine.setMasterVolume(masterVolume.value)
  }

  // === 播放控制 ===
  function playSound(def: SoundDef, vol = 50): boolean {
    if (activeSounds.value.has(def.id)) return false

    if (def.type === 'custom') {
      return playCustomSound(def.id, vol)
    }

    const ctrl = engine.play(def.id, def.type, vol)
    if (!ctrl) return false

    activeSounds.value.set(def.id, { volume: vol, def, controller: ctrl })
    // reactive 更新
    activeSounds.value = new Map(activeSounds.value)
    return true
  }

  function stopSound(id: string) {
    engine.stop(id)
    // 同时停止自定义 Audio 元素
    const entry = activeSounds.value.get(id)
    if (entry?.controller.stop) {
      try { entry.controller.stop() } catch {}
    }
    activeSounds.value.delete(id)
    activeSounds.value = new Map(activeSounds.value)
  }

  function stopAll() {
    engine.stopAll()
    activeSounds.value.clear()
    activeSounds.value = new Map(activeSounds.value)
  }

  function setSoundVolume(id: string, vol: number) {
    const entry = activeSounds.value.get(id)
    if (!entry) return
    entry.volume = vol
    engine.setVolume(id, vol)
  }

  function setMasterVolume(vol: number) {
    masterVolume.value = vol
    engine.setMasterVolume(vol)
  }

  // === 定时器 ===
  let timerId: ReturnType<typeof setTimeout> | null = null
  let tickId: ReturnType<typeof setInterval> | null = null

  function setTimer(minutes: number) {
    clearTimer()
    timerEndTime.value = Date.now() + minutes * 60000
    timerMinutes.value = minutes

    timerId = setTimeout(() => {
      stopAll()
      clearTimer()
    }, minutes * 60000)

    tickId = setInterval(() => {
      if (timerRemaining.value <= 0) clearTimer()
    }, 10000)
  }

  function clearTimer() {
    if (timerId) { clearTimeout(timerId); timerId = null }
    if (tickId) { clearInterval(tickId); tickId = null }
    timerEndTime.value = null
    timerMinutes.value = 0
  }

  // === 自定义素材 ===
  function addCustomSound(file: File): CustomSound {
    customIdCounter.value++
    const id = `custom_${customIdCounter.value}`
    const cs: CustomSound = {
      id,
      name: file.name.replace(/\.[^.]+$/, ''),
      icon: '🎵',
      file,
      objectURL: URL.createObjectURL(file),
      addedAt: Date.now()
    }
    customSounds.value.set(id, cs)
    customSounds.value = new Map(customSounds.value)
    saveCustomSoundsToDB()
    return cs
  }

  function playCustomSound(id: string, vol = 50): boolean {
    const cs = customSounds.value.get(id)
    if (!cs || activeSounds.value.has(id)) return false

    const audio = new Audio(cs.objectURL)
    audio.loop = true
    audio.volume = vol / 100
    audio.play().catch(console.warn)

    const def: SoundDef = {
      id: id as SoundType, type: 'custom' as SoundType,
      icon: cs.icon, name: cs.name, description: cs.file.name,
      tags: ['自定义'], category: 'custom'
    }

    const ctrl = {
      type: 'custom' as SoundType,
      stop: () => { audio.pause(); audio.currentTime = 0; audio.src = '' },
      setVolume: (v: number) => { audio.volume = v / 100 }
    }

    activeSounds.value.set(id, { volume: vol, def, controller: ctrl })
    activeSounds.value = new Map(activeSounds.value)
    return true
  }

  async function deleteCustomSound(id: string) {
    if (activeSounds.value.has(id)) stopSound(id)
    const cs = customSounds.value.get(id)
    if (cs?.objectURL) URL.revokeObjectURL(cs.objectURL)
    customSounds.value.delete(id)
    customSounds.value = new Map(customSounds.value)
    await saveCustomSoundsToDB()
  }

  async function saveCustomSoundsToDB() {
    try {
      const db = await openCustomDB()
      const tx = db.transaction('sounds', 'readwrite')
      const store = tx.objectStore('sounds')
      await new Promise<void>((res, rej) => {
        const r = store.clear(); r.onsuccess = () => res(); r.onerror = () => rej(r.error)
      })
      for (const [id, cs] of customSounds.value) {
        const buf = await cs.file.arrayBuffer()
        await new Promise<void>((res, rej) => {
          const r = store.put({ id, name: cs.name, fileName: cs.file.name, fileType: cs.file.type, audioData: buf, addedAt: cs.addedAt })
          r.onsuccess = () => res(); r.onerror = () => rej(r.error)
        })
      }
      await new Promise<void>(res => { tx.oncomplete = () => res() })
      db.close()
    } catch (e) { console.warn('IDB save failed:', e) }
  }

  async function loadCustomSoundsFromDB() {
    try {
      const db = await openCustomDB()
      const tx = db.transaction('sounds', 'readonly')
      const store = tx.objectStore('sounds')
      const items: any[] = await new Promise((res, rej) => {
        const r = store.getAll(); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error)
      })
      for (const item of items) {
        const blob = new Blob([item.audioData], { type: item.fileType })
        const file = new File([blob], item.fileName, { type: item.fileType })
        customSounds.value.set(item.id, {
          id: item.id, name: item.name, icon: '🎵', file,
          objectURL: URL.createObjectURL(file), addedAt: item.addedAt
        })
        const num = parseInt(item.id.replace('custom_', ''))
        if (!isNaN(num) && num > customIdCounter.value) customIdCounter.value = num
      }
      customSounds.value = new Map(customSounds.value)
      db.close()
    } catch (e) { console.warn('IDB load failed:', e) }
  }

  function openCustomDB(): Promise<IDBDatabase> {
    return new Promise((res, rej) => {
      const r = indexedDB.open('asmr-custom-sounds', 1)
      r.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains('sounds')) {
          db.createObjectStore('sounds', { keyPath: 'id' })
        }
      }
      r.onsuccess = () => res(r.result)
      r.onerror = () => rej(r.error)
    })
  }

  // === 导出 ===
  function createExportConfig(soundIds: SoundType[], duration: number, title: string): ExportConfig {
    const activeList = [...activeSounds.value.values()]
    return {
      format: 'wav',
      sampleRate: 48000,
      bitDepth: 24,
      duration,
      sounds: soundIds.map(id => ({
        id,
        vol: activeList.find(a => a.def.id === id)?.volume ?? 50
      })),
      title,
      artist: 'Whisper ASMR',
      album: 'Daily Ambient Collection',
      genre: 'Ambient',
      metadata: {
        description: 'AI-generated ambient soundscape',
        year: new Date().getFullYear().toString()
      }
    }
  }

  return {
    // state
    activeSounds, customSounds, currentCategory, masterVolume,
    timerEndTime, timerMinutes, customIdCounter, isEngineReady,
    // computed
    activeCount, activeIds, timerRemaining, isTimerActive,
    // actions
    initEngine, playSound, stopSound, stopAll, setSoundVolume, setMasterVolume,
    setTimer, clearTimer,
    addCustomSound, playCustomSound, deleteCustomSound,
    saveCustomSoundsToDB, loadCustomSoundsFromDB,
    createExportConfig
  }
})
