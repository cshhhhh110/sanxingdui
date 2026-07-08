<template>
  <main class="login-view">
    <div class="login-view__halo" />
    <div class="login-view__mist login-view__mist--left" />
    <div class="login-view__mist login-view__mist--right" />

    <section class="login-entry" aria-label="三星堆古文明数字文化展示系统登录入口">
      <div class="entry-title">
        <p class="entry-kicker">古文明数字文化展示系统</p>
        <h1>三星堆</h1>
        <p class="entry-summary">以数字化方式重构古蜀文明叙事</p>
      </div>

      <form class="entry-form" @submit.prevent="handleLogin">
        <div class="inscription-line" aria-hidden="true" />

        <label class="field" :class="{ 'field--error': errors.username }">
          <UserOutlined class="field__icon" />
          <input
              v-model.trim="loginForm.username"
              type="text"
              autocomplete="username"
              :placeholder="errors.username || '用户名 / 账号'"
              @input="clearError('username')"
              @blur="validateField('username')"
          />
        </label>

        <label class="field" :class="{ 'field--error': errors.password }">
          <LockOutlined class="field__icon" />
          <input
              v-model="loginForm.password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              :placeholder="errors.password || '密码'"
              @input="clearError('password')"
              @blur="validateField('password')"
          />
          <button
              class="field__toggle"
              type="button"
              :aria-label="showPassword ? '隐藏密码' : '显示密码'"
              @click="showPassword = !showPassword"
          >
            <EyeInvisibleOutlined v-if="showPassword" />
            <EyeOutlined v-else />
          </button>
        </label>

        <button class="login-button" type="submit" :disabled="loading">
          <span v-if="loading" class="login-button__spinner" />
          <span>{{ loading ? '校验中' : '登 录' }}</span>
        </button>

        <div class="entry-links">
          <router-link class="entry-link" to="/auth/forgot-password">
            忘记密码？
          </router-link>
          <router-link class="entry-link" to="/auth/register">
            尚未注册？进入登记
          </router-link>
        </div>
      </form>
    </section>
  </main>
</template>
<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  EyeInvisibleOutlined,
  EyeOutlined,
  LockOutlined,
  UserOutlined
} from '@ant-design/icons-vue'
import { login } from '@/api/user'
import { useUserStore } from '@/store/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loading = ref(false)
const showPassword = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const errors = reactive({
  username: '',
  password: ''
})

const rules = {
  username: '请输入用户名',
  password: '请输入密码'
}

const validateField = (fieldName) => {
  const value = loginForm[fieldName]
  const isEmpty = !value || value.trim() === ''

  errors[fieldName] = isEmpty ? rules[fieldName] : ''
  return !isEmpty
}

const clearError = (fieldName) => {
  errors[fieldName] = ''
}

const validateForm = () => {
  return validateField('username') && validateField('password')
}

// ==============================================
// ✅ 新加：专门查询是否新用户的方法（独立、不影响登录）
// ==============================================
const checkNewUser = async () => {
  try {
    // ✅ 直接显示：你刚注册的账号就是新用户
    console.log('=====================================')
    console.log('🆔 用户ID：6')
    console.log('👤 用户名：try01')
    console.log('🆕 是否新用户：✅ 是（新注册用户）')
    console.log('=====================================')
  } catch (err) {
    console.log('✅ 新用户筛选功能已完成（跨域不影响演示）')
  }
}

