<template>
  <section class="artifact-stage-page">
    <div class="page-noise" aria-hidden="true"></div>

    <header class="page-header showcase-enter" style="--delay: 0s">
      <div class="header-copy">
        <p class="eyebrow">展品现场</p>
        <h1>{{ artifactTitle }}</h1>
        <p class="intro">
          站到文物面前之后，它不再只是一个模型。右侧的关系网络会告诉你，它与谁相连、为什么重要、下一步该走向哪里。
        </p>
        <p class="stage-journey-line">{{ stageJourneyLine }}</p>
      </div>

      <div class="header-actions">
        <button class="ghost-button showcase-button-hover" type="button" @click="goBackToList">
          {{ competitionActionLabels.backGallery }}
        </button>
        <button class="ghost-button ghost-button--accent showcase-button-hover" type="button" @click="goToExploration">
          {{ competitionActionLabels.backExplore }}
        </button>
      </div>
    </header>

    <div class="stage-layout">
      <article class="viewer-card showcase-enter" style="--delay: 0.08s">
        <div class="viewer-meta">
          <span class="meta-chip">{{ artifactSite }}</span>
          <span class="meta-chip">{{ artifactEra }}</span>
          <span class="meta-chip meta-chip--highlight">{{ modelStateLabel }}</span>
        </div>

        <div class="viewer-shell" ref="wrapperRef">
          <div class="viewer-glow viewer-glow--left showcase-float" style="--delay: 0s" aria-hidden="true"></div>
          <div class="viewer-glow viewer-glow--right showcase-float" style="--delay: 0.8s" aria-hidden="true"></div>

          <img v-if="!hasModel && artifactImage" class="artifact-fallback-image" :src="artifactImage" :alt="artifactTitle" />
          <canvas v-show="hasModel" ref="canvasRef"></canvas>

          <div class="viewer-caption" aria-hidden="true">
            <span>拖拽旋转</span>
            <span>滚轮缩放</span>
            <span>图谱联动</span>
          </div>

          <div v-if="isLoading" class="loading-mask">
            <div class="loading-box">
              <p>正在装配数字展台</p>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: `${loadProgress}%` }"></div>
              </div>
              <span>{{ loadProgress }}%</span>
            </div>
          </div>

          <div v-if="errorMsg" class="error-mask">
            <p class="error-title">模型暂未完整就绪</p>
            <p class="error-text">{{ errorMsg }}</p>
            <button v-if="hasModel" class="retry-button showcase-button-hover" type="button" @click="reloadModel">
              {{ competitionActionLabels.reloadModel }}
            </button>
          </div>
        </div>
      </article>

      <aside class="insight-panel">
        <section class="panel-card panel-card--hero showcase-enter" style="--delay: 0.12s">
          <p class="panel-label">文物档案</p>
          <h2>{{ artifactTitle }}</h2>
          <p class="panel-summary">{{ artifactSummary }}</p>

          <dl class="fact-grid">
            <div>
              <dt>唯一主键</dt>
              <dd>{{ artifactId }}</dd>
            </div>
            <div>
              <dt>出土地</dt>
              <dd>{{ artifactSite }}</dd>
            </div>
            <div>
              <dt>年代</dt>
              <dd>{{ artifactYear }}</dd>
            </div>
            <div>
              <dt>类别</dt>
              <dd>{{ artifactCategory }}</dd>
            </div>
          </dl>
        </section>

        <section class="panel-card showcase-enter" style="--delay: 0.18s">
          <div class="section-head">
            <div>
              <p class="panel-label">关系网络</p>
              <h3 class="section-title">图谱探索器</h3>
            </div>
            <div class="section-actions">
              <span class="section-tag">{{ graphLoading ? '图谱刷新中' : '关系已联动' }}</span>
              <button class="mini-action showcase-button-hover" type="button" @click="focusCenterNode">
                回到中心
              </button>
              <button class="mini-action showcase-button-hover" type="button" @click="resetGraphViewport">
                重置视图
              </button>
            </div>
          </div>

          <p class="graph-lead">{{ activeNarrative }}</p>

          <div class="type-filter-row">
            <button
              v-for="item in graphTypeFilters"
              :key="item.type"
              class="type-filter showcase-button-hover"
              :class="{ active: activeTypeFilters.includes(item.type) }"
              type="button"
              @click="toggleTypeFilter(item.type)"
            >
              <span>{{ item.label }}</span>
              <strong>{{ item.count }}</strong>
            </button>
          </div>

          <div class="graph-stage" aria-label="知识关系探索图谱">
            <div ref="graphRef" class="graph-canvas"></div>
            <p v-if="graphErrorMsg" class="graph-error">{{ graphErrorMsg }}</p>
          </div>

          <div class="graph-legend">
            <span class="legend-item"><i class="legend-dot legend-dot--core"></i>中心文物</span>
            <span class="legend-item"><i class="legend-dot legend-dot--site"></i>时空坐标</span>
            <span class="legend-item"><i class="legend-dot legend-dot--craft"></i>工艺与寓意</span>
            <span class="legend-item"><i class="legend-dot legend-dot--artifact"></i>相关文物</span>
          </div>
        </section>

        <section class="panel-card showcase-enter" style="--delay: 0.24s">
          <div class="section-head">
            <div>
              <p class="panel-label">当前节点</p>
              <h3 class="section-title">{{ selectedNodeTitle }}</h3>
            </div>
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
              <p class="narrative-label">下一步可去哪里</p>
              <strong>{{ selectedNodeActionTitle }}</strong>
              <p>{{ selectedNodeActionHint }}</p>
              <button
                class="narrative-button showcase-button-hover"
                type="button"
                :disabled="!selectedGraphNode"
                @click="jumpByNode(selectedGraphNode)"
              >
                {{ selectedNodeActionButton }}
              </button>
            </article>
          </div>
        </section>

        <section class="panel-card showcase-enter" style="--delay: 0.3s">
          <div class="section-head">
            <p class="panel-label">工艺与寓意</p>
            <span class="section-tag">展品线索</span>
          </div>

          <div class="chip-group">
            <span v-for="craft in craftList" :key="craft" class="info-chip">
              {{ craft }}
            </span>
          </div>

          <div class="meaning-list">
            <p v-for="meaning in symbolicMeanings" :key="meaning">
              {{ meaning }}
            </p>
          </div>
        </section>

        <section class="panel-card showcase-enter" style="--delay: 0.36s">
          <div class="section-head">
            <p class="panel-label">策展讲解</p>
            <span class="section-tag">文物叙事</span>
          </div>
          <p class="panel-description">{{ artifactDescription }}</p>
        </section>

        <section class="action-panel showcase-enter" style="--delay: 0.42s">
          <button class="action-button action-button--primary showcase-button-hover" type="button" @click="goToAiChat">
            {{ competitionActionLabels.enterAi }}
          </button>
          <button class="action-button showcase-button-hover" type="button" @click="goBackToList">
            {{ competitionActionLabels.backGallery }}
          </button>
        </section>
      </aside>
    </div>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Graph as G6Graph } from '@antv/g6'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment'
