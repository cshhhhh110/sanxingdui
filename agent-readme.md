# Sanxingdui 非遗传承系统 — Agent 理解版

> 面向 AI Agent / 新开发者快速上手。本文档描述项目全貌，足够让一个不了解本项目的 agent 准确理解和操作。

---

## 1. 项目一句话定义

**三星堆非遗文化数字展览系统**，前后端分离架构，面向竞赛答辩的 MVP 版本。

- 用户视角：一个可以按时间/空间/工艺筛选文物 → 查看 3D 模型 → 浏览知识图谱 → 向 AI 虚拟导游提问的交互式数字展馆
- 技术视角：Vue3 前端 + SpringBoot 后端 + MySQL 数据库 + 可选 Neo4j 图谱 + 可选 MiMo/DeepSeek AI

---

## 2. 项目目录地图

```
G:\终版\
├── springboot\                 # 后端：Spring Boot 3.4 + MyBatis-Plus (端口 8889)
│   ├── src/main/java/org/example/springboot/
│   │   ├── controller/         # 15 个 Controller（API 入口）
│   │   ├── service/            # 业务逻辑层
│   │   ├── entity/             # 17 个 MyBatis-Plus 实体（与数据库表一一对应）
│   │   ├── dto/                # 查询/响应 DTO（含竞赛专用 DTO）
│   │   ├── mapper/             # MyBatis-Plus Mapper
│   │   ├── config/             # Spring 配置（Security/Cors/AI Client）
│   │   ├── ai/                 # AI 对话服务（HeritageAssistantService/PromptManage）
│   │   ├── common/             # 通用类（Result 响应包装/JWT 工具）
│   │   ├── enums/              # 枚举
│   │   ├── exception/          # 全局异常处理
│   │   ├── mcp/                # MCP 工具（已废弃）
│   │   ├── util/               # 工具类
│   │   └── websocket/          # WebSocket 配置（已不再用于问答，待清理）
│   ├── src/main/resources/
│   │   ├── application-template.yml  # 配置模板（真实配置不提交）
│   │   └── mapper/                   # MyBatis XML
│   ├── files/bussiness/        # 业务文件存储（图片/视频/GLB）
│   │   ├── activity/           # 活动封面图
│   │   ├── course/             # 课程封面图
│   │   ├── course_chapter/     # 课程视频（.mp4，不上传 Git）
│   │   ├── heritage_item/      # 文物图片
│   │   ├── inheritor/          # 传承人头像
│   │   ├── shop_product/       # 商城商品图
│   │   └── user_avatar/        # 用户头像
│   └── pom.xml                 # Maven 依赖
│
├── vue3\                       # 前端：Vue 3 + Vite + Ant Design Vue (端口 8800)
│   ├── src/
│   │   ├── views/              # 页面组件
│   │   │   ├── frontend/       # 竞赛前台 5 页 + 业务前台页
│   │   │   │   ├── Home.vue          # 竞赛首页
│   │   │   │   ├── tanmi.vue         # 时空探索台（核心页面）
│   │   │   │   ├── AiChat.vue        # AI 文物讲解页
│   │   │   │   ├── taninfo1~3.vue    # 展品详情页
│   │   │   │   └── ...               # 课程/活动/商城前台
│   │   │   ├── backend/        # 后台管理 10 页（极简黑白绿风格）
│   │   │   ├── 3ddemo.vue      # 文物展厅（筛选结果列表）
│   │   │   ├── Three3dDemo.vue # 3D 数字馆 + 知识图谱
│   │   │   ├── auth/           # 登录/注册/找回密码
│   │   │   └── error/          # 404
│   │   ├── components/         # 公共组件
│   │   │   └── Live2DAvatar.vue  # 玄喵虚拟导游（1045行，核心组件）
│   │   ├── api/                # 后端 API 封装（16 个模块）
│   │   ├── utils/              # 工具模块
│   │   │   ├── knowledgeSearch.js   # RAG 知识检索
│   │   │   └── browserSpeech.js     # 浏览器语音输入
│   │   ├── config/             # 配置（chatReplyConfig.js 等）
│   │   ├── data/               # 本地种子数据（competitionArtifacts.js + competitionUi.js）
│   │   ├── router/             # Vue Router
│   │   ├── store/              # Pinia/Vuex Store
│   │   └── styles/             # 样式（含 competitionMotion.css）
│   ├── public/data/            # 公共数据文件
│   │   ├── competition-artifacts.seed.json   # 5 件文物种子数据
│   │   └── knowledge-*.txt                   # 7 份 RAG 知识文档
│   ├── public/glbs/            # 3D GLB 模型文件
│   │   ├── 青铜神树.glb / 纵目面具.glb / 青铜大立人像.glb
│   │   ├── 三星堆金杖.glb / 黄金面具残片.glb
│   │   └── 掐丝珐琅.glb / 11.glb / 12.glb  # 原有模型
│   ├── dist/                   # 构建产物
│   ├── vite.config.js          # Vite 配置（/api→8889 代理）
│   └── package.json            # 依赖清单
│
├── XunFeiTest\                 # AI 中继服务（讯飞星火 WebSocket, 端口 8089）
│   └── [已废弃，不再参与问答链路]
│
├── data\                       # 种子数据文件
│   └── competition-artifacts.seed.json
│
├── docs\                       # 项目文档（全部读完才算理解本项目）
│   ├── 80pct-guide.md                 # 80%完成度执行指南（agent可执行）
│   ├── project-status-for-agent.md    # 项目速查卡片
│   ├── 当前版本完整增量说明.txt         # 版本变更全量说明
│   ├── competition-mvp.md             # 竞赛 MVP 定义
│   ├── competition-artifact-dataset.md # 文物数据集（唯一数据源）
│   ├── competition-data-contract.md   # 数据契约
│   ├── competition-page-mapping.md    # 页面映射
│   ├── rag-implementation-plan.md     # RAG 问答实施计划
│   ├── task-list.md                   # 任务清单
│   ├── 玄喵模块变更说明.txt            # 玄喵变更细节
│   ├── xuanmiao-features.txt          # 玄喵功能清单
│   ├── 进度汇报-当前完成情况.md         # 进度汇报
│   ├── sql/competition-p0.sql         # 数据库增量 SQL
│   └── neo4j-graph-seed.cypher        # Neo4j 种子数据
│
├── logs\                       # 运行日志
│   ├── springboot-run.log      # 后端日志（~4MB）
│   └── vue3-dev.log            # 前端日志
│
├── heritage_db.sql             # 数据库全量导出 (~149KB)
├── .gitignore                  # Git 忽略规则
├── README.md                   # 原始 README（给人看）
└── agent-readme.md             # 本文件（给 agent 看）
```

