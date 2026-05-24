// Sanxingdui competition graph seed for Neo4j.
// Run after starting Neo4j, then set graph.neo4j.enabled=true in application.yml.

CREATE CONSTRAINT artifact_entity_id IF NOT EXISTS
FOR (n:Artifact) REQUIRE n.entityId IS UNIQUE;

CREATE CONSTRAINT graph_node_id IF NOT EXISTS
FOR (n:GraphNode) REQUIRE n.id IS UNIQUE;

MERGE (site:Site:GraphNode {id: 'site:SANXINGDUI'})
SET site.type = 'site',
    site.label = '三星堆遗址',
    site.summary = '四川广汉的古蜀文明核心遗址，是理解青铜器、祭祀坑与古蜀权力结构的重要现场。',
    site.importance = 82,
    site.expandable = true,
    site.routeType = 'site',
    site.routeTarget = 'SANXINGDUI';

MERGE (era:Era:GraphNode {id: 'era:LATE_SHU'})
SET era.type = 'era',
    era.label = '古蜀晚期',
    era.summary = '三星堆核心展品共同指向的古蜀文明重要阶段。',
    era.importance = 78,
    era.expandable = true,
    era.routeType = 'era',
    era.routeTarget = 'LATE_SHU';

UNWIND [
  ['SEGMENT_CASTING', '分段铸造', '把大型复杂青铜器拆分成多个构件分别铸造，再进行组合。'],
  ['ASSEMBLY_CASTING', '嵌铸工艺', '用于处理复杂造型与组合结构的青铜器工艺。'],
  ['RIVETING', '铆接工艺', '通过连接件让分体构件稳定组合。'],
  ['BRONZE_CASTING', '青铜铸造', '三星堆青铜器群的核心工艺基础。'],
  ['SURFACE_DECORATION', '表面纹饰处理', '通过纹饰强化器物的神圣感与识别度。'],
  ['GOLD_HAMMERING', '金箔锤揲', '将黄金材料敲击延展成薄片并塑形。'],
  ['PATTERN_ENGRAVING', '纹饰刻画', '在金器或器表上刻画纹样与符号。'],
  ['MASK_FORMING', '面具塑形', '通过面部造型表达身份、神性与仪式感。'],
  ['JADE_CARVING', '玉石琢磨', '利用切割、琢磨与修整形成礼器轮廓。'],
  ['LINE_ENGRAVING', '线刻叙事', '以细线刻画山川、人物与祭祀场景。'],
  ['SURFACE_POLISHING', '通体抛光', '通过细致打磨强化玉质光泽与礼器质感。']
] AS row
MERGE (craft:Craft:GraphNode {id: 'craft:' + row[0]})
SET craft.type = 'craft',
    craft.label = row[1],
    craft.summary = row[2],
    craft.importance = 72,
    craft.expandable = true,
    craft.routeType = 'craft',
    craft.routeTarget = row[0];

UNWIND [
  ['BRONZE', '青铜', '三星堆大型礼器与神像系统的核心材质，适合复杂铸造与组合。'],
  ['GOLD', '黄金', '用于突出神性、权力和不朽意味的高等级材质。'],
  ['JADE', '玉石', '礼制与祭祀语境中具有洁净、通神和身份标识意味的材质。'],
  ['WOOD_CORE', '木芯遗痕', '金杖原有木质芯体已朽，仅余金皮，提示复合材质结构。']
] AS row
MERGE (material:Material:GraphNode {id: 'material:' + row[0]})
SET material.type = 'material',
    material.label = row[1],
    material.summary = row[2],
    material.importance = 66,
    material.expandable = true,
    material.routeType = 'material',
    material.routeTarget = row[0];

UNWIND [
  ['太阳崇拜', '太阳、神鸟与天空秩序相关的观念线索。'],
  ['通天意象', '连接天地、人神与祭祀秩序的空间想象。'],
  ['神权象征', '通过神像、面具和礼器呈现权威与神圣身份。'],
  ['王权标识', '通过黄金、权杖或高等级器物表达权力秩序。'],
  ['身份转化', '面具覆盖使人的身份转向神、王或祭司角色。'],
  ['山川祭祀', '以山、陵、祭台和人物构成古蜀祭祀秩序的视觉叙事。']
] AS row
MERGE (symbol:Symbol:GraphNode {id: 'symbol:' + row[0]})
SET symbol.type = 'meaning',
    symbol.label = row[0],
    symbol.summary = row[1],
    symbol.importance = 68,
    symbol.expandable = true,
    symbol.routeType = 'meaning',
    symbol.routeTarget = row[0];

