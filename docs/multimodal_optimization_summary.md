# AI 聊天多模态优化总结与接口说明

## 一、优化目标

本次优化围绕 AI 聊天模块展开，目标是将原有纯文本问答能力扩展为支持文字、图片、音频、视频、文档和麦克风语音输入的多模态交互能力。

整体链路为：

1. 前端收集用户文字、附件或麦克风录音。
2. 附件先上传为临时文件，获得 `fileId`、`filePath` 等元数据。
3. 聊天请求携带 `userMessage` 和 `attachments`。
4. 后端根据附件类型分别解析图片、音频、视频、文档。
5. 解析结果被拼接进大模型上下文。
6. AI 以 SSE 流式方式返回回答。

## 二、核心接口清单

### 1. 临时文件上传接口

前端路径：

```http
POST /api/file/upload/temp
```

后端控制器：

```text
springboot/src/main/java/org/example/springboot/controller/FileController.java
```

后端实际映射：

```http
POST /file/upload/temp
```

请求类型：

```http
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

请求字段：

| 字段 | 类型 | 说明 |
|---|---|---|
| `file` | `MultipartFile` | 用户上传的图片、音频、视频或文档 |

返回核心字段：

```json
{
  "code": "200",
  "data": {
    "id": 207,
    "originalName": "sanxingdui_document_reading_test.docx",
    "filePath": "/files/temp/1783509758585.docx",
    "fileSize": 37631,
    "fileType": "DOC",
    "isTemp": true
  }
}
```

前端调用位置：

```text
vue3/src/api/FileApi.js
```

对应方法：

```js
uploadTempFile(file, callbacks)
```

用途：

- 普通附件上传入口。
- 上传成功后，前端会把返回的 `id`、`filePath`、`originalName` 等字段组装成聊天附件对象。

## 三、AI 流式聊天接口

前端路径：

```http
POST /api/ai-chat/stream
```

后端控制器：

```text
springboot/src/main/java/org/example/springboot/controller/AiChatController.java
```

后端实际映射：

```http
POST /ai-chat/stream
```

响应类型：

```http
Content-Type: text/event-stream
```

请求示例：

```json
{
  "sessionId": "0e25feea-2197-407d-aec9-606f80d6c4cc",
  "userMessage": "请读取这个文档，并用三句话概括它的核心内容。",
  "attachments": [
    {
      "fileId": 207,
      "mediaType": "DOCUMENT",
      "fileName": "sanxingdui_document_reading_test.docx",
      "filePath": "/files/temp/1783509758585.docx",
      "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "fileSize": 37631
    }
  ]
}
```

附件字段说明：

| 字段 | 类型 | 说明 |
|---|---|---|
| `fileId` | `Long` | 对应 `sys_file_info.id` |
| `mediaType` | `String` | `IMAGE`、`AUDIO`、`VIDEO`、`DOCUMENT`、`FILE` |
| `fileName` | `String` | 原始文件名 |
| `filePath` | `String` | 文件访问路径 |
| `mimeType` | `String` | 文件 MIME 类型 |
| `fileSize` | `Long` | 文件大小 |

SSE 返回示例：

```text
data: 三星堆遗址展现了古蜀文明独特而复杂的祭祀与权力体系。
data: 其出土的青铜神树、纵目面具和青铜大立人等器物...
data: [DONE]
```

前端调用位置：

```text
vue3/src/api/AiChatApi.js
vue3/src/views/frontend/AiChat.vue
```

对应方法：

```js
getChatStreamUrl()
```

前端通过 `@microsoft/fetch-event-source` 发起 SSE 请求。

## 四、麦克风语音输入接口

该接口用于“说话转文字”，不是音频附件问答。

前端路径：

```http
POST /api/ai-chat/speech-input
```

后端实际映射：

```http
POST /ai-chat/speech-input
```

请求类型：

```http
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

请求字段：

| 字段 | 类型 | 说明 |
|---|---|---|
| `file` | `MultipartFile` | 前端录制并编码后的 WAV 音频 |

返回示例：

