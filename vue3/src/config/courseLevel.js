/**
 * 课程难度等级配置
 * 统一前后端、数据库的课程难度等级枚举
 */

// 课程难度等级枚举
export const COURSE_LEVEL = {
  BEGINNER: 'beginner',      // 入门
  ELEMENTARY: 'elementary',  // 初级
  INTERMEDIATE: 'intermediate', // 中级
  ADVANCED: 'advanced'       // 高级
}

// 课程难度等级映射（code -> 中文名称）
export const COURSE_LEVEL_MAP = {
  [COURSE_LEVEL.BEGINNER]: '入门',
  [COURSE_LEVEL.ELEMENTARY]: '初级',
  [COURSE_LEVEL.INTERMEDIATE]: '中级',
  [COURSE_LEVEL.ADVANCED]: '高级'
}

// 课程难度等级反向映射（中文名称 -> code）
export const COURSE_LEVEL_REVERSE_MAP = {
  '入门': COURSE_LEVEL.BEGINNER,
  '初级': COURSE_LEVEL.ELEMENTARY,
  '中级': COURSE_LEVEL.INTERMEDIATE,
  '高级': COURSE_LEVEL.ADVANCED
}

// 课程难度等级列表（用于下拉选择）
export const COURSE_LEVEL_OPTIONS = [
  { value: COURSE_LEVEL.BEGINNER, label: '入门', level: 1 },
  { value: COURSE_LEVEL.ELEMENTARY, label: '初级', level: 2 },
  { value: COURSE_LEVEL.INTERMEDIATE, label: '中级', level: 3 },
  { value: COURSE_LEVEL.ADVANCED, label: '高级', level: 4 }
]

// 课程难度等级标签颜色
export const COURSE_LEVEL_COLOR_MAP = {
  [COURSE_LEVEL.BEGINNER]: 'green',
  [COURSE_LEVEL.ELEMENTARY]: 'blue',
  [COURSE_LEVEL.INTERMEDIATE]: 'orange',
  [COURSE_LEVEL.ADVANCED]: 'red'
}

/**
 * 获取课程难度等级的中文名称
 * @param {string} code - 课程难度等级code
 * @returns {string} 中文名称
 */
export function getCourseLevelName(code) {
  return COURSE_LEVEL_MAP[code] || code || '未知'
}

/**
 * 获取课程难度等级的code
 * @param {string} name - 中文名称
 * @returns {string} code
 */
export function getCourseLevelCode(name) {
  return COURSE_LEVEL_REVERSE_MAP[name] || name
}

/**
 * 获取课程难度等级的标签颜色
 * @param {string} code - 课程难度等级code
 * @returns {string} 颜色
 */
export function getCourseLevelColor(code) {
  return COURSE_LEVEL_COLOR_MAP[code] || 'default'
}

/**
 * 比较两个难度等级
 * @param {string} code1 - 难度等级code1
 * @param {string} code2 - 难度等级code2
 * @returns {number} 1表示code1更高，-1表示code1更低，0表示相同
 */
export function compareLevel(code1, code2) {
  const level1 = COURSE_LEVEL_OPTIONS.find(opt => opt.value === code1)?.level || 0
  const level2 = COURSE_LEVEL_OPTIONS.find(opt => opt.value === code2)?.level || 0
  
  if (level1 > level2) return 1
  if (level1 < level2) return -1
  return 0
}

