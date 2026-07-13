<template>
  <div v-if="open" class="works-drawer" role="dialog" aria-modal="true" aria-label="我的作品">
    <button class="works-drawer__backdrop" type="button" aria-label="关闭我的作品" @click="$emit('close')"></button>
    <aside class="works-drawer__panel">
      <header>
        <div><span>玄喵创作档案</span><h2>我的作品</h2></div>
        <div class="works-drawer__header-actions">
          <button type="button" title="刷新作品" @click="$emit('refresh')"><i class="fas fa-rotate"></i></button>
          <button type="button" title="关闭" @click="$emit('close')"><i class="fas fa-xmark"></i></button>
        </div>
      </header>

      <div class="works-drawer__summary">
        <div><strong>{{ runningCount }}</strong><span>生成中</span></div>
        <div><strong>{{ completedCount }}</strong><span>已完成</span></div>
        <p>作品保存在当前账号下，刷新页面后仍可继续查看生成进度。</p>
      </div>

      <div class="works-drawer__body">
        <div v-if="loading" class="works-drawer__empty"><i class="fas fa-spinner fa-spin"></i><span>正在整理作品</span></div>
        <div v-else-if="!tasks.length" class="works-drawer__empty"><i class="fas fa-images"></i><strong>还没有作品</strong><span>在对话中描述你想生成的画面即可开始。</span></div>
        <button
          v-for="task in tasks"
          v-else
          :key="task.taskId"
          class="work-list-item"
          type="button"
          @click="$emit('select', task)"
        >
          <span class="work-list-item__preview">
            <img v-if="task.status === 'SUCCEEDED' && task.resultUrl" :src="normalizeUrl(task.resultUrl)" alt="" loading="lazy" />
            <i v-else :class="running(task) ? 'fas fa-wand-magic-sparkles' : 'fas fa-image'"></i>
          </span>
          <span class="work-list-item__copy">
            <strong>{{ task.promptRaw || 'AI生成作品' }}</strong>
            <small>{{ statusText(task) }} · {{ task.modelProfile === 'QUALITY' ? '品质模式' : '快速模式' }}</small>
          </span>
          <span class="work-list-item__action">查看</span>
        </button>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  open: Boolean,
  tasks: { type: Array, default: () => [] },
  loading: Boolean
})

defineEmits(['close', 'refresh', 'select'])

const runningCount = computed(() => props.tasks.filter(running).length)
const completedCount = computed(() => props.tasks.filter((task) => task.status === 'SUCCEEDED').length)

function running(task) { return ['PENDING', 'PROCESSING'].includes(task?.status) }
function normalizeUrl(url) { return url?.startsWith('/api/') ? url.slice(4) : url }
function statusText(task) {
  if (running(task)) return task.stageMessage || '正在生成'
  return ({ SUCCEEDED: '已完成', FAILED: '未完成', CANCELED: '已取消' })[task.status] || task.status
}
</script>

<style scoped>
.works-drawer { position: fixed; z-index: 1000002; inset: 0; }
.works-drawer__backdrop { position: absolute; inset: 0; width: 100%; border: 0; background: rgba(20, 31, 25, .42); backdrop-filter: blur(3px); cursor: default; }
.works-drawer__panel { position: absolute; top: 0; right: 0; display: flex; width: min(440px, 92vw); height: 100%; flex-direction: column; color: #263d31; border-left: 1px solid rgba(202, 173, 105, .35); background: #f9f7ef; box-shadow: -24px 0 70px rgba(24, 43, 32, .18); animation: drawerIn .24s ease-out; }
.works-drawer__panel header { display: flex; justify-content: space-between; align-items: center; padding: 25px 24px 17px; border-bottom: 1px solid rgba(76, 100, 83, .11); background: radial-gradient(circle at 8% 0, rgba(211, 180, 105, .22), transparent 40%); }
.works-drawer__panel header span { color: #9a7333; font-size: 10px; font-weight: 800; letter-spacing: .17em; }
.works-drawer__panel h2 { margin: 3px 0 0; font: 700 26px/1.15 "Noto Serif SC", "STSong", serif; }
.works-drawer__header-actions { display: flex; gap: 6px; }
.works-drawer__header-actions button { display: grid; width: 36px; height: 36px; place-items: center; color: #315d45; border: 1px solid rgba(49, 93, 69, .18); border-radius: 50%; background: rgba(255,255,255,.74); cursor: pointer; }
.works-drawer__summary { display: grid; grid-template-columns: 90px 90px 1fr; gap: 8px; padding: 15px 20px; border-bottom: 1px solid rgba(76, 100, 83, .1); }
.works-drawer__summary div { display: grid; gap: 2px; }
.works-drawer__summary strong { font: 700 22px/1 "Noto Serif SC", "STSong", serif; color: #315d45; }
.works-drawer__summary span, .works-drawer__summary p { color: #7a8179; font-size: 11px; }
.works-drawer__summary p { margin: 0; line-height: 1.5; }
.works-drawer__body { display: grid; gap: 9px; align-content: start; overflow: auto; padding: 16px; }
.works-drawer__empty { display: grid; min-height: 240px; place-items: center; align-content: center; gap: 10px; color: #8a928a; text-align: center; }
.works-drawer__empty > i { color: #9eac9f; font-size: 30px; }
.works-drawer__empty strong { color: #526056; }
.works-drawer__empty span { max-width: 260px; font-size: 12px; }
.work-list-item { display: grid; grid-template-columns: 76px minmax(0, 1fr) 38px; gap: 12px; align-items: center; width: 100%; padding: 9px; color: inherit; text-align: left; border: 1px solid rgba(77, 100, 84, .13); border-radius: 13px; background: rgba(255,255,255,.78); cursor: pointer; transition: border-color .18s ease, transform .18s ease, box-shadow .18s ease; }
.work-list-item:hover { border-color: rgba(157, 119, 48, .38); transform: translateY(-1px); box-shadow: 0 10px 22px rgba(48, 67, 55, .08); }
.work-list-item__preview { display: grid; width: 76px; height: 64px; place-items: center; overflow: hidden; color: #55705e; border-radius: 9px; background: #e9eee8; }
.work-list-item__preview img { width: 100%; height: 100%; object-fit: contain; background: #24372d; }
.work-list-item__copy { display: grid; min-width: 0; gap: 7px; }
.work-list-item__copy strong { overflow: hidden; font-size: 13px; line-height: 1.4; text-overflow: ellipsis; white-space: nowrap; }
.work-list-item__copy small { color: #7c857d; font-size: 11px; }
.work-list-item__action { color: #8b6b32; font-size: 11px; font-weight: 800; }
@keyframes drawerIn { from { transform: translateX(100%); } to { transform: none; } }
@media (max-width: 620px) { .works-drawer__panel { top: auto; bottom: 0; width: 100%; height: min(78vh, 680px); border-top: 1px solid rgba(202, 173, 105, .38); border-left: 0; border-radius: 24px 24px 0 0; animation-name: sheetIn; } .works-drawer__summary { grid-template-columns: 72px 72px 1fr; } @keyframes sheetIn { from { transform: translateY(100%); } to { transform: none; } } }
</style>
