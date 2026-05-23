<template>
  <section class="artifact-hall">
    <div class="page-noise" aria-hidden="true"></div>

    <header class="hall-hero">
      <div class="hero-copy showcase-enter" style="--delay: 0s">
        <p class="hero-kicker">文物展厅</p>
        <h1>先在展厅停下来，再挑一件细看</h1>
        <p class="hero-subtitle">
          这不是普通列表页，而是一间会随着你的选择改变主题的展厅。
          先看命中的文物，再决定要走近哪一件。
        </p>
        <p class="hero-journey-line">{{ hallJourneyLine }}</p>

        <p class="hero-narrative">{{ hallNarrative }}</p>

        <div class="hero-actions">
          <button
            class="hero-button hero-button--primary showcase-button-hover"
            type="button"
            @click="goToExplore"
          >
            {{ competitionActionLabels.backExplore }}
          </button>
          <button
            class="hero-button showcase-button-hover"
            type="button"
            :disabled="!featuredArtifact"
            @click="openAiChat(featuredArtifact)"
          >
            {{ competitionActionLabels.focusAi }}
          </button>
        </div>
      </div>

      <aside class="hero-stats showcase-enter" style="--delay: 0.08s">
        <div class="stat-card">
          <span>核心文物</span>
          <strong>{{ displayArtifactCount }}</strong>
        </div>
        <div class="stat-card">
          <span>筛选命中</span>
          <strong>{{ displayFilteredCount }}</strong>
        </div>
        <div class="stat-card">
          <span>可用模型</span>
          <strong>{{ displayReadyCount }}</strong>
        </div>
      </aside>
    </header>

    <section v-if="!isLoading && !errorMsg" class="hall-console">
      <article class="console-card console-card--filters showcase-enter" style="--delay: 0.12s">
        <div class="section-head">
          <div>
            <p class="section-kicker">筛选视角</p>
            <h2>展厅筛选器</h2>
          </div>
          <span class="section-badge">{{ isRefreshing ? '刷新中' : '实时视角' }}</span>
        </div>

        <div class="filter-pills">
          <span class="filter-pill">遗址：{{ currentSiteLabel }}</span>
          <span class="filter-pill">时代：{{ currentEraLabel }}</span>
          <span class="filter-pill">工艺：{{ currentCraftLabel }}</span>
        </div>

        <div class="filter-group">
          <span class="filter-group__label">遗址筛选</span>
          <div class="site-switch-row">
            <button
              class="site-switch showcase-button-hover"
              :class="{ active: activeSite === '' }"
              type="button"
              @click="activeSite = ''"
            >
              全部遗址
            </button>
            <button
              v-for="site in siteOptions"
              :key="site.value"
              class="site-switch showcase-button-hover"
              :class="{ active: activeSite === site.value }"
              type="button"
              @click="activeSite = site.value"
            >
              {{ site.label }}
            </button>
          </div>
        </div>

        <div class="filter-group">
          <span class="filter-group__label">时代筛选</span>
          <div class="site-switch-row">
            <button
              class="site-switch showcase-button-hover"
              :class="{ active: activeEra === '' }"
              type="button"
              @click="activeEra = ''"
            >
              全部时代
            </button>
            <button
              v-for="era in eraOptions"
              :key="era.value"
              class="site-switch showcase-button-hover"
              :class="{ active: activeEra === era.value }"
              type="button"
              @click="activeEra = era.value"
            >
              {{ era.label }}
            </button>
          </div>
        </div>

        <div class="filter-group">
          <span class="filter-group__label">工艺筛选</span>
          <div class="site-switch-row">
            <button
              class="site-switch showcase-button-hover"
              :class="{ active: activeCraft === '' }"
              type="button"
              @click="activeCraft = ''"
            >
              全部工艺
            </button>
            <button
              v-for="craft in craftOptions"
              :key="craft.value"
              class="site-switch showcase-button-hover"
              :class="{ active: activeCraft === craft.value }"
              type="button"
              @click="activeCraft = craft.value"
            >
              {{ craft.label }}
            </button>
          </div>
        </div>

        <div class="filter-actions">
          <button
            class="hero-button hero-button--primary showcase-button-hover"
            type="button"
            @click="loadArtifacts()"
          >
            重新筛选
          </button>
          <button
            class="hero-button showcase-button-hover"
            type="button"
            @click="resetFilters"
          >
            重置筛选
          </button>
        </div>

        <p v-if="refreshErrorMsg" class="refresh-error">{{ refreshErrorMsg }}</p>
      </article>

      <article
        v-if="featuredArtifact"
        class="console-card spotlight-card showcase-enter"
        style="--delay: 0.18s"
      >
        <div class="spotlight-visual">
          <img :src="featuredArtifact.cardImage" :alt="featuredArtifact.displayTitle" />
          <span class="spotlight-site">{{ featuredArtifact.siteLabel }}</span>
        </div>

        <div class="spotlight-copy">
          <p class="section-kicker">焦点文物</p>
          <h2>{{ featuredArtifact.displayTitle }}</h2>
          <p class="spotlight-time">{{ featuredArtifact.eraLabel }} · {{ featuredArtifact.yearLabel }}</p>
          <p class="spotlight-summary">{{ featuredArtifact.summary }}</p>
          <p class="spotlight-reason">{{ featuredArtifactReason }}</p>

          <div class="spotlight-tags">
            <span>{{ featuredArtifact.category }}</span>
            <span>{{ featuredArtifact.craftLabel }}</span>
          </div>

          <div class="spotlight-actions">
            <button
              class="hero-button hero-button--primary showcase-button-hover"
              type="button"
              :disabled="!featuredArtifact.isModelReady"
              @click="openModel(featuredArtifact)"
            >
              {{ getEnter3dLabel(featuredArtifact.isModelReady) }}
            </button>
            <button
              class="hero-button showcase-button-hover"
              type="button"
              @click="openAiChat(featuredArtifact)"
            >
              {{ competitionActionLabels.enterAi }}
            </button>
          </div>
        </div>
      </article>
    </section>

    <section v-if="errorMsg" class="status-panel status-panel--error showcase-enter">
      {{ errorMsg }}
    </section>

    <section v-else-if="isLoading" class="status-panel showcase-enter">
      正在加载文物数据...
    </section>

    <section v-else-if="filteredArtifacts.length" class="artifact-grid">
      <article
        v-for="(artifact, index) in filteredArtifacts"
        :key="artifact.entityId"
        class="artifact-card showcase-card-hover showcase-enter"
        :style="{ '--delay': `${0.22 + index * 0.04}s` }"
      >
        <div class="artifact-image-wrap">
          <img :src="artifact.cardImage" :alt="artifact.displayTitle" class="artifact-image" />
          <span class="artifact-badge">{{ artifact.category }}</span>
          <span
            class="artifact-model-state"
            :class="artifact.isModelReady ? 'artifact-model-state--ready' : 'artifact-model-state--pending'"
          >
            {{ getModelStatusLabel(artifact.isModelReady) }}
          </span>
        </div>

        <div class="artifact-content">
          <p class="artifact-site">{{ artifact.siteLabel }}</p>
          <h2>{{ artifact.displayTitle }}</h2>
          <p class="artifact-time">{{ artifact.eraLabel }} · {{ artifact.yearLabel }}</p>
          <p class="artifact-summary">{{ artifact.summary }}</p>

          <dl class="artifact-meta">
            <div>
              <dt>工艺</dt>
              <dd>{{ artifact.craftLabel }}</dd>
            </div>
            <div>
              <dt>主键</dt>
              <dd>{{ artifact.entityId }}</dd>
            </div>
          </dl>

          <div class="artifact-actions">
            <button
              class="action-button action-button--primary showcase-button-hover"
              :disabled="!artifact.isModelReady"
              @click="openModel(artifact)"
            >
              {{ getEnter3dLabel(artifact.isModelReady) }}
            </button>
            <button
              class="action-button showcase-button-hover"
              @click="openAiChat(artifact)"
            >
              {{ competitionActionLabels.enterAi }}
            </button>
          </div>
        </div>
      </article>
    </section>

    <section v-else class="status-panel showcase-enter">
      当前筛选条件下没有命中文物，请尝试放宽遗址、时代或工艺条件。
    </section>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { searchSpacetimeArtifacts } from '@/api/SpacetimeApi'