UNWIND [
  ['BIRD', '神鸟', '神鸟常与太阳、天界和祭祀沟通相关，是三星堆纹饰的重要母题。'],
  ['SUN', '太阳纹', '太阳母题指向天体崇拜和时间秩序。'],
  ['MASK_FACE', '面具化面容', '通过夸张五官或覆面形态塑造神秘身份。'],
  ['PROTRUDING_EYES', '纵目', '凸出的眼部强化超常视觉和祖先神叙事。'],
  ['FISH_BIRD_ARROW', '鱼鸟箭纹', '金杖纹饰中常被解释为权力、族属或神话叙事线索。'],
  ['MOUNTAIN_RITUAL', '山川祭祀图', '以山川、人物和礼器构成连续祭祀画面。'],
  ['DRAGON_TREE', '盘龙神树', '龙与树共同构成天地贯通的空间想象。'],
  ['STANDING_POSTURE', '立人姿态', '正立、双手环握等姿态强化仪式主持者形象。']
] AS row
MERGE (motif:Motif:GraphNode {id: 'motif:' + row[0]})
SET motif.type = 'motif',
    motif.label = row[1],
    motif.summary = row[2],
    motif.importance = 64,
    motif.expandable = true,
    motif.routeType = 'motif',
    motif.routeTarget = row[0];

UNWIND [
  ['COMMUNICATION_WITH_DEITIES', '通神祭祀', '器物被置入人与神、祖先和天界沟通的仪式语境。'],
  ['ANCESTOR_WORSHIP', '祖先神崇拜', '通过神像、面具或祖先形象强化族群记忆与权威来源。'],
  ['ROYAL_RITUAL', '王权礼仪', '以高等级材料和权杖、神像等形制表达权力秩序。'],
  ['MOUNTAIN_OFFERING', '山川祭祀', '围绕山川、祭台和礼器展开的祭祀场景。'],
  ['COSMIC_ORDER', '宇宙秩序', '通过神树、太阳、神鸟等元素表达天地层级和运行秩序。']
] AS row
MERGE (ritual:Ritual:GraphNode {id: 'ritual:' + row[0]})
SET ritual.type = 'ritual',
    ritual.label = row[1],
    ritual.summary = row[2],
    ritual.importance = 70,
    ritual.expandable = true,
    ritual.routeType = 'ritual',
    ritual.routeTarget = row[0];