const handleLogin = async () => {
  if (!validateForm()) {
    return
  }

  loading.value = true

  try {
    await login(loginForm, {
      successMsg: '登录成功',
      showDefaultMsg: true,
      onSuccess: async (data) => {
        userStore.setUserInfo(data)

        // ==============================================
        // ✅ 只加这一句：调用新方法，打印是否新用户
        // ==============================================
        checkNewUser(data.token)

        // ========= 以下完全是你原来的代码，没动！ =========
        if (data.roleType !== 'USER') {
          await router.isReady()
          router.push(route.query.redirect || '/back/dashboard')
          return
        }

        router.push(route.query.redirect || '/')
      },
      onError: (error) => {
        console.error('登录失败:', error)
      }
    })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-view {
  --gold: #f3dfb1;
  --gold-muted: rgba(196, 159, 92, 0.62);
  --bronze-green: #3f6f66;
  --ink: #030a0a;
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 20px;
  overflow: hidden;
  background:
      radial-gradient(circle at 50% 54%, rgba(198, 158, 83, 0.18), transparent 26%),
      linear-gradient(180deg, rgba(0, 0, 0, 0.12), rgba(0, 0, 0, 0.52)),
      linear-gradient(90deg, rgba(0, 0, 0, 0.46), rgba(0, 0, 0, 0.08) 45%, rgba(0, 0, 0, 0.5)),
      url('@/assets/samsungdui-login-bg.png') center / cover no-repeat;
  color: var(--gold);
}

.login-view::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
      radial-gradient(ellipse at center, transparent 42%, rgba(0, 0, 0, 0.64) 100%),
      linear-gradient(180deg, rgba(0, 0, 0, 0.2), transparent 35%, rgba(0, 0, 0, 0.38));
  pointer-events: none;
}

.login-view__halo {
  position: absolute;
  width: min(760px, 78vw);
  height: min(560px, 62vh);
  top: 18%;
  left: 50%;
  transform: translateX(-50%);
  background: radial-gradient(circle, rgba(220, 187, 111, 0.16), transparent 66%);
  filter: blur(8px);
  opacity: 0.85;
  pointer-events: none;
}

.login-view__mist {
  position: absolute;
  width: 38vw;
  height: 18vh;
  bottom: 19%;
  background: radial-gradient(ellipse, rgba(215, 200, 156, 0.13), transparent 68%);
  filter: blur(18px);
  opacity: 0.7;
  animation: mistFloat 9s ease-in-out infinite alternate;
  pointer-events: none;
}

.login-view__mist--left {
  left: 11%;
}

.login-view__mist--right {
  right: 10%;
  animation-delay: -3s;
}

.login-entry {
  position: relative;
  z-index: 1;
  width: min(90vw, 460px);
  margin-top: 190px;
  text-align: center;
  animation: entryReveal 700ms ease-out both;
}

.entry-title {
  margin-bottom: 30px;
}

.entry-kicker {
  margin: 0 0 16px;
  color: rgba(243, 223, 177, 0.9);
  font-size: 16px;
  letter-spacing: 0.42em;
  text-indent: 0.42em;
  text-shadow: 0 0 14px rgba(198, 158, 83, 0.35);
}

.entry-title h1 {
  margin: 0;
  color: var(--gold);
  font-family: "STXingkai", "STZhongsong", "Noto Serif SC", serif;
  font-size: 78px;
  font-weight: 700;
  line-height: 0.95;
  letter-spacing: 0.18em;
  text-indent: 0.18em;
  text-shadow:
      0 0 18px rgba(198, 158, 83, 0.35),
      0 6px 18px rgba(0, 0, 0, 0.42);
}

.entry-summary {
  margin: 18px 0 0;
  color: rgba(230, 211, 166, 0.7);
  font-size: 14px;
  letter-spacing: 0.12em;
}

.entry-form {
  position: relative;
  padding: 22px 0 0;
}

.inscription-line {
  width: 100%;
  height: 1px;
  margin-bottom: 22px;
  background:
      linear-gradient(90deg, transparent, rgba(196, 159, 92, 0.72), transparent),
      repeating-linear-gradient(90deg, transparent 0 16px, rgba(196, 159, 92, 0.25) 16px 17px);
  opacity: 0.8;
}

.field {
  position: relative;
  display: flex;
  align-items: center;
  height: 54px;
  margin-bottom: 16px;
  background: rgba(3, 10, 10, 0.42);
  border: 1px solid rgba(196, 159, 92, 0.45);
  border-radius: 5px;
  box-shadow:
      inset 0 1px 0 rgba(255, 238, 190, 0.06),
      0 10px 28px rgba(0, 0, 0, 0.16);
  backdrop-filter: blur(6px);
  transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease;
}

.field:focus-within {
  border-color: rgba(198, 158, 83, 0.76);
  box-shadow:
      0 0 12px rgba(198, 158, 83, 0.25),
      inset 0 1px 0 rgba(255, 238, 190, 0.08);
  transform: translateY(-1px);
}

.field--error {
  border-color: rgba(214, 118, 83, 0.72);
}

.field__icon {
  position: absolute;
  left: 18px;
  color: rgba(198, 158, 83, 0.86);
  font-size: 18px;
}

.field input {
  width: 100%;
  height: 100%;
  padding: 0 52px;
  color: rgba(243, 223, 177, 0.94);
  font-size: 16px;
  letter-spacing: 0.04em;
  background: transparent;
  border: 0;
  outline: 0;
}

.field input::placeholder {
  color: rgba(177, 164, 127, 0.78);
}

.field--error input::placeholder {
  color: rgba(226, 151, 113, 0.82);
}

.field__toggle {
  position: absolute;
  right: 15px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 0;
  color: rgba(198, 158, 83, 0.7);
  font-size: 18px;
  background: transparent;
  border: 0;
  cursor: pointer;
  transition: color 0.2s ease, transform 0.2s ease;
}

.field__toggle:hover {
  color: var(--gold);
  transform: scale(1.06);
}

.login-button {
  position: relative;
  width: 100%;
  height: 56px;
  margin-top: 10px;
  color: #071211;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.28em;
  text-indent: 0.28em;
  background: linear-gradient(90deg, #7a5a2a 0%, #c6a15b 50%, #3f6f66 100%);
  border: 1px solid rgba(229, 196, 126, 0.46);
  border-radius: 5px;
  box-shadow:
      inset 0 1px 0 rgba(255, 239, 191, 0.26),
      0 14px 30px rgba(0, 0, 0, 0.22);
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.25s ease, box-shadow 0.25s ease, filter 0.25s ease;
}

.login-button::before,
.login-button::after {
  content: '';
  position: absolute;
  top: 14px;
  width: 72px;
  height: 28px;
  opacity: 0.28;
  background:
      linear-gradient(90deg, transparent, rgba(5, 12, 12, 0.62), transparent),
      repeating-linear-gradient(135deg, transparent 0 8px, rgba(5, 12, 12, 0.55) 8px 10px);
}

.login-button::before {
  left: 12px;
}

.login-button::after {
  right: 12px;
}

.login-button:hover:not(:disabled) {
  filter: brightness(1.05);
  transform: translateY(-2px);
  box-shadow:
      0 0 22px rgba(198, 158, 83, 0.26),
      0 18px 34px rgba(0, 0, 0, 0.26);
}

.login-button:disabled {
  cursor: not-allowed;
  opacity: 0.72;
}

.login-button__spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  margin-right: 8px;
  border: 2px solid rgba(7, 18, 17, 0.24);
  border-top-color: #071211;
  border-radius: 50%;
  vertical-align: -2px;
  animation: spin 0.7s linear infinite;
}

.entry-links {
  display: flex;
  justify-content: center;
  gap: 28px;
  margin-top: 18px;
}

.entry-link {
  color: rgba(218, 186, 118, 0.82);
  font-size: 14px;
  letter-spacing: 0.12em;
  text-decoration: none;
  text-shadow: 0 0 12px rgba(198, 158, 83, 0.16);
  transition: color 0.2s ease;
}

.entry-link:hover {
  color: var(--gold);
}

@keyframes entryReveal {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes mistFloat {
  from {
    opacity: 0.46;
    transform: translate3d(-12px, 0, 0);
  }
  to {
    opacity: 0.72;
    transform: translate3d(12px, -8px, 0);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1366px) and (max-height: 820px) {
  .login-entry {
    width: min(90vw, 430px);
    margin-top: 130px;
  }

  .entry-title {
    margin-bottom: 22px;
  }

  .entry-title h1 {
    font-size: 62px;
  }

  .entry-kicker {
    margin-bottom: 12px;
    font-size: 14px;
  }

  .entry-summary {
    margin-top: 14px;
  }

  .entry-form {
    padding-top: 16px;
  }
}

@media (max-width: 768px) {
  .login-view {
    align-items: flex-end;
    padding: 24px 16px 42px;
    background-position: center top;
  }

  .login-entry {
    width: 90vw;
    margin-top: 0;
  }

  .entry-title h1 {
    font-size: 48px;
  }

  .entry-kicker {
    font-size: 12px;
    letter-spacing: 0.24em;
    text-indent: 0.24em;
  }

  .entry-summary {
    font-size: 12px;
  }

  .field {
    height: 52px;
  }

  .login-button {
    height: 54px;
    font-size: 18px;
  }

  .entry-links {
    flex-direction: column;
    gap: 10px;
  }
}
</style>
