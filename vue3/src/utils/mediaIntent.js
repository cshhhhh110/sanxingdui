const ACTION_PATTERN = /(生成|制作|创作|绘制|画一|画张|画个|做一|做个|创建|设计|合成|产出|帮我画|帮我做)/i
const VIDEO_PATTERN = /(视频|短片|动画|动图|镜头|让.{0,8}(动起来|动一动))/i
const IMAGE_PATTERN = /(图片|图像|插画|海报|壁纸|效果图|宣传图|照片|画像|绘画|画面)/i
const INFORMATION_PATTERN = /((如何|怎么|为什么|什么是|原理|技术|功能|教程|方法|流程).{0,20}(生成|制作|创作)|(生成|制作|创作).{0,20}(如何|怎么|为什么|是什么|原理|技术|功能|教程|方法|流程))/i

export function detectMediaIntent(text = '') {
  const normalized = text.trim()
  if (!normalized || INFORMATION_PATTERN.test(normalized) || !ACTION_PATTERN.test(normalized)) return 'CHAT'
  if (VIDEO_PATTERN.test(normalized)) return 'VIDEO'
  if (IMAGE_PATTERN.test(normalized)) return 'IMAGE'
  return 'CHAT'
}
