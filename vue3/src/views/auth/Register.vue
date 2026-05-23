<template>
  <main class="auth-view auth-view--register">
    <div class="auth-view__halo" />
    <div class="auth-view__mist auth-view__mist--left" />
    <div class="auth-view__mist auth-view__mist--right" />

    <section class="auth-entry" aria-label="三星堆古文明数字文化展示系统注册入口">
      <div class="entry-title">
        <p class="entry-kicker">古文明数字文化展示系统</p>
        <h1>入馆登记</h1>
        <p class="entry-summary">创建账号，开启古蜀文明数字展陈之旅</p>
      </div>

      <form class="entry-form" @submit.prevent="handleRegister">
        <div class="inscription-line" aria-hidden="true" />

        <label
            v-for="field in registerFields"
            :key="field.prop"
            class="field"
            :class="{ 'field--error': errors[field.prop] }"
        >
          <component :is="field.icon" class="field__icon" />
          <input
              v-model="registerForm[field.prop]"
              :type="getInputType(field)"
              :autocomplete="field.autocomplete"
              :placeholder="errors[field.prop] || field.placeholder"
              @input="clearError(field.prop)"
              @blur="validateField(field.prop)"
          />
          <button
              v-if="field.type === 'password'"
              class="field__toggle"
              type="button"
              :aria-label="passwordVisible[field.prop] ? '隐藏密码' : '显示密码'"
              @click="passwordVisible[field.prop] = !passwordVisible[field.prop]"
          >
            <EyeInvisibleOutlined v-if="passwordVisible[field.prop]" />
            <EyeOutlined v-else />
          </button>
        </label>

        <button class="auth-button" type="submit" :disabled="loading">
          <span v-if="loading" class="auth-button__spinner" />
          <span>{{ loading ? '登记中' : '注 册' }}</span>
        </button>

        <div class="entry-links">
          <router-link class="entry-link" to="/auth/login">
            已有账号？返回登录
          </router-link>
        </div>
      </form>
    </section>
  </main>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  EyeInvisibleOutlined,
  EyeOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  UserOutlined
} from '@ant-design/icons-vue'
import { register } from '@/api/user'

const router = useRouter()
const loading = ref(false)

const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  email: '',
  phone: '',
  name: '',
  userType: 'USER'
})

const errors = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  email: '',
  phone: '',
  name: ''
})

const passwordVisible = reactive({
  password: false,
  confirmPassword: false
})

const registerFields = [
  { prop: 'username', placeholder: '请输入用户名', icon: UserOutlined, autocomplete: 'username' },
  { prop: 'password', type: 'password', placeholder: '请输入密码', icon: LockOutlined, autocomplete: 'new-password' },
  { prop: 'confirmPassword', type: 'password', placeholder: '请确认密码', icon: LockOutlined, autocomplete: 'new-password' },
  { prop: 'email', placeholder: '请输入邮箱', icon: MailOutlined, autocomplete: 'email' },
  { prop: 'phone', placeholder: '请输入手机号', icon: PhoneOutlined, autocomplete: 'tel' },
  { prop: 'name', placeholder: '请输入姓名', icon: UserOutlined, autocomplete: 'name' }
]

const getInputType = (field) => {
  if (field.type !== 'password') {
    return field.type || 'text'
  }

  return passwordVisible[field.prop] ? 'text' : 'password'
}

const validateField = (fieldName) => {
  const value = registerForm[fieldName]
  const text = typeof value === 'string' ? value.trim() : value

  if (fieldName === 'username') {
    if (!text) errors.username = '请输入用户名'
    else if (text.length < 3 || text.length > 50) errors.username = '用户名长度必须在3到50个字符之间'
    else errors.username = ''
  }

  if (fieldName === 'password') {
    if (!text) errors.password = '请输入密码'
    else if (text.length < 6 || text.length > 100) errors.password = '密码长度必须在6到100个字符之间'
    else errors.password = ''

    if (registerForm.confirmPassword) {
      validateField('confirmPassword')
    }
  }

  if (fieldName === 'confirmPassword') {
    if (!text) errors.confirmPassword = '请再次输入密码'
    else if (value !== registerForm.password) errors.confirmPassword = '两次输入密码不一致'
    else errors.confirmPassword = ''
  }

  if (fieldName === 'email') {
    const emailRegex = /^[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)*@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/
    if (!text) errors.email = '请输入邮箱'
    else if (!emailRegex.test(text)) errors.email = '邮箱格式不正确'
    else errors.email = ''
  }

  if (fieldName === 'phone') {
    if (text && !/^1[3-9]\d{9}$/.test(text)) errors.phone = '手机号格式不正确'
    else errors.phone = ''
  }

  if (fieldName === 'name') {
    errors.name = ''
  }

  return !errors[fieldName]
}

const clearError = (fieldName) => {
  errors[fieldName] = ''
}

const validateForm = () => {
  return registerFields.every((field) => validateField(field.prop))
}

