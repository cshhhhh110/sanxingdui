<template>
  <div class="study-page">
    <a-spin :spinning="loading">
      <main class="study-shell">
        <section class="study-header">
          <button class="back-link" type="button" @click="router.push(`/course/${route.params.id}`)">
            <i class="fas fa-arrow-left"></i>
            返回课程详情
          </button>
          <div class="header-copy">
            <span>Learning Room</span>
            <h1>{{ currentChapter?.title || course?.title || '课程学习' }}</h1>
            <p>{{ course?.title }}</p>
          </div>
        </section>

        <section class="study-layout">
          <div class="player-section">
            <div v-if="currentChapter?.videoFiles && currentChapter.videoFiles.length > 0" class="video-stack">
              <video
                v-for="(video, index) in currentChapter.videoFiles"
                :key="video.id"
                :src="getVideoUrl(video.filePath)"
                controls
                preload="metadata"
                class="video-player"
                :class="{ 'mb-16': index < currentChapter.videoFiles.length - 1 }"
              >
                <p>您的浏览器不支持视频播放，请升级浏览器或使用其他浏览器。</p>
              </video>
            </div>

            <div v-else class="no-video-tip">
              <i class="fas fa-file-alt"></i>
              <p>本章节暂无视频内容</p>
            </div>

            <div class="content-panel">
              <div class="section-heading">
                <span>Chapter Notes</span>
                <h2>章节内容</h2>
              </div>
              <div class="content-text">
                {{ currentChapter?.content || '暂无文字内容' }}
              </div>
            </div>
          </div>

          <aside class="chapter-nav">
            <div class="nav-title">
              <span>{{ chapters.length }} 章节</span>
              <h2>课程目录</h2>
            </div>
            <div class="chapter-list">
              <button
                v-for="(chapter, index) in chapters"
                :key="chapter.id"
                class="chapter-link"
                :class="{ active: String(chapter.id) === String(route.params.chapterId) }"
                type="button"
                @click="goToChapter(chapter)"
              >
                <span class="chapter-number">{{ String(index + 1).padStart(2, '0') }}</span>
                <span class="chapter-title">{{ chapter.title }}</span>
                <i v-if="chapter.videoFiles && chapter.videoFiles.length > 0" class="fas fa-play-circle"></i>
                <i v-else class="fas fa-file-alt"></i>
              </button>
            </div>
          </aside>
        </section>
      </main>
    </a-spin>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { getCourseDetail, getCourseChapters, getChapterDetail } from '@/api/CourseApi'

const route = useRoute()
const router = useRouter()

const course = ref(null)
const chapters = ref([])
const currentChapter = ref(null)
const loading = ref(false)

const loadStudyData = () => {
  loading.value = true
  getCourseDetail(
    { courseId: route.params.id },
    {
      onSuccess: (data) => {
        course.value = data
        if (data.chapters && data.chapters.length > 0) {
          chapters.value = data.chapters
          syncCurrentChapter()
          loading.value = false
        } else {
          loadChapters()
        }
      },
      onError: () => {
        loading.value = false
        message.error('加载失败')
        router.back()
      }
    }
  )
}

const loadChapters = () => {
  getCourseChapters(
    { courseId: route.params.id },
    {
      onSuccess: (data) => {
        chapters.value = data || []
        syncCurrentChapter()
        loading.value = false
      },
      onError: () => {
        loading.value = false
      }
    }
  )
}

const syncCurrentChapter = () => {
  const matched = chapters.value.find((chapter) => String(chapter.id) === String(route.params.chapterId))
  if (matched) {
    currentChapter.value = matched
    return
  }
  loadChapterFallback()
}

const loadChapterFallback = () => {
  getChapterDetail(
    { chapterId: route.params.chapterId },
    {
      onSuccess: (data) => {
        currentChapter.value = data
      },
      onError: () => {
        message.error('章节不存在')
        router.push(`/course/${route.params.id}`)
      }
    }
  )
}

const goToChapter = (chapter) => {
  router.push(`/course/${route.params.id}/study/${chapter.id}`)
}

const getVideoUrl = (filePath) => {
  if (!filePath) return ''
  if (filePath.startsWith('http')) return filePath
  // 静态资源直接访问，不需要API前缀
  return filePath.startsWith('/') ? filePath : '/' + filePath
}

