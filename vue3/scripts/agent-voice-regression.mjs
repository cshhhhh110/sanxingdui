import { strict as assert } from 'assert'
import { build } from 'esbuild'
import { mkdtemp, readFile, rm } from 'fs/promises'
import os from 'os'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const tempDir = await mkdtemp(path.join(os.tmpdir(), 'agent-voice-'))

try {
  const voiceManagerModule = await bundleImport('src/agent/voiceManager.js', 'voiceManager.mjs')
  const voicePolicyModule = await bundleImport('src/agent/voicePolicy.js', 'voicePolicy.mjs')

  await runVoicePolicyKnowledgeCase(voicePolicyModule)
  await runVoicePolicyToolCase(voicePolicyModule)
  await runGuideExperienceVoiceCase(voicePolicyModule)
  await runVoiceManagerSentenceCase(voiceManagerModule)
  await runVoiceManagerFirstChunkCase(voiceManagerModule)
  await runVoiceManagerDiscardPendingCueCase(voiceManagerModule)
  runVoicePresentationTimingCase(voiceManagerModule)
  await runIntegrationSourceCase()
  await runVoiceManagerCueCompletionCase(voiceManagerModule)
  await runVoiceManagerTtsFailureCase(voiceManagerModule)
  await runVoiceManagerCancelCase(voiceManagerModule)

  console.log('Agent voice regression: PASS')
} finally {
  await rm(tempDir, { recursive: true, force: true })
}

async function bundleImport(relativeEntry, name) {
  const outfile = path.join(tempDir, name)
  await build({
    entryPoints: [path.join(root, relativeEntry)],
    outfile,
    bundle: true,
    format: 'esm',
    platform: 'node',
    logLevel: 'silent'
  })
  return import(pathToFileURL(outfile).href)
}

async function runVoicePolicyKnowledgeCase({
  createVoicePolicySession,
  selectAgentVoiceCue,
  createVoiceTraceEvent
}) {
  const session = createVoicePolicySession({
    question: '三星堆和金沙有什么联系？',
    route: 'RAG',
    context: {}
  })
  const start = selectAgentVoiceCue({
    type: 'knowledge_search',
    message: '正在查阅古蜀文明资料',
    metadata: {}
  }, session)
  assert(start?.text.includes('三星堆和金沙'), 'knowledge start cue should mention the user topic')

  const duplicateStart = selectAgentVoiceCue({
    type: 'knowledge_search',
    message: '正在查阅资料',
    metadata: {}
  }, session)
  assert.equal(duplicateStart, null, 'knowledge start cue should not repeat')

  const clue = selectAgentVoiceCue({
    type: 'relation_discovery',
    message: '找到资料',
    metadata: { referenceCount: 2 }
  }, session)
  assert.equal(clue, null, 'relation discovery should stay visual during ordinary Q&A')

  const completed = selectAgentVoiceCue({
    type: 'completed',
    status: 'success',
    message: '探索完成',
    metadata: {}
  }, session)
  assert.equal(completed, null, 'completed event should not delay ordinary answer audio')

  const trace = createVoiceTraceEvent(start, { type: 'knowledge_search' })
  assert.equal(trace.sourceEventType, 'knowledge_search')
  console.log('- voice policy knowledge cues: PASS')
}

async function runGuideExperienceVoiceCase({ createVoicePolicySession, selectAgentVoiceCue }) {
  const session = createVoicePolicySession({ question: '我第一次来，只有20分钟', route: 'TOOL_CALL' })
  const preparing = selectAgentVoiceCue({
    type: 'guide_preparing_visit',
    message: '我正在为你准备20分钟精华路线。',
    metadata: {}
  }, session)
  const destination = selectAgentVoiceCue({
    type: 'guide_introducing_destination',
    message: '第一站，我们先看青铜大立人。',
    metadata: {}
  }, session)
  assert(preparing?.text.includes('20分钟'), 'guide preparation narration should remain speakable')
  assert(destination?.text.includes('青铜大立人'), 'guide destination narration should remain speakable')
  console.log('- guide experience voice cues remain intact: PASS')
}

