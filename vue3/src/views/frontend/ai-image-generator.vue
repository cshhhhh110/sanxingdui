<template>
  <div class="ai-generator-page">

    <!-- 顶部导航栏 -->
    <div class="detail-header">
      <button class="back-btn" @click="goBack">← 返回</button>
    </div>

    <!-- Banner -->
    <div class="gen-banner">
      <div class="banner-overlay"></div>
      <div class="banner-content">
        <span class="banner-tag">AI 创作</span>
        <div class="banner-title">✨ 古蜀 AI 图片生成器</div>
        <div class="banner-sub">输入描述，让 AI 为你还原古蜀神秘之美</div>
      </div>
    </div>

    <!-- 主内容 -->
    <div class="main-content">
      <div class="two-col">

        <!-- 左：输入区 -->
        <div class="input-card">
          <div class="card-label">
            <span class="label-dot"></span>
            图片描述
          </div>
          <textarea
              v-model="prompt"
              placeholder="例如：三星堆青铜面具、古风少女、非遗风格、高清、唯美..."
              class="prompt-textarea"
          />
          <div class="quick-tags">
            <span
                v-for="tag in quickTags"
                :key="tag"
                class="quick-tag"
                @click="appendTag(tag)"
            >{{ tag }}</span>
          </div>
          <button class="generate-btn" @click="generate" :disabled="loading">
            <span v-if="loading" class="btn-loading">
              <span class="dot-1">·</span><span class="dot-2">·</span><span class="dot-3">·</span>
              生成中
            </span>
            <span v-else>🚀 开始生成图片</span>
          </button>
        </div>

        <!-- 右：结果区（始终渲染，保持等高） -->
        <div class="result-card">
          <div class="card-label">
            <span class="label-dot"></span>
            生成结果
          </div>

          <!-- 骨架屏 -->
          <div v-if="loading" class="result-body">
            <div class="skeleton-img">
              <div class="skeleton-shimmer"></div>
              <div class="skeleton-text">AI 正在创作中，请稍候...</div>
            </div>
          </div>

          <!-- 图片 -->
          <div v-else-if="resultImage" class="result-body">
            <img :src="resultImage" alt="生成的图片" class="result-img" />
            <div class="result-actions">
              <button class="action-btn save-btn" @click="viewImage">
               查看图片
              </button>
              <button class="action-btn regen-btn" @click="saveImage">
                保存图片
              </button>
            </div>
          </div>

          <!-- 空态 -->
          <div v-else class="result-body empty-hint">

            <div class="empty-text">输入描述后点击生成，AI 将为你创作一张独特的古蜀风格图片</div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const prompt = ref('')
const loading = ref(false)
const resultImage = ref('')

const quickTags = ['三星堆青铜面具', '古风少女', '金沙遗址', '非遗风格', '高清唯美', '水墨古蜀']

const goBack = () => {
  router.push('/tanmi')
}

const appendTag = (tag) => {
  if (prompt.value && !prompt.value.endsWith('、')) {
    prompt.value += '、'
  }
  prompt.value += tag
}

// 查看图片（新开标签页）
const viewImage = () => {
  if (!resultImage.value) return
  window.open(resultImage.value, '_blank')
}