---

## 3. 技术栈速览

| 层 | 技术 | 版本/说明 |
|----|------|-----------|
| 后端框架 | Spring Boot | 3.4.1 |
| Java | JDK | 17 |
| ORM | MyBatis-Plus | 3.5.7 |
| 数据库 | MySQL | 8.x, 库名 `heritage_db`（复现建议 `sanxingdui_repro`） |
| 可选图谱 | Neo4j | 5.x（未启用时回退到 MySQL JOIN） |
| 安全 | Spring Security + JWT | java-jwt 4.4.0 |
| API 文档 | Knife4j (Swagger) | 4.3.0 |
| AI 框架 | Spring AI | 1.0.0-SNAPSHOT, OpenAI 协议 |
| AI 模型 | SiliconFlow DeepSeek-V3 | 主力对话模型 |
| TTS | MiMo / SiliconFlow | 双 provider 可切换 |
| 前端框架 | Vue | 3.2 |
| 构建工具 | Vite | 4.5 |
| UI 库 | Ant Design Vue | 4.0 |
| 移动端 UI | Vant | 4.9 |
| 3D 渲染 | Three.js | 0.184 |
| 图谱可视化 | @antv/g6 / ECharts | 6.0 |
| SSE 流式 | @microsoft/fetch-event-source | 2.0 |
| 状态管理 | Pinia | 3.0 |
| 路由 | Vue Router | 4.0 |
| 其他 | Lombok, Hutool, Alipay SDK, fastjson2, Redis, JavaMail | — |

