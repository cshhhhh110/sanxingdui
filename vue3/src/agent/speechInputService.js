export const SpeechInputStatus = Object.freeze({
  IDLE: 'idle',
  REQUESTING: 'requesting',
  LISTENING: 'listening',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  ERROR: 'error'
})

const MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm'
]

export class SpeechInputService {
  constructor(options = {}) {
    this.transcribe = options.transcribe || null
    this.onStatus = options.onStatus || (() => {})
    this.onError = options.onError || (() => {})
    this.onAutoStop = options.onAutoStop || null
    this.maxDurationMs = options.maxDurationMs || 60000
    this.status = SpeechInputStatus.IDLE
    this.mediaRecorder = null
    this.mediaStream = null
    this.chunks = []
    this.mimeType = ''
    this.stopTimer = null
    this.stopPromise = null
    this.stopResolve = null
    this.stopReject = null
  }

  static isSupported(env = getBrowserEnv()) {
    return Boolean(
      env.window?.MediaRecorder &&
      env.navigator?.mediaDevices?.getUserMedia
    )
  }

  static selectMimeType(mediaRecorderCtor = getBrowserEnv().window?.MediaRecorder) {
    if (!mediaRecorderCtor) return ''
    const isTypeSupported = mediaRecorderCtor.isTypeSupported
    if (typeof isTypeSupported !== 'function') return ''
    return MIME_CANDIDATES.find((mimeType) => isTypeSupported.call(mediaRecorderCtor, mimeType)) || ''
  }

  static isKeyboardEditableTarget(target) {
    if (!target) return false
    const element = target.nodeType === 1 ? target : target.parentElement
    if (!element) return false
    const tagName = String(element.tagName || '').toLowerCase()
    return tagName === 'input' ||
      tagName === 'textarea' ||
      element.isContentEditable ||
      Boolean(element.closest?.('[contenteditable="true"],[contenteditable="plaintext-only"]'))
  }

  isSupported() {
    return SpeechInputService.isSupported()
  }

  getStatus() {
    return this.status
  }

  isActive() {
    return this.status === SpeechInputStatus.REQUESTING ||
      this.status === SpeechInputStatus.LISTENING ||
      this.status === SpeechInputStatus.PROCESSING
  }

