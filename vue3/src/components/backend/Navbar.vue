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
$accent: #42664f;
$black: #111111;
$muted: #6b6b6b;
$border: #e8e8e8;
$bg: #fafafa;
$white: #ffffff;

.navbar {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: $white;
  border-bottom: 1px solid $black;
  z-index: 10;
}

.left-menu {
  display: flex;
  align-items: center;
  gap: 16px;

  .hamburger {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: $muted;
    height: 36px;
    width: 36px;
    border: 1px solid transparent;
    font-size: 16px;
    transition: all 0.2s;

    &:hover {
      color: $accent;
      background: rgba($accent, 0.06);
      border-color: $accent;
    }
  }

  :deep(.ant-breadcrumb) {
    font-size: 14px;

    ol {
      align-items: center;
    }

    a {
      color: $muted;
      font-weight: 500;
      transition: color 0.2s;

      &:hover {
        color: $accent;
      }
    }

    .ant-breadcrumb-item:last-child {
      color: $black;
      font-weight: 600;
    }

    .ant-breadcrumb-separator {
      color: $border;
      margin: 0 10px;
    }
  }
}

.right-menu {
  display: flex;
  align-items: center;
  gap: 10px;

  .right-menu-item {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: $muted;
    border: 1px solid transparent;
    font-size: 16px;
    transition: all 0.2s;
    height: 36px;
    width: 36px;

    &:hover {
      color: $accent;
      background: rgba($accent, 0.06);
      border-color: $accent;
    }
  }

  .avatar-wrapper {
    display: flex;
    align-items: center;
    padding: 0 12px;
    height: 38px;
    cursor: pointer;
    border: 1px solid $border;
    transition: all 0.2s;

    &:hover {
      background: $bg;
      border-color: $accent;

      .user-name {
        color: $accent;
      }
      .dropdown-icon {
        color: $accent;
      }
    }

    :deep(.ant-avatar) {
      background: rgba($accent, 0.1) !important;
      color: $accent !important;
      font-weight: 600;
      border: none;
      border-radius: 0 !important;

      img {
        object-fit: cover;
      }
    }

    .user-name {
      margin: 0 10px;
      font-size: 14px;
      color: $black;
      font-weight: 500;
      line-height: 38px;
      transition: color 0.2s;
    }

    .dropdown-icon {
      color: $muted;
      font-size: 10px;
      transition: color 0.2s;
    }
  }
}
</style>

<style lang="scss">
$accent: #42664f;
$black: #111111;
$white: #ffffff;
$border: #e8e8e8;

.ant-dropdown {
  .ant-dropdown-menu, .ant-menu {
    background: #ffffff !important;
    padding: 4px !important;
    box-shadow: none !important;
    border: 1px solid $border !important;
  }

  .ant-dropdown-menu-item, .ant-menu-item {
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
    padding: 8px 16px !important;
    height: 36px !important;
    color: #4e5e54 !important;
    font-size: 13px !important;
    font-weight: 500;
    transition: all 0.2s !important;

    &:hover, &.ant-menu-item-active {
      color: $accent !important;
      background-color: rgba($accent, 0.06) !important;
    }

    .anticon {
      font-size: 14px;
      display: inline-flex;
      align-items: center;
    }
  }
}

// 退出登录确认弹窗样式
.ant-modal-confirm {
  .ant-modal-content {
    padding: 0 !important;
    border: 1px solid $border !important;
    border-radius: 0 !important;
    box-shadow: none !important;
  }

  .ant-modal-header {
    padding: 18px 24px !important;
    border-bottom: 1px solid $border !important;
    background: #ffffff !important;

    .ant-modal-title {
      font-size: 16px !important;
      font-weight: 600 !important;
      color: $black !important;
    }
  }

  .ant-modal-body {
    padding: 24px !important;
    font-size: 14px !important;
    color: #4a5a52 !important;
  }

  .ant-modal-footer {
    padding: 16px 24px !important;
    border-top: 1px solid $border !important;
    background: #fafafa !important;

    .ant-btn {
      height: 34px !important;
      padding: 0 20px !important;
      font-size: 13px !important;
      border-radius: 0 !important;
      box-shadow: none !important;
    }

    .ant-btn-default {
      background: $white !important;
      border: 1px solid $black !important;
      color: $black !important;

      &:hover {
        border-color: $accent !important;
        color: $accent !important;
      }
    }

    .ant-btn-primary {
      background: $accent !important;
      border-color: $accent !important;
      color: $white !important;

      &:hover {
        background: darken($accent, 6%) !important;
        border-color: darken($accent, 6%) !important;
      }
    }
  }
}
</style>