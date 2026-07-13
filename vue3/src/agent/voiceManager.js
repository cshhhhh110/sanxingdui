export class VoiceManager {
  constructor(options = {}) {
    this.synthesize = options.synthesize
    this.revoke = options.revoke || (() => {})
    this.play = options.play
    this.getVoice = options.getVoice || (() => 'default')
    this.onStatus = options.onStatus || (() => {})
    this.onVoiceEvent = options.onVoiceEvent || (() => {})
    this.onError = options.onError || (() => {})

    this.generation = 0
    this.queue = []
    this.controllers = []
    this.currentItem = null
    this.active = false
    this.transcript = ''
    this.streamBuffer = ''
    this.ttsFailureNotified = false
    this.answerSegmentsQueued = 0
  }

  beginInteraction() {
    this.cancel('new_interaction')
    this.onStatus('exploring')
  }

  beginAnswer() {
    this.streamBuffer = ''
    this.ttsFailureNotified = false
    this.answerSegmentsQueued = 0
    this.discardQueuedAgentCues()
    this.onStatus('speaking')
  }

  discardQueuedAgentCues() {
    const retained = []
    this.queue.forEach((item) => {
      if (item.source !== 'agent_event') {
        retained.push(item)
        return
      }
      item.controller?.abort()
      this.controllers = this.controllers.filter((entry) => entry !== item.controller)
      item.audioPromise?.then((audioUrl) => this.revoke(audioUrl)).catch(() => {})
      settleVoiceItem(item, { status: 'cancelled', reason: 'answer_started' })
    })
    this.queue = retained
  }

  handleCue(cue = {}) {
    if (!cue?.text) return Promise.resolve({ status: 'skipped' })
    return this.enqueue(cue.text, {
      source: 'agent_event',
      priority: cue.priority,
      interrupt: cue.interrupt,
      cue
    })
  }

  appendAnswerText(text = '', options = {}) {
    const chunk = String(text || '')
    if (!chunk) return
    this.streamBuffer += chunk
    this.flushAnswerBuffer(Boolean(options.flush))
  }

  flushAnswerBuffer(force = true) {
    const result = splitSpeechSegments(this.streamBuffer, force, {
      firstSegment: this.answerSegmentsQueued === 0
    })
    this.streamBuffer = result.remainder
    result.segments.forEach((segment) => {
      this.answerSegmentsQueued += 1
      this.enqueue(segment, {
        source: 'answer',
        priority: 0,
        interrupt: false
      })
    })
  }

  speakText(text = '', options = {}) {
    if (options.replace !== false) {
      this.cancel('replace_text')
    }
    this.enqueue(text, {
      source: options.source || 'direct',
      priority: Number(options.priority) || 0,
      interrupt: Boolean(options.interrupt),
      playOptions: options.playOptions || {}
    })
  }

  cancel(reason = 'cancel') {
    this.generation += 1
    this.controllers.forEach((controller) => controller.abort())
    this.controllers = []
    this.queue.forEach((item) => {
      item.audioPromise?.then((audioUrl) => this.revoke(audioUrl)).catch(() => {})
      settleVoiceItem(item, { status: 'cancelled', reason })
    })
    settleVoiceItem(this.currentItem, { status: 'cancelled', reason })
    this.queue = []
    this.currentItem = null
    this.active = false
    this.transcript = ''
    this.streamBuffer = ''
    this.ttsFailureNotified = false
    this.answerSegmentsQueued = 0
    this.onStatus('idle', { reason })
  }

  enqueue(text = '', options = {}) {
    const segment = String(text || '').trim()
    if (!segment || typeof this.play !== 'function') {
      return Promise.resolve({ status: 'skipped' })
    }

    if (options.interrupt) {
      this.cancel('priority_interrupt')
    }

    const generation = this.generation
    const controller = new AbortController()
    this.controllers.push(controller)
    let resolveCompletion
    const completion = new Promise((resolve) => {
      resolveCompletion = resolve
    })
    const item = {
      text: segment,
      source: options.source || 'direct',
      generation,
      controller,
      playOptions: options.playOptions || {},
      cue: options.cue || null,
      resolveCompletion,
      settled: false,
      audioPromise: this.createAudioPromise(segment, controller, generation)
    }

    if (options.interrupt || Number(options.priority) > 50) {
      this.queue.unshift(item)
    } else {
      this.queue.push(item)
    }

    this.onVoiceEvent({
      type: 'queued',
      source: item.source,
      text: segment,
      cueType: item.cue?.type || '',
      timestamp: new Date().toISOString()
    })
    this.process(item.generation)
    return completion
  }

  createAudioPromise(text, controller, generation) {
    if (typeof this.synthesize !== 'function') {
      return Promise.resolve('')
    }

    return this.synthesize(text, this.getVoice(), 1.0, {
      signal: controller.signal
    }).then((audioUrl) => {
      if (generation !== this.generation) {
        this.revoke(audioUrl)
        return ''
      }
      return audioUrl
    }).catch((error) => {
      if (!isAbortError(error)) {
        this.onError(error, { text })
      }
      return ''
    })
  }

  async process(generation) {
    if (this.active || generation !== this.generation) return
    this.active = true
    this.onStatus('speaking')

    try {
      while (generation === this.generation && this.queue.length) {
        const item = this.queue.shift()
        this.currentItem = item
        const audioUrl = await item.audioPromise
        this.controllers = this.controllers.filter((entry) => entry !== item.controller)
        if (generation !== this.generation) {
          this.revoke(audioUrl)
          settleVoiceItem(item, { status: 'cancelled', reason: 'generation_changed' })
          continue
        }

        const textOnly = !audioUrl
        if (textOnly && !this.ttsFailureNotified) {
          this.ttsFailureNotified = true
          this.onVoiceEvent({
            type: 'tts_fallback',
            source: item.source,
            text: '当前语音服务不可用，请查看文字讲解。',
            timestamp: new Date().toISOString()
          })
        }

        try {
          await this.play({
            text: item.text,
            audioUrl,
            textOnly,
            displayPrefix: this.transcript,
            source: item.source,
            playOptions: item.playOptions
          })
        } catch (error) {
          this.onError(error, { text: item.text })
          settleVoiceItem(item, { status: 'failed', error })
          continue
        }

        if (generation === this.generation) {
          this.transcript = joinSpeechText(this.transcript, item.text)
          this.onVoiceEvent({
            type: textOnly ? 'text_only_played' : 'played',
            source: item.source,
            text: item.text,
            cueType: item.cue?.type || '',
            timestamp: new Date().toISOString()
          })
          settleVoiceItem(item, { status: textOnly ? 'text_only_played' : 'played' })
        }
        this.currentItem = null
      }
    } finally {
      if (generation === this.generation) {
        this.currentItem = null
        this.active = false
        this.onStatus('completed')
      }
    }
  }
}

