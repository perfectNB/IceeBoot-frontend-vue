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
  <el-form v-loading="busy" label-position="top" :disabled="!editable || busy" class="memory-policy">
    <template v-if="form">
      <div class="policy-layout">
        <div class="policy-main">
          <div class="policy-status" :class="{ enabled: form.enabled }"><div class="status-copy"><span class="status-dot" /><div><strong>{{ form.enabled ? '画像提取已启用' : '画像提取未启用' }}</strong><p>{{ form.enabled ? '按下方规则从对话中提取并更新记忆' : '启用后，智能体会按规则提取值得保留的信息' }}</p></div></div><el-switch v-model="form.enabled" aria-label="启用画像提取" /></div>
          <section class="policy-section">
            <header class="policy-section-heading"><span class="section-index">01</span><div><h3>定义提取规则</h3><p>告诉智能体哪些信息值得记住，哪些情况应该跳过。</p></div></header>
            <el-form-item label="提取提示词"><el-input v-model="form.prompt" type="textarea" :rows="5" maxlength="4000" show-word-limit placeholder="例如：当用户明确说明常用编程语言时，将信息记录到 primary_language。临时举例、假设或不确定的信息不予记录。" /></el-form-item>
          </section>
          <section class="policy-section">
            <header class="policy-section-heading"><span class="section-index">02</span><div><h3>选择要记住的字段 <span class="field-count">{{ Object.keys(form.fields).length }}</span></h3><p>只提取已定义的字段，让每一条记忆都有明确用途。</p></div></header>
            <div class="field-list">
              <div v-for="(type, name) in form.fields" :key="name" class="memory-field-row"><code>{{ name }}</code><el-tag size="small" type="info" effect="plain">{{ { TEXT: '文本', NUMBER: '数字', BOOLEAN: '布尔值' }[type] }}</el-tag><span v-if="original.includes(String(name))" class="field-persisted">已保存</span><el-button v-else-if="editable" link type="danger" :aria-label="`移除字段 ${name}`" @click="delete form.fields[name]">移除</el-button></div>
              <div v-if="!Object.keys(form.fields).length" class="field-empty"><strong>还没有添加字段</strong><span>从一个字段开始，例如常用语言、工作领域或沟通偏好。</span></div>
            </div>
            <div v-if="editable" class="new-field"><el-input v-model="newName" aria-label="新字段名称" placeholder="字段名，如 primary_language" maxlength="48" @keyup.enter="add" /><el-select v-model="newType" aria-label="字段类型"><el-option label="文本" value="TEXT" /><el-option label="数字" value="NUMBER" /><el-option label="布尔值" value="BOOLEAN" /></el-select><el-button @click="add">添加字段</el-button></div>
            <p class="field-help">字段名以小写字母开头，可使用数字和下划线。</p>
          </section>
          <section class="policy-review"><div><h3>生效前人工确认</h3><p>{{ scope === 'AGENT' ? '公共经验需经审核，才能对其他用户生效。' : '开启后，提取出的新记忆会先进入待确认列表。' }}</p></div><el-switch v-model="form.reviewRequired" :disabled="scope === 'AGENT'" aria-label="生效前人工确认" /></section>
        </div>
        <aside class="policy-guide"><span class="guide-eyebrow">配置概览</span><h3>让记忆保持有用、可控</h3><dl><div><dt>记忆范围</dt><dd>{{ { USER: '我的通用画像', AGENT_USER: '我的专属画像', AGENT: '智能体公共经验' }[scope] }}</dd></div><div><dt>已定义字段</dt><dd>{{ Object.keys(form.fields).length }} 项</dd></div><div><dt>更新方式</dt><dd>{{ scope === 'AGENT' || form.reviewRequired ? '人工确认后保存' : '符合规则后自动保存' }}</dd></div></dl><div class="guide-divider" /><h4>什么时候生效？</h4><p>{{ scope === 'USER' ? '保存后从下一轮对话生效。各智能体仍只能使用你授权的字段。' : '保存后重新发布智能体，并创建新会话使用策略。停用会立即阻止后续轮次读取。' }}</p><h4>从少量字段开始</h4><p>优先记录稳定的偏好与背景。临时任务和不确定的信息，适合留在当前对话。</p></aside>
      </div>
      <el-alert v-if="error" :title="error" type="warning" :closable="false" class="policy-error" />
      <footer class="policy-footer"><span>{{ editable ? (scope === 'USER' ? '保存后从下一轮对话生效。' : '保存后重新发布智能体，并创建新会话生效。') : '当前为只读模式' }}</span><el-button v-if="editable" type="primary" :loading="busy" @click="save">保存策略</el-button></footer>
    </template>
  </el-form>
