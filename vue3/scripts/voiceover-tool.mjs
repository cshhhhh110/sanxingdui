import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'

const ENDPOINT = process.env.TTS_ENDPOINT || 'http://localhost:8889/api/tts/speech'
const MAX_TEXT_LENGTH = 500
const MIN_AUDIO_BYTES = 1024
const MAX_RETRIES = 2
const RETRY_DELAY_MS = 2000
const VALID_VOICES = new Set(['suda', 'bingtang', 'moli', 'default', 'zh_female', 'sweet'])

const state = {
  voice: process.env.TTS_VOICE || 'suda',
  speed: Number(process.env.TTS_SPEED || 1.0),
  outDir: path.resolve(process.cwd(), 'voiceover_output')
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function pad(value) {
  return String(value).padStart(2, '0')
}

function timestamp() {
  const now = new Date()
  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate())
  ].join('') + '-' + [
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds())
  ].join('')
}

function sanitizeFilenamePart(value, fallback = 'voiceover') {
  const cleaned = String(value || '')
    .trim()
    .replace(/\s+/g, '')
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '')
    .slice(0, 12)
  return cleaned || fallback
}

function makeOutputPath(text) {
  const name = `${timestamp()}_${sanitizeFilenamePart(text)}_${sanitizeFilenamePart(state.voice, 'voice')}.wav`
  return path.join(state.outDir, name)
}

function showHelp() {
  console.log(`
口播录音工具

直接输入文字并回车：生成一条 wav 口播
/voice suda|bingtang|moli|default|zh_female|sweet  切换音色
/speed 1.0                                      切换语速
/out 路径                                      切换输出目录
/help                                          查看帮助
exit / quit                                    退出
`)
}

function showStatus() {
  console.log('当前配置：')
  console.log(`- endpoint: ${ENDPOINT}`)
  console.log(`- voice: ${state.voice}`)
  console.log(`- speed: ${state.speed}`)
  console.log(`- output: ${state.outDir}`)
}

async function synthesize(text) {
  let lastError = null
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          text,
          voice: state.voice,
          speed: state.speed
        })
      })

      if (!response.ok) {
        const detail = await response.text()
        throw new Error(`HTTP ${response.status}: ${detail.slice(0, 240)}`)
      }

      const buffer = Buffer.from(await response.arrayBuffer())
      if (buffer.length < MIN_AUDIO_BYTES) {
        throw new Error(`音频过小：${buffer.length} bytes`)
      }
      return buffer
    } catch (error) {
      lastError = error
      if (attempt < MAX_RETRIES) {
        console.log(`生成失败，${RETRY_DELAY_MS / 1000} 秒后重试 (${attempt + 1}/${MAX_RETRIES})：${error.message}`)
        await sleep(RETRY_DELAY_MS)
      }
    }
  }
  throw lastError
}

async function generateVoiceover(text) {
  const normalizedText = text.trim()
  if (!normalizedText) return
  if (normalizedText.length > MAX_TEXT_LENGTH) {
    console.log(`文本长度 ${normalizedText.length}，超过后端 ${MAX_TEXT_LENGTH} 字限制。请拆成多段再生成。`)
    return
  }

  await fs.mkdir(state.outDir, { recursive: true })
  console.log(`正在生成：${normalizedText}`)
  const audio = await synthesize(normalizedText)
  const outputPath = makeOutputPath(normalizedText)
  await fs.writeFile(outputPath, audio)
  console.log(`已保存：${outputPath}`)
}

function setVoice(value) {
  const voice = String(value || '').trim()
  if (!VALID_VOICES.has(voice)) {
    console.log(`不支持的音色：${voice || '(空)'}`)
    console.log(`可用音色：${[...VALID_VOICES].join(', ')}`)
    return
  }
  state.voice = voice
  console.log(`已切换音色：${state.voice}`)
}

function setSpeed(value) {
  const speed = Number(value)
  if (!Number.isFinite(speed) || speed <= 0 || speed > 3) {
    console.log('语速必须是 0 到 3 之间的数字，例如 /speed 1.0')
    return
  }
  state.speed = speed
  console.log(`已切换语速：${state.speed}`)
}

function setOutDir(value) {
  const dir = String(value || '').trim()
  if (!dir) {
    console.log('请提供输出目录，例如 /out D:\\口播输出')
    return
  }
  state.outDir = path.resolve(process.cwd(), dir)
  console.log(`已切换输出目录：${state.outDir}`)
}

async function handleLine(line) {
  const text = String(line || '').trim()
  if (!text) return true
  const lower = text.toLowerCase()
  if (lower === 'exit' || lower === 'quit') return false
  if (text === '/help') {
    showHelp()
    return true
  }
  if (text === '/status') {
    showStatus()
    return true
  }
  if (text.startsWith('/voice ')) {
    setVoice(text.slice('/voice '.length))
    return true
  }
  if (text.startsWith('/speed ')) {
    setSpeed(text.slice('/speed '.length))
    return true
  }
  if (text.startsWith('/out ')) {
    setOutDir(text.slice('/out '.length))
    return true
  }
  if (text.startsWith('/')) {
    console.log('未知命令。输入 /help 查看可用命令。')
    return true
  }

  try {
    await generateVoiceover(text)
  } catch (error) {
    console.log(`生成失败：${error.message}`)
  }
  return true
}

async function main() {
  if (!VALID_VOICES.has(state.voice)) {
    state.voice = 'suda'
  }
  if (!Number.isFinite(state.speed) || state.speed <= 0) {
    state.speed = 1.0
  }

  console.log('口播录音工具已启动。输入 /help 查看命令，输入 exit 退出。')
  showStatus()

  const rl = readline.createInterface({ input, output })
  try {
    while (true) {
      let line
      try {
        line = await rl.question('\n口播> ')
      } catch (error) {
        if (error?.code === 'ERR_USE_AFTER_CLOSE') break
        throw error
      }
      const keepGoing = await handleLine(line)
      if (!keepGoing) break
    }
  } finally {
    rl.close()
  }
  console.log('已退出口播录音工具。')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
