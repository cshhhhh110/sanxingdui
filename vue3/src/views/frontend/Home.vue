<template>
  <div class="heritage-home">
    <section class="hero-banner">
      <div class="particle-bg">
        <span v-for="n in 30" :key="n"></span>
      </div>

      <div class="mist"></div>

      <div class="scroll-container">
        <div class="scroll-content showcase-enter" style="--delay: 0.06s">
          <p class="hero-kicker showcase-enter" style="--delay: 0.1s">三星堆遗址现场</p>
          <h1 class="main-title showcase-enter" style="--delay: 0.14s">玄喵引路 古蜀寻踪</h1>
          <p class="subtitle showcase-enter" style="--delay: 0.2s">沉睡数千年 · 一醒惊天下</p>

          <p class="hero-intro showcase-enter" style="--delay: 0.24s">
            跟着玄喵从遗址现场出发，沿着时间、工艺与关系网络，一步步走近青铜神树、金杖与金面具背后的古蜀世界。
          </p>

          <div class="showcase-preview showcase-enter" style="--delay: 0.28s">
            <div
              v-for="(step, index) in showcasePreviewSteps"
              :key="step.title"
              class="preview-step showcase-card-hover"
              :style="{ '--delay': `${0.3 + index * 0.05}s` }"
            >
              <span class="preview-index">0{{ index + 1 }}</span>
              <div class="preview-copy">
                <strong>{{ step.title }}</strong>
                <small>{{ step.subtitle }}</small>
              </div>
            </div>
          </div>

          <div class="hero-actions showcase-enter" style="--delay: 0.3s">
            <router-link to="/trail" class="hero-link-button hero-link-button--primary">
              <CompassOutlined />
              <span>步入时空展线</span>
            </router-link>
            <router-link to="/3dlist" class="hero-link-button hero-link-button--ghost">
              <BookOutlined />
              <span>直接走进文物展厅</span>
            </router-link>
          </div>
        </div>
      </div>
    </section>

    <section class="featured-items split-bg-top">
      <div class="section-header">
        <h2 class="section-title">
          <span class="title-decor"></span>精选作品<span class="title-sub">EXQUISITE ARTIFACTS</span>
        </h2>

        <a-button type="link" @click="viewAllCourses">
          查看更多.. <img :src="'/righ.png'" class="arrow-icon" />
        </a-button>
      </div>

      <div class="artifacts-asymmetric-grid" v-if="featuredItems.length > 0">
        <div class="artifact-main-card" @click="viewItemDetail(featuredItems[0].id)">
          <div class="card-img-holder">
            <img :src="getItemCoverUrl(featuredItems[0])" :alt="featuredItems[0].title" />
            <span class="category-badge">{{ featuredItems[0].category }}</span>
          </div>
          <div class="card-text-layer">
            <span class="region-meta"><EnvironmentOutlined /> {{ featuredItems[0].region }}</span>
            <h3 class="artifact-title">{{ featuredItems[0].title }}</h3>
            <p class="artifact-summary">{{ featuredItems[0].summary }}</p>
          </div>
        </div>

        <div class="artifact-side-stack">
          <div
            v-for="item in featuredItems.slice(1, 3)"
            :key="item.id"
            class="artifact-sub-card"
            @click="viewItemDetail(item.id)"
          >
            <div class="sub-img-holder">
              <img :src="getItemCoverUrl(item)" :alt="item.title" />
            </div>
            <div class="sub-text-holder">
              <span class="category-tag-mini">{{ item.category }}</span>
              <h4 class="sub-title">{{ item.title }}</h4>
              <p class="sub-summary">{{ item.summary }}</p>
              <span class="sub-region"><EnvironmentOutlined /> {{ item.region }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="online-courses split-bg-middle">
      <div class="section-header">
        <h2 class="section-title">
          <span class="title-decor"></span>在线课程<span class="title-sub">CULTURAL KNOWLEDGE</span>
        </h2>
        <a-button type="link" @click="viewAllCourses">
          查看更多.. <img :src="'/righ.png'" class="arrow-icon" />
        </a-button>
      </div>

      <div class="course-scroll-row">
        <div
          v-for="course in courses"
          :key="course.id"
          class="course-strip-card"
          @click="viewCourseDetail(course.id)"
        >
          <div class="strip-image">
            <img :src="getCourseCover(course)" alt="课程封面" />
            <div class="strip-level-tag">{{ getLevelText(course.level) }}</div>
          </div>
          <div class="strip-info">
            <h4 class="strip-title">{{ course.title }}</h4>
            <p class="strip-desc">
              {{ course.description || '非遗文化课程，带你深入了解传统技艺' }}
            </p>
            <div class="strip-footer">
              <span class="action-trigger">进入研习 <i class="fas fa-chevron-right"></i></span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="upcoming-activities split-bg-bottom">
      <div class="section-header">
        <h2 class="section-title">
          <span class="title-decor"></span>近期活动<span class="title-sub">EVENT ACTIVITY</span>
        </h2>
        <a-button type="link" @click="viewAllCourses">
          查看更多.. <img :src="'/righ.png'" class="arrow-icon" />
        </a-button>
      </div>

      <div class="activity-timeline-horizontal" ref="timelineRef">
        <div class="timeline-line"></div>
        <div class="activity-list">
          <div
            v-for="(activity, index) in sortedActivities"
            :key="activity.id"
            class="activity-item"
            :class="index % 2 === 0 ? 'top' : 'bottom'"
            @click="viewActivityDetail(activity.id)"
          >
            <div class="activity-card">
              <div class="activity-cover">
                <img :src="getActivityCoverUrl(activity)" :alt="activity.title" />
              </div>
              <div class="activity-info">
                <div class="activity-time">
                  <CalendarOutlined />
                  {{ formatDate(activity.startTime) }}
                </div>
                <h4 class="activity-title">{{ activity.title }}</h4>
                <div class="activity-meta">
                  <a-tag :color="getActivityTypeColor(activity.type)">
                    {{ activity.type }}
                  </a-tag>
                  <span class="activity-location">
                    <EnvironmentOutlined />
                    {{ activity.location }}
                  </span>
                </div>
                <p class="activity-desc">{{ activity.description?.substring(0, 60) }}...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  CompassOutlined,
  BookOutlined,
  EnvironmentOutlined,
  CalendarOutlined
} from '@ant-design/icons-vue'
import { getHeritageItemPage } from '@/api/HeritageApi'
import { getInheritorPage } from '@/api/InheritorApi'
import { getActivityPage } from '@/api/ActivityApi'
import { getCoursePage } from '@/api/CourseApi'
import { API_BASE_URL } from '@/config/api'

