<template>
  <a-layout class="frontend-layout">
    <!-- 顶部导航栏 -->
    <Navbar />

    <!-- 主要内容区域 -->
    <a-layout-content class="main-content">
      <div class="content-wrapper">
        <router-view />
      </div>
    </a-layout-content>
  </a-layout>
</template>

<script setup>
import Navbar from '@/components/frontend/Navbar.vue'
</script>

<style scoped>
.frontend-layout {
  min-height: 100vh;
  background-color: #faf8f3;
}

.main-content {
  margin-top: 64px; /* 导航栏高度 */
  min-height: calc(100vh - 64px - 120px); /* 减去导航栏和页脚高度 */
}

.content-wrapper {
  width: 100%;
  margin: 0 auto;
  padding: 0;
}

.footer {
  background-color: #001529;
  color: rgba(255, 255, 255, 0.65);
  text-align: center;
  padding: 24px 50px;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
}

.footer-content p {
  margin: 8px 0;
}


/* 响应式设计 */
@media (max-width: 768px) {
  .content-wrapper {
    padding: 0;
  }

  .footer {
    padding: 24px 16px;
  }


}
</style>