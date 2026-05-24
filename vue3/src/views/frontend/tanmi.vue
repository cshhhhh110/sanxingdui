<template>
  <div class="explore-shu-container">
    <!-- 头部 Banner -->
    <div class="shu-banner" ref="bannerRef">
      <img src="/images/shu-banner.png" alt="古蜀文明banner" class="banner-bg-img" />
      <div class="banner-overlay"></div>
      <div class="banner-pattern"></div>
      <div class="banner-deco"></div>
      <div class="banner-deco2"></div>
      <div class="banner-content">
        <span class="banner-tag">三星堆考古专题</span>
        <div class="banner-title">探索古蜀 · 发掘祭祀之谜</div>
        <div class="banner-sub">从祭祀坑出土，还原古蜀真实历史</div>
      </div>
    </div>

    <!-- 时间轴导航 -->
    <div class="timeline-nav">
      <button
          v-for="(era, index) in eras"
          :key="era.key"
          class="tnav-item"
          :class="{ active: activeNav === index }"
          @click="scrollToSection(index)"
      >
        <div class="tnav-dot"></div>
        <div class="tnav-label">{{ era.navLabel }}</div>
      </button>
    </div>

    <!-- 核心内容区 -->
    <div class="shu-content">
      <!-- 各文化阶段卡片 -->
      <div
          v-for="(era, index) in eras"
          :key="era.key"
          class="era-card"
          :ref="el => sectionRefs[index] = el"
      >
        <div class="era-header">
          <div class="era-icon" :class="era.key">
            <img v-if="era.icon" :src="era.icon" :alt="era.name" />
            <span v-else class="era-icon-fallback">{{ era.iconText }}</span>
          </div>
          <div class="era-meta">
            <div class="era-name">{{ era.name }}</div>
            <div class="era-period">{{ era.period }}</div>
          </div>
          <span class="era-badge" :class="`badge-${era.badgeType}`">{{ era.badge }}</span>
        </div>

        <div class="era-img-wrap">
          <img
              v-if="era.image"
              :src="era.image"
              :alt="era.name"
              class="era-img"
          />
          <div v-else class="era-img-placeholder" :class="era.key">
            <span class="placeholder-text">{{ era.name }}</span>
          </div>
          <div class="era-img-label">{{ era.imgLabel }}</div>
        </div>

        <div class="era-body">
          <div class="era-desc">{{ era.desc }}</div>
          <div class="era-tags">
            <span v-for="tag in era.tags" :key="tag" class="era-tag">{{ tag }}</span>
          </div>
        </div>

        <div class="era-divider"></div>

        <div class="era-footer">
          <div class="era-stats">
            <div v-for="stat in era.stats" :key="stat.label" class="stat-item">
              <div class="stat-num">{{ stat.num }}</div>
              <div class="stat-label">{{ stat.label }}</div>
            </div>
          </div>
          <button class="more-btn" @click="goToDetail(era.key)">查看详情 →</button>
        </div>
      </div>

      <!-- 3D 互动入口 -->
      <div class="action-card" ref="btnRef">
        <div class="action-deco"></div>
        <div class="action-inner">
          <div class="action-text">
            <div class="action-title">AI 图片生成器</div>
            <div class="action-desc">输入文字描述，一键生成古蜀风格、三星堆、非遗主题图片</div>
          </div>
          <button class="action-btn" @click="goToQuiz">立即体验</button>
        </div>
      </div>
    </div>

    <!-- 新手导航遮罩层（仅新用户显示） -->
    <div v-if="isNewUser && showGuide" class="guide-mask">
      <div
          class="guide-bubble"
          :style="bubbleStyle"
      >
        <div class="guide-step-label">步骤 {{ guideStep }} / {{ totalGuideSteps }}</div>
        <div class="guide-text">{{ currentGuideConfig.text }}</div>
        <div class="guide-actions">
          <div class="guide-dots">
            <span
                v-for="n in totalGuideSteps"
                :key="n"
                class="guide-dot"
                :class="{ active: n === guideStep }"
            ></span>
          </div>
          <button
              class="guide-next-btn"
              :class="{ finish: guideStep === totalGuideSteps }"
              @click="nextGuideStep"
          >
            {{ guideStep < totalGuideSteps ? '下一步 →' : '完成 ✓' }}
          </button>
        </div>
        <div class="bubble-arrow" :class="currentGuideConfig.arrowDir"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'

