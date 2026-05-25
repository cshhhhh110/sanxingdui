<template>
  <div class="shop-container">
    <!-- ================= 现代化大气 Hero 头部 ================= -->
    <header class="shop-banner">
      <div class="banner-inner">
        <div class="banner-content">
          <div class="brand-badge">
            <i class="fas fa-history"></i>
            <span>Sanxingdui Creative Store</span>
          </div>
          <h1 class="banner-title">文创商城</h1>
          <p class="banner-desc">
            把古蜀纹样、青铜意象与当代生活器物重新编织，让每一件文创都带着可被日常触摸的文明记忆。
          </p>
        </div>
        <div class="banner-stats">
          <div class="stats-box">
            <span class="stats-label">精选在售</span>
            <span class="stats-number">{{ total || productList.length }}</span>
            <span class="stats-unit">件文创好物</span>
          </div>
        </div>
      </div>
    </header>

    <!-- ================= 主体双栏联动布局 ================= -->
    <div class="shop-layout">
      <!-- 左侧：独立、高质感的筛选控制面板 -->
      <aside class="filter-sidebar">
        <div class="sidebar-sticky-wrapper">
          <!-- 搜索框 -->
          <div class="sidebar-widget">
            <h3 class="widget-title">商品搜索</h3>
            <a-input-search
                v-model:value="searchKeyword"
                placeholder="输入关键词..."
                size="large"
                allow-clear
                @search="handleSearch"
                @keyup.enter="handleSearch"
            />
          </div>

          <!-- 分类群组 -->
          <div class="sidebar-widget">
            <h3 class="widget-title">物品分类</h3>
            <div class="category-list">
              <button
                  class="category-btn"
                  :class="{ active: selectedCategoryId === null }"
                  type="button"
                  @click="handleCategoryFilter(null)"
              >
                <i class="fas fa-th-large"></i>
                <span>全部商品</span>
              </button>
              <button
                  v-for="category in categoryList"
                  :key="category.id"
                  class="category-btn"
                  :class="{ active: selectedCategoryId === category.id }"
                  type="button"
                  @click="handleCategoryFilter(category.id)"
              >
                <i class="fas fa-tags"></i>
                <span>{{ category.name }}</span>
              </button>
            </div>
          </div>

          <!-- 高级过滤条件组合 -->
          <div class="sidebar-widget">
            <h3 class="widget-title">高级筛选</h3>
            <div class="filter-group">
              <div class="filter-item">
                <label>价格区间</label>
                <a-select
                    v-model:value="priceRange"
                    placeholder="全部价格"
                    allow-clear
                    style="width: 100%"
                    @change="handleFilter"
                >
                  <a-select-option value="">全部价格</a-select-option>
                  <a-select-option value="0-50">¥0 - ¥50</a-select-option>
                  <a-select-option value="50-100">¥50 - ¥100</a-select-option>
                  <a-select-option value="100-200">¥100 - ¥200</a-select-option>
                  <a-select-option value="200-500">¥200 - ¥500</a-select-option>
                  <a-select-option value="500+">¥500+</a-select-option>
                </a-select>
              </div>

              <div class="filter-item">
                <label>排序方式</label>
                <a-select
                    v-model:value="sortBy"
                    style="width: 100%"
                    @change="handleFilter"
                >
                  <a-select-option value="create_time">最新上架</a-select-option>
                  <a-select-option value="price_asc">价格从低到高</a-select-option>
                  <a-select-option value="price_desc">价格从高到低</a-select-option>
                </a-select>
              </div>

              <div class="filter-item checkbox-item">
                <a-checkbox v-model:checked="onlyInStock" @change="handleFilter">
                  仅显示有货商品
                </a-checkbox>
              </div>
            </div>
          </div>

          <!-- 重置按钮 -->
          <button class="btn-reset-all" type="button" @click="handleReset">
            <i class="fas fa-undo-alt"></i> 重置所有筛选
          </button>
        </div>
      </aside>

      <!-- 右侧：商品列表流与分页 -->
      <main class="shop-main">
        <!-- 加载骨架屏 -->
        <div v-if="loading" class="gallery-loading">
          <div v-for="n in 8" :key="n" class="skeleton-item">
            <a-skeleton-image style="width: 100%; height: 260px;" />
            <div class="skeleton-pad">
              <a-skeleton active :paragraph="{ rows: 2 }" />
            </div>
          </div>
        </div>

        <!-- 商品网格网 -->
        <div v-else-if="productList.length > 0" class="gallery-grid">
          <div
              v-for="(product, index) in productList"
              :key="product.id"
              class="luxury-card"
              :style="{ animationDelay: `${Math.min(index, 11) * 60}ms` }"
              @click="handleProductClick(product.id)"
          >
            <!-- 顶置视觉区 -->
            <div class="card-visual">
              <img
                  v-if="product.coverFilePath"
                  :src="product.coverFilePath"
                  :alt="product.title"
                  loading="lazy"
              />
              <div v-else class="card-visual-none">
                <i class="fas fa-compass"></i>
                <span>文明馆藏重构中</span>
              </div>

              <!-- 核心状态徽章 -->
              <div v-if="product.stock <= 0" class="badge-status badge-out">
                已售罄
              </div>
              <div v-else-if="product.stock < 10" class="badge-status badge-low">
                限量 仅剩{{ product.stock }}件
              </div>

              <!-- 悬浮触发遮罩 -->
              <div class="visual-overlay">
                <span class="explore-text">品鉴详情</span>
                <div class="explore-circle">
                  <i class="fas fa-chevron-right"></i>
                </div>
              </div>
            </div>

            <!-- 底置内容区 -->
            <!-- 底置内容区 -->
            <div class="card-details">
              <!-- 第一层：双视角标签组 -->
              <div class="detail-badge-row">
                <span class="meta-tag">{{ product.categoryName || '文创精选' }}</span>

                <!-- 动态微标签：根据库存状态变换 -->
                <span v-if="product.stock <= 0" class="mini-status-tag out">已售罄</span>
                <span v-else-if="product.stock < 10" class="mini-status-tag warning">仅余 {{ product.stock }} 件</span>
                <span v-else class="mini-status-tag normal">馆藏精选</span>
              </div>

              <!-- 第二层：标题与副标题 -->
              <h3 class="detail-title" :title="product.title">
                {{ product.title }}
              </h3>

              <p v-if="product.subtitle" class="detail-subtitle">
                {{ product.subtitle }}
              </p>

              <!-- 中间美学分割线 -->
              <div class="card-divider"></div>

              <!-- 第三层：价格、原价（模拟）、操作区并列 -->
              <div class="detail-action-block">
                <div class="price-wrapper">
                  <div class="main-price">
                    <span class="currency">¥</span>
                    <span class="amount">{{ product.price }}</span>
                  </div>
                  <!-- 额外增设一个温润的伪原价，让视觉更饱满（可选） -->
                  <span class="mock-original-price">¥{{ (product.price * 1.2).toFixed(0) }}</span>
                </div>

                <a-button
                    type="primary"
                    class="action-buy-btn"
                    :class="{ 'btn-disabled': product.stock <= 0 }"
                    :disabled="product.stock <= 0"
                    @click.stop="handleBuyNow(product)"
                >
                  <i class="fas" :class="product.stock > 0 ? 'fa-shopping-bag' : 'fa-box'"></i>
                  <span>{{ product.stock > 0 ? '立即迎请' : '售罄' }}</span>
                </a-button>
              </div>
            </div>


          </div>
        </div>

        <!-- 极致空状态 -->
        <div v-else class="gallery-empty">
          <div class="empty-art">
            <i class="fas fa-box-open"></i>
          </div>
          <h3>未寻获相关器物</h3>
          <p>变换筛选条件，或许能发现其他古蜀遗珍</p>
          <a-button type="primary" size="large" @click="handleReset">回到全部商品</a-button>
        </div>

        <!-- 底部分页 -->
        <div v-if="total > 0" class="gallery-pagination">
          <a-pagination
              v-model:current="currentPage"
              v-model:pageSize="pageSize"
              :total="total"
              :page-size-options="['12', '24', '48']"
              show-size-changer
              show-total
              @change="handlePageChange"
              @showSizeChange="handleSizeChange"
          >
            <template #buildOptionText="props">
              <span>{{ props.value }} 件/页</span>
            </template>
          </a-pagination>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { getProductPage } from '@/api/ShopProductApi'
