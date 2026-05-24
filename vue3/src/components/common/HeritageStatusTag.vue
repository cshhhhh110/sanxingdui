<template>
  <span class="status-pill" :class="[`status-pill--${status}`, customClass]">
    <span v-if="showIcon" class="status-pill__dot" aria-hidden="true" />
    {{ statusText }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: { type: Number, required: true },
  statusName: { type: String, default: '' },
  size: {
    type: String,
    default: 'default',
    validator: (v) => ['large', 'default', 'small'].includes(v)
  },
  showIcon: { type: Boolean, default: false },
  customClass: { type: String, default: '' }
})

const statusConfig = computed(() => {
  const map = {
    0: { text: '草稿' },
    1: { text: '待审' },
    2: { text: '已发布' },
    3: { text: '下架' }
  }
  return map[props.status] || map[0]
})

const statusText = computed(() => props.statusName || statusConfig.value.text)
</script>

<style lang="scss" scoped>
$accent: #42664f;
$black: #111;
$muted: #6b6b6b;
$border: #e8e8e8;

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 600;
  border: 1px solid $border;
  line-height: 1.4;

  &__dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: currentColor;
  }

  &--0 {
    color: $muted;
    border-color: $border;
    background: #fafafa;
  }

  &--1 {
    color: $black;
    border-color: $black;
    background: #fff;
  }

  &--2 {
    color: $accent;
    border-color: $accent;
    background: rgba($accent, 0.08);
  }

  &--3 {
    color: $muted;
    border-color: $border;
    text-decoration: line-through;
    background: #fafafa;
  }
}
</style>