import {
  competitionActionLabels,
  getEnter3dLabel,
  getModelStatusLabel
} from '@/data/competitionUi'
import { pushCompetitionTrail } from '@/utils/competitionTrail'

const route = useRoute()
const router = useRouter()

const isLoading = ref(true)
const isRefreshing = ref(false)
const errorMsg = ref('')
const refreshErrorMsg = ref('')
const artifacts = ref([])
const stats = ref({
  artifactCount: 0,
  readyModelCount: 0
})
const narrative = ref(createEmptyNarrative())
const siteOptions = ref([])
const eraOptions = ref([])
const craftOptions = ref([])
const activeSite = ref(route.query.siteCode || '')
const activeEra = ref(route.query.eraCode || '')
const activeCraft = ref(route.query.craftCode || '')
const activeMeaning = ref(route.query.meaning || '')

const filteredArtifacts = computed(() => {
  if (!activeMeaning.value) {
    return artifacts.value
  }

  return artifacts.value.filter((artifact) => {
    const meaningList = Array.isArray(artifact?.symbolicMeaningZh) ? artifact.symbolicMeaningZh : []
    return meaningList.some((meaning) => typeof meaning === 'string' && meaning.includes(activeMeaning.value))
  })
})

const hasActiveSelection = computed(() => Boolean(activeSite.value || activeEra.value || activeCraft.value || activeMeaning.value))
const featuredArtifact = computed(() => {
  if (!filteredArtifacts.value.length) {
    return null
  }

  if (narrative.value.recommendedArtifactId) {
    const matched = filteredArtifacts.value.find((artifact) => artifact.entityId === narrative.value.recommendedArtifactId)
    if (matched) {
      return matched
    }
  }

  return [...filteredArtifacts.value].sort((left, right) => getArtifactPriority(right).score - getArtifactPriority(left).score)[0]
})