---

## 4. 数据库核心表

### 4.1 表清单（17 个实体对应）

| 表名 | 实体类 | 说明 |
|------|--------|------|
| `heritage_item` | HeritageItem.java | 非遗文物（含竞赛新增 10 个字段） |
| `course` | Course.java | 课程 |
| `course_chapter` | CourseChapter.java | 课程章节 |
| `activity` | Activity.java | 活动 |
| `activity_signup` | ActivitySignup.java | 活动报名 |
| `inheritor` | Inheritor.java | 传承人 |
| `inheritor_item` | InheritorItem.java | 传承人-作品关联 |
| `shop_product` | ShopProduct.java | 商城商品 |
| `shop_category` | ShopCategory.java | 商城分类 |
| `shop_order` | ShopOrder.java | 商城订单 |
| `shop_order_item` | ShopOrderItem.java | 订单明细 |
| `user` | User.java | 用户 |
| `user_address` | UserAddress.java | 用户地址 |
| `ai_chat_session` | AiChatSession.java | AI 对话会话 |
| `ai_chat_message` | AiChatMessage.java | AI 对话消息 |
| `quiz_record` | QuizRecord.java | 答题记录 |
| `sys_file_info` | SysFileInfo.java | 系统文件索引 |

### 4.2 竞赛扩展字段（heritage_item 表新增 10 列）

```sql
site_code         VARCHAR(50)    -- 遗址编码：SANXINGDUI / JINSHA
site_name         VARCHAR(50)    -- 遗址名称：三星堆遗址 / 金沙遗址
era_code          VARCHAR(50)    -- 时代编码：LATE_SHU
era_name          VARCHAR(50)    -- 时代名称：古蜀晚期
time_start_year   INT            -- 开始年份（如 -1200 表示公元前 1200）
time_end_year     INT            -- 结束年份
craft_codes       VARCHAR(255)   -- 工艺编码，逗号分隔
craft_names       VARCHAR(255)   -- 工艺名称，逗号分隔
glb_url           VARCHAR(500)   -- GLB 3D 模型路径
symbolic_meaning  VARCHAR(500)   -- 象征寓意
```

5 件核心文物已写入这些字段（`status=2` 已发布）。

---

## 5. 核心 API 一览

### 5.1 竞赛专用 API（SpacetimeController）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/spacetime/search` | 时空筛选：按 eraCode/siteCode/craftCode 过滤文物 |
| GET | `/spacetime/artifacts/{entityId}` | 单件文物前台展示详情 |
| GET | `/graph/artifacts/{entityId}` | 文物关系图谱（nodes+edges） |
| GET | `/graph/nodes/{id}/neighbors` | 图谱节点懒加载邻居（depth 参数） |

### 5.2 AI 对话 API（AiChatController）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/ai-chat/session/start` | 创建 AI 会话 |
| GET | `/ai-chat/session/list` | 获取用户会话列表 |
| GET | `/ai-chat/session/{id}/messages` | 获取会话消息历史 |
| POST | `/ai-chat/stream` | SSE 流式对话（核心接口） |
| POST | `/ai-chat/chat` | 非流式对话 |
| PUT | `/ai-chat/session/{id}/title` | 更新会话标题 |
| DELETE | `/ai-chat/session/{id}` | 删除会话 |

### 5.3 其他 Controller（13 个）

全部 15 个 Controller 含完整 CRUD，见 `springboot/.../controller/` 目录。此处不逐一展开。

---

## 6. 竞赛演示流程（5 页闭环）

