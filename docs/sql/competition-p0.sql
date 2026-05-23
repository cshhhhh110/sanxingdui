ALTER TABLE heritage_item ADD COLUMN site_code VARCHAR(50) NULL;
ALTER TABLE heritage_item ADD COLUMN site_name VARCHAR(50) NULL;
ALTER TABLE heritage_item ADD COLUMN era_code VARCHAR(50) NULL;
ALTER TABLE heritage_item ADD COLUMN era_name VARCHAR(50) NULL;
ALTER TABLE heritage_item ADD COLUMN time_start_year INT NULL;
ALTER TABLE heritage_item ADD COLUMN time_end_year INT NULL;
ALTER TABLE heritage_item ADD COLUMN craft_codes VARCHAR(255) NULL;
ALTER TABLE heritage_item ADD COLUMN craft_names VARCHAR(255) NULL;
ALTER TABLE heritage_item ADD COLUMN glb_url VARCHAR(500) NULL;
ALTER TABLE heritage_item ADD COLUMN symbolic_meaning VARCHAR(500) NULL;

UPDATE heritage_item
SET
    site_code = 'SANXINGDUI',
    site_name = '三星堆遗址',
    era_code = 'LATE_SHU',
    era_name = '古蜀晚期',
    time_start_year = -1200,
    time_end_year = -1000,
    craft_codes = 'SEGMENT_CASTING,ASSEMBLY_CASTING,RIVETING',
    craft_names = '分段铸造,嵌铸工艺,铆接工艺',
    glb_url = '/glbs/纵目面具.glb',
    symbolic_meaning = '通天神树,天地相通,神权祭祀,宇宙观象征'
WHERE id = 'HI-2025-006';

UPDATE heritage_item
SET
    site_code = 'SANXINGDUI',
    site_name = '三星堆遗址',
    era_code = 'LATE_SHU',
    era_name = '古蜀晚期',
    time_start_year = -1200,
    time_end_year = -1000,
    craft_codes = 'BRONZE_CASTING,SURFACE_DECORATION',
    craft_names = '青铜铸造,表面纹饰处理',
    glb_url = '/glbs/青铜大立人像.glb',
    symbolic_meaning = '祖先神崇拜,纵目神像,神权威慑,祭祀重器'
WHERE id = 'HI-2025-003';

UPDATE heritage_item
SET
    site_code = 'SANXINGDUI',
    site_name = '三星堆遗址',
    era_code = 'LATE_SHU',
    era_name = '古蜀晚期',
    time_start_year = -1200,
    time_end_year = -1000,
    craft_codes = 'SEGMENT_CASTING,ASSEMBLY_CASTING',
    craft_names = '分段浇铸,嵌铸工艺',
    glb_url = '/glbs/青铜神树.glb',
    symbolic_meaning = '王权与神权合一,大祭司形象,最高权威象征'
WHERE id = 'HI-2025-005';

UPDATE heritage_item
SET
    site_code = 'SANXINGDUI',
    site_name = '三星堆遗址',
    era_code = 'LATE_SHU',
    era_name = '古蜀晚期',
    time_start_year = -1200,
    time_end_year = -1000,
    craft_codes = 'GOLD_HAMMERING,PATTERN_ENGRAVING',
    craft_names = '金箔锤揲,纹饰刻画',
    glb_url = '/glbs/三星堆金杖.glb',
    symbolic_meaning = '王权权杖,通神法器,鱼凫王朝象征'
WHERE id = 'HI-2025-004';

UPDATE heritage_item
SET
    site_code = 'SANXINGDUI',
    site_name = '三星堆遗址',
    era_code = 'LATE_SHU',
    era_name = '古蜀晚期',
    time_start_year = -1200,
    time_end_year = -1000,
    craft_codes = 'GOLD_HAMMERING,MASK_FORMING',
    craft_names = '锤揲成型,面具塑形',
    glb_url = '/glbs/黄金面具残片.glb',
    symbolic_meaning = '神性,高等级身份,黄金崇拜,不朽象征'
WHERE id = 'HI-2025-002';
