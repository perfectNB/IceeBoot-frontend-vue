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
    <div class="section-title"><h3>已保存的字段</h3><el-button text @click="refresh">刷新</el-button></div>
    <el-table :data="rows" empty-text="当前范围还没有配置画像字段">
      <el-table-column prop="name" label="字段" min-width="140" />
      <el-table-column label="当前值" min-width="160"><template #default="{ row }">{{ row.forgotten ? '已忘记' : (row.value ?? '未记录') }}</template></el-table-column>
      <el-table-column label="操作" width="130"><template #default="{ row }">
        <el-button v-if="can('edit')" link type="primary" @click="edit(row.name)">编辑</el-button>
        <el-button v-if="!row.forgotten && can('forget')" link type="danger" @click="forget(row.name)">忘记</el-button>
      </template></el-table-column>
    </el-table>
    <template v-if="can('review-read')">
      <h3>待确认记忆</h3>
      <p v-if="!candidates.length" class="hint">暂无待确认内容</p>
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
.section-title { display: flex; justify-content: space-between; align-items: center; }
h3 { font-size: 15px; color: var(--el-text-color-primary); }
.hint { color: var(--el-text-color-secondary); overflow-wrap: anywhere; }
.candidate { padding: 14px 0; border-top: 1px solid var(--el-border-color-lighter); overflow-wrap: anywhere; }
</style>
