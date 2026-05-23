<template>
  <a-tag 
    :color="tagColor" 
    :class="['heritage-status-tag', customClass]"
  >
    <i v-if="showIcon" :class="iconClass"></i>
    {{ statusText }}
  </a-tag>
</template>

<script setup>
import { computed } from 'vue'

// ========== 组件属性 ==========
const props = defineProps({
  // 状态码
  status: {
    type: Number,
    required: true
  },
  // 状态名称（可选，优先使用）
  statusName: {
    type: String,
    default: ''
  },
  // 标签大小（Ant Design Vue 不需要这个属性，但保留兼容性）
  size: {
    type: String,
    default: 'default',
    validator: (value) => ['large', 'default', 'small'].includes(value)
  },
  // 是否显示图标
  showIcon: {
    type: Boolean,
    default: false
  },
  // 自定义样式类
  customClass: {
    type: String,
    default: ''
  }
})

// ========== 计算属性 ==========

// 状态配置映射
const statusConfig = computed(() => {
  const configMap = {
    0: {
      color: 'default',
      text: '草稿',
      icon: 'fas fa-edit'
    },
    1: {
      color: 'orange',
      text: '待审',
      icon: 'fas fa-clock'
    },
    2: {
      color: 'green',
      text: '已发布',
      icon: 'fas fa-check-circle'
    },
    3: {
      color: 'red',
      text: '下架',
      icon: 'fas fa-times-circle'
    }
  }
  return configMap[props.status] || configMap[0]
})

// 标签颜色
const tagColor = computed(() => {
  return statusConfig.value.color
})

// 状态文本
const statusText = computed(() => {
  return props.statusName || statusConfig.value.text
})

// 图标类名
const iconClass = computed(() => {
  return statusConfig.value.icon
})
</script>

<style scoped>
.heritage-status-tag {
  font-weight: 500;
  display: inline-flex;
  align-items: center;
}

.heritage-status-tag i {
  margin-right: 4px;
  font-size: 12px;
}

/* 自定义样式增强 */
:deep(.ant-tag) {
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 12px;
  line-height: 1.5;
}

/* 大尺寸样式 */
.heritage-status-tag.large :deep(.ant-tag) {
  padding: 4px 12px;
  font-size: 14px;
}

/* 小尺寸样式 */
.heritage-status-tag.small :deep(.ant-tag) {
  padding: 1px 6px;
  font-size: 11px;
}
</style>