  async start() {
    if (!this.isSupported()) {
      throw this.createError('unsupported', '当前浏览器暂不支持语音输入，请尝试Chrome或Edge。')
    }
    if (this.status === SpeechInputStatus.LISTENING || this.status === SpeechInputStatus.REQUESTING) {
      return
    }

    this.cleanup({ keepStatus: true })
    this.setStatus(SpeechInputStatus.REQUESTING)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const MediaRecorderCtor = window.MediaRecorder
      const mimeType = SpeechInputService.selectMimeType(MediaRecorderCtor)
      const recorder = new MediaRecorderCtor(stream, mimeType ? { mimeType } : undefined)

      this.mediaStream = stream
      this.mediaRecorder = recorder
      this.mimeType = mimeType || recorder.mimeType || 'audio/webm'
      this.chunks = []
      this.stopPromise = new Promise((resolve, reject) => {
        this.stopResolve = resolve
        this.stopReject = reject
      })

      recorder.ondataavailable = (event) => {
        if (event.data?.size) {
          this.chunks.push(event.data)
        }
      }
      recorder.onerror = (event) => {
        const error = event.error || this.createError('recording_failed', '语音输入失败，可以继续使用文字提问。')
        this.rejectStop(error)
      }
      recorder.onstop = () => {
        const file = this.buildAudioFile()
        this.resolveStop(file)
      }

      recorder.start()
      this.setStatus(SpeechInputStatus.LISTENING)
      if (this.maxDurationMs > 0) {
        this.stopTimer = setTimeout(() => {
          if (this.status !== SpeechInputStatus.LISTENING) return
          if (typeof this.onAutoStop === 'function') {
            this.onAutoStop()
          } else {
            void this.stopAndTranscribe()
          }
        }, this.maxDurationMs)
      }
    } catch (error) {
      this.cleanup()
      const normalized = normalizeSpeechInputError(error)
      this.setStatus(SpeechInputStatus.ERROR, normalized)
      this.onError(normalized)
      throw normalized
    }
  }

  async stop(options = {}) {
    const { transcribe = false } = options
    if (!this.mediaRecorder) {
      this.cleanup()
      return null
    }

    const stopPromise = this.stopPromise
    if (this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop()
      } catch (error) {
        this.rejectStop(error)
      }
    }

    const file = await stopPromise
    this.stopTracks()
    this.clearTimer()

    if (!transcribe) {
      this.setStatus(SpeechInputStatus.IDLE)
      return file
    }

    return this.transcribeFile(file)
  }

  async stopAndTranscribe() {
    return this.stop({ transcribe: true })
  }

  cancel() {
    try {
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop()
      }
    } catch (error) {
      console.warn('Cancel speech input failed:', error)
    }
    this.cleanup()
  }

  async transcribeFile(file) {
    if (!file || !file.size) {
      const error = this.createError('empty_audio', '没有录到有效声音，请重试。')
      this.setStatus(SpeechInputStatus.ERROR, error)
      this.onError(error)
      throw error
    }
    if (typeof this.transcribe !== 'function') {
      const error = this.createError('missing_transcriber', '语音识别接口未配置。')
      this.setStatus(SpeechInputStatus.ERROR, error)
      this.onError(error)
      throw error
    }

    this.setStatus(SpeechInputStatus.PROCESSING)
    try {
      const transcript = await this.transcribe(file)
      this.setStatus(SpeechInputStatus.SUCCESS)
      return String(transcript || '').trim()
    } catch (error) {
      const normalized = normalizeSpeechInputError(error)
      this.setStatus(SpeechInputStatus.ERROR, normalized)
      this.onError(normalized)
      throw normalized
    } finally {
      this.cleanup({ keepStatus: true })
    }
  }

  buildAudioFile() {
    const type = this.mimeType || 'audio/webm'
    const extension = type.includes('wav')
      ? 'wav'
      : type.includes('ogg')
        ? 'ogg'
        : type.includes('mp4')
          ? 'm4a'
          : 'webm'
    const blob = new Blob(this.chunks, { type })
    return new File([blob], `xuanmiao-voice-${Date.now()}.${extension}`, { type })
  }

  resolveStop(file) {
    const resolve = this.stopResolve
    this.stopResolve = null
    this.stopReject = null
    this.stopPromise = null
    if (resolve) resolve(file)
  }

  rejectStop(error) {
    const reject = this.stopReject
    this.stopResolve = null
    this.stopReject = null
    this.stopPromise = null
    if (reject) reject(normalizeSpeechInputError(error))
  }

  cleanup(options = {}) {
    this.clearTimer()
    this.stopTracks()
    this.mediaRecorder = null
    this.mediaStream = null
    this.chunks = []
    this.mimeType = ''
    this.stopPromise = null
    this.stopResolve = null
    this.stopReject = null
    if (!options.keepStatus) {
      this.setStatus(SpeechInputStatus.IDLE)
    }
  }

  stopTracks() {
    const stream = this.mediaStream
    this.mediaStream = null
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
    }
  }

  clearTimer() {
    if (this.stopTimer) {
      clearTimeout(this.stopTimer)
      this.stopTimer = null
    }
  }

  setStatus(status, error = null) {
    this.status = status
    this.onStatus({ status, error })
  }

  createError(code, message) {
    const error = new Error(message)
    error.code = code
    return error
  }
}

export function createSpeechInputService(options = {}) {
  return new SpeechInputService(options)
}

export function getSpeechInputSupportMessage() {
  const env = getBrowserEnv()
  if (!env.window || !env.navigator) {
    return '当前运行环境不支持语音输入。'
  }
  const host = env.window.location?.hostname || ''
  const isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(host)
  if (env.window.location?.protocol !== 'https:' && !isLocalhost) {
    return '语音输入需要 HTTPS 或 localhost 环境。'
  }
  if (!env.navigator.mediaDevices?.getUserMedia) {
    return '玄喵无法访问麦克风，请检查浏览器权限。'
  }
  if (!env.window.MediaRecorder) {
    return '当前浏览器暂不支持语音输入，请尝试Chrome或Edge。'
  }
  return ''
}

export function normalizeSpeechInputError(error = {}) {
  const name = error.name || ''
  const code = error.code || ''
  const rawMessage = error.message || ''

  if (name === 'NotAllowedError' || code === 'not-allowed' || code === 'permission_denied') {
    return createSpeechError('permission_denied', '玄喵无法访问麦克风，请检查浏览器权限。')
  }
  if (name === 'NotFoundError' || code === 'audio-capture') {
    return createSpeechError('microphone_missing', '没有检测到可用麦克风，请检查系统输入设备。')
  }
  if (code === 'unsupported') {
    return createSpeechError('unsupported', '当前浏览器暂不支持语音输入，请尝试Chrome或Edge。')
  }
  if (code === 'empty_audio') {
    return createSpeechError('empty_audio', '没有录到有效声音，请重试。')
  }

  return createSpeechError(code || 'speech_input_failed', rawMessage || '语音输入失败，可以继续使用文字提问。')
}

function createSpeechError(code, message) {
  const error = new Error(message)
  error.code = code
  return error
}

function getBrowserEnv() {
  return {
    window: typeof window === 'undefined' ? null : window,
    navigator: typeof navigator === 'undefined' ? null : navigator
  }
}