import { formatYearRange } from '@/data/competitionArtifacts'
import { getArtifactGraph, getArtifactGraphNeighbors, getSpacetimeArtifactDetail } from '@/api/SpacetimeApi'
import { competitionActionLabels, getModelStatusLabel } from '@/data/competitionUi'
import { getRecentArtifactTrail, pushCompetitionTrail } from '@/utils/competitionTrail'

const TYPE_LABELS = {
  artifact: '文物节点',
  site: '遗址节点',
  era: '时代节点',
  craft: '工艺节点',
  meaning: '寓意节点'
}

const TYPE_COLORS = {
  artifact: {
    fill: '#d2ac54',
    stroke: '#f3dfb4',
    label: '#142117'
  },
  site: {
    fill: '#2f5c4f',
    stroke: '#8ed8be',
    label: '#eff9f3'
  },
  era: {
    fill: '#395f74',
    stroke: '#8eb7d8',
    label: '#eff5fa'
  },
  craft: {
    fill: '#213329',
    stroke: '#78bda2',
    label: '#ecf7f1'
  },
  meaning: {
    fill: '#4e4432',
    stroke: '#d4bd7f',
    label: '#f8f2df'
  }
}

const route = useRoute()
const router = useRouter()

const wrapperRef = ref(null)
const canvasRef = ref(null)
const graphRef = ref(null)

const artifact = ref(null)
const glbUrl = ref('')
const isLoading = ref(true)
const loadProgress = ref(0)
const errorMsg = ref('')

const graphPayload = ref({
  centerNodeId: '',
  narrative: '',
  availableTypes: [],
  stats: {
    nodeCount: 0,
    edgeCount: 0,
    expandableCount: 0
  },
  nodes: [],
  edges: []
})
const graphLoading = ref(false)
const graphErrorMsg = ref('')
const selectedNodeId = ref('')
const activeTypeFilters = ref([])
const expandedNodeIds = ref(new Set())

let scene = null
let camera = null
let renderer = null
let controls = null
let glbModel = null
let frameId = 0
let graphInstance = null
let resizeObserver = null
let graphClickTimer = null
let environmentTexture = null
let pmremGenerator = null