const router = useRouter()

const showcasePreviewSteps = [
  { title: '时空定点', subtitle: '站上时间轴，选定你要进入的古蜀坐标' },
  { title: '文物驻足', subtitle: '从命中结果里挑一件值得先看的文物' },
  { title: '关系入场', subtitle: '看见展品背后的祭祀、工艺与王权网络' },
  { title: '玄喵串讲', subtitle: '让讲解把你刚看过的一切串成一个故事' }
]

const featuredItems = ref([])
const inheritors = ref([])
const activities = ref([])
const courses = ref([])
const timelineRef = ref(null)

onMounted(async () => {
  try {
    const itemsRes = await getHeritageItemPage(
      {
        current: 1,
        size: 4,
        status: 2
      },
      { showDefaultMsg: false }
    )
    featuredItems.value = itemsRes?.records || []

    const inheritorsRes = await getInheritorPage(
      {
        current: 1,
        size: 4
      },
      { showDefaultMsg: false }
    )
    inheritors.value = inheritorsRes?.records || []

    const activitiesRes = await getActivityPage(
      {
        current: 1,
        size: 4,
        status: 1
      },
      { showDefaultMsg: false }
    )
    activities.value = activitiesRes?.records || []

    const coursesRes = await getCoursePage(
      {
        current: 1,
        size: 4,
        status: 1
      },
      { showDefaultMsg: false }
    )
    courses.value = coursesRes?.records || []
  } catch (error) {}

  const el = timelineRef.value
  if (!el) {
    return
  }

  let isDown = false
  let startX
  let scrollLeft

  const mouseDown = (e) => {
    isDown = true
    el.classList.add('dragging')
    startX = e.pageX - el.offsetLeft
    scrollLeft = el.scrollLeft
  }

  const mouseLeave = () => {
    isDown = false
    el.classList.remove('dragging')
  }

  const mouseUp = () => {
    isDown = false
    el.classList.remove('dragging')
  }

  const mouseMove = (e) => {
    if (!isDown) {
      return
    }

    e.preventDefault()
    const x = e.pageX - el.offsetLeft
    const walk = (x - startX) * 1.5
    el.scrollLeft = scrollLeft - walk
  }

  el.addEventListener('mousedown', mouseDown)
  el.addEventListener('mouseleave', mouseLeave)
  el.addEventListener('mouseup', mouseUp)
  el.addEventListener('mousemove', mouseMove)

  onUnmounted(() => {
    el.removeEventListener('mousedown', mouseDown)
    el.removeEventListener('mouseleave', mouseLeave)
    el.removeEventListener('mouseup', mouseUp)
    el.removeEventListener('mousemove', mouseMove)
  })
})

