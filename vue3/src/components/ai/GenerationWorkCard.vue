<template>
  <section class="generation-work" :data-state="task?.status || 'PENDING'">
    <div v-if="isRunning" class="generation-work__progress" aria-live="polite">
      <div class="generation-work__seal"><i class="fas fa-wand-magic-sparkles"></i></div>
      <div class="generation-work__progress-copy">
        <span class="generation-work__eyebrow">玄喵创作中</span>
        <strong>{{ stageMessage }}</strong>
        <small>已等待 {{ elapsedSeconds }} 秒</small>
      </div>
      <div class="generation-work__indeterminate" aria-hidden="true"><i></i></div>
    </div>

    <div v-else-if="task?.status === 'FAILED'" class="generation-work__failure">
      <span class="generation-work__failure-icon"><i class="fas fa-triangle-exclamation"></i></span>
      <div>
        <strong>这次创作没有完成</strong>
        <p>{{ task.errorMessage || '图片服务暂时不可用，请稍后重试。' }}</p>
      </div>
      <button type="button" @click="$emit('retry', task)"><i class="fas fa-rotate-right"></i> 重新尝试</button>
    </div>

    <div v-else-if="task?.status === 'CANCELED'" class="generation-work__failure">
      <span class="generation-work__failure-icon"><i class="fas fa-ban"></i></span>
      <div><strong>创作已取消</strong><p>你可以调整描述后重新生成。</p></div>
      <button type="button" @click="$emit('regenerate', task)"><i class="fas fa-wand-magic-sparkles"></i> 再生成</button>
    </div>

    <template v-else-if="task?.status === 'SUCCEEDED' && task?.resultUrl">
      <button
        v-if="mediaType === 'IMAGE'"
        class="generation-work__canvas"
        type="button"
        title="点击放大作品"
        @click="$emit('preview', task.resultUrl, workTitle)"
      >
        <img :src="normalizeUrl(task.resultUrl)" :alt="workTitle" />
        <span><i class="fas fa-expand"></i> 放大查看</span>
      </button>
      <video v-else class="generation-work__video" :src="normalizeUrl(task.resultUrl)" controls preload="metadata"></video>

      <div class="generation-work__meta">
        <div>
          <span class="generation-work__eyebrow">玄喵 AI 作品</span>
          <strong>{{ workTitle }}</strong>
        </div>
        <span class="generation-work__profile">{{ profileLabel }}</span>
      </div>

      <div class="generation-work__trust" :data-label="task.contentLabel || 'AI_CREATION'">
        <i class="fas fa-shield-cat"></i>
        <span><strong>{{ contentLabel.title }}</strong>{{ contentLabel.notice }}</span>
      </div>

      <div class="generation-work__footer">
        <small><i class="fas fa-clock"></i> 用时 {{ elapsedSeconds }} 秒</small>
        <div>
          <button v-if="mediaType === 'IMAGE'" type="button" @click="$emit('preview', task.resultUrl, workTitle)">
            <i class="fas fa-magnifying-glass-plus"></i> 放大
          </button>
          <a :href="normalizeUrl(task.resultUrl)" download target="_blank" rel="noopener">
            <i class="fas fa-download"></i> 下载
          </a>
          <button type="button" @click="$emit('regenerate', task)">
            <i class="fas fa-wand-magic-sparkles"></i> 再生成
          </button>
        </div>
      </div>
    </template>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps({
  task: { type: Object, default: () => ({}) }
})

defineEmits(['preview', 'retry', 'regenerate'])

const isRunning = computed(() => ['PENDING', 'PROCESSING'].includes(props.task?.status))
const mediaType = computed(() => props.task?.mediaType || 'IMAGE')
const elapsedSeconds = ref(0)
let elapsedBase = 0
let elapsedAnchor = Date.now()
let elapsedTimer = null
let currentTaskId = null

