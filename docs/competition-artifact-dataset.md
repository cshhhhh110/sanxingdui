# Sanxingdui Competition Artifact Dataset

## 1. Purpose

This file is the competition MVP source dataset for the 5 flagship artifacts.

It is the single source of truth for:

- homepage featured artifacts
- time-space filtering results
- 3D artifact entry page
- graph seed data
- AI interpretation context

## 2. Selection Rule

The artifact set must satisfy these conditions:

1. strong public recognition
2. clear Sanxingdui identity
3. good explanatory value
4. available visual assets in the current project
5. enough diversity to support graph and AI demonstrations

## 3. Final Artifact Set

### A. HI-2025-006

- `entityId`: `HI-2025-006`
- `title`: `青铜神树（一号神树）`
- `displayTitle`: `青铜神树`
- `category`: `青铜器`
- `siteCode`: `SANXINGDUI`
- `siteName`: `三星堆遗址`
- `eraCode`: `LATE_SHU`
- `eraName`: `古蜀晚期`
- `timeStartYear`: `-1200`
- `timeEndYear`: `-1000`
- `region`: `四川广汉`
- `craftCodes`: `SEGMENT_CASTING`, `ASSEMBLY_CASTING`, `RIVETING`
- `craftNames`: `分段铸造`, `嵌铸工艺`, `铆接工艺`
- `symbolicMeaning`: `通天神树、天地相通、神权祭祀、宇宙观象征`
- `summary`: `中国现存最大单件青铜文物，象征古蜀宇宙观与通天神树。`
- `coverImage`: `/images/青铜神树.jpg`
- `glbUrl`: `/glbs/shenshu.glb`

### B. HI-2025-003

- `entityId`: `HI-2025-003`
- `title`: `青铜纵目面具`
- `displayTitle`: `青铜纵目面具`
- `category`: `青铜器`
- `siteCode`: `SANXINGDUI`
- `siteName`: `三星堆遗址`
- `eraCode`: `LATE_SHU`
- `eraName`: `古蜀晚期`
- `timeStartYear`: `-1200`
- `timeEndYear`: `-1000`
- `region`: `四川广汉`
- `craftCodes`: `BRONZE_CASTING`, `SURFACE_DECORATION`
- `craftNames`: `青铜铸造`, `表面纹饰处理`
- `symbolicMeaning`: `祖先神崇拜、纵目神像、神权威慑、祭祀重器`
- `summary`: `三星堆最具标志性的神造像之一，以极度夸张的纵目造型著称。`
- `coverImage`: `/images/青铜纵目面具.jpg`
- `glbUrl`: `/glbs/zongmu.glb`

### C. HI-2025-005

- `entityId`: `HI-2025-005`
- `title`: `青铜大立人像`
- `displayTitle`: `青铜大立人像`
- `category`: `青铜器`
- `siteCode`: `SANXINGDUI`
- `siteName`: `三星堆遗址`
- `eraCode`: `LATE_SHU`
- `eraName`: `古蜀晚期`
- `timeStartYear`: `-1200`
- `timeEndYear`: `-1000`
- `region`: `四川广汉`
- `craftCodes`: `SEGMENT_CASTING`, `ASSEMBLY_CASTING`
- `craftNames`: `分段浇铸`, `嵌铸工艺`
- `symbolicMeaning`: `王权与神权合一、大祭司形象、最高权威象征`
- `summary`: `世界同时期最大青铜立人像，是古蜀领袖形象的重要象征。`
- `coverImage`: `/images/青铜大立人像.jpg`
- `glbUrl`: `/glbs/daliren.glb`

### D. HI-2025-004

- `entityId`: `HI-2025-004`
- `title`: `金杖`
- `displayTitle`: `金杖`
- `category`: `金器`
- `siteCode`: `SANXINGDUI`
- `siteName`: `三星堆遗址`
- `eraCode`: `LATE_SHU`
- `eraName`: `古蜀晚期`
- `timeStartYear`: `-1200`
- `timeEndYear`: `-1000`
- `region`: `四川广汉`
- `craftCodes`: `GOLD_HAMMERING`, `PATTERN_ENGRAVING`
- `craftNames`: `金箔锤揲`, `纹饰刻画`
- `symbolicMeaning`: `王权权杖、通神法器、鱼凫王朝象征`
- `summary`: `古蜀王权象征物之一，以金箔包覆木杖并刻有神秘纹饰。`
- `coverImage`: `/images/商周金面具残片.jpg`
- `glbUrl`: `/glbs/黄金面具残片.glb`

