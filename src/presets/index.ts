/* ========================================
   声音预设 - 40+ 种真实声音定义
   ======================================== */

import type { Category, SoundDef, SoundCombo, SoundType } from '@/types'

/* ---- 8 大分类 ---- */
export const categories: Record<string, Category> = {
  sleep: {
    id: 'sleep', name: '🌙 助眠放松', icon: '🌙',
    description: '帮助快速入眠的舒缓声音',
    soundIds: ['brown', 'rain_gentle', 'rain_window', 'ocean_gentle', 'fan', 'ac_hum',
      'heartbeat', 'wind_breeze', 'fire_fireplace', 'binaural', 'pink', 'storm_night']
  },
  focus: {
    id: 'focus', name: '✍️ 专注写作', icon: '✍️',
    description: '提升专注力的环境音',
    soundIds: ['white', 'pink', 'rain_gentle', 'rain_moderate', 'fan', 'stream',
      'city_rain', 'coffee_shop', 'binaural', 'brown', 'fire_campfire', 'train']
  },
  nature: {
    id: 'nature', name: '🌿 自然之声', icon: '🌿',
    description: '来自大自然的治愈之音',
    soundIds: ['rain_gentle', 'rain_heavy', 'rain_window', 'rain_leaves',
      'ocean_gentle', 'ocean_storm', 'stream', 'waterfall', 'river', 'lake',
      'wind_breeze', 'wind_strong', 'wind_trees', 'wind_desert',
      'thunder_distant', 'thunder_close',
      'birds_forest', 'birds_garden', 'crickets', 'owl',
      'fire_campfire', 'fire_bonfire', 'fire_fireplace',
      'forest_day', 'forest_night', 'beach', 'jungle', 'mountain']
  },
  meditation: {
    id: 'meditation', name: '🧘 冥想静心', icon: '🧘',
    description: '深度冥想与精神疗愈',
    soundIds: ['binaural', 'singing_bowl', 'crystal_bowl', 'solfeggio', 'isochronic',
      'brown', 'stream', 'ocean_gentle', 'wind_breeze', 'white']
  },
  ambience: {
    id: 'ambience', name: '🏠 场景氛围', icon: '🏠',
    description: '沉浸式场景环境音',
    soundIds: ['city_rain', 'cozy_cabin', 'storm_night', 'coffee_shop',
      'train', 'airplane', 'forest_day', 'forest_night', 'beach', 'jungle', 'mountain']
  },
  tone: {
    id: 'tone', name: '🎵 疗愈频率', icon: '🎵',
    description: '特定频率的疗愈声波',
    soundIds: ['binaural', 'singing_bowl', 'crystal_bowl', 'solfeggio', 'isochronic',
      'white', 'pink', 'brown', 'blue', 'violet']
  },
  mechanical: {
    id: 'mechanical', name: '⚙️ 白噪机械', icon: '⚙️',
    description: '持续稳定的机械声响',
    soundIds: ['white', 'pink', 'brown', 'blue', 'violet',
      'fan', 'ac_hum', 'train', 'airplane']
  },
  custom: {
    id: 'custom', name: '📁 我的素材', icon: '📁',
    description: '上传你自己的音频文件',
    soundIds: []
  }
} as const

