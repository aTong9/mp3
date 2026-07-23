/* ========================================
   generate.ts - 每日音频生成主脚本
   用法: npx tsx server/src/generate.ts [--all]
   输出: exports/YYYY-MM-DD/ 目录下
   ======================================== */

import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import { generateSound, mixSounds, type GenerationConfig } from './AudioGenerator.js'
import { encodeWavBuffer, type WavOptions } from './WavEncoder.js'

// ============ 每日生成预设 ============
// 这些是推荐上传到各平台的音频配置

interface DailyPreset {
  title: string
  description: string
  category: string
  durationMin: number  // 分钟
  tracks: { type: GenerationConfig['type']; volume: number; options?: Record<string,number> }[]
}

const DAILY_PRESETS: DailyPreset[] = [
  // === 睡眠类 ===
  {
    title: 'Deep Sleep - Brown Noise & Gentle Rain',
    description: '布朗噪声与轻柔雨声的深度睡眠混合',
    category: 'Sleep',
    durationMin: 480, // 8小时
    tracks: [
      { type: 'brown', volume: 0.65 },
      { type: 'rain_gentle', volume: 0.35 },
      { type: 'ocean', volume: 0.2 },
    ]
  },
  {
    title: 'Rainy Night for Deep Sleeping',
    description: '窗边雨声配合远处雷鸣，助眠8小时',
    category: 'Sleep',
    durationMin: 480,
    tracks: [
      { type: 'rain_window', volume: 0.5 },
      { type: 'thunder', volume: 0.25 },
    ]
  },
  {
    title: 'Ocean Waves for Sleep - 8 Hours',
    description: '持续8小时的轻柔海浪白噪声',
    category: 'Sleep',
    durationMin: 480,
    tracks: [
      { type: 'ocean', volume: 0.65 },
      { type: 'wind_breeze', volume: 0.2 },
    ]
  },
  {
    title: 'Airplane Cabin White Noise - Deep Sleep',
    description: '模拟机舱环境的白噪声，深层助眠',
    category: 'Sleep',
    durationMin: 480,
    tracks: [
      { type: 'airplane', volume: 0.55 },
      { type: 'brown', volume: 0.3 },
    ]
  },

  // === 专注类 ===
  {
    title: 'Focus & Study - White Noise & Rain',
    description: '白噪声混合轻柔雨声，专注工作学习',
    category: 'Focus',
    durationMin: 180, // 3小时
    tracks: [
      { type: 'white', volume: 0.35 },
      { type: 'rain_gentle', volume: 0.35 },
    ]
  },
  {
    title: 'Deep Focus - Pink Noise & Stream',
    description: '粉红噪声与溪流声，深度专注3小时',
    category: 'Focus',
    durationMin: 180,
    tracks: [
      { type: 'pink', volume: 0.4 },
      { type: 'stream', volume: 0.3 },
    ]
  },

  // === 冥想类 ===
  {
    title: 'Meditation - Binaural Beats Theta 4Hz',
    description: '4Hz θ波双耳节拍配合溪流声',
    category: 'Meditation',
    durationMin: 60,
    tracks: [
      { type: 'binaural', volume: 0.5, options: { carrier: 200, beat: 4 } },
      { type: 'stream', volume: 0.3 },
      { type: 'wind_breeze', volume: 0.2 },
    ]
  },
  {
    title: 'Solfeggio 528Hz - DNA Repair Frequency',
    description: '528Hz 治愈频率纯音',
    category: 'Meditation',
    durationMin: 60,
    tracks: [
      { type: 'solfeggio', volume: 0.5, options: { freq: 528 } },
      { type: 'ocean', volume: 0.2 },
    ]
  },
  {
    title: 'Tibetan Singing Bowls - Chakra Healing',
    description: '西藏颂钵疗愈音',
    category: 'Meditation',
    durationMin: 30,
    tracks: [
      { type: 'tibetan_bowl', volume: 0.6 },
    ]
  },

  // === 自然类 ===
  {
    title: 'Thunderstorm & Heavy Rain - Nature Sounds',
    description: '暴风雨自然白噪声',
    category: 'Nature',
    durationMin: 180,
    tracks: [
      { type: 'rain_heavy', volume: 0.55 },
      { type: 'thunder', volume: 0.3 },
      { type: 'wind_strong', volume: 0.25 },
    ]
  },
  {
    title: 'Mountain Stream & Birds - Nature Relaxation',
    description: '山间溪流和自然之声',
    category: 'Nature',
    durationMin: 180,
    tracks: [
      { type: 'stream', volume: 0.4 },
      { type: 'waterfall', volume: 0.25 },
      { type: 'wind_breeze', volume: 0.2 },
    ]
  },
  {
    title: 'Campfire by the River - Cozy Ambience',
    description: '河边篝火的温馨氛围',
    category: 'Nature',
    durationMin: 120,
    tracks: [
      { type: 'fire', volume: 0.45 },
      { type: 'river', volume: 0.35 },
    ]
  },
]

