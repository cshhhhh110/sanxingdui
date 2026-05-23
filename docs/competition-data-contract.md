# Sanxingdui Competition Data Contract

## 1. Purpose

This document defines the minimum shared contract for the competition MVP:

- identity model
- route parameter model
- frontend request model
- backend response model

The goal is to let frontend, backend, graph, and AI work around one consistent structure.

## 2. Canonical Identity Model

### Primary identity

Use the current MySQL heritage item ID as the global artifact identity.

Field:

`entityId`

Mapping rule:

- `entityId = heritage_item.id`
- Example: `HI-2025-006`

This value must be used consistently in:

- artifact list
- route query
- 3D page
- graph query
- AI context
- future Neo4j artifact node key

### Why

The current project already uses `id` in heritage item data.
Creating a second artifact identifier in MVP would increase risk and confusion.

## 3. Core Business Objects

### Artifact summary object

Used in:

- time-space result list
- homepage competition block
- 3D artifact list

Structure:

```json
{
  "entityId": "HI-2025-006",
  "title": "青铜神树",
  "category": "青铜器",
  "siteCode": "SANXINGDUI",
  "siteName": "三星堆遗址",
  "eraCode": "LATE_SHU",
  "eraName": "古蜀晚期",
  "craftCodes": ["SEGMENT_CASTING", "ASSEMBLY_CASTING"],
  "craftNames": ["分段铸造", "嵌铸工艺"],
  "summary": "中国现存最大单件青铜文物",
  "coverImage": "/files/xxx.jpg",
  "glbUrl": "/glbs/shenshu.glb"
}
```

### Artifact detail object

Used in:

- 3D interaction page
- AI context panel
- graph popup side panel

Structure:

```json
{
  "entityId": "HI-2025-006",
  "title": "青铜神树",
  "category": "青铜器",
  "siteCode": "SANXINGDUI",
  "siteName": "三星堆遗址",
  "eraCode": "LATE_SHU",
  "eraName": "古蜀晚期",
  "summary": "中国现存最大单件青铜文物",
  "description": "......",
  "symbolicMeaning": "通天神树、天地相通、神权祭祀",
  "craftCodes": ["SEGMENT_CASTING", "ASSEMBLY_CASTING"],
  "craftNames": ["分段铸造", "嵌铸工艺"],
  "glbUrl": "/glbs/shenshu.glb",
  "coverImage": "/files/xxx.jpg",
  "relatedSites": [],
  "relatedCrafts": [],
  "relatedCultures": []
}
```

## 4. Route Parameter Contract

### Time-space exploration -> artifact list / 3D flow

The MVP route transition must carry at least these fields:

```json
{
  "entityId": "HI-2025-006",
  "glbUrl": "/glbs/shenshu.glb",
  "siteCode": "SANXINGDUI",
  "eraCode": "LATE_SHU"
}
```

### Route usage rules

- `entityId` is mandatory for any artifact interaction page
- `glbUrl` is mandatory for the 3D model page
- `siteCode` and `eraCode` are optional but recommended for context restore

### Page-specific rules

#### `3ddemo.vue`

Must route with:

- `entityId`
- `glbUrl`

#### `Three3dDemo.vue`

Must read:

- `entityId`
- `glbUrl`

The page must not rely on `glbUrl` alone.

#### `AiChat.vue`

Can receive context from:

- route query
- store state
- explicit request body

For MVP, request body context is enough even if route context is absent.

## 5. Frontend Request Contract

### A. Time-space search

Endpoint:

`POST /api/spacetime/search`

Request body:

```json
{
  "startYear": -1300,
  "endYear": -1000,
  "siteCodes": ["SANXINGDUI"],
  "craftCodes": ["SEGMENT_CASTING"]
}
```

Request rules:

- `startYear` and `endYear` represent the active time range
- `siteCodes` supports one or two sites in MVP
- `craftCodes` may be empty

### B. Artifact graph detail

Endpoint:

`GET /api/graph/artifacts/{entityId}`

Used by:

- `Three3dDemo.vue`
- optional `AiChat.vue` context panel

### C. Graph relation query

Endpoint:

`POST /api/graph/query`

Request body:

```json
{
  "entityIds": ["HI-2025-006"],
  "depth": 1
}
```

For MVP:

- one artifact query is enough
- depth should default to `1`

### D. AI interpretation

Endpoint:

`POST /api/ai/heritage-qa`

Request body:

```json
{
  "sessionId": "optional-session-id",
  "question": "青铜神树的祭祀意义是什么？",
  "context": {
    "entityId": "HI-2025-006",
    "siteCode": "SANXINGDUI",
    "eraCode": "LATE_SHU",
    "startYear": -1300,
    "endYear": -1000
  }
}
```

For MVP:

- `question` is mandatory
- `context.entityId` is strongly recommended
- `sessionId` can be reused from the current AI chat mechanism

## 6. Backend Response Contract

### Result envelope

Follow the current project result wrapper:

```json
{
  "code": "200",
  "msg": "success",
  "data": {}
}
```

All new endpoints must continue using the current `Result<T>` style.

### A. Time-space search response

```json
{
  "code": "200",
  "msg": "success",
  "data": {
    "query": {
      "startYear": -1300,
      "endYear": -1000,
      "siteCodes": ["SANXINGDUI"],
      "craftCodes": ["SEGMENT_CASTING"]
    },
    "artifacts": [],
    "siteStats": [],
    "eraStats": [],
    "craftStats": []
  }
}
```

### B. Artifact graph detail response

```json
{
  "code": "200",
  "msg": "success",
  "data": {
    "artifact": {},
    "nodes": [],
    "edges": []
  }
}
```

### C. AI interpretation response

```json
{
  "code": "200",
  "msg": "success",
  "data": {
    "answer": "......",
    "relatedEntities": ["HI-2025-006"],
    "citations": [
      "三星堆遗址",
      "分段铸造",
      "古蜀晚期"
    ]
  }
}
```

## 7. Compatibility With Current Project

### Current backend DTO reuse

The current `HeritageItemDetailResponseDTO` is a valid base object, but it does not yet include:

- `entityId`
- `siteCode`
- `siteName`
- `eraCode`
- `eraName`
- `craftCodes`
- `craftNames`
- `glbUrl`
- `symbolicMeaning`

For MVP:

- keep current DTOs for existing heritage pages
- create new competition-facing response DTOs for graph and spacetime modules

This avoids breaking the existing project while giving the competition flow a clean model.

### Current frontend API reuse

Existing APIs can still serve:

- homepage heritage item loading
- basic heritage detail loading

New competition APIs should be added separately, not overloaded into unrelated existing endpoints.

## 8. Immediate Implementation Rule

Before page refactoring starts, these rules must be respected:

1. Every competition artifact must have one stable `entityId`
2. Every 3D entry must carry both `entityId` and `glbUrl`
3. Every AI interpretation request should accept structured context
4. New graph and spacetime APIs must not break existing heritage APIs

## 9. Next Step Trigger

After this contract is accepted, the next implementation step should be:

`build the artifact source dataset for the 5 flagship artifacts`

That dataset should include:

- entityId
- title
- site
- era
- craft
- summary
- cover image
- glbUrl
- symbolic meaning