const readyCount = computed(() => filteredArtifacts.value.filter((artifact) => artifact.isModelReady).length)
const effectiveArtifactCount = computed(() => filteredArtifacts.value.length)
const displayArtifactCount = computed(() => (isLoading.value ? '—' : stats.value.artifactCount || artifacts.value.length))
const displayFilteredCount = computed(() => (isLoading.value ? '—' : filteredArtifacts.value.length))
const displayReadyCount = computed(() => (isLoading.value ? '—' : readyCount.value))
const currentSiteLabel = computed(() =>
  getCurrentOptionLabel(siteOptions.value, activeSite.value, route.query.siteLabel || '全部遗址')
)
const currentEraLabel = computed(() =>
  getCurrentOptionLabel(eraOptions.value, activeEra.value, route.query.eraLabel || '全部时代')
)
const currentCraftLabel = computed(() =>
  getCurrentOptionLabel(craftOptions.value, activeCraft.value, route.query.craftLabel || '全部工艺')
)

const hallJourneyLine = computed(() => {
  if (isLoading.value) {
    if (hasActiveSelection.value) {
      return `已承接上一页筛选：${currentEraLabel.value} / ${currentSiteLabel.value} / ${currentCraftLabel.value}。展厅正在按这组条件整理文物。`
    }
    return '你已经从时空探索进入展厅，展厅正在整理当前可浏览的文物集合。'
  }

  if (!activeSite.value && !activeEra.value && !activeCraft.value && !activeMeaning.value) {
    return '你已经从时空探索进入展厅，先顺着当前结果停下来，再挑一件最值得走近的文物。'
  }

  const meaningSuffix = activeMeaning.value ? ` / ${activeMeaning.value}` : ''
  return `你带着“${currentEraLabel.value} / ${currentSiteLabel.value} / ${currentCraftLabel.value}${meaningSuffix}”这组筛选条件走进了展厅，下面的文物会沿着这条线索继续展开。`
})

const featuredArtifactReason = computed(() => {
  if (!featuredArtifact.value) {
    return ''
  }

  if (narrative.value.recommendedReason && featuredArtifact.value.entityId === narrative.value.recommendedArtifactId) {
    return narrative.value.recommendedReason
  }

  const { reasons } = getArtifactPriority(featuredArtifact.value)
  return reasons.length
    ? `推荐先看它：${reasons.slice(0, 2).join('、')}。`
    : '推荐先看它：这件文物更适合作为这一轮展厅驻足的第一站。'
})

