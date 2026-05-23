<template>
  <div class="navbar">
    <div class="left-menu">
      <div class="hamburger" @click="toggleSidebar">
        <MenuUnfoldOutlined v-if="appStore.sidebarCollapsed" />
        <MenuFoldOutlined v-else />
      </div>
      <a-breadcrumb separator="/">
        <a-breadcrumb-item>
          <router-link to="/dashboard">首页</router-link>
        </a-breadcrumb-item>
        <a-breadcrumb-item v-if="route.meta.title">{{ route.meta.title }}</a-breadcrumb-item>
      </a-breadcrumb>
    </div>

    <div class="right-menu">
      <div class="right-menu-item" @click="toggleFullScreen">
        <FullscreenExitOutlined v-if="isFullscreen" />
        <FullscreenOutlined v-else />
      </div>

      <a-dropdown trigger="click">
        <div class="avatar-wrapper">
          <a-avatar :size="32" :src="avatarUrl">
            {{ userInfo?.name?.charAt(0)?.toUpperCase() || userInfo?.username?.charAt(0)?.toUpperCase() || 'U' }}
          </a-avatar>
          <span class="user-name">{{ userInfo?.name || userInfo?.username || '用户' }}</span>
          <DownOutlined class="dropdown-icon" />
        </div>
        <template #overlay>
          <a-menu>
            <a-menu-item key="logout" @click="handleLogout">
              <LogoutOutlined />
              退出登录
            </a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import { useAppStore } from '@/store/app'
import { Modal } from 'ant-design-vue'
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  DownOutlined,
  LogoutOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined
} from '@ant-design/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const appStore = useAppStore()

const userInfo = computed(() => userStore.userInfo)
const isFullscreen = ref(false)

const toggleSidebar = () => {
  appStore.toggleSidebar()
}
const avatarUrl = computed(() => {
  return userInfo.value?.avatar;
})
const toggleFullScreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
    isFullscreen.value = true
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen()
      isFullscreen.value = false
    }
  }
}

// 监听全屏状态变化
const fullscreenChangeHandler = () => {
  isFullscreen.value = !!document.fullscreenElement
}

document.addEventListener('fullscreenchange', fullscreenChangeHandler)

// 组件卸载时移除事件监听
onUnmounted(() => {
  document.removeEventListener('fullscreenchange', fullscreenChangeHandler)
})

const handleLogout = () => {
  Modal.confirm({
    title: '提示',
    content: '确定要退出登录吗?',
    okText: '确定',
    cancelText: '取消',
    onOk: async () => {
      await userStore.logout()
      router.push('/login')
    }
  })
}
</script>

<style lang="scss" scoped>
/* ==========================================================================
   导航栏主壳体：纯净温润白底 + 隐式墨绿微光
   ========================================================================== */
.navbar {
  height: 64px; /* 略微拉高至 64px 配合侧边栏，呼应对称比例 */
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: #ffffff;
  box-shadow: 0 2px 12px rgba(66, 102, 79, 0.03); /* 轻量级透亮微阴影 */
  border-bottom: 1px solid #ebf0ec; /* 与侧边栏配套的精细线框 */
  z-index: 10;
  transition: all 0.3s;

  /* ==========================================================================
     左侧区域（汉堡控制器与文博面包屑）
     ========================================================================== */
  .left-menu {
    display: flex;
    align-items: center;
    gap: 20px;

    /* 汉堡侧边栏切换方块 */
    .hamburger {
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border-radius: 6px;
      color: #55665c;
      height: 36px;
      width: 36px;
      border: 1px solid transparent;
      font-size: 16px;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

      /* 悬浮时呈现精美玉白框感 */
      &:hover {
        color: #42664f;
        background: rgba(66, 102, 79, 0.04);
        border-color: rgba(66, 102, 79, 0.2);
      }
    }

    /* 深度订制面包屑导航 */
    :deep(.ant-breadcrumb) {
      font-size: 14px;

      ol {
        align-items: center;
      }

      /* 基础跳转项（如首页） */
      a {
        color: #798e81;
        font-weight: 500;
        transition: color 0.2s;

        &:hover {
          color: #42664f; /* 统一主色高亮 */
        }
      }

      /* 当前处于的最后一级激活态文本 */
      .ant-breadcrumb-item:last-child {
        color: #2c3e35;
        font-weight: 600;
      }

      /* 斜杠分隔符 */
      .ant-breadcrumb-separator {
        color: #b3c2b8;
        margin: 0 10px;
      }
    }
  }

  /* ==========================================================================
     右侧区域（功能按钮矩阵与个人信息下拉）
     ========================================================================== */
  .right-menu {
    display: flex;
    align-items: center;
    gap: 12px;

    /* 全屏切换图标方块 */
    .right-menu-item {
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #55665c;
      border-radius: 6px;
      border: 1px solid transparent;
      font-size: 16px;
      transition: all 0.2s;
      height: 36px;
      width: 36px;

      &:hover {
        color: #42664f;
        background: rgba(66, 102, 79, 0.04);
        border-color: rgba(66, 102, 79, 0.2);
      }
    }

    /* 头像及用户下拉区 */
    .avatar-wrapper {
      display: flex;
      align-items: center;
      padding: 0 12px;
      height: 40px;
      cursor: pointer;
      border-radius: 6px;
      border: 1px solid transparent;
      transition: all 0.2s;

      &:hover {
        background: rgba(66, 102, 79, 0.04);
        border-color: rgba(66, 102, 79, 0.15);

        .user-name {
          color: #42664f;
        }
        .dropdown-icon {
          color: #42664f;
        }
      }

      /* 深度重写头像圆形与主色占位符 */
      :deep(.ant-avatar) {
        background: rgba(66, 102, 79, 0.1) !important;
        color: #42664f !important;
        font-weight: 600;
        border: 1px solid rgba(66, 102, 79, 0.15);

        img {
          object-fit: cover;
        }
      }

      .user-name {
        margin: 0 10px;
        font-size: 14px;
        color: #43544a;
        font-weight: 500;
        line-height: 40px;
        transition: color 0.2s;
      }

      .dropdown-icon {
        color: #92a498;
        font-size: 10px;
        transition: color 0.2s;
      }
    }
  }
}
</style>

<style lang="scss">
.ant-dropdown {
  /* 深度订制下拉弹窗的干净白色精细外框 */
  .ant-dropdown-menu, .ant-menu {
    background: #ffffff !important;
    border-radius: 8px !important;
    padding: 6px !important;
    box-shadow: 0 4px 16px rgba(66, 102, 79, 0.08) !important;
    border: 1px solid #eef2ef !important;
  }

  .ant-dropdown-menu-item, .ant-menu-item {
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
    padding: 8px 16px !important;
    height: 38px !important;
    color: #4e5e54 !important;
    font-size: 13px !important;
    font-weight: 500;
    border-radius: 4px !important;
    transition: all 0.2s !important;

    /* 悬浮或者高亮转为柔和墨绿效果 */
    &:hover, &.ant-menu-item-active {
      color: #d9534f !important; /* 退出登录通常用警戒红或同步主色，这里遵从系统规范 */
      background-color: #fff1f0 !important; /* 浅红微光 */
    }

    /* 内部图标对齐修正 */
    .anticon {
      font-size: 14px;
      display: inline-flex;
      align-items: center;
    }
  }
}
</style>