```json
{
  "code": "200",
  "data": "三星堆青铜面具有什么特点"
}
```

前端调用位置：

```text
vue3/src/api/AiChatApi.js
vue3/src/views/frontend/AiChat.vue
```

对应方法：

```js
transcribeSpeechInput(file, config)
```

前端处理流程：

1. 用户点击麦克风按钮。
2. 前端通过 `navigator.mediaDevices.getUserMedia({ audio: true })` 获取麦克风输入。
3. 使用 Web Audio API 采集 PCM 音频。
4. 前端编码为 WAV 文件。
5. 调用 `/api/ai-chat/speech-input`。
6. 后端 ASR 返回转写文本。
7. 前端把文本填入输入框，用户再点击发送。

## 五、后端多模态处理链路

### 1. 统一入口

```text
AiChatController.chatStream()
```

职责：

- 校验登录用户。
- 校验会话归属。
- 接收 `AiChatCommandDTO`。
- 将 `userMessage` 和 `attachments` 交给 AI 服务。

### 2. AI 服务层

```text
springboot/src/main/java/org/example/springboot/ai/HeritageAssistantService.java
```

职责：

- 判断消息类型。
- 调用 `MultimodalContentService` 构建模型输入。
- 调用大模型生成流式回答。
- 保存用户消息、AI 回复、附件解析结果。

### 3. 多模态上下文构建

```text
springboot/src/main/java/org/example/springboot/service/MultimodalContentService.java
```

职责：

- 统一接收附件列表。
- 根据 `mediaType` 分发到不同解析服务。
- 将解析结果写入 `extractedText`。
- 生成最终给大模型看的 `modelText`。

不同类型处理方式：

| 类型 | 处理服务 | 解析结果 |
|---|---|---|
| `IMAGE` | `ImageAnalysisService` | 图片内容描述 |
| `AUDIO` | `AudioTranscriptionService` | 音频转写文本 |
| `VIDEO` | `VideoAnalysisService` | 关键帧视觉分析 + 音轨转写 |
| `DOCUMENT` | `DocumentTextExtractionService` | 文档正文 |

## 六、各模态具体实现

### 1. 图片

服务类：

```text
ImageAnalysisService
```

处理方式：

- 读取本地图片文件。
- 转为 OpenAI-compatible vision 请求格式。
- 调用视觉模型分析图片。
- 返回图片摘要或与用户问题相关的图片理解结果。

关键优化：

- 模型从 `Qwen/Qwen3-Omni-30B-A3B-Instruct` 调整为 `Qwen/Qwen3-VL-30B-A3B-Instruct`。
- 增加图片分析超时时间配置：

```yaml
image:
  analysis:
    timeout-seconds: 25
```

### 2. 音频

服务类：

```text
AudioTranscriptionService
```

处理方式：

- 读取上传音频。
- 通过 OpenAI-compatible ASR 接口提交 multipart 请求。
- 返回转写文本。

核心配置：

```yaml
asr:
  openai:
    transcriptions-path: /v1/audio/transcriptions
    model: FunAudioLLM/SenseVoiceSmall
    language: zh
```

接口内部会发送字段：

| 字段 | 说明 |
|---|---|
| `model` | ASR 模型 |
| `language` | 语言，当前为 `zh` |
| `response_format` | `json` |
| `file` | 音频文件 |

### 3. 视频

服务类：

```text
VideoAnalysisService
```

处理方式：

1. 使用 `ffmpeg` / `ffprobe` 检查视频。
2. 抽取若干关键帧。
3. 对关键帧调用图片理解服务。
4. 抽取音轨。
5. 对音轨调用 ASR。
6. 合并画面分析和音频转写。

核心配置：

```yaml
video:
  ffmpeg:
    path: ffmpeg
    ffprobe-path: ffprobe
    frame-count: 3
    max-duration-seconds: 120
    work-dir: ai-chat-video
```

### 4. 文档

服务类：

```text
DocumentTextExtractionService
```

支持内容：

