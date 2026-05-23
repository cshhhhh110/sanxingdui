<template>
  <div class="heritage-detail-page">
    <nav class="top-back-nav">
      <button class="back-btn" @click="handleBackToList">
        <i class="fas fa-arrow-left"></i> 返回名录
      </button>
    </nav>

    <div v-if="loading" class="loading-canvas">
      <a-spin size="large" />
    </div>

    <div v-else-if="currentItem" class="detail-layout">

      <main class="content-grid">
        <section class="side-column">
          <div class="cover-box">
            <img v-if="currentItem.coverImage" :src="currentItem.coverImage" :alt="currentItem.title" />
            <div v-else class="empty-cover">暂无影像</div>
          </div>

          <div class="info-panel">
            <div class="data-item"><span>地区</span><strong>{{ currentItem.region || '—' }}</strong></div>
            <div class="data-item"><span>门类</span><strong>{{ currentItem.category || '—' }}</strong></div>
            <div class="data-item"><span>收录</span><strong>{{ formatDate(currentItem.publishTime || currentItem.createTime) }}</strong></div>
          </div>
        </section>

        <section class="main-column">
          <h1 class="main-title">{{ currentItem.title }}</h1>

          <div class="summary-box">
            <p>{{ currentItem.summary }}</p>
          </div>

          <article class="rich-text-content" v-html="formatDescription(currentItem.description)"></article>
        </section>
      </main>

      <section v-if="currentItem.inheritorList && currentItem.inheritorList.length > 0" class="related-section">
        <h3>相关守护者</h3>
        <div class="inheritor-grid">
          <div v-for="h in currentItem.inheritorList" :key="h.id" class="inheritor-card">
            <div class="h-avatar">
              <img v-if="h.avatarPath" :src="h.avatarPath" />
              <div v-else class="h-none">{{ h.name?.charAt(0) }}</div>
            </div>
            <div class="h-info">
              <h4>{{ h.name }}</h4>
              <p>{{ h.title || '非遗传承人' }}</p>
            </div>
          </div>
        </div>
      </section>
    </div>

    <div v-else class="not-found-modern">
      <p>档案未归位，请检查链接或返回。</p>
      <button @click="handleBackToList">返回名录</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getHeritageItemDetail } from '@/api/HeritageApi';
import { formatLocalDate } from '@/utils/dateUtils';
import { message } from 'ant-design-vue';

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const currentItem = ref(null);

const formatDate = (dateStr) => {
  if (!dateStr) return '未知时间';
  try { return formatLocalDate(new Date(dateStr)); } catch { return '未知时间'; }
};

const formatDescription = (desc) => desc ? desc.replace(/\n/g, '<br>') : '暂无详细介绍。';

const handleBackToList = () => router.push('/heritage');

const fetchItemDetail = () => {
  const itemId = route.params.id;
  if (!itemId) return handleBackToList();

  loading.value = true;
  getHeritageItemDetail({ itemId }, {
    onSuccess: (res) => {
      currentItem.value = res;
      loading.value = false;
    },
    onError: () => {
      loading.value = false;
      message.error('数据加载失败');
    }
  });
};

onMounted(fetchItemDetail);
</script>

<style scoped>
/* 页面基调：纯白 */
.heritage-detail-page {
  min-height: 100vh;
  background: #ffffff;
  padding: 40px;
}

/* 顶部返回按钮 */
.top-back-nav {
  max-width: 1000px;
  margin: 0 auto 40px;
}
.back-btn {
  background: #fff;
  border: 1px solid #d1dad4;
  padding: 8px 16px;
  color: #42664f;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: 0.3s;
}
.back-btn:hover {
  background: #42664f;
  color: #fff;
  border-color: #42664f;
}

/* 布局 */
.detail-layout {
  max-width: 1000px;
  margin: 0 auto;
}
.content-grid {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 60px;
}

/* 左侧 */
.cover-box {
  width: 100%;
  aspect-ratio: 3/4;
  background: #f7faf8;
  border: 1px solid #eef2ef;
  overflow: hidden;
  margin-bottom: 20px;
}
.cover-box img { width: 100%; height: 100%; object-fit: cover; }
.data-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f0f4f1;
  font-size: 13px;
}
.data-item span { color: #9cb2a4; }
.data-item strong { color: #1a2d20; }

/* 右侧 */
.main-title { font-size: 36px; color: #1a2d20; margin-bottom: 30px; font-weight: 700; }
.summary-box {
  background: #fcfcfc;
  padding: 20px;
  border-left: 3px solid #42664f;
  color: #5c7a67;
  font-size: 15px;
  line-height: 1.6;
  margin-bottom: 40px;
}
.rich-text-content { line-height: 1.8; color: #333; }

/* 传承人 */
.related-section { margin-top: 80px; border-top: 1px solid #eee; padding-top: 40px; }
.inheritor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 20px;
}
.inheritor-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  border: 1px solid #f0f4f1;
}
.h-avatar { width: 40px; height: 40px; border-radius: 50%; overflow: hidden; background: #f0f4f1; }
.h-avatar img { width: 100%; height: 100%; object-fit: cover; }
.h-none { display: flex; align-items: center; justify-content: center; height: 100%; color: #42664f; font-weight: bold; }
.h-info h4 { margin: 0; font-size: 14px; }
.h-info p { margin: 0; font-size: 12px; color: #7a9484; }

/* 加载及兜底 */
.loading-canvas { text-align: center; padding: 100px; }
.not-found-modern { text-align: center; padding: 100px; color: #999; }

@media (max-width: 768px) {
  .content-grid { grid-template-columns: 1fr; }
  .heritage-detail-page { padding: 20px; }
}
</style>