import { getEnabledCategories } from '@/api/ShopCategoryApi'
import { useUserStore } from '@/store/user'
import '@/styles/scroll-header.css'

// ========== 路由 (原封不动) ==========
const router = useRouter()
const route = useRoute()

// ========== 响应式数据 (原封不动) ==========
const loading = ref(false)
const productList = ref([])
const categoryList = ref([])
const searchKeyword = ref('')
const selectedCategoryId = ref(null)
const priceRange = ref('')
const sortBy = ref('create_time')
const onlyInStock = ref(false)
const currentPage = ref(1)
const pageSize = ref(12)
const total = ref(0)

// ========== 生命周期 (原封不动) ==========
onMounted(() => {
  applyRouteQuery()
  fetchCategories()
  fetchProducts()
})

watch(
  () => [route.query.keyword, route.query.search, route.query.category, route.query.mode],
  () => {
    applyRouteQuery()
    fetchProducts()
  }
)

// ========== 方法逻辑 (原封不动) ==========
const applyRouteQuery = () => {
  searchKeyword.value = String(route.query.keyword || route.query.search || route.query.category || '')
  selectedCategoryId.value = null
  currentPage.value = 1
}

const fetchCategories = () => {
  getEnabledCategories({
    onSuccess: (res) => {
      categoryList.value = res || []
    },
    onError: (error) => {
      message.error('获取分类列表失败：' + error.message)
    }
  })
}