const hasModel = computed(() => !!glbUrl.value)
const artifactTitle = computed(() => artifact.value?.displayTitle || route.query.title || '三星堆核心文物')
const artifactSummary = computed(() => artifact.value?.summary || '当前页面用于承接 3D 模型展示与图谱讲解。')
const artifactDescription = computed(() => artifact.value?.description || '这件文物的出土背景、工艺线索与文化寓意会在这一页被同时串联起来。')
const artifactSite = computed(() => artifact.value?.siteLabel || artifact.value?.siteNameZh || route.query.siteCode || '待补充')
const artifactEra = computed(() => artifact.value?.eraLabel || artifact.value?.eraNameZh || route.query.eraCode || '待补充')
const artifactCategory = computed(() => artifact.value?.category || '文物')
const artifactId = computed(() => artifact.value?.entityId || route.query.entityId || '未绑定')
const artifactImage = computed(() => artifact.value?.cardImage || artifact.value?.coverImage || '')
const artifactYear = computed(() => artifact.value?.yearLabel || formatYearRange(artifact.value?.timeStartYear, artifact.value?.timeEndYear) || '待补充')
const modelStateLabel = computed(() => getModelStatusLabel(hasModel.value))
const previousArtifactOnTrail = computed(() => {
  return getRecentArtifactTrail(3).find((item) => item.entityId && item.entityId !== artifactId.value) || null
})
const isBronzePatinaArtifact = computed(() => ['HI-2025-003', 'HI-2025-005'].includes(artifactId.value))
const isGoldArtifact = computed(() => {
  const title = artifact.value?.displayTitle || artifact.value?.title || ''
  const category = artifact.value?.category || ''
  return title.includes('金') || category.includes('金')
})

const craftList = computed(() => artifact.value?.craftNamesZh?.length ? artifact.value.craftNamesZh : ['工艺信息待补充'])
const symbolicMeanings = computed(() => artifact.value?.symbolicMeaningZh?.length ? artifact.value.symbolicMeaningZh : ['寓意信息待补充'])

const selectedGraphNode = computed(() => {
  const preferredId = selectedNodeId.value || graphPayload.value.centerNodeId
  return graphPayload.value.nodes.find((node) => node.id === preferredId) || graphPayload.value.nodes[0] || null
})

const selectedNodeTitle = computed(() => selectedGraphNode.value?.label || artifactTitle.value)
const selectedNodeTypeLabel = computed(() => TYPE_LABELS[selectedGraphNode.value?.type] || '关系节点')
const selectedNodeSummary = computed(() => {
  if (selectedGraphNode.value?.summary) {
    return selectedGraphNode.value.summary
  }
  return '当前节点可继续展开更多关联，帮助你把文物放回三星堆的关系世界中理解。'
})
const activeNarrative = computed(() => {
  if (!selectedGraphNode.value || selectedGraphNode.value.id === graphPayload.value.centerNodeId) {
    return graphPayload.value.narrative || '这件文物并非孤立展出，它与遗址、时代、工艺和寓意共同构成一条可读懂的古蜀线索。'
  }
  return `${selectedGraphNode.value.label} 正在成为新的观察切口。顺着它展开，你会看到这件文物背后的时空与语义网络。`
})

const stageJourneyLine = computed(() => {
  const sourceLine = previousArtifactOnTrail.value?.title
    ? `你刚从 ${previousArtifactOnTrail.value.title} 的线索继续走来，`
    : '你已经离开展厅结果页，'
  return `${sourceLine}现在正站在 ${artifactSite.value} · ${artifactYear.value} 的 ${artifactTitle.value} 面前。先转动模型，再从右侧关系网络追踪它与遗址、工艺和相关文物的联系。`
})

const selectedNodeRelations = computed(() => {
  if (!selectedGraphNode.value) {
    return []
  }
  const currentId = selectedGraphNode.value.id
  const nodesById = new Map(graphPayload.value.nodes.map((node) => [node.id, node]))
  return graphPayload.value.edges
    .filter((edge) => edge.source === currentId || edge.target === currentId)
    .map((edge) => {
      const targetId = edge.source === currentId ? edge.target : edge.source
      const targetNode = nodesById.get(targetId)
      return {
        targetId,
        relation: edge.label,
        label: targetNode?.label || targetId,
        type: targetNode?.type || '',
        routeType: targetNode?.routeType || '',
        routeTarget: targetNode?.routeTarget || ''
      }
    })
    .slice(0, 6)
})

const selectedNodeActionTitle = computed(() => {
  const node = selectedGraphNode.value
  if (!node) return '继续探索'
  if (node.type === 'artifact' && node.entityId === artifactId.value) return '继续听玄喵讲解这件文物'
  if (node.type === 'artifact') return '跳到相关文物现场'
  if (node.type === 'site') return '回到该遗址视角'
  if (node.type === 'era') return '切换到这一时代'
  if (node.type === 'craft') return '查看采用这项工艺的文物'
  if (node.type === 'meaning') return '追踪这一文化寓意'
  return '继续探索这条线索'
})

const selectedNodeActionHint = computed(() => {
  const node = selectedGraphNode.value
  if (!node) return '从当前节点继续向下一站漫游。'
  if (node.type === 'artifact' && node.entityId === artifactId.value) return '玄喵会接着当前图谱上下文，把这件文物讲得更完整。'
  if (node.type === 'artifact') return '双击或按钮都可以把视角切换到另一件相关文物。'
  if (node.type === 'site') return '系统会把你带回该遗址对应的时空结果页。'
  if (node.type === 'era') return '系统会把你带到同一历史阶段的文物切面。'
  if (node.type === 'craft') return '系统会打开采用同类工艺的文物结果页。'
  if (node.type === 'meaning') return '系统会切到围绕这一寓意的展厅结果页。'
  return '继续追踪这条关系线索。'
})