async function runVoicePolicyToolCase({ createVoicePolicySession, selectAgentVoiceCue }) {
  const session = createVoicePolicySession({
    question: '打开金面具展线',
    route: 'TOOL_CALL',
    context: {}
  })
  const cue = selectAgentVoiceCue({
    type: 'tool_prepare',
    message: '正在准备工具',
    metadata: {
      toolName: 'control_trail',
      arguments: { artifactName: '金面具' }
    }
  }, session)
  assert(cue?.text.includes('金面具'), 'tool cue should mention the visitor target')
  assert(!cue.text.includes('control_trail'), 'tool cue must hide technical tool names')
  console.log('- voice policy tool cue hides technical logs: PASS')
}

async function runVoiceManagerSentenceCase({ createVoiceManager }) {
  const played = []
  const manager = createVoiceManager({
    synthesize: async (text, voice, speed, config) => {
      assert(!config.signal.aborted, 'signal should be active before synthesis')
      return `blob://voice/${encodeURIComponent(text)}`
    },
    revoke: () => {},
    play: async (item) => {
      played.push(item)
    }
  })

  manager.beginInteraction()
  manager.beginAnswer()
  manager.appendAnswerText('三星堆遗址位于四川广汉。它代表了古蜀文明的重要发展阶段。', { flush: true })
  await waitFor(() => played.length === 2)
  assert(played.every((item) => !item.textOnly), 'successful TTS should play audio-backed segments')
  console.log('- voice manager sentence queue: PASS')
}

async function runVoiceManagerFirstChunkCase({ createVoiceManager }) {
  const played = []
  const manager = createVoiceManager({
    synthesize: async (text) => `blob://${text}`,
    revoke: () => {},
    play: async (item) => played.push(item.text)
  })

  manager.beginInteraction()
  manager.beginAnswer()
  manager.appendAnswerText('青铜神树是三星堆最具代表性的文物之一，它以复杂造型连接天地人神')
  await waitFor(() => played.length === 1)
  assert(played[0].endsWith('，'), 'first answer chunk should start at a suitable comma before 40 characters')
  console.log('- voice manager starts first answer chunk early: PASS')
}

async function runVoiceManagerDiscardPendingCueCase({ createVoiceManager }) {
  const played = []
  let releaseCurrentCue
  const manager = createVoiceManager({
    synthesize: async (text) => `blob://${text}`,
    revoke: () => {},
    play: async (item) => {
      played.push(item.text)
      if (item.text === '第一条准备提示') {
        await new Promise((resolve) => { releaseCurrentCue = resolve })
      }
    }
  })

  manager.beginInteraction()
  manager.handleCue({ text: '第一条准备提示', type: 'start' })
  manager.handleCue({ text: '不应播放的排队提示', type: 'clue' })
  await waitFor(() => played.length === 1)
  manager.beginAnswer()
  manager.appendAnswerText('这是正文回答。', { flush: true })
  releaseCurrentCue()
  await waitFor(() => played.length === 2)
  assert.deepEqual(played, ['第一条准备提示', '这是正文回答。'])
  console.log('- answer start discards pending exploration cues: PASS')
}

function runVoicePresentationTimingCase({
  getXuanmiaoBubbleReadTime,
  XUANMIAO_BUBBLE_MAX_MS,
  XUANMIAO_BUBBLE_MIN_MS,
  XUANMIAO_PLAYBACK_RATE
}) {
  assert.equal(XUANMIAO_PLAYBACK_RATE, 1.3, 'all Xuanmiao audio should use 1.3x playback')
  assert.equal(getXuanmiaoBubbleReadTime(''), XUANMIAO_BUBBLE_MIN_MS)
  assert(getXuanmiaoBubbleReadTime('短回答') >= XUANMIAO_BUBBLE_MIN_MS)
  assert.equal(getXuanmiaoBubbleReadTime('长'.repeat(500)), XUANMIAO_BUBBLE_MAX_MS)
  assert(getXuanmiaoBubbleReadTime('中'.repeat(50)) > XUANMIAO_BUBBLE_MIN_MS)
  console.log('- playback rate and dynamic bubble timing: PASS')
}