const fetchProducts = () => {
  loading.value = true

  const params = {
    page: currentPage.value,
    pageSize: pageSize.value,
    title: searchKeyword.value || null,
    categoryId: selectedCategoryId.value,
    status: 1,
    hasStock: onlyInStock.value ? true : null
  }

  if (priceRange.value) {
    if (priceRange.value === '500+') {
      params.minPrice = 500
    } else {
      const [min, max] = priceRange.value.split('-')
      params.minPrice = parseFloat(min)
      params.maxPrice = parseFloat(max)
    }
  }

  if (sortBy.value === 'price_asc') {
    params.sortField = 'price'
    params.sortOrder = 'asc'
  } else if (sortBy.value === 'price_desc') {
    params.sortField = 'price'
    params.sortOrder = 'desc'
  } else {
    params.sortField = 'create_time'
    params.sortOrder = 'desc'
  }

  getProductPage(params, {
    onSuccess: (res) => {
      productList.value = res.records || []
      total.value = res.total || 0
      loading.value = false
    },
    onError: (error) => {
      message.error('获取商品列表失败：' + error.message)
      loading.value = false
    }
  })
}

const handleSearch = () => {
  currentPage.value = 1
  fetchProducts()
}

const handleCategoryFilter = (categoryId) => {
  selectedCategoryId.value = categoryId
  currentPage.value = 1
  fetchProducts()
}

const handleFilter = () => {
  currentPage.value = 1
  fetchProducts()
}

const handleReset = () => {
  searchKeyword.value = ''
  selectedCategoryId.value = null
  priceRange.value = ''
  sortBy.value = 'create_time'
  onlyInStock.value = false
  currentPage.value = 1
  fetchProducts()
}

