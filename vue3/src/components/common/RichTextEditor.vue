<template>
  <div class="rich-text-editor">
    <div ref="editorRef" class="editor-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { message } from 'ant-design-vue';

// Props
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: '请输入内容...'
  },
  height: {
    type: String,
    default: '400px'
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

// Emits
const emit = defineEmits(['update:modelValue', 'change']);

// Refs
const editorRef = ref(null);
let editorInstance = null;

// 简单的富文本编辑器实现（使用contenteditable）
const initEditor = () => {
  if (!editorRef.value) return;

  // 创建工具栏
  const toolbar = document.createElement('div');
  toolbar.className = 'editor-toolbar';
  toolbar.innerHTML = `
    <button type="button" data-command="bold" title="粗体">
      <i class="fas fa-bold"></i>
    </button>
    <button type="button" data-command="italic" title="斜体">
      <i class="fas fa-italic"></i>
    </button>
    <button type="button" data-command="underline" title="下划线">
      <i class="fas fa-underline"></i>
    </button>
    <span class="toolbar-separator"></span>
    <button type="button" data-command="formatBlock" data-value="h1" title="标题1">
      H1
    </button>
    <button type="button" data-command="formatBlock" data-value="h2" title="标题2">
      H2
    </button>
    <button type="button" data-command="formatBlock" data-value="h3" title="标题3">
      H3
    </button>
    <button type="button" data-command="formatBlock" data-value="p" title="段落">
      P
    </button>
    <span class="toolbar-separator"></span>
    <button type="button" data-command="insertUnorderedList" title="无序列表">
      <i class="fas fa-list-ul"></i>
    </button>
    <button type="button" data-command="insertOrderedList" title="有序列表">
      <i class="fas fa-list-ol"></i>
    </button>
    <span class="toolbar-separator"></span>
    <button type="button" data-command="justifyLeft" title="左对齐">
      <i class="fas fa-align-left"></i>
    </button>
    <button type="button" data-command="justifyCenter" title="居中">
      <i class="fas fa-align-center"></i>
    </button>
    <button type="button" data-command="justifyRight" title="右对齐">
      <i class="fas fa-align-right"></i>
    </button>
    <span class="toolbar-separator"></span>
    <button type="button" data-command="removeFormat" title="清除格式">
      <i class="fas fa-eraser"></i>
    </button>
  `;

  // 创建编辑区域
  const content = document.createElement('div');
  content.className = 'editor-content';
  content.contentEditable = !props.disabled;
  content.innerHTML = props.modelValue || '';
  content.style.minHeight = props.height;

  // 清空容器并添加工具栏和编辑区
  editorRef.value.innerHTML = '';
  editorRef.value.appendChild(toolbar);
  editorRef.value.appendChild(content);

  // 工具栏按钮事件
  toolbar.addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (!button) return;

    e.preventDefault();
    const command = button.dataset.command;
    const value = button.dataset.value;

    if (command === 'formatBlock') {
      document.execCommand(command, false, value);
    } else {
      document.execCommand(command, false, null);
    }

    content.focus();
  });

  // 内容变化事件
  content.addEventListener('input', () => {
    const html = content.innerHTML;
    emit('update:modelValue', html);
    emit('change', html);
  });

  // 粘贴事件处理（清理格式）
  content.addEventListener('paste', (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  });

  editorInstance = { toolbar, content };
};

// 监听值变化
watch(() => props.modelValue, (newVal) => {
  if (editorInstance && editorInstance.content) {
    if (editorInstance.content.innerHTML !== newVal) {
      editorInstance.content.innerHTML = newVal || '';
    }
  }
});

// 监听禁用状态
watch(() => props.disabled, (newVal) => {
  if (editorInstance && editorInstance.content) {
    editorInstance.content.contentEditable = !newVal;
  }
});

// 生命周期
onMounted(() => {
  initEditor();
});

onBeforeUnmount(() => {
  editorInstance = null;
});
</script>

<style scoped>
.rich-text-editor {
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  overflow: hidden;
  transition: border-color 0.3s;
}

.rich-text-editor:hover {
  border-color: #40a9ff;
}

.rich-text-editor:focus-within {
  border-color: #40a9ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px;
  background: #fafafa;
  border-bottom: 1px solid #d9d9d9;
  flex-wrap: wrap;
}

.editor-toolbar button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid transparent;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  color: #595959;
  font-size: 14px;
  transition: all 0.3s;
}

.editor-toolbar button:hover {
  background: #e6e6e6;
  border-color: #d9d9d9;
}

.editor-toolbar button:active {
  background: #d9d9d9;
}

.toolbar-separator {
  width: 1px;
  height: 20px;
  background: #d9d9d9;
  margin: 0 4px;
}

.editor-content {
  padding: 12px;
  min-height: 300px;
  max-height: 600px;
  overflow-y: auto;
  background: #fff;
  outline: none;
  line-height: 1.8;
  color: #262626;
}

.editor-content:empty:before {
  content: attr(data-placeholder);
  color: #bfbfbf;
}

/* 编辑器内容样式 */
.editor-content :deep(h1) {
  font-size: 28px;
  font-weight: 600;
  margin: 16px 0;
  color: #1a1a1a;
}

.editor-content :deep(h2) {
  font-size: 24px;
  font-weight: 600;
  margin: 14px 0;
  color: #1a1a1a;
}

.editor-content :deep(h3) {
  font-size: 20px;
  font-weight: 600;
  margin: 12px 0;
  color: #1a1a1a;
}

.editor-content :deep(p) {
  margin: 8px 0;
}

.editor-content :deep(ul),
.editor-content :deep(ol) {
  margin: 8px 0;
  padding-left: 24px;
}

.editor-content :deep(li) {
  margin: 4px 0;
}

.editor-content :deep(strong) {
  font-weight: 600;
}

.editor-content :deep(em) {
  font-style: italic;
}

.editor-content :deep(u) {
  text-decoration: underline;
}
</style>


