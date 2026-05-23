export function getBrowserSpeechRecognitionCtor() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

export function createBrowserSpeechRecognition() {
  const Ctor = getBrowserSpeechRecognitionCtor()
  if (!Ctor) {
    return null
  }

  const recognition = new Ctor()
  recognition.lang = 'zh-CN'
  recognition.continuous = false
  recognition.interimResults = true
  recognition.maxAlternatives = 1
  return recognition
}