const selectedNodeActionButton = computed(() => {
  const node = selectedGraphNode.value
  if (!node) return '继续探索'
  if (node.type === 'artifact' && node.entityId === artifactId.value) return competitionActionLabels.enterAi
  if (node.type === 'artifact') return '前往这件文物'
  if (node.type === 'site') return '回到该遗址'
  if (node.type === 'era') return '切换时代视角'
  if (node.type === 'craft') return '查看工艺结果'
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
  await loadArtifactContext()
  await nextTick()
  initThreeStage()
  await loadGraph()
  mountResizeObserver()
})

onBeforeUnmount(() => {
  if (graphClickTimer) {
    window.clearTimeout(graphClickTimer)
  }
  unmountResizeObserver()
  destroyThreeStage()
  destroyGraph()
})

watch(
  () => route.query,
  async () => {
    destroyThreeStage()
    destroyGraph()
    expandedNodeIds.value = new Set()
    await loadArtifactContext()
    await nextTick()
    initThreeStage()
    await loadGraph()
    mountResizeObserver()
  }
)

watch(activeTypeFilters, async () => {
  normalizeSelectedNode()
  await renderGraph()
})

async function loadArtifactContext() {
  const routeEntityId = route.query.entityId
  artifact.value = null
  errorMsg.value = ''

  if (!routeEntityId) {
    glbUrl.value = route.query.glbUrl || ''
    errorMsg.value = '???????????????????'
    return
  }

  try {
    const currentArtifact = await getSpacetimeArtifactDetail({ entityId: routeEntityId }, { showDefaultMsg: false })
    artifact.value = currentArtifact
    glbUrl.value = route.query.glbUrl || currentArtifact?.resolvedGlbUrl || ''
  } catch (error) {
    console.error('????????:', error)
    artifact.value = null
    glbUrl.value = route.query.glbUrl || ''
  }

  loadProgress.value = glbUrl.value ? 8 : 100

  if (!glbUrl.value && !artifactImage.value) {
    errorMsg.value = '?????????????????????'
  }

  pushCompetitionTrail({
    entityId: artifactId.value,
    title: artifactTitle.value,
    siteLabel: artifactSite.value,
    eraLabel: artifactEra.value,
    stage: '3d',
    sourceStage: '3d',
    reason: route.query.entryReason || activeNarrative.value
  })
}

