const STORAGE_KEY = 'sanxingdui-competition-trail'
const MAX_STOPS = 8

export function readCompetitionTrail() {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    return []
  }
}

export function pushCompetitionTrail(stop) {
  if (typeof window === 'undefined' || !stop?.entityId) {
    return []
  }

  const nextStop = {
    entityId: stop.entityId,
    title: stop.title || '',
    siteLabel: stop.siteLabel || '',
    eraLabel: stop.eraLabel || '',
    reason: stop.reason || '',
    sourceStage: stop.sourceStage || stop.stage || '',
    stage: stop.stage || '',
    timestamp: Date.now()
  }

  const trail = readCompetitionTrail().filter((item) => item?.entityId !== nextStop.entityId)
  const nextTrail = [...trail, nextStop].slice(-MAX_STOPS)
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextTrail))
  return nextTrail
}

export function getRecentArtifactTrail(limit = 2) {
  const trail = readCompetitionTrail().filter((item) => item?.entityId)
  if (!trail.length) {
    return []
  }

  return [...trail].reverse().slice(0, limit)
}
