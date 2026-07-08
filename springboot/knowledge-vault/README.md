# 青铜数元知识库

`wiki/` 是供 Spring Boot RAG 服务读取的 Obsidian Vault 发布副本。

- 仅同步整理后的 Markdown 页面，不包含 `.raw/`、插件配置、密钥或大型附件。
- 默认只读；运行时每 60 秒按文件 SHA-256 增量刷新索引。
- 可通过 `KNOWLEDGE_VAULT_PATH` 指向独立维护的 Vault `wiki/` 目录。
- 内容结构基于 claude-obsidian v1.9.2（MIT）的方法组织，知识内容归本项目维护者所有。

生产部署建议将 Vault 作为独立私有仓库同步，并让应用账号仅拥有读取权限。
