
<template>
  <main class="explore-page">
    <div class="page-noise" aria-hidden="true"></div>

    <section class="hero-shell">
      <article class="hero-copy showcase-enter" style="--delay: 0s">
        <p class="hero-kicker">时空漫游</p>
        <h1>站上古蜀时空坐标</h1>
        <p class="hero-subtitle">{{ heroSubtitle }}</p>
        <p class="hero-journey-line">{{ heroJourneyLine }}</p>

        <div class="hero-filter-preview">
          <span class="preview-pill">时代：{{ currentEraLabel }}</span>
          <span class="preview-pill">遗址：{{ currentSiteLabel }}</span>
          <span class="preview-pill">工艺：{{ currentCraftLabel }}</span>
        </div>

        <p class="hero-scene-line">{{ sceneNarrative }}</p>

        <div class="hero-actions">
          <button
            class="hero-button hero-button--primary showcase-button-hover"
            type="button"
            :disabled="!featuredArtifact"
            @click="openAiChat(featuredArtifact)"
          >
            {{ competitionActionLabels.enterAi }}
          </button>
          <button
            class="hero-button showcase-button-hover"
            type="button"
            @click="resetFilters"
          >
            {{ competitionActionLabels.resetFilters }}
          </button>
        </div>
      </article>

      <aside class="hero-board showcase-enter" style="--delay: 0.08s">
        <div>
          <p class="board-label">浏览路径</p>
          <strong>筛选条件 → 文物结果 → 3D 展示 → AI 解说</strong>
        </div>

        <div class="board-metrics">
          <div class="metric-tile">
            <span>结果总数</span>
            <strong>{{ stats.artifactCount }}</strong>
          </div>
          <div class="metric-tile">
            <span>可用模型</span>
            <strong>{{ stats.readyModelCount }}</strong>
          </div>
          <div class="metric-tile">
            <span>已启用条件</span>
            <strong>{{ activeFilterCount }}</strong>
          </div>
        </div>
      </aside>
    </section>

    <section v-if="!isLoading && !errorMsg" class="console-shell">
      <div class="control-column">
        <article class="panel-card panel-card--sticky showcase-enter" style="--delay: 0.12s">
          <div class="section-head">
            <div>
              <p class="section-kicker">时间</p>
              <h2>时代刻度</h2>
            </div>
            <span class="section-badge">公元前坐标</span>
          </div>

          <div class="timeline-stack">
            <button
              class="timeline-card showcase-card-hover"
              :class="{ active: activeEra === '' }"
              type="button"
              @click="activeEra = ''"
            >
              <span class="timeline-range">全时段</span>
              <strong>查看所有时代样本</strong>
              <small>{{ getEraHint('') }}</small>
            </button>

            <button
              v-for="era in eraOptions"
              :key="era.value"
              class="timeline-card showcase-card-hover"
              :class="{ active: activeEra === era.value }"
              type="button"
              @click="activeEra = era.value"
            >
              <span class="timeline-range">{{ formatTimelineRange(era) }}</span>
              <strong>{{ era.label }}</strong>
              <small>{{ getEraHint(era.value) }}</small>
            </button>
          </div>
        </article>

        <article class="panel-card panel-card--sticky showcase-enter" style="--delay: 0.18s">
          <div class="section-head">
            <div>
              <p class="section-kicker">遗址</p>
              <h2>空间坐标</h2>
            </div>
            <span class="section-badge">地点切换</span>
          </div>

          <div class="site-grid">
            <button
              class="site-card showcase-card-hover"
              :class="{ active: activeSite === '' }"
              type="button"
              @click="activeSite = ''"
            >
              <strong>全部遗址</strong>
              <span>{{ getSiteHint('') }}</span>
            </button>

            <button
              v-for="site in siteOptions"
              :key="site.value"
              class="site-card showcase-card-hover"
              :class="{ active: activeSite === site.value }"
              type="button"
              @click="activeSite = site.value"
            >
              <strong>{{ site.label }}</strong>
              <span>{{ getSiteHint(site.value) }}</span>
            </button>
          </div>
        </article>

        <article class="panel-card panel-card--sticky showcase-enter" style="--delay: 0.24s">
          <div class="section-head">
            <div>
              <p class="section-kicker">工艺</p>
              <h2>工艺筛选</h2>
            </div>
            <span class="section-badge">标签维度</span>
          </div>

          <div class="craft-cloud">
            <button
              class="craft-chip showcase-button-hover"
              :class="{ active: activeCraft === '' }"
              type="button"
              @click="activeCraft = ''"
              :title="getCraftHint('')"
            >
              <span>全部工艺</span>
              <small>{{ getCraftHint('') }}</small>
            </button>
            <button
              v-for="craft in craftOptions"
              :key="craft.value"
              class="craft-chip showcase-button-hover"
              :class="{ active: activeCraft === craft.value }"
              type="button"
              @click="activeCraft = craft.value"
              :title="getCraftHint(craft.value)"
            >
              <span>{{ craft.label }}</span>
              <small>{{ getCraftHint(craft.value) }}</small>
            </button>
          </div>
          <p class="craft-cloud-hint">{{ getCraftHint(activeCraft) }}</p>
        </article>
      </div>

      <div class="result-column">
        <article class="panel-card panel-card--command showcase-enter" style="--delay: 0.12s">
          <div class="section-head">
            <div>
              <p class="section-kicker">筛选条件</p>
              <h2>你正在进入的时空切面</h2>
            </div>
            <span class="section-badge">{{ isRefreshing ? '正在刷新' : '实时联动' }}</span>
          </div>

          <div class="command-pills">
            <span class="command-pill">时代：{{ currentEraLabel }}</span>
            <span class="command-pill">遗址：{{ currentSiteLabel }}</span>
            <span class="command-pill">工艺：{{ currentCraftLabel }}</span>
          </div>

          <p class="command-caption">
            {{ resultSummary }}
          </p>

          <div class="command-actions">
            <button
              class="hero-button hero-button--primary showcase-button-hover"
              type="button"
              @click="openFilteredHall"
            >
              进入文物展厅
            </button>
            <button
              class="hero-button showcase-button-hover"
              type="button"
              @click="resetFilters"
            >
              {{ competitionActionLabels.resetFilters }}
            </button>
          </div>

          <p v-if="refreshErrorMsg" class="refresh-error">{{ refreshErrorMsg }}</p>
        </article>

        <article
          v-if="featuredArtifact"
          class="panel-card spotlight-card showcase-enter"
          style="--delay: 0.18s"
        >
          <div class="spotlight-visual">
            <img :src="featuredArtifact.cardImage" :alt="featuredArtifact.displayTitle" />
            <span class="spotlight-badge">{{ featuredArtifact.siteLabel }}</span>
          </div>

          <div class="spotlight-copy">
            <p class="section-kicker">焦点文物</p>
            <h2>{{ featuredArtifact.displayTitle }}</h2>
            <p class="spotlight-meta">{{ featuredArtifact.eraLabel }} · {{ featuredArtifact.yearLabel }}</p>
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

        <article class="panel-card panel-card--results showcase-enter" style="--delay: 0.24s">
          <div class="section-head">
            <div>
              <p class="section-kicker">文物结果</p>
              <h2>筛选命中集合</h2>
            </div>
            <span class="section-badge">{{ filteredArtifacts.length }} 件</span>
          </div>

          <div v-if="filteredArtifacts.length" class="result-grid">
            <article
              v-for="(artifact, index) in filteredArtifacts"
              :key="artifact.entityId"
              class="result-card showcase-card-hover showcase-enter"
              :style="{ '--delay': `${0.28 + index * 0.04}s` }"
            >
              <div class="result-image-wrap">
                <img :src="artifact.cardImage" :alt="artifact.displayTitle" class="result-image" />
                <span class="result-tag">{{ artifact.siteLabel }}</span>
                <span
                  class="model-chip"
                  :class="artifact.isModelReady ? 'model-chip--ready' : 'model-chip--pending'"
                >
                  {{ getModelStatusLabel(artifact.isModelReady) }}
                </span>
              </div>

              <div class="result-body">
                <p class="result-era">{{ artifact.eraLabel }} · {{ artifact.yearLabel }}</p>
                <h3>{{ artifact.displayTitle }}</h3>
                <p class="result-summary">{{ artifact.summary }}</p>

                <div class="result-meta">
                  <span>{{ artifact.category }}</span>
                  <span>{{ artifact.craftLabel }}</span>
                </div>

                <div class="result-actions">
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
          </div>

          <div v-else class="empty-state">
            <strong>当前条件下没有命中文物</strong>
            <p>可以放宽时代、切换遗址，或取消工艺筛选，让结果重新回到可展示范围。</p>
          </div>
        </article>

        <article class="panel-card panel-card--cta showcase-enter" style="--delay: 0.3s">
          <div class="cta-copy">
            <p class="section-kicker">下一步</p>
            <h2>查看筛选后的文物展厅</h2>
            <p>
              当前条件已经确定，进入展厅后会沿用这组筛选结果，继续查看 3D 模型与 AI 解说。
            </p>
          </div>

          <div class="cta-actions">
            <button
              class="cta-button showcase-button-hover"
              type="button"
              @click="openFilteredHall"
            >
              {{ competitionActionLabels.openFilteredGallery }}
            </button>
          </div>
        </article>
      </div>
    </section>

    <section v-else-if="errorMsg" class="state-panel state-panel--error showcase-enter">
      {{ errorMsg }}
    </section>

    <section v-else class="state-panel showcase-enter">正在加载时空数据...</section>
  </main>
