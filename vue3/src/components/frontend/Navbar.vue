<template>
  <a-layout-header class="frontend-navbar">
    <!-- 原有导航栏结构保持不变 -->
    <div class="navbar-container">
      <!-- Logo和站点名称 -->
      <div class="navbar-logo">
        <router-link to="/home">
          <img :src="siteConfig.logo.icon" alt="Logo" class="logo-icon" />
          <span class="logo-text">{{ siteConfig.logo.text }}</span>
        </router-link>
      </div>

      <!-- 导航菜单 -->
      <a-menu
          v-model:selectedKeys="selectedKeys"
          mode="horizontal"
          class="navbar-menu"
          :style="{ lineHeight: '64px', borderBottom: 'none' ,color:'#282828' }"
      >
        <!-- 原有菜单项保持不变 -->
        <a-menu-item key="home">
          <router-link to="/home">
            <span>首页</span>
          </router-link>
        </a-menu-item>
        <a-menu-item key="tanmi">
          <router-link to="/tanmi">
            <span>三星堆探秘</span>
          </router-link>
        </a-menu-item>
        
        <a-menu-item key="course">
          <router-link to="/course">
            <span>研学课堂</span>
          </router-link>
        </a-menu-item>
        <a-menu-item key="shop">
          <router-link to="/shop">
            <span>文创商城</span>
          </router-link>
        </a-menu-item>
        <a-menu-item key="3dlist">
          <router-link to="/3dlist">
            <span>3D数字馆</span>
          </router-link>
        </a-menu-item>
        <a-menu-item key="quiz">
          <router-link to="/quiz">
            <span>知识问答</span>
          </router-link>
        </a-menu-item>
        <a-menu-item key="heritage">
          <router-link to="/heritage">
            <span>古蜀瑰宝</span>
          </router-link>
        </a-menu-item>
        <a-menu-item key="inheritor">
          <router-link to="/inheritor">
            <span>文博专家</span>
          </router-link>
        </a-menu-item>
        <a-menu-item key="activity">
          <router-link to="/activity">
            <span>文化活动</span>
          </router-link>
        </a-menu-item>
        <a-menu-item key="ai-chat">
          <router-link to="/ai-chat">
            <span>AI文博助手</span>
          </router-link>
        </a-menu-item>
        <a-menu-item key="profile" v-if="isLoggedIn">
          <router-link to="/profile">
            <span>个人中心</span>
          </router-link>
        </a-menu-item>
      </a-menu>

      <!-- 右侧用户区域 -->
      <div class="navbar-user">
        <template v-if="isLoggedIn">
          <!-- 用户信息下拉菜单 -->
          <a-dropdown>
            <a class="user-info" @click.prevent>
              <a-avatar :size="32" :src="userStore.avatar">
                {{ userStore.userInfo.username?.charAt(0) || 'U' }}
              </a-avatar>
              <span class="user-name">{{ userStore.userInfo.username }}</span>
              <DownOutlined />
            </a>
            <template #overlay>
              <a-menu>
                <!-- 我的订单 → 绿色系 -->
                <a-menu-item key="my-orders" class="menu-order">
                  <router-link to="/orders">
                    <i class="fas fa-shopping-cart"></i>
                    <span>我的订单</span>
                  </router-link>
                </a-menu-item>

                <a-menu-divider />

                <!-- 退出登录 → 红色系 -->
                <a-menu-item key="logout" @click="openLogoutModal" class="menu-logout">
                  <LogoutOutlined />
                  <span>退出登录</span>
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </template>

        <template v-else>
          <!-- 未登录状态 -->
          <a-space :size="16">
            <a-button type="default" @click="router.push('/auth/login')">
              登录
            </a-button>
            <a-button type="primary" @click="router.push('/auth/register')">
              注册
            </a-button>
          </a-space>
        </template>
      </div>
    </div>
  </a-layout-header>

  <!-- 全新设计的退出登录弹窗 -->
  <teleport to="body">
    <div class="logout-modal-overlay" v-if="showLogoutModal" @click="closeLogoutModal">
      <div class="logout-modal-content" @click.stop>
        <!-- 弹窗头部 -->
        <div class="logout-modal-header">
          <div class="logout-icon-wrapper">
            <LogoutOutlined class="logout-icon" />
          </div>
          <h3 class="logout-modal-title">确认退出登录</h3>
          <button class="modal-close-btn" @click="closeLogoutModal">
            <span>&times;</span>
          </button>
        </div>

        <!-- 弹窗内容 -->
        <div class="logout-modal-body">
          <p class="logout-desc">
            你确定要退出当前账号吗？退出后将无法继续使用个人中心、订单管理等专属功能。
          </p>

        </div>

        <!-- 弹窗底部按钮 -->
        <div class="logout-modal-footer">
          <button class="btn-cancel" @click="closeLogoutModal">
            取消
          </button>
          <button class="btn-confirm" @click="confirmLogout">
            确认退出
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import siteConfig from '@/config/site'
import {
  UserOutlined,
  DownOutlined,
  LogoutOutlined
} from '@ant-design/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 当前选中的菜单项
const selectedKeys = ref(['home'])

