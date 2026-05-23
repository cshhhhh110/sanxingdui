<template>
  <div class="product-detail-wrapper">
    <main class="product-detail-page">
      <!-- 极简高阶骨架 -->
      <div v-if="loading" class="loading-container">
        <a-skeleton :loading="true" active :paragraph="{ rows: 15 }" />
      </div>

      <div v-else-if="product" class="detail-container">
        <!-- 1. 精美微型流线面包屑 -->
        <nav class="breadcrumb-nav">
          <div class="breadcrumb-inner">
            <router-link to="/" class="nav-node home-node">
              <i class="fas fa-home"></i>
              <span>首页</span>
            </router-link>
            <span class="nav-arrow"><i class="fas fa-chevron-right"></i></span>
            <router-link to="/shop" class="nav-node">商城中心</router-link>
            <span class="nav-arrow"><i class="fas fa-chevron-right"></i></span>
            <span class="nav-current">{{ product.title }}</span>
          </div>
        </nav>

        <!-- 2. 全新纵向全画幅 Hero 区域区域 -->
        <header class="hero-showcase">
          <!-- 上层：全宽巨幕巨幅展台 -->
          <div class="cinema-gallery">
            <div class="stage-viewport">
              <img
                  v-if="mainImage"
                  :src="mainImage.filePath"
                  :alt="mainImage.originalName || product.title"
                  class="stage-img"
              />
              <div v-else class="stage-empty">
                <i class="fas fa-image"></i>
                <p>NO VISUAL ARCHIVE</p>
              </div>
            </div>

            <!-- 右侧悬浮垂直缩略轨道 -->
            <div v-if="imageList.length > 1" class="vertical-dock">
              <button
                  v-for="(image, index) in imageList"
                  :key="image.id"
                  class="dock-thumb"
                  :class="{ 'is-active': currentImageIndex === index }"
                  type="button"
                  @click="handleImageChange(index)"
              >
                <img :src="image.filePath" :alt="image.originalName" />
              </button>
            </div>
          </div>

          <!-- 下层：横向宽幅主控交易面板 -->
          <div class="console-panel">
            <div class="console-info">
              <div class="meta-headline">
                <span class="category-tag">{{ product.categoryName || '文创精选' }}</span>
                <span class="status-pill" :class="{ 'is-soldout': product.stock <= 0 }">
                  {{ product.stock > 0 ? '● 现货发售中' : '○ 已售罄' }}
                </span>
              </div>
              <h1 class="console-title">{{ product.title }}</h1>
              <p v-if="product.subtitle" class="console-subtitle">{{ product.subtitle }}</p>
            </div>

            <div class="console-trade">
              <div class="price-manifest">
                <span class="label">收藏定价</span>
                <div class="value">
                  <span class="unit">¥</span>
                  <span class="num">{{ product.price }}</span>
                </div>
              </div>

              <div class="interactive-dock">
                <!-- 数量控制器规范化 -->
                <div class="quantity-control-box">
                  <span class="control-label">数 量</span>
                  <a-input-number
                      v-model:value="quantity"
                      :min="1"
                      :max="product.stock"
                      :disabled="product.stock <= 0"
                      class="refined-stepper"
                  />
                  <span class="control-stock">库存 {{ product.stock }} 件</span>
                </div>

                <!-- 核心购买按钮 -->
                <button
                    class="action-buy-btn"
                    :disabled="product.stock <= 0"
                    @click="handleBuyNow"
                >
                  <i class="fas fa-bolt"></i>
                  <span>立即安全结算</span>
                </button>
              </div>
            </div>

            <!-- 服务承诺平铺横栏 -->
            <div class="console-footer-claims">
              <div class="claim-cell"><i class="fas fa-shield-alt"></i> 100% 正品渠道保证</div>
              <div class="claim-cell"><i class="fas fa-box"></i> 严密防震专业包装</div>
              <div class="claim-cell"><i class="fas fa-truck-moving"></i> 顺丰速运全境直达</div>
            </div>
          </div>
        </header>

        <!-- 3. 中部：参数与详情并行的全幅说明书 -->
        <section class="editorial-manifesto">
          <!-- 左侧固定的规范化规格面板 -->
          <div class="editorial-aside">
            <div class="specs-sticky-card">
              <div class="card-lead">TECHNICAL SPECS</div>
              <h3 class="card-head">规格参数</h3>
              <div class="specs-table">
                <div class="specs-item"><span class="k">商品编码</span><span class="v">{{ product.id }}</span></div>
                <div class="specs-item"><span class="k">商品分类</span><span class="v">{{ product.categoryName }}</span></div>
                <div class="specs-item"><span class="k">基准单价</span><span class="v">¥ {{ product.price }}</span></div>
                <div class="specs-item"><span class="k">当前库存</span><span class="v">{{ product.stock }} 件</span></div>
                <div class="specs-item"><span class="k">上架时间</span><span class="v">{{ product.createTime }}</span></div>
              </div>
            </div>
          </div>

          <!-- 右侧宽幅图文详情区 -->
          <div class="editorial-main">
            <h3 class="details-tab-title">商品详尽叙事</h3>
            <div class="details-body">
              <div v-if="product.detail" class="transformed-html" v-html="product.detail"></div>
              <div v-else class="empty-html">
                <i class="fas fa-folder-open"></i>
                <p>暂无更多该商品的补充描述信息</p>
              </div>
            </div>
          </div>
        </section>

        <!-- 4. 底部：完全重构的高级精等距画廊 -->
        <section v-if="recommendProducts.length > 0" class="showcase-gallery">
          <div class="gallery-header-row">
            <div class="title-meta">
              <span class="caption">RELATED FINDS</span>
              <h2 class="main-title">推荐与之相伴</h2>
            </div>
            <div class="title-line"></div>
          </div>

          <div class="isometric-grid">
            <article
                v-for="item in recommendProducts"
                :key="item.id"
                class="isometric-card"
                @click="handleProductClick(item.id)"
            >
              <div class="card-media-wrapper">
                <img v-if="item.coverFilePath" :src="item.coverFilePath" :alt="item.title" />
                <div v-else class="card-media-placeholder"><i class="fas fa-image"></i></div>
                <div class="card-hover-mask">
                  <div class="circle-arrow"><i class="fas fa-arrow-right"></i></div>
                </div>
              </div>
              <div class="card-meta">
                <h4 class="product-name">{{ item.title }}</h4>
                <div class="product-price">
                  <span class="symbol">¥</span>
                  <span class="value">{{ item.price }}</span>
                </div>
              </div>
            </article>
          </div>
        </section>
      </div>

      <!-- 异常状态底框 -->
      <div v-else class="not-found-canvas">
        <div class="canvas-content">
          <i class="fas fa-layer-group canvas-icon"></i>
          <h2>未找到指定物资档案</h2>
          <p>可能该商品已被下架、转移或链接输入有误。</p>
          <button class="return-btn" @click="$router.push('/shop')">返回商城主页</button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { getProductById, getProductRecommendations } from '@/api/ShopProductApi'
