<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { Delete, Document, Plus } from '@element-plus/icons-vue'

const props = withDefaults(defineProps<{
  modelValue: Record<string, string>
  label: string
  multiline?: boolean
  secret?: boolean
  keyLabel?: string
  valueLabel?: string
  keyPlaceholder?: string
  valuePlaceholder?: string
  emptyText?: string
  hint?: string
  keyPattern?: RegExp
  invalidKeyMessage?: string
  maxEntries?: number
}>(), {
  keyLabel: '名称',
  valueLabel: '内容',
  keyPlaceholder: '填写名称',
  valuePlaceholder: '填写内容',
  emptyText: '尚未添加，按需配置即可。',
  hint: '',
  invalidKeyMessage: '名称格式不正确',
})
const emit = defineEmits<{
  'update:modelValue': [value: Record<string, string>]
  valid: [value: boolean]
}>()
const rows = ref<{ id: number; key: string; value: string }[]>([])
const fieldId = useId()
let nextId = 0
let lastEmitted: string | undefined
const errors = computed(() => rows.value.map((row, index) => {
  if (!row.key && !row.value) return ''
  if (!row.key.trim()) return `请先填写${props.keyLabel}`
  if (/[\r\n]/.test(row.key)) return '名称不能包含换行'
  if (props.keyPattern && !props.keyPattern.test(row.key)) return props.invalidKeyMessage
  if (rows.value.some((other, otherIndex) => otherIndex !== index && other.key === row.key))
    return `${props.keyLabel}重复，请修改后保存`
  return ''
}))
watch(
  () => props.modelValue,
  (value) => {
    if (lastEmitted === JSON.stringify(value)) {
      lastEmitted = undefined
      return
    }
    rows.value = Object.entries(value || {}).map(([key, content]) => ({ id: nextId++, key, value: content }))
    emit('valid', true)
  },
  { immediate: true },
)
function sync() {
  const valid = !errors.value.some(Boolean)
  emit('valid', valid)
  if (!valid) return
  const value = Object.fromEntries(rows.value.filter((row) => row.key).map((row) => [row.key, row.value]))
  lastEmitted = JSON.stringify(value)
  emit('update:modelValue', value)
}
function append() {
  rows.value.push({ id: nextId++, key: '', value: '' })
}
function remove(index: number) {
  rows.value.splice(index, 1)
  sync()
}
defineExpose({ validate: () => !errors.value.some(Boolean) })
</script>
<template>
  <div class="kv-field" :class="{ 'is-multiline': multiline }">
    <div v-if="!rows.length" class="kv-empty"><el-icon aria-hidden="true"><Document /></el-icon><span>{{ emptyText }}</span></div>
    <div v-for="(row, index) in rows" :key="row.id" class="kv-row" :class="{ 'has-error': errors[index] }">
      <div class="kv-key">
        <label :for="`${fieldId}-key-${row.id}`">{{ keyLabel }}<span v-if="multiline" class="kv-index">{{ String(index + 1).padStart(2, '0') }}</span></label>
        <el-input
          :id="`${fieldId}-key-${row.id}`"
          v-model="row.key"
          :aria-label="`${label}${keyLabel} ${index + 1}`"
          :placeholder="keyPlaceholder"
          spellcheck="false"
          @update:model-value="sync"
        />
      </div>
      <div class="kv-value">
        <label :for="`${fieldId}-value-${row.id}`">{{ valueLabel }}<span v-if="secret && row.value === '********'" class="kv-saved">已保存</span></label>
        <el-input
          :id="`${fieldId}-value-${row.id}`"
          v-model="row.value"
          :aria-label="`${label}${valueLabel} ${index + 1}`"
          :type="multiline ? 'textarea' : secret ? 'password' : 'text'"
          :rows="multiline ? 6 : undefined"
          :show-password="secret && !multiline"
          :placeholder="valuePlaceholder"
          autocomplete="off"
          :spellcheck="!multiline"
          @update:model-value="sync"
        />
      </div>
      <el-button class="kv-remove" text :icon="Delete" :aria-label="`删除${label} ${index + 1}`" @click="remove(index)">{{ multiline ? '移除资源' : '移除' }}</el-button>
      <p v-if="errors[index]" role="alert" class="kv-error">{{ errors[index] }}</p>
    </div>
    <div class="kv-bottom"><el-button :icon="Plus" plain :disabled="maxEntries !== undefined && rows.length >= maxEntries" @click="append">添加{{ label }}</el-button><span v-if="rows.length">{{ rows.length }} 项<span v-if="maxEntries"> / 最多 {{ maxEntries }} 项</span></span></div>
    <p v-if="hint" class="kv-help">{{ hint }}</p>
    <p v-if="secret" class="kv-help">已保存的值仅显示 ********。保留占位符表示不修改，移除整行表示删除；更改名称时请重新填写内容。</p>
  </div>
</template>
<style scoped>
.kv-field { width: 100%; min-width: 0; }
.kv-empty { display: flex; align-items: center; gap: 8px; padding: 16px; margin-bottom: 12px; border: 1px dashed var(--el-border-color); border-radius: 8px; color: var(--el-text-color-secondary); font-size: 12px; line-height: 1.7; background: var(--el-fill-color-lighter); }
.kv-row { display: grid; grid-template-columns: minmax(120px, 1fr) minmax(160px, 1.8fr) auto; gap: 8px 12px; margin-bottom: 14px; align-items: start; }
.kv-key, .kv-value { min-width: 0; }
.kv-row label { display: flex; align-items: center; justify-content: space-between; color: var(--el-text-color-regular); font-size: 11px; margin-bottom: 4px; line-height: 1.6; }
.kv-index { font-family: 'SFMono-Regular', Consolas, monospace; color: var(--el-text-color-secondary); }
.kv-saved { font-size: 10px; color: var(--el-color-success); }
.kv-remove { margin-top: 21px; color: var(--el-text-color-secondary); font-size: 12px; }
.kv-remove:hover { color: var(--el-color-danger); }
.kv-error { grid-column: 1 / -1; color: var(--el-color-danger); font-size: 12px; line-height: 1.6; margin: 0; }
.has-error :deep(.el-input__wrapper) { box-shadow: 0 0 0 1px var(--el-color-danger) inset; }
.kv-bottom { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.kv-bottom > span, .kv-help { font-size: 11px; color: var(--el-text-color-secondary); line-height: 1.8; }
.kv-help { margin: 8px 0 0; }
.is-multiline .kv-row { grid-template-columns: minmax(0, 1fr) auto; padding: 16px; border: 1px solid var(--el-border-color-light); border-radius: 8px; background: var(--el-fill-color-lighter); }
.is-multiline .kv-key { grid-column: 1; }
.is-multiline .kv-value { grid-column: 1 / -1; grid-row: 2; }
.is-multiline .kv-remove { grid-column: 2; grid-row: 1; }
.is-multiline :deep(.el-textarea__inner) { font-family: 'SFMono-Regular', Consolas, monospace; font-size: 12px; line-height: 1.8; }
@media (max-width: 600px) { .kv-row { grid-template-columns: minmax(0, 1fr); padding: 12px; border: 1px solid var(--el-border-color-light); border-radius: 8px; } .kv-remove { justify-self: end; margin-top: 0; } .is-multiline .kv-row { grid-template-columns: minmax(0, 1fr); } .is-multiline .kv-key, .is-multiline .kv-value, .is-multiline .kv-remove { grid-column: 1; grid-row: auto; } }
</style>