async function runIntegrationSourceCase() {
  const live2dSource = await readFile(path.join(root, 'src/components/Live2DAvatar.vue'), 'utf8')
  const trailSource = await readFile(path.join(root, 'src/views/frontend/TimeSpaceTrail.vue'), 'utf8')
  const eventParseCount = (trailSource.match(/parseAgentStreamEvent\(event\.data\)/g) || []).length

  assert(eventParseCount >= 2, 'both TimeSpaceTrail SSE consumers must filter agent event frames')
  assert(live2dSource.includes('audioEl.playbackRate = XUANMIAO_PLAYBACK_RATE'))
  assert(live2dSource.includes('source.playbackRate.value = XUANMIAO_PLAYBACK_RATE'))
  assert(live2dSource.includes('@mouseenter="handlePanelMouseEnter"'))
  assert(live2dSource.includes('@wheel.passive="pauseBubbleHide"'))
  assert(live2dSource.includes('this.isBubbleHideBlocked()'))
  console.log('- SSE filtering, 1.3x playback paths and bubble interaction wiring: PASS')
}

async function runVoiceManagerTtsFailureCase({ createVoiceManager }) {
  const played = []
  const events = []
  const manager = createVoiceManager({
    synthesize: async () => {
      throw new Error('provider unavailable')
    },
    revoke: () => {},
    play: async (item) => {
      played.push(item)
    },
    onVoiceEvent: (event) => events.push(event)
  })

  manager.beginInteraction()
  manager.beginAnswer()
  manager.appendAnswerText('当前回答应该继续显示。', { flush: true })
  await waitFor(() => played.length === 1)
  assert.equal(played[0].textOnly, true, 'TTS failure should degrade to text-only playback')
  assert(events.some((event) => event.type === 'tts_fallback'), 'TTS failure should record fallback event')
  console.log('- voice manager TTS failure fallback: PASS')
}

async function runVoiceManagerCueCompletionCase({ createVoiceManager }) {
  const timeline = []
  let releasePlayback
  const manager = createVoiceManager({
    synthesize: async () => 'blob://guide-cue',
    revoke: () => {},
    play: async () => {
      timeline.push('play_started')
      await new Promise((resolve) => {
        releasePlayback = resolve
      })
      timeline.push('play_completed')
    }
  })

  manager.beginInteraction()
  const completion = manager.handleCue({ text: '第一站，我们去看看青铜大立人。', type: 'guide_introducing_destination' })
  await waitFor(() => timeline.includes('play_started'))
  let settled = false
  completion.then(() => { settled = true })
  await Promise.resolve()
  assert.equal(settled, false, 'guide cue completion must remain pending during playback')
  releasePlayback()
  await completion
  assert.equal(timeline.at(-1), 'play_completed', 'guide cue completion should resolve after playback')
  console.log('- voice manager exposes guide cue completion barrier: PASS')
}

async function runVoiceManagerCancelCase({ createVoiceManager }) {
  const played = []
  const manager = createVoiceManager({
    synthesize: (text, voice, speed, config) => new Promise((resolve, reject) => {
      const timer = setTimeout(() => resolve(`blob://${text}`), text.includes('旧问题') ? 80 : 5)
      config.signal.addEventListener('abort', () => {
        clearTimeout(timer)
        reject(new DOMException('aborted', 'AbortError'))
      })
    }),
    revoke: () => {},
    play: async (item) => {
      played.push(item.text)
    }
  })

  manager.beginInteraction()
  manager.beginAnswer()
  manager.appendAnswerText('旧问题的回答。', { flush: true })
  manager.cancel('new_question')
  manager.beginAnswer()
  manager.appendAnswerText('新问题的回答。', { flush: true })
  await waitFor(() => played.length === 1)
  assert.equal(played[0], '新问题的回答。', 'new question should cancel old speech')
  console.log('- voice manager cancels stale speech: PASS')
}

async function waitFor(predicate, timeoutMs = 1000) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    if (predicate()) return
    await new Promise((resolve) => setTimeout(resolve, 10))
  }
  throw new Error('Timed out waiting for assertion')
}