```
用户入口
   │
   ▼
[Home.vue]  竞赛首页
   │  - Hero 标题"玄喵引路 古蜀寻踪"
   │  - 4 步浏览卡片
   │  - "进入展陈漫游"按钮
   │
   ▼
[tanmi.vue]  时空探索台（核心页面）
   │  - 三栏双列筛选：时代刻度 + 空间坐标 + 工艺筛选
   │  - 调用 POST /spacetime/search
   │  - URL query 同步筛选参数
   │  - 命中文物网格展示
   │
   ├──────────────┐
   ▼              ▼
[3ddemo.vue]   [Three3dDemo.vue]  3D 数字馆
文物展厅          - Three.js GLTF 模型加载
                  - @antv/g6 力导向知识图谱
                  - 5 种节点：artifact/site/era/craft/meaning
                  - 节点叙事面板
                      │
                      ▼
              [AiChat.vue]  AI 文物讲解
                  - 文物上下文横幅
                  - RAG 检索 + SSE 流式回答
                  - 语音输入按钮
                  - 跨文物比较提示
```

**玄喵（Live2DAvatar）贯穿全流程**：右下角固定猫导游，点击弹出对话面板，可随时提问文物相关问题。

---

## 7. 玄喵问答引擎架构

```
用户提问
   │
   ├─→ matchFixedAnswer (chatReplyConfig.js)
   │     │ 命中打招呼 → 固定回复
   │     │ 未命中 ↓
   │
   ├─→ searchKnowledge (knowledgeSearch.js)
   │     │ 7 份 knowledge-*.txt 中取 top1 最相关文档
   │     │ 无命中 → "不确定，不要编造"
   │     │ 有命中 ↓
   │
   ├─→ buildRagPrompt → SSE 流式（/ai-chat/stream）
   │     │ 后端 Spring AI → SiliconFlow DeepSeek-V3
   │     │ 收到首 token → 清掉思考动画 → 打字机逐字显示
   │     │ 流式完成 → synthesizeSpeech (TTS 语音播报)
   │     │ 失败 ↓
   │
   └─→ 兜底回复："喵～网络不太好，稍后再问我吧"
```

7 份知识文档：`knowledge-sanxingdui.txt` / `knowledge-sacred-tree.txt` / `knowledge-vertical-eye-mask.txt` / `knowledge-standing-figure.txt` / `knowledge-gold-scepter.txt` / `knowledge-gold-mask.txt` / `knowledge-craft.txt`

---

## 8. 5 件核心文物

| 编号 | 名称 | 工艺 | GLB 模型 |
|------|------|------|----------|
| HI-2025-006 | 青铜神树 | 分段铸造+嵌铸工艺 | /glbs/青铜神树.glb |
| HI-2025-003 | 青铜纵目面具 | 青铜铸造+表面纹饰处理 | /glbs/纵目面具.glb |
| HI-2025-005 | 青铜大立人像 | 分段铸造+嵌铸工艺 | /glbs/青铜大立人像.glb |
| HI-2025-004 | 金杖 | 金箔锤揲+纹饰刻画 | /glbs/三星堆金杖.glb |
| HI-2025-002 | 完整金面具 | 锤揲成型+面具塑形 | /glbs/黄金面具残片.glb |

全部属 `siteCode=SANXINGDUI`, `eraCode=LATE_SHU`, 年代 `-1200 ~ -1000`（公元前 1200~1000 年）。

---

## 9. 关键代码路径速查

### 9.1 前端核心文件

| 文件 | 行数 | 职责 |
|------|------|------|
| `vue3/src/views/frontend/tanmi.vue` | ~800+ | 时空探索台，三栏筛选 + API 调用 + URL query 同步 |
| `vue3/src/views/Three3dDemo.vue` | ~600+ | Three.js 3D + @antv/g6 知识图谱 |
| `vue3/src/views/frontend/AiChat.vue` | ~500+ | AI 对话页，SSE 流式 + RAG |
| `vue3/src/components/Live2DAvatar.vue` | ~1045 | 玄喵虚拟导游，问答/语音/TTS |
| `vue3/src/utils/knowledgeSearch.js` | ~180 | RAG 检索：分词+匹配+prompt 构建 |
| `vue3/src/api/SpacetimeApi.js` | ~60 | 竞赛 API 封装 |
| `vue3/src/data/competitionArtifacts.js` | — | 本地种子数据加载 |
| `vue3/src/data/competitionUi.js` | — | UI 文案+标签映射 |

