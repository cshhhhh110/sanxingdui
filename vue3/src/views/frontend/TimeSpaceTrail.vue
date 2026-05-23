<template>
  <main class="time-space-trail" :class="{ 'time-space-trail--compact': activeScene > 1, 'time-space-trail--immersive': activeScene === 3 }">
    <section v-if="activeScene === 1" class="trail-hero">
      <div class="hero-copy showcase-enter" style="--delay: 0s">
        <p class="hero-kicker">玄喵引路</p>
        <h1>沿古蜀线索，向下走</h1>
        <p class="hero-subtitle">{{ heroNarrative }}</p>
        <div class="hero-actions">
          <button class="hero-button hero-button--primary showcase-button-hover" type="button" @click="scrollToArtifacts">
            看命中文物
          </button>
          <button class="hero-button showcase-button-hover" type="button" :disabled="!selectedArtifact" @click="scrollToGuide">
            听玄喵开讲
          </button>
        </div>
      </div>

      <aside class="hero-board showcase-enter" style="--delay: 0.08s">
        <div class="board-card">
          <span>当前命中</span>
          <strong>{{ displayVisibleCount }}</strong>
        </div>
        <div class="board-card">
          <span>可看 3D</span>
          <strong>{{ displayReadyCount }}</strong>
        </div>
        <div class="board-card">
          <span>当前焦点</span>
          <strong>{{ selectedArtifact ? 1 : 0 }}</strong>
        </div>
      </aside>
    </section>

    <nav class="trail-nav showcase-enter" style="--delay: 0.1s" aria-label="展线切换">
      <button
        v-for="scene in sceneSteps"
        :key="scene.id"
        class="scene-tab showcase-button-hover"
        :class="{
          'scene-tab--active': activeScene === scene.id,
          'scene-tab--unlocked': activeScene >= scene.id || scene.id === 1
        }"
        type="button"
        @click="goToScene(scene.id)"
      >
        <span class="scene-index">0{{ scene.id }}</span>
        <span class="scene-copy">
          <strong>{{ scene.title }}</strong>
          <small>{{ scene.subtitle }}</small>
        </span>
      </button>
    </nav>

    <section v-if="activeScene > 1" class="trail-stagebar showcase-enter" style="--delay: 0.06s">
      <div class="trail-stagebar__copy">
        <p class="trail-stagebar__kicker">{{ activeSceneMeta?.title || '展线继续' }}</p>
        <h1>{{ compactStageTitle }}</h1>
        <p class="trail-stagebar__line">{{ compactStageLine }}</p>
      </div>
      <div class="trail-stagebar__stats">
        <span class="trail-stagebar__stat">
          <em>当前命中</em>
          <strong>{{ displayVisibleCount }}</strong>
        </span>
        <span class="trail-stagebar__stat">
          <em>可看 3D</em>
          <strong>{{ displayReadyCount }}</strong>
        </span>
        <span v-if="selectedArtifact" class="trail-stagebar__stat">
          <em>当前焦点</em>
          <strong>1</strong>
        </span>
      </div>
    </section>

    <section class="trail-shell" :class="{ 'trail-shell--immersive': activeScene === 3, 'trail-shell--guide': activeScene === 4 }">
      <section v-show="activeScene === 1" class="filter-panel showcase-enter" style="--delay: 0.12s">
        <div class="panel-head">
          <div>
            <p class="panel-kicker">第一幕 · 时空定点</p>
            <h2>先站上一个古蜀坐标</h2>
          </div>
          <span class="panel-badge">{{ isLoading ? '线索浮现中' : '坐标已落定' }}</span>
        </div>

        <div class="filter-group">
          <label>时代</label>
          <div class="filter-row">
            <button
              class="filter-pill showcase-button-hover"
              :class="{ active: activeEra === '' }"
              type="button"
              @click="activeEra = ''"
            >
              <span>全部时代</span>
              <small>从整段时间望进去</small>
            </button>
            <button
              v-for="option in eraOptions"
              :key="option.value"
              class="filter-pill showcase-button-hover"
              :class="{ active: activeEra === option.value }"
              type="button"
              @click="activeEra = option.value"
            >
              <span>{{ option.label }}</span>
              <small>{{ describeFacet(option) }}</small>
            </button>
          </div>
        </div>

        <div class="filter-group">
          <label>遗址</label>
          <div class="filter-row">
            <button
              class="filter-pill showcase-button-hover"
              :class="{ active: activeSite === '' }"
              type="button"
              @click="activeSite = ''"
            >
              <span>全部遗址</span>
              <small>先看整体空间分布</small>
            </button>
            <button
              v-for="option in siteOptions"
              :key="option.value"
              class="filter-pill showcase-button-hover"
              :class="{ active: activeSite === option.value }"
              type="button"
              @click="activeSite = option.value"
            >
              <span>{{ option.label }}</span>
              <small>{{ describeFacet(option) }}</small>
            </button>
          </div>
        </div>

        <div class="filter-group">
          <label>工艺</label>
          <div class="filter-row">
            <button
              class="filter-pill showcase-button-hover"
              :class="{ active: activeCraft === '' }"
              type="button"
              @click="activeCraft = ''"
            >
              <span>全部工艺</span>
              <small>先看主要技艺脉络</small>
            </button>
            <button
              v-for="option in craftOptions"
              :key="option.value"
              class="filter-pill showcase-button-hover"
              :class="{ active: activeCraft === option.value }"
              type="button"
              @click="activeCraft = option.value"
            >
              <span>{{ option.label }}</span>
              <small>{{ describeFacet(option) }}</small>
            </button>
          </div>
        </div>

        <div v-if="meaningFocus" class="meaning-focus">
          <span>当前寓意追踪：{{ meaningFocus }}</span>
          <button class="meaning-clear showcase-button-hover" type="button" @click="meaningFocus = ''">
            清除
          </button>
        </div>

        <p class="filter-summary">{{ resultNarrative }}</p>

        <div class="panel-actions">
          <button class="hero-button hero-button--primary showcase-button-hover" type="button" @click="scrollToArtifacts">
            继续向前
          </button>
          <button class="hero-button showcase-button-hover" type="button" @click="resetFilters">
            重新定点
          </button>
        </div>
      </section>

      <div class="trail-main">
        <section v-show="activeScene === 2" ref="artifactSectionRef" class="artifact-section showcase-enter" style="--delay: 0.18s">
          <div class="section-head">
            <div>
              <p class="section-kicker">第二幕 · 文物驻足</p>
              <h2>先停在一件文物前，再决定继续走向哪里</h2>
            </div>
            <span class="section-badge">{{ visibleArtifacts.length }} 件</span>
          </div>

          <div v-if="activeFilterChips.length" class="scene-context-row">
            <span class="scene-context-row__label">上一幕落点</span>
            <span v-for="chip in activeFilterChips" :key="chip.key" class="scene-context-chip">
              {{ chip.label }}：{{ chip.value }}
            </span>
          </div>

          <div v-if="selectedArtifact" class="featured-spotlight">
            <div class="spotlight-visual">
              <img :src="selectedArtifact.cardImage || selectedArtifact.coverImage" :alt="selectedArtifact.displayTitle" />
              <span class="spotlight-site">{{ selectedArtifact.siteLabel }}</span>
            </div>
            <div class="spotlight-copy">
              <p class="section-kicker">当前焦点</p>
              <h3>{{ selectedArtifact.displayTitle }}</h3>
              <p class="spotlight-era">{{ selectedArtifact.eraLabel }} · {{ selectedArtifact.yearLabel }}</p>
              <p class="spotlight-summary">{{ selectedArtifact.summary }}</p>
              <p class="spotlight-reason">{{ selectedReason }}</p>
              <div class="spotlight-tags">
                <span>{{ selectedArtifact.category }}</span>
                <span>{{ selectedArtifact.craftLabel }}</span>
              </div>
              <div class="spotlight-actions">
                <button class="hero-button hero-button--primary showcase-button-hover" type="button" @click="scrollToStage">
                  走近这件文物
                </button>
                <button class="hero-button showcase-button-hover" type="button" @click="scrollToGuide" :disabled="!selectedArtifact">
                  让玄喵开讲
                </button>
              </div>
            </div>
          </div>

          <div v-if="loadError" class="status-state status-state--error">
            {{ loadError }}
          </div>
          <div v-else-if="isLoading" class="status-state">
            正在根据当前时空坐标整理文物结果……
          </div>
          <div v-else-if="!visibleArtifacts.length" class="status-state">
            当前条件下暂未命中文物。你可以放宽时代、切换遗址，或取消当前工艺筛选，再看看古蜀文明会把哪件文物推到你面前。
          </div>

          <div v-else class="artifact-grid">
            <article
              v-for="artifact in visibleArtifacts"
              :key="artifact.entityId"
              class="artifact-card showcase-card-hover"
              :class="{ 'artifact-card--active': artifact.entityId === selectedArtifactId }"
              @click="selectArtifact(artifact, `你从当前筛选结果里挑中了 ${artifact.displayTitle}。`)"
            >
              <div class="artifact-image-wrap">
                <img :src="artifact.cardImage || artifact.coverImage" :alt="artifact.displayTitle" />
                <span class="artifact-badge">{{ artifact.category }}</span>
                <span class="artifact-model">{{ artifact.isModelReady ? '3D 已就绪' : '档案可看' }}</span>
              </div>
              <div class="artifact-content">
                <p class="artifact-site">{{ artifact.siteLabel }}</p>
                <h3>{{ artifact.displayTitle }}</h3>
                <p class="artifact-time">{{ artifact.eraLabel }} · {{ artifact.yearLabel }}</p>
                <p class="artifact-summary">{{ artifact.summary }}</p>
                <div class="artifact-actions">
                  <button
                    class="card-action showcase-button-hover"
                    type="button"
                    @click.stop="selectArtifact(artifact, `你决定先细看 ${artifact.displayTitle}。`)"
                  >
                    选它
                  </button>
                  <button
                    class="card-action card-action--ghost showcase-button-hover"
                    type="button"
                    @click.stop="openStandalone3D(artifact)"
                  >
                    单独打开
                  </button>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section v-show="activeScene === 3" ref="stageSectionRef" class="immersive-section showcase-enter" style="--delay: 0.24s">
          <div class="section-head">
            <div>
              <p class="section-kicker">第三幕 · 展品现场</p>
              <h2>走近这一件，再顺着它的关系继续往下</h2>
            </div>
            <span class="section-badge">{{ selectedArtifact ? selectedArtifact.displayTitle : '等待选中文物' }}</span>
          </div>

          <div v-if="activeFilterChips.length" class="scene-context-row scene-context-row--immersive">
            <span class="scene-context-row__label">你是沿着这组坐标走到这里的</span>
            <span v-for="chip in activeFilterChips" :key="chip.key" class="scene-context-chip scene-context-chip--dark">
              {{ chip.label }}：{{ chip.value }}
            </span>
          </div>

          <div v-if="stageVisible && selectedArtifactDetail" class="stage-overview">
            <article class="stage-overview__card">
              <span>当前文物</span>
              <strong>{{ selectedArtifactDetail.displayTitle }}</strong>
              <p>{{ selectedArtifactDetail.summary }}</p>
            </article>
            <article class="stage-overview__card">
              <span>为何先看它</span>
              <p>{{ selectedReason }}</p>
            </article>
          </div>

          <div v-if="!stageVisible" class="stage-preview showcase-card-hover">
            <div class="stage-preview__copy">
              <p class="section-kicker">展品现场即将展开</p>
              <h3>{{ selectedArtifact?.displayTitle || '先在上一幕选中一件文物' }}</h3>
              <p>{{ stageNarrative }}</p>
            </div>
            <div class="stage-preview__actions">
              <button
                class="hero-button hero-button--primary showcase-button-hover"
                type="button"
                :disabled="!selectedArtifact"
                @click="scrollToStage"
              >
                走进展品现场
              </button>
              <button
                class="hero-button showcase-button-hover"
                type="button"
                :disabled="!selectedArtifact"
                @click="scrollToGuide"
              >
                直接听玄喵开讲
              </button>
            </div>
          </div>

          <div v-else class="immersive-grid">
            <article class="viewer-card">
              <div class="viewer-meta">
                <span class="meta-chip">{{ selectedArtifactDetail?.siteLabel || '遗址待定' }}</span>
                <span class="meta-chip">{{ selectedArtifactDetail?.eraLabel || '年代待定' }}</span>
                <span class="meta-chip meta-chip--highlight">{{ hasModel ? '3D 已就绪' : '档案模式' }}</span>
              </div>

              <div ref="viewerRef" class="viewer-shell">
                <div class="viewer-glow viewer-glow--left" aria-hidden="true"></div>
                <div class="viewer-glow viewer-glow--right" aria-hidden="true"></div>

                <img
                  v-if="!hasModel && selectedArtifactDetail?.cardImage"
                  class="artifact-fallback"
                  :src="selectedArtifactDetail.cardImage || selectedArtifactDetail.coverImage"
                  :alt="selectedArtifactDetail.displayTitle"
                />
                <canvas v-show="hasModel" ref="canvasRef"></canvas>

                <div class="viewer-caption">
                  <span>拖拽旋转</span>
                  <span>滚轮缩放</span>
                  <span>图谱联动</span>
                </div>

                <div v-if="isModelLoading" class="viewer-mask">
                  <div class="mask-box">
                    <p>正在布置数字展台</p>
                    <div class="progress-bar">
                      <div class="progress-fill" :style="{ width: `${modelProgress}%` }"></div>
                    </div>
                    <span>{{ modelProgress }}%</span>
                  </div>
                </div>

                <div v-if="modelError" class="viewer-mask viewer-mask--error">
                  <p class="error-title">模型暂未完整就绪</p>
                  <p>{{ modelError }}</p>
                  <button v-if="hasModel" class="retry-button" type="button" @click="reloadModel">重新加载</button>
                </div>
              </div>
            </article>

            <aside class="insight-panel">
              <section class="panel-card panel-card--hero">
                <p class="panel-label">文物档案</p>
                <h2>{{ selectedArtifactDetail?.displayTitle || '选中文物' }}</h2>
                <p class="panel-summary">{{ selectedArtifactDetail?.summary || '从左侧展厅选择一件文物，档案将在此展开。' }}</p>
                <dl class="fact-grid">
                  <div><dt>出土地</dt><dd>{{ selectedArtifactDetail?.siteLabel || '—' }}</dd></div>
                  <div><dt>年代</dt><dd>{{ selectedArtifactDetail?.yearLabel || '—' }}</dd></div>
                  <div><dt>类别</dt><dd>{{ selectedArtifactDetail?.category || '—' }}</dd></div>
                  <div><dt>工艺</dt><dd>{{ selectedArtifactDetail?.craftLabel || '—' }}</dd></div>
                </dl>
              </section>

              <section class="panel-card">
                <div class="section-head">
                  <div>
                    <p class="panel-label">关系网络</p>
                    <h3 class="section-title">图谱探索器</h3>
                  </div>
                  <div class="section-actions">
                    <span class="section-tag">{{ graphLoading ? '图谱刷新中' : '关系已联动' }}</span>
                    <button class="mini-action" type="button" @click="focusCenterNode">回到中心</button>
                    <button class="mini-action" type="button" @click="resetGraphViewport">重置视图</button>
                  </div>
                </div>

                <p class="graph-lead">{{ activeNarrative }}</p>

                <div class="type-filter-row">
                  <button
                    v-for="item in graphTypeFilters"
                    :key="item.type"
                    class="type-filter"
                    :class="{ active: activeTypeFilters.includes(item.type) }"
                    type="button"
                    @click="toggleTypeFilter(item.type)"
                  >
                    <span>{{ item.label }}</span>
                    <strong>{{ item.count }}</strong>
                  </button>
                </div>

                <div class="graph-stage">
                  <div ref="graphRef" class="graph-canvas"></div>
                  <p v-if="graphError" class="graph-error">{{ graphError }}</p>
                </div>

                <div class="graph-legend">
                  <span class="legend-item"><i class="legend-dot legend-dot--core"></i>中心文物</span>
                  <span class="legend-item"><i class="legend-dot legend-dot--site"></i>时空坐标</span>
                  <span class="legend-item"><i class="legend-dot legend-dot--craft"></i>工艺与寓意</span>
                  <span class="legend-item"><i class="legend-dot legend-dot--artifact"></i>相关文物</span>
                </div>
              </section>

              <section class="panel-card">
                <div class="section-head">
                  <p class="panel-label">当前节点</p>
                  <span class="section-tag">{{ selectedNodeTypeLabel }}</span>
                </div>

                <div class="narrative-grid">
                  <article class="narrative-card">
                    <p class="narrative-label">这是什么</p>
                    <strong>{{ selectedNodeTitle }}</strong>
                    <p>{{ selectedNodeSummary }}</p>
                  </article>
                  <article class="narrative-card">
                    <p class="narrative-label">它与谁相连</p>
                    <ul class="linked-list">
                      <li v-for="item in selectedNodeRelations" :key="`${item.relation}-${item.targetId}`">
                        <span>{{ item.relation }}</span>
                        <strong>{{ item.label }}</strong>
                      </li>
                    </ul>
                  </article>
                  <article class="narrative-card">
                    <p class="narrative-label">下一步去哪里</p>
                    <strong>{{ selectedNodeActionTitle }}</strong>
                    <p>{{ selectedNodeActionHint }}</p>
                    <button
                      class="narrative-button"
                      type="button"
                      :disabled="!selectedGraphNode"
                      @click="jumpByNode(selectedGraphNode)"
                    >
                      {{ selectedNodeActionButton }}
                    </button>
                  </article>
                </div>
              </section>
            </aside>
          </div>
        </section>

        <section v-show="activeScene === 4" ref="guideSectionRef" class="guide-section showcase-enter" style="--delay: 0.3s">
          <div class="section-head">
            <div>
              <p class="section-kicker">第四幕 · 玄喵讲解</p>
              <h2>让玄喵把这件文物讲成故事</h2>
            </div>
            <span class="section-badge">{{ selectedArtifactDetail?.displayTitle || '等待选中文物' }}</span>
          </div>

          <div v-if="activeFilterChips.length" class="scene-context-row">
            <span class="scene-context-row__label">这一讲解承接自</span>
            <span v-for="chip in activeFilterChips" :key="chip.key" class="scene-context-chip">
              {{ chip.label }}：{{ chip.value }}
            </span>
          </div>

          <div v-if="!guideExpanded" class="guide-preview">
            <div class="guide-preview__copy">
              <div class="guide-avatar showcase-float" style="--delay: 0.2s">
                <img :src="aiAvatar" alt="玄喵讲解员" />
              </div>
              <h3>{{ selectedArtifactDetail?.displayTitle || '玄喵正在等待新的文物线索' }}</h3>
              <p class="guide-journey">{{ guideJourneyLine }}</p>
              <p class="guide-preview__line">{{ previewGuideOpening }}</p>
            </div>

            <div class="guide-preview__actions">
              <button
                v-for="item in quickQuestions"
                :key="item.text"
                class="question-pill showcase-button-hover"
                type="button"
                @click="openGuideAndAsk(item.text)"
              >
                {{ item.text }}
              </button>
              <button class="hero-button hero-button--primary showcase-button-hover" type="button" @click="toggleGuideExpanded(true)">
                展开讲解
              </button>
            </div>
          </div>

          <div v-else class="guide-shell">
            <aside class="guide-context">
              <div class="guide-avatar showcase-float" style="--delay: 0.2s">
                <img :src="aiAvatar" alt="玄喵讲解员" />
              </div>
              <h3>{{ selectedArtifactDetail?.displayTitle || '玄喵正在等待新的文物线索' }}</h3>
              <p class="guide-journey">{{ guideJourneyLine }}</p>
              <dl class="guide-facts">
                <div>
                  <dt>遗址</dt>
                  <dd>{{ selectedArtifactDetail?.siteLabel || '待补充' }}</dd>
                </div>
                <div>
                  <dt>年代</dt>
                  <dd>{{ selectedArtifactDetail?.yearLabel || '待补充' }}</dd>
                </div>
                <div>
                  <dt>工艺</dt>
                  <dd>{{ selectedArtifactDetail?.craftLabel || '待补充' }}</dd>
                </div>
              </dl>
              <button class="guide-fold showcase-button-hover" type="button" @click="toggleGuideExpanded(false)">
                收起讲解台
              </button>
              <div class="quick-questions">
                <button
                  v-for="item in quickQuestions"
                  :key="item.text"
                  class="question-pill showcase-button-hover"
                  type="button"
                  @click="sendMessage(item.text)"
                >
                  {{ item.text }}
                </button>
              </div>
            </aside>

            <section class="guide-chat">
              <div ref="messagesRef" class="message-scroll">
                <article
                  v-for="item in messages"
                  :key="item.id"
                  class="message-row"
                  :class="`message-row--${item.role}`"
                >
                  <div v-if="item.role === 'assistant'" class="message-avatar">
                    <img :src="aiAvatar" alt="玄喵" />
                  </div>
                  <div class="message-stack">
                    <div class="message-bubble">
                      <p v-for="line in item.content" :key="line">{{ line }}</p>
                    </div>
                    <time>{{ item.time }}</time>
                  </div>
                </article>

                <article v-if="isThinking" class="message-row message-row--assistant">
                  <div class="message-avatar">
                    <img :src="aiAvatar" alt="玄喵" />
                  </div>
                  <div class="message-stack">
                    <div class="message-bubble thinking-bubble">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </article>
              </div>

              <form class="composer" @submit.prevent="sendMessage()">
                <textarea
                  v-model="draft"
                  rows="2"
                  maxlength="500"
                  :placeholder="composerPlaceholder"
                  @keydown.enter.exact.prevent="sendMessage()"
                />
                <button
                  class="hero-button hero-button--primary showcase-button-hover"
                  type="submit"
                  :disabled="!draft.trim() || isThinking"
                >
                  发送
                </button>
              </form>
            </section>
          </div>
        </section>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { Graph as G6Graph } from '@antv/g6'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment'