export function createVoiceManager(options = {}) {
  return new VoiceManager(options)
}

export const XUANMIAO_PLAYBACK_RATE = 1.3
export const XUANMIAO_BUBBLE_MIN_MS = 6000
export const XUANMIAO_BUBBLE_MAX_MS = 15000

export function getXuanmiaoBubbleReadTime(text = '') {
  const length = String(text || '').trim().length
  return Math.max(XUANMIAO_BUBBLE_MIN_MS, Math.min(XUANMIAO_BUBBLE_MAX_MS, 6000 + length * 80))
}

export function splitSpeechSegments(text, flush = false, options = {}) {
  const segments = []
  let remainder = String(text || '')
  const sentenceEnd = /[。！？!?；;\n]/
  let isFirstSegment = options.firstSegment !== false

  while (remainder) {
    const match = sentenceEnd.exec(remainder)
    if (match) {
      const end = match.index + match[0].length
      const segment = remainder.slice(0, end).trim()
      remainder = remainder.slice(end)
      if (segment) segments.push(segment)
      isFirstSegment = false
      continue
    }

    const hardLimit = isFirstSegment ? 40 : 70
    const minimumSoftCut = isFirstSegment ? 18 : 30
    if (isFirstSegment && remainder.length >= minimumSoftCut) {
      const softCut = findSoftCut(remainder, minimumSoftCut)
      if (softCut >= minimumSoftCut) {
        segments.push(remainder.slice(0, softCut + 1).trim())
        remainder = remainder.slice(softCut + 1)
        isFirstSegment = false
        continue
      }
    }
    if (remainder.length >= hardLimit) {
      const preferredCut = Math.max(
        remainder.lastIndexOf('，', hardLimit),
        remainder.lastIndexOf(',', hardLimit),
        remainder.lastIndexOf('、', hardLimit)
      )
      const end = preferredCut >= minimumSoftCut ? preferredCut + 1 : hardLimit
      segments.push(remainder.slice(0, end).trim())
      remainder = remainder.slice(end)
      isFirstSegment = false
      continue
    }
    break
  }

  if (flush && remainder.trim()) {
    segments.push(remainder.trim())
    remainder = ''
  }

  return { segments, remainder }
}

function findSoftCut(text, minimumIndex) {
  const candidates = ['，', ',', '、']
    .map((separator) => text.indexOf(separator, minimumIndex))
    .filter((index) => index >= 0)
  return candidates.length ? Math.min(...candidates) : -1
}

export function joinSpeechText(prefix, text) {
  const previous = String(prefix || '').trim()
  const next = String(text || '').trim()
  if (!previous) return next
  if (!next) return previous
  return `${previous}${next}`
}

function isAbortError(error) {
  return error?.name === 'AbortError' ||
    error?.name === 'CanceledError' ||
    error?.code === 'ERR_CANCELED'
}

function settleVoiceItem(item, result = {}) {
  if (!item || item.settled) return
  item.settled = true
  item.resolveCompletion?.(result)
}