const hallNarrative = computed(() => {
  if (isLoading.value) {
    if (hasActiveSelection.value) {
      return `当前已锁定 ${currentEraLabel.value} / ${currentSiteLabel.value} / ${currentCraftLabel.value} 这组视角，展厅会优先呈现与之对应的核心文物。`
    }
    return '展厅正在加载文物数据，稍后会把当前可浏览的核心文物整理出来。'
  }

  if (!featuredArtifact.value) {
    return narrative.value.emptyLine || '请先定下一组展厅主题，文物会立刻按新的视角重新排布。'
  }

  if (narrative.value.sceneLine) {
    return `当前展厅正把视线引向 ${featuredArtifact.value.displayTitle}。${narrative.value.sceneLine}`
  }

  return `当前展厅正把视线引向 ${featuredArtifact.value.displayTitle}。它能最快把这组筛选结果讲清楚。`
})

let searchToken = 0

watch([activeSite, activeEra, activeCraft, activeMeaning], () => {
  if (isLoading.value) {
    return
  }
  syncQuery()
  loadArtifacts()
})

onMounted(async () => {
  activeSite.value = route.query.siteCode || ''
  activeEra.value = route.query.eraCode || ''
  activeCraft.value = route.query.craftCode || ''
  activeMeaning.value = route.query.meaning || ''

  try {
    await loadArtifacts({ initial: true })
  } catch (error) {
    console.error(error)
    errorMsg.value = '文物数据加载失败，请检查后端接口或数据库连接。'
  } finally {
    isLoading.value = false
  }
})

async function loadArtifacts({ initial = false } = {}) {
  const currentToken = ++searchToken
  if (initial) {
    isLoading.value = true
    errorMsg.value = ''
  } else {
    isRefreshing.value = true
    refreshErrorMsg.value = ''
  }

  try {
    const response = await searchSpacetimeArtifacts({
      eraCode: activeEra.value || null,
      siteCode: activeSite.value || null,
      craftCode: activeCraft.value || null
    })

    if (currentToken !== searchToken) {
      return
    }

    artifacts.value = response?.artifacts || []
    stats.value = normalizeStats(artifacts.value, response?.stats)
    siteOptions.value = normalizeFacetOptions(response?.facets?.siteOptions)
    eraOptions.value = normalizeFacetOptions(response?.facets?.eraOptions)
    craftOptions.value = normalizeFacetOptions(response?.facets?.craftOptions)
    narrative.value = normalizeNarrative(response?.narrative)
    errorMsg.value = ''
    refreshErrorMsg.value = ''
  } catch (error) {
    if (currentToken !== searchToken) {
      return
    }

    console.error(error)
    const fallbackMsg = '文物数据刷新失败，请检查后端接口或数据库连接。'
    if (initial || !artifacts.value.length) {
      errorMsg.value = fallbackMsg
      artifacts.value = []
      stats.value = normalizeStats([])
      siteOptions.value = []
      eraOptions.value = []
      craftOptions.value = []
      narrative.value = createEmptyNarrative()
    } else {
      refreshErrorMsg.value = fallbackMsg
    }
  } finally {
    if (currentToken === searchToken) {
      isLoading.value = false
      isRefreshing.value = false
    }
  }
}

function syncQuery() {
  router.replace({
    path: '/3dlist',
    query: {
      siteCode: activeSite.value || undefined,
      eraCode: activeEra.value || undefined,
      craftCode: activeCraft.value || undefined,
      meaning: activeMeaning.value || undefined
    }
  })
}

function createEmptyNarrative() {
  return {
    entryLine: '',
    sceneLine: '',
    resultLine: '',
    emptyLine: '',
    recommendedArtifactId: '',
    recommendedReason: ''
  }
}

function normalizeNarrative(currentNarrative = null) {
  return {
    ...createEmptyNarrative(),
    ...(currentNarrative || {})
  }
}

