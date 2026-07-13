import { strict as assert } from 'assert'
import { build } from 'esbuild'
import { mkdtemp, rm } from 'fs/promises'
import os from 'os'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const tempDir = await mkdtemp(path.join(os.tmpdir(), 'agent-speech-input-'))

try {
  const speechModule = await bundleImport('src/agent/speechInputService.js', 'speechInputService.mjs')

  runMimeSelectionCase(speechModule)
  runKeyboardFocusGuardCase(speechModule)
  await runRecordingTranscriptionCase(speechModule)
  await runUnsupportedCase(speechModule)

  console.log('Agent speech input regression: PASS')
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

function runMimeSelectionCase({ SpeechInputService }) {
  class FakeMediaRecorder {}
  FakeMediaRecorder.isTypeSupported = (mimeType) => mimeType === 'audio/webm;codecs=opus'
  assert.equal(SpeechInputService.selectMimeType(FakeMediaRecorder), 'audio/webm;codecs=opus')

  class FallbackMediaRecorder {}
  FallbackMediaRecorder.isTypeSupported = (mimeType) => mimeType === 'audio/webm'
  assert.equal(SpeechInputService.selectMimeType(FallbackMediaRecorder), 'audio/webm')

  class DefaultMediaRecorder {}
  DefaultMediaRecorder.isTypeSupported = () => false
  assert.equal(SpeechInputService.selectMimeType(DefaultMediaRecorder), '')
  console.log('- speech input mime selection: PASS')
}

function runKeyboardFocusGuardCase({ SpeechInputService }) {
  const input = { tagName: 'INPUT', nodeType: 1 }
  const textarea = { tagName: 'TEXTAREA', nodeType: 1 }
  const contentEditable = { tagName: 'DIV', nodeType: 1, isContentEditable: true }
  const plainButton = { tagName: 'BUTTON', nodeType: 1, closest: () => null }

  assert.equal(SpeechInputService.isKeyboardEditableTarget(input), true)
  assert.equal(SpeechInputService.isKeyboardEditableTarget(textarea), true)
  assert.equal(SpeechInputService.isKeyboardEditableTarget(contentEditable), true)
  assert.equal(SpeechInputService.isKeyboardEditableTarget(plainButton), false)
  console.log('- speech input keyboard focus guard: PASS')
}

async function runRecordingTranscriptionCase({
  SpeechInputService,
  SpeechInputStatus,
  createSpeechInputService
}) {
  const statuses = []
  const stoppedTracks = []

  class FakeMediaRecorder {
    constructor(stream, options) {
      this.stream = stream
      this.options = options
      this.mimeType = options?.mimeType || 'audio/webm'
      this.state = 'inactive'
      this.ondataavailable = null
      this.onstop = null
    }

    start() {
      this.state = 'recording'
    }

    stop() {
      this.state = 'inactive'
      this.ondataavailable?.({ data: new Blob(['voice-bytes'], { type: this.mimeType }) })
      this.onstop?.()
    }
  }
  FakeMediaRecorder.isTypeSupported = (mimeType) => mimeType === 'audio/webm;codecs=opus'

  installBrowserEnv({
    MediaRecorder: FakeMediaRecorder,
    getUserMedia: async () => ({
      getTracks: () => [{ stop: () => stoppedTracks.push('stop') }]
    })
  })

  assert.equal(SpeechInputService.isSupported(), true)

  const service = createSpeechInputService({
    maxDurationMs: 0,
    transcribe: async (file) => {
      assert.equal(file.type, 'audio/webm;codecs=opus')
      assert(file.name.endsWith('.webm'))
      return '介绍青铜神树'
    },
    onStatus: ({ status }) => statuses.push(status)
  })

  await service.start()
  const transcript = await service.stopAndTranscribe()

  assert.equal(transcript, '介绍青铜神树')
  assert(statuses.includes(SpeechInputStatus.REQUESTING), 'should request microphone permission')
  assert(statuses.includes(SpeechInputStatus.LISTENING), 'should enter listening status')
  assert(statuses.includes(SpeechInputStatus.PROCESSING), 'should enter processing status')
  assert(statuses.includes(SpeechInputStatus.SUCCESS), 'should enter success status')
  assert.equal(stoppedTracks.length, 1)
  console.log('- speech input recording and transcription: PASS')
}

async function runUnsupportedCase({ createSpeechInputService }) {
  installBrowserEnv({
    MediaRecorder: null,
    getUserMedia: async () => ({ getTracks: () => [] })
  })

  const service = createSpeechInputService()
  await assert.rejects(
    () => service.start(),
    (error) => error.code === 'unsupported'
  )
  console.log('- speech input unsupported browser fallback: PASS')
}

function installBrowserEnv({ MediaRecorder, getUserMedia }) {
  Object.defineProperty(globalThis, 'window', {
    value: {
      MediaRecorder,
      location: {
        protocol: 'http:',
        hostname: 'localhost'
      }
    },
    configurable: true
  })
  Object.defineProperty(globalThis, 'navigator', {
    value: {
      mediaDevices: {
        getUserMedia
      }
    },
    configurable: true
  })
}
