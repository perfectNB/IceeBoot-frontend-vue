<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { hasPermission } from '@/utils/permission'
import { memoryApi, type MemoryScope, type Profile, type Candidate } from '@/api/agentMemory'

const props = defineProps<{ scope: MemoryScope; agent: number }>()
const profile = ref<Profile>()
const candidates = ref<Candidate[]>([])
const busy = ref(false)
const field = ref('')
const value = ref('')
const editing = ref(false)
const shared = props.scope === 'AGENT'
const can = (action: string) => hasPermission('ai:memory:' + (shared ? 'shared-' : '') + action + ':api')
const rows = computed(() => Object.entries(profile.value?.fields ?? {}).map(([name, type]) =>
  ({ name, type, forgotten: profile.value?.forgottenFields.includes(name), value: profile.value?.values[name] })))

async function load() {
  profile.value = await memoryApi.profile(props.scope, props.agent)
  if (can('review-read')) candidates.value = await memoryApi.pending(props.scope, props.agent)
}
async function refresh() {
  busy.value = true
  try { await load() } finally { busy.value = false }
}
function edit(name: string) {
  field.value = name
  value.value = profile.value?.values[name] ?? ''
  editing.value = true
}
async function save() {
  if (!profile.value || !value.value.trim()) return
  busy.value = true
  try {
    await memoryApi.edit(props.scope, props.agent, field.value, value.value.trim(), profile.value.revision)
    editing.value = false
    await load()
  } finally { busy.value = false }
}
async function forget(name: string) {
  if (!profile.value) return
  const confirmed = await ElMessageBox.confirm('忘记后，后续对话将跳过这个字段。手动填写可以恢复。', '忘记「' + name + '」？',
    { type: 'warning', confirmButtonText: '忘记' }).then(() => true).catch(() => false)
  if (!confirmed) return
  busy.value = true
  try {
    await memoryApi.forget(props.scope, props.agent, name, profile.value.revision)
    await load()
  } finally { busy.value = false }
}
async function review(id: number, approve: boolean) {
  busy.value = true
  try {
    const applied = await memoryApi.review(props.scope, props.agent, id, approve)
    if (!applied) ElMessage.warning('候选已过期，保留当前画像。')
    await load()
  } finally { busy.value = false }
}
onMounted(refresh)
</script>

<template>
  <section v-loading="busy">
    <div class="section-title"><div><h3>已保存的记忆 <span class="memory-count">{{ rows.filter(row => row.value != null && !row.forgotten).length }}</span></h3><p class="hint">查看智能体保留的信息，随时编辑或选择忘记。</p></div><el-button @click="refresh">刷新记忆</el-button></div>
    <el-table :data="rows" empty-text="当前范围还没有配置画像字段" class="memory-profile-table">
      <el-table-column prop="name" label="字段" min-width="140" />
      <el-table-column label="当前值" min-width="160"><template #default="{ row }">{{ row.forgotten ? '已忘记' : (row.value ?? '未记录') }}</template></el-table-column>
      <el-table-column label="操作" width="130"><template #default="{ row }">
        <el-button v-if="can('edit')" link type="primary" @click="edit(row.name)">编辑</el-button>
        <el-button v-if="!row.forgotten && can('forget')" link type="danger" @click="forget(row.name)">忘记</el-button>
      </template></el-table-column>
    </el-table>
    <template v-if="can('review-read')">
      <div class="review-heading"><h3>待确认记忆 <span class="memory-count">{{ candidates.length }}</span></h3><p class="hint">确认提取结果后，再将它加入长期记忆。</p></div>
      <div v-if="!candidates.length" class="review-empty"><span class="review-empty-mark">✓</span><div><strong>暂无待确认内容</strong><p class="hint">新的记忆提议会显示在这里。</p></div></div>
      <article v-for="item in candidates" :key="item.id" class="candidate">
        <div v-for="(val, name) in item.values" :key="name"><strong>{{ name }}</strong> · {{ val }}<p class="hint">依据原文「{{ item.evidence[name] }}」</p></div>
        <template v-if="can('review')">
          <el-button size="small" type="primary" @click="review(item.id, true)">确认保存</el-button>
          <el-button size="small" @click="review(item.id, false)">拒绝</el-button>
        </template>
      </article>
    </template>
    <el-dialog v-model="editing" title="编辑记忆" width="min(460px, 92vw)" append-to-body>
      <el-form label-position="top"><el-form-item :label="field"><el-input v-model="value" maxlength="240" show-word-limit /></el-form-item></el-form>
      <template #footer><el-button @click="editing = false">取消</el-button><el-button type="primary" :loading="busy" :disabled="!value.trim()" @click="save">保存</el-button></template>
    </el-dialog>
  </section>
</template>

<style scoped>
.section-title { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 22px; }
h3 { margin: 0; font-size: 15px; font-weight: 600; color: var(--el-text-color-primary); }
.hint { margin: 7px 0 0; color: var(--el-text-color-regular); font-size: 12px; line-height: 1.7; overflow-wrap: anywhere; }
.memory-count { display: inline-block; margin-left: 7px; padding: 2px 7px; border-radius: 5px; background: var(--el-fill-color); font-size: 11px; color: var(--el-text-color-secondary); font-weight: 500; }
.memory-profile-table { --el-table-header-bg-color: var(--el-fill-color-lighter); border: 1px solid var(--el-border-color-lighter); border-radius: 8px; }
.memory-profile-table :deep(th.el-table__cell) { height: 44px; font-size: 12px; font-weight: 500; }
.memory-profile-table :deep(.el-table__row .el-table__cell) { padding-block: 15px; }
.memory-profile-table :deep(.el-table__empty-block) { min-height: 130px; }
.review-heading { margin: 30px 0 18px; }
.review-empty { display: flex; gap: 14px; align-items: center; padding: 23px; border: 1px dashed var(--el-border-color); border-radius: 9px; background: var(--el-fill-color-lighter); }
.review-empty-mark { display: grid; place-items: center; width: 32px; height: 32px; border-radius: 50%; color: var(--el-color-success); background: var(--el-color-success-light-9); font-size: 16px; }
.review-empty strong { color: var(--el-text-color-regular); font-size: 13px; font-weight: 500; }
.review-empty .hint { margin-top: 4px; color: var(--el-text-color-secondary); }
.candidate { margin-top: 12px; padding: 18px 20px; border: 1px solid var(--el-border-color-lighter); border-radius: 9px; overflow-wrap: anywhere; }
.candidate strong { color: var(--el-text-color-primary); font-size: 13px; }
.candidate .el-button { margin-top: 14px; }
</style>