// 是否登录
const isLoggedIn = computed(() => userStore.isLoggedIn)

// 全新弹窗控制
const showLogoutModal = ref(false)

// 打开退出弹窗
const openLogoutModal = () => {
  showLogoutModal.value = true
  // 添加动画触发类
  setTimeout(() => {
    document.querySelector('.logout-modal-overlay').classList.add('active')
    document.querySelector('.logout-modal-content').classList.add('active')
  }, 10)
}

// 关闭退出弹窗
const closeLogoutModal = () => {
  const overlay = document.querySelector('.logout-modal-overlay')
  const content = document.querySelector('.logout-modal-content')
  if (overlay) overlay.classList.remove('active')
  if (content) content.classList.remove('active')

  // 延迟隐藏，等待动画完成
  setTimeout(() => {
    showLogoutModal.value = false
  }, 300)
}

// 确认退出登录
const confirmLogout = async () => {
  await userStore.logout()
  closeLogoutModal()
  router.push('/auth/login')
}

// 根据路由更新选中的菜单项
watch(() => route.path, (newPath) => {
  if (newPath === '/home' || newPath === '/') {
    selectedKeys.value = ['home']
  } else if (newPath.startsWith('/tanmi') || newPath.startsWith('/info') ||  newPath.startsWith('/ai-image-generator')) {
    selectedKeys.value = ['tanmi']
  } else if (newPath.startsWith('/heritage')) {
    selectedKeys.value = ['heritage']
  } else if (newPath.startsWith('/inheritor')) {
    selectedKeys.value = ['inheritor']
  } else if (newPath.startsWith('/activity')) {
    selectedKeys.value = ['activity']
  } else if (newPath.startsWith('/course')) {
    selectedKeys.value = ['course']
  } else if (newPath.startsWith('/shop')) {
    selectedKeys.value = ['shop']
  } else if (newPath.startsWith('/profile')) {
    selectedKeys.value = ['profile']
  } else if (newPath.startsWith('/quiz')) {
    selectedKeys.value = ['quiz']
  } else if (newPath.startsWith('/ai-chat')) {
    selectedKeys.value = ['ai-chat']
  } else if (newPath.startsWith('/3dlist') || newPath.startsWith('/3d')) {
    selectedKeys.value = ['3dlist']
  } else {
    selectedKeys.value = []
  }

  window.scrollTo(0, 0)
}, { immediate: true })
</script>

<style scoped>
/* 原有样式保持不变 */
/* 1. 选中状态：文字 + 下划线 */
:deep(.ant-menu-item-selected) {
  color: #42664f !important;
}
:deep(.ant-menu-item-selected::after) {
  border-bottom-color: #42664f !important;
  border-width: 3px !important;
}

/* 2. 鼠标悬浮状态：文字 + 下划线 */
:deep(.ant-menu-item:hover) {
  color: #42664f !important;
}
:deep(.ant-menu-item:hover::after) {
  border-bottom-color: #42664f !important;
  border-width: 3px !important;
}

.frontend-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 0;
  height: 64px;
  line-height: 64px;
}

.navbar-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
}

.navbar-logo {
  flex-shrink: 0;
}

.navbar-logo a {
  display: flex;
  align-items: center;
  text-decoration: none;
  color: #42664f;
}

.logo-icon {
  width: 32px;
  height: 32px;
  margin-right: 8px;
  object-fit: contain;
}

.logo-text {
  font-size: 20px;
  font-weight: 600;
  color: #42664f;
}

.navbar-menu {
  flex: 1;
  border: none;
  background: transparent;
  margin: 0 24px;
}

/* 白色底（navbar-user区域同样保持白底） */
.navbar-user {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  height: 64px;
  background: #fff;
}