const handlePageChange = (page) => {
  currentPage.value = page
  fetchProducts()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleSizeChange = (current, size) => {
  currentPage.value = 1
  pageSize.value = size
  fetchProducts()
}

const handleProductClick = (id) => {
  router.push(`/shop/${id}`)
}

const handleBuyNow = (product) => {
  const userStore = useUserStore()
  if (!userStore.isLoggedIn) {
    message.warning('请先登录')
    router.push('/auth/login')
    return
  }

  if (product.stock <= 0) {
    message.warning('该商品已售罄')
    return
  }

  router.push({
    name: 'OrderConfirm',
    query: {
      productId: product.id,
      quantity: 1
    }
  })
}
</script>

<style scoped lang="less">
/* 设计统一变量定义 */
.shop-container {
  --brand-color: #42664f;
  --brand-deep: #2c4435;
  --brand-light: #f0f4f1;
  --text-main: #2b332e;
  --text-muted: #738077;
  --bg-main: #f8faf9;
  --border-color: #e3ebd6;
  --price-color: #c2523f;

  min-height: 100vh;
  background-color: var(--bg-main);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* ================= 1. HERO BANNER REWORK ================= */
.shop-banner {
  position: relative;
  padding: 100px 48px 60px;
  background:
      linear-gradient(135deg, rgba(44, 68, 53, 0.96) 0%, rgba(66, 102, 79, 0.85) 100%),
      url('@/assets/sanxingdui_08_huangjin_mianju.png') center / cover no-repeat;
  color: #ffffff;
  overflow: hidden;

  &::after {
    position: absolute;
    content: '';
    bottom: -20px;
    left: -10%;
    width: 120%;
    height: 40px;
    background: var(--bg-main);
    transform: rotate(1deg);
  }
}

.banner-inner {
  max-width: 1320px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 40px;
}

.banner-content {
  max-width: 720px;
  animation: fadeInDown 0.7s cubic-bezier(0.16, 1, 0.3, 1);

  .brand-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 40px;
    font-size: 12px;
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-bottom: 24px;
  }

  .banner-title {
    color: #ffffff;
    font-size: clamp(32px, 5vw, 52px);
    font-weight: 800;
    margin: 0 0 16px 0;
    letter-spacing: 2px;
  }

  .banner-desc {
    font-size: 16px;
    line-height: 1.8;
    color: rgba(255, 255, 255, 0.85);
    margin: 0;
  }
}

.banner-stats {
  animation: scaleIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both;

  .stats-box {
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    padding: 30px 40px;
    border-radius: 16px;
    text-align: center;
    min-width: 200px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);

    .stats-label {
      display: block;
      font-size: 13px;
      color: rgba(255, 255, 255, 0.7);
      margin-bottom: 8px;
    }
    .stats-number {
      display: block;
      font-size: 48px;
      font-weight: 800;
      line-height: 1;
      color: #ffffff;
    }
    .stats-unit {
      display: block;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.5);
      margin-top: 6px;
    }
  }
}

/* ================= 2. LAYOUT: TWO-COLUMNS ================= */
.shop-layout {
  max-width: 1320px;
  margin: 0 auto;
  padding: 40px 24px 80px;
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 32px;
  align-items: start;
}

/* ================= 3. SIDEBAR STYLES ================= */
.filter-sidebar {
  .sidebar-sticky-wrapper {
    position: sticky;
    top: 24px;
    display: grid;
    gap: 24px;
  }
}

.sidebar-widget {
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(140, 160, 148, 0.06);
  border: 1px solid rgba(66, 102, 79, 0.05);

  .widget-title {
    font-size: 15px;
    font-weight: 700;
    color: var(--text-main);
    margin-bottom: 16px;
    padding-left: 8px;
    border-left: 3px solid var(--brand-color);
    line-height: 1;
  }
}

/* 侧边搜索重构样式 */
:deep(.ant-input-search) {
  .ant-input {
    border-radius: 8px 0 0 8px !important;
    border-color: #d1ded5;
    &:hover, &:focus { border-color: var(--brand-color); }
  }
  .ant-input-search-button {
    background-color: var(--brand-color) !important;
    border-color: var(--brand-color) !important;
    border-radius: 0 8px 8px 0 !important;
  }
}

/* 侧边分类组件重构 */
.category-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.category-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  font-size: 14px;
  color: var(--text-muted);
  transition: all 0.25s ease;

  i { font-size: 14px; opacity: 0.7; }

  &:hover {
    background: var(--brand-light);
    color: var(--brand-color);
  }

  &.active {
    background: var(--brand-color);
    color: #ffffff;
    font-weight: 600;
    box-shadow: 0 8px 16px rgba(66, 102, 79, 0.15);
  }
}

/* 侧边筛选细节调整 */
.filter-group {
  display: grid;
  gap: 16px;

  .filter-item {
    display: grid;
    gap: 8px;
    label {
      font-size: 12px;
      color: var(--text-muted);
      font-weight: 500;
    }
  }

  .checkbox-item {
    padding-top: 6px;
  }
}

