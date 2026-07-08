<template>
  <div class="auth-form">
    <!-- 表单标题 -->
    <div class="form-header">
      <h2>{{ title }}</h2>
    </div>

    <!-- 表单内容 -->
    <form @submit.prevent="handleSubmit" ref="formRef">
      <!-- 动态渲染表单项 -->
      <div
        v-for="field in fields"
        :key="field.prop"
        class="form-item"
        :class="{ 'has-error': errors[field.prop] }"
      >
        <div class="input-wrapper">
          <span v-if="field.icon" class="input-icon">
            <component :is="field.icon" />
          </span>
          <input
            v-if="field.type !== 'password'"
            v-model="localFormData[field.prop]"
            :type="field.type || 'text'"
            :placeholder="errors[field.prop] || field.placeholder"
            @keypress.enter="handleSubmit"
            @blur="validateField(field.prop)"
            @input="handleInput(field.prop)"
          />
          <input
            v-else
            v-model="localFormData[field.prop]"
            type="password"
            :placeholder="errors[field.prop] || field.placeholder"
            @keypress.enter="handleSubmit"
            @blur="validateField(field.prop)"
            @input="handleInput(field.prop)"
          />
        </div>
      </div>

      <!-- 提交按钮 -->
      <div class="form-item">
        <button
          type="submit"
          class="submit-btn"
          :disabled="loading"
        >
          <span v-if="loading" class="loading-spinner"></span>
          {{ loading ? '提交中...' : submitText }}
        </button>
      </div>
    </form>

    <!-- 底部链接 -->
    <div class="form-links" v-if="links && links.length">
      <div v-for="link in links" :key="link.text" class="link-item">
        <router-link :to="link.to">{{ link.text }}</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  fields: {
    type: Array,
    required: true
  },
  formData: {
    type: Object,
    required: true
  },
  rules: {
    type: Object,
    required: true
  },
  submitText: {
    type: String,
    default: '提交'
  },
  loading: {
    type: Boolean,
    default: false
  },
  links: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['submit', 'update:formData'])

const formRef = ref(null)
const errors = reactive({})
const localFormData = reactive({ ...props.formData })

watch(() => props.formData, (value) => {
  Object.assign(localFormData, value)
}, { deep: true })

// 验证单个字段
const validateField = (fieldName) => {
  const fieldRules = props.rules[fieldName]
  if (!fieldRules) return true

  const value = localFormData[fieldName]

  for (const rule of fieldRules) {
    // 必填验证
    if (rule.required && (!value || value.trim() === '')) {
      errors[fieldName] = rule.message
      return false
    }

    // 最小长度验证
    if (rule.min && value && value.length < rule.min) {
      errors[fieldName] = rule.message
      return false
    }

    // 最大长度验证
    if (rule.max && value && value.length > rule.max) {
      errors[fieldName] = rule.message
      return false
    }

    // 正则验证
    if (rule.pattern && value && !rule.pattern.test(value)) {
      errors[fieldName] = rule.message
      return false
    }

    // 邮箱验证
    if (rule.type === 'email' && value) {
      const emailRegex = /^[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)*@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/
      if (!emailRegex.test(value)) {
        errors[fieldName] = rule.message
        return false
      }
    }

    // 自定义验证器 (支持同步和异步)
    if (rule.validator) {
      try {
        const result = rule.validator(rule, value)
        // 如果返回Promise，等待结果
        if (result && typeof result.catch === 'function') {
          result.catch(err => {
            errors[fieldName] = err.message || err
          })
          return true // 异步验证暂时返回true
        }
      } catch (error) {
        errors[fieldName] = error.message || error
        return false
      }
    }
  }

  delete errors[fieldName]
  return true
}

// 清除错误
const clearError = (fieldName) => {
  delete errors[fieldName]
}

const handleInput = (fieldName) => {
  clearError(fieldName)
  emit('update:formData', { ...localFormData })
}

// 验证所有字段
const validateForm = () => {
  let isValid = true
  Object.keys(props.rules).forEach(fieldName => {
    if (!validateField(fieldName)) {
      isValid = false
    }
  })
  return isValid
}

const handleSubmit = () => {
  if (validateForm()) {
    emit('submit', { ...localFormData })
  }
}

defineExpose({
  formRef,
  validateForm
})
</script>

<style scoped>
/* 引入思源字体 */
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;700&family=Noto+Sans+SC:wght@400;500&display=swap');

.auth-form {
  width: 100%;
  font-family: 'Noto Sans SC', '思源黑体', sans-serif;
}

.form-header {
  text-align: center;
  margin-bottom: 2rem;
}

.form-header h2 {
  margin: 0;
  font-family: 'Noto Serif SC', '思源宋体', serif;
  font-size: 1.6rem;
  font-weight: 700;
  color: #2C2C2C;
  letter-spacing: 0.2rem;
}

/* 表单项样式 */
.form-item {
  margin-bottom: 1rem;
  position: relative;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 16px;
  color: #999999;
  font-size: 16px;
  z-index: 1;
  display: flex;
  align-items: center;
}

.input-wrapper input {
  width: 100%;
  height: 48px;
  padding: 0 16px;
  padding-left: 45px;
  border: 1px solid #E0E0E0;
  border-radius: 2px;
  font-size: 0.95rem;
  font-family: 'Noto Sans SC', '思源黑体', sans-serif;
  color: #2C2C2C;
  background: rgba(255, 255, 255, 0.60);
  transition: all 0.3s ease;
  outline: none;
}

.input-wrapper input::placeholder {
  color: #999999;
  transition: color 0.3s ease;
}

/* 错误状态下的占位符颜色 */
.form-item.has-error .input-wrapper input::placeholder {
  color: #D4282D;
}

.input-wrapper input:hover {
  border-color: #C5A572;
}

.input-wrapper input:focus {
  border-color: #7BA4A8;
  box-shadow: 0 0 0 2px rgba(123, 164, 168, 0.1);
}

/* 错误状态 */
.form-item.has-error .input-wrapper input {
  border-color: #D4282D;
  animation: shake 0.3s ease;
}

/* 抖动动画 */
@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  75% {
    transform: translateX(5px);
  }
}

/* 提交按钮样式 */
.submit-btn {
  width: 100%;
  height: 48px;
  border: none;
  border-radius: 2px;
  background: linear-gradient(135deg, #D4282D, #B8252A);
  color: white;
  font-size: 1rem;
  font-weight: 500;
  font-family: 'Noto Sans SC', '思源黑体', sans-serif;
  letter-spacing: 0.2rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(212, 40, 45, 0.3);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.submit-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #B8252A, #D4282D);
  box-shadow: 0 6px 16px rgba(212, 40, 45, 0.4);
  transform: translateY(-2px);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(0);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 加载动画 */
.loading-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.form-links {
  text-align: center;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(197, 165, 114, 0.2);
}

.link-item {
  margin: 0.8rem 0;
}

.link-item a {
  color: #7BA4A8;
  text-decoration: none;
  font-size: 0.9rem;
  letter-spacing: 0.05rem;
  transition: all 0.3s ease;
  position: relative;
}

.link-item a::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 50%;
  width: 0;
  height: 1px;
  background: #7BA4A8;
  transition: all 0.3s ease;
  transform: translateX(-50%);
}

.link-item a:hover {
  color: #5A8A8E;
}

.link-item a:hover::after {
  width: 100%;
}
</style>