// 控制台调试，已实现新用户引导功能  true新用户  false 否
// ─── 调试开关 ────────────────────────────────────────────────────────────────
const DEBUG_FORCE_NEW_USER = false


// ─── 核心数据：聚焦三星堆祭祀坑发掘历史 ───────────────────────────────────
const eras = [
  {
    key: 'baodun',
    navLabel: '文明起源',
    name: '宝墩文化遗址',
    period: '约公元前 2500 — 1700 年',
    badge: '史前根基',
    badgeType: 'green',
    iconText: '墩',
    image: '/images/baodun.png',
    imgLabel: '宝墩史前遗址',
    desc: '古蜀文明的起源阶段，成都平原早期史前聚落。考古发掘证实，宝墩时期已形成大型城址与农耕文明，为后续三星堆祭祀文化的诞生，奠定了社会与宗教基础。',
    tags: ['史前城址', '农耕文明', '文明起源', '考古发掘'],
    stats: [
      { num: '800年', label: '文化时长' },
      { num: '6处', label: '已发掘城址' },
    ],
  },
  {
    key: 'sanxing',
    navLabel: '三星堆祭祀坑',
    name: '三星堆祭祀坑遗址',
    period: '1929年发现 · 1986/2023年发掘',
    badge: '核心发掘',
    badgeType: 'purple',
    iconText: '坑',
    image: '/images/sanxingdui.png',
    imgLabel: '三星堆祭祀坑发掘现场',
    desc: '三星堆遗址共发现8座祭祀坑，是古蜀王国最重要的宗教祭祀遗存。历经近百年考古发掘，出土万件青铜、黄金、象牙文物，实证了古蜀王国的祭祀制度、王权等级与真实历史脉络，改写了中华文明上古史。',
    tags: ['祭祀坑发掘', '考古实证', '古蜀祭祀', '文物出土', '历史还原'],
    stats: [
      { num: '8座', label: '祭祀坑总数' },
      { num: '2次', label: '重大发掘' },
      { num: '13000+', label: '出土文物' },
    ],
  },
  {
    key: 'jinsha',
    navLabel: '文明延续',
    name: '金沙祭祀遗址',
    period: '约公元前 1200 — 650 年',
    badge: '传承发展',
    badgeType: 'amber',
    iconText: '沙',
    image: '/images/jinsha.png',
    imgLabel: '金沙祭祀遗址',
    desc: '承接三星堆祭祀文明的核心都邑，同样以祭祀遗存为核心。考古发掘出土大量金器、玉器，完整延续了古蜀的宗教信仰与祭祀传统，构建起古蜀文明从起源到鼎盛再到传承的完整历史链条。',
    tags: ['祭祀传承', '考古发现', '金器出土', '文明延续'],
    stats: [
      { num: '550年', label: '延续时长' },
      { num: '6000+', label: '出土文物' },
    ],
  },
]

// ─── 导航高亮 ─────────────────────────────────────────────────────────────────
const activeNav = ref(0)
const sectionRefs = ref([])

const scrollToSection = (index) => {
  activeNav.value = index
  // 增加一个顶部偏移量，避开导航栏高度
  const el = sectionRefs.value[index]
  if (el) {
    const y = el.getBoundingClientRect().top + window.scrollY - 70
    window.scrollTo({ top: y, behavior: 'smooth' })
  }
}

// ─── 新手引导 ─────────────────────────────────────────────────────────────────
const isNewUser = ref(false)
const showGuide = ref(false)
const guideStep = ref(1)
const totalGuideSteps = 3

const bannerRef = ref(null)
const btnRef = ref(null)

const bubbleTop = ref(0)
const bubbleLeft = ref(0)

const route = useRoute()
const router = useRouter()

// 引导文案同步改为：祭祀坑发掘、考古历史
const guideConfigs = [
  {
    text: '这里聚焦三星堆祭祀坑考古发掘，向下滚动探索古蜀真实历史',
    targetRef: () => bannerRef.value,
    arrowDir: 'up',
  },
  {
    text: '核心展示三星堆祭祀坑发掘历程，通过考古实证还原古蜀文明',
    targetRef: () => sectionRefs.value[1],
    arrowDir: 'up',
  },
  {
    text: '点击进入 AI 生图，输入描述即可生成古蜀风格图片',
    targetRef: () => btnRef.value,
    arrowDir: 'up',
  },
]