// ============ 生成逻辑 ============

const WAV_OPTS: WavOptions = {
  sampleRate: 48000,
  bitDepth: 24,
  numChannels: 2, // 立体声
}

async function main() {
  const args = process.argv.slice(2)
  const generateAll = args.includes('--all')

  const today = new Date().toISOString().slice(0, 10)
  const outputDir = join(process.cwd(), 'exports', today)

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true })
  }

  console.log(`\n🔊 Whisper ASMR - 每日音频生成`)
  console.log(`📅 日期: ${today}`)
  console.log(`📁 输出: ${outputDir}`)
  console.log(`🎵 预设数: ${generateAll ? DAILY_PRESETS.length : Math.min(3, DAILY_PRESETS.length)}`)
  console.log(`🎚️ 格式: ${WAV_OPTS.sampleRate/1000}kHz ${WAV_OPTS.bitDepth}bit ${WAV_OPTS.numChannels}ch\n`)

  const presetsToGenerate = generateAll ? DAILY_PRESETS : DAILY_PRESETS.slice(0, 3)
  let successCount = 0
  let failCount = 0

  for (const preset of presetsToGenerate) {
    const startTime = Date.now()
    console.log(`\n🎯 生成: "${preset.title}" (${preset.durationMin}分钟)...`)

    try {
      const sampleRate = WAV_OPTS.sampleRate
      const durationSec = preset.durationMin * 60

      // 生成每个音轨
      const tracks: Array<{left:Float32Array,right:Float32Array}> = []
      for (const track of preset.tracks) {
        const config: GenerationConfig = {
          type: track.type,
          durationSec,
          sampleRate,
          volume: track.volume,
          options: track.options
        }
        const snd = generateSound(config)
        tracks.push(snd)
      }

      // 混合
      const mixed = mixSounds(tracks, preset.tracks.map(t => 1))

      // 编码 WAV
      const wavBuffer = encodeWavBuffer([mixed.left, mixed.right], WAV_OPTS)

      // 写入文件
      const safeName = preset.title.replace(/[^a-zA-Z0-9\u4e00-\u9fff\s\-]/g, '').replace(/\s+/g, '_')
      const filename = `${safeName}_${sampleRate/1000}kHz_${WAV_OPTS.bitDepth}bit.wav`
      const filepath = join(outputDir, filename)
      writeFileSync(filepath, wavBuffer)

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
      const sizeMB = (wavBuffer.length / 1024 / 1024).toFixed(1)
      console.log(`  ✅ 完成! ${sizeMB} MB | ${elapsed}s`)

      // 写入元数据 JSON
      const metaPath = filepath.replace('.wav', '.json')
      writeFileSync(metaPath, JSON.stringify({
        title: preset.title,
        description: preset.description,
        category: preset.category,
        durationSeconds: durationSec,
        durationFormatted: `${preset.durationMin}分钟`,
        sampleRate: WAV_OPTS.sampleRate,
        bitDepth: WAV_OPTS.bitDepth,
        channels: WAV_OPTS.numChannels,
        format: 'WAV',
        generatedAt: new Date().toISOString(),
        tracks: preset.tracks.map(t => t.type)
      }, null, 2))

      successCount++
    } catch (e) {
      console.error(`  ❌ 失败: ${e}`)
      failCount++
    }
  }

  console.log(`\n📊 生成完成: ${successCount} 成功, ${failCount} 失败`)
  console.log(`📁 输出目录: ${outputDir}\n`)

  // 提示: MP3 转换
  if (successCount > 0) {
    console.log('💡 提示: 使用 FFmpeg 转换为 MP3/FLAC:')
    console.log('   ffmpeg -i input.wav -codec:a libmp3lame -b:a 320k output.mp3')
    console.log('   ffmpeg -i input.wav -codec:a flac output.flac\n')
  }
}

main().catch(console.error)
