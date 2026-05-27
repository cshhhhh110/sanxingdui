<template>
  <div class="course-list">
    <section class="course-hero">
      <div class="hero-shell">
        <div class="hero-copy">
          <span class="hero-kicker">Sanxingdui Study</span>
          <h1>研学课堂</h1>
          <p>循着青铜纹样、祭祀器物与古蜀文明脉络，进入一场更有秩序感的文化学习旅程。</p>
        </div>
        <div class="hero-panel">
          <div class="panel-mark">COURSE</div>
          <div class="panel-number">{{ pagination.total || courseList.length }}</div>
          <div class="panel-label">门精品课程</div>
        </div>
      </div>
    </section>

    <section class="filter-band">
      <div class="filter-shell">
        <a-row :gutter="[16, 16]" align="middle">
          <a-col :xs="24" :md="11">
            <a-input
              v-model:value="searchForm.title"
              placeholder="搜索课程标题"
              allow-clear
              @press-enter="handleSearch"
            >
              <template #prefix>
                <i class="fas fa-search"></i>
              </template>
            </a-input>
          </a-col>
          <a-col :xs="24" :sm="14" :md="8">
            <a-select
              v-model:value="searchForm.level"
              placeholder="选择难度等级"
              allow-clear
              style="width: 100%"
            >
              <a-select-option
                v-for="option in COURSE_LEVEL_OPTIONS"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </a-select-option>
            </a-select>
          </a-col>
          <a-col :xs="24" :sm="10" :md="5">
            <a-button type="primary" block @click="handleSearch">
              <i class="fas fa-search"></i>
              搜索课程
            </a-button>
          </a-col>
        </a-row>
      </div>
    </section>

    <main class="course-main">
      <a-spin :spinning="loading">
        <div v-if="courseList.length > 0" class="course-grid">
          <article
            v-for="(course, index) in courseList"
            :key="course.id"
            class="course-card"
            :style="{ animationDelay: `${Math.min(index, 11) * 55}ms` }"
            @click="goToDetail(course.id)"
          >
            <div class="card-index">{{ String(index + 1).padStart(2, '0') }}</div>
            <div class="card-body">
              <div class="card-topline">
                <span>研学单元</span>
              </div>
              <h3>{{ course.title }}</h3>
              <div class="course-meta">

                <div class="meta-item">
                  <span>{{ getCourseLevelName(course.level) }}</span>
                </div>
              </div>
            </div>
            <div class="card-action">
              <span>开始学习</span>
              <i class="fas fa-arrow-right"></i>
            </div>
          </article>
        </div>

        <a-empty v-if="!loading && courseList.length === 0" description="暂无课程" />
      </a-spin>
    </main>

    <div class="pagination-section" v-if="pagination.total > 0">
      <a-pagination
        v-model:current="pagination.current"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :show-size-changer="true"
        :show-total="total => `共 ${total} 条`"
        @change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getCoursePage } from '@/api/CourseApi'
import { COURSE_LEVEL_OPTIONS, getCourseLevelName, getCourseLevelColor } from '@/config/courseLevel'
import '@/styles/scroll-header.css'

const router = useRouter()

// 搜索表单
const searchForm = reactive({
  title: '',
  level: undefined,
  status: 1 // 只显示已发布的课程
})

// 课程列表
const courseList = ref([])
const loading = ref(false)
const pagination = reactive({
  current: 1,
  pageSize: 12,
  total: 0
})

// 加载数据
const loadData = () => {
  loading.value = true
  getCoursePage(
    {
      current: pagination.current,
      size: pagination.pageSize,
      ...searchForm
    },
    {
      onSuccess: (data) => {
        courseList.value = data.records || []
        pagination.total = data.total || 0
        loading.value = false
      },
      onError: () => {
        loading.value = false
      }
    }
  )
}

// 搜索
const handleSearch = () => {
  pagination.current = 1
  loadData()
}

