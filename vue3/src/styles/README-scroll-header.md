# 卷轴头部样式使用指南

## 📜 简介

`scroll-header.css` 提供了一套传统中国卷轴展开效果的页面头部样式，适用于非遗传承等文化类网站。

## 🎨 效果特点

- **左右轴杆**：40px 宽的立体木质轴杆
- **上下卷轴边缘**：浅棕色横条模拟卷轴边缘
- **宣纸质感**：中间区域为宣纸白背景
- **内阴影**：模拟纸张卷曲的阴影效果
- **印章装饰**：朱砂红印章，支持自定义文字
- **宋体标题**：大字号宋体标题配装饰线
- **完全响应式**：适配各种屏幕尺寸

## 📝 使用方法

### 1. 引入样式文件

```javascript
import '@/styles/scroll-header.css'
```

### 2. HTML 结构

```html
<div class="scroll-header">
  <div class="scroll-header-content">
    <h1 class="scroll-header-title">页面标题</h1>
    <p class="scroll-header-subtitle">副标题或描述文字</p>
    <div class="scroll-header-seal">印章</div>
  </div>
  
  <!-- 可选：添加其他内容，如搜索框 -->
  <div class="search-bar">
    <!-- 搜索框内容 -->
  </div>
</div>
```

### 3. 完整示例

```vue
<template>
  <div class="page">
    <div class="scroll-header">
      <div class="scroll-header-content">
        <h1 class="scroll-header-title">非遗作品</h1>
        <p class="scroll-header-subtitle">探索中华非物质文化遗产的魅力</p>
        <div class="scroll-header-seal">非遗</div>
      </div>
    </div>
    
    <!-- 页面其他内容 -->
  </div>
</template>

<script setup>
import '@/styles/scroll-header.css'
</script>
```

## 🎯 CSS 类说明

| 类名 | 说明 |
|------|------|
| `.scroll-header` | 卷轴头部容器（必需） |
| `.scroll-header-content` | 内容容器（必需） |
| `.scroll-header-title` | 主标题（推荐） |
| `.scroll-header-subtitle` | 副标题（可选） |
| `.scroll-header-seal` | 印章装饰（可选） |

## 🎨 自定义

### 修改印章文字

```html
<div class="scroll-header-seal">传承</div>
```

### 隐藏印章

不添加 `.scroll-header-seal` 元素即可。

### 调整颜色

可以在页面级样式中覆盖 CSS 变量：

```css
.scroll-header {
  --seal-color: #c8332b; /* 印章颜色 */
  --wood-color: #8b4513; /* 轴杆颜色 */
}
```

## 📱 响应式断点

- **768px**: 平板尺寸，轴杆变窄
- **600px**: 小屏幕，进一步缩小
- **480px**: 手机尺寸，最小化装饰元素

## 💡 使用建议

1. **字数限制**：标题建议 2-8 个字，保持美观
2. **印章内容**：建议 2-4 个字的竖排文字
3. **搭配使用**：配合宣纸白背景（#faf8f3）效果更佳
4. **字体**：确保系统支持宋体字体

## 📦 已应用页面

- `/heritage` - 非遗作品列表页
- `/inheritor` - 非遗传承人列表页
- `/course` - 在线课程列表页
- `/activity` - 活动中心列表页
- `/shop` - 非遗手办商城列表页

## 🎨 各页面印章文字

- 非遗作品：`非遗`
- 传承人：`传承`
- 课程：`课程`
- 活动：`活动`
- 商城：`商城`

## 🔧 维护说明

修改样式时请在 `vue3/src/styles/scroll-header.css` 文件中进行，修改后会自动应用到所有引用的页面。

## 📝 统一样式规范

所有应用了卷轴头部的页面遵循以下统一规范：

### 色彩方案
- 背景色：`#faf8f3` (宣纸白)
- 主色调：`#8b4513` (传统棕色/金箔黄)
- 文字色：`#2c2c2c` (墨黑色)
- 边框色：`#e8e8e8` (浅灰)

### 布局规范
- 最大宽度：`1200px`
- 内容居中：`margin: 0 auto`
- 水平内边距：`40px` (移动端 `20px`)

### 组件样式
- 卡片：使用 `1px solid #e8e8e8` 边框，无圆角，无阴影
- 卡片悬停：`border-color: #8b4513`，`translateY(-2px)`
- 按钮主色：`background: #8b4513`
- 字体：标题使用宋体 `'SimSun', '宋体', serif`
- 字间距：标题 `letter-spacing: 2px` 以上