const handleRegister = async () => {
  if (!validateForm()) {
    return
  }

  loading.value = true

  try {
    await register(registerForm, {
      successMsg: '注册成功',
      showDefaultMsg: true,
      onSuccess: () => {
        router.push('/auth/login')
      }
    })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-view {
  --gold: #f3dfb1;
  --gold-muted: rgba(196, 159, 92, 0.62);
  --ink: #030a0a;
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28px 20px;
  overflow: hidden;
  background:
      radial-gradient(circle at 50% 55%, rgba(198, 158, 83, 0.18), transparent 26%),
      linear-gradient(180deg, rgba(0, 0, 0, 0.12), rgba(0, 0, 0, 0.54)),
      linear-gradient(90deg, rgba(0, 0, 0, 0.48), rgba(0, 0, 0, 0.08) 45%, rgba(0, 0, 0, 0.5)),
      url('@/assets/samsungdui-login-bg.png') center / cover no-repeat;
  color: var(--gold);
}

.auth-view::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
      radial-gradient(ellipse at center, transparent 42%, rgba(0, 0, 0, 0.66) 100%),
      linear-gradient(180deg, rgba(0, 0, 0, 0.18), transparent 35%, rgba(0, 0, 0, 0.4));
  pointer-events: none;
}

.auth-view__halo {
  position: absolute;
  width: min(760px, 78vw);
  height: min(560px, 62vh);
  top: 18%;
  left: 50%;
  transform: translateX(-50%);
  background: radial-gradient(circle, rgba(220, 187, 111, 0.15), transparent 66%);
  filter: blur(8px);
  pointer-events: none;
}

.auth-view__mist {
  position: absolute;
  width: 38vw;
  height: 18vh;
  bottom: 18%;
  background: radial-gradient(ellipse, rgba(215, 200, 156, 0.12), transparent 68%);
  filter: blur(18px);
  animation: mistFloat 9s ease-in-out infinite alternate;
  pointer-events: none;
}

.auth-view__mist--left {
  left: 11%;
}

.auth-view__mist--right {
  right: 10%;
  animation-delay: -3s;
}

.auth-entry {
  position: relative;
  z-index: 1;
  width: min(90vw, 460px);
  margin-top: 122px;
  text-align: center;
  animation: entryReveal 700ms ease-out both;
}

.entry-title {
  margin-bottom: 22px;
}

.entry-kicker {
  margin: 0 0 12px;
  color: rgba(243, 223, 177, 0.9);
  font-size: 14px;
  letter-spacing: 0.34em;
  text-indent: 0.34em;
  text-shadow: 0 0 14px rgba(198, 158, 83, 0.35);
}

.entry-title h1 {
  margin: 0;
  color: var(--gold);
  font-family: "STXingkai", "STZhongsong", "Noto Serif SC", serif;
  font-size: 54px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.14em;
  text-indent: 0.14em;
  text-shadow:
      0 0 18px rgba(198, 158, 83, 0.34),
      0 6px 18px rgba(0, 0, 0, 0.42);
}

.entry-summary {
  margin: 14px 0 0;
  color: rgba(230, 211, 166, 0.7);
  font-size: 13px;
  letter-spacing: 0.1em;
}

.entry-form {
  position: relative;
  padding-top: 16px;
}

.inscription-line {
  width: 100%;
  height: 1px;
  margin-bottom: 18px;
  background:
      linear-gradient(90deg, transparent, rgba(196, 159, 92, 0.72), transparent),
      repeating-linear-gradient(90deg, transparent 0 16px, rgba(196, 159, 92, 0.24) 16px 17px);
  opacity: 0.82;
}

.field {
  position: relative;
  display: flex;
  align-items: center;
  height: 48px;
  margin-bottom: 12px;
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
  left: 17px;
  color: rgba(198, 158, 83, 0.86);
  font-size: 17px;
}

.field input {
  width: 100%;
  height: 100%;
  padding: 0 50px;
  color: rgba(243, 223, 177, 0.94);
  font-size: 15px;
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
  right: 14px;
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
}

.auth-button {
  width: 100%;
  height: 54px;
  margin-top: 8px;
  color: #071211;
  font-size: 19px;
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
  transition: transform 0.25s ease, box-shadow 0.25s ease, filter 0.25s ease;
}

.auth-button:hover:not(:disabled) {
  filter: brightness(1.05);
  transform: translateY(-2px);
  box-shadow:
      0 0 22px rgba(198, 158, 83, 0.26),
      0 18px 34px rgba(0, 0, 0, 0.26);
}

.auth-button:disabled {
  cursor: not-allowed;
  opacity: 0.72;
}

.auth-button__spinner {
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
  margin-top: 16px;
}

.entry-link {
  color: rgba(218, 186, 118, 0.82);
  font-size: 14px;
  letter-spacing: 0.12em;
  text-decoration: none;
  text-shadow: 0 0 12px rgba(198, 158, 83, 0.16);
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
  .auth-entry {
    width: min(90vw, 430px);
    margin-top: 72px;
  }

  .entry-title {
    margin-bottom: 16px;
  }

  .entry-title h1 {
    font-size: 42px;
  }

  .entry-kicker,
  .entry-summary {
    font-size: 12px;
  }

  .field {
    height: 44px;
    margin-bottom: 10px;
  }

  .auth-button {
    height: 48px;
  }
}

@media (max-width: 768px) {
  .auth-view {
    align-items: flex-end;
    padding: 24px 16px 34px;
    background-position: center top;
  }

  .auth-entry {
    width: 90vw;
    margin-top: 0;
  }

  .entry-title h1 {
    font-size: 38px;
  }
}
</style>
