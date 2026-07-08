<template>
  <div class="detail-page-container">
    <div v-if="loading" class="center-box">
      <a-spin size="large" />
    </div>

    <div v-else-if="inheritor" class="content-wrapper">

      <header class="header-section">
        <div class="avatar-area">
          <a-avatar v-if="inheritor.avatarPath" :src="inheritor.avatarPath" :size="120" />
          <div v-else class="avatar-fallback">{{ inheritor.name?.charAt(0) }}</div>
        </div>
        <div class="title-area">
          <h1>{{ inheritor.name }}</h1>
          <div class="tag-row">
            <span v-if="inheritor.title" class="tag-primary">{{ inheritor.title }}</span>
            <span v-if="inheritor.region" class="tag-secondary">{{ inheritor.region }}</span>
          </div>
        </div>
      </header>

      <section v-if="inheritor.bio" class="bio-section">
        <h3>传承人简介</h3>
        <p>{{ inheritor.bio }}</p>
      </section>

      <section class="works-section">
        <h3>代表作品</h3>
        <div v-if="inheritor.heritageItems?.length > 0" class="works-list">
          <div v-for="item in inheritor.heritageItems" :key="item.id" class="work-card" @click="goToItemDetail(item.id)">
            <h4>{{ item.title }}</h4>
            <p>{{ getShortSummary(item.summary) }}</p>
            <span class="status-tag">{{ item.statusName }}</span>
          </div>
        </div>
        <div v-else class="empty-tip">暂无代表作品</div>
      </section>

      <footer class="footer-actions">
        <a-button @click="goBack" class="back-btn">返回列表</a-button>
      </footer>
    </div>

    <div v-else class="center-box">
      <p>信息不存在</p>
      <a-button @click="goBack">返回列表</a-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { getInheritorById } from '@/api/InheritorApi';

const router = useRouter();
const route = useRoute();
const inheritor = ref(null);
const loading = ref(false);

const getShortSummary = (summary) => summary?.length > 100 ? summary.substring(0, 100) + '...' : summary;

const goToItemDetail = (itemId) => router.push(`/heritage/${itemId}`);
const goBack = () => router.push('/inheritor');

const fetchInheritorDetail = () => {
  const inheritorId = route.params.id;
  if (!inheritorId) return router.push('/inheritor');
  loading.value = true;
  getInheritorById(inheritorId, {
    onSuccess: (res) => { inheritor.value = res; loading.value = false; },
    onError: () => { loading.value = false; }
  });
};

onMounted(fetchInheritorDetail);
</script>

<style scoped>
.detail-page-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 20px;
  background: #ffffff;
}

.center-box {
  text-align: center;
  padding: 100px 0;
}

/* 头部样式 */
.header-section {
  display: flex;
  align-items: center;
  gap: 30px;
  padding-bottom: 40px;
  border-bottom: 1px solid #eee;
}

.avatar-fallback {
  width: 120px;
  height: 120px;
  background: #42664f;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  border-radius: 50%;
}

h1 { font-size: 32px; color: #333; margin: 0; }

.tag-row { display: flex; gap: 10px; margin-top: 10px; }

.tag-primary {
  background: #42664f;
  color: #fff;
  padding: 2px 10px;
  font-size: 12px;
  border-radius: 4px;
}

.tag-secondary {
  border: 1px solid #42664f;
  color: #42664f;
  padding: 2px 10px;
  font-size: 12px;
  border-radius: 4px;
}

/* 内容区域 */
section { margin-top: 40px; }
h3 { font-size: 20px; color: #42664f; margin-bottom: 15px; }
p { line-height: 1.8; color: #666; }

/* 作品列表 */
.works-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.work-card {
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition: 0.3s;
}

.work-card:hover {
  border-color: #42664f;
}

.status-tag {
  display: inline-block;
  margin-top: 10px;
  font-size: 12px;
  color: #42664f;
}

.footer-actions {
  margin-top: 60px;
  text-align: center;
}

.back-btn {
  border-color: #42664f;
  color: #42664f;
}

.back-btn:hover {
  background: #42664f;
  color: #fff;
}
</style>