import { useUserStore } from '@/store/user'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const product = ref(null)
const quantity = ref(1)
const activeTab = ref('detail')
const recommendProducts = ref([])
const imageList = ref([])
const currentImageIndex = ref(0)

const mainImage = computed(() => {
  if (imageList.value.length > 0) {
    return imageList.value[currentImageIndex.value]
  }
  if (product.value && product.value.coverFilePath) {
    return {
      id: product.value.coverFileId,
      filePath: product.value.coverFilePath,
      originalName: '封面图片',
      type: 'IMG'
    }
  }
  return null
})

onMounted(() => {
  fetchProductDetail()
  fetchRecommendProducts()
})

const fetchProductDetail = () => {
  loading.value = true
  const productId = route.params.id

  getProductById(productId, {
    onSuccess: (res) => {
      product.value = res
      loading.value = false

      if (res.imageList && res.imageList.length > 0) {
        imageList.value = res.imageList
        currentImageIndex.value = 0
        console.log(`成功加载 ${res.imageList.length} 张商品图片`)
      } else {
        imageList.value = []
        currentImageIndex.value = 0
      }
    },
    onError: (error) => {
      message.error('获取商品详情失败：' + error.message)
      loading.value = false
    }
  })
}

const fetchRecommendProducts = () => {
  const productId = route.params.id

  getProductRecommendations(productId, 4, {
    onSuccess: (res) => {
      recommendProducts.value = res || []
      console.log('推荐商品加载成功，数量:', recommendProducts.value.length)
    },
    onError: (error) => {
      console.warn('推荐商品加载失败:', error)
      recommendProducts.value = []
    }
  })
}

