<script setup lang="ts">
import { ref, watch } from 'vue'
const props = defineProps<{
  modelValue: Record<string, string>
  label: string
  multiline?: boolean
  secret?: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [value: Record<string, string>] }>()
const rows = ref<{ key: string; value: string }[]>([])
watch(
  () => props.modelValue,
  (value) => {
    if (
      JSON.stringify(Object.fromEntries(rows.value.map((r) => [r.key, r.value]))) !==
      JSON.stringify(value || {})
    )
      rows.value = Object.entries(value || {}).map(([key, value]) => ({ key, value }))
  },
  { immediate: true },
)
function sync() {
  emit(
    'update:modelValue',
    Object.fromEntries(rows.value.filter((r) => r.key).map((r) => [r.key, r.value])),
  )
}
function remove(index: number) {
  rows.value.splice(index, 1)
  sync()
}
</script>
<template>
  <div class="kv-field">
    <div v-for="(row, index) in rows" :key="index" class="kv-row">
      <el-input
        v-model="row.key"
        :aria-label="`${label}名称 ${index + 1}`"
        placeholder="名称 / 相对路径"
        @change="sync"
      />
      <el-input
        v-model="row.value"
        :aria-label="`${label}内容 ${index + 1}`"
        :type="multiline ? 'textarea' : secret ? 'password' : 'text'"
        :rows="multiline ? 5 : undefined"
        :show-password="secret && !multiline"
        placeholder="内容"
        @change="sync"
      />
      <el-button
        type="danger"
        plain
        :aria-label="`删除${label} ${index + 1}`"
        @click="remove(index)"
      >
        删除
      </el-button>
    </div>
    <el-button @click="rows.push({ key: '', value: '' })">添加{{ label }}</el-button>
    <p v-if="secret" class="field-help">
      已保存的值仅显示 ********；保留占位符表示不修改，删除整行表示移除。
    </p>
  </div>
</template>
<style scoped>
.kv-field {
  width: 100%;
}
.kv-row {
  display: grid;
  grid-template-columns: minmax(120px, 1fr) minmax(180px, 3fr) auto;
  gap: 10px;
  margin-bottom: 12px;
  align-items: start;
}
@media (max-width: 600px) {
  .kv-row {
    grid-template-columns: 1fr;
  }
}
</style>