import { useUserStore } from '@/store/user'
import { searchSpacetimeArtifacts, getArtifactGraph, getArtifactGraphNeighbors, getSpacetimeArtifactDetail } from '@/api/SpacetimeApi'
import { createSession as createSessionApi, getChatStreamUrl } from '@/api/AiChatApi'
import { matchFixedAnswer } from '@/config/chatReplyConfig'
import { buildFallbackReply, buildRagPrompt, searchKnowledge } from '@/utils/knowledgeSearch'
import { formatYearRange } from '@/data/competitionArtifacts'
import { pushCompetitionTrail, getRecentArtifactTrail } from '@/utils/competitionTrail'
import aiAvatar from '@/assets/sanxingdui-ai-chat/ai-avatar.png'

const TYPE_LABELS = {
  artifact: '相关文物',
  site: '遗址',
  era: '时代',
  craft: '工艺',
  meaning: '寓意'
}

const TYPE_COLORS = {
  artifact: { fill: '#d2ac54', stroke: '#f3dfb4', label: '#142117' },
  site: { fill: '#2f5c4f', stroke: '#8ed8be', label: '#eff9f3' },
  era: { fill: '#395f74', stroke: '#8eb7d8', label: '#eff5fa' },
  craft: { fill: '#213329', stroke: '#78bda2', label: '#ecf7f1' },
  meaning: { fill: '#4e4432', stroke: '#d4bd7f', label: '#f8f2df' }
}

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const artifactSectionRef = ref(null)
const stageSectionRef = ref(null)
const guideSectionRef = ref(null)
const viewerRef = ref(null)
const canvasRef = ref(null)
const graphRef = ref(null)
const messagesRef = ref(null)

const activeEra = ref(String(route.query.eraCode || ''))
const activeSite = ref(String(route.query.siteCode || ''))
const activeCraft = ref(String(route.query.craftCode || ''))
const meaningFocus = ref('')
const activeScene = ref(1)

const isLoading = ref(true)
const isRefreshing = ref(false)
const loadError = ref('')
const searchToken = ref(0)
const artifacts = ref([])
const searchNarrative = ref({ entryLine: '', sceneLine: '', resultLine: '' })
const siteOptions = ref([])
const eraOptions = ref([])
const craftOptions = ref([])

const selectedArtifactId = ref(String(route.query.entityId || ''))
const selectedArtifactDetail = ref(null)
const selectedReason = ref('')
const stageVisible = ref(false)
const guideExpanded = ref(false)
const stageReadyEntityId = ref('')
const graphReadyEntityId = ref('')

const isModelLoading = ref(false)
const modelProgress = ref(0)
const modelError = ref('')

const graphPayload = ref({
  centerNodeId: '',
  narrative: '',
  availableTypes: [],
  stats: { nodeCount: 0, edgeCount: 0, expandableCount: 0 },
  nodes: [],
  edges: []
})
const graphError = ref('')
const graphLoading = ref(false)
const activeTypeFilters = ref([])
const selectedNodeId = ref('')
const expandedNodeIds = ref(new Set())

const draft = ref('')
const messages = ref([])
const isThinking = ref(false)
const currentSessionId = ref(null)
const lastAutoAskedEntityId = ref('')

let scene = null
let camera = null
let renderer = null
let controls = null
let glbModel = null
let frameId = 0
let graphInstance = null
let graphClickTimer = null
let resizeObserver = null
let environmentTexture = null
let pmremGenerator = null
let filterTimer = null
let chatAbortController = null