function refreshElapsed() {
  if (!isRunning.value) return
  elapsedSeconds.value = elapsedBase + Math.floor((Date.now() - elapsedAnchor) / 1000)
}

function startElapsedTimer() {
  if (elapsedTimer) return
  elapsedTimer = window.setInterval(refreshElapsed, 250)
}

function stopElapsedTimer() {
  if (!elapsedTimer) return
  window.clearInterval(elapsedTimer)
  elapsedTimer = null
}

watch(
  () => [props.task?.taskId, props.task?.status, props.task?.elapsedSeconds],
  ([taskId]) => {
    refreshElapsed()
    const serverElapsed = Math.max(0, Number(props.task?.elapsedSeconds) || 0)
    const switchedTask = Boolean(taskId && currentTaskId && taskId !== currentTaskId)

    if (switchedTask) {
      elapsedBase = serverElapsed
      elapsedSeconds.value = serverElapsed
      elapsedAnchor = Date.now()
    } else if (serverElapsed > elapsedSeconds.value) {
      elapsedBase = serverElapsed
      elapsedSeconds.value = serverElapsed
      elapsedAnchor = Date.now()
    }

    if (taskId) currentTaskId = taskId
    if (isRunning.value) {
      startElapsedTimer()
    } else {
      stopElapsedTimer()
      elapsedSeconds.value = Math.max(elapsedSeconds.value, serverElapsed)
    }
  },
  { immediate: true }
)

onBeforeUnmount(stopElapsedTimer)

const stageMessage = computed(() => props.task?.stageMessage || ({
  QUEUED: '任务已进入队列',
  PREPARING: '正在理解创作需求',
  GENERATING: '正在生成画面',
  DOWNLOADING: '正在获取生成结果',
  SAVING: '正在保存作品'
})[props.task?.stage] || '正在准备创作')
const profileLabel = computed(() => props.task?.modelProfile === 'QUALITY' ? '品质模式' : '快速模式')
const workTitle = computed(() => {
  const prompt = String(props.task?.promptRaw || '').trim()
  return prompt.length > 34 ? `${prompt.slice(0, 34)}…` : (prompt || 'AI 生成作品')
})
const contentLabel = computed(() => ({
  AI_RECONSTRUCTION: { title: 'AI推测复原图', notice: '非考古原貌，仅作文化理解与展示参考。' },
  AI_ILLUSTRATION: { title: 'AI辅助示意图', notice: '用于辅助理解，不代表考古定论。' },
  AI_CREATION: { title: 'AI创意作品', notice: '由生成式人工智能创作。' }
})[props.task?.contentLabel] || { title: 'AI创意作品', notice: '由生成式人工智能创作。' })

function normalizeUrl(url) {
  if (!url || /^(blob:|data:|https?:\/\/)/i.test(url)) return url || ''
  return url.startsWith('/api/') ? url.slice(4) : url
}
</script>

