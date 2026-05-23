# 课程难度等级配置使用指南

## 快速开始

### 1. 导入配置

```javascript
import { 
  COURSE_LEVEL,              // 枚举常量
  COURSE_LEVEL_OPTIONS,      // 下拉选项列表
  getCourseLevelName,        // 获取中文名称
  getCourseLevelColor        // 获取标签颜色
} from '@/config/courseLevel'
```

### 2. 常见用法

#### 下拉选择框

```vue
<template>
  <a-select v-model:value="form.level">
    <a-select-option
      v-for="option in COURSE_LEVEL_OPTIONS"
      :key="option.value"
      :value="option.value"
    >
      {{ option.label }}
    </a-select-option>
  </a-select>
</template>

<script setup>
import { COURSE_LEVEL_OPTIONS } from '@/config/courseLevel'
import { reactive } from 'vue'

const form = reactive({
  level: 'beginner' // 使用英文code
})
</script>
```

#### 显示难度标签

```vue
<template>
  <a-tag :color="getCourseLevelColor(course.level)">
    {{ getCourseLevelName(course.level) }}
  </a-tag>
</template>

<script setup>
import { getCourseLevelName, getCourseLevelColor } from '@/config/courseLevel'

const course = {
  level: 'beginner' // 从API获取的英文code
}
</script>
```

#### 显示中文名称

```vue
<template>
  <div>难度：{{ getCourseLevelName(course.level) }}</div>
</template>

<script setup>
import { getCourseLevelName } from '@/config/courseLevel'
</script>
```

## 数据标准

| 中文 | 英文Code | 数字等级 | 标签颜色 |
|-----|---------|---------|---------|
| 入门 | beginner | 1 | green |
| 初级 | elementary | 2 | blue |
| 中级 | intermediate | 3 | orange |
| 高级 | advanced | 4 | red |

## 重要提示

✅ **正确做法**：
- 数据存储使用英文code（beginner, elementary, intermediate, advanced）
- 显示给用户时使用 `getCourseLevelName()` 转换为中文
- 使用常量 `COURSE_LEVEL.BEGINNER` 而不是硬编码字符串

❌ **错误做法**：
- 不要硬编码中文 `'入门'`
- 不要直接显示英文code `course.level`
- 不要手动写颜色映射

## API示例

```javascript
// 获取中文名称
getCourseLevelName('beginner')  // 返回: '入门'
getCourseLevelName('advanced')  // 返回: '高级'

// 获取标签颜色
getCourseLevelColor('beginner')     // 返回: 'green'
getCourseLevelColor('intermediate') // 返回: 'orange'

// 获取英文code
getCourseLevelCode('入门')  // 返回: 'beginner'
getCourseLevelCode('高级')  // 返回: 'advanced'

// 比较难度
compareLevel('beginner', 'advanced')  // 返回: -1 (beginner < advanced)
compareLevel('advanced', 'beginner')  // 返回: 1  (advanced > beginner)
compareLevel('beginner', 'beginner')  // 返回: 0  (相等)
```

## 完整示例

```vue
<template>
  <div class="course-form">
    <!-- 表单选择 -->
    <a-form-item label="课程难度">
      <a-select v-model:value="form.level">
        <a-select-option
          v-for="opt in COURSE_LEVEL_OPTIONS"
          :key="opt.value"
          :value="opt.value"
        >
          {{ opt.label }}
        </a-select-option>
      </a-select>
    </a-form-item>

    <!-- 显示当前选择 -->
    <div class="preview">
      当前难度：
      <a-tag :color="getCourseLevelColor(form.level)">
        {{ getCourseLevelName(form.level) }}
      </a-tag>
    </div>

    <!-- 难度筛选 -->
    <a-radio-group v-model:value="filter.level">
      <a-radio value="">全部</a-radio>
      <a-radio
        v-for="opt in COURSE_LEVEL_OPTIONS"
        :key="opt.value"
        :value="opt.value"
      >
        {{ opt.label }}
      </a-radio>
    </a-radio-group>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import {
  COURSE_LEVEL_OPTIONS,
  getCourseLevelName,
  getCourseLevelColor
} from '@/config/courseLevel'

const form = reactive({
  level: 'beginner'
})

const filter = reactive({
  level: ''
})
</script>
```

## 相关文件

- **配置文件**：`vue3/src/config/courseLevel.js`
- **后端枚举**：`springboot/src/main/java/org/example/springboot/enums/CourseLevel.java`
- **完整文档**：`springboot/docs/COURSE_LEVEL_UNIFICATION_SUMMARY.md`

