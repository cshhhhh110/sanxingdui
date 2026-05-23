<template>
  <div class="sidebar-container" :class="{ 'is-collapsed': isCollapsed }">
    <div class="logo">
      <img :src="siteConfig.admin.logo.icon" alt="Logo" class="logo-icon" />
      <span class="logo-text" v-show="!isCollapsed">{{ siteConfig.admin.logo.text }}</span>
    </div>
    <div class="menu-wrapper">
      <a-menu
          v-model:selectedKeys="selectedKeys"
          :inline-collapsed="isCollapsed"
          mode="inline"
          class="sidebar-menu"

      >
        <a-menu-item key="/back/dashboard" @click="handleMenuClick('/back/dashboard')">
          <template #icon>

          </template>
          <span>首页</span>
        </a-menu-item>

        <a-menu-item key="/back/user" @click="handleMenuClick('/back/user')">
          <template #icon>

          </template>
          <span>用户管理</span>
        </a-menu-item>

        <a-menu-item key="/back/heritage" @click="handleMenuClick('/back/heritage')">
          <template #icon>

          </template>
          <span>古蜀瑰宝管理</span>
        </a-menu-item>

        <a-menu-item key="/back/inheritor" @click="handleMenuClick('/back/inheritor')">
          <template #icon>

          </template>
          <span>文博专家管理</span>
        </a-menu-item>

        <a-menu-item key="/back/activity" @click="handleMenuClick('/back/activity')">
          <template #icon>

          </template>
          <span>文化活动管理</span>
        </a-menu-item>

        <a-menu-item key="/back/course" @click="handleMenuClick('/back/course')">
          <template #icon>

          </template>
          <span>课程管理</span>
        </a-menu-item>

        <a-sub-menu key="shop">
          <template #icon>

          </template>
          <template #title>商城管理</template>

          <a-menu-item key="/back/shop/category" @click="handleMenuClick('/back/shop/category')">
            <template #icon>

            </template>
            <span>商品分类</span>
          </a-menu-item>

          <a-menu-item key="/back/shop/product" @click="handleMenuClick('/back/shop/product')">
            <template #icon>

            </template>
            <span>商品管理</span>
          </a-menu-item>

          <a-menu-item key="/back/shop/orders" @click="handleMenuClick('/back/shop/orders')">
            <template #icon>

            </template>
            <span>订单管理</span>
          </a-menu-item>
        </a-sub-menu>

      </a-menu>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/store/app'
import siteConfig from '@/config/site'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

const isCollapsed = computed(() => appStore.sidebarCollapsed)

// 当前激活的菜单
const selectedKeys = ref([route.path])

// 监听路由变化更新选中的菜单
watch(() => route.path, (newPath) => {
  selectedKeys.value = [newPath]
})

// 处理菜单点击
const handleMenuClick = (path) => {
  router.push(path)
}
</script>

<style lang="scss" scoped>
/* ==========================================================================
   侧边栏主框架：高级素雅白底色
   ========================================================================== */
.sidebar-container {
  height: 100%;
  min-height: 100vh;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  width: 230px; /* 稍微优化整体平衡比例 */
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 1px 0 12px rgba(0, 0, 0, 0.03); /* 轻量级右侧微阴影，摒弃旧边框 */
  border-right: 1px solid #f0f3f1;

  /* 折叠状态 */
  &.is-collapsed {
    width: 64px;

    .logo {
      padding: 0;
      justify-content: center;

      .logo-icon {
        margin: 0;
      }
    }

    :deep(.ant-menu) {
      .ant-menu-submenu-title > span:not(.anticon),
      .ant-menu-item > span:not(.anticon) {
        opacity: 0;
        transition: opacity 0.2s;
      }

      /* 折叠时，选中的小框依然保持精美的墨绿高亮方块感 */
      .ant-menu-item-selected {
        background-color: rgba(66, 102, 79, 0.08) !important;
        border-color: #42664f !important;
      }
    }
  }

  /* ==========================================================================
     头部 LOGO 区（纯白透亮）
     ========================================================================== */
  .logo {
    height: 64px;
    flex-shrink: 0;
    line-height: 64px;
    background: #ffffff;
    border-bottom: 1px solid #f4f6f4;
    display: flex;
    align-items: center;
    padding: 0 20px;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    .logo-icon {
      width: 32px;
      height: 32px;
      margin-right: 10px;
      object-fit: contain;
      transition: margin 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .logo-text {
      color: #2c3e35; /* 略带墨绿相间的高级黑 */
      font-size: 16px;
      font-weight: 600;
      white-space: nowrap;
      opacity: 1;
      letter-spacing: 0.5px;
      transition: opacity 0.2s;
    }
  }

  /* ==========================================================================
     滚动菜单包裹层
     ========================================================================== */
  .menu-wrapper {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    width: 100%;
    padding: 12px 0;

    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background: rgba(66, 102, 79, 0.15);
      border-radius: 2px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
  }

  /* ==========================================================================
     深度注入 AntDesign 优雅白色框/墨绿激活样式（无多余 DOM 纯 CSS 净化）
     ========================================================================== */
  :deep(.sidebar-menu) {
    border: none !important;
    background: #ffffff !important;
    width: 100% !important;

    /* 全局公共菜单项与子标题基础卡片形态 */
    .ant-menu-item, .ant-menu-submenu-title {
      height: 44px !important;
      line-height: 44px !important;
      margin: 4px 12px !important; /* 空隙悬浮感 */
      width: calc(100% - 24px) !important;
      border-radius: 6px !important;
      color: #55665c !important; /* 优雅优雅中性灰绿 */
      font-size: 14px !important;
      font-weight: 500;
      border: 1px solid transparent; /* 预留边框位置防止抖动 */
      transition: all 0.2s ease !important;

      /* 悬浮轻微变白框并加深字体色 */
      &:hover {
        color: #42664f !important;
        background-color: #f7faf8 !important;
        border-color: #e1e8e4 !important;
      }
    }

    /* SubMenu 下属展开面板的背景处理 - 保持干净白 */
    .ant-menu-sub {
      background: #fafbfc !important;
      padding: 2px 0 !important;

      .ant-menu-item {
        height: 38px !important;
        line-height: 38px !important;
        margin: 2px 12px 2px 12px !important;
        font-size: 13px !important;
        padding-left: 32px !important; /* 子级自然右移 */
      }
    }

    /* 核心精髓：选中项的高级白色卡片+墨绿主体呈现 */
    .ant-menu-item-selected {
      color: #42664f !important;
      background-color: rgba(66, 102, 79, 0.06) !important; /* 极轻柔的墨绿微光底色 */
      border-color: rgba(66, 102, 79, 0.3) !important; /* 优雅的墨绿浅边框线 */
      font-weight: 600 !important;

      &::after {
        display: none !important; /* 剔除 AntDesign 右侧原生生硬的粗竖线 */
      }
    }

    /* 下拉箭头的色彩同步微调 */
    .ant-menu-submenu-arrow {
      color: #8da396 !important;
    }
    .ant-menu-submenu-open > .ant-menu-submenu-title {
      color: #42664f !important;
      .ant-menu-submenu-arrow {
        color: #42664f !important;
      }
    }
  }
}
</style>