:deep(.ant-select) {
  .ant-select-selector {
    border-radius: 8px !important;
    border-color: #d1ded5 !important;
  }
  &.ant-select-focused .ant-select-selector {
    border-color: var(--brand-color) !important;
    box-shadow: 0 0 0 2px rgba(66, 102, 79, 0.1) !important;
  }
}

:deep(.ant-checkbox-checked .ant-checkbox-inner) {
  background-color: var(--brand-color);
  border-color: var(--brand-color);
}

.btn-reset-all {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 46px;
  background: #ffffff;
  border: 1px dashed #c0cfc5;
  border-radius: 10px;
  color: var(--text-muted);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--brand-color);
    color: var(--brand-color);
    background: var(--brand-light);
  }
}

/* ================= 4. MAIN GALLERY STYLES ================= */
.shop-main {
  min-height: 600px;
}

/* 加载骨架屏 */
.gallery-loading {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 24px;

  .skeleton-item {
    background: #ffffff;
    border-radius: 12px;
    overflow: hidden;
    .skeleton-pad { padding: 16px; }
  }
}

/* 商品卡片网格 */
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(240px, 1fr));
  gap: 24px;
}

/* 现代化美学卡片 */
.luxury-card {
  background: #ffffff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(140, 160, 148, 0.05);
  border: 1px solid rgba(66, 102, 79, 0.04);
  cursor: pointer;
  position: relative;
  display: flex;
  flex-direction: column;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 22px 40px rgba(44, 68, 53, 0.12);

    .card-visual img { transform: scale(1.06); }
    .visual-overlay { opacity: 1; }
    .explore-circle { transform: scale(1) rotate(0deg); }
  }
}

/* 卡片视觉区 */
.card-visual {
  position: relative;
  height: 260px;
  background: #f4f7f5;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .card-visual-none {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #b0beb5;
    gap: 12px;
    i { font-size: 36px; }
    span { font-size: 13px; font-weight: 500; }
  }
}

/* 状态徽章 */
.badge-status {
  position: absolute;
  top: 14px;
  left: 14px;
  z-index: 2;
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}
.badge-out {
  background: #4a544e;
  color: #ffffff;
}
.badge-low {
  background: var(--price-color);
  color: #ffffff;
}

