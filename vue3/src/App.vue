<template>
  <Live2DAvatar />
  <router-view v-slot="{ Component, route }">
    <transition name="app-shell-fade" mode="out-in">
      <component :is="Component" :key="route.matched[0]?.path || route.path" />
    </transition>
  </router-view>
</template>

<script setup>
import Live2DAvatar from '@/components/Live2DAvatar.vue'
</script>

<style>
#app {
  min-height: 100vh;
}

.app-shell-fade-enter-active,
.app-shell-fade-leave-active {
  transition: opacity 0.28s ease, transform 0.28s ease;
}

.app-shell-fade-enter-from,
.app-shell-fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

.app-shell-fade-enter-to,
.app-shell-fade-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>