const currentGuideConfig = computed(() => guideConfigs[guideStep.value - 1])

const bubbleStyle = computed(() => ({
  top: bubbleTop.value + 'px',
  left: bubbleLeft.value + 'px',
}))

const safeGetRect = (el) => {
  if (!el) return null
  return el.getBoundingClientRect()
}


// 卡片查看详情跳转（三个页面全部完成，直接跳转）
const goToDetail = (key) => {
  switch (key) {
    case 'baodun':
      router.push({ name: 'info1' }).then(() => {
        // 跳转完成后滚动到顶部
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      });
      break
    case 'sanxing':
      router.push({ name: 'info2' }).then(() => {
        // 跳转完成后滚动到顶部
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      });
      break
    case 'jinsha':
      router.push({ name: 'info3' }).then(() => {
      // 跳转完成后滚动到顶部
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    });
      break
    default:
      showToast('页面不存在')
  }
}

// 3D立即体验跳转到知识问答
const goToQuiz = () => {
  router.push({ name: 'ai-image-generator' }).then(() => {
    // 跳转完成后滚动到顶部
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  });
}

const calculateCurrentStepPosition = async () => {
  await nextTick()
  const config = guideConfigs[guideStep.value - 1]
  const el = config.targetRef()
  const rect = safeGetRect(el)
  if (!rect) return

  let top = rect.bottom + 10
  const bubbleHeight = 130
  if (top + bubbleHeight > window.innerHeight) {
    top = rect.top - bubbleHeight -100
  }

  // 第三步指引框单独往下调整
  if (guideStep.value === 3) {
    bubbleTop.value = Math.max(8, top) + 285
  } else if(guideStep.value === 2){
    bubbleTop.value = Math.max(8, top) +165
  } else {
    bubbleTop.value = Math.max(8, top)
  }

  bubbleLeft.value = 136
}

onMounted(async () => {
  // 1. 先获取后端/路由判断的是否新用户
  let backendIsNew = localStorage.getItem('isNewUser') === 'true' || route.query.isNewUser === 'true'

  // 2. 调试开关强制覆盖后端值（你要的功能）
  let finalIsNewUser = DEBUG_FORCE_NEW_USER ? true : backendIsNew

  // 3. 非调试模式：如果已经完成过引导，直接不显示
  if (!DEBUG_FORCE_NEW_USER) {
    const hasCompleted = localStorage.getItem('shuGuideCompleted') === 'true'
    if (hasCompleted) {
      showGuide.value = false
      return
    }
  }

  // 4. 最终是否显示引导
  isNewUser.value = finalIsNewUser
  if (finalIsNewUser) {
    await nextTick()
    showGuide.value = true
    await nextTick()
    calculateCurrentStepPosition()
  }
})

