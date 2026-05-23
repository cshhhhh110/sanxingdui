<template>
  <div class="course-blueprint">
    <a-spin :spinning="loading">
      <main v-if="course" class="main-container">

        <!-- TOP NAVIGATION BAR -->
        <nav class="action-bar">
          <button class="btn-back" type="button" @click="router.push('/course')">
            <i class="fas fa-arrow-left"></i>
            <span>返回课堂列表</span>
          </button>
        </nav>

        <!-- HERO SPLIT SECTION -->
        <header class="hero-showcase">
          <div class="hero-meta">
            <div class="meta-badge">COURSE DETAILS</div>
            <h1 class="hero-title">{{ course.title }}</h1>

            <!-- 激活预留的标签插槽，融合配置好的等级数据 -->
            <div class="course-tags" v-if="course.level !== undefined">

            </div>

            <div class="hero-action-zone">
              <a-button
                  v-if="course.status === 1"
                  type="primary"
                  class="btn-learn-master"
                  @click="startLearning"
              >
                <span>开始系统学习</span>
                <i class="fas fa-chevron-right"></i>
              </a-button>
              <a-button v-else class="btn-learn-disabled" disabled>
                暂未开放选课
              </a-button>
            </div>
          </div>

          <div class="hero-visual">
            <div class="image-wrapper">
              <img :src="getCourseCover()" :alt="course.title" />
            </div>
          </div>
        </header>

        <!-- CONTENT SHELF -->
        <div class="content-shelf">

          <!-- BRIEF INTRODUCTION CARD -->
          <section class="shelf-card info-card">
            <h2 class="shelf-title">
              <span class="title-decor"></span>
              课程简述
            </h2>
            <p class="summary-text">
              {{ course.description || '主讲老师暂未提供当前课程的具体大纲与简介。' }}
            </p>
          </section>

          <!-- CHAPTER SYLLABUS LIST -->
          <section class="shelf-card syllabus-card">
            <div class="syllabus-header">
              <h2 class="shelf-title">
                <span class="title-decor"></span>
                章节目录
              </h2>
              <span class="count-badge">共 {{ chapters.length }} 讲</span>
            </div>

            <div class="matrix-list">
              <div
                  v-for="(chapter, index) in chapters"
                  :key="chapter.id"
                  class="matrix-row"
                  :style="{ animationDelay: `${Math.min(index, 10) * 50}ms` }"
                  @click="playChapter(chapter)"
              >
                <div class="row-index">{{ String(index + 1).padStart(2, '0') }}</div>

                <div class="row-main">
                  <div class="row-badge-line">
                    <span class="row-tag">
                      <i v-if="chapter.videoFiles && chapter.videoFiles.length > 0" class="fas fa-video"></i>
                      <i v-else class="fas fa-file-alt"></i>
                      {{ chapter.videoFiles && chapter.videoFiles.length > 0 ? '视频课' : '图文单页' }}
                    </span>
                  </div>
                  <h3 class="row-title">{{ chapter.title }}</h3>
                  <p class="row-excerpt" v-if="chapter.content">
                    {{ chapter.content.substring(0, 90) }}...
                  </p>
                </div>

                <div class="row-action">
                  <span class="action-text">进入研习</span>
                  <div class="circle-arrow">
                    <i class="fas fa-arrow-right"></i>
                  </div>
                </div>
              </div>

              <a-empty v-if="chapters.length === 0" description="暂无章节排期" :image-style="{ height: '120px' }" />
            </div>
          </section>

        </div>
      </main>
    </a-spin>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { getCourseDetail, getCourseChapters } from '@/api/CourseApi'
import { getCourseLevelName, getCourseLevelColor } from '@/config/courseLevel'

const route = useRoute()
const router = useRouter()

const course = ref(null)
const chapters = ref([])
const loading = ref(false)

// 加载课程详情（保持原逻辑不变）
const loadDetail = () => {
  loading.value = true
  getCourseDetail(
      { courseId: route.params.id },
      {
        onSuccess: (data) => {
          course.value = data
          if (data.chapters && data.chapters.length > 0) {
            chapters.value = data.chapters
          } else {
            loadChapters()
          }
          loading.value = false
        },
        onError: () => {
          loading.value = false
          message.error('加载失败')
          router.back()
        }
      }
  )
}

