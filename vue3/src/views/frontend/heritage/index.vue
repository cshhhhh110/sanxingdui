<template>
  <div class="heritage-list-page">
    <section class="heritage-hero">
      <div class="hero-copy">
        <span class="hero-kicker">COLLECTION LIST</span>
        <h1 class="hero-title">古蜀瑰宝</h1>
        <p class="hero-subtitle">沉睡数千年，一醒惊天下。循着青铜、玉石与金器的纹理，重新走近三星堆文明。</p>
        <div class="hero-metrics">
          <span>{{ total || 0 }} 件馆藏</span>
          <span>{{ HERITAGE_CATEGORIES.length }} 个分类</span>
          <span>数字化展示</span>
        </div>
      </div>

      <div class="hero-search-card">
        <span class="search-label">快速检索</span>
        <a-input-search
            v-model:value="searchKeyword"
            placeholder="搜索作品名称、类别、地区..."
            size="large"
            allow-clear
            @search="handleSearch"
        />
      </div>
    </section>

    <section class="heritage-filter-panel">
      <div class="filter-tabs">
        <a-button
            v-for="category in ['全部', ...HERITAGE_CATEGORIES]"
            :key="category"
            :type="selectedCategory === category ? 'primary' : 'default'"
            @click="handleCategoryFilter(category)"
        >
          {{ category }}
        </a-button>
      </div>

      <div class="filter-right">
        <a-select
            v-model:value="selectedRegion"
            placeholder="地区"
            allow-clear
            class="select-item"
            @change="handleFilter"
        >
          <a-select-option value="">全部地区</a-select-option>
          <a-select-option
              v-for="region in regionList"
              :key="region"
              :value="region"
          >
            {{ region }}
          </a-select-option>
        </a-select>

        <a-select
            v-model:value="sortBy"
            class="select-item"
            @change="handleFilter"
        >
          <a-select-option value="publish_time">最新发布</a-select-option>
          <a-select-option value="create_time">最新创建</a-select-option>
          <a-select-option value="title">标题排序</a-select-option>
        </a-select>
      </div>
    </section>

    <section class="heritage-showcase">
      <div class="section-heading">
        <span>Archive Gallery</span>
        <h2>数字馆藏清单</h2>
      </div>

      <div v-if="loading" class="grid-container">
        <a-skeleton v-for="n in 8" :key="n" active />
      </div>

      <div v-else-if="heritageList.length > 0" class="grid-container">
        <article
            v-for="item in heritageList"
            :key="item.id"
            class="heritage-item-card"
            @click="handleItemClick(item)"
        >
          <div class="image-wrapper">
            <img :src="item.coverImage" :alt="item.title" />
            <div class="category-tag">{{ item.category }}</div>
          </div>

          <div class="card-content">
            <h3 class="card-title">{{ item.title }}</h3>
            <div class="region">{{ item.region }}</div>
            <p class="summary">{{ item.summary }}</p>
          </div>
        </article>
      </div>

      <div v-else class="empty-state">
        <p>暂无相关作品</p>
      </div>
    </section>

    <div class="pagination-section">
      <a-pagination
          v-model:current="currentPage"
          v-model:pageSize="pageSize"
          :total="total"
          show-size-changer
          @change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { getHeritageItemPage, HERITAGE_CATEGORIES } from '@/api/HeritageApi'

const router = useRouter()
const loading = ref(false)
const searchKeyword = ref('')
const selectedCategory = ref('全部')
const selectedRegion = ref('')
const sortBy = ref('publish_time')
const currentPage = ref(1)
const pageSize = ref(12)
const heritageList = ref([])
const total = ref(0)
const regionList = ref([
  '北京',
  '上海',
  '广东',
  '江苏',
  '浙江',
  '四川',
  '陕西',
  '河南'
])

const searchParams = computed(() => ({
  currentPage: currentPage.value,
  size: pageSize.value,
  title: searchKeyword.value,
  category: selectedCategory.value === '全部' ? '' : selectedCategory.value,
  region: selectedRegion.value,
  status: 2,
  orderBy: sortBy.value,
  orderDirection: 'desc'
}))

