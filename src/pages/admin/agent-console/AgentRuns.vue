<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { agentConsole, type RunView, type RunDetail } from '@/api/agentConsole'
import './console.scss'
const rows = ref<RunView[]>([]),
  detail = ref<RunDetail>(),
  visible = ref(false),
  loading = ref(false)
const labels: Record<string, string> = {
  RUNNING: '执行中',
  SUCCEEDED: '成功',
  FAILED: '失败',
  CANCELLED: '已取消',
}
async function load() {
  loading.value = true
  try {
    rows.value = await agentConsole.runs()
  } finally {
    loading.value = false
  }
}
async function open(row: RunView) {
  detail.value = await agentConsole.run(row.id)
  visible.value = true
}
onMounted(load)
</script>
<template>
  <main class="agent-console">
    <header class="console-heading">
      <div>
        <h1>执行记录</h1>
        <p class="subtitle">
          查看每次调用的输入、输出，以及父子智能体和每轮模型请求的 Token 消耗。
        </p>
      </div>
      <el-button @click="load">刷新</el-button>
    </header>
    <section class="console-panel">
      <el-table v-loading="loading" :data="rows" empty-text="还没有执行记录。">
        <el-table-column prop="agentCode" label="智能体" min-width="180" />
        <el-table-column prop="version" label="版本" width="75" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag
              :type="
                row.status === 'SUCCEEDED' ? 'success' : row.status === 'FAILED' ? 'danger' : 'info'
              "
            >
              {{ labels[row.status] || row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="startedAt" label="开始时间" min-width="190" />
        <el-table-column prop="inputTokens" label="自身输入 Token" width="145" />
        <el-table-column prop="outputTokens" label="自身输出 Token" width="145" />
        <el-table-column label="操作" width="95">
          <template #default="{ row }">
            <el-button link type="primary" @click="open(row)">详情</el-button>
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
                    <h3>输入</h3>
                    <pre class="agent-output">{{ row.input }}</pre>
                    <h3>输出</h3>
                    <pre class="agent-output">{{ row.output || '暂无输出' }}</pre>
                    <el-alert v-if="row.error" :title="row.error" type="error" :closable="false" />
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="agentCode" label="智能体" min-width="180" />
              <el-table-column prop="version" label="版本" width="80" />
              <el-table-column label="状态" width="100">
                <template #default="{ row }">{{ labels[row.status] || row.status }}</template>
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
              <el-table-column prop="agentCode" label="智能体" min-width="160" />
              <el-table-column prop="model" label="模型" min-width="180" />
              <el-table-column prop="inputTokens" label="输入 Token" width="130" />
              <el-table-column prop="outputTokens" label="输出 Token" width="130" />
              <el-table-column prop="createdAt" label="记录时间" min-width="180" />
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </template>
    </el-dialog>
  </main>
</template>
<style scoped>
.usage-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
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