const visibleArtifacts = computed(() => {
  if (!meaningFocus.value) {
    return artifacts.value
  }
  return artifacts.value.filter((item) => {
    const meanings = Array.isArray(item.symbolicMeaningZh)
      ? item.symbolicMeaningZh
      : [item.symbolicMeaningZh || item.symbolicMeaning || '']
    return meanings.some((entry) => String(entry || '').includes(meaningFocus.value))
  })
})

const selectedArtifact = computed(() => {
  const fromList = visibleArtifacts.value.find((item) => item.entityId === selectedArtifactId.value)
  if (fromList) {
    return fromList
  }
  if (selectedArtifactDetail.value?.entityId === selectedArtifactId.value) {
    return selectedArtifactDetail.value
  }
  return null
})

const displayVisibleCount = computed(() => (isLoading.value ? '—' : visibleArtifacts.value.length))
const displayReadyCount = computed(() => {
  if (isLoading.value) return '—'
  return visibleArtifacts.value.filter((item) => item.isModelReady).length
})

const heroNarrative = computed(() => {
  return searchNarrative.value.entryLine || '先定下一处时空落点，再让一件文物把你带进更深处。'
})

const activeFilterChips = computed(() => {
  const chips = []
  const eraOption = eraOptions.value.find((item) => item.value === activeEra.value)
  const siteOption = siteOptions.value.find((item) => item.value === activeSite.value)
  const craftOption = craftOptions.value.find((item) => item.value === activeCraft.value)

  if (eraOption?.label) {
    chips.push({ key: 'era', label: '时代', value: eraOption.label })
  }
  if (siteOption?.label) {
    chips.push({ key: 'site', label: '遗址', value: siteOption.label })
  }
  if (craftOption?.label) {
    chips.push({ key: 'craft', label: '工艺', value: craftOption.label })
  }

  return chips
})

const sceneSteps = [
  { id: 1, title: '时空定点', subtitle: '先选一个古蜀坐标' },
  { id: 2, title: '文物驻足', subtitle: '从结果里停在一件前' },
  { id: 3, title: '展品现场', subtitle: '走近模型与关系网络' },
  { id: 4, title: '玄喵讲解', subtitle: '让故事开始往下讲' }
]

const activeSceneMeta = computed(() => sceneSteps.find((item) => item.id === activeScene.value) || sceneSteps[0])

const resultNarrative = computed(() => {
  if (loadError.value) {
    return loadError.value
  }
  if (searchNarrative.value.sceneLine) {
    return searchNarrative.value.sceneLine
  }
  if (!visibleArtifacts.value.length) {
    return '这一组坐标暂时没有把文物带到你面前。你可以换一个时代、遗址，或换一条工艺线索。'
  }
  return `当前命中 ${visibleArtifacts.value.length} 件文物，其中 ${displayReadyCount.value} 件已经准备好 3D 模型。`
})

const stageNarrative = computed(() => {
  if (!selectedArtifactDetail.value) {
    return '先在上一幕选定一件文物，展品现场才会真正亮起来。'
  }

  const site = selectedArtifactDetail.value.siteLabel || '它的出土地'
  const era = selectedArtifactDetail.value.eraLabel || '它所属的时代'
  const craft = selectedArtifactDetail.value.craftLabel || '它背后的工艺线索'

  return `${selectedArtifactDetail.value.displayTitle} 正站在 ${site} 与 ${era} 的交汇点上。走近它，再顺着 ${craft} 和关系网络继续往下。`
})

const compactStageTitle = computed(() => {
  if (activeScene.value === 2) {
    return selectedArtifact.value?.displayTitle || '先在展厅停下一件文物'
  }
  if (activeScene.value === 3) {
    return selectedArtifactDetail.value?.displayTitle || selectedArtifact.value?.displayTitle || '走近一件文物'
  }
  if (activeScene.value === 4) {
    return selectedArtifactDetail.value?.displayTitle || '让玄喵继续开讲'
  }
  return '沿古蜀线索继续向前'
})

const compactStageLine = computed(() => {
  if (activeScene.value === 2) {
    return searchNarrative.value.resultLine || resultNarrative.value
  }
  if (activeScene.value === 3) {
    return stageNarrative.value
  }
  if (activeScene.value === 4) {
    return guideJourneyLine.value
  }
  return heroNarrative.value
})

const hasModel = computed(() => Boolean(selectedArtifactDetail.value?.resolvedGlbUrl))
const previousArtifact = computed(() => {
  if (!selectedArtifactDetail.value?.entityId) {
    return getRecentArtifactTrail(1)[0] || null
  }
  return getRecentArtifactTrail(3).find((item) => item.entityId && item.entityId !== selectedArtifactDetail.value.entityId) || null
})

const guideJourneyLine = computed(() => {
  if (!selectedArtifactDetail.value) {
    return '等你站到一件文物前，玄喵就会顺着它的工艺、寓意与时代继续往下讲。'
  }
  if (previousArtifact.value?.title) {
    return `你刚才还看过 ${previousArtifact.value.title}，现在玄喵会把它和 ${selectedArtifactDetail.value.displayTitle} 串起来继续讲。`
  }
  return `你已经走到 ${selectedArtifactDetail.value.displayTitle} 面前，玄喵会接着这件文物继续往下讲。`
})

const composerPlaceholder = computed(() => {
  if (!selectedArtifactDetail.value) {
    return '先选一件文物，再继续问玄喵。'
  }
  return `围绕“${selectedArtifactDetail.value.displayTitle}”提问，例如它的工艺、寓意或与其他文物的关系`
})

const quickQuestions = computed(() => {
  const title = selectedArtifactDetail.value?.displayTitle || '这件文物'
  return [
    { text: `讲讲${title}为什么重要` },
    { text: `${title}用了哪些关键工艺` },
    { text: `${title}和祭祀体系有什么关系` },
    { text: '下一步还适合继续看什么' }
  ]
})

const previewGuideOpening = computed(() => {
  const firstAssistant = messages.value.find((item) => item.role === 'assistant')
  return firstAssistant?.content?.[0] || '玄喵已经在这里等你，只要你愿意，它就会从这件文物开始开讲。'
})

const selectedGraphNode = computed(() => {
  const targetId = selectedNodeId.value || graphPayload.value.centerNodeId
  return graphPayload.value.nodes.find((node) => node.id === targetId) || graphPayload.value.nodes[0] || null
})

const selectedNodeTitle = computed(() => selectedGraphNode.value?.label || selectedArtifactDetail.value?.displayTitle || '等待图谱载入')
const selectedNodeSummary = computed(() => {
  return selectedGraphNode.value?.summary || '顺着这条关系继续展开，你会看到文物如何回到古蜀文明的时空与工艺语境中。'
})
const activeNarrative = computed(() => {
  if (!selectedGraphNode.value || selectedGraphNode.value.id === graphPayload.value.centerNodeId) {
    return graphPayload.value.narrative || '这件文物并非孤立展品，它与遗址、时代、工艺和寓意共同构成一条可继续追踪的古蜀线索。'
  }
  return `${selectedGraphNode.value.label} 正在成为新的观察切口。顺着它继续走，你会看到这件文物背后的更多关联。`
})

const selectedNodeRelations = computed(() => {
  if (!selectedGraphNode.value) return []
  const nodesById = new Map(graphPayload.value.nodes.map((node) => [node.id, node]))
  return graphPayload.value.edges
    .filter((edge) => edge.source === selectedGraphNode.value.id || edge.target === selectedGraphNode.value.id)
    .map((edge) => {
      const targetId = edge.source === selectedGraphNode.value.id ? edge.target : edge.source
      const targetNode = nodesById.get(targetId)
      return {
        targetId,
        relation: edge.label,
        label: targetNode?.label || targetId
      }
    })
    .slice(0, 6)
})

const selectedNodeActionTitle = computed(() => {
  const node = selectedGraphNode.value
  if (!node) return '继续探索'
  if (node.type === 'artifact' && node.entityId === selectedArtifactDetail.value?.entityId) return '继续听玄喵讲这件文物'
  if (node.type === 'artifact') return '切换到另一件相关文物'
  if (node.type === 'site') return '把视角切到这个遗址'
  if (node.type === 'era') return '回到这个时代'
  if (node.type === 'craft') return '查看同工艺文物'
  if (node.type === 'meaning') return '继续追踪这一寓意'
  return '顺着这条关系往下走'
})

const selectedNodeActionHint = computed(() => {
  const node = selectedGraphNode.value
  if (!node) return '从当前节点继续延伸下一步。'
  if (node.type === 'artifact' && node.entityId === selectedArtifactDetail.value?.entityId) return '玄喵会接着当前图谱上下文，把这件文物讲得更完整。'
  if (node.type === 'artifact') return '不离开展线，直接把焦点切到另一件相关文物。'
  if (node.type === 'site') return '重新整理遗址筛选，让展线回到这个空间坐标。'
  if (node.type === 'era') return '重新整理时代筛选，看看同一阶段还有哪些文物。'
  if (node.type === 'craft') return '聚焦采用同类工艺的文物，让工艺线索继续展开。'
  if (node.type === 'meaning') return '以寓意为线索继续浏览命中文物。'
  return '继续沿着这条关系往下探索。'
})

const selectedNodeActionButton = computed(() => {
  const node = selectedGraphNode.value
  if (!node) return '继续探索'
  if (node.type === 'artifact' && node.entityId === selectedArtifactDetail.value?.entityId) return '听玄喵继续讲'
  if (node.type === 'artifact') return '切到这件文物'
  if (node.type === 'site') return '应用这个遗址'
  if (node.type === 'era') return '应用这个时代'
  if (node.type === 'craft') return '应用这项工艺'
  if (node.type === 'meaning') return '追踪这一寓意'
  return '继续探索'
})

const graphTypeFilters = computed(() => {
  const counts = graphPayload.value.nodes.reduce((result, node) => {
    result[node.type] = (result[node.type] || 0) + 1
    return result
  }, {})
  return graphPayload.value.availableTypes.map((type) => ({
    type,
    label: TYPE_LABELS[type] || type,
    count: counts[type] || 0
  }))
})

onMounted(async () => {
  await loadArtifacts()
  mountResizeObserver()
})

onBeforeUnmount(() => {
  if (filterTimer) window.clearTimeout(filterTimer)
  if (graphClickTimer) window.clearTimeout(graphClickTimer)
  resizeObserver?.disconnect()
  destroyThreeStage()
  destroyGraph()
  chatAbortController?.abort?.()
})

watch([activeEra, activeSite, activeCraft], () => {
  activeScene.value = 1
  stageVisible.value = false
  guideExpanded.value = false
  if (filterTimer) window.clearTimeout(filterTimer)
  filterTimer = window.setTimeout(() => {
    void loadArtifacts()
  }, 180)
})

watch(meaningFocus, () => {
  syncSelectedArtifactFromVisible()
})

watch(
  [activeScene, stageVisible, () => selectedArtifactDetail.value?.entityId],
  async ([sceneId, stageOpen, entityId]) => {
    if (sceneId === 3 && stageOpen && entityId) {
      await ensureStageExperience()
      return
    }

    destroyThreeStage()
    destroyGraph()
    stageReadyEntityId.value = ''
    graphReadyEntityId.value = ''
  }
)

async function loadArtifacts() {
  const token = ++searchToken.value
  loadError.value = ''
  if (artifacts.value.length) {
    isRefreshing.value = true
  } else {
    isLoading.value = true
  }

  try {
    const response = await searchSpacetimeArtifacts(
      {
        eraCode: activeEra.value || undefined,
        siteCode: activeSite.value || undefined,
        craftCode: activeCraft.value || undefined
      },
      { showDefaultMsg: false }
    )

    if (token !== searchToken.value) return

    artifacts.value = Array.isArray(response?.artifacts) ? response.artifacts : []
    searchNarrative.value = response?.narrative || { entryLine: '', sceneLine: '', resultLine: '' }
    siteOptions.value = response?.facets?.siteOptions || []
    eraOptions.value = response?.facets?.eraOptions || []
    craftOptions.value = response?.facets?.craftOptions || []

    syncSelectedArtifactFromVisible()
    syncQueryState()
  } catch (error) {
    console.error('加载时空展线失败:', error)
    loadError.value = '时空展线暂时没有完整展开。你可以稍后重试，或先回到首页和其他页面继续浏览。'
  } finally {
    if (token === searchToken.value) {
      isLoading.value = false
      isRefreshing.value = false
    }
  }
}

function syncSelectedArtifactFromVisible() {
  if (!visibleArtifacts.value.length) {
    activeScene.value = 1
    stageVisible.value = false
    selectedArtifactId.value = ''
    selectedArtifactDetail.value = null
    selectedReason.value = ''
    destroyThreeStage()
    destroyGraph()
    stageReadyEntityId.value = ''
    graphReadyEntityId.value = ''
    resetMessages()
    return
  }

  const stillVisible = visibleArtifacts.value.find((item) => item.entityId === selectedArtifactId.value)
  if (stillVisible) {
    void selectArtifact(stillVisible, selectedReason.value || buildArtifactReason(stillVisible), {
      keepScene: true
    })
    return
  }

  const nextArtifact = recommendArtifact(visibleArtifacts.value)
  void selectArtifact(nextArtifact, buildArtifactReason(nextArtifact), {
    keepScene: true
  })
}