// 分页变化
const handlePageChange = () => {
  loadData()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 跳转详情
const goToDetail = (id) => {
  router.push(`/course/${id}`)
}

// 页面加载
onMounted(() => {
  loadData()
})
</script>

<style scoped lang="less">
.course-list {
  --course-primary: #42664f;
  --course-primary-deep: #2f4b3a;
  --course-ink: #1f2f25;
  --course-muted: #6f7d73;
  --course-line: #dfe8e2;
  --course-soft: #f6f9f7;

  min-height: 100vh;
  color: var(--course-ink);
  background:
    radial-gradient(circle at 12% 10%, rgba(66, 102, 79, 0.1), transparent 28%),
    linear-gradient(180deg, #ffffff 0%, #f7faf8 48%, #ffffff 100%);
}

.course-hero {
  position: relative;
  overflow: hidden;
  padding: 76px 24px 34px;
  background:
    linear-gradient(135deg, rgba(66, 102, 79, 0.13), rgba(255, 255, 255, 0.86) 52%),
    url('@/assets/sanxingdui_04_zongmu_mianju.png') center 58% / cover;

  &::before {
    position: absolute;
    inset: 0;
    content: '';
    background: linear-gradient(90deg, rgba(255, 255, 255, 0.94), rgba(255, 255, 255, 0.78) 58%, rgba(255, 255, 255, 0.9));
  }

  &::after {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 1px;
    content: '';
    background: linear-gradient(90deg, transparent, rgba(66, 102, 79, 0.35), transparent);
  }
}

.hero-shell {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 260px;
  gap: 32px;
  align-items: end;
  max-width: 1180px;
  margin: 0 auto;
}

.hero-copy {
  animation: riseIn 0.72s ease both;

  .hero-kicker {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
    color: var(--course-primary);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0;
    text-transform: uppercase;

    &::before {
      width: 42px;
      height: 1px;
      content: '';
      background: var(--course-primary);
    }
  }

  h1 {
    margin: 0;
    color: var(--course-ink);
    font-size: clamp(38px, 6vw, 76px);
    font-weight: 800;
    line-height: 1.04;
    letter-spacing: 0;
  }

  p {
    max-width: 620px;
    margin: 20px 0 0;
    color: var(--course-muted);
    font-size: 17px;
    line-height: 1.9;
  }
}

.hero-panel {
  position: relative;
  min-height: 198px;
  padding: 28px;
  overflow: hidden;
  border: 1px solid rgba(66, 102, 79, 0.22);
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 26px 60px rgba(36, 62, 45, 0.12);
  backdrop-filter: blur(16px);
  animation: riseIn 0.72s ease 0.12s both;

  &::after {
    position: absolute;
    right: -44px;
    bottom: -58px;
    width: 150px;
    height: 150px;
    content: '';
    border: 1px solid rgba(66, 102, 79, 0.16);
    transform: rotate(28deg);
  }
}

.panel-mark {
  color: var(--course-primary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0;
}

.panel-number {
  margin-top: 18px;
  color: var(--course-primary-deep);
  font-size: 58px;
  font-weight: 800;
  line-height: 1;
}

.panel-label {
  margin-top: 8px;
  color: var(--course-muted);
  font-size: 15px;
}

.filter-band {
  position: sticky;
  top: 0;
  z-index: 8;
  padding: 18px 24px;
  background: rgba(255, 255, 255, 0.9);
  border-bottom: 1px solid var(--course-line);
  backdrop-filter: blur(14px);
}

.filter-shell {
  max-width: 1180px;
  margin: 0 auto;

  :deep(.ant-input-affix-wrapper),
  :deep(.ant-select-selector) {
    min-height: 46px;
    border-color: var(--course-line) !important;
    border-radius: 0 !important;
    background: #ffffff !important;
    box-shadow: none !important;
  }

  :deep(.ant-input-affix-wrapper-focused),
  :deep(.ant-input-affix-wrapper:hover),
  :deep(.ant-select-focused .ant-select-selector),
  :deep(.ant-select-selector:hover) {
    border-color: var(--course-primary) !important;
  }

  :deep(.ant-select-selection-placeholder),
  :deep(.ant-input::placeholder) {
    color: #8b978f;
  }

  :deep(.ant-btn-primary) {
    height: 46px;
    border: none;
    border-radius: 0;
    background: var(--course-primary);
    box-shadow: 0 12px 26px rgba(66, 102, 79, 0.2);
    transition: transform 0.25s ease, background 0.25s ease, box-shadow 0.25s ease;

    &:hover {
      background: var(--course-primary-deep);
      box-shadow: 0 16px 32px rgba(66, 102, 79, 0.26);
      transform: translateY(-1px);
    }

    i {
      margin-right: 8px;
    }
  }
}

.course-main {
  max-width: 1180px;
  min-height: 420px;
  margin: 0 auto;
  padding: 42px 24px 8px;
}

.course-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.course-card {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 238px;
  padding: 22px;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid var(--course-line);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 42px rgba(31, 47, 37, 0.06);
  transition: transform 0.28s ease, border-color 0.28s ease, box-shadow 0.28s ease;
  animation: cardIn 0.58s ease both;

  &::before {
    position: absolute;
    inset: 0 0 auto;
    height: 3px;
    content: '';
    background: linear-gradient(90deg, var(--course-primary), rgba(66, 102, 79, 0.12));
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.28s ease;
  }

  &::after {
    position: absolute;
    right: 20px;
    bottom: 62px;
    width: 86px;
    height: 86px;
    content: '';
    border: 1px solid rgba(66, 102, 79, 0.1);
    transform: rotate(45deg);
    transition: transform 0.36s ease, opacity 0.36s ease;
  }

  &:hover {
    border-color: rgba(66, 102, 79, 0.48);
    box-shadow: 0 26px 58px rgba(31, 47, 37, 0.12);
    transform: translateY(-6px);

    &::before {
      transform: scaleX(1);
    }

    &::after {
      opacity: 0.85;
      transform: rotate(45deg) translate(-8px, -8px);
    }

    .card-action i {
      transform: translateX(4px);
    }
  }
}

.card-index {
  color: rgba(66, 102, 79, 0.18);
  font-size: 42px;
  font-weight: 800;
  line-height: 1;
}

.card-body {
  position: relative;
  z-index: 1;
  flex: 1;
  margin-top: 18px;
}

.card-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--course-primary);
  font-size: 13px;
  font-weight: 700;

  :deep(.ant-tag) {
    margin-right: 0;
    border-radius: 0;
  }
}

.card-body h3 {
  display: -webkit-box;
  min-height: 58px;
  margin: 14px 0 18px;
  overflow: hidden;
  color: var(--course-ink);
  font-size: 20px;
  font-weight: 700;
  line-height: 1.45;
  letter-spacing: 0;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.course-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
  color: var(--course-muted);
  font-size: 14px;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 7px;

  i {
    color: var(--course-primary);
  }
}

.card-action {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 22px;
  padding-top: 16px;
  color: var(--course-primary);
  font-weight: 700;
  border-top: 1px solid var(--course-line);

  i {
    transition: transform 0.25s ease;
  }
}

.pagination-section {
  display: flex;
  justify-content: center;
  max-width: 1180px;
  margin: 0 auto;
  padding: 30px 24px 56px;

  :deep(.ant-pagination-item),
  :deep(.ant-pagination-prev .ant-pagination-item-link),
  :deep(.ant-pagination-next .ant-pagination-item-link) {
    border-color: var(--course-line);
    border-radius: 0;
  }

  :deep(.ant-pagination-item-active) {
    border-color: var(--course-primary);
    background: var(--course-primary);
  }

  :deep(.ant-pagination-item-active a) {
    color: #fff;
  }

  :deep(.ant-pagination-item:hover),
  :deep(.ant-pagination-prev:hover .ant-pagination-item-link),
  :deep(.ant-pagination-next:hover .ant-pagination-item-link) {
    border-color: var(--course-primary);
  }

  :deep(.ant-pagination-item:hover a),
  :deep(.ant-pagination-prev:hover .ant-pagination-item-link),
  :deep(.ant-pagination-next:hover .ant-pagination-item-link) {
    color: var(--course-primary);
  }
}

:deep(.ant-empty) {
  padding: 72px 0;
}

@keyframes riseIn {
  from {
    opacity: 0;
    transform: translateY(22px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes cardIn {
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
  .hero-shell {
    grid-template-columns: 1fr;
  }

  .hero-panel {
    max-width: 360px;
  }

  .course-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .course-hero {
    padding: 52px 18px 28px;
  }

  .hero-copy h1 {
    font-size: 42px;
  }

  .hero-copy p {
    font-size: 15px;
  }

  .filter-band {
    position: relative;
    padding: 16px 18px;
  }

  .course-main {
    padding: 28px 18px 8px;
  }

  .course-grid {
    grid-template-columns: 1fr;
  }

  .course-card {
    min-height: 218px;
  }

  .pagination-section {
    padding: 24px 18px 42px;
  }
}
</style>
