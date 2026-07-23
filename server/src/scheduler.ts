/* ========================================
   scheduler.ts - 每日自动调度器
   用法: npm run generate / npm run schedule

   推荐配合系统 crontab 使用（最稳定）:
     Linux/Mac:  crontab -e → 0 3 * * * cd /path && npm run generate
     Windows:    任务计划程序 → 每天3点 → cmd /c cd /path && npm run generate
   ======================================== */

import { execSync } from 'child_process'
import { resolve } from 'path'

const PROJECT_ROOT = resolve(process.cwd())
const GENERATE_SCRIPT = 'server/src/generate.ts'

function printUsage() {
  console.log('🔊 Whisper ASMR - 音频生成调度器')
  console.log('')
  console.log('命令:')
  console.log('  npm run generate           生成今日前3个预设')
  console.log('  npm run generate -- --all  生成全部13个预设')
  console.log('  npm run schedule           查看调度配置说明')
  console.log('')
  console.log('=== 推荐: 系统 crontab 每日自动执行 ===')
  console.log('')
  console.log('Linux / Mac:')
  console.log('  crontab -e')
  console.log('  0 3 * * * cd ' + PROJECT_ROOT + ' && /usr/local/bin/npm run generate')
  console.log('')
  console.log('Windows (任务计划程序):')
  console.log('  创建基本任务 → 每天 3:00 AM')
  console.log('  操作: 启动程序')
  console.log('  程序: cmd.exe')
  console.log('  参数: /c "cd /d ' + PROJECT_ROOT + ' && npm run generate"')
  console.log('')
  console.log('=== 支持的平台（上传路径建议）===')
  console.log('  Spotify / Apple Music → 通过 DistroKid/CD Baby 分发')
  console.log('  YouTube → 配合静态画面视频上传')
  console.log('  喜马拉雅FM → Web端直接上传')
  console.log('  QQ音乐/网易云 → 通过音乐人平台')
  console.log('')
}

// 立即测试生成一次
async function testGenerate() {
  console.log('🧪 立即测试生成一次...\n')
  try {
    execSync(`npx tsx ${GENERATE_SCRIPT}`, {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
      env: { ...process.env, FORCE_COLOR: '1' }
    })
  } catch (e) {
    console.error('生成失败，请确保已安装依赖: cd server && npm install')
  }
}

const args = process.argv.slice(2)

if (args.includes('--help') || args.includes('-h')) {
  printUsage()
} else {
  printUsage()
  testGenerate()
}
