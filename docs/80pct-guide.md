# 80% completion guide

## Context
Sanxingdui competition MVP. 5 pages: Home → tanmi → 3dlist → 3D → AiChat.
Current: UI done, data layer = local JSON seed. Completion ~50%.
Target: real data + graph API + narrative glue. Completion ~80%.

## Steps (execute in order)

### Step 1: Database — ALTER + UPDATE
- Connect MySQL: `localhost:3306 / heritage_db / YOUR_MYSQL_USERNAME / YOUR_MYSQL_PASSWORD`
- Run SQL:

```sql
ALTER TABLE heritage_item
  ADD COLUMN site_code VARCHAR(50),
  ADD COLUMN site_name VARCHAR(50),
  ADD COLUMN era_code VARCHAR(50),
  ADD COLUMN era_name VARCHAR(50),
  ADD COLUMN time_start_year INT,
  ADD COLUMN time_end_year INT,
  ADD COLUMN craft_codes VARCHAR(255),
  ADD COLUMN craft_names VARCHAR(255),
  ADD COLUMN glb_url VARCHAR(500),
  ADD COLUMN symbolic_meaning VARCHAR(500);

-- Update 5 records. Match by id.
UPDATE heritage_item SET
  site_code='SANXINGDUI', site_name='三星堆遗址',
  era_code='LATE_SHU', era_name='古蜀晚期',
  time_start_year=-1200, time_end_year=-1000,
  craft_codes='SEGMENT_CASTING,ASSEMBLY_CASTING',
  craft_names='分段铸造,嵌铸工艺',
  glb_url='/glbs/shenshu.glb',
  symbolic_meaning='通天神树，天地相通，神权祭祀'
WHERE id='HI-2025-006';

UPDATE heritage_item SET
  site_code='SANXINGDUI', site_name='三星堆遗址',
  era_code='LATE_SHU', era_name='古蜀晚期',
  time_start_year=-1200, time_end_year=-1000,
  craft_codes='BRONZE_CASTING,SURFACE_DECORATION',
  craft_names='青铜铸造,表面纹饰处理',
  glb_url='/glbs/zongmu.glb',
  symbolic_meaning='人神同形，祭祀通神，神灵面孔'
WHERE id='HI-2025-003';

UPDATE heritage_item SET
  site_code='SANXINGDUI', site_name='三星堆遗址',
  era_code='LATE_SHU', era_name='古蜀晚期',
  time_start_year=-1200, time_end_year=-1000,
  craft_codes='SEGMENT_CASTING,ASSEMBLY_CASTING',
  craft_names='分段铸造,嵌铸工艺',
  glb_url='/glbs/daliren.glb',
  symbolic_meaning='大祭司或国王，神权王权交织'
WHERE id='HI-2025-005';

UPDATE heritage_item SET
  site_code='SANXINGDUI', site_name='三星堆遗址',
  era_code='LATE_SHU', era_name='古蜀晚期',
  time_start_year=-1200, time_end_year=-1000,
  craft_codes='GOLD_HAMMERING,PATTERN_ENGRAVING',
  craft_names='金箔锤揲,纹饰刻画',
  glb_url='/glbs/黄金面具残片.glb',
  symbolic_meaning='王权象征，鱼鸟人头纹饰，权力标志'
WHERE id='HI-2025-004';

UPDATE heritage_item SET
  site_code='SANXINGDUI', site_name='三星堆遗址',
  era_code='LATE_SHU', era_name='古蜀晚期',
  time_start_year=-1200, time_end_year=-1000,
  craft_codes='GOLD_HAMMERING,MASK_SCULPTING',
  craft_names='金箔锤揲,面具塑形',
  glb_url='/glbs/黄金面具残片.glb',
  symbolic_meaning='王权神权象征，超越日常的身份宣示'
WHERE id='HI-2025-002';
```

### Step 2: Entity + Mapper — add 10 fields

File: `springboot/src/main/java/org/example/springboot/entity/HeritageItem.java`
- Add 10 fields with getters/setters (or use @Data if lombok):
  - siteCode, siteName, eraCode, eraName
  - timeStartYear (Integer), timeEndYear (Integer)
  - craftCodes, craftNames
  - glbUrl, symbolicMeaning