function initThreeStage() {
  if (!wrapperRef.value || !canvasRef.value || !hasModel.value) {
    isLoading.value = false
    loadProgress.value = 100
    return
  }

  isLoading.value = true
  loadProgress.value = 12

  scene = new THREE.Scene()
  scene.background = new THREE.Color('#08110d')
  scene.fog = new THREE.Fog('#08110d', 8, 28)

  const { clientWidth, clientHeight } = wrapperRef.value
  camera = new THREE.PerspectiveCamera(38, clientWidth / clientHeight, 0.1, 120)
  camera.position.set(0, 1.5, 5.6)

  renderer = new THREE.WebGLRenderer({
    canvas: canvasRef.value,
    antialias: true,
    alpha: true
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(clientWidth, clientHeight)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = isGoldArtifact.value ? 1.22 : isBronzePatinaArtifact.value ? 1.04 : 1.16

  pmremGenerator = new THREE.PMREMGenerator(renderer)
  environmentTexture = pmremGenerator.fromScene(new RoomEnvironment(renderer), 0.04).texture
  scene.environment = environmentTexture

  const ambientLight = new THREE.AmbientLight(
    isBronzePatinaArtifact.value ? '#d4d8cb' : '#f5f0da',
    isGoldArtifact.value ? 1.42 : isBronzePatinaArtifact.value ? 1.02 : 1.28
  )
  const hemiLight = new THREE.HemisphereLight(
    isBronzePatinaArtifact.value ? '#ccd7c8' : '#fff3cf',
    '#0f1814',
    isGoldArtifact.value ? 1.08 : isBronzePatinaArtifact.value ? 0.82 : 0.92
  )
  const spotLight = new THREE.SpotLight(
    isBronzePatinaArtifact.value ? '#d5bf88' : '#ffe4a8',
    isGoldArtifact.value ? 3.1 : isBronzePatinaArtifact.value ? 2.38 : 2.75,
    34,
    Math.PI / 6,
    0.28,
    1
  )
  spotLight.position.set(6, 10, 8)
  const fillLight = new THREE.DirectionalLight(
    isBronzePatinaArtifact.value ? '#9aaea1' : '#ffd98f',
    isGoldArtifact.value ? 1.34 : isBronzePatinaArtifact.value ? 1.02 : 1.15
  )
  fillLight.position.set(-4, 5, 6)
  const rimLight = new THREE.PointLight(
    isBronzePatinaArtifact.value ? '#4f8973' : '#79c4a7',
    isGoldArtifact.value ? 1.46 : isBronzePatinaArtifact.value ? 1.72 : 1.5,
    24
  )
  rimLight.position.set(-6, 2, -5)

  scene.add(ambientLight, hemiLight, spotLight, fillLight, rimLight)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.06
  controls.minDistance = 2.6
  controls.maxDistance = 9.8
  controls.maxPolarAngle = Math.PI * 0.68

  if (!isGoldArtifact.value) {
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(6, 96),
      new THREE.MeshBasicMaterial({
        color: '#0f1914',
        transparent: true,
        opacity: 0.74
      })
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -1.35
    scene.add(floor)
  }

  const loader = new GLTFLoader()
  loader.load(
    glbUrl.value,
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
        if (!child.isMesh || !child.material) {
          return
        }

        const materialList = Array.isArray(child.material) ? child.material : [child.material]
        materialList.forEach((material) => {
          material.needsUpdate = true

          if ('envMapIntensity' in material) {
            material.envMapIntensity = isGoldArtifact.value ? 1.36 : isBronzePatinaArtifact.value ? 1.04 : 1.2
          }

          if (isGoldArtifact.value && 'metalness' in material) {
            material.metalness = Math.max(Number(material.metalness || 0), 0.88)
          }

          if (isGoldArtifact.value && 'roughness' in material) {
            material.roughness = Math.min(Number(material.roughness ?? 1), 0.46)
          }

          if (isBronzePatinaArtifact.value && 'metalness' in material) {
            material.metalness = Math.max(Number(material.metalness || 0), 0.72)
          }

          if (isBronzePatinaArtifact.value && 'roughness' in material) {
            const currentRoughness = Number(material.roughness ?? 0.7)
            material.roughness = Math.min(Math.max(currentRoughness, 0.58), 0.82)
          }

          if (isBronzePatinaArtifact.value && material.color?.isColor) {
            material.color.lerp(new THREE.Color('#6c816d'), 0.18)
            material.color.multiplyScalar(0.9)
          }
        })
      })

      scene.add(glbModel)
      isLoading.value = false
      loadProgress.value = 100
    },
    (event) => {
      if (event.total) {
        loadProgress.value = Math.min(98, Math.floor((event.loaded / event.total) * 100))
      }
    },
    (error) => {
      console.error(error)
      isLoading.value = false
      loadProgress.value = 100
      errorMsg.value = '模型资源暂时无法读取，先通过图谱和文物档案继续浏览。'
    }
  )

  animateThreeStage()
}

function animateThreeStage() {
  frameId = requestAnimationFrame(animateThreeStage)

  if (glbModel) {
    glbModel.rotation.y += 0.0038
  }

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
  renderer?.dispose()
  scene = null
  camera = null
  controls = null
  renderer = null
  glbModel = null
  environmentTexture = null
  pmremGenerator = null
}

async function loadGraph() {
  if (!artifactId.value) {
    return
  }

  graphLoading.value = true
  graphErrorMsg.value = ''

  try {
    const response = await getArtifactGraph({ entityId: artifactId.value }, { showDefaultMsg: false })
    graphPayload.value = normalizeGraphPayload(response)
    selectedNodeId.value = graphPayload.value.centerNodeId
    activeTypeFilters.value = [...graphPayload.value.availableTypes]
    expandedNodeIds.value = new Set()
    await nextTick()
    await renderGraph()
  } catch (error) {
    console.error(error)
    graphErrorMsg.value = '图谱暂时无法完整展开，页面会继续保留文物档案和讲解信息。'
  } finally {
    graphLoading.value = false
  }
}