const handleBuyNow = () => {
  const userStore = useUserStore()
  if (!userStore.isLoggedIn) {
    message.warning('请先登录')
    router.push('/auth/login')
    return
  }

  router.push({
    name: 'OrderConfirm',
    query: {
      productId: product.value.id,
      quantity: quantity.value
    }
  })
}

const handleProductClick = (id) => {
  router.push(`/shop/${id}`)
  fetchProductDetail()
  fetchRecommendProducts()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleImageChange = (index) => {
  currentImageIndex.value = index
}
</script>

<style scoped lang="less">
/* 设计语言常量系统 */
.product-detail-wrapper {
  --primary: #42664f;
  --primary-light: rgba(66, 102, 79, 0.08);
  --ink-deep: #161e19;
  --ink-main: #2b3630;
  --text-muted: #798780;
  --ui-border: #e2ebe6;
  --ui-bg-pure: #ffffff;
  --ui-bg-gray: #f5f8f6;
  --brand-red: #ae4335;

  min-height: 100vh;
  color: var(--ink-main);
  background-color: #fafcfa;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  -webkit-font-smoothing: antialiased;
}

.product-detail-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px 96px;
}

/* ==========================================================================
   1. 精美微型流线面包屑样式
   ========================================================================== */
.breadcrumb-nav {
  margin-bottom: 32px;

  .breadcrumb-inner {
    display: inline-flex;
    align-items: center;
    background: var(--ui-bg-pure);
    border: 1px solid var(--ui-border);
    padding: 8px 18px;
    border-radius: 30px;
    box-shadow: 0 2px 12px rgba(66, 102, 79, 0.02);
  }

  .nav-node {
    color: var(--text-muted);
    font-size: 13px;
    font-weight: 500;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: color 0.25s ease;

    i { font-size: 12px; }
    &:hover { color: var(--primary); }
  }

  .nav-arrow {
    margin: 0 10px;
    color: #c2d1c9;
    font-size: 10px;
  }

  .nav-current {
    color: var(--ink-deep);
    font-size: 13px;
    font-weight: 600;
    max-width: 240px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

/* ==========================================================================
   2. 全新纵向全画幅 Hero 区域样式
   ========================================================================== */
.hero-showcase {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-bottom: 64px;
}

.cinema-gallery {
  position: relative;
  width: 100%;
  height: 520px;
  background: var(--ui-bg-pure);
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.02);
}

.stage-viewport {
  width: 100%;
  height: 100%;
  padding-right: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at center, #ffffff 0%, var(--ui-bg-gray) 100%);

  .stage-img {
    max-width: 90%;
    max-height: 85%;
    object-fit: contain;
    transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  }
  &:hover .stage-img {
    transform: scale(1.02);
  }
}

.stage-empty {
  text-align: center;
  color: var(--text-muted);
  i { font-size: 50px; margin-bottom: 12px; }
  p { font-size: 12px; letter-spacing: 0.1em; }
}

.vertical-dock {
  position: absolute;
  top: 0;
  right: 0;
  width: 110px;
  height: 100%;
  border-left: 1px solid var(--ui-border);
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  padding: 20px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  overflow-y: auto;
}

.dock-thumb {
  width: 70px;
  height: 70px;
  padding: 3px;
  background: var(--ui-bg-pure);
  border: 1px solid var(--ui-border);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.25s ease;
  overflow: hidden;

  img { width: 100%; height: 100%; object-fit: cover; border-radius: 2px; }

  &:hover, &.is-active {
    border-color: var(--primary);
    box-shadow: 0 4px 12px rgba(66, 102, 79, 0.15);
    transform: translateX(-4px);
  }
}

.console-panel {
  width: 100%;
  background: var(--ui-bg-pure);
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  padding: 40px;
  box-shadow: 0 4px 24px rgba(66, 102, 79, 0.02);
}

.console-info {
  border-bottom: 1px solid var(--ui-bg-gray);
  padding-bottom: 28px;
  margin-bottom: 28px;
}

.meta-headline {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;

  .category-tag {
    font-size: 12px;
    font-weight: 700;
    color: var(--primary);
    background: var(--primary-light);
    padding: 4px 12px;
    border-radius: 4px;
  }
  .status-pill {
    font-size: 12px;
    font-weight: 500;
    color: #388e3c;
    &.is-soldout { color: var(--brand-red); }
  }
}

.console-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--ink-deep);
  margin: 0 0 10px 0;
}

