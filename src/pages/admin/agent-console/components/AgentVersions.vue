<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { agentConsole, type ReleaseView, type ReleaseDiff } from '@/api/agentConsole'
import { hasPermission } from '@/utils/permission'
const props = defineProps<{ agentId: number; versions: ReleaseView[]; activeReleaseId?: string }>()
const emit = defineEmits<{ changed: [] }>()
const from = ref(''), to = ref(''), loading = ref(false), rolling = ref(''), error = ref('')
const diff = ref<ReleaseDiff>()
let generation = 0, alive = true
watch(() => props.versions, versions => { generation++; diff.value = undefined; loading.value = false; from.value = versions[1]?.id || versions[0]?.id || ''; to.value = props.activeReleaseId || versions[0]?.id || '' }, { immediate: true })
watch([from,to], () => { generation++; diff.value = undefined; error.value = ''; loading.value = false })
onBeforeUnmount(() => { alive = false; generation++ })
async function compare() {
  if (!from.value || !to.value) return
  const token = ++generation
  loading.value = true; error.value = ''
  try { const value = await agentConsole.releaseDiff(props.agentId, from.value, to.value); if (alive && token === generation) diff.value = value }
  catch { if (alive && token === generation) error.value = '版本比较失败，请重试。' }
  finally { if (alive && token === generation) loading.value = false }
}
async function rollback(version: ReleaseView) {
  try {
    await ElMessageBox.confirm(`将 v${version.version} 的模型、提示词、能力和环境配置发布为新版本。新会话使用新版本；已有会话保留原版本。草稿保留不变。`, `回滚到 v${version.version}`, { type: 'warning', confirmButtonText: '创建回滚版本' })
  } catch { return }
  rolling.value = version.id
  try { const release = await agentConsole.rollback(props.agentId, version.id); if (alive) { ElMessage.success(`已创建并启用 v${release.version}`); emit('changed') } }
  finally { if (alive) rolling.value = '' }
}
</script>
<template>
  <div class="versions-workbench">
    <div v-if="hasPermission('ai:agent:diff:api') && versions.length" class="version-compare">
      <div><label for="version-before">比较起点</label><el-select id="version-before" v-model="from" aria-label="比较起点"><el-option v-for="version in versions" :key="version.id" :value="version.id" :label="`v${version.version}`" /></el-select></div>
      <span aria-hidden="true">→</span><div><label for="version-after">比较目标</label><el-select id="version-after" v-model="to" aria-label="比较目标"><el-option v-for="version in versions" :key="version.id" :value="version.id" :label="`v${version.version}`" /></el-select></div>
      <el-button :loading="loading" :disabled="!from || !to" @click="compare">查看差异</el-button>
    </div>
    <p v-if="error" role="alert" class="version-error">{{ error }}</p>
    <div v-if="diff" class="diff-result"><header><strong>v{{ diff.fromVersion }} → v{{ diff.toVersion }}</strong><span>{{ diff.changes.length }} 项差异</span></header><el-empty v-if="!diff.changes.length" description="两个版本配置一致" :image-size="60" />
      <div v-for="change in diff.changes" :key="change.path" class="diff-entry"><strong>{{ change.path }} <el-tag v-if="change.sensitive" type="info" size="small">敏感值已脱敏</el-tag></strong><div><pre class="diff-before">{{ change.before }}</pre><pre class="diff-after">{{ change.after }}</pre></div></div>
    </div>
    <el-table :data="versions" empty-text="发布后会生成不可变版本。"><el-table-column prop="version" label="版本" width="80"><template #default="{row}">v{{ row.version }}</template></el-table-column><el-table-column prop="createdAt" label="发布时间" min-width="160" /><el-table-column prop="createdBy" label="发布人" min-width="110" show-overflow-tooltip /><el-table-column label="状态 / 操作" width="160"><template #default="{row}"><el-tag v-if="row.id === activeReleaseId" type="success" size="small">当前生效</el-tag><el-button v-else-if="hasPermission('ai:agent:rollback:api')" text type="primary" :disabled="Boolean(rolling)" :loading="rolling === row.id" @click="rollback(row)">回滚到此版本</el-button></template></el-table-column></el-table>
    <p class="version-help">回滚会完整复制所选快照并创建新版本，保留全部发布历史。旧会话和当前草稿保持各自版本，密钥不会在差异中展示。</p>
  </div>
</template>
<style scoped>
.version-compare { display: flex; align-items: flex-end; gap: 12px; margin: 22px 0; }
.version-compare > div { flex: 1; min-width: 0; }
.version-compare label { display: block; margin-bottom: 7px; font-size: 12px; color: var(--el-text-color-regular); }
.version-compare > span { margin-bottom: 8px; color: var(--el-text-color-secondary); }
.version-compare .el-select { width: 100%; }
.diff-result { margin-bottom: 24px; border: 1px solid var(--el-border-color-lighter); border-radius: 10px; overflow: hidden; }
.diff-result > header { display: flex; justify-content: space-between; padding: 14px; background: var(--el-fill-color-light); color: var(--el-text-color-primary); font-size: 13px; }
.diff-result > header span { color: var(--el-text-color-secondary); font-size: 12px; }
.diff-entry { padding: 14px; border-top: 1px solid var(--el-border-color-lighter); }
.diff-entry > strong { display: block; margin-bottom: 10px; overflow-wrap: anywhere; font-size: 12px; font-weight: 550; color: var(--el-text-color-primary); }
.diff-entry > div { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.diff-entry pre { padding: 12px; margin: 0; max-height: 200px; overflow: auto; white-space: pre-wrap; overflow-wrap: anywhere; font: 11px/1.7 monospace; border-radius: 6px; }
.diff-before { color: var(--el-color-danger); background: var(--el-color-danger-light-9); }
.diff-after { color: var(--el-color-success); background: var(--el-color-success-light-9); }
.version-help { margin-top: 16px; font-size: 12px; line-height: 1.8; color: var(--el-text-color-regular); }
.version-error { color: var(--el-color-danger); }
@media(max-width:650px) { .diff-entry > div { grid-template-columns: 1fr; } .version-compare { flex-wrap: wrap; } }
</style>
