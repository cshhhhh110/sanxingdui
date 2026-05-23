<template>
  <a-layout class="frontend-layout">
    <Navbar
      :immersive="isShowcaseTransitionRoute"
      :immersive-label="currentStage?.shortLabel || ''"
      :immersive-description="currentStage?.description || '沿着策展主线向前，像逛展一样理解三星堆。'"
    />

    <a-layout-content class="main-content">
      <div class="content-wrapper" :class="{ 'content-wrapper--showcase': isShowcaseTransitionRoute }">
        <div v-if="isShowcaseTransitionRoute" class="showcase-atmosphere" aria-hidden="true"></div>
        <div v-if="showShowcaseProgress" class="showcase-progress" aria-label="展线导览">
          <div class="showcase-progress__track">
            <div class="showcase-progress__line">
              <span
                class="showcase-progress__line-fill"
                :style="{ transform: `scaleX(${progressScale})` }"
              ></span>
            </div>
            <div class="showcase-progress__steps">
              <button
                v-for="(step, index) in showcaseStages"
                :key="step.name"
                type="button"
                class="showcase-progress__step"
                :class="{
                  'is-active': step.name === route.name,
                  'is-done': index < currentStageIndex
                }"
                @click="goToStage(step)"
              >
                <span class="showcase-progress__dot"></span>
                <span class="showcase-progress__label">{{ step.shortLabel }}</span>
              </button>
            </div>
          </div>
        </div>

        <router-view v-slot="{ Component, route: viewRoute }">
          <transition :name="transitionName" mode="out-in" appear>
            <div
              :key="viewRoute.name || viewRoute.path"
              class="route-stage"
              :class="{ 'route-stage--showcase': isShowcaseTransitionRoute }"
            >
              <component :is="Component" />
            </div>
          </transition>
        </router-view>
      </div>
    </a-layout-content>
  </a-layout>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Navbar from '@/components/frontend/Navbar.vue'

const route = useRoute()
const router = useRouter()
const previousRouteName = ref(null)

const showcaseTransitionRouteOrder = {
  Home: -1,
  tanmi: 0,
  '3dlist': 1,
  '3d': 2,
  AiChat: 3
}

const showcaseStages = [
  {
    name: 'tanmi',
    shortLabel: '时空探索',
    goal: '站上时空坐标',
    description: '从时代、遗址与工艺定点进入古蜀文明。',
    path: '/tanmi'
  },
  {
    name: '3dlist',
    shortLabel: '文物展厅',
    goal: '走近核心展品',
    description: '在展厅中停下来，先挑一件值得先看的文物。',
    path: '/3dlist'
  },
  {
    name: '3d',
    shortLabel: '3D 展示',
    goal: '看见关系网络',
    description: '面对展品本身，理解它与祭祀、工艺和王权的关系。',
    path: '/3d'
  },
  {
    name: 'AiChat',
    shortLabel: 'AI 解说',
    goal: '听玄喵串讲',
    description: '让讲解员把你刚看过的文物、时代与工艺串成一个故事。',
    path: '/ai-chat'
  }
]

const isShowcaseTransitionRoute = computed(() => {
  return Object.prototype.hasOwnProperty.call(showcaseTransitionRouteOrder, String(route.name || ''))
})

const currentStageIndex = computed(() => {
  return showcaseStages.findIndex((step) => step.name === route.name)
})

const currentStage = computed(() => {
  return currentStageIndex.value >= 0 ? showcaseStages[currentStageIndex.value] : null
})

const showShowcaseProgress = computed(() => currentStageIndex.value >= 0)

const progressScale = computed(() => {
  if (currentStageIndex.value < 0) {
    return 0
  }

  if (showcaseStages.length <= 1) {
    return 1
  }

  return currentStageIndex.value / (showcaseStages.length - 1)
})

const transitionName = computed(() => {
  const currentName = String(route.name || '')
  const previousName = String(previousRouteName.value || '')
  const currentIndex = showcaseTransitionRouteOrder[currentName]
  const previousIndex = showcaseTransitionRouteOrder[previousName]

  if (Number.isInteger(currentIndex) && Number.isInteger(previousIndex)) {
    return currentIndex >= previousIndex ? 'museum-glide-next' : 'museum-glide-prev'
  }

  if (Number.isInteger(currentIndex) || Number.isInteger(previousIndex)) {
    return 'museum-fade'
  }

  return 'layout-fade'
})

watch(
  () => route.name,
  (next, prev) => {
    if (next !== prev) {
      previousRouteName.value = prev || null
    }
  },
  { flush: 'pre' }
)

function goToStage(step) {
  if (!step?.path || step.name === route.name) {
    return
  }

  router.push(step.path)
}
</script>

<style>
.frontend-layout {
  min-height: 100vh;
  background: #faf8f3;
}

.main-content {
  margin-top: 64px;
  min-height: calc(100vh - 64px);
}

.content-wrapper {
  position: relative;
  width: 100%;
  margin: 0 auto;
  padding: 0;
}

.content-wrapper--showcase {
  isolation: isolate;
  overflow: hidden;
  padding-top: 4px;
  background:
    radial-gradient(circle at 14% 10%, rgba(214, 189, 130, 0.15), transparent 24%),
    radial-gradient(circle at 86% 12%, rgba(66, 102, 79, 0.11), transparent 26%),
    linear-gradient(180deg, rgba(255, 251, 242, 0.82), rgba(246, 241, 229, 0.62));
}

