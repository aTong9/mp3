/* ========================================
   Presets - 声音分类与预设配置
   ======================================== */

window.ASMRPresets = {

  // === 分类定义 ===
  categories: {
    sleep: {
      id: 'sleep',
      name: '🌙 助眠放松',
      description: '帮助你快速入眠的舒缓声音',
      sounds: ['brown', 'rain', 'ocean', 'fan', 'heartbeat', 'binaural', 'white', 'wind', 'pink', 'rainthunder']
    },
    focus: {
      id: 'focus',
      name: '✍️ 专注写作',
      description: '提升专注力的环境音',
      sounds: ['white', 'pink', 'rain', 'fan', 'stream', 'cityrain', 'binaural', 'wind', 'brown', 'campfire']
    },
    nature: {
      id: 'nature',
      name: '🌿 自然之声',
      description: '来自大自然的治愈之音',
      sounds: ['rain', 'ocean', 'wind', 'thunder', 'stream', 'birds', 'forest', 'rainthunder', 'campfire', 'fire']
    },
    meditation: {
      id: 'meditation',
      name: '🧘 冥想静心',
      description: '冥想与放松的精神之旅',
      sounds: ['bowl', 'binaural', 'chime', 'brown', 'stream', 'ocean', 'wind', 'rain', 'white', 'pink']
    },
    custom: {
      id: 'custom',
      name: '📁 我的素材',
      description: '上传你自己的音频文件',
      sounds: []
    }
  },

  // === 内置声音定义 ===
  sounds: {
    white:   { id: 'white',   type: 'white',   icon: '🌬️', name: '白噪声',   desc: '均匀的沙沙声，隔绝干扰', tags: ['噪声', '专注', '助眠'] },
    pink:    { id: 'pink',    type: 'pink',    icon: '🌊', name: '粉红噪声', desc: '比白噪更柔和，如瀑布', tags: ['噪声', '自然', '专注'] },
    brown:   { id: 'brown',   type: 'brown',   icon: '🌑', name: '布朗噪声', desc: '深沉的低频隆隆声', tags: ['噪声', '深眠', '低频'] },
    rain:    { id: 'rain',    type: 'rain',    icon: '🌧️', name: '下雨声',   desc: '淅淅沥沥的雨声', tags: ['自然', '助眠', '放松'] },
    ocean:   { id: 'ocean',   type: 'ocean',   icon: '🌊', name: '海浪声',   desc: '潮起潮落的节奏', tags: ['自然', '助眠', '放松'] },
    wind:    { id: 'wind',    type: 'wind',    icon: '💨', name: '风声',     desc: '轻柔拂过的微风', tags: ['自然', '冥想', '放松'] },
    thunder: { id: 'thunder', type: 'thunder', icon: '⛈️', name: '雷声',     desc: '远处低沉的雷鸣', tags: ['自然', '氛围', '沉浸'] },
    fire:    { id: 'fire',    type: 'fire',    icon: '🔥', name: '篝火声',   desc: '木柴燃烧的噼啪响', tags: ['自然', '温暖', '治愈'] },
    fan:     { id: 'fan',     type: 'fan',     icon: '🌀', name: '风扇声',   desc: '持续的机械嗡嗡声', tags: ['机械', '助眠', '专注'] },
    heartbeat: { id: 'heartbeat', type: 'heartbeat', icon: '💓', name: '心跳声', desc: '规律的脉搏节奏', tags: ['生理', '安全感', '放松'] },
    birds:   { id: 'birds',   type: 'birds',   icon: '🐦', name: '鸟鸣声',   desc: '清脆悦耳的鸟叫', tags: ['自然', '清晨', '活力'] },
    stream:  { id: 'stream',  type: 'stream',  icon: '💧', name: '溪流声',   desc: '潺潺流淌的山泉', tags: ['自然', '治愈', '专注'] },
    forest:  { id: 'forest',  type: 'forest',  icon: '🌲', name: '森林氛围', desc: '鸟鸣、风与树叶', tags: ['自然', '组合', '沉浸'] },
    rainthunder: { id: 'rainthunder', type: 'rainthunder', icon: '⛈️', name: '雷雨声', desc: '雨声与远处雷鸣', tags: ['自然', '氛围', '助眠'] },
    campfire: { id: 'campfire', type: 'campfire', icon: '🏕️', name: '营地篝火', desc: '篝火噼啪与微风', tags: ['自然', '温暖', '氛围'] },
    bowl:    { id: 'bowl',    type: 'bowl',    icon: '🔔', name: '颂钵',     desc: '悠远的藏钵回响', tags: ['冥想', '疗愈', '静心'] },
    chime:   { id: 'chime',   type: 'chime',   icon: '🎵', name: '音叉',     desc: '528Hz 疗愈频率', tags: ['冥想', '频率', '静心'] },
    cityrain:{ id: 'cityrain',type: 'cityrain',icon: '🏙️', name: '城市雨夜', desc: '窗外的雨与城市低鸣', tags: ['氛围', '怀旧', '专注'] },
    binaural: { id: 'binaural', type: 'binaural', icon: '🧠', name: '双耳节拍', desc: '用频率引导脑波状态', tags: ['频率', '专注', '冥想'] },
  },

  // === 推荐预设组合 ===
  combos: {
    sleep: {
      name: '💤 深度睡眠',
      sounds: [
        { id: 'brown', vol: 60 },
        { id: 'rain',  vol: 45 },
        { id: 'ocean', vol: 30 }
      ]
    },
    focus: {
      name: '📝 深度专注',
      sounds: [
        { id: 'white', vol: 40 },
        { id: 'rain',  vol: 35 }
      ]
    },
    meditation_combo: {
      name: '🧘 冥想入定',
      sounds: [
        { id: 'binaural', vol: 50 },
        { id: 'stream',   vol: 35 },
        { id: 'wind',     vol: 25 }
      ]
    },
    nature_walk: {
      name: '🚶 林中漫步',
      sounds: [
        { id: 'forest', vol: 50 },
        { id: 'stream', vol: 30 }
      ]
    },
    stormy_night: {
      name: '⚡ 暴风雨夜',
      sounds: [
        { id: 'rainthunder', vol: 55 },
        { id: 'wind',         vol: 35 }
      ]
    },
    cozy_cabin: {
      name: '🏠 温馨小屋',
      sounds: [
        { id: 'campfire', vol: 45 },
        { id: 'rain',     vol: 35 }
      ]
    },
    writing_corner: {
      name: '✍️ 写作角落',
      sounds: [
        { id: 'cityrain', vol: 40 },
        { id: 'fan',      vol: 25 }
      ]
    }
  },

  // === 工具方法 ===
  getCategorySounds(categoryId) {
    const cat = this.categories[categoryId];
    if (!cat) return [];
    return cat.sounds.map(sid => this.sounds[sid]).filter(Boolean);
  },

  getAllBuiltinSounds() {
    return Object.values(this.sounds);
  }
};
