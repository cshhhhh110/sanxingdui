<template>
  <div class="creation-page">
    <header class="page-header">
      <button class="icon-btn" title="返回探秘页" @click="router.push('/tanmi')">
        <ArrowLeftOutlined />
      </button>
      <div>
        <h1>古蜀 AI 创作</h1>
        <p>创作结果会保存到个人历史，可继续生成或下载使用</p>
      </div>
    </header>

    <main class="workspace">
      <section class="control-panel">
        <div class="mode-tabs" role="tablist">
          <button :class="{ active: mediaType === 'IMAGE' }" @click="switchType('IMAGE')">
            <PictureOutlined /> 图片
          </button>
          <button :class="{ active: mediaType === 'VIDEO' }" @click="switchType('VIDEO')">
            <VideoCameraOutlined /> 视频
          </button>
        </div>

        <label v-if="availableTemplates.length" class="template-field">
          <span class="field-label">创作模板</span>
          <select @change="applyTemplate($event.target.value)">
            <option value="">选择模板快速填写</option>
            <option v-for="item in availableTemplates" :key="item.code" :value="item.code">{{ item.name }}</option>
          </select>
        </label>

        <label class="field-label" for="creation-prompt">创作描述</label>
        <textarea
          id="creation-prompt"
          v-model="form.prompt"
          maxlength="2000"
          :placeholder="mediaType === 'IMAGE' ? '例如：以三星堆青铜纵目面具为主体，制作一张博物馆展览海报' : '例如：镜头缓慢推进，青铜面具在柔和展陈灯光下逐渐显现细节'"
        />

        <div v-if="mediaType === 'IMAGE'" class="quick-tags">
          <button v-for="tag in quickTags" :key="tag" @click="appendTag(tag)">{{ tag }}</button>
        </div>

        <div class="form-grid">
          <label>
            <span>生成方式</span>
            <select v-model="form.mode">
              <option :value="mediaType === 'IMAGE' ? 'TEXT_TO_IMAGE' : 'TEXT_TO_VIDEO'">文字生成</option>
              <option v-if="mediaType === 'VIDEO'" value="IMAGE_TO_VIDEO">图片生成视频</option>
            </select>
          </label>
          <label v-if="mediaType === 'IMAGE'">
            <span>视觉风格</span>
            <select v-model="form.style">
              <option value="MUSEUM_POSTER">博物馆海报</option>
              <option value="ARTIFACT_RESTORE">文物复原</option>
              <option value="CULTURAL_IP">文化 IP</option>
              <option value="INK_STYLE">水墨古蜀</option>
              <option value="THREE_D_SCENE">三维场景</option>
              <option value="EDUCATION_CARD">科普卡片</option>
            </select>
          </label>
          <label>
            <span>画面比例</span>
            <select v-model="form.aspectRatio">
              <option value="1:1">1:1 方形</option>
              <option value="4:3">4:3 横向</option>
              <option value="3:4">3:4 竖向</option>
              <option value="16:9">16:9 宽屏</option>
              <option value="9:16">9:16 竖屏</option>
            </select>
          </label>
          <label v-if="mediaType === 'VIDEO'">
            <span>视频时长</span>
            <select v-model.number="form.durationSeconds">
              <option :value="5">5 秒</option>
            </select>
          </label>
          <label v-if="mediaType === 'VIDEO'">
            <span>镜头运动</span>
            <select v-model="form.cameraMotion">
              <option value="NONE">固定镜头</option>
              <option value="SLOW_PUSH_IN">缓慢推进</option>
              <option value="SLOW_PULL_OUT">缓慢拉远</option>
              <option value="PAN_LEFT">向左摇镜</option>
              <option value="PAN_RIGHT">向右摇镜</option>
            </select>
          </label>
        </div>

        <div v-if="form.mode === 'IMAGE_TO_VIDEO'" class="reference-upload">
          <input ref="fileInput" type="file" accept="image/*" hidden @change="uploadReference" />
          <button class="secondary-btn" :disabled="uploading" @click="fileInput?.click()">
            <UploadOutlined /> {{ uploading ? '上传中' : referencePreview ? '更换参考图' : '上传参考图' }}
          </button>
          <img v-if="referencePreview" :src="referencePreview" alt="参考图片" />
        </div>

        <label class="field-label" for="negative-prompt">排除内容</label>
        <input id="negative-prompt" v-model="form.negativePrompt" maxlength="1000" placeholder="例如：文字乱码、低清晰度、主体变形" />

        <button class="primary-btn" :disabled="submitting || activeRunning" @click="createTask">
          <LoadingOutlined v-if="submitting" />
          <PlayCircleOutlined v-else />
          {{ submitting ? '正在提交' : activeRunning ? '任务进行中' : `开始生成${mediaType === 'IMAGE' ? '图片' : '视频'}` }}
        </button>
      </section>

      <section class="result-panel">
        <div class="section-title">
          <div>
            <h2>生成结果</h2>
            <span v-if="currentTask" class="status" :data-status="currentTask.status">{{ statusText(currentTask.status) }}</span>
          </div>
          <button v-if="activeRunning" class="text-btn danger" @click="cancelTask">取消任务</button>
        </div>

        <div v-if="!currentTask" class="empty-state">
          <PictureOutlined />
          <strong>等待创作</strong>
          <span>设置左侧参数并提交后，结果会显示在这里</span>
        </div>

        <div v-else-if="activeRunning" class="progress-state">
          <div class="progress-visual"><LoadingOutlined spin /></div>
          <strong>{{ currentTask.mediaType === 'VIDEO' ? '正在生成视频' : '正在生成图片' }}</strong>
          <div class="progress-track"><i :style="{ width: `${currentTask.progress || 5}%` }"></i></div>
          <span>{{ currentTask.progress || 0 }}%</span>
        </div>

        <div v-else-if="currentTask.status === 'SUCCEEDED'" class="media-result">
          <img v-if="currentTask.mediaType === 'IMAGE'" :src="currentTask.resultUrl" alt="AI 生成图片" />
          <video v-else :src="currentTask.resultUrl" controls preload="metadata" />
          <div class="result-actions">
            <button class="secondary-btn" @click="toggleFavorite">
              <HeartFilled v-if="currentTask.favorite" />
              <HeartOutlined v-else />
              {{ currentTask.favorite ? '已收藏' : '收藏' }}
            </button>
            <button class="secondary-btn" @click="shareTask"><ShareAltOutlined /> 分享</button>
            <a class="secondary-btn" :href="currentTask.resultUrl" target="_blank" rel="noopener">
              <EyeOutlined /> 查看原文件
            </a>
            <a class="primary-btn compact" :href="currentTask.resultUrl" download>
              <DownloadOutlined /> 下载
            </a>
          </div>
          <p class="ai-notice">AI 生成内容；文物复原画面属于想象性表达，仅供展示。</p>
        </div>

        <div v-else class="error-state">
          <ExclamationCircleOutlined />
          <strong>生成未完成</strong>
          <span>{{ currentTask.errorMessage || '任务已取消' }}</span>
          <button v-if="currentTask.status === 'FAILED' && currentTask.mediaType === 'IMAGE'" class="secondary-btn" @click="retryTask">重试</button>
        </div>
      </section>
    </main>

    <section class="history-section">
      <div class="section-title">
        <div><h2>创作历史</h2><span>{{ history.total || 0 }} 个任务</span></div>
        <button class="icon-btn" title="刷新历史" @click="loadHistory"><ReloadOutlined /></button>
      </div>
      <div v-if="history.records?.length" class="history-grid">
        <button v-for="task in history.records" :key="task.taskId" class="history-item" @click="selectHistory(task)">
          <div class="history-preview">
            <img v-if="task.status === 'SUCCEEDED' && task.mediaType === 'IMAGE'" :src="task.resultUrl" alt="" />
            <VideoCameraOutlined v-else-if="task.mediaType === 'VIDEO'" />
            <PictureOutlined v-else />
          </div>
          <div class="history-info">
            <strong>{{ task.promptRaw }}</strong>
            <span>{{ formatTime(task.createTime) }} · {{ statusText(task.status) }}</span>
          </div>
        </button>
      </div>
      <div v-else class="history-empty">暂无创作记录</div>
    </section>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import {
  ArrowLeftOutlined, DownloadOutlined, ExclamationCircleOutlined, EyeOutlined,
  HeartFilled, HeartOutlined, LoadingOutlined, PictureOutlined, PlayCircleOutlined,
  ReloadOutlined, ShareAltOutlined, UploadOutlined, VideoCameraOutlined
} from '@ant-design/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import { uploadTempFile } from '@/api/FileApi'
import {
  cancelGenerationTask, createImageGeneration, createVideoGeneration,
  enableGenerationShare, getGenerationHistory, getGenerationTask, getGenerationTemplates,
  getSharedGeneration, retryGenerationTask, setGenerationFavorite
} from '@/api/MediaGenerationApi'

