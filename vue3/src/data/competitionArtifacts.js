const DATASET_URL = '/data/competition-artifacts.seed.json'

export async function fetchCompetitionArtifacts() {
  const response = await fetch(DATASET_URL)
  if (!response.ok) {
    throw new Error(`Failed to load competition seed: ${response.status}`)
  }

  return response.json()
}

export function getSiteOptions(seed) {
  return (seed?.sites || []).map((site) => ({
    value: site.siteCode,
    label: site.siteNameZh || site.siteName
  }))
}

export function getEraOptions(seed) {
  return (seed?.eras || []).map((era) => ({
    value: era.eraCode,
    label: era.eraNameZh || era.eraName,
    timeStartYear: era.timeStartYear,
    timeEndYear: era.timeEndYear
  }))
}

export function getCraftOptions(seed) {
  return (seed?.crafts || []).map((craft) => ({
    value: craft.craftCode,
    label: craft.craftNameZh || craft.craftName
  }))
}

export function buildArtifactCards(seed) {
  return (seed?.artifacts || []).map((artifact) => ({
    ...artifact,
    siteLabel: artifact.siteNameZh || artifact.siteName,
    eraLabel: artifact.eraNameZh || artifact.eraName,
    yearLabel: formatYearRange(artifact.timeStartYear, artifact.timeEndYear),
    craftLabel: (artifact.craftNamesZh || []).join(' / '),
    isModelReady: artifact.modelStatus === 'ready' && !!artifact.resolvedGlbUrl,
    cardImage: artifact.coverImage
  }))
}

export function findArtifactCardByEntityId(seed, entityId) {
  if (!entityId) {
    return null
  }

  return buildArtifactCards(seed).find((artifact) => artifact.entityId === entityId) || null
}

export function filterArtifactCards(artifacts, filters = {}) {
  return artifacts.filter((artifact) => {
    const matchSite = !filters.siteCode || artifact.siteCode === filters.siteCode
    const matchEra = !filters.eraCode || artifact.eraCode === filters.eraCode
    const matchCraft =
      !filters.craftCode || (artifact.craftCodes || []).includes(filters.craftCode)

    return matchSite && matchEra && matchCraft
  })
}

export function formatYearRange(startYear, endYear) {
  if (typeof startYear !== 'number' || typeof endYear !== 'number') {
    return ''
  }

  return `${formatYear(startYear)} - ${formatYear(endYear)}`
}

function formatYear(year) {
  if (year < 0) {
    return `公元前 ${Math.abs(year)}`
  }

  return `公元 ${year}`
}