function recommendArtifact(list) {
  return [...list].sort((a, b) => scoreArtifact(b) - scoreArtifact(a))[0]
}

function scoreArtifact(item) {
  let score = 0
  if (item.isModelReady) score += 40
  if (item.symbolicMeaningZh?.length || item.symbolicMeaning) score += 20
  if (item.craftNamesZh?.length) score += item.craftNamesZh.length * 6
  if (item.summary) score += 8
  if (item.cardImage || item.coverImage) score += 5
  return score
}

function buildArtifactReason(item) {
  const reasons = []
  if (item.isModelReady) reasons.push('已具备 3D 模型')
  if ((item.symbolicMeaningZh?.length || 0) > 0 || item.symbolicMeaning) reasons.push('寓意线索更完整')
  if ((item.craftNamesZh?.length || 0) > 1) reasons.push('关联工艺更丰富')
  if (!reasons.length) reasons.push('它最适合从当前筛选视角先看')
  return `优先推荐理由：${reasons.join('、')}。`
}

async function selectArtifact(artifact, reason = '', options = {}) {
  if (!artifact?.entityId) return

  const { keepScene = false } = options

  const sameArtifact =
    selectedArtifactId.value === artifact.entityId &&
    selectedArtifactDetail.value?.entityId === artifact.entityId

  selectedArtifactId.value = artifact.entityId
  selectedReason.value = reason || buildArtifactReason(artifact)
  if (!keepScene) {
    activeScene.value = 2
  }
  syncQueryState()

  if (sameArtifact) return
  await loadSelectedArtifactExperience(artifact.entityId)
}

async function loadSelectedArtifactExperience(entityId) {
  guideExpanded.value = false
  stageVisible.value = false
  selectedArtifactDetail.value = null
  destroyThreeStage()
  destroyGraph()
  stageReadyEntityId.value = ''
  graphReadyEntityId.value = ''
  modelError.value = ''
  modelProgress.value = 0
  graphError.value = ''

  try {
    const detail = await getSpacetimeArtifactDetail({ entityId }, { showDefaultMsg: false })
    selectedArtifactDetail.value = detail
    pushCompetitionTrail({
      entityId: detail.entityId,
      title: detail.displayTitle,
      siteLabel: detail.siteLabel,
      eraLabel: detail.eraLabel,
      reason: selectedReason.value,
      stage: 'trail',
      sourceStage: 'trail'
    })

    await initializeGuide()

    if (activeScene.value === 3 && stageVisible.value) {
      await ensureStageExperience(true)
    }
  } catch (error) {
    console.error('加载焦点文物失败:', error)
    selectedArtifactDetail.value = null
    modelError.value = '当前文物详情未能完整读取，你仍然可以保留筛选结果并切换到其他文物。'
    resetMessages()
  }
}

function syncQueryState() {
  router.replace({
    path: '/trail',
    query: {
      eraCode: activeEra.value || undefined,
      siteCode: activeSite.value || undefined,
      craftCode: activeCraft.value || undefined,
      entityId: selectedArtifactId.value || undefined
    }
  })
}

function describeFacet(option) {
  const count = Number(option?.artifactCount || 0)
  const ready = Number(option?.readyModelCount || 0)
  return `命中 ${count} 件 · ${ready} 件可进 3D`
}

function resetFilters() {
  activeScene.value = 1
  activeEra.value = ''
  activeSite.value = ''
  activeCraft.value = ''
  meaningFocus.value = ''
  stageVisible.value = false
  guideExpanded.value = false
}

async function ensureStageExperience(force = false) {
  const entityId = selectedArtifactDetail.value?.entityId
  if (!entityId || activeScene.value !== 3 || !stageVisible.value) return

  await nextTick()

  if (!viewerRef.value || !graphRef.value) return
  if (!viewerRef.value.clientWidth || !viewerRef.value.clientHeight) return

  if (force || stageReadyEntityId.value !== entityId) {
    destroyThreeStage()
    initThreeStage()
    stageReadyEntityId.value = entityId
  } else {
    resizeThreeStage()
  }

  if (force || graphReadyEntityId.value !== entityId) {
    await loadGraph()
    graphReadyEntityId.value = entityId
  } else if (graphInstance && graphRef.value) {
    graphInstance.setSize(graphRef.value.clientWidth || 320, graphRef.value.clientHeight || 420)
    await graphInstance.fitView()
  }
}

function goToScene(sceneId) {
  if (sceneId === 1) {
    activeScene.value = 1
    return
  }

  if (sceneId === 2) {
    activeScene.value = 2
    return
  }

  if (sceneId === 3) {
    if (!selectedArtifact.value) return
    stageVisible.value = true
    activeScene.value = 3
    return
  }

  if (sceneId === 4) {
    if (!selectedArtifact.value) return
    stageVisible.value = true
    guideExpanded.value = true
    activeScene.value = 4
  }
}

function scrollToArtifacts() {
  activeScene.value = 2
}

function scrollToStage() {
  if (!selectedArtifact.value) return
  stageVisible.value = true
  activeScene.value = 3
}

function scrollToGuide() {
  if (!selectedArtifact.value) return
  stageVisible.value = true
  guideExpanded.value = true
  activeScene.value = 4
}

function toggleGuideExpanded(expanded) {
  guideExpanded.value = expanded
}

function openGuideAndAsk(question) {
  stageVisible.value = true
  guideExpanded.value = true
  activeScene.value = 4
  nextTick(() => {
    void sendMessage(question)
  })
}

function openStandalone3D(artifact) {
  router.push({
    path: '/3d',
    query: {
      entityId: artifact.entityId,
      title: artifact.displayTitle,
      siteCode: artifact.siteCode,
      eraCode: artifact.eraCode,
      glbUrl: artifact.resolvedGlbUrl || ''
    }
  })
}

function initThreeStage() {
  if (!viewerRef.value || !canvasRef.value) return

  const glbUrl = selectedArtifactDetail.value?.resolvedGlbUrl || ''
  if (!glbUrl) {
    isModelLoading.value = false
    modelProgress.value = 100
    modelError.value = ''
    return
  }

  isModelLoading.value = true
  modelProgress.value = 8
  modelError.value = ''

  scene = new THREE.Scene()
  scene.background = new THREE.Color('#08110d')
  scene.fog = new THREE.Fog('#08110d', 8, 28)

  const { clientWidth, clientHeight } = viewerRef.value
  camera = new THREE.PerspectiveCamera(38, clientWidth / clientHeight, 0.1, 120)
  camera.position.set(0, 1.5, 5.6)

  renderer = new THREE.WebGLRenderer({ canvas: canvasRef.value, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(clientWidth, clientHeight)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.12

  pmremGenerator = new THREE.PMREMGenerator(renderer)
  environmentTexture = pmremGenerator.fromScene(new RoomEnvironment(renderer), 0.04).texture
  scene.environment = environmentTexture

  scene.add(new THREE.AmbientLight('#f5f0da', 1.28), new THREE.HemisphereLight('#fff3cf', '#0f1814', 0.92))

  const spotLight = new THREE.SpotLight('#ffe4a8', 2.75, 34, Math.PI / 6, 0.28, 1)
  spotLight.position.set(6, 10, 8)
  const fillLight = new THREE.DirectionalLight('#ffd98f', 1.15)
  fillLight.position.set(-4, 5, 6)
  const rimLight = new THREE.PointLight('#79c4a7', 1.5, 24)
  rimLight.position.set(-6, 2, -5)
  scene.add(spotLight, fillLight, rimLight)

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(6, 96),
    new THREE.MeshBasicMaterial({ color: '#0f1914', transparent: true, opacity: 0.74 })
  )
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -1.35
  scene.add(floor)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.06
  controls.minDistance = 2.6
  controls.maxDistance = 9.8
  controls.maxPolarAngle = Math.PI * 0.68
  controls.target.set(0, 0, 0)

  const loader = new GLTFLoader()
  loader.load(
    glbUrl,
    (gltf) => {
      glbModel = gltf.scene
      const box = new THREE.Box3().setFromObject(glbModel)
      const size = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())
      const maxDimension = Math.max(size.x, size.y, size.z) || 1
      const scale = 2.35 / maxDimension
      glbModel.scale.setScalar(scale)
      glbModel.position.sub(center.multiplyScalar(scale))
      glbModel.position.y -= 0.9

      glbModel.traverse((child) => {
        if (!child.isMesh || !child.material) return
        const materials = Array.isArray(child.material) ? child.material : [child.material]
        materials.forEach((mat) => {
          mat.needsUpdate = true
          if ('envMapIntensity' in mat) mat.envMapIntensity = 1.2
        })
      })

      scene.add(glbModel)
      controls.target.set(0, 0, 0)
      controls.update()
      isModelLoading.value = false
      modelProgress.value = 100
    },
    (event) => {
      if (event.total) {
        modelProgress.value = Math.min(98, Math.floor((event.loaded / event.total) * 100))
      }
    },
    () => {
      isModelLoading.value = false
      modelProgress.value = 100
      modelError.value = '模型资源暂时无法读取，你仍然可以继续看图谱和玄喵讲解。'
    }
  )

  animateThreeStage()
}

function animateThreeStage() {
  frameId = requestAnimationFrame(animateThreeStage)
  controls?.update()
  renderer?.render(scene, camera)
}
function destroyThreeStage() {
  if (frameId) {
    cancelAnimationFrame(frameId)
    frameId = 0
  }
  controls?.dispose()
  environmentTexture?.dispose?.()
  pmremGenerator?.dispose?.()
  renderer?.dispose?.()
  scene = null
  camera = null
  controls = null
  renderer = null
  glbModel = null
  environmentTexture = null
  pmremGenerator = null
}

async function loadGraph() {
  if (!selectedArtifactDetail.value?.entityId) return

  graphLoading.value = true
  graphError.value = ''

  try {
    const response = await getArtifactGraph({ entityId: selectedArtifactDetail.value.entityId }, { showDefaultMsg: false })
    graphPayload.value = normalizeGraphPayload(response)
    activeTypeFilters.value = [...graphPayload.value.availableTypes]
    selectedNodeId.value = graphPayload.value.centerNodeId
    expandedNodeIds.value = new Set()
    await nextTick()
    await renderGraph()
  } catch (error) {
    console.error('图谱加载失败:', error)
    graphError.value = '关系网络暂时没有完整展开，但当前文物档案和讲解仍可继续浏览。'
  } finally {
    graphLoading.value = false
  }
}

async function expandNode(node) {
  if (!node?.expandable || expandedNodeIds.value.has(node.id) || !selectedArtifactDetail.value?.entityId) return

  graphLoading.value = true
  try {
    const response = await getArtifactGraphNeighbors(
      {
        entityId: selectedArtifactDetail.value.entityId,
        nodeId: node.id,
        depth: 1
      },
      { showDefaultMsg: false }
    )
    graphPayload.value = mergeGraphPayload(graphPayload.value, normalizeGraphPayload(response))
    expandedNodeIds.value = new Set([...expandedNodeIds.value, node.id])
    preserveTypeFilters()
    await renderGraph()
  } catch (error) {
    console.error('图谱扩展失败:', error)
    graphError.value = '这个节点暂时不能继续展开，不过你仍然可以使用当前图谱继续探索。'
  } finally {
    graphLoading.value = false
  }
}

function normalizeGraphPayload(payload) {
  const nodes = Array.isArray(payload?.nodes) ? payload.nodes : []
  const edges = Array.isArray(payload?.edges) ? payload.edges : []
  const availableTypes = Array.isArray(payload?.availableTypes)
    ? payload.availableTypes
    : [...new Set(nodes.map((node) => node.type).filter(Boolean))]
  return {
    centerNodeId: payload?.centerNodeId || nodes.find((node) => node.type === 'artifact')?.id || '',
    narrative: payload?.narrative || '',
    availableTypes,
    stats: payload?.stats || {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      expandableCount: nodes.filter((node) => node.expandable).length
    },
    nodes,
    edges
  }
}

