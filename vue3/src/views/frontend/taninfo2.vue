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
      <div class="header-title">三星堆祭祀坑遗址</div>
    </div>

    <!-- 顶部大图 -->
    <div class="detail-banner">
      <img src="/images/sanxingdui.png" alt="三星堆祭祀坑遗址" class="banner-img" />
      <div class="banner-mask"></div>
      <div class="banner-title">
        <div class="title-main">三星堆祭祀坑遗址</div>
        <div class="title-sub">1929年发现 · 1986/2023年发掘｜古蜀文明核心</div>
      </div>
    </div>

    <!-- 内容区 -->
    <div class="detail-content">
      <!-- 基本信息卡片 -->
      <div class="base-card">
        <div class="card-title">遗址基本信息</div>
        <div class="info-list">
          <div class="info-item">
            <div class="label">发现时间</div>
            <div class="value">1929年（首次发现）</div>
          </div>
          <div class="info-item">
            <div class="label">重大发掘时间</div>
            <div class="value">1986年、2023年</div>
          </div>
          <div class="info-item">
            <div class="label">祭祀坑数量</div>
            <div class="value">已发现8座核心祭祀坑</div>
          </div>
          <div class="info-item">
            <div class="label">出土文物</div>
            <div class="value">13000+件（青铜、黄金、象牙等）</div>
          </div>
          <div class="info-item">
            <div class="label">文化地位</div>
            <div class="value">古蜀王国核心祭祀遗存，改写中华文明上古史</div>
          </div>
        </div>
      </div>

      <!-- 遗址介绍 -->
      <div class="section">
        <div class="section-title">遗址介绍</div>
        <div class="section-desc">
          三星堆祭祀坑遗址位于成都平原北部，是古蜀王国最重要的宗教祭祀遗存，也是迄今我国西南地区发现的规模最大、内涵最丰富的古蜀文化遗址。自1929年燕道诚偶然发现玉石器以来，历经近百年考古发掘，尤其是1986年和2023年两次重大发掘，出土了青铜神树、青铜大立人、黄金面具、象牙等万余件珍贵文物，实证了古蜀王国的祭祀制度、王权等级与高度发达的文明水平。
        </div>
      </div>

      <!-- 考古价值 -->
      <div class="section">
        <div class="section-title">考古价值</div>
        <div class="section-desc">
          三星堆祭祀坑的发掘，彻底打破了“中原中心论”的传统认知，证明古蜀文明是中华文明多元一体格局中的重要组成部分。出土的青铜器物造型奇特、工艺精湛，与中原文化既有联系又有鲜明地方特色，实证了古蜀人独特的宗教信仰、审美情趣和手工业水平，为研究古蜀文明的起源、发展与衰落提供了无可替代的实物资料。
        </div>
      </div>

      <!-- 特色标签 -->
      <div class="section">
        <div class="section-title">文化特征</div>
        <div class="tag-group">
          <span class="tag">祭祀坑发掘</span>
          <span class="tag">青铜文明</span>
          <span class="tag">黄金器物</span>
          <span class="tag">古蜀祭祀</span>
          <span class="tag">文明实证</span>
          <span class="tag">多元一体</span>
        </div>
      </div>

      <!-- 底部引导 -->
      <div class="guide-card">
        <div class="guide-text">探秘完三星堆，继续了解古蜀文明的延续——金沙遗址 →</div>
        <button class="guide-btn" @click="router.push({ name: 'info3' })">
          查看金沙遗址
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