const nextGuideStep = async () => {
  if (guideStep.value < totalGuideSteps) {
    guideStep.value += 1

    if (guideStep.value === 2) {
      sectionRefs.value[1]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    if (guideStep.value === 3) {
      btnRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    await nextTick()
    setTimeout(() => {
      calculateCurrentStepPosition()
    }, 320)
  } else {
    completeGuide()
  }
}

const completeGuide = () => {
  showGuide.value = false
  localStorage.setItem('shuGuideCompleted', 'true')
  showToast('指引完成！')
}

watch(guideStep, async () => {
  if (showGuide.value && guideStep.value <= totalGuideSteps) {
    await nextTick()
    calculateCurrentStepPosition()
  }
})
</script>

<style scoped>
/* ── 全局容器 ──────────────────────────────────────────────────────────────── */
.explore-shu-container {
  background: #f5f3ef;
  min-height: 100vh;
  padding-bottom: 60px;
  font-family: -apple-system, 'PingFang SC', 'Hiragino Sans GB', sans-serif;
  /* 核心修改：最大宽度1200px + 水平居中 */
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

/* ── Banner ────────────────────────────────────────────────────────────────── */
.shu-banner {
  position: relative;
  height: 220px;
  overflow: hidden;
  background: linear-gradient(160deg, #42664f 0%, #42664f 45%, #42664f 100%);
  /* 适配居中布局 */
  width: 100%;
  border-radius: 0 0 12px 12px;
}

.banner-bg-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 17.35;
}

.banner-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(66,102,79,0.5) 0%, rgba(66,102,79,0.85) 100%);
}

.banner-pattern {
  position: absolute;
  inset: 0;
  opacity: 0.06;
  background-image: repeating-radial-gradient(circle at 20% 50%, #fff 0, #fff 1px, transparent 0, transparent 50%);
  background-size: 28px 28px;
}

.banner-deco {
  position: absolute;
  right: -24px;
  bottom: -36px;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  border: 44px solid rgba(250, 199, 117, 0.12);
}

.banner-deco2 {
  position: absolute;
  right: 64px;
  bottom: 18px;
  width: 90px;
  height: 90px;
  border-radius: 50%;
  border: 20px solid rgba(250, 199, 117, 0.08);
}

.banner-content {
  position: relative;
  z-index: 2;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 0 20px 22px;
}

.banner-tag {
  display: inline-block;
  background: rgba(250, 199, 117, 0.18);
  border: 0.5px solid rgba(250, 199, 117, 0.45);
  color: #FAC775;
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 20px;
  margin-bottom: 10px;
  width: fit-content;
  letter-spacing: 0.5px;
}

.banner-title {
  font-size: 24px;
  font-weight: 600;
  color: #fff;
  letter-spacing: 3px;
  line-height: 1.3;
}

.banner-sub {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 6px;
  letter-spacing: 1.5px;
}

/* ── 时间轴导航 ────────────────────────────────────────────────────────────── */
.timeline-nav {
  display: flex;
  background: #fff;
  border-bottom: 0.5px solid #e8e4dc;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  position: sticky;
  top: 0;
  z-index: 100;
  /* 适配居中布局 */
  width: 100%;
  border-radius: 12px 12px 0 0;
}

.timeline-nav::-webkit-scrollbar {
  display: none;
}

.tnav-item {
  flex: 1;
  min-width: 90px;
  padding: 12px 8px;
  text-align: center;
  cursor: pointer;
  border: none;
  background: none;
  border-bottom: 2px solid transparent;
  transition: border-color 0.2s, color 0.2s;
}

.tnav-item.active {
  border-bottom-color: #42664f;
}

.tnav-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #fff;
  margin: 0 auto 5px;
  transition: background 0.2s;
}

.tnav-item.active .tnav-dot {
  background: #fff;
}

.tnav-label {
  font-size: 11px;
  color: #999;
  transition: color 0.2s;
}

.tnav-item.active .tnav-label {
  color: #42664f;
  font-weight: 600;
}

/* ── 内容区 ────────────────────────────────────────────────────────────────── */
.shu-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  /* 适配大屏布局 */
  max-width: 100%;
}

/* ── 文化阶段卡片 ──────────────────────────────────────────────────────────── */
.era-card {
  background: #fff;
  border-radius: 14px;
  border: 0.5px solid #e8e4dc;
  overflow: hidden;
}

/* 卡片头部 */
.era-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px 0;
}