function mergeGraphPayload(currentPayload, incomingPayload) {
  const nodeMap = new Map()
  const edgeMap = new Map()
  ;[...(currentPayload?.nodes || []), ...(incomingPayload?.nodes || [])].forEach((node) => {
    nodeMap.set(node.id, { ...(nodeMap.get(node.id) || {}), ...node })
  })
  ;[...(currentPayload?.edges || []), ...(incomingPayload?.edges || [])].forEach((edge) => {
    const edgeId = edge.id || `${edge.source}->${edge.target}:${edge.category || edge.label || 'edge'}`
    edgeMap.set(edgeId, { id: edgeId, ...edge })
  })
  const mergedNodes = [...nodeMap.values()]
  const mergedEdges = [...edgeMap.values()]
  const mergedTypes = [...new Set([...(currentPayload?.availableTypes || []), ...(incomingPayload?.availableTypes || [])])]
  return {
    centerNodeId: currentPayload?.centerNodeId || incomingPayload?.centerNodeId || '',
    narrative: currentPayload?.narrative || incomingPayload?.narrative || '',
    availableTypes: mergedTypes,
    stats: {
      nodeCount: mergedNodes.length,
      edgeCount: mergedEdges.length,
      expandableCount: mergedNodes.filter((node) => node.expandable).length
    },
    nodes: mergedNodes,
    edges: mergedEdges
  }
}

function preserveTypeFilters() {
  if (!activeTypeFilters.value.length) {
    activeTypeFilters.value = [...graphPayload.value.availableTypes]
    return
  }
  activeTypeFilters.value = graphPayload.value.availableTypes.filter((type) => activeTypeFilters.value.includes(type))
}

function getVisibleGraphPayload() {
  const enabledTypes = new Set(activeTypeFilters.value)
  const nodes = graphPayload.value.nodes.filter((node) => enabledTypes.has(node.type))
  const visibleNodeIds = new Set(nodes.map((node) => node.id))
  const edges = graphPayload.value.edges.filter((edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target))
  return { nodes, edges }
}

function buildG6Data() {
  const { nodes, edges } = getVisibleGraphPayload()
  const positions = computeRadialLayout(nodes, graphPayload.value.centerNodeId)
  return {
    nodes: nodes.map((node) => ({
      id: node.id,
      data: node,
      style: {
        ...buildNodeStyle(node),
        ...(positions.get(node.id) || { x: 0, y: 0 })
      }
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      data: edge,
      style: buildEdgeStyle(edge)
    }))
  }
}

function computeRadialLayout(nodes, centerNodeId) {
  const positions = new Map()
  const centerId = centerNodeId || nodes.find((node) => node.type === 'artifact')?.id
  if (!centerId) return positions

  positions.set(centerId, { x: 0, y: 0 })
  const ringBuckets = {
    ring1: nodes.filter((node) => node.id !== centerId && (node.type === 'site' || node.type === 'era')),
    ring2: nodes.filter((node) => node.id !== centerId && (node.type === 'craft' || node.type === 'meaning')),
    ring3: nodes.filter((node) => node.id !== centerId && node.type === 'artifact')
  }

  layoutRing(ringBuckets.ring1, 170, positions, -Math.PI / 2)
  layoutRing(ringBuckets.ring2, 290, positions, -Math.PI / 3)
  layoutRing(ringBuckets.ring3, 410, positions, 0)
  return positions
}

function layoutRing(nodes, radius, positions, startAngle) {
  if (!nodes.length) return
  nodes.forEach((node, index) => {
    const angle = startAngle + (Math.PI * 2 * index) / nodes.length
    positions.set(node.id, {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    })
  })
}

function buildNodeStyle(node) {
  const palette = TYPE_COLORS[node.type] || TYPE_COLORS.meaning
  const isCenter = node.id === graphPayload.value.centerNodeId
  const isRelatedArtifact = node.type === 'artifact' && !isCenter
  const size = isCenter ? 108 : isRelatedArtifact ? 70 : node.type === 'site' || node.type === 'era' ? 58 : 46
  return {
    size,
    fill: palette.fill,
    stroke: palette.stroke,
    lineWidth: isCenter ? 3 : 2,
    shadowColor: `${palette.stroke}66`,
    shadowBlur: isCenter ? 22 : 12,
    cursor: 'pointer',
    halo: true,
    haloLineWidth: isCenter ? 18 : 10,
    haloStroke: palette.stroke,
    haloStrokeOpacity: isCenter ? 0.3 : 0.18,
    label: true,
    labelText: node.label,
    labelFill: isCenter ? '#f8f0db' : palette.label,
    labelFontFamily: '"Noto Serif SC", "STZhongsong", serif',
    labelFontWeight: isCenter ? 700 : 600,
    labelFontSize: isCenter ? 18 : 13,
    labelPlacement: isCenter ? 'center' : 'bottom',
    labelOffsetY: isCenter ? 0 : 14
  }
}

function buildEdgeStyle(edge) {
  const stroke =
    edge.category === 'origin'
      ? '#86ceb2'
      : edge.category === 'time'
        ? '#8aaed4'
        : edge.category === 'craft'
          ? '#d8c07b'
          : '#b9a985'

  return {
    stroke,
    lineWidth: edge.weight === 2 ? 2.4 : 1.4,
    opacity: 0.7,
    lineDash: edge.category === 'meaning' ? [8, 6] : undefined,
    endArrow: true,
    cursor: 'pointer'
  }
}

async function renderGraph() {
  if (!graphRef.value) return

  const data = buildG6Data()
  if (!data.nodes.length) {
    destroyGraph()
    return
  }

  const width = Math.max(graphRef.value.clientWidth || 0, 320)
  const height = Math.max(graphRef.value.clientHeight || 0, 420)

  if (!graphInstance) {
    graphInstance = new G6Graph({
      container: graphRef.value,
      width,
      height,
      data,
      autoFit: 'view',
      padding: 36,
      animation: false,
      node: {
        type: 'circle',
        state: {
          active: { lineWidth: 4, haloLineWidth: 22, haloStrokeOpacity: 0.45 },
          neighbor: { lineWidth: 3, haloLineWidth: 16, haloStrokeOpacity: 0.28 },
          dim: { opacity: 0.16 }
        }
      },
      edge: {
        type: 'line',
        state: {
          active: { lineWidth: 2.8, opacity: 1 },
          dim: { opacity: 0.08 }
        }
      },
      behaviors: ['drag-canvas', 'zoom-canvas', 'drag-node']
    })
    bindGraphEvents()
  } else {
    graphInstance.setSize(width, height)
    graphInstance.setData(data)
  }

  await graphInstance.render()
  normalizeSelectedNode()
  await applyFocusState(selectedNodeId.value || graphPayload.value.centerNodeId)
}

function bindGraphEvents() {
  if (!graphInstance) return

  graphInstance.on('node:click', async (event) => {
    const nodeId = event?.target?.id
    if (!nodeId) return
    if (graphClickTimer) window.clearTimeout(graphClickTimer)
    graphClickTimer = window.setTimeout(async () => {
      selectedNodeId.value = nodeId
      await applyFocusState(nodeId)
      const node = graphPayload.value.nodes.find((item) => item.id === nodeId)
      if (node?.expandable && !expandedNodeIds.value.has(node.id)) {
        await expandNode(node)
        await applyFocusState(nodeId)
      }
    }, 180)
  })

  graphInstance.on('node:dblclick', (event) => {
    const nodeId = event?.target?.id
    if (!nodeId) return
    if (graphClickTimer) {
      window.clearTimeout(graphClickTimer)
      graphClickTimer = null
    }
    const node = graphPayload.value.nodes.find((item) => item.id === nodeId)
    if (node) jumpByNode(node)
  })

  graphInstance.on('node:mouseenter', async (event) => {
    const nodeId = event?.target?.id
    if (!nodeId || nodeId === selectedNodeId.value) return
    await applyFocusState(nodeId, false)
  })

  graphInstance.on('node:mouseleave', async () => {
    await applyFocusState(selectedNodeId.value || graphPayload.value.centerNodeId, false)
  })
}

async function applyFocusState(nodeId, animate = true) {
  if (!graphInstance || !nodeId) return
  const { nodes, edges } = getVisibleGraphPayload()
  const neighborIds = new Set([nodeId])
  const states = {}

  edges.forEach((edge) => {
    const isRelated = edge.source === nodeId || edge.target === nodeId
    states[edge.id] = isRelated ? ['active'] : ['dim']
    if (isRelated) {
      neighborIds.add(edge.source)
      neighborIds.add(edge.target)
    }
  })

  nodes.forEach((node) => {
    if (node.id === nodeId) {
      states[node.id] = ['active']
    } else if (neighborIds.has(node.id)) {
      states[node.id] = ['neighbor']
    } else {
      states[node.id] = ['dim']
    }
  })

  await graphInstance.setElementState(states, false)
  if (animate) {
    await graphInstance.focusElement(nodeId, { duration: 400, easing: 'ease-in-out' })
  }
}

function normalizeSelectedNode() {
  const visibleIds = new Set(getVisibleGraphPayload().nodes.map((node) => node.id))
  if (!visibleIds.has(selectedNodeId.value)) {
    selectedNodeId.value = graphPayload.value.centerNodeId
  }
}

function toggleTypeFilter(type) {
  const nextFilters = activeTypeFilters.value.includes(type)
    ? activeTypeFilters.value.filter((item) => item !== type)
    : [...activeTypeFilters.value, type]
  activeTypeFilters.value = nextFilters.length ? nextFilters : [...graphPayload.value.availableTypes]
  void renderGraph()
}

async function focusCenterNode() {
  selectedNodeId.value = graphPayload.value.centerNodeId
  await applyFocusState(selectedNodeId.value)
}

async function resetGraphViewport() {
  if (!graphInstance) return
  await graphInstance.fitView()
  await applyFocusState(selectedNodeId.value || graphPayload.value.centerNodeId, false)
}

function jumpByNode(node) {
  if (!node) return

  if (node.type === 'artifact') {
    if (node.entityId === selectedArtifactDetail.value?.entityId) {
      scrollToGuide()
      return
    }
    const nextArtifact = artifacts.value.find((item) => item.entityId === (node.routeTarget || node.entityId))
    if (nextArtifact) {
      void selectArtifact(nextArtifact, `你顺着 ${selectedNodeTitle.value} 这条关系线索，继续走向另一件相关文物。`)
      activeScene.value = 3
      stageVisible.value = true
      return
    }
    selectedArtifactId.value = node.routeTarget || node.entityId || ''
    selectedReason.value = `你顺着 ${selectedNodeTitle.value} 这条关系线索，继续走向另一件相关文物。`
    void loadSelectedArtifactExperience(selectedArtifactId.value)
    activeScene.value = 3
    stageVisible.value = true
    return
  }

  if (node.type === 'site') {
    activeSite.value = node.routeTarget || node.label || ''
    meaningFocus.value = ''
    scrollToArtifacts()
    return
  }

  if (node.type === 'era') {
    activeEra.value = node.routeTarget || node.label || ''
    meaningFocus.value = ''
    scrollToArtifacts()
    return
  }

  if (node.type === 'craft') {
    activeCraft.value = node.routeTarget || node.label || ''
    meaningFocus.value = ''
    scrollToArtifacts()
    return
  }

  if (node.type === 'meaning') {
    meaningFocus.value = node.routeTarget || node.label || ''
    scrollToArtifacts()
  }
}

function destroyGraph() {
  graphInstance?.destroy()
  graphInstance = null
}

function mountResizeObserver() {
  resizeObserver?.disconnect()
  resizeObserver = new ResizeObserver(async () => {
    resizeThreeStage()
    if (graphInstance && graphRef.value) {
      graphInstance.setSize(graphRef.value.clientWidth || 320, graphRef.value.clientHeight || 420)
      await graphInstance.fitView()
    }
  })

  if (viewerRef.value) resizeObserver.observe(viewerRef.value)
  if (graphRef.value) resizeObserver.observe(graphRef.value)
}