/* ---- 40+ 声音定义 ---- */
export const sounds: Record<SoundType, SoundDef> = {
  // === 噪声颜色 ===
  white:   { id:'white',   type:'white',   icon:'🌬️', name:'白噪声',   description:'均匀全频噪声，有效屏蔽环境干扰', tags:['噪声','专注','助眠'], category:'sleep' },
  pink:    { id:'pink',    type:'pink',    icon:'🌸', name:'粉红噪声', description:'比白噪更柔和悦耳，类似瀑布声', tags:['噪声','自然','专注'], category:'focus' },
  brown:   { id:'brown',   type:'brown',   icon:'🌑', name:'布朗噪声', description:'深沉低频轰响，最佳助眠噪声', tags:['噪声','深眠','低频'], category:'sleep' },
  blue:    { id:'blue',    type:'blue',    icon:'💧', name:'蓝噪声',   description:'高频嘶嘶声，类似蒸汽喷出', tags:['噪声','高频','特殊'], category:'mechanical' },
  violet:  { id:'violet',  type:'violet',  icon:'💜', name:'紫噪声',   description:'极高频噪声，用于耳鸣掩蔽', tags:['噪声','极高频','特殊'], category:'mechanical' },

  // === 雨声变体 ===
  rain_gentle:    { id:'rain_gentle',  type:'rain_gentle',  icon:'🌧️',  name:'轻柔细雨', description:'稳定柔和的雨声，适合睡眠与阅读', tags:['雨','助眠','放松'], category:'nature' },
  rain_moderate:  { id:'rain_moderate',type:'rain_moderate',icon:'🌧️',  name:'中雨',     description:'淅淅沥沥的中等雨势', tags:['雨','专注','氛围'], category:'nature' },
  rain_heavy:     { id:'rain_heavy',   type:'rain_heavy',   icon:'⛈️',  name:'大雨',     description:'倾盆大雨的磅礴气势', tags:['雨','沉浸','氛围'], category:'nature' },
  rain_window:    { id:'rain_window',  type:'rain_window',  icon:'🪟',  name:'窗边雨声', description:'雨点打在玻璃窗上的声音', tags:['雨','氛围','治愈'], category:'sleep' },
  rain_leaves:    { id:'rain_leaves',  type:'rain_leaves',  icon:'🍃',  name:'雨打树叶', description:'雨滴落在树叶上的沙沙声', tags:['雨','自然','治愈'], category:'nature' },

  // === 水声 ===
  ocean_gentle: { id:'ocean_gentle', type:'ocean_gentle', icon:'🌊', name:'轻柔海浪', description:'温柔的潮汐节奏，绝佳助眠', tags:['海洋','助眠','放松'], category:'nature' },
  ocean_storm:  { id:'ocean_storm',  type:'ocean_storm',  icon:'🌊', name:'暴风海浪', description:'狂风巨浪的震撼冲击', tags:['海洋','震撼','自然'], category:'nature' },
  stream:       { id:'stream',       type:'stream',       icon:'💧', name:'山间溪流', description:'清澈溪水潺潺流过石间', tags:['水','治愈','专注'], category:'nature' },
  waterfall:    { id:'waterfall',    type:'waterfall',    icon:'🏞️', name:'瀑布轰鸣', description:'飞流直下的磅礴水声', tags:['水','自然','氛围'], category:'nature' },
  river:        { id:'river',        type:'river',        icon:'🏞️', name:'河流奔腾', description:'宽阔河面的水流之声', tags:['水','自然','氛围'], category:'nature' },
  lake:         { id:'lake',         type:'lake',         icon:'🏖️', name:'湖水轻拍', description:'湖面微波轻轻拍岸', tags:['水','治愈','冥想'], category:'nature' },

  // === 风声 ===
  wind_breeze:  { id:'wind_breeze',  type:'wind_breeze',  icon:'🍃', name:'微风拂面', description:'轻柔和煦的春风', tags:['风','放松','自然'], category:'nature' },
  wind_strong:  { id:'wind_strong',  type:'wind_strong',  icon:'💨', name:'大风呼啸', description:'强劲有力的风声', tags:['风','自然','氛围'], category:'nature' },
  wind_trees:   { id:'wind_trees',   type:'wind_trees',   icon:'🌲', name:'林间风声', description:'风吹过树林的沙沙响', tags:['风','森林','治愈'], category:'nature' },
  wind_desert:  { id:'wind_desert',  type:'wind_desert',  icon:'🏜️', name:'沙漠热风', description:'干燥灼热的沙漠之风', tags:['风','特殊','氛围'], category:'nature' },

  // === 雷声 ===
  thunder_distant: { id:'thunder_distant', type:'thunder_distant', icon:'⚡', name:'远处雷鸣', description:'天际传来的低沉雷声', tags:['雷','氛围','助眠'], category:'nature' },
  thunder_close:   { id:'thunder_close',   type:'thunder_close',   icon:'⚡', name:'近处惊雷', description:'近在咫尺的炸裂雷鸣', tags:['雷','震撼','氛围'], category:'nature' },

  // === 火声 ===
  fire_campfire:  { id:'fire_campfire',  type:'fire_campfire',  icon:'🔥', name:'篝火噼啪', description:'户外营地篝火的温暖火焰', tags:['火','温暖','氛围'], category:'nature' },
  fire_fireplace: { id:'fire_fireplace', type:'fire_fireplace', icon:'🔥', name:'壁炉燃烧', description:'室内壁炉的温馨火焰', tags:['火','温暖','治愈'], category:'sleep' },
  fire_bonfire:   { id:'fire_bonfire',   type:'fire_bonfire',   icon:'🔥', name:'大型篝火', description:'更强烈的篝火燃烧声', tags:['火','氛围','户外'], category:'nature' },

  // === 动物/昆虫 ===
  birds_forest: { id:'birds_forest', type:'birds_forest', icon:'🐦', name:'森林鸟鸣', description:'林间各种鸟类的合唱', tags:['鸟','森林','活力'], category:'nature' },
  birds_garden: { id:'birds_garden', type:'birds_garden', icon:'🐤', name:'花园鸟鸣', description:'庭院中清脆的鸟叫声', tags:['鸟','花园','清晨'], category:'nature' },
  crickets:     { id:'crickets',     type:'crickets',     icon:'🦗', name:'蟋蟀夜鸣', description:'夏夜蟋蟀的阵阵鸣叫', tags:['昆虫','夏夜','氛围'], category:'nature' },
  owl:          { id:'owl',          type:'owl',          icon:'🦉', name:'猫头鹰叫', description:'夜晚神秘的猫头鹰咕咕声', tags:['鸟','夜晚','氛围'], category:'nature' },

  // === 机械/白噪 ===
  fan:         { id:'fan',         type:'fan',         icon:'🌀', name:'电风扇', description:'持续的扇叶转动嗡嗡声', tags:['机械','助眠','白噪'], category:'sleep' },
  ac_hum:      { id:'ac_hum',      type:'ac_hum',      icon:'❄️', name:'空调声',  description:'空调压缩机稳定低频声', tags:['机械','助眠','白噪'], category:'sleep' },
  train:       { id:'train',       type:'train',       icon:'🚂', name:'火车行驶', description:'铁轨上的规律行驶声', tags:['交通','怀旧','氛围'], category:'ambience' },
  airplane:    { id:'airplane',    type:'airplane',    icon:'✈️', name:'机舱白噪', description:'飞行中的持续引擎轰鸣', tags:['交通','白噪','氛围'], category:'ambience' },
  coffee_shop: { id:'coffee_shop', type:'coffee_shop', icon:'☕', name:'咖啡馆',   description:'人声低语与杯碟轻碰', tags:['场所','氛围','专注'], category:'ambience' },

  // === 疗愈频率 ===
  binaural:      { id:'binaural',      type:'binaural',      icon:'🧠', name:'双耳节拍',   description:'用频率差引导脑波状态（默认θ波4Hz）', tags:['频率','冥想','专注'], category:'tone' },
  singing_bowl:  { id:'singing_bowl',  type:'singing_bowl',  icon:'🔔', name:'西藏颂钵',   description:'悠远绵长的钵音回响', tags:['疗愈','冥想','静心'], category:'meditation' },
  crystal_bowl:  { id:'crystal_bowl',  type:'crystal_bowl',  icon:'🔮', name:'水晶钵',     description:'清澈透亮的水晶钵音', tags:['疗愈','冥想','频率'], category:'tone' },
  solfeggio:     { id:'solfeggio',     type:'solfeggio',     icon:'🎶', name:'Solfeggio 频率', description:'古格里高利圣咏频率（174-963Hz）', tags:['频率','疗愈','古法'], category:'tone' },
  isochronic:    { id:'isochronic',    type:'isochronic',    icon:'〰️', name:'等时脉冲',   description:'规律的节拍脉冲引导脑波', tags:['频率','专注','脑波'], category:'tone' },

  // === 心跳 ===
  heartbeat: { id:'heartbeat', type:'heartbeat', icon:'💓', name:'心跳声', description:'规律平稳的心跳节奏，带来安全感', tags:['生理','安全感','放松'], category:'sleep' },

  // === 组合场景 ===
  forest_day:  { id:'forest_day',  type:'forest_day',  icon:'🌲', name:'日间森林', description:'鸟鸣+微风+树叶沙沙', tags:['组合','森林','活力'], category:'nature' },
  forest_night:{ id:'forest_night',type:'forest_night',icon:'🌙', name:'夜间森林', description:'蟋蟀+猫头鹰+远处风声', tags:['组合','夜晚','氛围'], category:'ambience' },
  beach:       { id:'beach',       type:'beach',       icon:'🏖️', name:'海滩时光', description:'海浪+海鸥+微风', tags:['组合','海滩','放松'], category:'ambience' },
  jungle:      { id:'jungle',      type:'jungle',      icon:'🌴', name:'热带雨林', description:'虫鸣+鸟叫+细雨+蛙声', tags:['组合','雨林','异域'], category:'nature' },
  mountain:    { id:'mountain',    type:'mountain',    icon:'⛰️', name:'高山之巅', description:'风声+鹰啸+远处溪流', tags:['组合','山脉','壮阔'], category:'nature' },
  city_rain:   { id:'city_rain',   type:'city_rain',   icon:'🏙️', name:'城市雨夜', description:'窗外的雨与城市低鸣', tags:['组合','城市','氛围'], category:'ambience' },
  cozy_cabin:  { id:'cozy_cabin',  type:'cozy_cabin',  icon:'🏠', name:'温馨小屋', description:'壁炉+雨声+轻轻风声', tags:['组合','温暖','治愈'], category:'ambience' },
  storm_night: { id:'storm_night', type:'storm_night', icon:'⚡', name:'暴风雨夜', description:'大雨+雷鸣+狂风', tags:['组合','震撼','氛围'], category:'sleep' },

  // === 自定义 ===
  custom: { id:'custom', type:'custom', icon:'🎵', name:'自定义', description:'用户上传的音频素材', tags:['自定义'], category:'custom' },
} as const