const router = useRouter()
const route = useRoute()
const mediaType = ref('IMAGE')
const submitting = ref(false)
const uploading = ref(false)
const currentTask = ref(null)
const history = ref({ total: 0, records: [] })
const referencePreview = ref('')
const fileInput = ref(null)
const templates = ref([])
let pollTimer = null

const quickTags = ['三星堆青铜面具', '青铜神树', '古蜀祭祀场景', '博物馆展览', '高细节']
const form = reactive({
  prompt: '', mode: 'TEXT_TO_IMAGE', style: 'MUSEUM_POSTER', aspectRatio: '1:1',
  durationSeconds: 5, cameraMotion: 'NONE', referenceFileId: null, negativePrompt: ''
})

const activeRunning = computed(() => ['PENDING', 'PROCESSING'].includes(currentTask.value?.status))
const availableTemplates = computed(() => templates.value.filter((item) => item.mediaType === mediaType.value))

function switchType(type) {
  if (activeRunning.value) return message.warning('请等待当前任务完成或先取消任务')
  mediaType.value = type
  form.mode = type === 'IMAGE' ? 'TEXT_TO_IMAGE' : 'TEXT_TO_VIDEO'
  form.aspectRatio = type === 'IMAGE' ? '1:1' : '16:9'
  currentTask.value = null
}