function normalizeFacetOptions(options = []) {
  return Array.isArray(options)
    ? options.map((option) => ({
        value: option.value || '',
        label: option.label || option.value || '',
        artifactCount: typeof option.artifactCount === 'number' ? option.artifactCount : 0,
        readyModelCount: typeof option.readyModelCount === 'number' ? option.readyModelCount : 0,
        timeStartYear: option.timeStartYear,
        timeEndYear: option.timeEndYear
      }))
    : []
}

function normalizeStats(currentArtifacts, currentStats = null) {
  const artifactCount = typeof currentStats?.artifactCount === 'number' ? currentStats.artifactCount : currentArtifacts.length
  const readyModelCount = typeof currentStats?.readyModelCount === 'number'
    ? currentStats.readyModelCount
    : currentArtifacts.filter((artifact) => artifact.isModelReady).length

  return {
    artifactCount,
    readyModelCount
  }
}

function getCurrentOptionLabel(options, currentValue, fallbackLabel) {
  if (!currentValue) {
    return fallbackLabel
  }
  return options.find((option) => option.value === currentValue)?.label || currentValue
}

function resetFilters() {
  activeSite.value = ''
  activeEra.value = ''
  activeCraft.value = ''
  activeMeaning.value = ''
}

function goToExplore() {
  router.push({
    path: '/tanmi',
    query: {
      siteCode: activeSite.value || undefined,
      eraCode: activeEra.value || undefined,
      craftCode: activeCraft.value || undefined
    }
  })
}

function openModel(artifact) {
  if (!artifact?.isModelReady) {
    return
  }

  const entryReason = featuredArtifact.value?.entityId === artifact.entityId ? featuredArtifactReason.value : hallNarrative.value
  pushCompetitionTrail({
    entityId: artifact.entityId,
    title: artifact.displayTitle,
    siteLabel: artifact.siteLabel,
    eraLabel: artifact.eraLabel,
    stage: '3dlist',
    sourceStage: '3dlist',
    reason: entryReason
  })

  router.push({
    path: '/3d',
    query: {
      entityId: artifact.entityId,
      glbUrl: artifact.resolvedGlbUrl,
      title: artifact.displayTitle,
      siteCode: artifact.siteCode,
      eraCode: artifact.eraCode,
      entryReason
    }
  })
}

function openAiChat(artifact) {
  if (!artifact) {
    return
  }

  const entryReason = featuredArtifact.value?.entityId === artifact.entityId ? featuredArtifactReason.value : hallNarrative.value
  pushCompetitionTrail({
    entityId: artifact.entityId,
    title: artifact.displayTitle,
    siteLabel: artifact.siteLabel,
    eraLabel: artifact.eraLabel,
    stage: '3dlist',
    sourceStage: '3dlist',
    reason: entryReason
  })

  router.push({
    path: '/ai-chat',
    query: {
      entityId: artifact.entityId,
      title: artifact.displayTitle,
      siteCode: artifact.siteCode,
      eraCode: artifact.eraCode,
      entryReason
    }
  })
}

function getArtifactPriority(artifact) {
  let score = 0
  const reasons = []
  const craftCount = Array.isArray(artifact?.craftCodes) ? artifact.craftCodes.length : 0

  if (artifact?.isModelReady) {
    score += 100
    reasons.push('已具备 3D 模型')
  }

  if (artifact?.symbolicMeaning) {
    score += 24
    reasons.push('寓意线索更完整')
  }

  if (craftCount > 1) {
    score += 20
    reasons.push('关联工艺更丰富')
  }

  if (artifact?.summary) {
    score += 8
  }

  return { score, reasons }
}
</script>

<style scoped>
@import '@/styles/competitionMotion.css';

.artifact-hall {
  --ink: #163128;
  --muted: #62776d;
  --green: #42664f;
  --green-deep: #274638;
  --gold: #b99243;
  --panel: rgba(255, 252, 245, 0.9);
  --border: rgba(66, 102, 79, 0.14);
  min-height: 100vh;
  padding: 16px 24px 48px;
  position: relative;
  overflow: hidden;
  color: var(--ink);
  background:
    radial-gradient(circle at top left, rgba(214, 189, 130, 0.18), transparent 24%),
    radial-gradient(circle at 88% 16%, rgba(66, 102, 79, 0.08), transparent 24%),
    linear-gradient(180deg, #f8f3e7 0%, #f4efe2 54%, #efe8d8 100%);
}

.page-noise {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px);
  background-size: 26px 26px;
  mask-image: radial-gradient(circle at center, black, transparent 92%);
  opacity: 0.14;
  pointer-events: none;
}