async function generate() {
  if (!prompt.value.trim()) {
    alert('请输入描述')
    return
  }

  loading.value = true
  resultImage.value = ''

  try {
    const res = await fetch('http://127.0.0.1:8001/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: prompt.value })
    })

    const data = await res.json()
    resultImage.value = data.image_url
  } catch (err) {
    alert('生成失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

async function saveImage() {
  if (!resultImage.value) return

  try {
    const response = await fetch(resultImage.value)
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `古蜀AI_${Date.now()}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch {
    window.open(resultImage.value, '_blank')
  }
}
</script>

<style scoped>

/* ── 页面容器 ─────────────────────────────────────────────── */
.ai-generator-page {
  background: #f5f3ef;
  min-height: 100vh;
  padding-bottom: 60px;
}

/* ── 顶部导航 ─────────────────────────────────────────────── */
.detail-header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  padding: 0 16px;
  height: 50px;
  background: rgba(245, 243, 239, 0.92);
  backdrop-filter: blur(10px);
  border-bottom: 0.5px solid #e8e2d8;
}

.back-btn {
  background: none;
  border: none;
  font-size: 14px;
  color: #42664f;
  padding: 6px 10px 6px 0;
  cursor: pointer;
  font-weight: 500;
}

.header-title {
  flex: 1;
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  margin-right: 40px;
}

/* ── Banner ───────────────────────────────────────────────── */
.gen-banner {
  position: relative;
  height: 160px;
  background:
      linear-gradient(135deg, rgba(0,0,0,0.55), rgba(66,102,79,0.45)),
      url('/images/sanxingdui.png') center / cover no-repeat;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.banner-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, transparent 60%, #f5f3ef);
}

.banner-content {
  position: relative;
  z-index: 1;
  text-align: center;
}

.banner-tag {
  display: inline-block;
  background: rgba(255,255,255,0.15);
  border: 0.5px solid rgba(255,255,255,0.3);
  color: #fff;
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 20px;
  letter-spacing: 1px;
  margin-bottom: 8px;
  backdrop-filter: blur(6px);
}

.banner-title {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 1px;
  margin-bottom: 4px;
}

.banner-sub {
  font-size: 12px;
  color: rgba(255,255,255,0.75);
  letter-spacing: 0.5px;
}

/* ── 主内容 ───────────────────────────────────────────────── */
.main-content {
  padding: 20px;
  height: 500px; /* 新增：固定高度 */
}

/* ── 两栏布局 ─────────────────────────────────────────────── */
.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  align-items: stretch; /* 两列等高 */
}

@media (max-width: 680px) {
  .two-col {
    grid-template-columns: 1fr;
  }
}

/* ── 卡片通用 ─────────────────────────────────────────────── */
.input-card,
.result-card {
  background: #fff;
  border-radius: 14px;
  padding: 18px 16px;
  border: 0.5px solid #e8e2d8;
  display: flex;
  flex-direction: column; /* 内部纵向排列 */
  height: 500px; /* 新增：卡片固定高度 */
}

.card-label {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 12px;
  letter-spacing: 0.3px;
  flex-shrink: 0;
}

.label-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #42664f;
  flex-shrink: 0;
}

/* ── 文本域 ───────────────────────────────────────────────── */
.prompt-textarea {
  width: 100%;
  flex: 1; /* 撑满剩余空间，使按钮贴底 */
  min-height: 110px;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid #e0dbd0;
  background: #faf8f5;
  font-size: 13px;
  line-height: 1.75;
  color: #333;
  resize: none;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.prompt-textarea:focus {
  border-color: #42664f;
}

.prompt-textarea::placeholder {
  color: #bbb;
}

/* ── 快捷标签 ─────────────────────────────────────────────── */
.quick-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin: 10px 0 16px;
  flex-shrink: 0;
}

.quick-tag {
  font-size: 11px;
  padding: 4px 11px;
  border-radius: 20px;
  border: 0.5px solid #c8ddc8;
  color: #42664f;
  background: #f0f7f0;
  cursor: pointer;
  transition: all 0.15s;
  user-select: none;
}

.quick-tag:active {
  background: #42664f;
  color: #fff;
}

/* ── 生成按钮 ─────────────────────────────────────────────── */
.generate-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #42664f, #5c8567);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  letter-spacing: 0.5px;
  transition: opacity 0.2s, transform 0.15s;
  flex-shrink: 0;
}

.generate-btn:active {
  transform: scale(0.98);
  opacity: 0.9;
}

.generate-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

/* 加载点动画 */
.btn-loading {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.dot-1, .dot-2, .dot-3 {
  font-size: 20px;
  line-height: 1;
  animation: dotBounce 1.2s infinite;
  color: rgba(255,255,255,0.8);
}
.dot-2 { animation-delay: 0.2s; }
.dot-3 { animation-delay: 0.4s; }

@keyframes dotBounce {
  0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
  40% { transform: translateY(-4px); opacity: 1; }
}

/* ── 结果区内容体（撑满卡片剩余高度） ────────────────────── */
.result-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* ── 骨架屏 ───────────────────────────────────────────────── */
.skeleton-img {
  flex: 1;
  background: #f0ede7;
  border-radius: 10px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 160px;
}

.skeleton-shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255,255,255,0.45) 50%,
      transparent 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.6s infinite;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton-text {
  position: relative;
  z-index: 1;
  font-size: 13px;
  color: #aaa;
  letter-spacing: 0.5px;
}

/* ── 结果图片 ─────────────────────────────────────────────── */
.result-img {
  width: 100%;
  flex: 1;
  border-radius: 10px;
  display: block;
  object-fit: cover;
  min-height: 160px;
}

/* ── 操作按钮组 ───────────────────────────────────────────── */
.result-actions {
  display: flex;
  gap: 10px;
  margin-top: 12px;
  flex-shrink: 0;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.15s;
  letter-spacing: 0.3px;
}

.action-btn:active {
  transform: scale(0.97);
  opacity: 0.85;
}

.save-btn {
  background: linear-gradient(135deg, #42664f, #5c8567);
  color: #fff;
}

.regen-btn {
  background: #f0f7f0;
  color: #42664f;
  border: 0.5px solid #c8ddc8;
}

.btn-icon {
  font-size: 14px;
}

/* ── 空态 ─────────────────────────────────────────────────── */
.empty-hint {
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  border: 0.5px dashed #d0c9bc;
  padding: 24px;
}

.empty-icon {
  font-size: 40px;
  margin-bottom: 12px;
  text-align: center;
}

.empty-text {
  font-size: 13px;
  color: #aaa;
  line-height: 1.75;
  text-align: center;
}

</style>