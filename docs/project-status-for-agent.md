# Project Brief — Sanxingdui Competition MVP

## 一、速查

| 项目 | 路径 | 端口 | 启动 | 职责 |
|------|------|:--:|------|------|
| 前端 | `G:\终版\vue3\` | 8800 | `npm run dev` | Vue3+Vite+AntDV，/api→8889 |
| 主后端 | `G:\终版\springboot\` | 8889 | `.\mvnw.cmd spring-boot:run` | SpringBoot3.4，MySQL heritage_db |
| AI中继 | `G:\终版\XunFeiTest\` | 8089 | `.\mvnw.cmd spring-boot:run` | 讯飞星火WebSocket（即将废弃） |

```
MySQL: localhost:3306 / heritage_db / root / 见application.yml
MiMo key: 已配在application.yml mimo.api-key段
TTS provider: 当前mimo，切siliconflow改tts.provider
```

## 二、已完成

### 竞赛5页面（`vue3/src/views/`）

| 页面 | 文件 | 状态 | 数据源 |
|------|------|:--:|------|
| Home | `frontend/Home.vue` | 完成 | 后端API |
| 时空探索 | `frontend/tanmi.vue` | 完成 | **本地JSON** |
| 文物列表 | `3ddemo.vue` | 完成 | **本地JSON** |
| 3D+图谱 | `Three3dDemo.vue` | 完成 | **本地JSON** |
| AI解读 | `frontend/AiChat.vue` | 完成 | 本地JSON+后端SSE |

### GLB模型（`vue3/public/glbs/`）
- `shenshu.glb` 有 / `zongmu.glb` 有 / `daliren.glb` 有 / 金杖 **缺**（暂用黄金面具残片占位）

### 后端
- 14个Controller全部就绪，含 AiChatController（SSE流式）、TtsController（多provider音色）
- MiMo已接入：chat模型`mimo-v2.5-pro`、TTS模型`mimo-v2.5-tts`
- 玄喵Live2D组件：音色切换、打字机气泡、自动隐藏，见 `vue3/src/components/Live2DAvatar.vue`

### 本地种子数据
- `vue3/public/data/competition-artifacts.seed.json` — 5件文物完整字段
- `vue3/src/data/competitionArtifacts.js` — 加载+查询工具函数

---

## 三、待办

### P0 — 数据层接通

**1. 数据库扩展**

表 `heritage_item` 新增列（连MySQL执行）：
```sql
ALTER TABLE heritage_item ADD COLUMN site_code VARCHAR(50);
ALTER TABLE heritage_item ADD COLUMN site_name VARCHAR(50);
ALTER TABLE heritage_item ADD COLUMN era_code VARCHAR(50);
ALTER TABLE heritage_item ADD COLUMN era_name VARCHAR(50);
ALTER TABLE heritage_item ADD COLUMN time_start_year INT;
ALTER TABLE heritage_item ADD COLUMN time_end_year INT;
ALTER TABLE heritage_item ADD COLUMN craft_codes VARCHAR(255);
ALTER TABLE heritage_item ADD COLUMN craft_names VARCHAR(255);
ALTER TABLE heritage_item ADD COLUMN glb_url VARCHAR(500);
ALTER TABLE heritage_item ADD COLUMN symbolic_meaning VARCHAR(500);
```

然后按 `docs/competition-artifact-dataset.md` 的数据 UPDATE/INSERT 5条记录：
```
HI-2025-006 青铜神树     site=SANXINGDUI era=LATE_SHU glb=/glbs/shenshu.glb
HI-2025-003 青铜纵目面具  site=SANXINGDUI era=LATE_SHU glb=/glbs/zongmu.glb
HI-2025-005 青铜大立人像  site=SANXINGDUI era=LATE_SHU glb=/glbs/daliren.glb
HI-2025-004 金杖         site=SANXINGDUI era=LATE_SHU glb=/glbs/黄金面具残片.glb
HI-2025-002 完整金面具    site=SANXINGDUI era=LATE_SHU glb=/glbs/黄金面具残片.glb
```

**2. 新建 `POST /api/spacetime/search`**

在 `springboot/src/main/java/org/example/springboot/controller/` 新建 `SpacetimeController.java`：
- 入参：`{ startYear, endYear, siteCodes, craftCodes, keyword }`
- 查 `heritage_item` 表 WHERE 过滤时间/遗址/工艺
- 返回 artifacts 列表 + 按 site/era/craft 分组统计

**3. `tanmi.vue` 切数据源**

文件：`vue3/src/views/frontend/tanmi.vue`
- import 从 `@/data/competitionArtifacts` 改为调 `/api/spacetime/search`
- 筛选参数变化时重新请求，不再读本地JSON

### P1 — 图谱+问答升级

**4. 新建 `GET /api/graph/artifacts/{entityId}`**

在 `SpacetimeController.java` 中加端点：
- 返回：`{ nodes: [...], edges: [...] }`
- node类型：artifact / site / era / craft
- edge类型：BELONGS_TO_SITE / BELONGS_TO_ERA / USES_CRAFT
- 用MySQL JOIN模拟，不必上Neo4j

**5. `Three3dDemo.vue` 图谱切API**

文件：`vue3/src/views/Three3dDemo.vue`
- 当前图谱是SVG硬编码 → 改为调 `/api/graph/artifacts/{entityId}` 后动态渲染
- Three.js 3D加载不动

**6. 玄喵 RAG 问答**

按 `docs/rag-implementation-plan.md` 执行（另文详细）：
- 新建7个知识txt → `vue3/public/data/knowledge-*.txt`
- 新建 `vue3/src/utils/knowledgeSearch.js`
- 新建 `vue3/src/api/MiMoChatApi.js`
- 改 `Live2DAvatar.vue` 的 submitQuestion 走 RAG+MiMo 流式

### P2 — 锦上添花

**7. 金杖 GLB 模型** → 放到 `vue3/public/glbs/`

**8. 答辩PPT + 5分钟演示脚本**

---

## 四、边界

- 只做竞赛5页面相关，不改shop/course/activity/order等业务模块
- 后端已有Controller不改逻辑，新增的放新Controller
- `application.yml` 不动（数据库/密钥/MiMo已配好）
- `chatReplyConfig.js` 先保留不动，等RAG稳定后再删
- 前端UI布局可优化，风格保持统一
- 数据契约参考 `docs/competition-artifact-dataset.md`