/* 触发器按钮：更像“卡片/按钮” */
.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px;
  border-radius: 10px;
  background: #fff;
  color: #42664f;
  border: 1px solid rgba(66, 102, 79, 0.25);
  cursor: pointer;
  transition: all 0.25s ease;
  text-decoration: none;
}

/* Hover：主色描边更明显 + 轻微底色 */
.user-info:hover {
  border-color: rgba(66, 102, 79, 0.55);
  background: rgba(66, 102, 79, 0.06);
  color: #42664f;
}

/* 点击/激活态 */
.user-info:active {
  transform: translateY(1px);
}

/* 用户名：主色 + 不换行 */
.user-name {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #42664f;
  font-weight: 600;
}

/* Avatar边框也用主色 */
:deep(.ant-avatar) {
  border: 1px solid rgba(66, 102, 79, 0.25);
}

/* 下拉菜单基础 */
:deep(.ant-dropdown-menu) {
  border-radius: 12px;
  overflow: hidden;
}

:deep(.ant-dropdown-menu-item) {
  color: #282828;
}

:deep(.ant-dropdown-menu-divider) {
  background: rgba(66, 102, 79, 0.15);
}

/* 下拉项里的图标颜色 */
:deep(.ant-dropdown-menu-item i),
:deep(.anticon) {
  color: #42664f;
}

/* ====================== 【关键：分别设置 hover 颜色】 ====================== */
/* 我的订单 - 绿色 hover */
:deep(.menu-order:hover) {
  background: rgba(66, 102, 79, 0.08) !important;
  color: #42664f !important;
}
:deep(.menu-order:hover .anticon) {
  color: #42664f !important;
}

/* 退出登录 - 红色 hover */
:deep(.menu-logout:hover) {
  background: #fff1f0 !important;
  color: #d93026 !important;
}
:deep(.menu-logout:hover .anticon) {
  color: #d93026 !important;
}
/* ========================================================================= */

/* 响应式 */
@media (max-width: 768px) {
  .user-info {
    padding: 6px 10px;
    gap: 8px;
  }
  .user-name {
    display: none;
  }
}

/* 全新退出登录弹窗样式 */
.logout-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
}

.logout-modal-overlay.active {
  opacity: 1;
  visibility: visible;
}

.logout-modal-content {
  width: 100%;
  max-width: 420px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  padding: 0;
  transform: translateY(20px) scale(0.95);
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.logout-modal-content.active {
  transform: translateY(0) scale(1);
  opacity: 1;
}

.logout-modal-header {
  padding: 24px 24px 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  position: relative;
}

.logout-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #fff1f0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  flex-shrink: 0;
}

.logout-icon {
  font-size: 24px;
  color: #d93026;
}

.logout-modal-title {
  font-size: 20px;
  font-weight: 600;
  color: #282828;
  margin: 8px 0 0;
  flex: 1;
}

.modal-close-btn {
  background: transparent;
  border: none;
  font-size: 20px;
  color: #999;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.modal-close-btn:hover {
  background: #f5f5f5;
  color: #666;
}

.logout-modal-body {
  padding: 16px 24px 24px;
}

.logout-desc {
  font-size: 15px;
  color: #666;
  line-height: 1.6;
  margin: 0 0 16px;
}

.logout-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #999;
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
}

.logout-tip i {
  color: #42664f;
  font-size: 16px;
}

.logout-modal-footer {
  padding: 16px 24px 24px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  background: #fafafa;
  border-bottom-left-radius: 16px;
  border-bottom-right-radius: 16px;
}

.btn-cancel {
  padding: 10px 24px;
  border-radius: 8px;
  border: 1px solid #e5e5e5;
  background: #ffffff;
  color: #666;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel:hover {
  border-color: #d9d9d9;
  background: #f9f9f9;
  color: #444;
}

.btn-confirm {
  padding: 10px 24px;
  border-radius: 8px;
  border: none;
  background: #d93026;
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-confirm:hover {
  background: #c5261e;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(217, 48, 38, 0.2);
}

.btn-confirm:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(217, 48, 38, 0.2);
}

/* 响应式适配 */
@media (max-width: 480px) {
  .logout-modal-content {
    margin: 0 20px;
  }

  .logout-modal-header {
    padding: 20px 20px 0;
  }

  .logout-modal-body {
    padding: 16px 20px 20px;
  }

  .logout-modal-footer {
    padding: 16px 20px 20px;
  }

  .logout-icon-wrapper {
    width: 40px;
    height: 40px;
  }

  .logout-modal-title {
    font-size: 18px;
  }
}
</style>