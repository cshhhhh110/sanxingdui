<template>
  <Live2DAvatar />
  <router-view v-slot="{ Component }">
    <transition name="scroll-reveal" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
</template>

<script setup>
import Live2DAvatar from '@/components/Live2DAvatar.vue'
import { setupMcpEventListeners } from '@/plugins/mcpListeners.js'

setupMcpEventListeners()
</script>

<style lang="scss">
#app {
  min-height: 100vh;
}
</style>