.hall-hero,
.hall-console,
.artifact-grid,
.status-panel {
  width: min(1240px, 100%);
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.hall-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) 320px;
  gap: 20px;
  align-items: stretch;
  margin-bottom: 22px;
}

.hero-copy,
.hero-stats,
.console-card,
.status-panel,
.artifact-card {
  background: var(--panel);
  border: 1px solid var(--border);
  box-shadow:
    0 20px 42px rgba(53, 82, 64, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.42);
  backdrop-filter: blur(16px);
}

.hero-copy {
  padding: 30px 32px;
  border-radius: 30px;
}

.hero-kicker,
.section-kicker {
  margin: 0 0 8px;
  color: var(--gold);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.24em;
}

.hero-copy h1 {
  margin: 0;
  font-size: clamp(36px, 4.8vw, 58px);
  font-family: "STZhongsong", "Noto Serif SC", serif;
  line-height: 1.04;
  letter-spacing: 0.08em;
}

.hero-subtitle {
  max-width: 740px;
  margin: 14px 0 0;
  color: var(--muted);
  line-height: 1.82;
}

.hero-journey-line {
  margin: 14px 0 0;
  color: var(--green-deep);
  font-size: 14px;
  line-height: 1.78;
}

.hero-narrative {
  margin: 18px 0 0;
  padding-left: 16px;
  color: var(--green-deep);
  line-height: 1.76;
  border-left: 2px solid rgba(185, 146, 67, 0.45);
}

.hero-actions,
.spotlight-actions,
.artifact-actions,
.filter-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.hero-actions {
  margin-top: 20px;
}

.hero-button,
.action-button,
.site-switch {
  border: none;
  cursor: pointer;
}

.hero-button {
  min-height: 48px;
  padding: 0 20px;
  color: var(--green-deep);
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(66, 102, 79, 0.14);
  border-radius: 999px;
}

.hero-button--primary,
.action-button--primary {
  color: #fff;
  background: linear-gradient(135deg, var(--green), var(--green-deep));
  box-shadow: 0 14px 26px rgba(66, 102, 79, 0.18);
}

.hero-button:disabled,
.action-button:disabled {
  cursor: not-allowed;
  opacity: 0.56;
  transform: none;
}

.hero-stats {
  display: grid;
  gap: 12px;
  padding: 22px;
  border-radius: 28px;
  align-content: center;
}

.stat-card {
  display: grid;
  gap: 4px;
  padding: 16px 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.68);
}

.stat-card span {
  color: var(--muted);
  font-size: 13px;
}

.stat-card strong {
  font-size: 30px;
  line-height: 1;
}

.hall-console {
  display: grid;
  gap: 18px;
  margin-bottom: 22px;
}

.console-card {
  padding: 22px;
  border-radius: 28px;
}

.console-card--filters {
  background:
    radial-gradient(circle at top right, rgba(214, 189, 130, 0.12), transparent 30%),
    var(--panel);
}

.section-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.section-head h2 {
  margin: 0;
  font-size: 26px;
  font-family: "STZhongsong", "Noto Serif SC", serif;
}

.section-badge {
  padding: 7px 12px;
  color: var(--muted);
  background: rgba(255, 255, 255, 0.72);
  border-radius: 999px;
  font-size: 12px;
}

.refresh-error {
  margin: 14px 0 0;
  color: #b24a3d;
  font-size: 13px;
  line-height: 1.6;
}

.filter-pills,
.site-switch-row,
.spotlight-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-pills {
  margin-top: 18px;
}