function fetchHeritageList() {
  loading.value = true
  getHeritageItemPage(searchParams.value, {
    onSuccess: (res) => {
      heritageList.value = res.records || []
      total.value = res.total || 0
      loading.value = false
    },
    onError: () => {
      message.error('加载失败')
      loading.value = false
    }
  })
}

function handleSearch() {
  currentPage.value = 1
  fetchHeritageList()
}

function handleCategoryFilter(category) {
  selectedCategory.value = category
  currentPage.value = 1
  fetchHeritageList()
}

function handleFilter() {
  currentPage.value = 1
  fetchHeritageList()
}

function handleCurrentChange() {
  fetchHeritageList()
}

function handleItemClick(item) {
  router.push(`/heritage/${item.id}`)
}

onMounted(fetchHeritageList)
</script>

<style scoped>
/* ==========================================================================
   1. 基础布局与背景 (New Chinese Aesthetics)
   ========================================================================== */
.heritage-list-page {
  min-height: 100vh;
  overflow: hidden;
  /* 融合青铜绿与古蜀金的高级环境光 */
  background:
      radial-gradient(circle at 5% 5%, rgba(66, 102, 79, 0.15), transparent 35%),
      radial-gradient(circle at 92% 5%, rgba(198, 165, 105, 0.22), transparent 30%),
      linear-gradient(180deg, #f8faf6 0%, #f3f7f4 50%, #ffffff 100%);
  color: #1e3327;
  font-feature-settings: "chws" 1;
}

/* 统一响应式容器 */
.heritage-hero,
.heritage-filter-panel,
.heritage-showcase,
.pagination-section {
  width: min(1200px, calc(100% - 48px));
  margin-inline: auto;
}

/* ==========================================================================
   2. 英雄区 (Hero Section)
   ========================================================================== */
.heritage-hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 420px;
  gap: 48px;
  align-items: end;
  padding: 88px 0 36px;
}

/* 背景几何线圈装饰（金沙太阳神鸟隐喻） */
.heritage-hero::after {
  content: "";
  position: absolute;
  right: 360px;
  bottom: 20px;
  width: 180px;
  height: 180px;
  border: 1px dashed rgba(198, 165, 105, 0.25);
  border-radius: 50%;
  pointer-events: none;
  animation: spin 120s linear infinite;
}

@keyframes spin { 100% { transform: rotate(360deg); } }

.hero-copy {
  position: relative;
  z-index: 1;
}

.hero-kicker,
.section-heading span,
.search-label {
  display: inline-flex;
  color: #b59247;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.28em;
  text-transform: uppercase;
}

.hero-title {
  margin: 16px 0 20px;
  color: #2c4c38;
  font-size: clamp(48px, 7vw, 92px);
  font-weight: 900;
  line-height: 1.05;
  letter-spacing: -0.04em;
  font-family: "Noto Serif SC", "Source Han Serif SC", "PT Serif", serif;
}

.hero-subtitle {
  max-width: 600px;
  margin: 0;
  color: #516357;
  font-size: 16px;
  line-height: 1.85;
  font-weight: 400;
}

.hero-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 32px;
}

.hero-metrics span {
  padding: 6px 16px;
  border: 1px solid rgba(66, 102, 79, 0.12);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(4px);
  color: #385d45;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(66, 102, 79, 0.03);
}

/* 搜索卡片 */
.hero-search-card {
  position: relative;
  z-index: 1;
  padding: 28px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 24px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(244, 248, 245, 0.85));
  backdrop-filter: blur(16px);
  box-shadow:
      0 24px 60px rgba(35, 57, 44, 0.08),
      0 4px 12px rgba(35, 57, 44, 0.02);
}

.search-label {
  margin-bottom: 14px;
  letter-spacing: 0.15em;
}

/* ==========================================================================
   3. 过滤面板 (Filter Panel)
   ========================================================================== */