File: `springboot/src/main/resources/mapper/HeritageItemMapper.xml`
- Add the 10 columns to the base resultMap if it exists, or ensure MyBatis-Plus auto-maps them (field: site_code → siteCode).

If using MyBatis-Plus with default camelCase mapping and no custom XML resultMap, no XML change needed — just verify `map-underscore-to-camel-case: true` in application.yml (already set).

### Step 3: SpacetimeController — POST /api/spacetime/search

Create: `springboot/src/main/java/org/example/springboot/controller/SpacetimeController.java`

```java
package org.example.springboot.controller;

import org.example.springboot.common.Result;
import org.example.springboot.service.SpacetimeService;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/spacetime")
public class SpacetimeController {

    private final SpacetimeService spacetimeService;

    public SpacetimeController(SpacetimeService spacetimeService) {
        this.spacetimeService = spacetimeService;
    }

    @PostMapping("/search")
    public Result<Map<String, Object>> search(@RequestBody SpacetimeSearchRequest request) {
        return Result.success(spacetimeService.search(request));
    }
}
```

Create request DTO: `springboot/src/main/java/org/example/springboot/dto/SpacetimeSearchRequest.java`
```java
package org.example.springboot.dto;
import lombok.Data;

@Data
public class SpacetimeSearchRequest {
    private String eraCode;
    private String siteCode;
    private String craftCode;
}
```

### Step 4: SpacetimeService — query + assemble

Create: `springboot/src/main/java/org/example/springboot/service/SpacetimeService.java`

Logic:
1. Query heritage_item WHERE status=2 (published)
2. If eraCode != null → AND era_code = ?
3. If siteCode != null → AND site_code = ?
4. If craftCode != null → AND FIND_IN_SET(?, craft_codes)
5. Map each HeritageItem → ArtifactDTO (camelCase, arrays for craftCodes/craftNames/craftNamesZh, computed labels)
6. Compute stats: artifactCount = results.size(), readyModelCount = results.filter(glbUrl != null).count()
7. Return { artifacts: List<ArtifactDTO>, stats: {...} }

ArtifactDTO fields (all camelCase):
- entityId, displayTitle, category
- siteCode, siteName, siteNameZh
- eraCode, eraName, eraNameZh
- timeStartYear, timeEndYear
- yearLabel (formatted: "公元前1200 - 公元前1000")
- craftCodes (String[] split from craft_codes)
- craftNames (String[] split from craft_names)
- craftNamesZh (String[] — static mapping: SEGMENT_CASTING→分段铸造 etc.)
- craftLabel (joined with /)
- summary
- symbolicMeaning
- resolvedGlbUrl
- coverImage (query sys_file_info by business_type='HERITAGE_ITEM' and business_id=entityId, field='cover')
- modelStatus: glbUrl != null && !glbUrl.isEmpty() ? "ready" : "missing"
- isModelReady: modelStatus == "ready"

### Step 5: Verify backend

Start MySQL + springboot (8889).
Test with curl:
```
curl -X POST http://localhost:8889/api/spacetime/search \
  -H "Content-Type: application/json" \
  -d '{}'
```
Expect: 5 artifacts in response, stats.artifactCount=5.

Test with craftCode filter:
```
curl -X POST http://localhost:8889/api/spacetime/search \
  -H "Content-Type: application/json" \
  -d '{"craftCode":"SEGMENT_CASTING"}'
```
Expect: only artifacts with that craft.

### Step 6: SpacetimeApi.js (already exists — verify)

File: `vue3/src/api/SpacetimeApi.js` — grepped in imports, exists. If not, create it:
```js
import request from '@/utils/request'
export function searchSpacetimeArtifacts(params) {
  return request.post('/api/spacetime/search', params)
}
```

### Step 7: tanmi.vue — filter options from API stats

Current problem: filter dictionaries (siteOptions/eraOptions/craftOptions) loaded from local JSON seed. Fix:

In `loadFilterOptions()`, after the first API call, extract unique site/era/craft from returned artifacts or add a dedicated dictionary endpoint. Simplest approach for 5 items: hardcode the options since they won't change:

```js
// Replace loadFilterOptions() with static options (5 items won't vary)
siteOptions.value = [
  { value: 'SANXINGDUI', label: '三星堆遗址' }
]
eraOptions.value = [
  { value: 'LATE_SHU', label: '古蜀晚期', timeStartYear: -1200, timeEndYear: -1000 }
]
craftOptions.value = [
  { value: 'SEGMENT_CASTING', label: '分段铸造' },
  { value: 'ASSEMBLY_CASTING', label: '嵌铸工艺' },
  { value: 'BRONZE_CASTING', label: '青铜铸造' },
  { value: 'SURFACE_DECORATION', label: '表面纹饰处理' },
  { value: 'GOLD_HAMMERING', label: '金箔锤揲' },
  { value: 'PATTERN_ENGRAVING', label: '纹饰刻画' },
  { value: 'MASK_SCULPTING', label: '面具塑形' }
]
```

Remove the `await fetchCompetitionArtifacts()` call from loadFilterOptions.

### Step 8: 3ddemo.vue — already uses API

Verify file `vue3/src/views/3ddemo.vue` reads from `searchSpacetimeArtifacts`. If still on local JSON, switch imports from `@/data/competitionArtifacts` to `@/api/SpacetimeApi`.

### Step 9: Graph API — GET /api/graph/artifacts/{entityId}

Add to SpacetimeController:
```java
@GetMapping("/graph/artifacts/{entityId}")
public Result<Map<String, Object>> getArtifactGraph(@PathVariable String entityId) {
    return Result.success(spacetimeService.buildGraph(entityId));
}
```

Add to SpacetimeService:
```java
public Map<String, Object> buildGraph(String entityId) {
    HeritageItem item = heritageItemMapper.selectById(entityId);
    if (item == null) return Map.of("nodes", List.of(), "edges", List.of());

    List<Map<String, String>> nodes = new ArrayList<>();
    List<Map<String, String>> edges = new ArrayList<>();

    String artId = "artifact:" + entityId;
    nodes.add(node(artId, "artifact", item.getTitle(), entityId));

    if (item.getSiteCode() != null) {
        String siteId = "site:" + item.getSiteCode();
        nodes.add(node(siteId, "site", item.getSiteName()));
        edges.add(edge(artId, siteId, "出土地"));
    }
    if (item.getEraCode() != null) {
        String eraId = "era:" + item.getEraCode();
        nodes.add(node(eraId, "era", item.getEraName()));
        edges.add(edge(artId, eraId, "所属时代"));
    }
    if (item.getCraftCodes() != null) {
        String[] codes = item.getCraftCodes().split(",");
        String[] names = item.getCraftNames() != null ? item.getCraftNames().split(",") : codes;
        for (int i = 0; i < codes.length; i++) {
            String craftId = "craft:" + codes[i].trim();
            nodes.add(node(craftId, "craft", names.length > i ? names[i].trim() : codes[i].trim()));
            edges.add(edge(artId, craftId, "采用工艺"));
        }
    }
    if (item.getSymbolicMeaning() != null) {
        String meaningId = "meaning:" + entityId;
        nodes.add(node(meaningId, "meaning", item.getSymbolicMeaning()));
        edges.add(edge(artId, meaningId, "象征寓意"));
    }

    return Map.of("nodes", nodes, "edges", edges);
}

private Map<String, String> node(String id, String type, String label) {
    Map<String, String> n = new java.util.HashMap<>();
    n.put("id", id); n.put("type", type); n.put("label", label);
    return n;
}
private Map<String, String> node(String id, String type, String label, String entityId) {
    Map<String, String> n = node(id, type, label);
    n.put("entityId", entityId);
    return n;
}
private Map<String, String> edge(String source, String target, String label) {
    Map<String, String> e = new java.util.HashMap<>();
    e.put("source", source); e.put("target", target); e.put("label", label);
    return e;
}
```