function appendTag(tag) {
  form.prompt = form.prompt ? `${form.prompt}，${tag}` : tag
}

function applyTemplate(code) {
  const template = templates.value.find((item) => item.code === code)
  if (!template) return
  form.prompt = template.promptTemplate
  form.negativePrompt = template.negativePrompt || ''
  if (template.style) form.style = template.style
  if (template.code === 'artifact-i2v') form.mode = 'IMAGE_TO_VIDEO'
}

async function uploadReference(event) {
  const file = event.target.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) return message.error('请选择图片文件')
  uploading.value = true
  try {
    const uploaded = await uploadTempFile(file, { showDefaultMsg: false })
    form.referenceFileId = uploaded.id
    referencePreview.value = URL.createObjectURL(file)
  } catch (error) {
    message.error(error.message || '参考图上传失败')
  } finally {
    uploading.value = false
    event.target.value = ''
  }
}

async function createTask() {
  if (form.prompt.trim().length < 2) return message.warning('请输入至少2个字符的创作描述')
  if (form.mode === 'IMAGE_TO_VIDEO' && !form.referenceFileId) return message.warning('请先上传参考图')
  submitting.value = true
  try {
    const payload = { ...form, prompt: form.prompt.trim(), count: 1 }
    currentTask.value = mediaType.value === 'IMAGE'
      ? await createImageGeneration(payload)
      : await createVideoGeneration(payload)
    startPolling()
    await loadHistory()
  } catch (error) {
    message.error(error.message || '任务创建失败')
  } finally {
    submitting.value = false
  }
}

function startPolling() {
  stopPolling()
  if (!currentTask.value?.taskId || !activeRunning.value) return
  pollTimer = window.setTimeout(pollTask, 1500)
}

async function pollTask() {
  try {
    currentTask.value = await getGenerationTask(currentTask.value.taskId)
    if (activeRunning.value) pollTimer = window.setTimeout(pollTask, 2000)
    else await loadHistory()
  } catch {
    pollTimer = window.setTimeout(pollTask, 4000)
  }
}