const sortedActivities = computed(() => {
  return [...activities.value].sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
})

const getItemCoverUrl = (item) => {
  if (item.coverImage) {
    return item.coverImage
  }

  if (item.coverFileId) {
    return `${API_BASE_URL}/api/file/preview/${item.coverFileId}`
  }

  return '/api/placeholder/400/400'
}

const getActivityCoverUrl = (activity) => {
  if (activity.coverFilePath) {
    return activity.coverFilePath
  }

  if (activity.coverFileId) {
    return `${API_BASE_URL}/api/file/preview/${activity.coverFileId}`
  }

  return '/api/placeholder/400/300'
}

const formatDate = (dateStr) => {
  if (!dateStr) {
    return ''
  }

  const date = new Date(dateStr)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

const getCourseCover = (course) => {
  if (course.coverImage) {
    return course.coverImage.startsWith('http')
      ? course.coverImage
      : course.coverImage.startsWith('/')
        ? course.coverImage
        : `/${course.coverImage}`
  }

  if (course.coverFilePath) {
    return course.coverFilePath.startsWith('http')
      ? course.coverFilePath
      : course.coverFilePath.startsWith('/')
        ? course.coverFilePath
        : `/${course.coverFilePath}`
  }

  if (course.coverFileId) {
    if (/^[0-9a-zA-Z_-]{8,}$/.test(course.coverFileId)) {
      return `${API_BASE_URL}/api/file/preview/${course.coverFileId}`
    }

    return course.coverFileId.startsWith('/') ? course.coverFileId : `/${course.coverFileId}`
  }

  return `/api/placeholder/400/300?text=${encodeURIComponent(course.title || '课程封面')}`
}

const getLevelText = (level) => {
  const map = {
    beginner: '入门',
    elementary: '初级',
    intermediate: '中级',
    advanced: '高级'
  }

  return map[level] || '入门'
}

const getActivityTypeColor = (type) => {
  const colorMap = {
    展演: 'blue',
    展览: 'green',
    培训: 'orange',
    比赛: 'red'
  }

  return colorMap[type] || 'default'
}

const exploreHeritage = () => router.push('/tanmi')
const learnCourses = () => router.push('/course')
const viewItemDetail = (id) => router.push(`/heritage/${id}`)
const viewActivityDetail = (id) => router.push(`/activity/${id}`)
const viewAllCourses = () => router.push('/course')
const viewCourseDetail = (id) => router.push(`/course/${id}`)
</script>

<style scoped>
@import '@/styles/competitionMotion.css';

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 40px;
  border-bottom: 1px solid rgba(66, 102, 79, 0.1);
  padding-bottom: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  margin-bottom: 0;
  color: #1a2d20;
  font-family: 'Noto Serif SC', serif;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 2px;
}