// 加载章节列表（保持原逻辑不变）
const loadChapters = () => {
  getCourseChapters(
      { courseId: route.params.id },
      {
        onSuccess: (data) => {
          chapters.value = data || []
        }
      }
  )
}

// 开始学习（保持原逻辑不变）
const startLearning = () => {
  if (chapters.value.length > 0) {
    playChapter(chapters.value[0])
  } else {
    message.info('暂无章节内容')
  }
}

// 进入章节学习页（保持原逻辑不变）
const playChapter = (chapter) => {
  router.push(`/course/${route.params.id}/study/${chapter.id}`)
}

// 工具函数（保持原逻辑不变）
const getCourseCover = () => {
  if (course.value?.coverFilePath) {
    const path = course.value.coverFilePath
    if (path.startsWith('http')) return path
    return path.startsWith('/') ? path : '/' + path
  }
  return 'https://via.placeholder.com/400x250?text=' + encodeURIComponent(course.value?.title || '课程')
}

onMounted(() => {
  loadDetail()
})
</script>

<style scoped lang="less">
/* 全局色彩体系重构 */
.course-blueprint {
  --brand-color: #42664f;
  --brand-color-dim: #f0f4f1;
  --brand-color-dark: #2a4233;
  --text-main: #2c332e;
  --text-muted: #737d76;
  --bg-gradient-start: #fbfcfb;
  --bg-gradient-end: #f4f6f4;
  --border-subtle: #e6eae7;
  --radius-lg: 16px;
  --radius-md: 8px;
  --transition-smooth: cubic-bezier(0.25, 0.8, 0.25, 1);

  min-height: 100vh;
  color: var(--text-main);
  background: linear-gradient(180deg, var(--bg-gradient-start) 0%, var(--bg-gradient-end) 100%);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}

.main-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 24px 80px;
}

/* TOP NAVIGATION */
.action-bar {
  margin-bottom: 32px;

  .btn-back {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    background: transparent;
    border: none;
    color: var(--text-muted);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    padding: 8px 0;
    transition: color 0.2s ease;

    i {
      font-size: 12px;
      transition: transform 0.2s ease;
    }

    &:hover {
      color: var(--brand-color);

      i {
        transform: translateX(-4px);
      }
    }
  }
}

/* HERO SHOWCASE - MODERN INTEGRATION */
.hero-showcase {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 48px;
  align-items: center;
  background: #ffffff;
  border-radius: var(--radius-lg);
  padding: 48px;
  box-shadow: 0 10px 40px rgba(66, 102, 79, 0.03);
  border: 1px solid rgba(66, 102, 79, 0.05);
  margin-bottom: 32px;
}

.hero-meta {
  .meta-badge {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: var(--brand-color);
    margin-bottom: 16px;
  }

  .hero-title {
    font-size: 36px;
    font-weight: 700;
    line-height: 1.3;
    color: var(--text-main);
    margin: 0 0 20px 0;
    letter-spacing: -0.5px;
  }
}

.course-tags {
  margin-bottom: 32px;

  .ui-tag {
    display: inline-block;
    padding: 6px 14px;
    font-size: 12px;
    font-weight: 600;
    border-radius: 4px;
  }
}

.hero-action-zone {
  :deep(.ant-btn) {
    border-radius: var(--radius-md) !important;
    font-weight: 600;
    height: 52px;
    padding: 0 32px;
    font-size: 15px;
    border: none;
  }

  .btn-learn-master {
    background: var(--brand-color);
    color: #ffffff;
    box-shadow: 0 8px 24px rgba(66, 102, 79, 0.2);
    display: inline-flex;
    align-items: center;
    gap: 12px;
    transition: all 0.3s var(--transition-smooth);

    i {
      font-size: 11px;
      transition: transform 0.2s ease;
    }

    &:hover {
      background: var(--brand-color-dark) !important;
      box-shadow: 0 12px 28px rgba(66, 102, 79, 0.3);

      i {
        transform: translateX(3px);
      }
    }
  }

  .btn-learn-disabled {
    background: #f0f2f1 !important;
    color: #a3b0a7 !important;
    cursor: not-allowed;
  }
}

