/* ========================================
   类型定义 - TypeScript 类型系统
   ======================================== */

/** 声音类别枚举 */
export type CategoryId = 'sleep' | 'focus' | 'nature' | 'meditation' | 'ambience' | 'tone' | 'mechanical' | 'custom'

/** 声音引擎类型标识 */
export type SoundType =
  | 'white' | 'pink' | 'brown' | 'blue' | 'violet'
  | 'rain_gentle' | 'rain_moderate' | 'rain_heavy' | 'rain_window' | 'rain_leaves'
  | 'ocean_gentle' | 'ocean_storm' | 'stream' | 'waterfall' | 'river' | 'lake'
  | 'wind_breeze' | 'wind_strong' | 'wind_trees' | 'wind_desert'
  | 'thunder_distant' | 'thunder_close'
  | 'fire_campfire' | 'fire_fireplace' | 'fire_bonfire'
  | 'birds_forest' | 'birds_garden' | 'crickets' | 'owl'
  | 'fan' | 'ac_hum' | 'train' | 'airplane' | 'coffee_shop'
  | 'binaural' | 'singing_bowl' | 'crystal_bowl' | 'solfeggio' | 'isochronic'
  | 'heartbeat'
  | 'forest_day' | 'forest_night' | 'beach' | 'jungle' | 'mountain'
  | 'city_rain' | 'cozy_cabin' | 'storm_night'
  | 'custom'

/** 分类详情 */
export interface Category {
  id: CategoryId
  name: string
  icon: string
  description: string
  soundIds: SoundType[]
}

/** 声音定义 */
export interface SoundDef {
  id: SoundType
  type: SoundType
  icon: string
  name: string
  description: string
  tags: string[]
  category: CategoryId
}

/** 活跃声音实例 */
export interface ActiveSound {
  volume: number
  def: SoundDef
  controller: SoundController
}

/** 声音控制器（由引擎返回） */
export interface SoundController {
  type: SoundType
  stop: () => void
  setVolume: (v: number) => void
  nodes?: AudioNode[]
  subSounds?: SoundController[]
}

/** 预设组合 */
export interface SoundCombo {
  name: string
  description: string
  sounds: { id: SoundType; vol: number }[]
}

/** 导出配置 */
export interface ExportConfig {
  format: 'wav' | 'mp3' | 'flac' | 'ogg'
  sampleRate: 44100 | 48000 | 96000
  bitDepth: 16 | 24 | 32
  duration: number  // 秒
  sounds: { id: SoundType; vol: number }[]
  title: string
  artist: string
  album: string
  genre: string
  coverImage?: string
  metadata: Record<string, string>
}

/** 每日生成计划 */
export interface DailySchedule {
  id: string
  name: string
  enabled: boolean
  cronExpression: string
  configs: ExportConfig[]
  outputDir: string
}

/** 生成任务状态 */
export interface GenerationTask {
  id: string
  scheduleId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  outputFile?: string
  error?: string
  startedAt: Date
  completedAt?: Date
}

/** 自定义素材（用户上传） */
export interface CustomSound {
  id: string
  name: string
  icon: string
  file: File
  objectURL: string
  addedAt: number
}