.console-subtitle {
  font-size: 15px;
  color: var(--text-muted);
  line-height: 1.5;
  margin: 0;
}

.console-trade {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 24px;
}

.price-manifest {
  .label {
    font-size: 12px;
    color: var(--text-muted);
    display: block;
    margin-bottom: 4px;
    font-weight: 500;
  }
  .value {
    color: var(--brand-red);
    font-weight: 700;
    display: flex;
    align-items: baseline;

    .unit { font-size: 18px; margin-right: 2px; }
    .num { font-size: 38px; line-height: 1; }
  }
}

.interactive-dock {
  display: flex;
  align-items: center;
  gap: 32px;
}

.quantity-control-box {
  display: flex;
  align-items: center;
  gap: 12px;

  .control-label {
    font-size: 14px;
    font-weight: 600;
    color: var(--ink-main);
  }
  .control-stock {
    font-size: 13px;
    color: var(--text-muted);
  }
  .refined-stepper {
    width: 100px;
    border-radius: 4px;
    border-color: var(--ui-border);
  }
}

.action-buy-btn {
  height: 50px;
  padding: 0 40px;
  background: var(--primary);
  color: var(--ui-bg-pure);
  border: none;
  border-radius: 4px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 8px 24px rgba(66, 102, 79, 0.15);
  transition: all 0.25s ease;

  &:hover:not(:disabled) {
    background: var(--ink-deep);
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.2);
    transform: translateY(-2px);
  }
  &:disabled {
    background: #e0e8e4;
    color: var(--text-muted);
    cursor: not-allowed;
    box-shadow: none;
  }
}

.console-footer-claims {
  margin-top: 32px;
  border-top: 1px dashed var(--ui-border);
  padding-top: 24px;
  display: flex;
  gap: 40px;

  .claim-cell {
    font-size: 13px;
    color: var(--text-muted);
    display: flex;
    align-items: center;
    gap: 8px;
    i { color: var(--primary); }
  }
}

/* ==========================================================================
   3. 中部说明书区域样式
   ========================================================================== */
.editorial-manifesto {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 48px;
  margin-bottom: 80px;
}

.specs-sticky-card {
  position: sticky;
  top: 70px;
  background: var(--ui-bg-pure);
  border: 1px solid var(--ui-border);
  border-radius: 6px;
  padding: 28px;
}

/* 工艺特点/头部引言配置：增加底部外边距拉开与“规格参数”的间距 */
.specs-sticky-card .card-lead {
  font-size: 11px;
  font-weight: 700;
  color: var(--primary);
  letter-spacing: 0.1em;
  margin-bottom: 12px; /* 👈 从默认微距拉开，突出品类引言 */
}

/* 规格参数主标题：控制与上方引言以及下方参数表格的整体比例 */
.specs-sticky-card .card-head {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 28px 0; /* 👈 精准规范上下外边距：上部清零靠引言撑开，下部保持通透 */
  color: var(--ink-deep);
}

.specs-table .specs-item {
  display: flex;
  justify-content: space-between;
  padding: 14px 0;
  border-bottom: 1px solid var(--ui-bg-gray);
  font-size: 13px;

  .k { color: var(--text-muted); }
  .v { color: var(--ink-main); font-weight: 500; }
  &:last-child { border-bottom: none; }
}

.editorial-main {
  background: var(--ui-bg-pure);
  border: 1px solid var(--ui-border);
  border-radius: 6px;
  padding: 40px;
}