</template>
<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { formatYearRange } from '@/data/competitionArtifacts'
import { searchSpacetimeArtifacts } from '@/api/SpacetimeApi'
import {
  competitionActionLabels,
  getEnter3dLabel,
  getModelStatusLabel
} from '@/data/competitionUi'
import { pushCompetitionTrail } from '@/utils/competitionTrail'

const router = useRouter()
const route = useRoute()

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

const filteredArtifacts = computed(() => artifacts.value)
const activeFilterCount = computed(() => [activeEra.value, activeSite.value, activeCraft.value].filter(Boolean).length)

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

const currentSiteLabel = computed(() => getCurrentOptionLabel(siteOptions.value, activeSite.value, '全部遗址'))
const currentEraLabel = computed(() => getCurrentOptionLabel(eraOptions.value, activeEra.value, '全部时代'))
const currentCraftLabel = computed(() => getCurrentOptionLabel(craftOptions.value, activeCraft.value, '全部工艺'))

const heroSubtitle = computed(() => {
  return (
    narrative.value.entryLine ||
    '这里不是普通筛选面板，而是一条进入古蜀文明的坐标线。先定时代、遗址与工艺，再沿着命中的文物继续向前。'
  )
})

const heroJourneyLine = computed(() => {
  return `当前视角已锁定：${currentEraLabel.value} / ${currentSiteLabel.value} / ${currentCraftLabel.value}。接下来会沿着这条线索展开文物、关系与讲解。`
})