Note:

The current project does not yet show a dedicated `金杖` image or GLB in the scanned public assets.
For competition MVP, this entry is temporarily allowed to share the existing gold-themed visual asset family until a dedicated model is added.

### E. HI-2025-002

- `entityId`: `HI-2025-002`
- `title`: `完整金面具`
- `displayTitle`: `完整金面具`
- `category`: `金器`
- `siteCode`: `SANXINGDUI`
- `siteName`: `三星堆遗址`
- `eraCode`: `LATE_SHU`
- `eraName`: `古蜀晚期`
- `timeStartYear`: `-1200`
- `timeEndYear`: `-1000`
- `region`: `四川广汉`
- `craftCodes`: `GOLD_HAMMERING`, `MASK_FORMING`
- `craftNames`: `锤揲成型`, `面具塑形`
- `symbolicMeaning`: `神性、高等级身份、黄金崇拜、不朽象征`
- `summary`: `三星堆迄今最完整、最大型金面具，体现古蜀黄金崇拜。`
- `coverImage`: `/images/商周金面具残片.jpg`
- `glbUrl`: `/glbs/黄金面具残片.glb`

## 4. Site Dictionary

### SANXINGDUI

- `siteCode`: `SANXINGDUI`
- `siteName`: `三星堆遗址`
- `longitude`: `104.2000`
- `latitude`: `30.9900`
- `virtualX`: `0`
- `virtualY`: `0`
- `virtualZ`: `0`

### JINSHA

- `siteCode`: `JINSHA`
- `siteName`: `金沙遗址`
- `longitude`: `104.0100`
- `latitude`: `30.6800`
- `virtualX`: `120`
- `virtualY`: `0`
- `virtualZ`: `0`

## 5. Era Dictionary

### LATE_SHU

- `eraCode`: `LATE_SHU`
- `eraName`: `古蜀晚期`
- `timeStartYear`: `-1200`
- `timeEndYear`: `-1000`

### JINSHA_TRANSITION

- `eraCode`: `JINSHA_TRANSITION`
- `eraName`: `古蜀传承阶段`
- `timeStartYear`: `-1000`
- `timeEndYear`: `-650`

Note:

The 5 flagship artifacts in the first MVP are centered on Sanxingdui for stronger visual consistency.
Jinsha still remains in the site model so the time-space page can explain cultural continuity.

## 6. Craft Dictionary

### SEGMENT_CASTING

- `craftCode`: `SEGMENT_CASTING`
- `craftName`: `分段铸造`

### ASSEMBLY_CASTING

- `craftCode`: `ASSEMBLY_CASTING`
- `craftName`: `嵌铸工艺`

### RIVETING

- `craftCode`: `RIVETING`
- `craftName`: `铆接工艺`

### BRONZE_CASTING

- `craftCode`: `BRONZE_CASTING`
- `craftName`: `青铜铸造`

### SURFACE_DECORATION

- `craftCode`: `SURFACE_DECORATION`
- `craftName`: `表面纹饰处理`

### GOLD_HAMMERING

- `craftCode`: `GOLD_HAMMERING`
- `craftName`: `金箔锤揲`

### PATTERN_ENGRAVING

- `craftCode`: `PATTERN_ENGRAVING`
- `craftName`: `纹饰刻画`

### MASK_FORMING

- `craftCode`: `MASK_FORMING`
- `craftName`: `面具塑形`

## 7. MVP Implementation Rules

1. These 5 artifacts are the default first dataset for all competition features
2. Frontend demos should not go beyond this set before the core loop is stable
3. If a dedicated image or GLB is missing, temporary substitution is allowed for MVP, but the business identity must remain correct
4. Any graph seed or AI grounding data should be built from this file first

## 8. Recommended Next Conversion

This document should next be converted into:

1. a machine-readable JSON seed file for frontend use
2. a backend seed source for graph and spacetime modules
3. a graph import draft for Neo4j node creation
