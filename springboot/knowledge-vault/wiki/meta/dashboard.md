---
type: meta
title: "知识库仪表板"
created: 2026-07-03
updated: 2026-07-03
tags: [仪表板, 元数据]
status: evergreen
---

# 📊 知识库仪表板

> 使用 Dataview 插件实时查询知识库状态

## 最近活动

```dataview
TABLE type as 类型, status as 状态, updated as 更新日期
FROM "wiki"
WHERE type != "meta"
SORT updated DESC
LIMIT 15
```

## 待完善页面（种子状态）

```dataview
LIST
FROM "wiki"
WHERE status = "seed"
SORT created ASC
```

## 按类型统计

### 实体条目

```dataview
TABLE entity_type as 实体类型, tags as 标签
FROM "wiki/entities"
SORT entity_type
```

### 概念条目

```dataview
TABLE complexity as 复杂度, domain as 主题域
FROM "wiki/concepts"
SORT complexity
```

### 原始资料

```dataview
TABLE source_type as 资料类型, authors as 作者, date_published as 发表日期
FROM "wiki/sources"
SORT date_published DESC
```

## 研究问题

```dataview
TABLE question as 问题, answer_quality as 答案质量, updated as 更新日期
FROM "wiki/questions"
SORT updated DESC
```

## 缺失来源的条目

```dataview
LIST
FROM "wiki"
WHERE !sources OR length(sources) = 0
WHERE type != "meta"
```

## 孤立页面（无关联）

```dataview
LIST
FROM "wiki"
WHERE !related OR length(related) = 0
WHERE type != "meta" AND type != "overview"
```

## 标签云

```dataview
TABLE length(rows) as 数量
FROM "wiki"
FLATTEN tags
GROUP BY tags
SORT length(rows) DESC
```

## 研究主题域分布

```dataview
TABLE length(rows.file.link) as 页面数
FROM "wiki/domains"
GROUP BY file.folder
```

---

## 使用说明

本仪表板需要安装 **Dataview** 插件：
1. Obsidian > Settings > Community Plugins > Browse
2. 搜索 "Dataview" > Install > Enable
3. 刷新本页面即可看到数据

---

**最后更新**: 2026-07-03