- `.docx`：通过 Apache POI `XWPFDocument` 提取段落文本。
- `.pdf`：通过 PDFBox 提取文本。
- `.txt`、`.md` 等文本文件：直接读取文本。

测试结果：

- 已生成三星堆主题 `.docx` 测试文档。
- 上传后 `mediaType = DOCUMENT`。
- 后端解析状态为 `DONE`。
- 日志中可以看到完整正文被写入 `extractedText`。
- AI 能基于文档正文进行概括。

## 七、前端关键实现位置

### 1. 聊天页面

```text
vue3/src/views/frontend/AiChat.vue
```

主要职责：

- 输入框与发送按钮。
- 附件选择与预览。
- 图片、音频、视频、文档展示。
- 调用临时文件上传接口。
- 调用流式聊天接口。
- 麦克风录音、WAV 编码和语音转写。
- 多模态失败提示。
- 过滤 `【资料1】` 等不应展示的引用标记。

### 2. AI API 封装

```text
vue3/src/api/AiChatApi.js
```

主要方法：

```js
createSession(title, config)
getSessionMessages(sessionId, config)
getChatStreamUrl()
transcribeSpeechInput(file, config)
```

### 3. 文件 API 封装

```text
vue3/src/api/FileApi.js
```

主要方法：

```js
uploadTempFile(file, callbacks)
```

## 八、配置项说明

主要配置文件：

```text
springboot/src/main/resources/application.yml
springboot/src/main/resources/application-template.yml
```

核心配置示例：

```yaml
spring:
  ai:
    openai:
      base-url: https://api.siliconflow.cn
      api-key: <your-api-key>
      chat:
        options:
          model: Qwen/Qwen3-VL-30B-A3B-Instruct

asr:
  openai:
    transcriptions-path: /v1/audio/transcriptions
    model: FunAudioLLM/SenseVoiceSmall
    language: zh

image:
  analysis:
    timeout-seconds: 25

video:
  ffmpeg:
    path: ffmpeg
    ffprobe-path: ffprobe
    frame-count: 3
    max-duration-seconds: 120
    work-dir: ai-chat-video
```

说明：

- 聊天和图片理解使用 OpenAI-compatible chat completions 接口。
- ASR 使用 OpenAI-compatible audio transcriptions 接口。
- 视频解析依赖本地 `ffmpeg` 和 `ffprobe`。
- API Key 不应写入文档或提交到公开仓库。

## 九、回答格式优化

问题：

AI 回答结尾曾经出现 `【资料1】`。

原因：

- 后端系统提示曾允许模型引用 `【资料1】`。
- 前端 RAG 提示曾把检索资料命名为 `【资料1】`。

处理方式：

1. 后端 `PromptManage` 禁止输出 `【资料1】【资料2】` 等资料编号。
2. 前端 `knowledgeSearch.js` 将资料标签改为普通“参考材料”。
3. 前端 `AiChat.vue` 在展示层增加兜底清理。

## 十、测试结果

已完成测试：

| 类型 | 测试结果 |
|---|---|
| 图片 + 文字 | 可正常返回图片相关回答 |
| 音频附件 | 可完成 ASR 转写并用于回答 |
| 视频附件 | 可抽帧分析并抽取音轨转写 |
| 文档附件 | `.docx` 正文提取成功，AI 可概括 |
| 麦克风输入 | 可录音、转写并填入输入框 |
| 回答格式 | 已去除 `【资料1】` |

文档测试样例：

```text
docs/test-docs/sanxingdui_document_reading_test.docx
```

该文档约 400 字，上传后后端解析状态为 `DONE`，AI 回答基于文档内容生成。

## 十一、当前效果

当前 AI 聊天模块已经具备较完整的多模态输入能力：

- 用户可以输入文本。
- 用户可以上传图片、音频、视频、文档。
- 用户可以通过麦克风语音转文字。
- 后端可以根据不同媒体类型完成解析。
- AI 可以结合文本和附件解析结果回答问题。

整体上，该优化提升了三星堆主题讲解、文物识别、资料概括和交互问答的综合能力。