.era-icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.era-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.era-icon-fallback {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.era-icon.baodun {
  background: #EAF3DE;
  color: #3B6D11;
}

.era-icon.sanxing {
  background: #EEEDFE;
  color: #42664f;
}

.era-icon.jinsha {
  background: #FAEEDA;
  color: #633806;
}

.era-meta {
  flex: 1;
  min-width: 0;
}

.era-name {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
}

.era-period {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
}

.era-badge {
  flex-shrink: 0;
  font-size: 10px;
  padding: 3px 9px;
  border-radius: 20px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.badge-green {
  background: #EAF3DE;
  color: #3B6D11;
}

.badge-purple {
  background: #EEEDFE;
  color: #42664f;
}

.badge-amber {
  background: #FAEEDA;
  color: #854F0B;
}

/* 配图 */
.era-img-wrap {
  position: relative;
  margin: 12px 16px;
  height: 240px;
  border-radius: 10px;
  overflow: hidden;
}

.era-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.era-img-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.era-img-placeholder.baodun {
  background: linear-gradient(135deg, #C0DD97 0%, #639922 100%);
}

.era-img-placeholder.sanxing {
  background: linear-gradient(135deg, #CECBF6 0%, #42664f 100%);
}

.era-img-placeholder.jinsha {
  background: linear-gradient(135deg, #FAC775 0%, #BA7517 100%);
}

.placeholder-text {
  font-size: 20px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 3px;
}

.era-img-label {
  position: absolute;
  bottom: 8px;
  right: 10px;
  font-size: 10px;
  color: rgba(255, 255, 25, 0.85);
  background: rgba(0, 0, 0, 0.22);
  border-radius: 4px;
  padding: 2px 8px;
  backdrop-filter: blur(4px);
}

/* 描述 & 标签 */
.era-body {
  padding: 0 16px 14px;
}

.era-desc {
  font-size: 13px;
  color: #555;
  line-height: 1.75;
}

.era-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.era-tag {
  font-size: 11px;
  padding: 3px 9px;
  border-radius: 20px;
  border: 0.5px solid #e0dbd0;
  color: #888;
  background: #f8f6f2;
}

/* 分割线 */
.era-divider {
  height: 0.5px;
  background: #ede9e0;
  margin: 0 16px 12px;
}

/* 底部统计 + 按钮 */
.era-footer {
  padding: 0 16px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.era-stats {
  display: flex;
  gap: 20px;
}

.stat-item {
  text-align: center;
}

.stat-num {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: -0.3px;
}

.stat-label {
  font-size: 10px;
  color: #aaa;
  margin-top: 1px;
}

.more-btn {
  font-size: 12px;
  color: #42664f;
  background: #EEEDFE;
  border: none;
  padding: 7px 14px;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 500;
  letter-spacing: 0.3px;
  transition: opacity 0.15s;
}

.more-btn:active {
  opacity: 0.75;
}

/* ── 3D 互动入口卡片 ────────────────────────────────────────────────────────── */
.action-card {
  position: relative;
  background: linear-gradient(135deg, #42664f 0%, #42664f 100%);
  border-radius: 14px;
  padding: 20px;
  overflow: hidden;
}

.action-deco {
  position: absolute;
  right: -18px;
  top: -18px;
  width: 90px;
  height: 90px;
  border-radius: 50%;
  border: 22px solid rgba(255, 255, 255, 0.06);
}

.action-inner {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.action-text {
  flex: 1;
}

.action-title {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  letter-spacing: 0.5px;
  margin-bottom: 5px;
}

.action-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.55);
  line-height: 1.6;
}

.action-btn {
  flex-shrink: 0;
  background: #FAC775;
  color: #412402;
  border: none;
  border-radius: 22px;
  padding: 10px 18px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.15s;
}

.action-btn:active {
  opacity: 0.85;
}

/* ── 新手引导遮罩 ───────────────────────────────────────────────────────────── */
.guide-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.52);
  z-index: 9999;
  pointer-events: none;
}

.guide-bubble {
  position: absolute;
  width: 220px;
  background: #fff;
  border-radius: 12px;
  border: 0.5px solid rgba(0,0,0,0.08);
  padding: 14px 16px;
  pointer-events: auto;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
}

.guide-step-label {
  font-size: 10px;
  color: #42664f;
  font-weight: 600;
  margin-bottom: 6px;
  letter-spacing: 0.5px;
}

.guide-text {
  font-size: 13px;
  color: #333;
  line-height: 1.65;
  margin-bottom: 12px;
}

.guide-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.guide-dots {
  display: flex;
  gap: 5px;
}

.guide-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #ddd;
  transition: background 0.2s;
}

.guide-dot.active {
  background: #42664f;
}

.guide-next-btn {
  background: #42664f;
  color: #fff;
  border: none;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s;
}

.guide-next-btn.finish {
  background: #3B6D11;
}

.guide-next-btn:active {
  opacity: 0.8;
}

/* 气泡箭头 */
.bubble-arrow {
  position: absolute;
  left: 24px;
  width: 0;
  height: 0;
}

.bubble-arrow.up {
  top: -8px;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 8px solid #fff;
}

.bubble-arrow.down {
  bottom: -8px;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid #fff;
}
</style>