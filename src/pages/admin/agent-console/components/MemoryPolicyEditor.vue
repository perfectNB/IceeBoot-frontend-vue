<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { hasPermission } from '@/utils/permission'
import { memoryApi, type FieldType, type MemoryPolicyRequest, type MemoryScope } from '@/api/agentMemory'

const props = defineProps<{ scope: MemoryScope; agent: number }>()
const form = ref<MemoryPolicyRequest>()
const busy = ref(false)
const newName = ref('')
const newType = ref<FieldType>('TEXT')
const error = ref('')
const original = ref<string[]>([])
const editable = hasPermission(props.scope === 'USER' ? 'ai:memory:platform-policy-write:api' : 'ai:memory:policy-write:api')
async function load() {
  const policy = await memoryApi.policy(props.scope, props.agent)
  form.value = { ...policy, fields: { ...policy.fields } }
  original.value = Object.keys(policy.fields)
}
function add() {
  const name = newName.value.trim()
  if (!form.value) return
  if (!/^[a-z][a-z0-9_]{0,47}$/.test(name) || name in form.value.fields) {
    error.value = '请使用唯一的英文字段名，可包含小写字母、数字和下划线。'
    return
  }
  form.value.fields[name] = newType.value
  newName.value = ''
  error.value = ''
}
async function save() {
  if (!form.value) return
  if (!Object.keys(form.value.fields).length || !form.value.prompt.trim() || newName.value.trim()) {
    error.value = '请填写提取提示词，并将要保存的字段添加到列表。'
    return
  }
  busy.value = true
  try {
    await memoryApi.savePolicy(props.scope, props.agent, form.value)
    await load()
    error.value = ''
    ElMessage.success('策略已保存')
  } finally { busy.value = false }
}
onMounted(async () => {
  busy.value = true
  try { await load() } finally { busy.value = false }
})
</script>

<template>
  <el-form v-loading="busy" label-position="top" :disabled="!editable || busy" class="policy">
    <template v-if="form">
      <el-form-item label="启用画像"><el-switch v-model="form.enabled" /></el-form-item>
      <el-form-item label="提取提示词">
        <el-input v-model="form.prompt" type="textarea" :rows="4" maxlength="4000" show-word-limit
          placeholder="例如：用户明确说出常用编程语言时，更新 primary_language。临时举例时跳过。" />
      </el-form-item>
      <el-form-item label="允许记录的字段">
        <div class="field-list">
          <el-tag v-for="(type, name) in form.fields" :key="name" :closable="editable && !original.includes(String(name))"
            @close="delete form.fields[name]">{{ name }} · {{ { TEXT: '文本', NUMBER: '数字', BOOLEAN: '布尔值' }[type] }}</el-tag>
        </div>
        <div v-if="editable" class="new-field">
          <el-input v-model="newName" aria-label="新字段名称" placeholder="例如 primary_language" maxlength="48" />
          <el-select v-model="newType" aria-label="字段类型">
            <el-option label="文本" value="TEXT" /><el-option label="数字" value="NUMBER" /><el-option label="布尔值" value="BOOLEAN" />
          </el-select>
          <el-button @click="add">添加字段</el-button>
        </div>
      </el-form-item>
      <el-form-item label="生效前人工确认"><el-switch v-model="form.reviewRequired" :disabled="scope === 'AGENT'" /></el-form-item>
      <p class="hint">{{ scope === 'USER' ? '通用策略从下一轮对话生效，智能体只能使用用户授权的字段。' : '保存后请重新发布智能体，并新建会话使用此策略。停用会立即阻止后续轮次读取。' }}</p>
      <el-alert v-if="error" :title="error" type="warning" :closable="false" />
      <el-button v-if="editable" type="primary" :loading="busy" @click="save">保存策略</el-button>
    </template>
  </el-form>
</template>
<style scoped>
.policy { max-width: 780px; padding: 12px 0; }
.field-list, .new-field { display: flex; gap: 8px; flex-wrap: wrap; width: 100%; }
.new-field { margin-top: 8px; }
.new-field .el-input { width: min(230px, 100%); }
.new-field .el-select { width: 110px; }
.hint { color: var(--el-text-color-secondary); font-size: 13px; }
</style>