### 9.2 后端核心文件

| 文件 | 行数 | 职责 |
|------|------|------|
| `springboot/.../controller/SpacetimeController.java` | 69 | 竞赛时空链路 4 个接口 |
| `springboot/.../service/SpacetimeService.java` | 648 | 时空筛选+图谱构建+邻居懒加载 |
| `springboot/.../controller/AiChatController.java` | 215 | AI 会话管理+SSE 流式 |
| `springboot/.../ai/HeritageAssistantService.java` | — | Spring AI 对话核心 |
| `springboot/.../ai/PromptManage.java` | — | 系统提示词管理（~180字） |
| `springboot/.../config/ChatClientConfig.java` | — | AI 客户端配置（12条历史窗口） |
| `springboot/.../entity/HeritageItem.java` | 200 | 文物实体（含竞赛10字段） |
| `springboot/pom.xml` | 276 | 所有 Maven 依赖 |

---

## 10. 环境配置速查

### 10.1 启动命令

```powershell
# 后端
cd G:\终版\springboot
.\mvnw.cmd spring-boot:run      # 端口 8889

# 前端
cd G:\终版\vue3
npm run dev                       # 端口 8800

# 可选：Neo4j 图谱服务
```

### 10.2 数据库信息

```
Host:     localhost:3306
Database: heritage_db（复现用 sanxingdui_repro）
User:     root
Password: 见 application.yml（不提交 Git）
```

### 10.3 配置模板路径

```
springboot/src/main/resources/application-template.yml  → 复制为 application.yml
```

必填：`spring.datasource.username/password`、`jwt.secret`、AI API Key。

### 10.4 前端代理

```
/api    → http://localhost:8889
/files  → http://localhost:8889
```

---

## 11. 项目当前状态

### 已完成

- 前后端 15 个 Controller 全部就绪
- 竞赛 5 页面 UI 完成
- 5 件核心文物竞赛数据已入库
- 时空筛选 API 已接通（POST /spacetime/search）
- 知识图谱 API 已接通（GET /graph/*）
- 玄喵 RAG 问答引擎就绪（知识检索 + SSE 流式 + TTS 语音）
- 浏览器语音输入已实现
- GLB 3D 模型文件齐全（金杖已有专用模型）
- 后台管理 10 页风格统一完成

### 待办

| 优先级 | 事项 |
|--------|------|
| 低 | 确认所有页面走 API 而非本地 JSON |
| 低 | 答辩 PPT + 演示脚本 |
| 低 | 清理 XunFeiTest 和 WebSocket 死代码 |

---

## 12. Agent 操作注意事项

1. **路径分隔符**：Windows 反斜杠 `\`，但 Git/代码中可能混用 `/`。建议统一用 `\\` 或 `/`。
2. **配置文件不提交**：`application.yml` 在 `.gitignore` 中，模板是 `application-template.yml`。
3. **状态字段**：`heritage_item.status` 含义：0=草稿, 1=待审, 2=已发布, 3=下架。竞赛前台只查 `status=2`。
4. **大文件限制**：`.glb` 模型文件 >100MB 的在 `.gitignore` 中排除，视频 `.mp4` 也不提交。
5. **玄喵兜底链**：三层兜底（RAG 无命中 → SSE 失败 → 全链路断），修改时不要破坏这个链条。
6. **编码问题**：Python `strftime` 中禁止中文字符格式串（会 `UnicodeEncodeError`），用 f-string 拼接。
7. **星语塔罗/ 和 运行.docx**：不相关文件和目录，`.gitignore` 已排除。
8. **XunFeiTest**：已废弃，但代码暂保留。所有问答不走这个服务。
9. **MiMo vs SiliconFlow**：TTS 双 provider 通过 `tts.provider` 配置切换；对话主力用 SiliconFlow DeepSeek-V3。
10. **知识文档**：在 `vue3/public/data/knowledge-*.txt`，UTF-8 编码，首行为标题，末行为标签行（`实体ID：xxx | 朝代：xxx | ...`）。
