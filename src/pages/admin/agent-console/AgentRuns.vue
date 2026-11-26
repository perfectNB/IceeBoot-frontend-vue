<script setup lang="ts">
import AdminPageHeader from '@/components/common/AdminPageHeader.vue'
import { cacheSummary } from './components/runMetrics'
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { hasPermission } from '@/utils/permission'
import { agentConsole, type RunView, type RunDetail, type AgentQuota } from '@/api/agentConsole'
import './console.scss'
const rows = ref<RunView[]>([]),
  detail = ref<RunDetail>(),
  visible = ref(false),
  loading = ref(false)
const cache = computed(() => cacheSummary(detail.value?.modelCalls ?? []))
const labels: Record<string, string> = {
  RUNNING: '执行中',
  SUCCEEDED: '成功',
  FAILED: '失败',
  CANCELLED: '已取消',
  INTERRUPTED: '节点中断',
  TIMED_OUT: '已超时',
}
const quota = ref<AgentQuota>()
const cancelling = ref('')
let poll: ReturnType<typeof setTimeout> | undefined
let destroyed = false
async function load() {
  if (loading.value) return
  if (poll) clearTimeout(poll)
  loading.value = true
  try {
    const [runs, dailyQuota] = await Promise.all([
      agentConsole.runs(),
      hasPermission('ai:quota:read') ? agentConsole.quota() : Promise.resolve(undefined),
    ])
    rows.value = runs
    quota.value = dailyQuota
  } finally {
    loading.value = false
    if (!destroyed && rows.value.some((row) => row.status === 'RUNNING')) {
      poll = setTimeout(() => {
        void load().catch(() => undefined)
      }, 2000)
    }
  }
}
async function open(row: RunView) {
  detail.value = await agentConsole.run(row.id)
  visible.value = true
}
async function cancel(row: RunView) {
  const confirmed = await ElMessageBox.confirm(
    '将停止当前任务及其子任务，已经发生的模型调用用量会保留。',
    '取消执行',
    { type: 'warning' },
  ).then(() => true).catch(() => false)
  if (!confirmed) return
  cancelling.value = row.id
  try {
    await agentConsole.cancelRun(row.id)
    ElMessage.success('取消请求已提交，正在等待执行节点停止')
    await load()
  } finally {
    cancelling.value = ''
  }
}
onMounted(load)
onBeforeUnmount(() => {
  destroyed = true
  if (poll) clearTimeout(poll)
})
</script>
<template>
  <main class="agent-console admin-page">
    <AdminPageHeader title="执行记录" description="查看每次调用的输入、输出，以及父子智能体和每轮模型请求的 Token 消耗。">
      <span v-if="quota" class="quota-summary">今日模型请求（UTC）：{{ quota.usedRequests }} / {{ quota.dailyLimit || '不限' }}</span>
      <el-button @click="load">刷新</el-button>
    </AdminPageHeader>
    <section class="console-panel">
      <el-table v-loading="loading" :data="rows" empty-text="还没有执行记录。">
        <el-table-column prop="agentCode" label="智能体 / 模型" min-width="180" />
        <el-table-column label="版本" width="75"><template #default="{ row }">{{ row.version === 0 ? '直调' : row.version }}</template></el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag
              :type="
                row.status === 'SUCCEEDED' ? 'success' : row.status === 'FAILED' ? 'danger' : 'info'
              "
            >
              {{ row.status === 'RUNNING' && row.cancelRequested ? '取消中' : labels[row.status] || row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="startedAt" label="开始时间" min-width="190" />
        <el-table-column prop="inputTokens" label="自身输入 Token" width="145" />
        <el-table-column prop="outputTokens" label="自身输出 Token" width="145" />
        <el-table-column label="操作" width="175">
          <template #default="{ row }">
            <el-button link type="primary" @click="open(row)">详情</el-button>
            <el-button v-if="row.status === 'RUNNING' && hasPermission('ai:run:cancel')" link type="danger"
              :disabled="row.cancelRequested" :loading="cancelling === row.id" @click="cancel(row)">取消执行</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>
    <el-dialog v-model="visible" title="执行详情" width="min(1200px,96vw)">
      <template v-if="detail">
        <div class="usage-summary">
          <div>
            <span>全智能体输入</span>
            <strong>{{ detail.totalInputTokens.toLocaleString() }}</strong>
          </div>
          <div>
            <span>全智能体输出</span>
            <strong>{{ detail.totalOutputTokens.toLocaleString() }}</strong>
          </div>
          <div>
            <span>已确认缓存命中</span>
            <strong>{{ cache.hits?.toLocaleString() ?? '—' }}</strong>
            <small>已确认 {{ cache.coverage }} 次请求</small>
          </div>
          <div>
            <span>参与执行</span>
            <strong>{{ detail.agents.length }} 次</strong>
          </div>
          <div>
            <span>模型请求</span>
            <strong>{{ detail.modelCalls.length }} 次</strong>
          </div>
        </div>
        <el-alert
          v-if="!detail.usageKnown"
          title="部分请求未返回 Token 用量，当前合计仅包含已知消耗。"
          type="warning"
          :closable="false"
        />
        <el-tabs>
          <el-tab-pane label="智能体调用树">
            <el-table :data="detail.agents" row-key="id">
              <el-table-column type="expand">
                <template #default="{ row }">
                  <div class="run-body">
                    <p class="code">
                      调用 ID：{{ row.id }}
                      <br />
                      父调用：{{ row.parentRunId || '根调用' }}
                    </p>
                    <p v-if="row.traceId || row.errorCode" class="code">错误分类：{{ row.errorCode || '—' }} · 追踪 ID：{{ row.traceId || '—' }}</p>
                    <h3>输入</h3>
                    <pre class="agent-output">{{ row.input }}</pre>
                    <h3>输出</h3>
                    <pre class="agent-output">{{ row.output || '暂无输出' }}</pre>
                    <el-alert v-if="row.error" :title="row.error" type="error" :closable="false" />
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="agentCode" label="智能体 / 模型" min-width="180" />
              <el-table-column prop="version" label="版本" width="80" />
              <el-table-column label="状态" width="100">
                <template #default="{ row }">{{ row.status === 'RUNNING' && row.cancelRequested ? '取消中' : labels[row.status] || row.status }}</template>
              </el-table-column>
              <el-table-column prop="inputTokens" label="自身输入 Token" min-width="140" />
              <el-table-column prop="outputTokens" label="自身输出 Token" min-width="140" />
              <el-table-column label="用量">
                <template #default="{ row }">{{ row.usageKnown ? '已知' : '部分未知' }}</template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="每轮模型请求">
            <el-table :data="detail.modelCalls">
              <el-table-column type="expand">
                <template #default="{ row }">
                  <div class="run-body">
                    <h3>模型输入</h3>
                    <pre class="agent-output">{{ row.input }}</pre>
                    <h3>模型输出（包含工具调用）</h3>
                    <pre class="agent-output">{{ row.output }}</pre>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="agentCode" label="智能体 / 模型" min-width="160" />
              <el-table-column prop="model" label="模型" min-width="180" />
              <el-table-column prop="inputTokens" label="输入 Token" width="130" />
              <el-table-column prop="outputTokens" label="输出 Token" width="130" />
              <el-table-column label="缓存命中 Token" min-width="140">
                <template #default="{ row }">{{ row.cachedTokens?.toLocaleString() ?? '未确认' }}</template>
              </el-table-column>
              <el-table-column prop="createdAt" label="记录时间" min-width="180" />
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </template>
    </el-dialog>
  </main>
</template>
<style scoped>
.quota-summary { font-size: 12px; color: var(--el-text-color-secondary); }
.usage-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(135px, 1fr));
  gap: 16px;
  margin: 8px 0 24px;
}
.usage-summary > div {
  padding: 18px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 10px;
}
.usage-summary span {
  display: block;
  color: var(--el-text-color-regular);
  font-size: 12px;
}
.usage-summary strong {
  display: block;
  font-size: 25px;
  margin-top: 8px;
  font-variant-numeric: tabular-nums;
}
.run-body {
  padding: 8px 24px 20px;
}
.run-body h3 {
  font-size: 14px;
}
.code {
  font-size: 12px;
  overflow-wrap: anywhere;
}
@media (max-width: 700px) {
  .usage-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .run-body {
    padding: 8px;
  }
}
</style>