### Step 10: Three3dDemo.vue — graph panel → ECharts

File: `vue3/src/views/Three3dDemo.vue`

Current: SVG hardcoded graph in template. Replace with ECharts `graph` type.

1. `npm install echarts --save` in vue3 dir (if not already)
2. In Three3dDemo.vue script setup, add:
```js
import * as echarts from 'echarts'
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'

const graphRef = ref(null)
let chartInstance = null

async function loadGraph(entityId) {
  const resp = await fetch(`/api/spacetime/graph/artifacts/${entityId}`)
  const json = await resp.json()
  const data = json.data || json

  if (!chartInstance) {
    chartInstance = echarts.init(graphRef.value)
  }

  chartInstance.setOption({
    tooltip: {},
    series: [{
      type: 'graph',
      layout: 'force',
      data: data.nodes.map(n => ({
        id: n.id, name: n.label,
        category: ['artifact','site','era','craft','meaning'].indexOf(n.type),
        symbolSize: n.type === 'artifact' ? 48 : 32,
        itemStyle: { color: ['#42664f','#b89243','#60756c','#d4a574','#8b6914'][['artifact','site','era','craft','meaning'].indexOf(n.type)] }
      })),
      links: data.edges.map(e => ({ source: e.source, target: e.target, label: { show: true, formatter: e.label } })),
      categories: ['文物','遗址','时代','工艺','寓意'].map(name => ({ name })),
      roam: true,
      label: { show: true, fontSize: 13 },
      force: { repulsion: 200, edgeLength: 120 }
    }]
  })
}

// Watch entityId from route query
watch(() => route.query.entityId, (id) => { if (id) loadGraph(id) })
onMounted(() => { if (route.query.entityId) loadGraph(route.query.entityId) })
onBeforeUnmount(() => { chartInstance?.dispose() })
```

3. In template, replace SVG graph block with: `<div ref="graphRef" style="width:100%;height:400px"></div>`

### Step 11: Narrative glue — one sentence per page transition

- **tanmi.vue** hero-copy: before "时空漫游" kicker, add a sentence that reads context from route params if coming from Home, otherwise show a default narrative:
  ```
  "从三星堆遗址出发，沿时间、空间、工艺三条线索，找到你感兴趣的文物。"
  ```
  (Already partially there — just verify the subtitle reads as narrative, not instruction manual.)

- **3ddemo.vue**: add a banner at top: `当前筛选：时代-X | 遗址-X | 工艺-X，命中 N 件文物`

- **Three3dDemo.vue**: add context line above the model: `你正在查看 {title}（{entityId}），出土于 {siteName}，年代 {eraName}`

- **AiChat.vue**: if entityId context is loaded, the first system message should reference what the user just viewed. This already partially works via `buildRagPrompt` context parameter.

### Step 12: Remove dead code

After verifying all above works:
- Delete `vue3/src/components/Live2DAvatar.vue` methods: `initWS`, `handleMessage`, data fields `ws`, `wsReconnectTimer`, `currentAnswer`
- Delete `vue3/src/store/` websocket references if any
- Keep `chatReplyConfig.js` as fallback (still used for greetings)

### Verification checklist

1. `curl localhost:8889/api/spacetime/search -d '{}'` → 5 artifacts
2. `curl localhost:8889/api/spacetime/search -d '{"siteCode":"SANXINGDUI"}'` → 5 artifacts (all same site)
3. `curl localhost:8889/api/spacetime/search -d '{"craftCode":"SEGMENT_CASTING"}'` → subset with that craft
4. `curl localhost:8889/api/spacetime/graph/artifacts/HI-2025-006` → nodes count ≥ 5, edges count ≥ 4
5. Open browser: Home → 进入展陈漫游 → tanmi page loads with 5 artifacts from API
6. Select era filter → result grid refreshes without page reload
7. Click artifact → 3D page loads with model + ECharts graph
8. Click AI 解读 → AiChat shows context banner + RAG answers
9. 玄喵 popup: ask "青铜神树有什么特点" → RAG answer with knowledge+streaming+voice