<style scoped>
.generation-work { width: min(600px, 100%); margin-top: 10px; overflow: hidden; color: #263e32; border: 1px solid rgba(153, 125, 65, .28); border-radius: 18px; background: #fffdf7; box-shadow: 0 14px 38px rgba(47, 70, 56, .09); }
.generation-work__progress { position: relative; display: grid; grid-template-columns: 48px minmax(0, 1fr); gap: 14px; align-items: center; padding: 20px; overflow: hidden; background: radial-gradient(circle at 90% 0, rgba(207, 178, 108, .22), transparent 34%), linear-gradient(135deg, #f8f6ec, #eef3ed); }
.generation-work__seal { display: grid; width: 48px; height: 48px; place-items: center; color: #fffaf0; border-radius: 50%; background: #315d45; box-shadow: 0 0 0 5px rgba(49, 93, 69, .09); }
.generation-work__progress-copy { display: grid; gap: 3px; }
.generation-work__progress-copy strong { color: #244936; font-size: 16px; }
.generation-work__progress-copy small { color: #778078; font-size: 12px; }
.generation-work__eyebrow { color: #9a7333; font-size: 10px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; }
.generation-work__indeterminate { grid-column: 1 / -1; height: 4px; overflow: hidden; border-radius: 999px; background: rgba(49, 93, 69, .11); }
.generation-work__indeterminate i { display: block; width: 42%; height: 100%; border-radius: inherit; background: linear-gradient(90deg, transparent, #3e7657, #d2ad58, transparent); animation: generationSweep 1.8s ease-in-out infinite; }
.generation-work__failure { display: grid; grid-template-columns: 42px 1fr auto; gap: 12px; align-items: center; padding: 18px; background: #fff8f5; }
.generation-work__failure-icon { display: grid; width: 42px; height: 42px; place-items: center; color: #a64b3c; border-radius: 50%; background: #f5dfd9; }
.generation-work__failure strong { color: #74372e; }
.generation-work__failure p { margin: 3px 0 0; color: #8b6b65; font-size: 12px; }
.generation-work button, .generation-work a { font: inherit; }
.generation-work__failure button, .generation-work__footer button, .generation-work__footer a { display: inline-flex; min-height: 34px; align-items: center; gap: 6px; padding: 0 11px; color: #315d45; border: 1px solid rgba(49, 93, 69, .23); border-radius: 999px; background: #fff; cursor: pointer; text-decoration: none; }
.generation-work__canvas { position: relative; display: grid; width: 100%; max-height: 590px; padding: 0; place-items: center; overflow: hidden; border: 0; background: radial-gradient(circle, #35463d, #17231d); cursor: zoom-in; }
.generation-work__canvas img { display: block; width: 100%; max-height: 590px; object-fit: contain; }
.generation-work__canvas > span { position: absolute; right: 14px; bottom: 14px; display: inline-flex; gap: 6px; align-items: center; padding: 7px 10px; color: #fff; border: 1px solid rgba(255,255,255,.24); border-radius: 999px; background: rgba(17, 29, 23, .74); font-size: 12px; opacity: 0; transform: translateY(5px); transition: .2s ease; }
.generation-work__canvas:hover > span, .generation-work__canvas:focus-visible > span { opacity: 1; transform: none; }
.generation-work__video { display: block; width: 100%; max-height: 520px; object-fit: contain; background: #17231d; }
.generation-work__meta { display: flex; justify-content: space-between; gap: 18px; align-items: center; padding: 16px 18px 9px; }
.generation-work__meta > div { display: grid; gap: 4px; min-width: 0; }
.generation-work__meta strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 15px; }
.generation-work__profile { flex: none; padding: 5px 9px; color: #315d45; border-radius: 999px; background: #e9f0e9; font-size: 11px; font-weight: 800; }
.generation-work__trust { display: flex; gap: 9px; align-items: flex-start; margin: 0 18px 12px; padding: 10px 12px; color: #6a5d43; border: 1px solid rgba(186, 148, 69, .23); border-radius: 10px; background: #fbf6e9; font-size: 11px; line-height: 1.5; }
.generation-work__trust strong { display: block; color: #7f5d22; }
.generation-work__footer { display: flex; justify-content: space-between; gap: 12px; align-items: center; padding: 0 18px 17px; }
.generation-work__footer small { color: #7b837c; }
.generation-work__footer > div { display: flex; flex-wrap: wrap; gap: 7px; justify-content: flex-end; }
@keyframes generationSweep { from { transform: translateX(-130%); } to { transform: translateX(330%); } }
@media (max-width: 620px) { .generation-work__failure { grid-template-columns: 40px 1fr; } .generation-work__failure button { grid-column: 1 / -1; justify-content: center; } .generation-work__footer { align-items: flex-start; flex-direction: column; } .generation-work__footer > div { width: 100%; } .generation-work__footer button, .generation-work__footer a { flex: 1; justify-content: center; } }
</style>
