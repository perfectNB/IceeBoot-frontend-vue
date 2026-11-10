<script setup lang="ts">
import { ref, watch } from 'vue'
const props = withDefaults(
  defineProps<{ modelValue: Record<string, unknown>; label: string; rows?: number }>(),
  { rows: 8 },
)
const emit = defineEmits<{
  'update:modelValue': [value: Record<string, unknown>]
  valid: [value: boolean]
}>()
const text = ref('')
const error = ref('')
watch(
  () => props.modelValue,
  (value) => {
    text.value = JSON.stringify(value || {}, null, 2)
  },
  { immediate: true },
)
function update(value: string) {
  text.value = value
  try {
    const parsed: unknown = JSON.parse(value)
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object')
      throw new Error('请输入 JSON 对象')
    error.value = ''
    emit('valid', true)
    emit('update:modelValue', parsed as Record<string, unknown>)
  } catch {
    error.value = 'JSON 格式不正确，请检查后再保存'
    emit('valid', false)
  }
}
</script>
<template>
  <div class="json-field">
    <el-input
      :model-value="text"
      type="textarea"
      :rows="rows"
      :aria-label="label"
      spellcheck="false"
      @update:model-value="update"
    />
    <p v-if="error" role="alert" class="json-error">{{ error }}</p>
  </div>
</template>
<style scoped>
.json-field {
  width: 100%;
}
.json-field :deep(textarea) {
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 13px;
  line-height: 1.6;
}
.json-error {
  color: var(--el-color-danger);
  margin: 6px 0;
}
</style>