function resizeThreeStage() {
  if (!viewerRef.value || !camera || !renderer) return
  const width = viewerRef.value.clientWidth
  const height = viewerRef.value.clientHeight
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

async function initializeGuide() {
  chatAbortController?.abort?.()
  resetMessages()
  await maybeAutoStartGuide()
}

function createInitialMessages() {
  if (!selectedArtifactDetail.value) {
    return [
      {
        id: 1,
        role: 'assistant',
        content: ['玄喵已经在展线末端等你。先选一件文物，我会从“这是什么、为什么重要、它和谁有关、下一步还能看什么”开始讲。'],
        time: getCurrentTime()
      }
    ]
  }

  const intro = [
    `你已经站到 ${selectedArtifactDetail.value.displayTitle} 面前了。`,
    selectedReason.value || `我会先围绕 ${selectedArtifactDetail.value.displayTitle} 的遗址、年代、工艺和寓意，把它讲成一段完整的古蜀线索。`
  ]

  if (previousArtifact.value?.title) {
    intro.push(`如果你愿意，我也可以把它和刚才看过的 ${previousArtifact.value.title} 放在一起比较。`)
  }

  return [
    {
      id: Date.now(),
      role: 'assistant',
      content: intro,
      time: getCurrentTime()
    }
  ]
}

function resetMessages() {
  currentSessionId.value = null
  messages.value = createInitialMessages()
  scrollMessagesToBottom()
}

function getCurrentArtifactEntityId() {
  return selectedArtifactDetail.value?.entityId || selectedArtifactId.value || ''
}

function updateAssistantMessageById(messageId, content) {
  const targetMessage = messages.value.find((item) => item.id === messageId)
  if (!targetMessage) return
  targetMessage.content = Array.isArray(content) ? content : [content]
  scrollMessagesToBottom()
}

function buildAutoGuideQuestion() {
  return '请你以三星堆数字展线讲解员“玄喵”的口吻，围绕当前文物先做一段开场讲解。按“这是什么、为什么重要、它和什么有关、下一步还可以看什么”的顺序来讲，控制在四句以内，语言自然、适合展馆导览。'
}

async function maybeAutoStartGuide() {
  const entityId = getCurrentArtifactEntityId()
  if (!entityId || entityId === lastAutoAskedEntityId.value) return
  lastAutoAskedEntityId.value = entityId
  await requestAutoGuide(entityId)
}

async function requestAutoGuide(expectedEntityId) {
  const question = buildAutoGuideQuestion()
  let docs = []
  let userMessage = question

  const placeholderId = Date.now() + Math.random()
  messages.value.push({
    id: placeholderId,
    role: 'assistant',
    content: ['玄喵正在顺着当前文物的时空线索整理讲解……'],
    time: getCurrentTime()
  })
  scrollMessagesToBottom()

  try {
    docs = await searchKnowledge(question, 1)
    userMessage = buildPromptWithContext(question, docs)
  } catch (error) {
    console.warn('自动讲解检索失败，继续用当前文物上下文生成讲解。', error)
  }

  if (!currentSessionId.value) {
    await createSession()
  }

  if (!currentSessionId.value) {
    updateAssistantMessageById(placeholderId, getMockReply(question, docs))
    return
  }

  isThinking.value = true
  const controller = new AbortController()
  chatAbortController?.abort?.()
  chatAbortController = controller
  let aiResponse = ''
  const headers = { 'Content-Type': 'application/json' }
  if (userStore.token) {
    headers.Authorization = `Bearer ${userStore.token}`
  }

  try {
    await fetchEventSource(getChatStreamUrl(), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        sessionId: currentSessionId.value,
        userMessage
      }),
      signal: controller.signal,
      openWhenHidden: true,
      onmessage(event) {
        if (event.data === '[DONE]') {
          isThinking.value = false
          return
        }
        if (event.data.startsWith('[ERROR]')) {
          isThinking.value = false
          updateAssistantMessageById(placeholderId, getMockReply(question, docs))
          return
        }
        aiResponse += event.data
        updateAssistantMessageById(placeholderId, aiResponse)
      },
      onerror(error) {
        if (controller.signal.aborted || getCurrentArtifactEntityId() !== expectedEntityId) {
          return 0
        }
        console.error('自动讲解 SSE 连接失败:', error)
        isThinking.value = false
        updateAssistantMessageById(placeholderId, getMockReply(question, docs))
        return 999999999
      },
      onclose() {
        isThinking.value = false
      }
    })
  } catch (error) {
    if (!controller.signal.aborted && getCurrentArtifactEntityId() === expectedEntityId) {
      console.error('自动讲解请求失败:', error)
      updateAssistantMessageById(placeholderId, getMockReply(question, docs))
    }
    isThinking.value = false
  } finally {
    if (chatAbortController === controller) {
      chatAbortController = null
    }
  }
}

async function createSession() {
  try {
    const title = selectedArtifactDetail.value
      ? `时空展线讲解 - ${selectedArtifactDetail.value.displayTitle}`
      : '时空展线讲解'
    currentSessionId.value = await createSessionApi(title, { showDefaultMsg: false })
  } catch (error) {
    console.error('创建 AI 会话失败:', error)
    currentSessionId.value = null
  }
}

function getCurrentContextPayload() {
  if (!selectedArtifactDetail.value) return null
  return {
    title: selectedArtifactDetail.value.displayTitle,
    entityId: selectedArtifactDetail.value.entityId,
    site: selectedArtifactDetail.value.siteLabel,
    era:
      selectedArtifactDetail.value.yearLabel ||
      formatYearRange(selectedArtifactDetail.value.timeStartYear, selectedArtifactDetail.value.timeEndYear),
    craft: selectedArtifactDetail.value.craftLabel,
    summary: selectedArtifactDetail.value.summary || '',
    previousTitle: previousArtifact.value?.title || '',
    previousSite: previousArtifact.value?.siteLabel || '',
    previousEra: previousArtifact.value?.eraLabel || '',
    entryReason: selectedReason.value || ''
  }
}

function buildPromptWithContext(question, docs = []) {
  return buildRagPrompt(question, docs, getCurrentContextPayload() || {})
}

function getMockReply(question = '', docs = []) {
  return buildFallbackReply(question, docs, getCurrentContextPayload() || {})
}

async function sendMessage(presetQuestion = '') {
  const question = (presetQuestion || draft.value).trim()
  if (!question || isThinking.value) return

  const fixedAnswer = matchFixedAnswer(question)
  messages.value.push({
    id: Date.now(),
    role: 'user',
    content: [question],
    time: getCurrentTime()
  })
  draft.value = ''
  scrollMessagesToBottom()

  if (fixedAnswer) {
    appendAssistantMessage(fixedAnswer)
    return
  }

  let docs = []
  let userMessage = question
  try {
    docs = await searchKnowledge(question, 1)
    userMessage = buildPromptWithContext(question, docs)
  } catch (error) {
    console.warn('本地知识检索失败，降级为原始问题。', error)
  }

  if (!currentSessionId.value) {
    await createSession()
  }

  if (!currentSessionId.value) {
    appendAssistantMessage(getMockReply(question, docs))
    return
  }

  isThinking.value = true
  chatAbortController?.abort?.()
  chatAbortController = new AbortController()

  let aiResponse = ''
  const headers = { 'Content-Type': 'application/json' }
  if (userStore.token) {
    headers.Authorization = `Bearer ${userStore.token}`
  }

  try {
    await fetchEventSource(getChatStreamUrl(), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        sessionId: currentSessionId.value,
        userMessage
      }),
      signal: chatAbortController.signal,
      openWhenHidden: true,
      onmessage(event) {
        if (event.data === '[DONE]') {
          isThinking.value = false
          return
        }
        if (event.data.startsWith('[ERROR]')) {
          isThinking.value = false
          appendAssistantMessage(getMockReply(question, docs))
          return
        }
        aiResponse += event.data
        const lastMessage = messages.value[messages.value.length - 1]
        if (lastMessage && lastMessage.role === 'assistant') {
          lastMessage.content = [aiResponse]
        } else {
          messages.value.push({
            id: Date.now() + 1,
            role: 'assistant',
            content: [aiResponse],
            time: getCurrentTime()
          })
        }
        scrollMessagesToBottom()
      },
      onerror(error) {
        console.error('AI SSE 连接失败:', error)
        isThinking.value = false
        appendAssistantMessage(getMockReply(question, docs))
        return 999999999
      },
      onclose() {
        isThinking.value = false
      }
    })
  } catch (error) {
    console.error('发送 AI 消息失败:', error)
    isThinking.value = false
    appendAssistantMessage(getMockReply(question, docs))
  } finally {
    chatAbortController = null
  }
}

function appendAssistantMessage(content) {
  const lines = Array.isArray(content) ? content : [content]
  messages.value.push({
    id: Date.now() + Math.random(),
    role: 'assistant',
    content: lines,
    time: getCurrentTime()
  })
  scrollMessagesToBottom()
}

function scrollMessagesToBottom() {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }
  })
}

function getCurrentTime() {
  const date = new Date()
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}
</script>

<style scoped>
@import '@/styles/competitionMotion.css';

