import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import readline from 'node:readline/promises'
import { fileURLToPath } from 'node:url'
import { stdin as input, stdout as output } from 'node:process'

const toolDir = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.join(toolDir, '.env')

async function loadLocalEnv() {
  try {
    const content = await fs.readFile(envPath, 'utf8')
    content.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) return
      const index = trimmed.indexOf('=')
      if (index <= 0) return
      const key = trimmed.slice(0, index).trim()
      const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, '')
      if (key && process.env[key] === undefined) {
        process.env[key] = value
      }
    })
  } catch {}
}

await loadLocalEnv()

const API_KEY = process.env.TTS_API_KEY || ''
const BASE_URL = process.env.TTS_BASE_URL || 'https://token-plan-cn.xiaomimimo.com/v1'
const MODEL = process.env.TTS_MODEL || 'mimo-v2.5-tts'
const MAX_TEXT_LENGTH = 500
const MIN_AUDIO_BYTES = 1024
const MAX_RETRIES = 2
const RETRY_DELAY_MS = 2000
const VALID_VOICES = new Set(['suda', 'bingtang', 'moli', 'default', 'zh_female', 'sweet'])

const VOICE_MAP = {
  suda: '\u82cf\u6253',
  bingtang: '\u51b0\u7cd6',
  moli: '\u8309\u8389',
  default: '\u82cf\u6253',
  zh_female: '\u51b0\u7cd6',
  sweet: '\u8309\u8389'
}

const state = {
  voice: process.env.TTS_VOICE || 'suda',
  speed: Number(process.env.TTS_SPEED || 1.0),
  outDir: path.resolve(toolDir, process.env.TTS_OUTPUT_DIR || 'voiceover_output')
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
口播录音工具 (MiMo TTS 直连版)

直接输入文字并回车：生成一条 wav 口播
/voice suda|bingtang|moli|default|zh_female|sweet  切换音色
/speed 1.0                                      切换语速
/out 路径                                      切换输出目录
/status                                        查看当前配置
/help                                          查看帮助
exit / quit                                    退出
`)
}

function showStatus() {
  console.log('当前配置：')
  console.log(`- base-url: ${BASE_URL}`)
  console.log(`- model: ${MODEL}`)
  console.log(`- voice: ${state.voice} (${VOICE_MAP[state.voice] || state.voice})`)
  console.log(`- speed: ${state.speed}`)
  console.log(`- output: ${state.outDir}`)
  console.log(`- api-key: ${API_KEY ? API_KEY.slice(0, 8) + '...' : '(未配置)'}`)
}

async function synthesize(text) {
  const voiceName = VOICE_MAP[state.voice] || VOICE_MAP.default

  const payload = JSON.stringify({
    model: MODEL,
    messages: [
      { role: 'user', content: 'Read the following Chinese text naturally and clearly.' },
      { role: 'assistant', content: text }
    ],
    audio: {
      format: 'wav',
      voice: voiceName
    },
    stream: false
  })

  let lastError = null
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 60000)

      const response = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': API_KEY
        },
        body: payload,
        signal: controller.signal
      })
      clearTimeout(timeout)

      if (!response.ok) {
        const detail = await response.text()
        throw new Error(`HTTP ${response.status}: ${detail.slice(0, 240)}`)
      }

      const json = await response.json()
      const b64 = json?.choices?.[0]?.message?.audio?.data
      if (!b64) {
        throw new Error('MiMo TTS returned no audio data')
      }

      const buffer = Buffer.from(b64, 'base64')
      if (buffer.length < MIN_AUDIO_BYTES) {
        throw new Error(`音频过小：${buffer.length} bytes`)
      }
      return buffer
    } catch (error) {
      lastError = error
      if (attempt < MAX_RETRIES) {
        console.log(`生成失败，${RETRY_DELAY_MS / 1000}秒后重试 (${attempt + 1}/${MAX_RETRIES})：${error.message}`)
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
    console.log(`文本长度 ${normalizedText.length}，超过 ${MAX_TEXT_LENGTH} 字限制。请拆成多段再生成。`)
    return
  }

  if (!API_KEY) {
    console.log('错误：未配置 TTS_API_KEY。请在 .env 文件中设置。')
    return
  }

  await fs.mkdir(state.outDir, { recursive: true })
  console.log(`正在生成：${normalizedText}`)
  const audio = await synthesize(normalizedText)
  const outputPath = makeOutputPath(normalizedText)
  await fs.writeFile(outputPath, audio)
  console.log(`已保存：${outputPath} (${(audio.length / 1024).toFixed(0)}KB)`)
}

function setVoice(value) {
  const voice = String(value || '').trim()
  if (!VALID_VOICES.has(voice)) {
    console.log(`不支持的音色：${voice || '(空)'}`)
    console.log(`可用音色：${[...VALID_VOICES].join(', ')}`)
    return
  }
  state.voice = voice
  console.log(`已切换音色：${state.voice} (${VOICE_MAP[state.voice]})`)
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
  state.outDir = path.resolve(toolDir, dir)
  console.log(`已切换输出目录：${state.outDir}`)
}

async function handleLine(line) {
  const text = String(line || '').trim()
  if (!text) return true
  const lower = text.toLowerCase()
  if (lower === 'exit' || lower === 'quit') return false
  if (text === '/help') { showHelp(); return true }
  if (text === '/status') { showStatus(); return true }
  if (text.startsWith('/voice ')) { setVoice(text.slice('/voice '.length)); return true }
  if (text.startsWith('/speed ')) { setSpeed(text.slice('/speed '.length)); return true }
  if (text.startsWith('/out ')) { setOutDir(text.slice('/out '.length)); return true }
  if (text.startsWith('/')) { console.log('未知命令。输入 /help 查看可用命令。'); return true }

  try {
    await generateVoiceover(text)
  } catch (error) {
    console.log(`生成失败：${error.message}`)
  }
  return true
}

async function main() {
  if (!VALID_VOICES.has(state.voice)) state.voice = 'suda'
  if (!Number.isFinite(state.speed) || state.speed <= 0) state.speed = 1.0

  console.log('口播录音工具已启动 (MiMo TTS 直连版)。输入 /help 查看命令，输入 exit 退出。')
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