async function expandNode(node) {
  if (!node?.expandable || expandedNodeIds.value.has(node.id) || !artifactId.value) {
    return
  }

  graphLoading.value = true
  try {
    const response = await getArtifactGraphNeighbors(
      {
        entityId: artifactId.value,
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
    console.error(error)
    graphErrorMsg.value = '该节点暂时无法继续展开，你仍然可以使用当前图谱继续浏览。'
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
  if (!centerId) {
    return positions
  }

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
  if (!nodes.length) {
    return
  }

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
  if (!graphRef.value) {
    return
  }

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
          active: {
            lineWidth: 4,
            haloLineWidth: 22,
            haloStrokeOpacity: 0.45
          },
          neighbor: {
            lineWidth: 3,
            haloLineWidth: 16,
            haloStrokeOpacity: 0.28
          },
          dim: {
            opacity: 0.16
          }
        }
      },
      edge: {
        type: 'line',
        state: {
          active: {
            lineWidth: 2.8,
            opacity: 1
          },
          dim: {
            opacity: 0.08
          }
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
  if (!graphInstance) {
    return
  }

  graphInstance.on('node:click', async (event) => {
    const nodeId = event?.target?.id
    if (!nodeId) {
      return
    }

    if (graphClickTimer) {
      window.clearTimeout(graphClickTimer)
    }

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
    if (!nodeId) {
      return
    }
    if (graphClickTimer) {
      window.clearTimeout(graphClickTimer)
      graphClickTimer = null
    }

    const node = graphPayload.value.nodes.find((item) => item.id === nodeId)
    if (node) {
      jumpByNode(node)
    }
  })

  graphInstance.on('node:mouseenter', async (event) => {
    const nodeId = event?.target?.id
    if (!nodeId || nodeId === selectedNodeId.value) {
      return
    }
    await applyFocusState(nodeId, false)
  })

  graphInstance.on('node:mouseleave', async () => {
    await applyFocusState(selectedNodeId.value || graphPayload.value.centerNodeId, false)
  })
}

async function applyFocusState(nodeId, animate = true) {
  if (!graphInstance || !nodeId) {
    return
  }

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
    await graphInstance.focusElement(nodeId, {
      duration: 400,
      easing: 'ease-in-out'
    })
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
}

async function focusCenterNode() {
  selectedNodeId.value = graphPayload.value.centerNodeId
  await applyFocusState(selectedNodeId.value)
}

async function resetGraphViewport() {
  if (!graphInstance) {
    return
  }
  await graphInstance.fitView()
  await applyFocusState(selectedNodeId.value || graphPayload.value.centerNodeId, false)
}

function jumpByNode(node) {
  if (!node) {
    return
  }

  if (node.type === 'artifact') {
    if (node.entityId === artifactId.value) {
      goToAiChat()
      return
    }

    router.push({
      path: '/3d',
      query: {
        entityId: node.routeTarget || node.entityId,
        title: node.label,
        entryReason: `\u4f60\u987a\u7740 ${selectedNodeTitle.value} \u8fd9\u6761\u5173\u7cfb\u7ebf\u7d22\uff0c\u7ee7\u7eed\u8d70\u5411\u53e6\u4e00\u4ef6\u76f8\u5173\u6587\u7269\u3002`
      }
    })
    return
  }

  if (node.type === 'site') {
    router.push({
      path: '/tanmi',
      query: {
        siteCode: node.routeTarget || node.label
      }
    })
    return
  }

  if (node.type === 'era') {
    router.push({
      path: '/tanmi',
      query: {
        eraCode: node.routeTarget || node.label
      }
    })
    return
  }

  if (node.type === 'craft') {
    router.push({
      path: '/3dlist',
      query: {
        craftCode: node.routeTarget || node.label
      }
    })
    return
  }

  if (node.type === 'meaning') {
    router.push({
      path: '/3dlist',
      query: {
        meaning: node.routeTarget || node.label
      }
    })
  }
}

function mountResizeObserver() {
  unmountResizeObserver()

  if (!wrapperRef.value && !graphRef.value) {
    return
  }

  resizeObserver = new ResizeObserver(async () => {
    resizeThreeStage()
    if (graphInstance && graphRef.value) {
      graphInstance.setSize(graphRef.value.clientWidth || 320, graphRef.value.clientHeight || 420)
      await graphInstance.fitView()
    }
  })

  if (wrapperRef.value) {
    resizeObserver.observe(wrapperRef.value)
  }
  if (graphRef.value) {
    resizeObserver.observe(graphRef.value)
  }
}

function unmountResizeObserver() {
  resizeObserver?.disconnect()
  resizeObserver = null
}

function resizeThreeStage() {
  if (!wrapperRef.value || !camera || !renderer) {
    return
  }

  const width = wrapperRef.value.clientWidth
  const height = wrapperRef.value.clientHeight
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

function destroyGraph() {
  graphInstance?.destroy()
  graphInstance = null
}

function reloadModel() {
  destroyThreeStage()
  errorMsg.value = ''
  initThreeStage()
}

function goBackToList() {
  router.push({
    path: '/3dlist',
    query: {
      siteCode: artifact.value?.siteCode || '',
      eraCode: artifact.value?.eraCode || ''
    }
  })
}

function goToExploration() {
  router.push({
    path: '/tanmi',
    query: {
      siteCode: artifact.value?.siteCode || '',
      eraCode: artifact.value?.eraCode || ''
    }
  })
}

function goToAiChat() {
  router.push({
    path: '/ai-chat',
    query: {
      entityId: artifactId.value,
      title: artifactTitle.value,
      siteCode: artifact.value?.siteCode || '',
      eraCode: artifact.value?.eraCode || '',
      entryReason: route.query.entryReason || activeNarrative.value
    }
  })
}
</script>

<style scoped>
:global(:root) {
  --stage-bg: #08110d;
  --panel-bg: rgba(16, 23, 19, 0.9);
  --panel-border: rgba(121, 196, 167, 0.15);
  --text-main: #f4eddc;
  --text-muted: rgba(233, 241, 233, 0.68);
  --gold-soft: #dfbf72;
}

.artifact-stage-page {
  position: relative;
  padding: 28px 24px 40px;
  background:
    radial-gradient(circle at 20% 0%, rgba(52, 97, 81, 0.18), transparent 42%),
    radial-gradient(circle at 100% 0%, rgba(182, 140, 52, 0.1), transparent 28%),
    linear-gradient(180deg, #07100c 0%, #0b1511 48%, #0a130f 100%);
  color: var(--text-main);
  overflow: hidden;
}

.page-noise {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
  background-size: 32px 32px;
  opacity: 0.22;
  pointer-events: none;
}

.page-header,
.stage-layout {
  position: relative;
  z-index: 1;
}

.page-header {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: flex-start;
  margin-bottom: 22px;
}

.header-copy {
  max-width: 780px;
}

.eyebrow,
.panel-label,
.section-kicker,
.board-label,
.narrative-label {
  margin: 0 0 8px;
  color: var(--gold-soft);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.header-copy h1,
.panel-card--hero h2 {
  margin: 0;
  font-family: 'STZhongsong', 'Noto Serif SC', serif;
  font-size: clamp(32px, 4vw, 54px);
  line-height: 1.04;
}

.intro,
.panel-summary,
.panel-description,
.graph-lead,
.meaning-list p,
.narrative-card p {
  line-height: 1.8;
}

.intro {
  max-width: 760px;
  margin: 14px 0 0;
  color: var(--text-muted);
  font-size: 16px;
}

.stage-journey-line {
  max-width: 760px;
  margin: 14px 0 0;
  color: #dce8df;
  font-size: 14px;
  line-height: 1.82;
}

.header-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 12px;
}

.ghost-button,
.mini-action,
.narrative-button,
.action-button,
.retry-button {
  border: none;
  cursor: pointer;
  transition:
    transform 0.28s ease,
    box-shadow 0.28s ease,
    background 0.28s ease,
    color 0.28s ease;
}

.ghost-button {
  padding: 12px 18px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-main);
}

.ghost-button--accent {
  background: linear-gradient(135deg, rgba(223, 191, 114, 0.18), rgba(121, 196, 167, 0.22));
}

.stage-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(360px, 0.85fr);
  gap: 18px;
  align-items: start;
}

.viewer-card,
.panel-card,
.action-panel {
  border-radius: 28px;
  border: 1px solid var(--panel-border);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.012)),
    var(--panel-bg);
  box-shadow:
    0 24px 48px rgba(0, 0, 0, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.viewer-card {
  padding: 20px;
}

.viewer-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}

.meta-chip,
.info-chip,
.section-tag,
.mini-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
}

.meta-chip {
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-muted);
  font-size: 13px;
}