.time-space-trail {
  --paper: #fbf7ee;
  --paper-soft: rgba(255, 251, 243, 0.92);
  --ink: #1d342b;
  --ink-soft: #6d7d75;
  --green: #42664f;
  --green-deep: #29483a;
  --gold: #b89243;
  --line: rgba(66, 102, 79, 0.14);
  position: relative;
  min-height: calc(100vh - 64px);
  padding: 18px 28px 56px;
  color: var(--ink);
  background:
    radial-gradient(circle at 12% 0%, rgba(184, 146, 67, 0.18), transparent 22%),
    radial-gradient(circle at 100% 8%, rgba(66, 102, 79, 0.12), transparent 26%),
    linear-gradient(180deg, #fbf9f2 0%, #f4efe2 100%);
  scroll-snap-type: y proximity;
}

.time-space-trail,
.time-space-trail * {
  box-sizing: border-box;
}

.trail-hero,
.trail-stagebar,
.trail-shell {
  width: min(1400px, calc(100vw - 56px));
  margin: 0 auto;
}

.trail-nav {
  width: min(1400px, calc(100vw - 56px));
  margin: 0 auto 20px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.time-space-trail--compact {
  padding-top: 10px;
}

.time-space-trail--immersive {
  padding: 0;
  background:
    radial-gradient(circle at 20% 0%, rgba(52, 97, 81, 0.16), transparent 42%),
    radial-gradient(circle at 100% 0%, rgba(182, 140, 52, 0.08), transparent 28%),
    linear-gradient(180deg, #07100c 0%, #0b1511 48%, #0a130f 100%);
  color: #f4eddc;
}

.time-space-trail--immersive .trail-nav {
  margin-bottom: 10px;
}

.time-space-trail--immersive .trail-stagebar {
  margin-bottom: 10px;
  padding-top: 0;
}

.time-space-trail--immersive .scene-tab {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(121, 196, 167, 0.12);
  color: rgba(233, 241, 233, 0.68);
}

.time-space-trail--immersive .scene-tab--active {
  background: rgba(121, 196, 167, 0.16);
  color: #f4eddc;
  border-color: rgba(121, 196, 167, 0.24);
}

.time-space-trail--immersive .trail-stagebar__kicker {
  color: #dfbf72;
}

.time-space-trail--immersive .trail-stagebar__copy h1 {
  color: #f4eddc;
}

.time-space-trail--immersive .trail-stagebar__line {
  color: rgba(233, 241, 233, 0.68);
}

.time-space-trail--immersive .trail-stagebar__stat {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(121, 196, 167, 0.1);
}

.time-space-trail--immersive .trail-stagebar__stat em {
  color: rgba(233, 241, 233, 0.52);
}

.time-space-trail--immersive .trail-stagebar__stat strong {
  color: #f4eddc;
}

.trail-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(260px, 0.6fr);
  gap: 18px;
  margin-bottom: 20px;
  min-height: 0;
  scroll-snap-align: start;
}

.hero-copy,
.hero-board,
.filter-panel,
.artifact-section,
.guide-section {
  border: 1px solid rgba(184, 146, 67, 0.16);
  border-radius: 28px;
  background: var(--paper-soft);
  box-shadow: 0 20px 42px rgba(78, 62, 31, 0.08);
}

.hero-copy {
  padding: 28px 32px;
}

.trail-stagebar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 18px;
  align-items: end;
  margin-bottom: 14px;
  padding: 14px 0 10px;
}

.hero-kicker,
.panel-kicker,
.section-kicker,
.node-label {
  margin: 0 0 10px;
  color: var(--gold);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
}

.hero-copy h1,
.filter-panel h2,
.section-head h2,
.section-head h3,
.spotlight-copy h3,
.guide-context h3,
.guide-preview h3 {
  margin: 0;
  font-family: 'STZhongsong', 'Noto Serif SC', serif;
  line-height: 1.08;
}

.hero-copy h1 {
  max-width: 860px;
  font-size: clamp(38px, 3.4vw, 62px);
}

.hero-subtitle,
.filter-summary,
.spotlight-summary,
.spotlight-reason,
.graph-lead,
.guide-journey,
.artifact-summary,
.narrative-card p,
.message-bubble p,
.guide-preview__line {
  line-height: 1.8;
}

.hero-subtitle {
  max-width: 860px;
  margin: 18px 0 0;
  color: var(--ink-soft);
  font-size: 16px;
}

.hero-actions,
.panel-actions,
.spotlight-actions,
.section-actions,
.artifact-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.hero-actions {
  margin-top: 24px;
}

.hero-button,
.card-action,
.mini-action,
.meaning-clear,
.question-pill,
.guide-fold {
  border: none;
  cursor: pointer;
  transition: transform 0.24s ease, box-shadow 0.24s ease, background 0.24s ease, color 0.24s ease;
}

.hero-button,
.card-action {
  border-radius: 999px;
  padding: 14px 22px;
  font-size: 15px;
  font-weight: 700;
}

.hero-button--primary,
.card-action,
.narrative-button {
  background: linear-gradient(135deg, #4e765d, #29483a);
  color: #f7f2e4;
  box-shadow: 0 14px 28px rgba(41, 72, 58, 0.18);
}

.hero-button:not(.hero-button--primary),
.card-action--ghost,
.guide-fold {
  background: rgba(255, 255, 255, 0.82);
  color: var(--green);
  border: 1px solid rgba(66, 102, 79, 0.14);
}

.hero-button:disabled,
.card-action:disabled {
  opacity: 0.48;
  cursor: not-allowed;
}

.hero-board {
  padding: 22px 20px;
  display: grid;
  gap: 12px;
}

.board-card {
  border-radius: 20px;
  padding: 16px 18px;
  background: rgba(255, 255, 255, 0.78);
}

.board-card span {
  display: block;
  margin-bottom: 10px;
  color: var(--ink-soft);
  font-size: 14px;
}

.board-card strong {
  font-size: 40px;
  line-height: 1;
  font-family: 'STZhongsong', 'Noto Serif SC', serif;
}

.trail-shell {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0;
}

.trail-shell--immersive {
  width: 100%;
  max-width: none;
}

.trail-stagebar {
  width: min(1480px, calc(100vw - 48px));
}

.trail-stagebar__copy {
  min-width: 0;
}

.trail-stagebar__kicker {
  margin: 0 0 8px;
  color: var(--gold);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
}

.trail-stagebar__copy h1 {
  margin: 0;
  color: var(--ink);
  font-family: 'STZhongsong', 'Noto Serif SC', serif;
  font-size: clamp(22px, 2.1vw, 34px);
  line-height: 1.16;
}

.trail-stagebar__line {
  max-width: 920px;
  margin: 10px 0 0;
  color: var(--ink-soft);
  font-size: 15px;
  line-height: 1.75;
}

.trail-stagebar__stats {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.trail-stagebar__stat {
  min-width: 108px;
  padding: 12px 14px;
  border: 1px solid rgba(66, 102, 79, 0.1);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 10px 22px rgba(78, 62, 31, 0.06);
}

.trail-stagebar__stat em {
  display: block;
  margin-bottom: 8px;
  color: var(--ink-soft);
  font-style: normal;
  font-size: 12px;
}

.trail-stagebar__stat strong {
  color: var(--ink);
  font-family: 'STZhongsong', 'Noto Serif SC', serif;
  font-size: 26px;
  line-height: 1;
}

.scene-tab {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  align-items: center;
  padding: 14px 16px;
  border-radius: 22px;
  border: 1px solid rgba(66, 102, 79, 0.12);
  background: rgba(255, 255, 255, 0.64);
  color: var(--ink-soft);
}

.scene-tab--active {
  background: linear-gradient(135deg, rgba(66, 102, 79, 0.92), rgba(41, 72, 58, 0.94));
  color: #f8f3e6;
  box-shadow: 0 16px 28px rgba(41, 72, 58, 0.16);
}

.scene-tab--unlocked:not(.scene-tab--active) {
  border-color: rgba(184, 146, 67, 0.2);
  color: var(--ink);
}

.scene-index {
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgba(184, 146, 67, 0.14);
  color: var(--gold);
  font-weight: 800;
}

.scene-tab--active .scene-index {
  background: rgba(255, 248, 229, 0.16);
  color: #f4d48b;
}

.scene-copy {
  display: grid;
  gap: 2px;
  text-align: left;
}

.scene-copy strong {
  font-size: 15px;
}

.scene-copy small {
  font-size: 12px;
  color: inherit;
  opacity: 0.8;
}

.filter-panel {
  position: static;
  padding: 28px 32px;
  min-height: clamp(580px, calc(100vh - 240px), 720px);
  scroll-snap-align: start;
}

.panel-head,
.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.panel-head h2,
.section-head h2 {
  font-size: clamp(28px, 2.2vw, 38px);
}

.section-head h3 {
  font-size: 28px;
}

.panel-badge,
.section-badge,
.meta-chip,
.spotlight-site,
.artifact-badge,
.artifact-model {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.panel-badge,
.section-badge {
  min-height: 38px;
  padding: 0 14px;
  color: var(--ink-soft);
  background: rgba(255, 255, 255, 0.82);
}

.filter-group {
  margin-top: 22px;
}

.filter-group label {
  display: block;
  margin-bottom: 12px;
  color: var(--ink);
  font-size: 15px;
  font-weight: 700;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-pill {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  min-width: 144px;
  padding: 12px 14px;
  border: 1px solid rgba(66, 102, 79, 0.14);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.82);
  color: var(--green);
  text-align: left;
}

.filter-pill span {
  font-size: 14px;
  font-weight: 700;
}

.filter-pill small {
  color: var(--ink-soft);
  font-size: 12px;
}

.filter-pill.active {
  background: linear-gradient(135deg, #4e765d, #29483a);
  color: #f7f2e4;
  border-color: transparent;
}

.filter-pill.active small {
  color: rgba(247, 242, 228, 0.84);
}

.meaning-focus {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 20px;
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(184, 146, 67, 0.12);
  color: var(--green);
}

.meaning-clear,
.mini-action,
.question-pill,
.guide-fold {
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.82);
  color: var(--green);
  border: 1px solid rgba(66, 102, 79, 0.12);
}

.meaning-clear,
.mini-action,
.guide-fold {
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 700;
}

.filter-summary {
  margin: 20px 0 0;
  color: var(--ink-soft);
  font-size: 15px;
}

.panel-actions {
  margin-top: 22px;
}

.trail-main {
  display: grid;
  gap: 0;
}

.artifact-section,
.guide-section {
  padding: 28px;
  display: grid;
  gap: 18px;
}

.artifact-section {
  min-height: clamp(620px, calc(100vh - 240px), 780px);
  scroll-snap-align: start;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.84), rgba(251, 247, 238, 0.94)),
    radial-gradient(circle at 0% 0%, rgba(184, 146, 67, 0.08), transparent 22%);
}

.immersive-section {
  --stage-bg: #08110d;
  --panel-bg: rgba(16, 23, 19, 0.92);
  --panel-border: rgba(121, 196, 167, 0.15);
  --text-main: #f7f1e2;
  --text-muted: rgba(236, 244, 237, 0.8);
  --gold-soft: #f2d68c;
  display: grid;
  gap: 14px;
  min-height: clamp(660px, calc(100vh - 180px), 860px);
  padding: 24px;
  scroll-snap-align: start;
  border-radius: 28px;
  border: 1px solid rgba(121, 196, 167, 0.1);
  background:
    radial-gradient(circle at 100% 0%, rgba(182, 140, 52, 0.1), transparent 28%),
    linear-gradient(180deg, #07100c 0%, #0b1511 48%, #0a130f 100%);
  color: var(--text-main);
  box-shadow: 0 24px 56px rgba(0, 0, 0, 0.38);
}

.immersive-section .viewer-card,
.immersive-section .panel-card {
  border: 1px solid rgba(121, 196, 167, 0.12);
  border-radius: 28px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.025), rgba(255, 255, 255, 0.01)),
    rgba(16, 23, 19, 0.9);
  box-shadow: 0 20px 44px rgba(0, 0, 0, 0.26), inset 0 1px 0 rgba(255, 255, 255, 0.04);
  color: #f4eddc;
}

.immersive-section .panel-card--hero {
  background:
    radial-gradient(circle at top right, rgba(217, 177, 90, 0.1), transparent 34%),
    rgba(16, 23, 19, 0.92);
}

.immersive-section .meta-chip {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-muted);
}

.immersive-section .meta-chip--highlight {
  background: rgba(223, 191, 114, 0.14);
  color: var(--gold-soft);
}

.immersive-section .panel-label {
  color: var(--gold-soft);
}

.immersive-section .panel-summary {
  color: var(--text-muted);
}

.immersive-section .fact-grid div {
  background: rgba(255, 255, 255, 0.04);
}

.immersive-section .fact-grid dt {
  color: var(--text-muted);
}

.immersive-section .fact-grid dd {
  color: var(--text-main);
}

.immersive-section .section-tag {
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-muted);
}

.immersive-section .mini-action {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.1);
  color: var(--text-muted);
}

.immersive-section .mini-action:hover {
  background: rgba(255, 255, 255, 0.12);
}

.immersive-section .type-filter {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.08);
  color: var(--text-muted);
}

.immersive-section .type-filter.active {
  background: rgba(121, 196, 167, 0.22);
  color: #f4eddc;
}

.immersive-section .graph-lead {
  color: var(--text-muted);
}

.immersive-section .panel-card h2,
.immersive-section .panel-card .section-title {
  color: var(--text-main);
}

.immersive-section .insight-panel {
  scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
}

.immersive-section .insight-panel::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
}

.immersive-section .section-head {
  align-items: end;
}

.immersive-section .section-head h2 {
  font-size: clamp(24px, 2vw, 32px);
  line-height: 1.16;
  color: var(--text-main);
}

.immersive-section .section-kicker {
  color: var(--gold-soft);
}

.immersive-section .legend-item {
  color: var(--text-muted);
}

.immersive-section .narrative-card {
  background: rgba(255, 255, 255, 0.04);
}

.immersive-section .narrative-label {
  color: var(--gold-soft);
}

.immersive-section .narrative-card strong {
  color: var(--text-main);
}

.immersive-section .narrative-card p {
  color: var(--text-muted);
}

.immersive-section .linked-list span {
  color: var(--gold-soft);
}

.immersive-section .linked-list strong {
  color: var(--text-main);
}

.immersive-section .fact-grid dd {
  color: var(--text-main);
  font-weight: 600;
}

.immersive-section .fact-grid dt {
  color: var(--text-muted);
}

.immersive-section .graph-error {
  color: #b8705f;
}

.guide-section {
  min-height: clamp(620px, calc(100vh - 240px), 780px);
  scroll-snap-align: start;
  background:
    linear-gradient(180deg, rgba(250, 246, 238, 0.9), rgba(244, 240, 230, 0.94)),
    radial-gradient(circle at 100% 0%, rgba(184, 146, 67, 0.1), transparent 24%);
}

.stage-preview {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 20px;
  align-items: center;
  min-height: 44vh;
  padding: 26px 28px;
  border-radius: 24px;
  background:
    linear-gradient(135deg, rgba(18, 31, 24, 0.9), rgba(34, 52, 43, 0.92)),
    radial-gradient(circle at 20% 10%, rgba(212, 189, 127, 0.16), transparent 24%);
  color: #f3ead0;
  box-shadow: 0 18px 34px rgba(24, 32, 27, 0.18);
}

.stage-preview__copy {
  max-width: 720px;
}

.stage-preview__copy h3 {
  margin: 8px 0 12px;
  font-family: 'STZhongsong', 'Noto Serif SC', serif;
  font-size: clamp(30px, 2.8vw, 52px);
  line-height: 1.1;
  color: #fff8e5;
}

.stage-preview__copy p:last-child {
  margin: 0;
  color: rgba(255, 245, 217, 0.82);
  line-height: 1.85;
}

.stage-preview__actions {
  display: grid;
  gap: 12px;
  justify-items: start;
}

.scene-context-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-top: -2px;
}

.scene-context-row--immersive {
  margin-top: 0;
}

.stage-overview {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(280px, 0.9fr);
  gap: 14px;
}

.stage-overview__card {
  padding: 18px 20px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(66, 102, 79, 0.08);
}

.stage-overview__card span {
  display: block;
  margin-bottom: 10px;
  color: var(--gold);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.stage-overview__card strong {
  display: block;
  margin-bottom: 8px;
  font-family: 'STZhongsong', 'Noto Serif SC', serif;
  font-size: 28px;
  line-height: 1.16;
}

.stage-overview__card p {
  margin: 0;
  color: var(--ink-soft);
  line-height: 1.75;
}

.scene-context-row__label {
  color: var(--ink-soft);
  font-size: 13px;
  font-weight: 700;
}

.scene-context-chip {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.86);
  color: var(--green);
  font-size: 13px;
  font-weight: 700;
}

.scene-context-chip--dark {
  background: rgba(255, 255, 255, 0.16);
  color: #f5e8c1;
}

.featured-spotlight {
  display: grid;
  grid-template-columns: minmax(280px, 340px) minmax(0, 1fr);
  gap: 22px;
  margin-top: 20px;
  padding: 18px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.72);
}

.spotlight-visual {
  position: relative;
}

.spotlight-visual img,
.artifact-image-wrap img,
.artifact-fallback {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 22px;
}

.spotlight-site {
  position: absolute;
  left: 14px;
  top: 14px;
  min-height: 32px;
  padding: 0 12px;
  background: rgba(12, 27, 20, 0.74);
  color: #f8f3e7;
}

.spotlight-copy {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.spotlight-copy h3 {
  font-size: clamp(34px, 3.2vw, 52px);
}

.spotlight-era,
.artifact-site,
.artifact-time {
  color: var(--gold);
  font-size: 15px;
  font-weight: 700;
}

.spotlight-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 18px 0 22px;
}

.spotlight-tags span {
  padding: 9px 14px;
  border-radius: 999px;
  background: rgba(66, 102, 79, 0.08);
  color: var(--green);
  font-size: 13px;
  font-weight: 700;
}

