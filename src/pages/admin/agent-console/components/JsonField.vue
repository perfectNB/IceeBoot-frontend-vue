<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Check, DocumentCopy, MagicStick } from '@element-plus/icons-vue'

const props = withDefaults(
  defineProps<{
    modelValue: Record<string, unknown>
    label: string
    rows?: number
    placeholder?: string
    hint?: string
    example?: Record<string, unknown>
  }>(),
  { rows: 8, placeholder: '{\n  \n}', hint: '' },
)
const emit = defineEmits<{
  'update:modelValue': [value: Record<string, unknown>]
  valid: [value: boolean]
}>()
const text = ref('')
const error = ref('')
let lastEmitted: string | undefined
const lineCount = computed(() => text.value.split('\n').length)
watch(
  () => props.modelValue,
  (value) => {
    if (lastEmitted === JSON.stringify(value)) {
      lastEmitted = undefined
      return
    }
    text.value = JSON.stringify(value || {}, null, 2)
    error.value = ''
    emit('valid', true)
  },
  { immediate: true },
)
function update(value: string) {
  text.value = value
  try {
    const parsed: unknown = JSON.parse(value)
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
      error.value = '这里需要一个 JSON 对象，例如 {}，不能是数组或单个值。'
      emit('valid', false)
      return
    }
    error.value = ''
    lastEmitted = JSON.stringify(parsed)
    emit('valid', true)
    emit('update:modelValue', parsed as Record<string, unknown>)
  } catch (cause) {
    const position = cause instanceof Error ? /position (\d+)/.exec(cause.message)?.[1] : undefined
    const line = position ? value.slice(0, Number(position)).split('\n').length : undefined
    error.value = line
      ? `第 ${line} 行附近格式不正确，请检查引号、逗号和括号。`
      : 'JSON 格式不正确，请检查引号、逗号和括号后再保存。'
    emit('valid', false)
  }
}
function format() {
  if (!error.value) update(JSON.stringify(JSON.parse(text.value), null, 2))
}
function useExample() {
  if (props.example) update(JSON.stringify(props.example, null, 2))
}
</script>
<template>
  <div class="json-field" :class="{ 'has-error': error }">
    <div class="editor-toolbar">
      <span class="editor-language">JSON <span>· {{ lineCount }} 行</span></span>
      <div class="editor-actions">
        <el-popconfirm
          v-if="example"
          title="用示例替换当前 JSON 内容？"
          confirm-button-text="填入示例"
          cancel-button-text="取消"
          @confirm="useExample"
        >
          <template #reference><el-button text size="small" :icon="DocumentCopy">填入示例</el-button></template>
        </el-popconfirm>
        <el-button text size="small" :icon="MagicStick" :disabled="!!error" @click="format">格式化</el-button>
      </div>
    </div>
    <el-input
      :model-value="text"
      type="textarea"
      :rows="rows"
      :autosize="{ minRows: rows, maxRows: Math.max(rows, 22) }"
      :placeholder="placeholder"
      :aria-label="label"
      :aria-invalid="!!error"
      spellcheck="false"
      @update:model-value="update"
    />
    <div class="editor-footer">
      <p v-if="error" role="alert" class="json-error">{{ error }}</p>
      <p v-else class="json-status"><el-icon aria-hidden="true"><Check /></el-icon>格式正确<span v-if="hint"> · {{ hint }}</span></p>
    </div>
  </div>
</template>
<style scoped>
.json-field { width: 100%; min-width: 0; border: 1px solid var(--el-border-color); border-radius: 8px; overflow: hidden; background: var(--el-bg-color); }
.json-field.has-error { border-color: var(--el-color-danger); }
.editor-toolbar { min-height: 38px; padding: 0 10px 0 14px; display: flex; align-items: center; justify-content: space-between; gap: 8px; border-bottom: 1px solid var(--el-border-color-lighter); background: var(--el-fill-color-lighter); }
.editor-language { font-size: 11px; font-weight: 650; letter-spacing: .03em; color: var(--el-text-color-regular); white-space: nowrap; }
.editor-language span { font-weight: 400; color: var(--el-text-color-secondary); }
.editor-actions { display: flex; gap: 2px; }
.editor-actions :deep(.el-button) { margin: 0; font-size: 11px; min-height: 32px; padding: 6px; }
.json-field :deep(.el-textarea__inner) { border-radius: 0; box-shadow: none; font-family: 'SFMono-Regular', Consolas, monospace; font-size: 12px; line-height: 1.8; padding: 12px 14px; color: var(--el-text-color-primary); background: var(--el-bg-color); }
.json-field :deep(.el-textarea__inner:focus) { box-shadow: inset 0 0 0 1px var(--el-color-primary); }
.editor-footer { padding: 7px 12px; border-top: 1px solid var(--el-border-color-lighter); }
.editor-footer p { margin: 0; font-size: 11px; line-height: 1.7; }
.json-status { color: var(--el-text-color-regular); display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
.json-status .el-icon { color: var(--el-color-success); }
.json-status span { color: var(--el-text-color-secondary); }
.json-error { color: var(--el-color-danger); }
@media (max-width: 480px) { .editor-toolbar { flex-wrap: wrap; padding-block: 5px; } }
</style>