function stopPolling() {
  if (pollTimer) window.clearTimeout(pollTimer)
  pollTimer = null
}

async function loadHistory() {
  try { history.value = await getGenerationHistory({ pageNum: 1, pageSize: 12 }) }
  catch { history.value = { total: 0, records: [] } }
}

function selectHistory(task) {
  currentTask.value = task
  mediaType.value = task.mediaType
  form.prompt = task.promptRaw || ''
  startPolling()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function cancelTask() {
  try {
    currentTask.value = await cancelGenerationTask(currentTask.value.taskId)
    stopPolling()
    await loadHistory()
  } catch (error) { message.error(error.message || '取消失败') }
}

async function retryTask() {
  try {
    currentTask.value = await retryGenerationTask(currentTask.value.taskId)
    startPolling()
  } catch (error) { message.error(error.message || '重试失败') }
}

async function toggleFavorite() {
  try {
    currentTask.value = await setGenerationFavorite(currentTask.value.taskId, !currentTask.value.favorite)
    await loadHistory()
  } catch (error) { message.error(error.message || '收藏操作失败') }
}

async function shareTask() {
  try {
    currentTask.value = await enableGenerationShare(currentTask.value.taskId)
    const url = `${window.location.origin}${window.location.pathname}?share=${currentTask.value.shareToken}`
    await navigator.clipboard.writeText(url)
    message.success('分享链接已复制')
  } catch (error) { message.error(error.message || '创建分享链接失败') }
}

function statusText(status) {
  return ({ PENDING: '等待中', PROCESSING: '生成中', SUCCEEDED: '已完成', FAILED: '失败', CANCELED: '已取消' })[status] || status
}

function formatTime(value) {
  if (!value) return ''
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}

onMounted(async () => {
  try { templates.value = await getGenerationTemplates() } catch { templates.value = [] }
  if (route.query.share) {
    try {
      currentTask.value = await getSharedGeneration(route.query.share)
      mediaType.value = currentTask.value.mediaType
    } catch (error) { message.error(error.message || '分享内容不可用') }
  }
  await loadHistory()
})
onBeforeUnmount(() => {
  stopPolling()
  if (referencePreview.value?.startsWith('blob:')) URL.revokeObjectURL(referencePreview.value)
})
</script>

<style scoped>
.creation-page { min-height: 100vh; background: #f3f4f1; color: #20251f; padding-bottom: 48px; }
.page-header { height: 96px; display: flex; align-items: center; gap: 16px; padding: 0 clamp(18px, 4vw, 56px); background: #fff; border-bottom: 1px solid #dde1da; }
.page-header h1, .section-title h2 { margin: 0; font-size: 22px; letter-spacing: 0; }
.page-header p { margin: 4px 0 0; color: #687066; font-size: 13px; }
.workspace { display: grid; grid-template-columns: minmax(320px, 440px) minmax(420px, 1fr); gap: 20px; padding: 24px clamp(18px, 4vw, 56px); max-width: 1440px; margin: auto; }
.control-panel, .result-panel { background: #fff; border: 1px solid #dde1da; border-radius: 8px; padding: 22px; min-height: 600px; }
.control-panel { display: flex; flex-direction: column; gap: 14px; }
.mode-tabs { display: grid; grid-template-columns: 1fr 1fr; background: #eef0ec; padding: 3px; border-radius: 6px; }
.mode-tabs button { height: 40px; border: 0; background: transparent; color: #596157; cursor: pointer; }
.mode-tabs button.active { background: #fff; color: #315c45; box-shadow: 0 1px 4px #00000012; font-weight: 600; }
.template-field { display: grid; gap: 7px; }
.field-label, label span { font-size: 13px; font-weight: 600; color: #41483f; }
textarea, input, select { width: 100%; border: 1px solid #cfd5cc; background: #fbfcfa; border-radius: 5px; padding: 10px 12px; font: inherit; box-sizing: border-box; outline: none; }
textarea { min-height: 150px; resize: vertical; line-height: 1.65; }
textarea:focus, input:focus, select:focus { border-color: #397052; box-shadow: 0 0 0 3px #39705218; }
.quick-tags { display: flex; flex-wrap: wrap; gap: 7px; }
.quick-tags button { border: 1px solid #ccd8cf; background: #f5f8f5; color: #315c45; border-radius: 4px; padding: 5px 9px; font-size: 12px; cursor: pointer; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-grid label { display: grid; gap: 7px; }
button, a { font: inherit; }
.primary-btn, .secondary-btn { min-height: 42px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; border-radius: 5px; padding: 0 16px; cursor: pointer; text-decoration: none; }
.primary-btn { border: 0; background: #315c45; color: #fff; font-weight: 600; }
.primary-btn:disabled { opacity: .55; cursor: not-allowed; }
.secondary-btn { border: 1px solid #bdc8bf; background: #fff; color: #315c45; }
.compact { min-height: 40px; }
.icon-btn, .text-btn { border: 0; background: transparent; cursor: pointer; color: #3f4b41; }
.icon-btn { width: 38px; height: 38px; font-size: 18px; }
.danger { color: #a33c35; }
.reference-upload { display: flex; align-items: center; gap: 12px; }
.reference-upload img { width: 56px; height: 56px; object-fit: cover; border: 1px solid #d8ddd6; border-radius: 4px; }
.result-panel { display: flex; flex-direction: column; }
.section-title { display: flex; justify-content: space-between; align-items: center; min-height: 42px; }
.section-title > div { display: flex; align-items: center; gap: 12px; }
.section-title h2 { font-size: 17px; }
.section-title span { font-size: 12px; color: #737b71; }
.status { padding: 3px 7px; background: #eef2ed; border-radius: 4px; }
.status[data-status="SUCCEEDED"] { color: #287149; background: #e8f4ec; }
.status[data-status="FAILED"] { color: #a33c35; background: #f8e9e7; }
.empty-state, .progress-state, .error-state { flex: 1; min-height: 460px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: #747c72; }
.empty-state > .anticon, .error-state > .anticon { font-size: 42px; color: #9da69b; }
.empty-state strong, .progress-state strong, .error-state strong { color: #343c34; font-size: 16px; }
.progress-visual { font-size: 38px; color: #315c45; }
.progress-track { width: min(360px, 80%); height: 7px; background: #e7ebe5; border-radius: 4px; overflow: hidden; }
.progress-track i { height: 100%; display: block; background: #397052; transition: width .3s; }
.media-result { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 14px; padding-top: 14px; }
.media-result img, .media-result video { width: 100%; max-height: 520px; object-fit: contain; background: #141714; border-radius: 6px; }
.result-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 10px; }
.ai-notice { margin: 0; color: #777e75; font-size: 12px; text-align: right; }
.history-section { max-width: 1440px; margin: 0 auto; padding: 0 clamp(18px, 4vw, 56px); }
.history-grid { margin-top: 14px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.history-item { display: grid; grid-template-columns: 84px 1fr; gap: 12px; padding: 9px; min-width: 0; text-align: left; background: #fff; border: 1px solid #dde1da; border-radius: 6px; cursor: pointer; }
.history-preview { width: 84px; height: 70px; display: flex; align-items: center; justify-content: center; background: #e8ebe6; color: #758073; font-size: 24px; border-radius: 4px; overflow: hidden; }
.history-preview img { width: 100%; height: 100%; object-fit: cover; }
.history-info { min-width: 0; display: flex; flex-direction: column; justify-content: center; gap: 8px; }
.history-info strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; }
.history-info span, .history-empty { font-size: 12px; color: #747c72; }
.history-empty { padding: 32px 0; text-align: center; }
@media (max-width: 980px) { .workspace { grid-template-columns: 1fr; } .control-panel, .result-panel { min-height: auto; } .history-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 600px) { .page-header { height: 82px; } .page-header p { display: none; } .workspace { padding-top: 14px; } .control-panel, .result-panel { padding: 16px; } .form-grid, .history-grid { grid-template-columns: 1fr; } .result-actions { flex-direction: column; } }
</style>