const entryNarrative = computed(() => {
  return narrative.value.entryLine || `你已经把视线落在“${currentEraLabel.value} / ${currentSiteLabel.value} / ${currentCraftLabel.value}”这组坐标上，下一站会顺着这条线索继续向前。`
})

const featuredArtifactReason = computed(() => {
  if (!featuredArtifact.value) {
    return ''
  }

  if (narrative.value.recommendedReason && featuredArtifact.value.entityId === narrative.value.recommendedArtifactId) {
    return narrative.value.recommendedReason
  }

  const { reasons } = getArtifactPriority(featuredArtifact.value)
  if (!reasons.length) {
    return '当前文物的信息完整度更高，适合作为这一轮讲述入口。'
  }

  return `优先推荐理由：${reasons.slice(0, 2).join('、')}。`
})

const sceneNarrative = computed(() => {
  if (narrative.value.sceneLine) {
    return narrative.value.sceneLine
  }

  if (!featuredArtifact.value) {
    return '请先落下一枚坐标，让这条展线带你走进正在发生的古蜀现场。'
  }

  const yearText = featuredArtifact.value.yearLabel || featuredArtifact.value.eraLabel
  const siteText = featuredArtifact.value.siteLabel || '古蜀遗址'
  return `${yearText}，${siteText}的人们正在围绕 ${featuredArtifact.value.displayTitle} 展开祭祀与铸造活动。`
})

const resultSummary = computed(() => {
  if (!filteredArtifacts.value.length) {
    return narrative.value.emptyLine || '当前筛选条件下暂未命中文物，可以放宽时代、切换遗址，或取消工艺筛选后继续探索。'
  }

  return narrative.value.resultLine || `当前命中 ${filteredArtifacts.value.length} 件核心文物，其中 ${stats.value.readyModelCount} 件可进入 3D，建议先浏览结果卡片，再进入展厅查看完整集合。`
})

let searchToken = 0