.filter-pill,
.spotlight-tags span {
  display: inline-flex;
  align-items: center;
  padding: 8px 12px;
  color: var(--green);
  background: rgba(255, 255, 255, 0.8);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.filter-group + .filter-group {
  margin-top: 16px;
}

.filter-group__label {
  display: inline-flex;
  margin-top: 16px;
  color: var(--muted);
  font-size: 13px;
  font-weight: 700;
}

.site-switch-row {
  margin-top: 12px;
}

.site-switch {
  padding: 10px 14px;
  color: var(--green);
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(66, 102, 79, 0.14);
  border-radius: 999px;
}

.site-switch.active {
  color: #fff;
  background: linear-gradient(135deg, var(--green), var(--green-deep));
}

.filter-actions {
  margin-top: 18px;
}

.spotlight-card {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 18px;
  overflow: hidden;
}

.spotlight-visual {
  position: relative;
  min-height: 280px;
  overflow: hidden;
  border-radius: 22px;
}

.spotlight-visual img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.spotlight-site {
  position: absolute;
  top: 14px;
  left: 14px;
  padding: 7px 12px;
  color: #fff;
  background: rgba(25, 43, 35, 0.82);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.spotlight-copy h2 {
  margin: 0;
  font-size: 32px;
  font-family: "STZhongsong", "Noto Serif SC", serif;
}

.spotlight-time {
  margin: 10px 0 0;
  color: var(--gold);
  font-weight: 700;
}

.spotlight-summary {
  margin: 14px 0 0;
  color: var(--muted);
  line-height: 1.8;
}

.spotlight-reason {
  margin: 14px 0 0;
  padding-left: 14px;
  color: var(--green-deep);
  line-height: 1.72;
  border-left: 2px solid rgba(185, 146, 67, 0.45);
}

.spotlight-tags,
.spotlight-actions {
  margin-top: 16px;
}

.artifact-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.artifact-card {
  overflow: hidden;
  border-radius: 24px;
}

.artifact-image-wrap {
  position: relative;
  height: 230px;
  overflow: hidden;
}

.artifact-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.artifact-badge,
.artifact-model-state {
  position: absolute;
  top: 14px;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  backdrop-filter: blur(8px);
}

.artifact-badge {
  left: 14px;
  color: #fff;
  background: rgba(25, 43, 35, 0.82);
}

.artifact-model-state {
  right: 14px;
}

.artifact-model-state--ready {
  color: #22482f;
  background: rgba(226, 242, 228, 0.94);
}

.artifact-model-state--pending {
  color: #8a5b1a;
  background: rgba(249, 230, 191, 0.94);
}

.artifact-content {
  padding: 20px 22px 22px;
}

.artifact-site,
.artifact-time {
  margin: 0;
  color: #789086;
  font-size: 13px;
}

.artifact-content h2 {
  margin: 8px 0;
  font-size: 24px;
  font-family: "STZhongsong", "Noto Serif SC", serif;
}

.artifact-summary {
  margin: 12px 0 16px;
  color: #4f6158;
  line-height: 1.72;
}

.artifact-meta {
  display: grid;
  gap: 10px;
  margin: 0 0 18px;
}

.artifact-meta div {
  display: grid;
  gap: 4px;
}

.artifact-meta dt {
  color: #8d9c95;
  font-size: 12px;
  font-weight: 700;
}

.artifact-meta dd {
  margin: 0;
  color: #244337;
  font-size: 14px;
}

.artifact-actions {
  display: flex;
}

.action-button {
  flex: 1;
  min-height: 46px;
  color: #2b4a3c;
  background: #fff;
  border: 1px solid rgba(66, 102, 79, 0.22);
  border-radius: 14px;
}

.status-panel {
  padding: 28px;
  border-radius: 24px;
}

.status-panel--error {
  color: #ad4b4b;
}

@media (max-width: 1080px) {
  .hall-hero,
  .spotlight-card,
  .artifact-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .artifact-hall {
    padding: 18px 14px 28px;
  }

  .hero-copy,
  .hero-stats,
  .console-card,
  .artifact-card,
  .status-panel {
    border-radius: 24px;
  }

  .hero-copy,
  .hero-stats,
  .console-card,
  .artifact-content {
    padding: 18px;
  }

  .spotlight-visual {
    min-height: 220px;
  }

  .hero-actions,
  .spotlight-actions,
  .artifact-actions,
  .filter-actions {
    flex-direction: column;
  }
}
</style>