.title-decor {
  display: inline-block;
  width: 5px;
  height: 24px;
  margin-right: 12px;
  background: #42664f;
  border-radius: 2px;
}

.title-sub {
  margin-left: 12px;
  color: #7a9484;
  font-family: Arial, sans-serif;
  font-size: 11px;
  font-weight: 300;
  letter-spacing: 1px;
}

.arrow-icon {
  width: 40px;
  height: 25px;
  margin-left: 4px;
  vertical-align: middle;
  object-fit: contain;
}

.heritage-home {
  width: 100%;
  overflow-x: hidden;
  background: linear-gradient(to bottom, #f8f5ef 0%, #f5f1e8 45%, #f7f3eb 100%);
}

:deep(.live2d-container) {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 9;
}

@media (max-width: 768px) {
  :deep(.live2d-placeholder) {
    width: 120px !important;
    height: 240px !important;
  }

  :deep(#ai-bubble) {
    width: 220px !important;
    bottom: 260px !important;
  }
}

.hero-banner {
  position: relative;
  z-index: 10;
  height: 780px;
  overflow: hidden;
  background-image:
    linear-gradient(120deg, rgba(0, 0, 0, 0.62), rgba(66, 102, 79, 0.25), rgba(0, 0, 0, 0.7)),
    url('@/assets/banner.jpg');
  background-position: center;
  background-size: 200% 200%, cover;
  animation: bannerFlow 15s ease infinite;
}

@keyframes bannerFlow {
  0% {
    background-position: 0% 50%, center;
  }

  50% {
    background-position: 100% 50%, center;
  }

  100% {
    background-position: 0% 50%, center;
  }
}

.particle-bg {
  position: absolute;
  inset: 0;
  z-index: 1;
  overflow: hidden;
  pointer-events: none;
}

.particle-bg span {
  position: absolute;
  bottom: -100px;
  width: 6px;
  height: 6px;
  background: rgba(255, 215, 120, 0.75);
  border-radius: 50%;
  box-shadow:
    0 0 10px rgba(255, 215, 120, 0.4),
    0 0 20px rgba(255, 215, 120, 0.25);
  animation: floatParticle linear infinite;
}

.particle-bg span:nth-child(1) { left: 5%; animation-duration: 12s; }
.particle-bg span:nth-child(2) { left: 15%; width: 4px; height: 4px; animation-duration: 18s; }
.particle-bg span:nth-child(3) { left: 28%; animation-duration: 15s; }
.particle-bg span:nth-child(4) { left: 40%; width: 8px; height: 8px; animation-duration: 20s; }
.particle-bg span:nth-child(5) { left: 52%; animation-duration: 16s; }
.particle-bg span:nth-child(6) { left: 65%; width: 5px; height: 5px; animation-duration: 14s; }
.particle-bg span:nth-child(7) { left: 75%; animation-duration: 22s; }
.particle-bg span:nth-child(8) { left: 88%; width: 7px; height: 7px; animation-duration: 17s; }

@keyframes floatParticle {
  0% {
    transform: translateY(0) scale(1);
    opacity: 0;
  }

  10% {
    opacity: 1;
  }

  50% {
    transform: translateY(-400px) translateX(30px) scale(1.2);
    opacity: 0.85;
  }

  100% {
    transform: translateY(-900px) translateX(-40px) scale(0.8);
    opacity: 0;
  }
}

.mist {
  position: absolute;
  bottom: 0;
  left: -10%;
  z-index: 1;
  width: 120%;
  height: 220px;
  background:
    radial-gradient(circle at 15% 40%, rgba(255, 255, 255, 0.22), transparent 24%),
    radial-gradient(circle at 45% 60%, rgba(255, 255, 255, 0.18), transparent 28%),
    radial-gradient(circle at 78% 35%, rgba(255, 255, 255, 0.16), transparent 26%);
  background-size: 360px 180px, 420px 200px, 340px 160px;
  opacity: 0.15;
  animation: mistMove 60s linear infinite;
  pointer-events: none;
}

@keyframes mistMove {
  from {
    transform: translateX(0);
  }

  to {
    transform: translateX(-400px);
  }
}

.scroll-container {
  position: relative;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 1200px;
  height: 100%;
  margin: 0 auto;
}

.scroll-content {
  position: relative;
  z-index: 4;
  display: grid;
  justify-items: center;
  width: min(1080px, calc(100% - 48px));
  text-align: center;
}

.hero-kicker {
  margin: 0 0 18px;
  padding: 8px 16px;
  color: #f0dba2;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  background: rgba(255, 248, 232, 0.08);
  border: 1px solid rgba(240, 219, 162, 0.22);
  border-radius: 999px;
}

.main-title {
  margin-bottom: 24px;
  background: linear-gradient(to bottom, #fffbe6 0%, #ffe7a0 35%, #f5c76b 60%, #d99b2b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-size: 72px;
  font-weight: 700;
  letter-spacing: 10px;
  text-shadow:
    0 0 10px rgba(255, 215, 120, 0.25),
    0 0 25px rgba(255, 215, 120, 0.15);
  animation: titleGlow 4s ease infinite;
}

@keyframes titleGlow {
  0% { filter: brightness(1); }
  50% { filter: brightness(1.15); }
  100% { filter: brightness(1); }
}

.subtitle {
  margin-bottom: 26px;
  color: rgba(255, 255, 255, 0.92);
  font-size: 30px;
  letter-spacing: 4px;
  text-shadow: 0 0 8px rgba(0, 0, 0, 0.5);
  animation: subtitleFloat 4.5s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
}

@keyframes subtitleFloat {
  0% { transform: translateY(0); }
  30% { transform: translateY(-8px); }
  45% { transform: translateY(-4px); }
  70% { transform: translateY(4px); }
  82% { transform: translateY(1px); }
  100% { transform: translateY(0); }
}

.hero-quote {
  display: grid;
  gap: 10px;
  width: min(760px, 100%);
  margin-bottom: 20px;
  padding: 18px 24px;
  color: rgba(255, 247, 227, 0.96);
  text-align: left;
  background: linear-gradient(135deg, rgba(20, 25, 22, 0.48), rgba(66, 102, 79, 0.2));
  border: 1px solid rgba(240, 219, 162, 0.18);
  border-radius: 22px;
  box-shadow: 0 18px 40px rgba(7, 10, 9, 0.16);
}

.hero-quote__line {
  margin: 0;
  font-size: 17px;
  line-height: 1.8;
}

.hero-intro {
  width: min(840px, 100%);
  margin: 0 0 30px;
  color: rgba(255, 243, 220, 0.82);
  font-size: 16px;
  line-height: 1.9;
}

.showcase-preview {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  width: 100%;
  max-width: 980px;
  margin-bottom: 34px;
}

.preview-step {
  display: grid;
  grid-template-columns: 50px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  padding: 15px 16px;
  text-align: left;
  background: rgba(255, 252, 243, 0.13);
  border: 1px solid rgba(255, 230, 176, 0.3);
  border-radius: 18px;
  backdrop-filter: blur(10px);
}

.preview-index {
  display: grid;
  width: 50px;
  height: 50px;
  place-items: center;
  color: #1f332c;
  font-size: 14px;
  font-weight: 800;
  background: linear-gradient(135deg, #f1d58e, #fff4c9);
  border-radius: 50%;
}

.preview-copy {
  display: grid;
  gap: 4px;
}

.preview-copy strong {
  color: #fff3d1;
  font-size: 16px;
}

.preview-copy small {
  color: rgba(255, 246, 223, 0.76);
  font-size: 12px;
  line-height: 1.5;
}

.hero-actions {
  position: relative;
  z-index: 5;
  display: flex;
  gap: 24px;
  justify-content: center;
}

:deep(.ant-btn-primary) {
  height: 52px;
  padding: 0 34px;
  border: none !important;
  border-radius: 999px;
  background: linear-gradient(135deg, #42664f, #5c8567) !important;
  box-shadow: 0 6px 20px rgba(66, 102, 79, 0.35);
  transition: all 0.35s;
}

:deep(.ant-btn-primary:hover) {
  transform: translateY(-3px);
  background: linear-gradient(135deg, #355240, #42664f) !important;
}


.hero-link-button {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 52px;
  padding: 0 34px;
  pointer-events: auto;
  position: relative;
  z-index: 6;
  color: #fff;
  text-decoration: none;
  border-radius: 999px;
  transition: transform 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
}

.hero-link-button:hover {
  transform: translateY(-3px);
  color: #fff;
}

.hero-link-button--primary {
  background: linear-gradient(135deg, #42664f, #5c8567);
  box-shadow: 0 6px 20px rgba(66, 102, 79, 0.35);
}

.hero-link-button--ghost {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(10px);
}

:deep(.ant-btn-default) {
  height: 52px;
  padding: 0 34px;
  color: #fff !important;
  background: rgba(255, 255, 255, 0.08) !important;
  border: 1px solid rgba(255, 255, 255, 0.35) !important;
  border-radius: 999px;
  backdrop-filter: blur(10px);
}

.featured-items,
.online-courses,
.upcoming-activities {
  max-width: 1200px;
  margin: 90px auto;
  padding: 0 24px;
}

:deep(.ant-btn-link) {
  color: #42664f !important;
  font-size: 15px !important;
}

:deep(.ant-btn-link:hover) {
  color: #355240 !important;
}

.artifacts-asymmetric-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 30px;
}

.artifact-main-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #e3eae6;
  border-radius: 4px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.02);
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
}

.artifact-main-card .card-img-holder {
  position: relative;
  height: 340px;
  overflow: hidden;
}

.artifact-main-card .card-img-holder img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s;
}

.category-badge {
  position: absolute;
  top: 16px;
  left: 16px;
  padding: 3px 10px;
  color: #fff;
  font-size: 11px;
  letter-spacing: 1px;
  background: #42664f;
  border-radius: 2px;
}

.card-text-layer {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  padding: 24px;
}

.region-meta {
  display: block;
  margin-bottom: 8px;
  color: #7a9484;
  font-size: 12px;
}

.artifact-title {
  margin-bottom: 12px;
  color: #1a2d20;
  font-size: 22px;
  font-weight: 600;
}

.artifact-summary {
  margin: 0;
  color: #5c6e63;
  font-size: 14px;
  line-height: 1.6;
}

.artifact-side-stack {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.artifact-sub-card {
  display: flex;
  height: 234px;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #e3eae6;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
}

.sub-img-holder {
  width: 40%;
  flex-shrink: 0;
  overflow: hidden;
}

.sub-img-holder img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s;
}

.sub-text-holder {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  padding: 18px;
}

.category-tag-mini {
  margin-bottom: 4px;
  color: #42664f;
  font-size: 11px;
  font-weight: 600;
}

.sub-title {
  margin-bottom: 6px;
  color: #1a2d20;
  font-size: 16px;
  font-weight: 600;
}

.sub-summary {
  display: -webkit-box;
  margin-bottom: auto;
  overflow: hidden;
  color: #77847c;
  font-size: 12px;
  line-height: 1.5;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.sub-region {
  color: #9bb0a3;
  font-size: 11px;
}

.artifact-main-card:hover,
.artifact-sub-card:hover {
  transform: translateY(-6px);
  border-color: rgba(66, 102, 79, 0.25);
  box-shadow: 0 15px 35px rgba(66, 102, 79, 0.08);
}

.artifact-main-card:hover img,
.artifact-sub-card:hover img {
  transform: scale(1.05);
}

.course-scroll-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.course-strip-card {
  display: flex;
  height: 150px;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #e3eae6;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.35s;
}

.strip-image {
  position: relative;
  width: 35%;
  flex-shrink: 0;
  overflow: hidden;
}

.strip-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s;
}

.strip-level-tag {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 2px 0;
  color: #fff;
  font-size: 11px;
  text-align: center;
  background: rgba(66, 102, 79, 0.85);
  backdrop-filter: blur(2px);
}

.strip-info {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  padding: 16px;
}

.strip-title {
  margin-bottom: 6px;
  overflow: hidden;
  color: #1a2d20;
  font-size: 16px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.strip-desc {
  display: -webkit-box;
  margin-bottom: auto;
  overflow: hidden;
  color: #6e7e73;
  font-size: 12px;
  line-height: 1.5;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.strip-footer {
  display: flex;
  justify-content: flex-end;
}

.action-trigger {
  color: #42664f;
  font-size: 11px;
  font-weight: 600;
  opacity: 0.7;
  transition: opacity 0.3s;
}

.course-strip-card:hover {
  border-color: rgba(66, 102, 79, 0.25);
  box-shadow: 0 10px 25px rgba(66, 102, 79, 0.06);
}

.course-strip-card:hover img {
  transform: scale(1.06);
}

.course-strip-card:hover .action-trigger {
  opacity: 1;
}

.activity-timeline-horizontal {
  position: relative;
  overflow-x: auto;
  padding: 100px 0;
  cursor: grab;
  user-select: none;
  scrollbar-width: none;
}

.activity-timeline-horizontal::-webkit-scrollbar {
  display: none;
}

.activity-timeline-horizontal.dragging {
  cursor: grabbing;
}

.timeline-line {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  z-index: 0;
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(66, 102, 79, 0.25), transparent);
}

.activity-list {
  display: flex;
  width: max-content;
  gap: 60px;
  padding: 0 40px;
}

.activity-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 260px;
}

.activity-item.top {
  transform: translateY(-80px);
}

.activity-item.bottom {
  transform: translateY(80px);
}

.activity-card {
  width: 260px;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #e3eae6;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.35s ease;
}

.activity-card:hover {
  transform: translateY(-6px);
  border-color: rgba(66, 102, 79, 0.25);
  box-shadow: 0 12px 28px rgba(66, 102, 79, 0.08);
}

.activity-cover {
  width: 100%;
  height: 150px;
  overflow: hidden;
}

.activity-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s;
}

.activity-card:hover .activity-cover img {
  transform: scale(1.05);
}

.activity-info {
  padding: 12px;
}

.activity-time {
  margin-bottom: 8px;
  color: #42664f;
  font-size: 12px;
}

.activity-title {
  margin-bottom: 10px;
  color: #1a2d20;
  font-size: 16px;
  font-weight: 600;
}

.activity-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 10px;
  color: #6e7e73;
  font-size: 12px;
}

.activity-desc {
  display: -webkit-box;
  overflow: hidden;
  color: #77857b;
  font-size: 12px;
  line-height: 1.6;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

@media (max-width: 1024px) {
  .artifacts-asymmetric-grid {
    grid-template-columns: 1fr;
  }

  .showcase-preview {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .hero-banner {
    height: 780px;
  }

  .main-title {
    font-size: 42px;
    letter-spacing: 4px;
  }

  .subtitle {
    font-size: 18px;
    letter-spacing: 2px;
  }

  .showcase-preview {
    grid-template-columns: 1fr;
  }

  .preview-step {
    grid-template-columns: 42px minmax(0, 1fr);
  }

  .preview-index {
    width: 42px;
    height: 42px;
  }

  .hero-actions {
    position: relative;
    z-index: 5;
    flex-direction: column;
    align-items: center;
  }

  .course-scroll-row {
    grid-template-columns: 1fr;
  }

  .mist {
    height: 120px;
  }
}
</style>
