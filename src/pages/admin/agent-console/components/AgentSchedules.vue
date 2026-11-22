<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { Clock, Plus, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { agentConsole, type AgentView, type AgentSchedule, type AgentScheduleRequest, type AgentScheduleExecution, type RunDetail } from '@/api/agentConsole'
import { hasPermission } from '@/utils/permission'

const visible = defineModel<boolean>({ required: true })
const props = defineProps<{ agents: AgentView[] }>()
const tasks = ref<AgentSchedule[]>([]), loading = ref(false), loadError = ref('')
const editing = ref(false), saving = ref(false), editId = ref<number>(), pending = ref<number>()
const browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Shanghai'
const frequency = ref<'once' | 'daily' | 'weekly' | 'cron'>('daily'), hourMinute = ref('09:00'), weekday = ref('MON')
const onceDate = ref<Date>(), formError = ref('')
const published = computed(() => props.agents.filter(agent => agent.activeVersion > 0))
const enabledCount = computed(() => tasks.value.filter(task => task.enabled).length)
const historyTask = ref<AgentSchedule>(), records = ref<AgentScheduleExecution[]>([]), historyVisible = ref(false)
const historyLoading = ref(false), historyError = ref(''), offset = ref(0)
const cancelling = ref('')
const result = ref<RunDetail>(), resultVisible = ref(false), resultLoading = ref(false), resultError = ref('')
const draft = ref<AgentScheduleRequest>(empty())
let generation = 0, historyGeneration = 0, resultGeneration = 0, alive = true
function empty(): AgentScheduleRequest {
  return { name: '', agentCode: '', input: '', scheduleType: 'CRON', zoneId: 'Asia/Shanghai', enabled: true }
}
const statuses: Record<AgentScheduleExecution['status'], string> = {
  RUNNING: '执行中', SUCCEEDED: '已完成', FAILED: '失败', CANCELLED: '已取消', TIMED_OUT: '超时', INTERRUPTED: '执行中断',
  SKIPPED_OVERLAP: '上一轮未结束', SKIPPED_MISFIRE: '已错过周期',
}
function time(value?: number | null, zone = browserZone) {
  if (value == null) return '—'
  try { return new Intl.DateTimeFormat('zh-CN', { timeZone: zone, dateStyle: 'short', timeStyle: 'medium', hour12: false }).format(value) }
  catch { return new Date(value).toLocaleString() }
}
function agentName(code: string) { return props.agents.find(agent => agent.draft.code === code)?.draft.name || code }
function payload(): AgentScheduleRequest {
  const value: AgentScheduleRequest = { ...draft.value, name: draft.value.name.trim(), input: draft.value.input.trim() }
  if (frequency.value === 'once') {
    value.scheduleType = 'ONCE'; value.executeAt = onceDate.value?.getTime(); value.zoneId = browserZone
    delete value.cronExpression
  } else {
    value.scheduleType = 'CRON'; delete value.executeAt
    if (frequency.value !== 'cron') {
      const [hour, minute] = hourMinute.value.split(':').map(Number)
      value.cronExpression = `0 ${minute} ${hour} ? * ${frequency.value === 'weekly' ? weekday.value : '*'}`
    }
  }
  return value
}
async function load() {
  const token = ++generation
  loading.value = true; loadError.value = ''
  try { const values = await agentConsole.schedules(); if (alive && token === generation) tasks.value = values }
  catch { if (alive && token === generation) loadError.value = '任务加载失败，请刷新重试。' }
  finally { if (alive && token === generation) loading.value = false }
}
function edit(task?: AgentSchedule) {
  editId.value = task?.id
  draft.value = task ? { name: task.name, agentCode: task.agentCode, input: task.input, scheduleType: task.scheduleType,
    cronExpression: task.cronExpression, zoneId: task.zoneId, executeAt: task.executeAt, enabled: task.enabled } : empty()
  frequency.value = task ? task.scheduleType === 'ONCE' ? 'once' : 'cron' : 'daily'
  onceDate.value = task?.executeAt ? new Date(task.executeAt) : undefined
  hourMinute.value = '09:00'; weekday.value = 'MON'; formError.value = ''
  if (!task) draft.value.agentCode = published.value[0]?.draft.code || ''
  editing.value = true
}
async function save() {
  if (saving.value) return
  const value = payload()
  if (!value.name || !value.agentCode || !value.input || (value.scheduleType === 'ONCE' && (!value.executeAt || value.executeAt <= Date.now()))
    || (value.scheduleType === 'CRON' && (!value.cronExpression || value.cronExpression.includes('NaN')))) {
    formError.value = '请填写名称、智能体、任务内容和有效的未来执行时间。'; return
  }
  saving.value = true; formError.value = ''
  try {
    if (editId.value != null) await agentConsole.updateSchedule(editId.value, value)
    else await agentConsole.createSchedule(value)
    if (!alive) return
    editing.value = false; ElMessage.success('定时任务已保存'); await load()
  } finally { if (alive) saving.value = false }
}
async function toggle(task: AgentSchedule) {
  pending.value = task.id
  try { await agentConsole.setScheduleEnabled(task.id, !task.enabled); if (alive) await load() }
  finally { if (alive) pending.value = undefined }
}
async function remove(task: AgentSchedule) {
  try { await ElMessageBox.confirm(`删除“${task.name}”？执行历史会保留在数据库中。`, '删除定时任务', { type: 'warning' }) }
  catch { return }
  pending.value = task.id
  try { await agentConsole.deleteSchedule(task.id); if (alive) await load() }
  finally { if (alive) pending.value = undefined }
}
async function history(task: AgentSchedule, nextOffset = 0) {
  historyTask.value = task; historyVisible.value = true; offset.value = nextOffset
  const token = ++historyGeneration
  historyLoading.value = true; historyError.value = ''; records.value = []
  try { const values = await agentConsole.scheduleExecutions(task.id, nextOffset); if (alive && token === historyGeneration) records.value = values }
  catch { if (alive && token === historyGeneration) historyError.value = '执行记录加载失败，请重试。' }
  finally { if (alive && token === historyGeneration) historyLoading.value = false }
}
async function stop(record: AgentScheduleExecution) {
  if (!record.runId || cancelling.value) return
  cancelling.value = record.id
  try {
    await agentConsole.cancelRun(record.runId)
    if (alive) {
      ElMessage.success('取消请求已发送，请刷新查看结果')
      if (historyTask.value) await history(historyTask.value, offset.value)
    }
  } finally { if (alive) cancelling.value = '' }
}
async function showResult(record: AgentScheduleExecution) {
  if (!record.runId) return
  const token = ++resultGeneration
  resultVisible.value = true; resultLoading.value = true; result.value = undefined; resultError.value = ''
  try { const value = await agentConsole.run(record.runId); if (alive && token === resultGeneration) result.value = value }
  catch { if (alive && token === resultGeneration) resultError.value = '执行详情加载失败。' }
  finally { if (alive && token === resultGeneration) resultLoading.value = false }
}
watch(visible, value => { if (value) void load(); else generation++ }, { immediate: true })
watch(historyVisible, value => { if (!value) historyGeneration++ })
watch(resultVisible, value => { if (!value) resultGeneration++ })
onBeforeUnmount(() => { alive = false; generation++; historyGeneration++; resultGeneration++ })
</script>
<template>
  <el-dialog v-model="visible" title="智能体定时任务" width="min(1120px,96vw)" :close-on-click-modal="false" class="schedule-dialog">
    <header class="schedule-overview">
      <div class="schedule-intro"><el-icon :size="28"><Clock /></el-icon><div><p class="schedule-kicker">按计划，把事情交给智能体</p><h2>{{ enabledCount }} 个任务已启用 <span>/ {{ tasks.length }} 个任务</span></h2></div></div>
      <div><el-button :icon="Refresh" :loading="loading" @click="load">刷新</el-button><el-button v-if="hasPermission('ai:schedule:create:api')" type="primary" :icon="Plus" :disabled="!published.length" @click="edit()">新建任务</el-button></div>
    </header>
    <p class="schedule-note">每次使用独立会话与执行时最新发布版本，计入任务所有者的模型额度。暂停仅影响后续触发。</p>
    <el-alert v-if="loadError" :title="loadError" type="error" :closable="false" />
    <div v-loading="loading" class="schedule-table">
      <el-table :data="tasks" empty-text="暂无定时任务，发布智能体后即可创建" max-height="460">
        <el-table-column label="任务" min-width="190"><template #default="{ row }"><strong>{{ row.name }}</strong><p class="schedule-secondary">{{ agentName(row.agentCode) }}</p></template></el-table-column>
        <el-table-column label="执行计划" min-width="190"><template #default="{ row }"><span>{{ row.scheduleType === 'ONCE' ? '单次执行' : row.cronExpression }}</span><p class="schedule-secondary">{{ row.zoneId }}</p></template></el-table-column>
        <el-table-column label="下次执行" min-width="180"><template #default="{ row }">{{ time(row.nextFireAt, row.zoneId) }}</template></el-table-column>
        <el-table-column label="状态" width="105"><template #default="{ row }"><el-tag :type="row.running ? 'warning' : row.enabled ? 'success' : 'info'">{{ row.running ? '执行中' : row.enabled ? '已启用' : row.scheduleType === 'ONCE' && row.executeAt <= Date.now() ? '已结束' : '已暂停' }}</el-tag></template></el-table-column>
        <el-table-column label="操作" width="245" fixed="right"><template #default="{ row }">
          <el-button v-if="hasPermission('ai:schedule:history:api')" link type="primary" @click="history(row)">记录</el-button>
          <el-button v-if="hasPermission('ai:schedule:update:api')" link type="primary" :disabled="row.running || pending != null" @click="edit(row)">编辑</el-button>
          <el-button v-if="hasPermission('ai:schedule:status:api')" link type="primary" :loading="pending === row.id" :disabled="pending != null || (!row.enabled && row.scheduleType === 'ONCE' && row.executeAt <= Date.now())" @click="toggle(row)">{{ row.enabled ? '暂停' : '启用' }}</el-button>
          <el-button v-if="hasPermission('ai:schedule:delete:api')" link type="danger" :disabled="row.running || pending != null" @click="remove(row)">删除</el-button>
        </template></el-table-column>
      </el-table>
    </div>
    <footer class="schedule-policy"><span>周期任务错过后跳过，不集中补跑</span><span>上一轮未结束时跳过</span><span>容量满时等待后续扫描</span><span>失败保留记录，不自动重试</span></footer>
    <el-dialog v-model="editing" :title="editId ? '编辑定时任务' : '新建定时任务'" width="min(640px,94vw)" append-to-body :close-on-click-modal="false" :close-on-press-escape="!saving" :show-close="!saving">
      <el-form label-position="top" :disabled="saving" @submit.prevent="save">
        <el-form-item label="任务名称" required><el-input v-model="draft.name" maxlength="80" placeholder="例如：每日项目进展摘要" /></el-form-item>
        <el-form-item label="执行智能体" required><el-select v-model="draft.agentCode" style="width:100%" placeholder="选择已发布的智能体"><el-option v-for="agent in published" :key="agent.draft.code" :label="agent.draft.name" :value="agent.draft.code" /></el-select></el-form-item>
        <el-form-item label="任务内容" required><el-input v-model="draft.input" type="textarea" :rows="4" maxlength="100000" placeholder="描述需要完成的工作，以及期望的输出。" /></el-form-item>
        <el-form-item label="执行频率"><el-radio-group v-model="frequency"><el-radio-button value="once">单次</el-radio-button><el-radio-button value="daily">每天</el-radio-button><el-radio-button value="weekly">每周</el-radio-button><el-radio-button value="cron">高级 Cron</el-radio-button></el-radio-group></el-form-item>
        <template v-if="frequency === 'once'"><el-form-item label="执行时间" required><el-date-picker v-model="onceDate" type="datetime" placeholder="选择未来的时间" style="width:100%" /></el-form-item><p class="schedule-note">按设备时区 {{ browserZone }} 选择时间。停机错过后，服务恢复时执行一次。</p></template>
        <template v-else>
          <el-form-item v-if="frequency === 'weekly'" label="星期"><el-select v-model="weekday"><el-option v-for="(name, index) in ['一','二','三','四','五','六','日']" :key="index" :label="`星期${name}`" :value="['MON','TUE','WED','THU','FRI','SAT','SUN'][index]!" /></el-select></el-form-item>
          <el-form-item v-if="frequency !== 'cron'" label="执行时间"><el-time-picker v-model="hourMinute" value-format="HH:mm" format="HH:mm" :clearable="false" /></el-form-item>
          <el-form-item v-else label="Cron 表达式" required><el-input v-model="draft.cronExpression" maxlength="120" placeholder="0 0 9 ? * MON-FRI" /><p class="schedule-note">使用 6 或 7 位 Quartz Cron，秒位固定为 0。例如：工作日 09:00 为 0 0 9 ? * MON-FRI。</p></el-form-item>
          <el-form-item label="执行时区" required><el-select v-model="draft.zoneId" filterable allow-create default-first-option style="width:100%"><el-option v-for="zone in ['Asia/Shanghai', 'Asia/Tokyo', 'UTC', 'America/New_York', 'Europe/London']" :key="zone" :label="zone" :value="zone" /></el-select></el-form-item>
        </template>
        <el-form-item label="保存后启用"><el-switch v-model="draft.enabled" /></el-form-item>
        <el-alert title="后台任务不保存登录令牌，暂不支持依赖用户登录令牌的项目 API 工具。" type="info" :closable="false" />
        <p v-if="formError" role="alert" class="schedule-error">{{ formError }}</p>
      </el-form>
      <template #footer><el-button :disabled="saving" @click="editing = false">取消</el-button><el-button type="primary" :loading="saving" @click="save">保存任务</el-button></template>
    </el-dialog>
    <el-dialog v-model="historyVisible" :title="`${historyTask?.name || ''} · 执行记录`" width="min(940px,94vw)" append-to-body>
      <el-button :icon="Refresh" :loading="historyLoading" @click="historyTask && history(historyTask, offset)">刷新记录</el-button>
      <el-alert v-if="historyError" :title="historyError" type="error" :closable="false" />
      <el-table v-loading="historyLoading" :data="records" empty-text="暂无执行记录" max-height="440">
        <el-table-column label="计划时间" min-width="165"><template #default="{ row }">{{ time(row.scheduledAt, historyTask?.zoneId) }}</template></el-table-column>
        <el-table-column label="状态" min-width="130"><template #default="{ row }"><el-tag :type="row.status === 'SUCCEEDED' ? 'success' : row.status === 'FAILED' ? 'danger' : 'info'">{{ statuses[row.status as AgentScheduleExecution['status']] }}</el-tag></template></el-table-column>
        <el-table-column label="耗时" width="90"><template #default="{ row }">{{ row.finishedAt ? `${Math.max(0, Math.round((row.finishedAt - row.startedAt) / 1000))} 秒` : '—' }}</template></el-table-column>
        <el-table-column prop="message" label="说明" min-width="200" show-overflow-tooltip />
        <el-table-column label="结果" width="170"><template #default="{ row }"><el-button v-if="row.runId && hasPermission('ai:run:detail:api')" link type="primary" @click="showResult(row)">查看结果</el-button><el-button v-if="row.runId && row.status === 'RUNNING' && hasPermission('ai:run:cancel:api')" link type="danger" :loading="cancelling === row.id" :disabled="!!cancelling" @click="stop(row)">取消本轮</el-button></template></el-table-column>
      </el-table>
      <template #footer><el-button :disabled="offset === 0 || historyLoading" @click="historyTask && history(historyTask, Math.max(0, offset - 50))">上一页</el-button><el-button :disabled="records.length < 50 || historyLoading" @click="historyTask && history(historyTask, offset + 50)">下一页</el-button></template>
    </el-dialog>
    <el-dialog v-model="resultVisible" title="定时执行结果" width="min(800px,94vw)" append-to-body>
      <div v-loading="resultLoading" class="schedule-result"><el-alert v-if="resultError" :title="resultError" type="error" :closable="false" /><template v-for="run in result?.agents.filter(run => !run.parentRunId)" :key="run.id"><p class="schedule-secondary">{{ run.agentCode }} · v{{ run.version }} · {{ run.status }}</p><pre>{{ run.output || run.error || '本轮尚无输出' }}</pre><p class="schedule-secondary">{{ result?.usageKnown ? `输入 ${result.totalInputTokens} / 输出 ${result.totalOutputTokens} tokens` : '模型未提供完整用量' }}</p></template></div>
    </el-dialog>
  </el-dialog>
</template>
<style scoped>
.schedule-overview { display:flex; justify-content:space-between; align-items:center; gap:20px; padding:20px 0 24px; border-bottom:1px solid var(--el-border-color-lighter); }
.schedule-intro { display:flex; align-items:center; gap:16px; color:var(--el-color-primary); }
.schedule-kicker { margin:0 0 8px; font-size:12px; color:var(--el-text-color-secondary); }
.schedule-intro h2 { margin:0; color:var(--el-text-color-primary); font-size:23px; font-weight:600; }
.schedule-intro h2 span { font-size:13px; color:var(--el-text-color-secondary); font-weight:400; }
.schedule-note { margin:12px 0 20px; color:var(--el-text-color-secondary); font-size:12px; line-height:1.8; }
.schedule-table { min-height:160px; }
.schedule-secondary { margin:5px 0; font-size:12px; color:var(--el-text-color-secondary); }
.schedule-policy { display:flex; flex-wrap:wrap; gap:10px 24px; padding-top:18px; margin-top:12px; border-top:1px solid var(--el-border-color-lighter); color:var(--el-text-color-secondary); font-size:12px; }
.schedule-error { color:var(--el-color-danger); }
.schedule-result { min-height:120px; }
.schedule-result pre { margin:16px 0; white-space:pre-wrap; overflow-wrap:anywhere; max-height:480px; overflow:auto; line-height:1.8; color:var(--el-text-color-primary); }
@media(max-width:650px) { .schedule-overview { align-items:flex-start; flex-direction:column; } .schedule-intro h2 { font-size:20px; } }
</style>
