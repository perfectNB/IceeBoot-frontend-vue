<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { hasPermission } from '@/utils/permission'
import { memoryApi, type GrantRequest } from '@/api/agentMemory'

const props = defineProps<{ agent: number }>()
const fields = ref<string[]>([])
const grant = ref<GrantRequest>()
const busy = ref(false)
const editable = hasPermission('ai:memory:grant-write:api')
async function load() {
  const access = await memoryApi.grant(props.agent)
  grant.value = { revision: access.revision, readFields: access.readFields, writeFields: access.writeFields }
  fields.value = access.availableFields
}
async function save() {
  if (!grant.value) return
  busy.value = true
  try {
    await memoryApi.share(props.agent, grant.value)
    await load()
    ElMessage.success('已更新共享授权')
  } finally { busy.value = false }
}
onMounted(async () => {
  busy.value = true
  try { await load() } finally { busy.value = false }
})
</script>
<template>
  <el-form v-loading="busy" label-position="top" class="sharing">
    <template v-if="grant">
      <p>选择此智能体可以使用的通用画像字段。清空后保存即可撤回授权。</p>
      <el-form-item label="对话时可读取">
        <el-select v-model="grant.readFields" multiple clearable :disabled="!editable" placeholder="暂未授权" no-data-text="请先配置通用画像字段">
          <el-option v-for="field in fields" :key="field" :value="field" />
        </el-select>
      </el-form-item>
      <el-form-item label="对话后可提议更新">
        <el-select v-model="grant.writeFields" multiple clearable :disabled="!editable" placeholder="暂未授权" no-data-text="请先配置通用画像字段">
          <el-option v-for="field in fields" :key="field" :value="field" />
        </el-select>
      </el-form-item>
      <el-button v-if="editable" type="primary" :loading="busy" @click="save">保存授权</el-button>
    </template>
  </el-form>
</template>
<style scoped>
.sharing { max-width: 640px; }
.sharing p { color: var(--el-text-color-secondary); }
</style>
