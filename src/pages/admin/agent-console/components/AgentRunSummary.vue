<script setup lang="ts">
import { computed } from 'vue'
import type { AgentProgress } from '@/api/agentConsole'
import { runMetrics, formatDuration } from './runMetrics'
const props = defineProps<{ events: AgentProgress[] }>()
const metrics = computed(() => runMetrics(props.events))
</script>
<template>
  <div v-if="events.length" class="run-summary" aria-label="分阶段耗时与模型用量">
    <div><span>环境准备</span><strong>{{ metrics.environmentMs == null ? '—' : formatDuration(metrics.environmentMs) }}</strong></div>
    <div><span>模型 · {{ metrics.modelCalls }} 次</span><strong>{{ metrics.modelCalls ? formatDuration(metrics.modelMs) : '—' }}</strong></div>
    <div><span>工具 · {{ metrics.toolCalls }} 次</span><strong>{{ metrics.toolCalls ? formatDuration(metrics.toolMs) : '—' }}</strong></div>
    <div><span>输入 / 输出 Token</span><strong>{{ metrics.usageKnown ? `${metrics.inputTokens.toLocaleString()} / ${metrics.outputTokens.toLocaleString()}` : '用量未完整返回' }}</strong></div>
    <p>模型与工具为各次调用累计耗时，含子智能体，可能并行。<template v-if="metrics.firstTokenMs != null">首次模型内容等待 {{ formatDuration(metrics.firstTokenMs) }}。</template></p>
  </div>
</template>
<style scoped>
.run-summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin: 10px 0; padding: 12px 14px; border: 1px solid var(--el-border-color-lighter); background: var(--el-fill-color-lighter); border-radius: 10px; }
.run-summary div { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.run-summary span { font-size: 11px; color: var(--el-text-color-secondary); }
.run-summary strong { font-size: 13px; color: var(--el-text-color-primary); font-weight: 550; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.run-summary p { grid-column: 1/-1; margin: 0; font-size: 10px; line-height: 1.7; color: var(--el-text-color-regular); }
@media(max-width: 700px) { .run-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