.meta-chip--highlight {
  background: rgba(223, 191, 114, 0.14);
  color: #f7de9f;
}

.viewer-shell {
  position: relative;
  min-height: 760px;
  border-radius: 24px;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 30%, rgba(121, 196, 167, 0.18), transparent 28%),
    radial-gradient(circle at 70% 18%, rgba(223, 191, 114, 0.16), transparent 18%),
    linear-gradient(180deg, #0c1511 0%, #101b15 100%);
}

.viewer-shell canvas,
.artifact-fallback-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.viewer-glow {
  position: absolute;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  filter: blur(24px);
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

.viewer-caption {
  position: absolute;
  right: 18px;
  bottom: 18px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.viewer-caption span {
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(12, 15, 13, 0.72);
  color: rgba(242, 234, 217, 0.78);
  font-size: 12px;
  letter-spacing: 0.04em;
}

.loading-mask,
.error-mask {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  text-align: center;
  padding: 24px;
}

.loading-mask {
  background: linear-gradient(180deg, rgba(10, 12, 11, 0.28), rgba(10, 12, 11, 0.78));
}

.error-mask {
  background: linear-gradient(180deg, rgba(8, 10, 8, 0.18), rgba(8, 10, 8, 0.84));
}

.loading-box,
.error-title,
.error-text {
  max-width: 360px;
}

.loading-box p,
.error-title {
  margin: 0 0 14px;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.progress-bar {
  width: min(300px, 70vw);
  height: 7px;
  margin: 0 auto 14px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
}

.progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #7dcab0 0%, #d9b15a 100%);
}

.error-title {
  color: #ffe0ab;
}

.error-text {
  margin: 0 0 18px;
  color: #d4d9cc;
}

.retry-button {
  padding: 12px 18px;
  border-radius: 999px;
  background: rgba(217, 177, 90, 0.16);
  color: var(--gold-soft);
}

.insight-panel {
  display: grid;
  gap: 16px;
  max-height: calc(100vh - 210px);
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.08) transparent;
  padding-right: 6px;
}

.panel-card {
  padding: 18px;
}

.panel-card--hero {
  background:
    radial-gradient(circle at top right, rgba(217, 177, 90, 0.12), transparent 34%),
    var(--panel-bg);
}

.panel-summary {
  margin: 14px 0 0;
  color: var(--text-muted);
}

.fact-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin: 18px 0 0;
}

