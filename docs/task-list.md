# 三星堆竞赛 MVP · 任务清单

## 当前进度：展示层完成，数据层待接通

---

## 一、数据库（你的任务）

### 1.1 扩展 heritage_item 表
在 `heritage_db.heritage_item` 表新增以下列：

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

### 1.2 更新 5 件文物数据
按 `docs/competition-artifact-dataset.md` 的数据，更新 5 条记录：

| entityId | site_code | era_code | glb_url |
|----------|-----------|----------|---------|
| HI-2025-006 | SANXINGDUI | LATE_SHU | /glbs/shenshu.glb |
| HI-2025-003 | SANXINGDUI | LATE_SHU | /glbs/zongmu.glb |
| HI-2025-005 | SANXINGDUI | LATE_SHU | /glbs/daliren.glb |
| HI-2025-004 | SANXINGDUI | LATE_SHU | /glbs/黄金面具残片.glb |
| HI-2025-002 | SANXINGDUI | LATE_SHU | /glbs/黄金面具残片.glb |

### 1.3 验证
```sql
SELECT id, title, site_code, era_code, craft_codes, glb_url FROM heritage_item WHERE id IN ('HI-2025-006','HI-2025-003','HI-2025-005','HI-2025-004','HI-2025-002');
```

---

## 二、后端 API（我的任务，你完成数据库后触发）

### 2.1 POST /api/spacetime/search
- 入参：startYear, endYear, siteCodes, craftCodes
- 查 heritage_item 表，WHERE 过滤
- 返回 artifacts 列表 + site/era/craft 统计

### 2.2 GET /api/graph/artifacts/{entityId}
- 返回文物节点 + 关联的 site/era/craft 节点 + 边
- 用 MySQL JOIN 模拟图谱结构

### 2.3 前端数据源切换
- tanmi.vue：本地 JSON → spacetime API
- Three3dDemo.vue.svg 图谱 → graph API 真实数据

---

## 三、RAG 知识库（你的任务）

### 3.1 准备文物文档
每件文物写一段 300-500 字介绍，覆盖：名称、年代、出土地、工艺、象征意义、学术价值。

格式：
```
文件：docs/rag/青铜神树.txt
文件：docs/rag/青铜纵目面具.txt
文件：docs/rag/青铜大立人像.txt
文件：docs/rag/金杖.txt
文件：docs/rag/完整金面具.txt
```

### 3.2 准备通用知识文档（可选，加分）
- 三星堆遗址概述
- 古蜀文明时间线
- 青铜铸造工艺简介

---

## 四、GLB 模型（你的任务）

金杖目前缺专属 GLB。找或做一个，放到 `/glbs/` 目录。

---

## 五、答辩准备

### 5.1 演示路线脚本
按 5 步流程写一个 5 分钟的口述脚本。

### 5.2 PPT
项目背景 → 技术架构 → 核心功能 → 创新点 → 演示 → 展望。

---

## 任务优先级

| 优先级 | 任务 | 谁做 | 预估 |
|:--:|------|:--:|:--:|
| 🔴 P0 | 1.1 表扩展 + 1.2 数据入库 | 你 | 30分钟 |
| 🔴 P0 | 2.1 + 2.2 + 2.3 API开发+前端切换 | 我 | 半天 |
| 🟡 P1 | 3.1 文物文档准备 | 你 | 1小时 |
| 🟡 P1 | RAG 接入（检索+生成） | 我 | 半天 |
| 🟢 P2 | 3.2 通用知识 + 4.GLB | 你 | 视情况 |
| 🟢 P2 | 5.答辩材料 | 你 | 半天 |