watch([activeSite, activeEra, activeCraft], () => {
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

  try {
    await loadArtifacts({ initial: true })
  } catch (error) {
    console.error(error)
    errorMsg.value = '时空数据加载失败，请检查后端接口或数据库连接。'
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
    const fallbackMsg = '时空数据加载失败，请检查后端接口或数据库连接。'
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
    path: '/tanmi',
    query: {
      siteCode: activeSite.value || undefined,
      eraCode: activeEra.value || undefined,
      craftCode: activeCraft.value || undefined
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

function getCurrentOptionLabel(options, currentValue, fallbackLabel) {
  if (!currentValue) {
    return fallbackLabel
  }

  return options.find((option) => option.value === currentValue)?.label || currentValue
}

function formatTimelineRange(era) {
  return formatYearRange(era.timeStartYear, era.timeEndYear)
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

function getArtifactPriority(artifact) {
  let score = 0
  const reasons = []
  const craftCount = Array.isArray(artifact?.craftCodes) ? artifact.craftCodes.length : 0

  if (artifact?.isModelReady) {
    score += 100
    reasons.push('已具备 3D 模型')
  }

  if (artifact?.symbolicMeaning) {
    score += 30
    reasons.push('寓意线索更完整')
  }

  if (craftCount > 1) {
    score += 24
    reasons.push('关联工艺更丰富')
  } else if (craftCount === 1) {
    score += 12
    reasons.push('工艺特征明确')
  }

  if (artifact?.summary) {
    score += 8
  }

  if (artifact?.cardImage) {
    score += 4
  }

  return { score, reasons }
}

function findFacetOption(overrides = {}) {
  if (Object.prototype.hasOwnProperty.call(overrides, 'eraCode')) {
    return eraOptions.value.find((option) => option.value === (overrides.eraCode || ''))
  }
  if (Object.prototype.hasOwnProperty.call(overrides, 'siteCode')) {
    return siteOptions.value.find((option) => option.value === (overrides.siteCode || ''))
  }
  if (Object.prototype.hasOwnProperty.call(overrides, 'craftCode')) {
    return craftOptions.value.find((option) => option.value === (overrides.craftCode || ''))
  }
  return null
}

function describeOptionStats(overrides = {}) {
  const option = findFacetOption(overrides)
  const optionStats = option
    ? {
        artifactCount: option.artifactCount || 0,
        readyModelCount: option.readyModelCount || 0
      }
    : stats.value

  if (!optionStats.artifactCount) {
    return '当前没有命中文物，可继续放宽条件探索。'
  }

  return `命中 ${optionStats.artifactCount} 件文物，其中 ${optionStats.readyModelCount} 件可进入 3D`
}

function getEraHint(eraCode = '') {
  return describeOptionStats({ eraCode })
}

function getSiteHint(siteCode = '') {
  return describeOptionStats({ siteCode })
}

function getCraftHint(craftCode = '') {
  return describeOptionStats({ craftCode })
}

function resetFilters() {
  activeSite.value = ''
  activeEra.value = ''
  activeCraft.value = ''
}

function openFilteredHall() {
  router.push({
    path: '/3dlist',
    query: {
      siteCode: activeSite.value || undefined,
      siteLabel: currentSiteLabel.value || undefined,
      eraCode: activeEra.value || undefined,
      eraLabel: currentEraLabel.value || undefined,
      craftCode: activeCraft.value || undefined,
      craftLabel: currentCraftLabel.value || undefined
    }
  })
}

function openModel(artifact) {
  if (!artifact || !artifact.isModelReady) {
    return
  }

  const entryReason = featuredArtifact.value?.entityId === artifact.entityId ? featuredArtifactReason.value : resultSummary.value
  pushCompetitionTrail({
    entityId: artifact.entityId,
    title: artifact.displayTitle,
    siteLabel: artifact.siteLabel,
    eraLabel: artifact.eraLabel,
    stage: 'tanmi',
    sourceStage: 'tanmi',
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

  const entryReason = featuredArtifact.value?.entityId === artifact.entityId ? featuredArtifactReason.value : resultSummary.value
  pushCompetitionTrail({
    entityId: artifact.entityId,
    title: artifact.displayTitle,
    siteLabel: artifact.siteLabel,
    eraLabel: artifact.eraLabel,
    stage: 'tanmi',
    sourceStage: 'tanmi',
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
</script>

<style scoped>
@import '@/styles/competitionMotion.css';

.explore-page {
  --panel-bg: rgba(255, 251, 243, 0.88);
  --panel-border: rgba(58, 92, 76, 0.14);
  --ink: #1d342b;
  --muted: #60756c;
  --gold: #b89243;
  --green: #42664f;
  --green-deep: #274638;
  --mint: #dff0e6;
  --cream: rgba(255, 255, 255, 0.74);
  --radius-lg: 28px;
  --radius-md: 20px;
  --radius-sm: 12px;
  --shadow-soft:
    0 12px 28px rgba(52, 80, 64, 0.07),
    inset 0 1px 0 rgba(255, 255, 255, 0.42);
  --shadow-raise:
    0 16px 32px rgba(42, 67, 54, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.16);
  position: relative;
  min-height: 100vh;
  padding: 14px 18px 40px;
  overflow: hidden;
  color: var(--ink);
  background:
    radial-gradient(circle at 8% 12%, rgba(214, 189, 130, 0.16), transparent 24%),
    radial-gradient(circle at 88% 18%, rgba(66, 102, 79, 0.1), transparent 24%),
    linear-gradient(180deg, #f6f1e6 0%, #f0eadc 52%, #ece4d3 100%);
}

.page-noise {
  display: none;
}

.hero-shell,
.console-shell,
.state-panel {
  position: relative;
  z-index: 1;
  width: min(1320px, 100%);
  margin: 0 auto;
}

.hero-shell {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) 360px;
  gap: 20px;
  margin-bottom: 22px;
}

.hero-copy,
.hero-board,
.panel-card,
.state-panel {
  border: 1px solid var(--panel-border);
  background: var(--panel-bg);
  box-shadow: var(--shadow-soft);
}

.hero-copy {
  padding: 34px 36px;
  border-radius: var(--radius-lg);
}

.hero-kicker,
.section-kicker,
.board-label {
  margin: 0 0 8px;
  color: var(--gold);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.2em;
}

.hero-copy h1 {
  margin: 0;
  font-size: clamp(40px, 4.8vw, 64px);
  line-height: 1.04;
  font-family: 'STZhongsong', 'Noto Serif SC', serif;
  letter-spacing: 0.08em;
}

.hero-subtitle {
  max-width: 780px;
  margin: 16px 0 0;
  color: var(--muted);
  line-height: 1.92;
}

.hero-journey-line {
  margin: 14px 0 0;
  color: var(--green-deep);
  font-size: 14px;
  line-height: 1.8;
}

.hero-filter-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;
}

.hero-scene-line {
  margin: 18px 0 0;
  padding-left: 16px;
  color: var(--green-deep);
  line-height: 1.8;
  border-left: 2px solid rgba(184, 146, 67, 0.45);
}

.preview-pill,
.command-pill,
.spotlight-tags span,
.result-meta span {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  white-space: nowrap;
}

.preview-pill {
  padding: 9px 14px;
  color: var(--green-deep);
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(66, 102, 79, 0.12);
  font-size: 13px;
  font-weight: 700;
}

.hero-actions,
.command-actions,
.spotlight-actions,
.result-actions,
.cta-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.hero-actions {
  margin-top: 22px;
}

.hero-button,
.action-button,
.timeline-card,
.site-card,
.craft-chip,
.cta-button {
  border: none;
  cursor: pointer;
}

.hero-button {
  min-height: 48px;
  padding: 0 20px;
  color: var(--green-deep);
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(66, 102, 79, 0.12);
  border-radius: var(--radius-sm);
}

.hero-button--primary,
.action-button--primary,
.cta-button {
  color: #fff;
  background: linear-gradient(135deg, var(--green), var(--green-deep));
  box-shadow: var(--shadow-raise);
}

.hero-button:disabled,
.action-button:disabled {
  cursor: not-allowed;
  opacity: 0.56;
  transform: none;
}

.hero-board {
  display: grid;
  align-content: space-between;
  gap: 18px;
  padding: 24px;
  border-radius: var(--radius-lg);
  background:
    radial-gradient(circle at top right, rgba(214, 189, 130, 0.18), transparent 30%),
    linear-gradient(180deg, rgba(255, 252, 245, 0.96), rgba(248, 242, 232, 0.86));
}

.hero-board strong {
  font-size: 28px;
  line-height: 1.34;
  font-family: 'STZhongsong', 'Noto Serif SC', serif;
}

.board-metrics {
  display: grid;
  gap: 12px;
}

.metric-tile {
  display: grid;
  gap: 4px;
  padding: 16px 18px;
  border-radius: var(--radius-md);
  background: var(--cream);
}

.metric-tile span {
  color: var(--muted);
  font-size: 13px;
}

.metric-tile strong {
  font-size: 28px;
  line-height: 1;
}

.console-shell {
  display: grid;
  grid-template-columns: 380px minmax(0, 1fr);
  gap: 18px;
}

.control-column,
.result-column {
  display: grid;
  gap: 16px;
  align-content: start;
}

.panel-card {
  padding: 22px;
  border-radius: var(--radius-lg);
}

.panel-card--sticky {
  position: sticky;
  top: 110px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.section-head h2 {
  margin: 0;
  font-size: 26px;
  font-family: 'STZhongsong', 'Noto Serif SC', serif;
  letter-spacing: 0.04em;
}

.section-badge {
  padding: 7px 12px;
  color: var(--muted);
  background: rgba(255, 255, 255, 0.7);
  border-radius: var(--radius-sm);
  font-size: 12px;
}

.timeline-stack,
.site-grid {
  display: grid;
  gap: 12px;
  margin-top: 18px;
}

.timeline-card,
.site-card {
  display: grid;
  gap: 6px;
  padding: 16px 18px;
  text-align: left;
  border: 1px solid rgba(66, 102, 79, 0.12);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.7);
}

.timeline-card.active,
.site-card.active,
.craft-chip.active {
  color: #fff;
  background: linear-gradient(135deg, var(--green), var(--green-deep));
  border-color: transparent;
  box-shadow: var(--shadow-raise);
}

.timeline-range {
  color: var(--gold);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
}

.timeline-card strong,
.site-card strong {
  font-size: 18px;
}

.timeline-card small,
.site-card span {
  color: var(--muted);
  line-height: 1.6;
}

.timeline-card.active .timeline-range,
.timeline-card.active small,
.site-card.active span,
.craft-chip.active small {
  color: rgba(255, 255, 255, 0.82);
}

.craft-cloud,
.command-pills,
.spotlight-tags,
.result-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.craft-cloud,
.command-pills {
  margin-top: 18px;
}

.craft-chip {
  display: grid;
  gap: 4px;
  text-align: left;
  padding: 10px 14px;
  color: var(--green);
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(66, 102, 79, 0.16);
  border-radius: var(--radius-sm);
}

.craft-chip small {
  color: var(--muted);
  font-size: 12px;
  line-height: 1.5;
}

.craft-cloud-hint {
  margin: 12px 0 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.7;
}

.panel-card--command {
  background:
    radial-gradient(circle at top right, rgba(214, 189, 130, 0.12), transparent 34%),
    var(--panel-bg);
}

.command-pill {
  padding: 9px 14px;
  color: var(--green-deep);
  background: rgba(255, 255, 255, 0.78);
  font-size: 13px;
  font-weight: 700;
}

.command-caption {
  margin: 16px 0 0;
  color: var(--muted);
  line-height: 1.82;
}

.command-actions,
.spotlight-actions {
  margin-top: 18px;
}

.refresh-error {
  margin: 14px 0 0;
  color: #b24a3d;
  font-size: 13px;
  line-height: 1.6;
}

.spotlight-card {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 18px;
  overflow: hidden;
}

.spotlight-visual {
  position: relative;
  min-height: 300px;
  border-radius: var(--radius-md);
  overflow: hidden;
}

.spotlight-visual img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.spotlight-badge {
  position: absolute;
  top: 14px;
  left: 14px;
  padding: 7px 12px;
  color: #fff;
  background: rgba(20, 33, 28, 0.78);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.spotlight-copy h2 {
  margin: 0;
  font-size: 34px;
  font-family: 'STZhongsong', 'Noto Serif SC', serif;
}

.spotlight-meta {
  margin: 10px 0 0;
  color: var(--gold);
  font-weight: 700;
}

.spotlight-summary {
  margin: 14px 0 0;
  color: var(--muted);
  line-height: 1.82;
}

.spotlight-reason {
  margin: 14px 0 0;
  padding-left: 14px;
  color: var(--green-deep);
  line-height: 1.72;
  border-left: 2px solid rgba(184, 146, 67, 0.45);
}

.spotlight-tags span,
.result-meta span {
  padding: 7px 12px;
  color: var(--green);
  background: var(--mint);
  font-size: 12px;
  font-weight: 700;
}

.panel-card--results {
  background:
    linear-gradient(180deg, rgba(255, 251, 243, 0.92), rgba(250, 246, 238, 0.88));
}

.result-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  margin-top: 18px;
}

.result-card {
  overflow: hidden;
  border: 1px solid rgba(66, 102, 79, 0.12);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.7);
  box-shadow: var(--shadow-soft);
}

.result-image-wrap {
  position: relative;
  height: 220px;
}

.result-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.result-tag,
.model-chip {
  position: absolute;
  top: 14px;
  font-size: 12px;
  font-weight: 700;
}

.result-tag {
  left: 14px;
  padding: 7px 11px;
  color: #fff;
  background: rgba(20, 33, 28, 0.78);
  border-radius: 999px;
}

.model-chip {
  right: 14px;
  padding: 7px 11px;
  border-radius: 999px;
}

.model-chip--ready {
  color: #113a2e;
  background: rgba(214, 245, 232, 0.94);
}

.model-chip--pending {
  color: #6f4d19;
  background: rgba(247, 230, 186, 0.94);
}

.result-body {
  padding: 18px 20px 20px;
}

.result-era {
  margin: 0;
  color: #779087;
  font-size: 13px;
}

.result-body h3 {
  margin: 10px 0;
  font-size: 24px;
  font-family: 'STZhongsong', 'Noto Serif SC', serif;
}

.result-summary {
  margin: 0 0 14px;
  color: #556960;
  line-height: 1.76;
}

.result-meta {
  margin-bottom: 16px;
}

.action-button {
  flex: 1;
  min-height: 46px;
  color: var(--green-deep);
  background: #fff;
  border: 1px solid rgba(66, 102, 79, 0.18);
  border-radius: var(--radius-sm);
}

.empty-state {
  display: grid;
  gap: 8px;
  padding: 28px;
  margin-top: 18px;
  text-align: center;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.62);
}

.empty-state strong {
  font-size: 20px;
  font-family: 'STZhongsong', 'Noto Serif SC', serif;
}

.empty-state p {
  margin: 0;
  color: var(--muted);
  line-height: 1.72;
}

.panel-card--cta {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 18px;
  align-items: center;
  background:
    radial-gradient(circle at top left, rgba(214, 189, 130, 0.16), transparent 36%),
    linear-gradient(135deg, rgba(36, 68, 54, 0.96), rgba(20, 42, 33, 0.98));
  color: #f8f4ea;
}

.cta-copy h2 {
  margin: 0;
  font-size: 32px;
  font-family: 'STZhongsong', 'Noto Serif SC', serif;
}

.cta-copy p:last-child {
  margin: 12px 0 0;
  color: rgba(248, 244, 234, 0.82);
  line-height: 1.78;
}

.panel-card--cta .section-kicker {
  color: #f1d38e;
}

.cta-button {
  min-width: 240px;
  min-height: 54px;
  padding: 0 24px;
  border-radius: var(--radius-sm);
  font-size: 15px;
  font-weight: 700;
}

.state-panel {
  padding: 26px;
  border-radius: var(--radius-lg);
}

.state-panel--error {
  color: #b34d4d;
}

@media (max-width: 1180px) {
  .hero-shell,
  .console-shell,
  .panel-card--cta {
    grid-template-columns: 1fr;
  }

  .spotlight-card {
    grid-template-columns: 240px minmax(0, 1fr);
  }

  .panel-card--sticky {
    position: static;
  }
}

@media (max-width: 900px) {
  .spotlight-card,
  .panel-card--cta {
    grid-template-columns: 1fr;
  }

  .result-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .explore-page {
    padding: 18px 14px 28px;
  }

  .hero-copy,
  .hero-board,
  .panel-card,
  .state-panel {
    padding: 18px;
    border-radius: var(--radius-lg);
  }

  .hero-copy h1 {
    letter-spacing: 0.04em;
  }

  .result-grid,
  .spotlight-card,
  .panel-card--cta {
    grid-template-columns: 1fr;
  }

  .spotlight-visual {
    min-height: 220px;
  }

  .result-actions,
  .hero-actions,
  .command-actions,
  .spotlight-actions,
  .cta-actions {
    flex-direction: column;
  }

  .cta-button,
  .hero-button,
  .action-button {
    width: 100%;
    min-width: 0;
  }
}
</style>