.heritage-filter-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-top: 16px;
  padding: 14px 20px;
  border: 1px solid rgba(66, 102, 79, 0.08);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  box-shadow: 0 12px 30px rgba(66, 102, 79, 0.04);
}

.filter-tabs {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-right {
  display: flex;
  flex: 0 0 auto;
  gap: 12px;
}

.select-item {
  width: 140px;
}

/* ==========================================================================
   4. 展厅网格与卡片 (Showcase Grid & Cards)
   ========================================================================== */
.heritage-showcase {
  padding: 48px 0 56px;
}

.section-heading {
  margin-bottom: 32px;
}

.section-heading h2 {
  margin: 6px 0 0;
  color: #1e3327;
  font-size: clamp(26px, 3.5vw, 40px);
  font-weight: 800;
  letter-spacing: -0.02em;
  font-family: "Noto Serif SC", "Source Han Serif SC", serif;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 28px;
}

/* 文物卡片骨架 */
.heritage-item-card {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(66, 102, 79, 0.08);
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 10px 24px rgba(66, 102, 79, 0.04);
  cursor: pointer;
  transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1),
  box-shadow 0.4s cubic-bezier(0.25, 1, 0.5, 1),
  border-color 0.4s ease;
}

.heritage-item-card:hover {
  border-color: rgba(66, 102, 79, 0.25);
  box-shadow: 0 24px 48px rgba(44, 76, 56, 0.12);
  transform: translateY(-6px);
}

/* Card Image Wrapper */
.image-wrapper {
  position: relative;
  height: 230px;
  overflow: hidden;
  background: #f0f4f1;
}

/* 遮罩，防止浅色图导致白色文字不可见 */
.image-wrapper::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0,0,0,0.1) 0%, transparent 40%);
  pointer-events: none;
}

.image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1);
}

.heritage-item-card:hover img {
  transform: scale(1.05);
}

/* 分类标签 */
.category-tag {
  position: absolute;
  left: 16px;
  top: 16px;
  z-index: 2;
  padding: 4px 12px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 999px;
  background: rgba(44, 76, 56, 0.85);
  backdrop-filter: blur(4px);
  color: #ffffff;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
}

/* Card Body */
.card-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 22px 20px 24px;
}

.card-title {
  margin: 0 0 10px;
  color: #1e3327;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.4;
  /* 确保长文本优雅换行 */
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  overflow: hidden;
}

.region {
  align-self: flex-start;
  margin-bottom: 14px;
  padding: 2px 10px;
  border-radius: 6px;
  background: rgba(66, 102, 79, 0.06);
  color: #385d45;
  font-size: 12px;
  font-weight: 600;
}

.summary {
  display: -webkit-box;
  min-height: 40px;
  margin: 0;
  overflow: hidden;
  color: #617568;
  font-size: 13px;
  line-height: 1.6;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

/* 空状态 */
.empty-state {
  padding: 96px 20px;
  border: 1px dashed rgba(66, 102, 79, 0.15);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.5);
  color: #798e80;
  text-align: center;
  font-size: 14px;
}

/* 分页区 */
.pagination-section {
  display: flex;
  justify-content: center;
  padding: 12px 0 64px;
}

/* ==========================================================================
   5. Ant Design Vue 组件样式深度覆盖 (:deep)
   ========================================================================== */
/* 输入框与选择器核心高宽重置 */
:deep(.ant-input-search .ant-input),
:deep(.ant-input-search .ant-input-group-addon .ant-btn),
:deep(.ant-select-selector) {
  min-height: 42px !important;
  height: 42px !important;
  border-color: rgba(66, 102, 79, 0.16) !important;
  border-radius: 12px !important;
  color: #1e3327 !important;
  font-weight: 500;
  font-size: 14px;
}

/* 解决 Select 垂直居中问题 */
:deep(.ant-select-selection-item) {
  line-height: 40px !important;
}

/* 悬浮与聚焦状态提升 */
:deep(.ant-input-search .ant-input:hover),
:deep(.ant-input-search .ant-input:focus),
:deep(.ant-select-selector:hover),
:deep(.ant-select-focused .ant-select-selector) {
  border-color: #385d45 !important;
  box-shadow: 0 0 0 3px rgba(66, 102, 79, 0.08) !important;
}