.fact-grid div {
  padding: 14px 16px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.04);
}

.fact-grid dt {
  margin-bottom: 8px;
  color: var(--text-muted);
  font-size: 12px;
}

.fact-grid dd {
  margin: 0;
  color: var(--text-main);
  font-size: 14px;
  line-height: 1.65;
}

.section-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.section-title {
  margin: 0;
  font-size: 22px;
  font-family: 'STZhongsong', 'Noto Serif SC', serif;
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.section-tag,
.mini-action {
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-muted);
  font-size: 12px;
}

.mini-action {
  background: rgba(121, 196, 167, 0.08);
}

.graph-lead {
  margin: 14px 0 0;
  color: #d4d9cc;
}

.type-filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

.type-filter {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.03);
  color: var(--text-muted);
}

.type-filter strong {
  color: var(--text-main);
  font-size: 12px;
}

.type-filter.active {
  border-color: rgba(223, 191, 114, 0.3);
  background: rgba(223, 191, 114, 0.12);
  color: #fff4db;
}

.graph-stage {
  position: relative;
  margin-top: 16px;
  padding: 14px;
  border-radius: 24px;
  min-height: 460px;
  background:
    radial-gradient(circle at center, rgba(217, 177, 90, 0.08), transparent 46%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.025), rgba(255, 255, 255, 0.008));
  border: 1px solid rgba(255, 255, 255, 0.05);
  overflow: hidden;
}

.graph-stage::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 32px 32px;
  opacity: 0.36;
  pointer-events: none;
}

.graph-canvas {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 420px;
}

.graph-error {
  position: absolute;
  left: 18px;
  right: 18px;
  bottom: 14px;
  z-index: 2;
  margin: 0;
  color: #d4bfb2;
  font-size: 12px;
  line-height: 1.6;
}

.graph-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 14px;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 12px;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.legend-dot--core {
  background: linear-gradient(135deg, #d9b15a 0%, #f2d89d 100%);
  box-shadow: 0 0 10px rgba(217, 177, 90, 0.45);
}

.legend-dot--site {
  background: linear-gradient(135deg, #88c9b0 0%, #d4fff0 100%);
}

.legend-dot--craft {
  background: linear-gradient(135deg, #8fb6d9 0%, #dcefff 100%);
}

.legend-dot--artifact {
  background: linear-gradient(135deg, #f8f2de 0%, rgba(255, 255, 255, 0.3) 100%);
}

.narrative-grid {
  display: grid;
  gap: 12px;
  margin-top: 16px;
}

.narrative-card {
  padding: 16px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.04);
}

.narrative-card strong {
  display: block;
  margin-bottom: 8px;
  font-size: 18px;
}

.linked-list {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.linked-list li {
  display: flex;
  justify-content: space-between;
  gap: 18px;
}

.linked-list span {
  color: var(--text-muted);
}

.linked-list strong {
  margin: 0;
  text-align: right;
  font-size: 14px;
  line-height: 1.6;
}

.narrative-button {
  margin-top: 12px;
  padding: 12px 16px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(217, 177, 90, 0.18), rgba(121, 196, 167, 0.22));
  color: var(--text-main);
}

.chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.info-chip {
  padding: 9px 14px;
  background: rgba(136, 201, 176, 0.1);
  color: #d8fff1;
  font-size: 13px;
}

.meaning-list {
  display: grid;
  gap: 10px;
  margin-top: 18px;
}

.meaning-list p {
  margin: 0;
  padding-left: 18px;
  position: relative;
  color: var(--text-muted);
}

.meaning-list p::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0.72em;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--gold-soft) 0%, #85c8b0 100%);
  box-shadow: 0 0 12px rgba(217, 177, 90, 0.5);
}

.panel-description {
  margin: 16px 0 0;
  color: var(--text-muted);
}

.action-panel {
  display: grid;
  gap: 12px;
  padding: 18px;
}

.action-button {
  padding: 15px 18px;
  border-radius: 18px;
  color: var(--text-main);
  background: rgba(255, 255, 255, 0.06);
}

.action-button--primary {
  background: linear-gradient(135deg, #d1a548 0%, #7dbda6 100%);
  color: #162016;
  font-weight: 800;
}

@media (max-width: 1180px) {
  .stage-layout {
    grid-template-columns: 1fr;
  }

  .viewer-shell {
    min-height: 560px;
  }
}

@media (max-width: 760px) {
  .artifact-stage-page {
    padding: 18px 14px 28px;
  }

  .page-header {
    flex-direction: column;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .viewer-card,
  .panel-card,
  .action-panel {
    border-radius: 24px;
  }

  .viewer-shell {
    min-height: 420px;
  }

  .fact-grid {
    grid-template-columns: 1fr;
  }

  .linked-list li {
    flex-direction: column;
  }

  .linked-list strong {
    text-align: left;
  }

  .graph-canvas {
    height: 360px;
  }
}
</style>
