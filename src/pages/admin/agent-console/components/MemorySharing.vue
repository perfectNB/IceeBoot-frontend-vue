<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { hasPermission } from '@/utils/permission'
import { memoryApi, type GrantRequest } from '@/api/agentMemory'

const props = defineProps<{ agent: number }>()
const fields = ref<string[]>([])
const grant = ref<GrantRequest>()
const busy = ref(false)
const snapshot = ref('')
const isDirty = computed(() => !!grant.value && JSON.stringify(grant.value) !== snapshot.value)
let alive = true
onBeforeUnmount(() => { alive = false })
const editable = hasPermission('ai:memory:grant-write:api')
async function load() {
  const access = await memoryApi.grant(props.agent)
  if (!alive) return
  grant.value = { revision: access.revision, readFields: access.readFields, writeFields: access.writeFields }
  fields.value = access.availableFields
  snapshot.value = JSON.stringify(grant.value)
}
async function save() {
  if (!grant.value || !editable || busy.value) return false
  busy.value = true
  try {
    await memoryApi.share(props.agent, grant.value)
    await load()
    if (!alive) return false
    ElMessage.success('已更新共享授权')
    return true
  } finally { busy.value = false }
}
async function savePending() { return !isDirty.value || await save() }
defineExpose({ isDirty, busy, savePending })
onMounted(async () => {
  busy.value = true
  try { await load() } finally { busy.value = false }
})
</script>
<template>
  <el-form v-loading="busy" label-position="top" class="sharing">
    <template v-if="grant">
      <header class="sharing-heading"><h3>让共享有清晰的边界</h3><p>只开放需要的通用画像字段。读取与更新分别授权，清空后保存即可撤回。</p></header><div class="sharing-grid">
      <section class="sharing-card"><span class="sharing-index">01 · 对话上下文</span><h4>允许读取的字段</h4><p>智能体可以参考这些信息，让回答更贴合你的偏好。</p><el-form-item label="可读取字段">
        <el-select v-model="grant.readFields" multiple clearable :disabled="!editable" placeholder="暂未授权" no-data-text="请先配置通用画像字段">
          <el-option v-for="field in fields" :key="field" :value="field" />
        </el-select>
      </el-form-item>
      </section><section class="sharing-card"><span class="sharing-index">02 · 记忆更新</span><h4>允许提议更新的字段</h4><p>智能体可以根据对话，为这些字段提出新的记忆。</p><el-form-item label="可提议更新字段">
        <el-select v-model="grant.writeFields" multiple clearable :disabled="!editable" placeholder="暂未授权" no-data-text="请先配置通用画像字段">
          <el-option v-for="field in fields" :key="field" :value="field" />
        </el-select>
      </el-form-item>
      </section></div><footer class="sharing-footer"><span>未选中的字段不会向此智能体开放。</span><el-button v-if="editable" type="primary" :loading="busy" @click="save">保存授权</el-button></footer>
    </template>
  </el-form>
</template>
<style scoped>
.sharing-heading { margin-bottom: 24px; }.sharing h3 { margin: 0; color: var(--el-text-color-primary); font-size: 15px; font-weight: 600; }.sharing p { margin: 8px 0 0; font-size: 12px; line-height: 1.8; color: var(--el-text-color-regular); }
.sharing-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }.sharing-card { padding: 24px; border: 1px solid var(--el-border-color-lighter); border-radius: 10px; background: var(--el-fill-color-lighter); }.sharing-index { color: var(--el-text-color-secondary); font-size: 11px; }.sharing h4 { margin: 12px 0 0; font-size: 15px; font-weight: 600; color: var(--el-text-color-primary); }.sharing-card :deep(.el-form-item) { margin: 24px 0 0; }.sharing-card :deep(.el-form-item__label) { font-size: 12px; }.sharing .el-select { width: 100%; }.sharing-footer { display: flex; justify-content: space-between; align-items: center; gap: 18px; margin-top: 28px; padding-top: 20px; border-top: 1px solid var(--el-border-color-lighter); }.sharing-footer > span { color: var(--el-text-color-secondary); font-size: 12px; }
@media(max-width:700px) { .sharing-grid { grid-template-columns: 1fr; }.sharing-card { padding: 18px; } }
</style>