/* 视觉悬浮联动 */
.visual-overlay {
  position: absolute;
  inset: 0;
  background: rgba(44, 68, 53, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  opacity: 0;
  transition: opacity 0.35s ease;
  z-index: 3;

  .explore-text {
    color: #ffffff;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 2px;
  }
  .explore-circle {
    width: 40px;
    height: 40px;
    background: #ffffff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--brand-color);
    transform: scale(0.7) rotate(-45deg);
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
}

/* 卡片详情区 *//* ================= 重构后的商品盒子内部细节 ================= */
.card-details {
  padding: 22px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  background: #ffffff;
  position: relative;

  // 1. 标签整行
  .detail-badge-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    .meta-tag {
      font-size: 11px;
      color: var(--brand-color);
      font-weight: 700;
      background: var(--brand-light);
      padding: 3px 10px;
      border-radius: 4px;
      letter-spacing: 0.5px;
    }

    .mini-status-tag {
      font-size: 11px;
      font-weight: 500;
      padding: 2px 6px;
      border-radius: 4px;

      &.normal {
        color: #a0b0a5;
        background: #f4f7f5;
      }
      &.warning {
        color: var(--price-color);
        background: rgba(194, 82, 63, 0.08);
        font-weight: 600;
      }
      &.out {
        color: #999;
        background: #eee;
        text-decoration: line-through;
      }
    }
  }

  // 2. 标题与副标题
  .detail-title {
    font-size: 17px;
    font-weight: 700;
    color: var(--text-main);
    line-height: 1.4;
    margin: 0 0 6px 0;
    transition: color 0.2s ease;

    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1; // 极简单行，如需两行可改为 2
    overflow: hidden;

    &:hover {
      color: var(--brand-color);
    }
  }

  .detail-subtitle {
    font-size: 13px;
    color: var(--text-muted);
    margin: 0 0 14px 0;
    line-height: 1.5;

    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    min-height: 38px; // 保持卡片高度整齐对齐
  }

  // 3. 盒内艺术分割线
  .card-divider {
    height: 1px;
    background: linear-gradient(90deg, #e3ebd6 0%, rgba(227, 235, 214, 0.2) 100%);
    margin-bottom: 16px;
  }

  // 4. 底部购买联动区块
  .detail-action-block {
    margin-top: auto; // 强制推至盒子最底部
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;

    // 价格组合
    .price-wrapper {
      display: flex;
      flex-direction: column; // 上下双层价格显示，更有电商质感

      .main-price {
        display: flex;
        align-items: baseline;
        color: var(--price-color);
        font-weight: 800;

        .currency {
          font-size: 14px;
          margin-right: 2px;
        }
        .amount {
          font-size: 24px;
          line-height: 1;
        }
      }

      .mock-original-price {
        font-size: 11px;
        color: #b8c4bc;
        text-decoration: line-through;
        margin-top: 2px;
        padding-left: 2px;
      }
    }
  }
}

// 5. 购买按钮深度定制
:deep(.action-buy-btn) {
  height: 40px !important;
  border-radius: 8px !important;
  background-color: var(--brand-color) !important;
  border: none !important;
  padding: 0 18px !important;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #ffffff;
  letter-spacing: 0.5px;
  box-shadow: 0 6px 14px rgba(66, 102, 79, 0.15) !important;
  transition: all 0.25s ease !important;

  i {
    font-size: 12px;
  }

  &:hover {
    background-color: var(--brand-deep) !important;
    transform: translateY(-1px);
    box-shadow: 0 8px 20px rgba(44, 68, 53, 0.25) !important;
  }

  /* 售罄置灰样式 */
  &.btn-disabled, &[disabled] {
    background-color: #f0f3f1 !important;
    color: #a3b1a9 !important;
    box-shadow: none !important;
    transform: none !important;
    cursor: not-allowed;
  }
}

/* ================= 5. EMPTY STATE REWORK ================= */
.gallery-empty {
  grid-column: 1 / -1;
  background: #ffffff;
  border-radius: 16px;
  text-align: center;
  padding: 80px 40px;
  border: 1px dashed #ccd9cf;

  .empty-art {
    width: 80px;
    height: 80px;
    background: var(--brand-light);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
    color: var(--brand-color);
    font-size: 32px;
  }

  h3 { font-size: 18px; font-weight: 700; color: var(--text-main); margin-bottom: 8px; }
  p { color: var(--text-muted); margin-bottom: 24px; }

  :deep(.ant-btn-primary) {
    background-color: var(--brand-color);
    border-color: var(--brand-color);
    border-radius: 8px;
    &:hover { background-color: var(--brand-deep); }
  }
}

/* ================= 6. PAGINATION REWORK ================= */
.gallery-pagination {
  margin-top: 48px;
  display: flex;
  justify-content: center;

  :deep(.ant-pagination-item) {
    border-radius: 8px;
    border-color: #d1ded5;
    a { color: var(--text-muted); }
    &:hover { border-color: var(--brand-color); a { color: var(--brand-color); } }
  }
  :deep(.ant-pagination-item-active) {
    background-color: var(--brand-color);
    border-color: var(--brand-color);
    a { color: #ffffff !important; }
  }
  :deep(.ant-pagination-prev .ant-pagination-item-link),
  :deep(.ant-pagination-next .ant-pagination-item-link) {
    border-radius: 8px;
    border-color: #d1ded5;
  }
}

/* ================= 7. TIMING & ANIMATIONS ================= */
@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ================= 8. RESPONSIVE MEDIA ================= */
@media (max-width: 1200px) {
  .gallery-grid { grid-template-columns: repeat(2, minmax(240px, 1fr)); }
}

@media (max-width: 992px) {
  .shop-layout {
    grid-template-columns: 1fr; /* 平铺为单栏结构 */
  }
  .filter-sidebar .sidebar-sticky-wrapper {
    position: relative;
    top: 0;
  }
}

@media (max-width: 768px) {
  .shop-banner { padding: 60px 24px 40px; text-align: center; }
  .banner-inner { flex-direction: column; gap: 24px; }
  .banner-stats { width: 100%; .stats-box { min-width: auto; } }
  .gallery-grid { grid-template-columns: 1fr; }
}
</style>
