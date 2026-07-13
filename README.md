# Sanxingdui 非遗传承系统

这是一个前后端分离项目：

- 后端：Spring Boot 3，默认端口 `8889`
- 前端：Vue 3 + Vite，默认端口 `8800`
- 数据库：MySQL，复现建议库名 `sanxingdui_repro`
- 可选图谱：Neo4j，默认 `bolt://localhost:7687`
- 图片生成：Spring Boot 直连 SiliconFlow 图片模型 API

## 环境要求

- JDK 17
- Node.js 20/22 LTS 推荐；Node.js 24 也可运行当前前端依赖
- MySQL 8.x
- Git
- Neo4j 5.x（可选，用于知识图谱增强）

## 克隆项目

```powershell
git clone https://github.com/cshhhhh110/sanxingdui.git
cd sanxingdui
```

如果已经克隆过：

```powershell
git pull origin master
```

## 初始化数据库

先创建一个独立复现库，避免覆盖你本机原项目的 `heritage_db`：

```powershell
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS sanxingdui_repro DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
cmd /c "mysql -u root -p sanxingdui_repro < heritage_db.sql"
```

PowerShell 不支持 `mysql ... < heritage_db.sql` 这种输入重定向，所以导入 SQL 时要用 `cmd /c "..."`。

`heritage_db.sql` 已包含时空探索需要的竞赛增量字段和 5 件核心文物数据。如果你是在旧版本仓库下已经导入过数据库，再拉取新版代码后只需要补跑一次：

```powershell
cmd /c "mysql -u root -p sanxingdui_repro < docs\sql\competition-p0.sql"
```

## 配置后端

真实配置文件不提交到 GitHub。每个开发者在本机复制模板：

```powershell
copy springboot\src\main\resources\application-template.yml springboot\src\main\resources\application.yml
```

然后编辑 `springboot/src/main/resources/application.yml`，至少填写：

- `spring.datasource.username`
- `spring.datasource.password`
- `jwt.secret`
- `spring.ai.openai.api-key`（需要 AI 对话时）
- `zhipu.api-key`（使用智谱 GLM-TTS 时，推荐通过 `ZHIPU_API_KEY` 环境变量配置）
- `mimo.api-key` 或 `deepseek.api-key`（需要对应能力时）
- `graph.neo4j.password`（启用 Neo4j 时）

`application.yml` 已被 `.gitignore` 忽略，不要提交真实密码、邮箱授权码或 API Key。

## 启动后端

```powershell
cd springboot
.\mvnw.cmd spring-boot:run
```

后端地址：

```text
http://localhost:8889
```

## 启动前端

```powershell
cd vue3
npm ci
npm run dev
```

前端地址：

```text
http://localhost:8800
```

Vite 已配置代理：

- `/api` -> `http://localhost:8889`
- `/files` -> `http://localhost:8889`

仓库内已保留首页、课程、活动、文物、商城展示需要的图片素材；课程视频属于大文件，未纳入 Git。复现环境未放入视频时，课程学习页会显示文字章节，不会返回失效视频地址。

## 可选：Neo4j 图谱

默认模板中 Neo4j 关闭：

```yaml
graph:
  neo4j:
    enabled: false
```

如果要启用：

1. 启动本机 Neo4j。
2. 在 `application.yml` 中设置 `graph.neo4j.enabled: true`。
3. 填写 `graph.neo4j.password`。
4. 在 Neo4j Browser 或 cypher-shell 中执行：

```text
docs/neo4j-graph-seed.cypher
```

即使 Neo4j 未启用，后端仍会回退到 MySQL 图谱数据。

## AI 图片生成

`/ai-image-generator` 和聊天页生图模式统一请求 Spring Boot 的
`/api/media-generation/image`。后端通过 `SiliconFlowImageGenerationProvider`
直接调用 SiliconFlow，并将短时结果下载到 `springboot/files/generated`。

图片模型默认使用 `Qwen/Qwen-Image`，可通过环境变量调整：

```env
IMAGE_GENERATION_MODEL=Qwen/Qwen-Image
IMAGE_GENERATION_API_KEY=<your-api-key>
```

没有单独配置 `IMAGE_GENERATION_API_KEY` 时，后端复用
`spring.ai.openai.api-key`。供应商密钥不得写入前端环境变量。

视频生成使用 `Wan-AI/Wan2.2-T2V-A14B` 和
`Wan-AI/Wan2.2-I2V-A14B`，通过 `/v1/video/submit` 提交并由后端定时查询
`/v1/video/status`。完成后的短时视频地址会立即转存到本地，并通过
`ffprobe` 校验后写入 `sys_file_info`。当前模型输出约 5 秒视频。

## 常用验证

前端打包：

```powershell
cd vue3
npm run build
```

后端编译：

```powershell
cd springboot
.\mvnw.cmd -DskipTests package
```

启动后建议访问：

- `http://localhost:8800/tanmi`
- `http://localhost:8800/trail`
- `http://localhost:8800/3dlist`
- `http://localhost:8800/ai-image-generator`

## 协作约定

- 两人默认从 `master` 拉取和推送。
- 开始开发前先执行 `git pull origin master`。
- 提交前检查 `git status`，确认没有真实配置和临时文件。
- 不提交 `node_modules`、`dist`、`target`、日志、上传文件和本地 `application.yml`。
- 如果真实密钥曾经进入 GitHub，请立刻在对应平台重置密钥。