UNWIND [
  {
    id: 'HI-2025-006',
    label: '青铜神树',
    summary: '以树身、枝条、神鸟与盘龙构成通天意象，是三星堆最具标志性的青铜礼器之一。',
    image: '',
    crafts: ['SEGMENT_CASTING', 'ASSEMBLY_CASTING', 'RIVETING', 'BRONZE_CASTING'],
    materials: ['BRONZE'],
    symbols: ['太阳崇拜', '通天意象'],
    motifs: ['BIRD', 'SUN', 'DRAGON_TREE'],
    rituals: ['COSMIC_ORDER', 'COMMUNICATION_WITH_DEITIES']
  },
  {
    id: 'HI-2025-003',
    label: '青铜纵目面具',
    summary: '以夸张眼部和外展耳部制造超常视觉，常被放入古蜀宗教、祖先神与神权语境理解。',
    image: '',
    crafts: ['BRONZE_CASTING', 'SURFACE_DECORATION', 'MASK_FORMING'],
    materials: ['BRONZE'],
    symbols: ['神权象征', '身份转化'],
    motifs: ['MASK_FACE', 'PROTRUDING_EYES'],
    rituals: ['ANCESTOR_WORSHIP', 'COMMUNICATION_WITH_DEITIES']
  },
  {
    id: 'HI-2025-005',
    label: '青铜大立人像',
    summary: '通过挺立身姿与仪式化姿态表达高等级人物、祭司或权力形象。',
    image: '',
    crafts: ['BRONZE_CASTING', 'ASSEMBLY_CASTING', 'SURFACE_DECORATION'],
    materials: ['BRONZE'],
    symbols: ['神权象征', '王权标识'],
    motifs: ['STANDING_POSTURE'],
    rituals: ['ROYAL_RITUAL', 'COMMUNICATION_WITH_DEITIES']
  },
  {
    id: 'HI-2025-004',
    label: '三星堆金杖',
    summary: '以黄金材质和鱼鸟箭纹表达权力、身份与礼仪秩序。',
    image: '',
    crafts: ['GOLD_HAMMERING', 'PATTERN_ENGRAVING'],
    materials: ['GOLD', 'WOOD_CORE'],
    symbols: ['王权标识'],
    motifs: ['FISH_BIRD_ARROW', 'BIRD'],
    rituals: ['ROYAL_RITUAL']
  },
  {
    id: 'HI-2025-002',
    label: '黄金面具',
    summary: '通过黄金锤揲与面具造型显现神性、身份转化与仪式感。',
    image: '',
    crafts: ['GOLD_HAMMERING', 'MASK_FORMING'],
    materials: ['GOLD'],
    symbols: ['神权象征', '身份转化'],
    motifs: ['MASK_FACE'],
    rituals: ['ANCESTOR_WORSHIP', 'COMMUNICATION_WITH_DEITIES']
  },
  {
    id: 'HI-2025-001',
    label: '祭山图玉边璋',
    summary: '以玉质礼器承载山川、人物和祭台线刻叙事，是理解古蜀山川祭祀的重要物证。',
    image: '',
    crafts: ['JADE_CARVING', 'LINE_ENGRAVING', 'SURFACE_POLISHING'],
    materials: ['JADE'],
    symbols: ['山川祭祀', '神权象征'],
    motifs: ['MOUNTAIN_RITUAL'],
    rituals: ['MOUNTAIN_OFFERING', 'COMMUNICATION_WITH_DEITIES']
  }
] AS item
MERGE (artifact:Artifact:GraphNode {entityId: item.id})
SET artifact.id = 'artifact:' + item.id,
    artifact.type = 'artifact',
    artifact.label = item.label,
    artifact.summary = item.summary,
    artifact.image = item.image,
    artifact.importance = 100,
    artifact.expandable = true,
    artifact.routeType = 'artifact',
    artifact.routeTarget = item.id
WITH artifact, item
MATCH (site:Site {id: 'site:SANXINGDUI'})
MATCH (era:Era {id: 'era:LATE_SHU'})
MERGE (artifact)-[:FOUND_AT {label: '出土地', weight: 2, category: 'origin'}]->(site)
MERGE (artifact)-[:BELONGS_TO_ERA {label: '所属时代', weight: 2, category: 'time'}]->(era)
WITH artifact, item
UNWIND item.crafts AS craftCode
MATCH (craft:Craft {id: 'craft:' + craftCode})
MERGE (artifact)-[:USES_CRAFT {label: '采用工艺', weight: 1, category: 'craft'}]->(craft)
WITH artifact, item
UNWIND item.materials AS materialCode
MATCH (material:Material {id: 'material:' + materialCode})
MERGE (artifact)-[:MADE_OF {label: '主要材质', weight: 1, category: 'material'}]->(material)
WITH artifact, item
UNWIND item.symbols AS symbolName
MATCH (symbol:Symbol {id: 'symbol:' + symbolName})
MERGE (artifact)-[:SYMBOLIZES {label: '象征寓意', weight: 1, category: 'meaning'}]->(symbol)
WITH artifact, item
UNWIND item.motifs AS motifCode
MATCH (motif:Motif {id: 'motif:' + motifCode})
MERGE (artifact)-[:HAS_MOTIF {label: '纹饰母题', weight: 1, category: 'motif'}]->(motif)
WITH artifact, item
UNWIND item.rituals AS ritualCode
MATCH (ritual:Ritual {id: 'ritual:' + ritualCode})
MERGE (artifact)-[:USED_IN_RITUAL {label: '仪式语境', weight: 1, category: 'ritual'}]->(ritual);