.status-state {
  margin-top: 22px;
  padding: 18px 20px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.76);
  color: var(--ink-soft);
}

.status-state--error {
  background: rgba(167, 93, 78, 0.12);
  color: #7d4036;
}

.artifact-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.artifact-card {
  padding: 14px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid transparent;
  cursor: pointer;
}

.artifact-card--active {
  border-color: rgba(66, 102, 79, 0.24);
  box-shadow: inset 0 0 0 1px rgba(66, 102, 79, 0.08);
}

.artifact-image-wrap {
  position: relative;
  aspect-ratio: 1.12 / 1;
}

.artifact-badge,
.artifact-model {
  position: absolute;
  min-height: 30px;
  padding: 0 12px;
}

.artifact-badge {
  left: 12px;
  top: 12px;
  background: rgba(12, 27, 20, 0.72);
  color: #f6f0de;
}

.artifact-model {
  right: 12px;
  bottom: 12px;
  background: rgba(255, 255, 255, 0.92);
  color: var(--green);
}

.artifact-content {
  padding: 14px 8px 6px;
}

.artifact-content h3 {
  margin: 8px 0;
  font-family: 'STZhongsong', 'Noto Serif SC', serif;
  font-size: 30px;
  line-height: 1.12;
}

.immersive-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(360px, 0.85fr);
  gap: 18px;
  align-items: start;
}

.viewer-card {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  padding: 20px;
  border-radius: 28px;
}

.insight-panel {
  display: grid;
  gap: 18px;
  max-height: calc(100vh - 220px);
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(41, 72, 58, 0.18) transparent;
  padding-right: 8px;
}

.insight-panel::-webkit-scrollbar {
  width: 8px;
}

.insight-panel::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(41, 72, 58, 0.18);
}

.insight-panel::-webkit-scrollbar-track {
  background: transparent;
}

.panel-card {
  padding: 20px;
  border-radius: 28px;
}

.panel-card--hero {
  background:
    radial-gradient(circle at top right, rgba(217, 177, 90, 0.1), transparent 34%),
    var(--paper-soft);
}

.panel-label {
  margin: 0 0 6px;
  color: var(--gold);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
}

.panel-summary {
  margin: 12px 0 0;
  color: var(--ink-soft);
  line-height: 1.72;
}

.panel-card h2,
.panel-card .section-title {
  margin: 0;
  font-family: 'STZhongsong', 'Noto Serif SC', serif;
  font-size: 24px;
  line-height: 1.15;
}

.panel-card h3.section-title {
  font-size: 20px;
}

.fact-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin: 16px 0 0;
}

.fact-grid div {
  padding: 14px 16px;
  border-radius: 20px;
  background: rgba(205, 178, 130, 0.08);
}

.fact-grid dt {
  color: var(--ink-soft);
  font-size: 12px;
}

.fact-grid dd {
  margin: 6px 0 0;
  font-weight: 600;
  font-size: 14px;
}

.section-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.section-tag {
  padding: 7px 12px;
  border-radius: 999px;
  background: rgba(66, 102, 79, 0.08);
  color: var(--green);
  font-size: 12px;
}

.mini-action {
  padding: 7px 12px;
  border: 1px solid rgba(66, 102, 79, 0.12);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.82);
  color: var(--green);
  font-size: 12px;
  cursor: pointer;
}

.mini-action:hover {
  background: rgba(66, 102, 79, 0.06);
}

.viewer-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 8px;
}

.meta-chip {
  min-height: 34px;
  padding: 0 14px;
  background: rgba(255, 255, 255, 0.82);
  color: var(--green);
}

.meta-chip--highlight {
  background: rgba(184, 146, 67, 0.16);
  color: #7a5a17;
}

.viewer-shell {
  position: relative;
  min-height: 580px;
  height: 100%;
  border-radius: 24px;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 20%, rgba(98, 148, 126, 0.14), transparent 32%),
    linear-gradient(180deg, #08110d 0%, #0a140f 100%);
}

.viewer-shell canvas,
.artifact-fallback {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.viewer-caption {
  position: absolute;
  right: 20px;
  bottom: 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.viewer-caption span {
  padding: 10px 12px;
  border-radius: 999px;
  background: rgba(12, 22, 18, 0.62);
  color: rgba(240, 246, 239, 0.82);
  font-size: 12px;
}

.viewer-mask {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(8, 17, 13, 0.72);
  color: #f3eddc;
}

.mask-box {
  width: min(340px, calc(100% - 48px));
  text-align: center;
}

.progress-bar {
  height: 10px;
  margin: 14px 0 10px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
}

.progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #d8b86d, #79c4a7);
}

.viewer-mask--error {
  padding: 28px;
  text-align: center;
}

.error-title {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
}

.retry-button {
  margin-top: 14px;
  padding: 8px 20px;
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: #f7f2e4;
  cursor: pointer;
}

.retry-button:hover {
  background: rgba(255, 255, 255, 0.16);
}

.viewer-glow {
  position: absolute;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  filter: blur(24px);
  pointer-events: none;
}

.viewer-glow--left {
  left: -30px;
  bottom: -30px;
  background: radial-gradient(circle, rgba(223, 191, 114, 0.26), transparent 64%);
}

.viewer-glow--right {
  right: -40px;
  top: 8%;
  background: radial-gradient(circle, rgba(78, 135, 114, 0.22), transparent 64%);
}

.graph-lead {
  margin: 12px 0;
  color: var(--ink-soft);
  line-height: 1.6;
}

.type-filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
}

.type-filter {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border: 1px solid rgba(66, 102, 79, 0.12);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.82);
  color: var(--green);
  font-size: 13px;
  cursor: pointer;
}

.type-filter.active {
  background: linear-gradient(135deg, #4e765d, #29483a);
  color: #f7f2e4;
  border-color: transparent;
}

.type-filter strong {
  font-size: 13px;
}

.graph-stage {
  min-height: 340px;
  border-radius: 22px;
  background:
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(180deg, #0b1411 0%, #0f1915 100%);
  background-size: 40px 40px, 40px 40px, auto;
  overflow: hidden;
}

.graph-canvas {
  width: 100%;
  height: 340px;
}

.graph-error {
  margin: 0;
  padding: 14px 18px;
  color: #b8705f;
}

.graph-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid rgba(66, 102, 79, 0.06);
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--ink-soft);
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-dot--core { background: #79c4a7; }
.legend-dot--site { background: #d8b86d; }
.legend-dot--craft { background: rgba(205, 178, 130, 0.75); }
.legend-dot--artifact { background: rgba(255, 255, 255, 0.45); }

.narrative-grid {
  display: grid;
  gap: 14px;
  margin-top: 14px;
}

.narrative-card {
  padding: 16px 18px;
  border-radius: 20px;
  background: rgba(205, 178, 130, 0.06);
}

.narrative-label {
  margin: 0 0 6px;
  color: var(--gold);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
}

.narrative-card strong {
  display: block;
  font-size: 15px;
  margin-bottom: 6px;
}

.narrative-card p {
  margin: 0;
  color: var(--ink-soft);
  font-size: 13px;
  line-height: 1.6;
}

.linked-list {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  display: grid;
  gap: 8px;
}

.linked-list li {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 10px;
  align-items: baseline;
}

.linked-list span {
  color: var(--gold);
  font-size: 12px;
}

.linked-list strong {
  font-size: 14px;
  margin-bottom: 0;
}

.narrative-button {
  display: inline-flex;
  align-items: center;
  min-height: 42px;
  margin-top: 12px;
  padding: 0 18px;
  border: none;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--green), var(--green-deep));
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.narrative-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.narrative-button:hover:not(:disabled) {
  box-shadow: 0 8px 20px rgba(66, 102, 79, 0.22);
}

.guide-preview,
.guide-shell {
  margin-top: 18px;
}

.guide-preview {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 0.72fr);
  gap: 18px;
  padding: 24px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.76);
}

.guide-preview__copy,
.guide-context,
.guide-chat {
  padding: 22px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.76);
}

.guide-preview__line {
  margin-top: 18px;
  padding-left: 16px;
  border-left: 3px solid rgba(184, 146, 67, 0.42);
  color: var(--green);
}

.guide-preview__actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  justify-content: center;
}

.guide-shell {
  display: grid;
  grid-template-columns: minmax(280px, 0.78fr) minmax(0, 1.22fr);
  gap: 18px;
}

.guide-avatar {
  width: 104px;
  height: 104px;
  margin-bottom: 16px;
}

.guide-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.guide-facts {
  display: grid;
  gap: 12px;
  margin: 20px 0;
}

.guide-facts div {
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(66, 102, 79, 0.06);
}

.guide-facts dt {
  margin-bottom: 6px;
  color: var(--ink-soft);
  font-size: 13px;
}

.guide-facts dd {
  margin: 0;
  color: var(--ink);
  font-weight: 700;
}

.quick-questions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.question-pill {
  padding: 12px 14px;
  font-size: 13px;
  font-weight: 700;
}

.guide-chat {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: 16px;
  min-height: 620px;
}

.message-scroll {
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-right: 6px;
}

.message-row {
  display: flex;
  gap: 12px;
}

.message-row--user {
  justify-content: flex-end;
}

.message-avatar {
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  overflow: hidden;
  border-radius: 50%;
}

.message-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.message-stack {
  max-width: min(700px, 78%);
}

.message-bubble {
  padding: 16px 18px;
  border-radius: 18px;
  background: rgba(66, 102, 79, 0.08);
}

.message-row--user .message-bubble {
  background: linear-gradient(135deg, #4e765d, #29483a);
  color: #f7f2e4;
}

.message-stack time {
  display: block;
  margin-top: 6px;
  color: var(--ink-soft);
  font-size: 12px;
}

.thinking-bubble {
  display: inline-flex;
  gap: 8px;
}

.thinking-bubble span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(41, 72, 58, 0.4);
  animation: pulse 1s infinite ease-in-out;
}

.thinking-bubble span:nth-child(2) {
  animation-delay: 0.18s;
}

.thinking-bubble span:nth-child(3) {
  animation-delay: 0.36s;
}

.composer {
  display: grid;
  gap: 12px;
}

.composer textarea {
  width: 100%;
  min-height: 96px;
  padding: 16px 18px;
  border: 1px solid rgba(66, 102, 79, 0.14);
  border-radius: 18px;
  resize: vertical;
  font: inherit;
  color: var(--ink);
  background: rgba(255, 255, 255, 0.9);
}

.composer textarea:focus {
  outline: none;
  border-color: rgba(66, 102, 79, 0.34);
}

@keyframes pulse {
  0%,
  80%,
  100% {
    transform: scale(0.8);
    opacity: 0.42;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

@media (max-width: 1180px) {
  .trail-nav,
  .trail-hero,
  .trail-stagebar,
  .stage-preview,
  .stage-overview,
  .guide-preview,
  .guide-shell,
  .immersive-grid,
  .narrative-grid,
  .featured-spotlight {
    grid-template-columns: 1fr;
  }

  .artifact-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .trail-stagebar {
    grid-template-columns: 1fr;
    align-items: start;
  }

  .trail-stagebar__stats {
    justify-content: flex-start;
  }

  .viewer-card,
  .insight-panel .panel-card {
    height: auto;
  }

  .insight-panel {
    max-height: none;
    overflow: visible;
    padding-right: 0;
  }
}

@media (max-width: 760px) {
  .time-space-trail {
    padding: 12px 14px 44px;
  }

  .trail-nav,
  .trail-hero,
  .trail-stagebar,
  .trail-shell {
    width: 100%;
  }

  .trail-nav {
    grid-template-columns: 1fr 1fr;
  }

  .scene-context-row {
    align-items: flex-start;
  }

  .hero-copy,
  .hero-board,
  .filter-panel,
  .artifact-section,
  .immersive-section,
  .guide-section,
  .stage-preview,
  .viewer-card,
  .insight-panel .panel-card,
  .guide-preview__copy,
  .guide-context,
  .guide-chat {
    padding: 22px 18px;
    border-radius: 22px;
  }

  .hero-copy h1 {
    font-size: 42px;
  }

  .trail-stagebar {
    gap: 12px;
    padding: 6px 0 2px;
  }

  .trail-stagebar__copy h1 {
    font-size: 26px;
  }

  .trail-stagebar__line {
    margin-top: 8px;
    font-size: 14px;
  }

  .trail-stagebar__stats {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .trail-stagebar__stat {
    min-width: 0;
    padding: 10px 12px;
  }

  .trail-stagebar__stat strong {
    font-size: 22px;
  }

  .featured-spotlight {
    padding: 0;
    background: transparent;
  }

  .viewer-shell,
  .viewer-shell canvas,
  .artifact-fallback,
  .graph-canvas {
    min-height: 360px;
    height: 360px;
  }

  .insight-panel {
    padding-right: 6px;
  }

  .artifact-grid {
    grid-template-columns: 1fr;
  }
}
</style>
