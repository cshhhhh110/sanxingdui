<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 返回上一页
const goBack = () => {
  router.back()
}
</script>

<template>
  <div class="info-detail-container">
    <!-- 返回头部 -->
    <div class="detail-header">
      <button class="back-btn" @click="goBack">← 返回</button>
      <div class="header-title">宝墩文化遗址</div>
    </div>

    <!-- 顶部大图 -->
    <div class="detail-banner">
      <img src="/images/baodun.png" alt="宝墩文化遗址" class="banner-img" />
      <div class="banner-mask"></div>
      <div class="banner-title">
        <div class="title-main">宝墩文化遗址</div>
        <div class="title-sub">约公元前2500—1700年｜古蜀文明的起源根基</div>
      </div>
    </div>

    <!-- 内容区 -->
    <div class="detail-content">
      <!-- 基本信息卡片 -->
      <div class="base-card">
        <div class="card-title">遗址基本信息</div>
        <div class="info-list">
          <div class="info-item">
            <div class="label">文化年代</div>
            <div class="value">约公元前 2500 — 1700 年</div>
          </div>
          <div class="info-item">
            <div class="label">地理位置</div>
            <div class="value">成都平原</div>
          </div>
          <div class="info-item">
            <div class="label">文化地位</div>
            <div class="value">古蜀文明最早源头，三星堆文明前身</div>
          </div>
          <div class="info-item">
            <div class="label">遗址数量</div>
            <div class="value">已发现 6 处大型史前城址</div>
          </div>
        </div>
      </div>

      <!-- 文化介绍 -->
      <div class="section">
        <div class="section-title">文化介绍</div>
        <div class="section-desc">
          宝墩文化是成都平原迄今为止可考证的最早的考古学文化，是古蜀文明的第一阶段。
          这一时期已出现大型城址、夯土城墙、稻作农业，社会结构初步形成，为后续三星堆
          灿烂的祭祀文明与青铜文明奠定了社会、经济、宗教基础。
        </div>
      </div>

      <!-- 考古价值 -->
      <div class="section">
        <div class="section-title">考古价值</div>
        <div class="section-desc">
          宝墩文化的发掘证实了成都平原在距今4500年前已进入文明阶段，
          彻底改写了过去“古蜀文化起源于外地传入”的观点，证明古蜀文明是
          土生土长、一脉相承的本土文明。
        </div>
      </div>

      <!-- 特色标签 -->
      <div class="section">
        <div class="section-title">文化特征</div>
        <div class="tag-group">
          <span class="tag">史前城址</span>
          <span class="tag">农耕文明</span>
          <span class="tag">文明起源</span>
          <span class="tag">古蜀第一阶段</span>
          <span class="tag">夯土城墙</span>
        </div>
      </div>

      <!-- 底部引导 -->
      <div class="guide-card">
        <div class="guide-text">了解完宝墩文化，继续探索三星堆祭祀坑文明 →</div>
        <button class="guide-btn" @click="router.push({ name: 'tanmi' })">
          返回探秘主页
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 整体容器 */
.info-detail-container {
  background: #f5f3ef;
  min-height: 100vh;
  font-family: -apple-system, 'PingFang SC', 'Hiragino Sans GB', sans-serif;
  max-width: 1200px;
  margin: 0 auto;
  padding-bottom: 60px;
}

/* 头部返回栏 */
.detail-header {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  background: #fff;
  border-bottom: 0.5px solid #e8e4dc;
  position: sticky;
  top: 0;
  z-index: 10;
}

.back-btn {
  background: none;
  border: none;
  font-size: 15px;
  color: #42664f;
  cursor: pointer;
  padding: 4px 0;
}

.header-title {
  flex: 1;
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  color: #222;
}

/* 顶部大图 */
.detail-banner {
  position: relative;
  height: 220px;
  overflow: hidden;
}

.banner-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.banner-mask {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.5), transparent);
}

.banner-title {
  position: absolute;
  left: 0;
  bottom: 0;
  padding: 20px;
  z-index: 2;
  color: #fff;
}

.title-main {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 4px;
}

.title-sub {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

/* 内容区 */
.detail-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* 基本信息卡片 */
.base-card {
  background: #fff;
  border-radius: 14px;
  padding: 18px;
  border: 0.5px solid #e8e4dc;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #222;
  margin-bottom: 14px;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding-bottom: 8px;
  border-bottom: 0.5px solid #f0ebe4;
}

.label {
  font-size: 13px;
  color: #888;
}

.value {
  font-size: 13px;
  color: #222;
  font-weight: 500;
}

/* 段落区块 */
.section {
  background: #fff;
  border-radius: 14px;
  padding: 18px;
  border: 0.5px solid #e8e4dc;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #222;
  margin-bottom: 10px;
}

.section-desc {
  font-size: 14px;
  line-height: 1.8;
  color: #555;
}

/* 标签组 */
.tag-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
}

.tag {
  background: #f8f6f2;
  border: 0.5px solid #e0dbd0;
  color: #888;
  font-size: 12px;
  padding: 5px 11px;
  border-radius: 20px;
}

/* 底部引导 */
.guide-card {
  background: linear-gradient(135deg, #42664f 0%, #42664f 100%);
  border-radius: 14px;
  padding: 20px;
  text-align: center;
}

.guide-text {
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
  margin-bottom: 12px;
}

.guide-btn {
  background: #fac775;
  color: #412402;
  border: none;
  border-radius: 20px;
  padding: 9px 18px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
</style>