/* 按钮主色调覆盖 */
:deep(.ant-input-search-button),
:deep(.ant-btn-primary) {
  height: 42px !important;
  border-color: #385d45 !important;
  background: #385d45 !important;
  color: #ffffff !important;
  border-radius: 12px !important;
  box-shadow: 0 4px 12px rgba(56, 93, 69, 0.15);
}

/* 过滤页签分类按钮 */
:deep(.filter-tabs .ant-btn) {
  height: 36px !important;
  padding: 0 18px;
  border-radius: 999px !important;
  font-weight: 600;
  font-size: 13px;
  transition: all 0.25s ease;
}

:deep(.filter-tabs .ant-btn-default) {
  border-color: rgba(66, 102, 79, 0.12) !important;
  background: transparent;
  color: #516357;
}

:deep(.filter-tabs .ant-btn-default:hover) {
  border-color: #385d45 !important;
  color: #385d45 !important;
  background: rgba(66, 102, 79, 0.04);
}

:deep(.filter-tabs .ant-btn-primary) {
  border-color: #385d45 !important;
  background: #385d45 !important;
  box-shadow: 0 4px 10px rgba(56, 93, 69, 0.2);
}

/* 分页组件美化 */
:deep(.ant-pagination-item) {
  border-radius: 8px !important;
  border-color: rgba(66, 102, 79, 0.1) !important;
}

:deep(.ant-pagination-item-active) {
  border-color: #385d45 !important;
  background: #385d45 !important;
}

:deep(.ant-pagination-item-active a) {
  color: #ffffff !important;
}

:deep(.ant-pagination-item:hover),
:deep(.ant-pagination-prev:hover .ant-pagination-item-link),
:deep(.ant-pagination-next:hover .ant-pagination-item-link) {
  border-color: #385d45 !important;
}

:deep(.ant-pagination-item:hover a),
:deep(.ant-pagination-prev:hover .ant-pagination-item-link),
:deep(.ant-pagination-next:hover .ant-pagination-item-link) {
  color: #385d45 !important;
}

/* 骨架屏流动光效微调 */
:deep(.ant-skeleton-content .ant-skeleton-title),
:deep(.ant-skeleton-content .ant-skeleton-paragraph > li) {
  background: linear-gradient(90deg, #edf2ee 25%, #dae6dd 37%, #edf2ee 63%) !important;
}

/* ==========================================================================
   6. 完美响应式断点 (Media Queries)
   ========================================================================== */
@media (max-width: 1200px) {
  .heritage-hero {
    grid-template-columns: 1fr;
    gap: 32px;
    padding-top: 64px;
  }

  .hero-search-card {
    max-width: 100%;
  }

  .grid-container {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 20px;
  }
}

@media (max-width: 840px) {
  .heritage-filter-panel {
    align-items: stretch;
    flex-direction: column;
    padding: 16px;
    border-radius: 16px;
  }

  .filter-right {
    width: 100%;
  }

  .select-item {
    flex: 1;
    width: auto;
  }

  .grid-container {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .image-wrapper {
    height: 190px;
  }
}

@media (max-width: 560px) {
  .heritage-hero,
  .heritage-filter-panel,
  .heritage-showcase,
  .pagination-section {
    width: min(100% - 32px, 1200px);
  }

  .hero-title {
    font-size: 40px;
  }

  .hero-subtitle {
    font-size: 14px;
  }

  .filter-right {
    flex-direction: column;
    gap: 8px;
  }

  .grid-container {
    grid-template-columns: 1fr;
  }

  .hero-metrics {
    gap: 8px;
  }

  .hero-metrics span {
    font-size: 12px;
    padding: 4px 12px;
  }
}

:deep(.ant-input-wrapper .ant-input-group-addon) {
  inset-inline-start: 8px !important;
  position: relative; /* 确保定位生效 */
  z-index: 2;         /* 避免被输入框的边框遮挡 */
}


</style>
