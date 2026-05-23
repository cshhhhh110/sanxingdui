<template>
  <div class="inheritor-split-layout">

    <div class="control-aside-panel">
      <div class="sticky-panel-content">
        <div class="brand-monogram">
          <div class="monogram-emblem">
            <span class="inner-totem">守</span>
          </div>
          <div class="brand-text-group">
            <h1 class="main-monogram-title">三星堆文明</h1>
            <p class="sub-monogram-desc">跨越三千年的青铜回响</p>
          </div>
        </div>

        <div class="panel-divider"></div>

        <div class="quest-filter-form">
          <div class="form-item-wrapper">
            <label class="form-field-label">守护者姓名</label>
            <a-input
                v-model:value="filters.name"
                placeholder="键入姓名以寻访..."
                allow-clear
                class="jade-minimal-input"
                @pressEnter="handleSearch"
            >
              <template #prefix>
                <i class="fas fa-search input-inner-icon"></i>
              </template>
            </a-input>
          </div>

          <div class="form-item-wrapper">
            <label class="form-field-label">驻守地域</label>
            <a-input
                v-model:value="filters.region"
                placeholder="输入省份或城市..."
                allow-clear
                class="jade-minimal-input"
                @pressEnter="handleSearch"
            >
              <template #prefix>
                <i class="fas fa-map-marker-alt input-inner-icon"></i>
              </template>
            </a-input>
          </div>

          <div class="quest-action-cluster">
            <a-button type="primary" class="action-btn-submit" @click="handleSearch">
              <i class="fas fa-compass" style="margin-right: 6px;"></i> 开启检索
            </a-button>
            <a-button class="action-btn-clear" @click="handleReset">
              重置条件
            </a-button>
          </div>
        </div>

        <div class="panel-footer-quote">
          <span>沉睡数千年 · 一醒惊天下</span>
        </div>
      </div>
    </div>

    <div class="gallery-main-stream">

      <div v-if="loading" class="stream-loading-mask">
        <a-spin size="large" />
      </div>

      <div v-if="!loading && inheritorList.length > 0" class="asymmetric-card-deck">
        <div
            v-for="inheritor in inheritorList"
            :key="inheritor.id"
            class="archeology-exhibit-card"
            @click="goToDetail(inheritor.id)"
        >
          <div class="exhibit-avatar-bay">
            <div class="avatar-capsule">
              <a-avatar
                  v-if="inheritor.avatarPath"
                  :src="inheritor.avatarPath"
                  :size="80"
                  class="capsule-image"
              />
              <a-avatar v-else :size="80" class="capsule-image-default">
                {{ inheritor.name ? inheritor.name.charAt(0) : '守' }}
              </a-avatar>
            </div>

            <span v-if="inheritor.region" class="capsule-geo-badge">
              {{ inheritor.region }}
            </span>
          </div>

          <div class="exhibit-details-bay">
            <div class="details-top-identity">
              <h3 class="profile-fullname">{{ inheritor.name }}</h3>
              <span v-if="inheritor.title" class="profile-honor-tag">
                {{ inheritor.title }}
              </span>
            </div>

            <p v-if="inheritor.bio" class="profile-synopsis">
              {{ getShortBio(inheritor.bio) }}
            </p>

            <div class="details-action-trigger">
              <span class="trigger-label">探寻事迹</span>
              <div class="trigger-icon-arrow">
                <i class="fas fa-arrow-right"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!loading && inheritorList.length === 0" class="stream-empty-deck">
        <a-empty
            description="未寻得相关守护者记录"
            class="clear-white-empty"
        />
      </div>

      <div v-if="total > 0" class="stream-pagination-deck">
        <a-pagination
            v-model:current="currentPage"
            v-model:page-size="pageSize"
            :total="total"
            :show-size-changer="false"
            :show-total="total => `共 ${total} 位文明守护者`"
            @change="handlePageChange"
        />
      </div>

    </div>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getInheritorPage } from '@/api/InheritorApi';

const router = useRouter();

// 筛选数据结构
const filters = reactive({
  name: '',
  region: ''
});

// 数据层核心变量
const inheritorList = ref([]);
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(12);
const total = ref(0);

// 获取核心分页列表
const fetchInheritors = () => {
  loading.value = true;
  getInheritorPage({
    current: currentPage.value,
    size: pageSize.value,
    name: filters.name,
    region: filters.region
  }, {
    onSuccess: (res) => {
      inheritorList.value = res.records || [];
      total.value = res.total || 0;
      loading.value = false;
    },
    onError: () => {
      loading.value = false;
    }
  });
};

// 触发搜索
const handleSearch = () => {
  currentPage.value = 1;
  fetchInheritors();
};

// 重置搜索条件
const handleReset = () => {
  filters.name = '';
  filters.region = '';
  currentPage.value = 1;
  fetchInheritors();
};