.details-tab-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--ink-deep);
  border-bottom: 2px solid var(--primary);
  padding-bottom: 12px;
  margin: 0 0 32px 0;
}

.transformed-html {
  font-size: 15px;
  line-height: 1.85;
  color: var(--ink-main);
  :deep(p) { margin-bottom: 20px; }
  :deep(img) { width: 100%; height: auto; border-radius: 4px; margin: 32px 0; }
}

.empty-html {
  text-align: center;
  padding: 64px 0;
  color: var(--text-muted);
  i { font-size: 32px; margin-bottom: 12px; }
}

/* ==========================================================================
   4. 底部相关推荐重构：严格等距正方高精矩阵网格
   ========================================================================== */
.showcase-gallery {
  border-top: 1px solid var(--ui-border);
  padding-top: 64px;
}

.gallery-header-row {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 40px;

  .title-meta {
    flex-shrink: 0;
    .caption {
      font-size: 11px;
      font-weight: 700;
      color: var(--primary);
      letter-spacing: 0.15em;
      display: block;
    }
    .main-title {
      font-size: 22px;
      font-weight: 700;
      color: var(--ink-deep);
      margin: 4px 0 0 0;
    }
  }

  .title-line {
    flex-grow: 1;
    height: 1px;
    background: linear-gradient(90deg, var(--ui-border) 0%, transparent 100%);
  }
}

.isometric-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.isometric-card {
  background: var(--ui-bg-pure);
  border: 1px solid var(--ui-border);
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);

  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 16px 32px rgba(66, 102, 79, 0.06);
    border-color: var(--primary);

    img { transform: scale(1.05); }
    .card-hover-mask { opacity: 1; }
  }
}

.card-media-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  background: var(--ui-bg-gray);
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s ease;
  }
}

.card-media-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c2d1c9;
  font-size: 24px;
}

.card-hover-mask {
  position: absolute;
  inset: 0;
  background: rgba(22, 30, 25, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;

  .circle-arrow {
    width: 44px;
    height: 44px;
    background: #ffffff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--primary);
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
}

.card-meta {
  padding: 18px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex-grow: 1;

  .product-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--ink-main);
    margin: 0 0 8px 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.product-price {
  color: var(--brand-red);
  font-weight: 700;
  font-size: 16px;
  .symbol { font-size: 12px; margin-right: 1px; }
}

/* ==========================================================================
   异常画布与加载
   ========================================================================== */
.not-found-canvas {
  min-height: 50vh;
  background: var(--ui-bg-pure);
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px;

  .canvas-icon { font-size: 56px; color: var(--text-muted); margin-bottom: 20px; }
  h2 { font-size: 20px; color: var(--ink-deep); margin-bottom: 8px; }
  p { color: var(--text-muted); font-size: 14px; margin-bottom: 24px; }

  .return-btn {
    padding: 10px 28px;
    background: var(--primary);
    color: #ffffff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    &:hover { background: var(--ink-deep); }
  }
}

.loading-container {
  background: var(--ui-bg-pure);
  padding: 40px;
  border: 1px solid var(--ui-border);
  border-radius: 8px;
}

/* ==========================================================================
   响应式下阶降级规范
   ========================================================================== */
@media (max-width: 1024px) {
  .cinema-gallery { height: 420px; }
  .editorial-manifesto { grid-template-columns: 1fr; gap: 32px; }
  .specs-sticky-card { position: static; }
  .isometric-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .product-detail-page { padding: 16px 16px 48px; }
  .cinema-gallery { height: 320px; }
  .stage-viewport { padding-right: 80px; }
  .vertical-dock { width: 80px; }
  .dock-thumb { width: 50px; height: 50px; }
  .console-panel { padding: 24px; }
  .console-trade { flex-direction: column; align-items: flex-start; gap: 20px; }
  .interactive-dock { flex-direction: column; align-items: flex-start; gap: 16px; width: 100%; }
  .action-buy-btn { width: 100%; justify-content: center; }
  .console-footer-claims { flex-direction: column; gap: 12px; }
  .isometric-grid { grid-template-columns: 1fr; }
}
</style>