.content-wrapper--showcase::before,
.content-wrapper--showcase::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.content-wrapper--showcase::before {
  background:
    linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.16),
      transparent 22%,
      transparent 78%,
      rgba(255, 255, 255, 0.12)
    ),
    radial-gradient(circle at center, rgba(255, 255, 255, 0.14), transparent 62%);
}

.content-wrapper--showcase::after {
  inset: auto 0 0;
  height: 180px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0), rgba(246, 241, 229, 0.42));
}

.showcase-atmosphere {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.95;
  background:
    radial-gradient(circle at 20% 24%, rgba(214, 189, 130, 0.12), transparent 0 18%),
    radial-gradient(circle at 80% 18%, rgba(66, 102, 79, 0.08), transparent 0 20%);
  filter: blur(2px);
}

.showcase-progress {
  position: relative;
  z-index: 2;
  width: min(1120px, calc(100% - 40px));
  margin: 0 auto 2px;
  padding: 0 0 4px;
}

.showcase-progress__track {
  position: relative;
}

.showcase-progress__line {
  position: absolute;
  left: 72px;
  right: 72px;
  top: 11px;
  height: 1px;
  background: rgba(184, 146, 67, 0.24);
}

.showcase-progress__line-fill {
  display: block;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, rgba(66, 102, 79, 0.92), rgba(184, 146, 67, 0.82));
  transform-origin: left center;
  transition: transform 0.28s ease;
}

.showcase-progress__steps {
  position: relative;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.showcase-progress__step {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0;
  border: 0;
  background: transparent;
  color: rgba(57, 91, 69, 0.52);
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: color 0.18s ease, transform 0.18s ease;
}

.showcase-progress__step:hover {
  color: #31533f;
}

.showcase-progress__step.is-active {
  color: #18372b;
}

.showcase-progress__step.is-done {
  color: #42664f;
}

.showcase-progress__dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #d6bd82;
  box-shadow: 0 0 0 4px rgba(214, 189, 130, 0.1);
  transition: transform 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
}

.showcase-progress__step.is-active .showcase-progress__dot {
  background: #42664f;
  box-shadow: 0 0 0 5px rgba(66, 102, 79, 0.12);
  transform: scale(1.08);
}

.showcase-progress__step.is-done .showcase-progress__dot {
  background: #42664f;
}

.showcase-progress__label {
  white-space: nowrap;
}

.route-stage {
  position: relative;
  z-index: 1;
  min-height: calc(100vh - 64px);
}

.route-stage--showcase {
  transform-origin: center top;
}

.museum-glide-next-enter-active,
.museum-glide-next-leave-active,
.museum-glide-prev-enter-active,
.museum-glide-prev-leave-active,
.museum-fade-enter-active,
.museum-fade-leave-active,
.layout-fade-enter-active,
.layout-fade-leave-active {
  transition:
    opacity 0.62s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.62s cubic-bezier(0.22, 1, 0.36, 1),
    filter 0.62s cubic-bezier(0.22, 1, 0.36, 1);
}

.museum-glide-next-enter-from {
  opacity: 0;
  transform: translate3d(72px, 18px, 0) scale(0.986);
  filter: blur(10px);
}

.museum-glide-next-leave-to {
  opacity: 0;
  transform: translate3d(-52px, -10px, 0) scale(1.01);
  filter: blur(8px);
}

.museum-glide-prev-enter-from {
  opacity: 0;
  transform: translate3d(-72px, 18px, 0) scale(0.986);
  filter: blur(10px);
}

.museum-glide-prev-leave-to {
  opacity: 0;
  transform: translate3d(52px, -10px, 0) scale(1.01);
  filter: blur(8px);
}

.museum-fade-enter-from,
.museum-fade-leave-to {
  opacity: 0;
  transform: translateY(16px) scale(0.992);
  filter: blur(8px);
}

.layout-fade-enter-from,
.layout-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

.museum-glide-next-enter-to,
.museum-glide-next-leave-from,
.museum-glide-prev-enter-to,
.museum-glide-prev-leave-from,
.museum-fade-enter-to,
.museum-fade-leave-from,
.layout-fade-enter-to,
.layout-fade-leave-from {
  opacity: 1;
  transform: translate3d(0, 0, 0) scale(1);
  filter: blur(0);
}

@media (max-width: 768px) {
  .content-wrapper--showcase {
    padding-top: 2px;
  }

  .showcase-progress {
    width: calc(100% - 28px);
    margin-bottom: 0;
  }

  .showcase-progress__line {
    left: 36px;
    right: 36px;
  }

  .showcase-progress__steps {
    gap: 8px;
  }

  .showcase-progress__label {
    font-size: 14px;
  }

  .route-stage {
    min-height: calc(100vh - 64px);
  }

  .museum-glide-next-enter-from,
  .museum-glide-prev-enter-from {
    transform: translate3d(0, 22px, 0) scale(0.992);
  }

  .museum-glide-next-leave-to,
  .museum-glide-prev-leave-to {
    transform: translate3d(0, -14px, 0) scale(1.006);
  }

}
</style>