</template>
<style scoped>
.memory-policy { width: 100%; }
.policy-layout { display: grid; grid-template-columns: minmax(0,1fr) 250px; gap: 32px; align-items: start; }
.policy-main { min-width: 0; }
.policy-status { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 18px 20px; border: 1px solid var(--el-border-color-lighter); border-radius: 10px; background: var(--el-fill-color-lighter); }
.status-copy { display: flex; align-items: center; gap: 12px; }
.status-copy strong { font-size: 14px; font-weight: 600; color: var(--el-text-color-primary); }
.status-copy p { margin: 6px 0 0; font-size: 12px; line-height: 1.6; color: var(--el-text-color-regular); }
.status-dot { width: 8px; height: 8px; flex-shrink: 0; border-radius: 50%; background: var(--el-text-color-placeholder); }
.enabled .status-dot { background: var(--el-color-success); box-shadow: 0 0 0 4px var(--el-color-success-light-9); }
.policy-section { padding: 27px 0; border-bottom: 1px solid var(--el-border-color-lighter); }
.policy-section-heading { display: flex; gap: 12px; align-items: start; margin-bottom: 20px; }
.section-index { padding-top: 2px; color: var(--el-text-color-placeholder); font: 12px/1.6 'SFMono-Regular',Consolas,monospace; }
h3 { margin: 0; color: var(--el-text-color-primary); font-size: 14px; font-weight: 600; line-height: 1.6; }
.policy-section-heading p, .policy-review p { margin: 5px 0 0; color: var(--el-text-color-regular); font-size: 12px; line-height: 1.7; }
.policy-section :deep(.el-form-item) { margin: 0; }
.policy-section :deep(.el-form-item__label) { font-size: 12px; color: var(--el-text-color-secondary); }
.policy-section :deep(.el-textarea__inner) { padding: 12px 14px 24px; line-height: 1.8; }
.field-count { display: inline-block; margin-left: 6px; padding: 0 6px; border-radius: 4px; background: var(--el-fill-color); font-size: 11px; color: var(--el-text-color-regular); font-weight: 500; }
.field-list { display: grid; gap: 0; margin-bottom: 12px; }
.memory-field-row { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border: 1px solid var(--el-border-color-lighter); margin-top: -1px; }
.memory-field-row:first-child { border-radius: 7px 7px 0 0; }.memory-field-row:last-child { border-radius: 0 0 7px 7px; }.memory-field-row:only-child { border-radius: 7px; }
.memory-field-row code { flex: 1; overflow-wrap: anywhere; min-width: 0; color: var(--el-text-color-primary); font-size: 12px; }
.field-persisted { color: var(--el-text-color-secondary); font-size: 11px; }
.field-empty { display: grid; gap: 7px; padding: 23px 18px; border: 1px dashed var(--el-border-color); border-radius: 8px; background: var(--el-fill-color-lighter); text-align: center; }
.field-empty strong { font-size: 13px; font-weight: 500; color: var(--el-text-color-regular); }.field-empty span { font-size: 12px; line-height: 1.6; color: var(--el-text-color-secondary); }
.new-field { display: grid; grid-template-columns: minmax(0,1fr) 110px auto; gap: 10px; }.new-field .el-select { width: 100%; }
.field-help { margin: 10px 0 0; color: var(--el-text-color-secondary); font-size: 11px; }
.policy-review { display: flex; justify-content: space-between; align-items: center; gap: 20px; padding: 24px 0 0; }
.policy-guide { padding: 22px; border-radius: 10px; background: var(--el-fill-color-lighter); border: 1px solid var(--el-border-color-lighter); }
.guide-eyebrow { display: block; margin-bottom: 10px; font-size: 11px; color: var(--el-text-color-secondary); }.policy-guide h3 { font-size: 14px; }.policy-guide dl { margin: 22px 0 0; display: grid; gap: 16px; }.policy-guide dl > div { display: grid; gap: 5px; }.policy-guide dt { font-size: 11px; color: var(--el-text-color-secondary); }.policy-guide dd { margin: 0; color: var(--el-text-color-primary); font-size: 12px; }.guide-divider { height: 1px; background: var(--el-border-color-lighter); margin: 22px 0; }.policy-guide h4 { font-size: 12px; font-weight: 500; margin: 20px 0 6px; color: var(--el-text-color-primary); }.policy-guide p { margin: 0; font-size: 12px; line-height: 1.9; color: var(--el-text-color-regular); }
.policy-footer { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-top: 28px; padding-top: 20px; border-top: 1px solid var(--el-border-color-lighter); }.policy-footer > span { font-size: 12px; color: var(--el-text-color-secondary); }.policy-footer .el-button { min-width: 106px; }.policy-error { margin-top: 20px; }
@media(max-width:1000px) { .policy-layout { grid-template-columns: 1fr; gap: 24px; }.policy-guide { display: none; } }
@media(max-width:520px) { .new-field { grid-template-columns: minmax(0,1fr) 100px; }.new-field > .el-button { grid-column: 1 / -1; }.policy-status { padding: 14px; }.policy-footer > span { max-width: 60%; line-height: 1.7; } }
</style>
