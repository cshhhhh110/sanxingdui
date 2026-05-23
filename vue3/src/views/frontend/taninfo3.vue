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
      <div class="header-title">金沙祭祀坑遗址</div>
    </div>

    <!-- 顶部大图 -->
    <div class="detail-banner">
      <img src="/images/jinsha.png" alt="金沙祭祀坑遗址" class="banner-img" />
      <div class="banner-mask"></div>
      <div class="banner-title">
        <div class="title-main">金沙祭祀坑遗址</div>
        <div class="title-sub">约公元前1200—650年｜古蜀文明的延续</div>
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
            <div class="value">约公元前 1200 — 650 年</div>
          </div>
          <div class="info-item">
            <div class="label">地理位置</div>
            <div class="value">成都市青羊区金沙遗址路</div>
          </div>
          <div class="info-item">
            <div class="label">文化地位</div>
            <div class="value">三星堆文明的延续，古蜀晚期核心都邑</div>
          </div>
          <div class="info-item">
            <div class="label">出土文物</div>
            <div class="value">6000+件（金器、玉器、石器等）</div>
          </div>
          <div class="info-item">
            <div class="label">核心遗存</div>
            <div class="value">祭祀坑、祭祀台、生活遗迹</div>
          </div>
        </div>
      </div>

      <!-- 遗址介绍 -->
      <div class="section">
        <div class="section-title">遗址介绍</div>
        <div class="section-desc">
          金沙祭祀坑遗址是古蜀文明继三星堆之后的又一核心遗址，距今约3200—2650年，是古蜀王国晚期的都城遗址。遗址于2001年被偶然发现，出土了大量珍贵文物，其中金面具、太阳神鸟金箔、玉琮、玉璧等器物，与三星堆出土文物风格一脉相承，充分证明了金沙文化是三星堆文化的延续与发展，构建起古蜀文明从起源（宝墩）、鼎盛（三星堆）到延续（金沙）的完整历史链条。
        </div>
      </div>

      <!-- 考古价值 -->
      <div class="section">
        <div class="section-title">考古价值</div>
        <div class="section-desc">
          金沙祭祀坑遗址的发掘，填补了古蜀文明从三星堆到战国时期的历史空白，揭示了古蜀文明的传承与演变过程。出土的太阳神鸟金箔成为中国文化遗产标志，实证了古蜀人对太阳的崇拜与独特的宇宙观；大量玉器则反映了古蜀与中原地区的文化交流，进一步印证了中华文明多元一体的格局。此外，遗址中发现的生活遗迹，也为研究古蜀人的生活方式、社会结构提供了重要线索。
        </div>
      </div>

      <!-- 特色标签 -->
      <div class="section">
        <div class="section-title">文化特征</div>
        <div class="tag-group">
          <span class="tag">文明延续</span>
          <span class="tag">祭祀遗存</span>
          <span class="tag">金器玉器</span>
          <span class="tag">古蜀晚期</span>
          <span class="tag">太阳神鸟</span>
          <span class="tag">文化传承</span>
        </div>
      </div>

      <!-- 底部引导 -->
      <div class="guide-card">
        <div class="guide-text">完整了解古蜀文明脉络，返回探秘主页重温全部遗址 →</div>
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