/* ---- 精选组合 ---- */
export const combos: Record<string, SoundCombo> = {
  deep_sleep: {
    name: '💤 深度睡眠', description: '低频噪声+雨声+海浪三重奏',
    sounds: [{ id:'brown',vol:65 },{ id:'rain_gentle',vol:45 },{ id:'ocean_gentle',vol:30 }]
  },
  ultimate_focus: {
    name: '📝 终极专注', description: '白噪声+咖啡馆氛围',
    sounds: [{ id:'white',vol:40 },{ id:'coffee_shop',vol:50 }]
  },
  meditation_pro: {
    name: '🧘 深度冥想', description: '双耳节拍+溪流+微风',
    sounds: [{ id:'binaural',vol:55 },{ id:'stream',vol:35 },{ id:'wind_breeze',vol:25 }]
  },
  rainy_night_sleep: {
    name: '🌧️ 雨夜安眠', description: '窗边雨声+远处雷鸣',
    sounds: [{ id:'rain_window',vol:55 },{ id:'thunder_distant',vol:35 }]
  },
  forest_retreat: {
    name: '🌲 林间隐居', description: '森林鸟鸣+溪流+微风',
    sounds: [{ id:'forest_day',vol:55 },{ id:'stream',vol:35 }]
  },
  beach_paradise: {
    name: '🏖️ 海滩天堂', description: '轻柔海浪+微风',
    sounds: [{ id:'ocean_gentle',vol:60 },{ id:'wind_breeze',vol:25 }]
  },
  cabin_retreat: {
    name: '🏠 木屋时光', description: '壁炉+窗边雨声',
    sounds: [{ id:'fire_fireplace',vol:50 },{ id:'rain_window',vol:40 }]
  },
  storm_watcher: {
    name: '⚡ 观风暴者', description: '狂风+暴雨+雷鸣',
    sounds: [{ id:'rain_heavy',vol:55 },{ id:'wind_strong',vol:40 },{ id:'thunder_close',vol:45 }]
  },
  spring_morning: {
    name: '🌸 春日清晨', description: '花园鸟鸣+微风+溪流',
    sounds: [{ id:'birds_garden',vol:50 },{ id:'wind_breeze',vol:25 },{ id:'stream',vol:30 }]
  },
  night_calm: {
    name: '🌙 夜晚宁静', description: '蟋蟀+猫头鹰+远处风',
    sounds: [{ id:'crickets',vol:45 },{ id:'owl',vol:30 },{ id:'wind_breeze',vol:20 }]
  },
  healing_frequencies: {
    name: '🔮 疗愈频率包', description: '双耳节拍+Solfeggio 528Hz',
    sounds: [{ id:'binaural',vol:55 },{ id:'solfeggio',vol:50 }]
  },
  jet_engine_sleep: {
    name: '✈️ 机舱安眠', description: '飞机噪声+风扇声',
    sounds: [{ id:'airplane',vol:50 },{ id:'fan',vol:30 }]
  },
}

/** 获取分类下的声音列表 */
export function getCategorySounds(catId: string): SoundDef[] {
  const cat = categories[catId]
  if (!cat) return []
  return cat.soundIds.map(id => sounds[id]).filter(Boolean)
}

/** 获取所有内置声音（排除自定义占位） */
export function getAllSounds(): SoundDef[] {
  return Object.values(sounds).filter(s => s.id !== 'custom')
}