.hero-visual {
  .image-wrapper {
    width: 100%;
    aspect-ratio: 16 / 10;
    border-radius: var(--radius-md);
    overflow: hidden;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.06);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.6s var(--transition-smooth);
    }
  }

  &:hover .image-wrapper img {
    transform: scale(1.03);
  }
}

/* FLUID CONTENT SHELF */
.content-shelf {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.shelf-card {
  background: #ffffff;
  border-radius: var(--radius-lg);
  padding: 40px;
  box-shadow: 0 10px 40px rgba(66, 102, 79, 0.02);
  border: 1px solid rgba(66, 102, 79, 0.04);
}

.shelf-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;

  .title-decor {
    width: 4px;
    height: 18px;
    background: var(--brand-color);
    border-radius: 2px;
  }
}

/* INFO SECTION */
.summary-text {
  font-size: 15px;
  line-height: 1.8;
  color: #4a544e;
  margin: 0;
  white-space: pre-wrap;
}

/* SYLLABUS LIST SECTION */
.syllabus-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: 16px;
  margin-bottom: 8px;

  .shelf-title {
    margin-bottom: 0;
  }

  .count-badge {
    font-size: 13px;
    color: var(--text-muted);
    background: #f4f6f4;
    padding: 4px 12px;
    border-radius: 20px;
    font-weight: 500;
  }
}

.matrix-list {
  display: flex;
  flex-direction: column;
}

.matrix-row {
  display: grid;
  grid-template-columns: 50px minmax(0, 1fr) auto;
  gap: 24px;
  align-items: center;
  padding: 24px 16px;
  border-bottom: 1px solid var(--border-subtle);
  cursor: pointer;
  transition: all 0.25s var(--transition-smooth);
  opacity: 0;
  transform: translateY(10px);
  animation: slideUpIn 0.5s var(--transition-smooth) forwards;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: rgba(66, 102, 79, 0.02);
    padding-left: 24px;
    padding-right: 24px;
    border-radius: var(--radius-md);

    .row-title {
      color: var(--brand-color);
    }

    .circle-arrow {
      background: var(--brand-color);
      color: #ffffff;
      transform: translateX(4px);
    }
  }
}

.row-index {
  font-size: 20px;
  font-weight: 700;
  color: #cdd5d0;
  font-variant-numeric: tabular-nums;
}

.row-main {
  .row-badge-line {
    margin-bottom: 6px;

    .row-tag {
      font-size: 11px;
      font-weight: 600;
      color: var(--brand-color);
      background: var(--brand-color-dim);
      padding: 2px 8px;
      border-radius: 4px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
  }

  .row-title {
    font-size: 17px;
    font-weight: 600;
    color: var(--text-main);
    margin: 0 0 6px 0;
    transition: color 0.2s ease;
  }

  .row-excerpt {
    font-size: 14px;
    color: var(--text-muted);
    margin: 0;
    line-height: 1.6;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
  }
}

.row-action {
  display: flex;
  align-items: center;
  gap: 16px;

  .action-text {
    font-size: 13px;
    font-weight: 600;
    color: var(--brand-color);
  }

  .circle-arrow {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #f4f6f4;
    color: var(--brand-color);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    transition: all 0.25s var(--transition-smooth);
  }
}

/* KEYFRAMES FOR REFINED ENTRANCE EFFECT */
@keyframes slideUpIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* RESPONSIVE BREAKPOINTS */
@media (max-width: 992px) {
  .hero-showcase {
    grid-template-columns: 1fr;
    gap: 32px;
    padding: 32px;
  }

  .hero-visual {
    order: -1; /* 小屏幕下图片置顶显示 */
  }
}

@media (max-width: 768px) {
  .main-container {
    padding: 16px 16px 48px;
  }

  .hero-meta .hero-title {
    font-size: 28px;
  }

  .shelf-card {
    padding: 24px;
  }

  .matrix-row {
    grid-template-columns: 1fr;
    gap: 12px;
    padding: 20px 8px;

    &:hover {
      padding-left: 8px;
      padding-right: 8px;
    }
  }

  .row-index {
    display: none; /* 移动端精简掉序号空间 */
  }

  .row-action {
    justify-content: space-between;
    padding-top: 12px;
    border-top: 1px solid var(--border-subtle);
    margin-top: 4px;
  }
}
</style>