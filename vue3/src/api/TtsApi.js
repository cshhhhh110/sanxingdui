import axios from 'axios'
import { useUserStore } from '@/store/user'

const TTS_BASE = import.meta.env.VITE_APP_BASE_API || '/api'

/**
 * 调用 MOSS-TTS-Nano 将文本转为语音（一次性）
 * @param {string} text - 要合成的文本
 * @param {string} voice - 音色名，默认 default
 * @param {number} speed - 语速，默认 1.0
 * @returns {Promise<string>} blob URL 供 Audio 播放
 */
export async function synthesizeSpeech(text, voice = 'default', speed = 1.0) {
  const token = useUserStore()?.token
  const headers = { 'Content-Type': 'application/json' }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await axios.post(
    `${TTS_BASE}/tts/speech`,
    { text, voice, speed },
    { headers, responseType: 'blob' }
  )

  return URL.createObjectURL(response.data)
}

/**
 * 流式 TTS：通过 SSE 逐块接收 WAV 音频，边生成边播放
 * @param {string} text
 * @param {string} voice
 * @param {function} onChunk - 每收到一个 WAV chunk (ArrayBuffer) 时回调
 * @param {function} onDone - 全部收完时回调
 * @param {function} onError - 出错回调
 */
export async function synthesizeSpeechStream(text, voice = 'default', { onChunk, onDone, onError } = {}) {
  const token = useUserStore()?.token
  const headers = { 'Content-Type': 'application/json' }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${TTS_BASE}/tts/speech-stream`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ text, voice })
  })

  if (!response.ok) {
    throw new Error(`TTS stream failed: ${response.status}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    // SSE 格式: "data: <base64>\n\n"
    const lines = buffer.split('\n\n')
    buffer = lines.pop() // 保留未完成的部分

    for (const line of lines) {
      if (line.startsWith('data:')) {
        const b64 = line.slice(5).trim()
        if (!b64) continue
        try {
          const binaryStr = atob(b64)
          const bytes = new Uint8Array(binaryStr.length)
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i)
          }
          if (onChunk) onChunk(bytes.buffer)
        } catch (e) {
          // 跳过无效 base64
        }
      } else if (line.startsWith('event:error')) {
        if (onError) onError(new Error(line))
      }
    }
  }
  if (onDone) onDone()
}

/**
 * 获取可用音色列表
 * @returns {Promise<Array<{key:string, label:string, desc:string}>>}
 */
export async function getVoices() {
  const res = await axios.get(`${TTS_BASE}/tts/voices`)
  return res.data
}

export function revokeSpeechUrl(url) {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}