watch(
  () => route.params.chapterId,
  () => {
    if (chapters.value.length > 0) {
      syncCurrentChapter()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }
)

onMounted(() => {
  loadStudyData()
})
</script>

<style scoped lang="less">
.study-page {
  --course-primary: #42664f;
  --course-primary-deep: #2f4b3a;
  --course-ink: #1f2f25;
  --course-muted: #6f7d73;
  --course-line: #dfe8e2;
  --course-soft: #f6f9f7;

  min-height: 100vh;
  color: var(--course-ink);
  background:
    radial-gradient(circle at 78% 12%, rgba(66, 102, 79, 0.1), transparent 24%),
    linear-gradient(180deg, #ffffff 0%, #f7faf8 48%, #ffffff 100%);
}

.study-shell {
  max-width: 1240px;
  margin: 0 auto;
  padding: 32px 24px 64px;
}

.study-header {
  padding: 28px;
  border: 1px solid var(--course-line);
  background:
    linear-gradient(110deg, rgba(255, 255, 255, 0.96), rgba(255, 255, 255, 0.78)),
    url('@/assets/sanxingdui_04_zongmu_mianju.png') center / cover;
  box-shadow: 0 24px 70px rgba(31, 47, 37, 0.08);
  animation: riseIn 0.62s ease both;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 0 14px;
  color: var(--course-primary);
  cursor: pointer;
  border: 1px solid rgba(66, 102, 79, 0.22);
  background: rgba(255, 255, 255, 0.75);
  transition: transform 0.25s ease, border-color 0.25s ease;

  &:hover {
    border-color: var(--course-primary);
    transform: translateX(-2px);
  }
}

.header-copy {
  max-width: 820px;
  margin-top: 44px;

  span {
    color: var(--course-primary);
    font-size: 13px;
    font-weight: 800;
    text-transform: uppercase;
  }

  h1 {
    margin: 14px 0 0;
    color: var(--course-ink);
    font-size: clamp(32px, 5vw, 58px);
    font-weight: 800;
    line-height: 1.16;
    letter-spacing: 0;
  }

  p {
    margin: 14px 0 0;
    color: var(--course-muted);
    font-size: 16px;
  }
}

.study-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 330px;
  gap: 22px;
  margin-top: 22px;
}

.player-section,
.chapter-nav {
  border: 1px solid var(--course-line);
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 18px 42px rgba(31, 47, 37, 0.05);
  animation: riseIn 0.62s ease 0.08s both;
}

.player-section {
  padding: 22px;
}

.video-stack {
  overflow: hidden;
  background: #111812;
}

.video-player {
  display: block;
  width: 100%;
  max-height: 620px;
  aspect-ratio: 16 / 9;
  background: #111812;

  &.mb-16 {
    margin-bottom: 16px;
  }
}

.no-video-tip {
  display: grid;
  min-height: 360px;
  place-items: center;
  color: var(--course-muted);
  border: 1px dashed rgba(66, 102, 79, 0.28);
  background: var(--course-soft);

  i {
    display: block;
    margin-bottom: 14px;
    color: rgba(66, 102, 79, 0.45);
    font-size: 44px;
    text-align: center;
  }

  p {
    margin: 0;
    font-size: 15px;
  }
}

.content-panel {
  margin-top: 22px;
  padding-top: 22px;
  border-top: 1px solid var(--course-line);
}

.section-heading {
  span {
    color: var(--course-primary);
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
  }

  h2 {
    margin: 8px 0 0;
    color: var(--course-ink);
    font-size: 24px;
    font-weight: 800;
    letter-spacing: 0;
  }
}

.content-text {
  margin-top: 18px;
  color: #47564d;
  font-size: 16px;
  line-height: 2;
  white-space: pre-wrap;
}

.chapter-nav {
  position: sticky;
  top: 18px;
  align-self: start;
  padding: 20px;
}

.nav-title {
  padding-bottom: 16px;
  border-bottom: 1px solid var(--course-line);

  span {
    color: var(--course-primary);
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
  }

  h2 {
    margin: 8px 0 0;
    color: var(--course-ink);
    font-size: 22px;
    font-weight: 800;
  }
}

.chapter-list {
  display: grid;
  gap: 10px;
  margin-top: 16px;
}

.chapter-link {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) 20px;
  gap: 12px;
  align-items: center;
  width: 100%;
  padding: 13px 12px;
  color: var(--course-ink);
  text-align: left;
  cursor: pointer;
  border: 1px solid var(--course-line);
  background: #ffffff;
  transition: transform 0.24s ease, border-color 0.24s ease, background 0.24s ease;

  &:hover,
  &.active {
    border-color: rgba(66, 102, 79, 0.45);
    background: var(--course-soft);
    transform: translateX(2px);
  }

  &.active {
    box-shadow: inset 3px 0 0 var(--course-primary);
  }
}

.chapter-number {
  color: rgba(66, 102, 79, 0.32);
  font-size: 18px;
  font-weight: 800;
}

.chapter-title {
  overflow: hidden;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chapter-link i {
  color: var(--course-primary);
}

@keyframes riseIn {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1024px) {
  .study-layout {
    grid-template-columns: 1fr;
  }

  .chapter-nav {
    position: static;
  }
}

@media (max-width: 768px) {
  .study-shell {
    padding: 20px 16px 44px;
  }

  .study-header,
  .player-section,
  .chapter-nav {
    padding: 18px;
  }

  .header-copy {
    margin-top: 34px;
  }
}
</style>