// 分页流控制
const handlePageChange = (page) => {
  currentPage.value = page;
  fetchInheritors();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// 数据修剪辅助函数
const getShortBio = (bio) => {
  if (!bio) return '';
  return bio.length > 65 ? bio.slice(0, 65) + '...' : bio;
};

// 路由分发
const goToDetail = (id) => {
  router.push(`/inheritor/${id}`);
};

onMounted(() => {
  fetchInheritors();
});
</script>

<style scoped>
/* ==========================================================================
   1. 纯白无界分栏框架设计配置
   ========================================================================== */
.inheritor-split-layout {
  min-height: 100vh;
  background-color: #ffffff; /* 严格执行纯白色底色 */
  display: flex;
  position: relative;
}

/* ==========================================================================
   2. 左侧侧边控制台（全面消除顶部死板标题框与独立搜索条）
   ========================================================================== */
.control-aside-panel {
  width: 340px;
  flex-shrink: 0;
  border-right: 1px solid #eef2ef;
  background: #ffffff;
  position: relative;
}

.sticky-panel-content {
  position: sticky;
  top: 0;
  height: 100vh;
  padding: 50px 35px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

/* 微章设计 */
.brand-monogram {
  display: flex;
  align-items: center;
  gap: 16px;
}
.monogram-emblem {
  width: 46px;
  height: 46px;
  border: 1.5px solid #42664f;
  transform: rotate(45deg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.inner-totem {
  transform: rotate(-45deg);
  font-family: "SimSun", serif;
  font-weight: 700;
  color: #42664f;
  font-size: 18px;
}
.main-monogram-title {
  font-size: 22px;
  font-weight: 700;
  color: #1a2d20;
  letter-spacing: 2px;
  margin: 0;
  font-family: "Noto Serif SC", serif;
}
.sub-monogram-desc {
  font-size: 11px;
  color: #7a9484;
  margin: 3px 0 0 0;
  letter-spacing: 1px;
}

.panel-divider {
  height: 1px;
  background: linear-gradient(to right, #42664f, transparent);
  margin: 40px 0;
  opacity: 0.15;
}

/* 侧边搜索表单 */
.quest-filter-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.form-item-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.form-field-label {
  font-size: 12px;
  color: #5c7a67;
  font-weight: 600;
  letter-spacing: 1px;
}

/* 输入框极限去蓝去灰、纯白净化 */
.jade-minimal-input {
  width: 100%;
}
.jade-minimal-input :deep(.ant-input-affix-wrapper) {
  border: 1px solid #dce4df !important;
  background-color: #ffffff !important;
  border-radius: 4px !important;
  height: 40px;
  transition: all 0.25s ease;
  box-shadow: none !important;
}
.jade-minimal-input :deep(.ant-input-affix-wrapper:hover) {
  border-color: #7fa68b !important;
}
.jade-minimal-input :deep(.ant-input-affix-wrapper-focused),
.jade-minimal-input :deep(.ant-input-affix-wrapper:focus) {
  border-color: #42664f !important;
  box-shadow: 0 0 0 3px rgba(66, 102, 79, 0.1) !important;
  outline: none !important;
}
.jade-minimal-input :deep(input.ant-input) {
  font-size: 13px;
  color: #1a2d20;
  background-color: transparent !important;
  box-shadow: none !important;
  outline: none !important;
}
.input-inner-icon {
  color: #9cb2a4;
  font-size: 14px;
}

/* 侧边交互按钮组 */
.quest-action-cluster {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
}
.action-btn-submit {
  background: #42664f !important;
  border-color: #42664f !important;
  color: #ffffff !important;
  height: 40px;
  font-weight: 500;
  border-radius: 4px;
  letter-spacing: 1px;
  box-shadow: 0 4px 12px rgba(66, 102, 79, 0.12);
}
.action-btn-submit:hover {
  background: #314f3b !important;
  border-color: #314f3b !important;
}
.action-btn-clear {
  height: 40px;
  color: #617568;
  background: #ffffff;
  border-color: #d1dad4;
  border-radius: 4px;
}
.action-btn-clear:hover {
  color: #42664f !important;
  border-color: #42664f !important;
  background-color: rgba(66, 102, 79, 0.02);
}
.action-btn-clear:focus,
.action-btn-clear:active {
  outline: none !important;
  box-shadow: none !important;
  background: #ffffff !important;
}

.panel-footer-quote {
  margin-top: auto;
  font-size: 11px;
  color: #b2c4b9;
  letter-spacing: 2px;
  font-family: "SimSun", serif;
}

/* ==========================================================================
   3. 右侧：非对称高自由度无界网格
   ========================================================================== */
.gallery-main-stream {
  flex: 1;
  padding: 50px 45px;
  background-color: #ffffff;
  min-width: 0;
}

.asymmetric-card-deck {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 30px;
}

/* 纯白上下分段式立体精细卡片 */
.archeology-exhibit-card {
  background: #ffffff;
  border: 1px solid #ebf0ec;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.215, 0.610, 0.355, 1);
}
.archeology-exhibit-card:hover {
  border-color: #42664f;
  transform: translateY(-4px);
  box-shadow: 0 15px 35px rgba(66, 102, 79, 0.06);
}

/* 头像搭载区 */
.exhibit-avatar-bay {
  height: 130px;
  background: #f7faf8; /* 极淡的过渡背景色 */
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.avatar-capsule {
  padding: 6px;
  background: #ffffff;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
  transition: transform 0.4s ease;
}
.archeology-exhibit-card:hover .avatar-capsule {
  transform: scale(1.06);
}
.capsule-image {
  border: 1px solid rgba(66, 102, 79, 0.1);
}
.capsule-image-default {
  background: #42664f;
  color: #ffffff;
  font-size: 28px;
  font-family: "SimSun", serif;
}

/* 精致轻态标签 */
.capsule-geo-badge {
  position: absolute;
  top: 14px;
  left: 14px;
  font-size: 11px;
  color: #42664f;
  background: #ffffff;
  padding: 2px 10px;
  border-radius: 2px;
  border: 1px solid rgba(66, 102, 79, 0.15);
}

/* 文本详情区 */
.exhibit-details-bay {
  padding: 24px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}
.details-top-identity {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 12px;
}
.profile-fullname {
  font-size: 18px;
  font-weight: 700;
  color: #1a2d20;
  margin: 0;
}
.profile-honor-tag {
  font-size: 11px;
  color: #42664f;
  background: rgba(66, 102, 79, 0.06);
  padding: 1px 6px;
  border-radius: 2px;
  font-weight: 500;
}
.profile-synopsis {
  font-size: 13px;
  color: #627366;
  line-height: 1.6;
  margin: 0 0 20px 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-align: justify;
}

/* 联动向导箭头 */
.details-action-trigger {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid #f5f8f6;
  padding-top: 14px;
}
.trigger-label {
  font-size: 11px;
  color: #9cb2a4;
  letter-spacing: 1px;
  transition: color 0.3s;
}
.trigger-icon-arrow {
  font-size: 12px;
  color: #9cb2a4;
  transition: all 0.3s;
}
.archeology-exhibit-card:hover .trigger-label {
  color: #42664f;
  font-weight: 600;
}
.archeology-exhibit-card:hover .trigger-icon-arrow {
  color: #42664f;
  transform: translateX(3px);
}

/* ==========================================================================
   4. 组件辅助生态（纯白化 pagination / spin / empty）
   ========================================================================== */
.stream-pagination-deck {
  display: flex;
  justify-content: center;
  margin: 50px auto 10px;
}
.stream-pagination-deck :deep(.ant-pagination-item-active) {
  background: #42664f !important;
  border-color: #42664f !important;
}
.stream-pagination-deck :deep(.ant-pagination-item-active a) {
  color: #ffffff !important;
}
.stream-pagination-deck :deep(.ant-pagination-item:hover:not(.ant-pagination-item-active) a) {
  color: #42664f;
}
.stream-pagination-deck :deep(.ant-pagination-item:hover:not(.ant-pagination-item-active)) {
  border-color: #42664f;
}
.stream-pagination-deck :deep(.ant-pagination-prev:hover .ant-pagination-item-link),
.stream-pagination-deck :deep(.ant-pagination-next:hover .ant-pagination-item-link) {
  color: #42664f;
  border-color: #42664f;
}

.stream-loading-mask {
  display: flex;
  justify-content: center;
  padding: 120px 0;
}
.stream-loading-mask :deep(.ant-spin-dot-item) {
  background-color: #42664f !important;
}
.stream-empty-deck {
  padding: 100px 0;
}
.clear-white-empty :deep(.ant-empty-description) {
  color: #8fa395;
  font-size: 13px;
}

/* ==========================================================================
   5. 响应式规则转换（移动端平滑转为上下结构布局）
   ========================================================================== */
@media (max-width: 992px) {
  .inheritor-split-layout {
    flex-direction: column;
  }
  .control-aside-panel {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #eef2ef;
  }
  .sticky-panel-content {
    height: auto;
    position: relative;
    padding: 35px 24px;
  }
  .panel-divider {
    margin: 24px 0;
  }
  .panel-footer-quote {
    display: none;
  }
  .gallery-main-stream {
    padding: 35px 24px;
  }
}

@media (max-width: 576px) {
  .asymmetric-card-deck {
    grid-template-columns: 1fr;
  }
}
</style>