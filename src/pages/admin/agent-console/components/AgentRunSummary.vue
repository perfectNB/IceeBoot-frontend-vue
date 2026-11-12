<script setup lang="ts">
import { computed } from 'vue'
import type { AgentProgress } from '@/api/agentConsole'
import { runMetrics, formatDuration } from './runMetrics'
const props = defineProps<{ events: AgentProgress[] }>()
const metrics = computed(() => runMetrics(props.events))
const description = computed(() => '模型与工具耗时按各次调用累计，含子智能体，可能并行。Token 按输入 / 输出显示。'
  + (metrics.value.firstTokenMs == null ? '' : `首次模型内容等待 ${formatDuration(metrics.value.firstTokenMs)}。`))
</script>
<template>
  <footer v-if="events.length" class="run-summary" aria-label="本轮耗时与模型用量">
    <span>环境 <b>{{ metrics.environmentMs == null ? '—' : formatDuration(metrics.environmentMs) }}</b></span>
    <span>模型 <b>{{ metrics.modelCalls ? formatDuration(metrics.modelMs) : '—' }}</b><small>· {{ metrics.modelCalls }}次</small></span>
    <span>工具 <b>{{ metrics.toolCalls }}次</b><small v-if="metrics.toolCalls">· {{ formatDuration(metrics.toolMs) }}</small></span>
    <span>Token <b>{{ metrics.usageKnown ? `${metrics.inputTokens.toLocaleString()} / ${metrics.outputTokens.toLocaleString()}` : '未完整返回' }}</b></span>
    <el-tooltip :content="description" placement="top" :show-after="200">
      <button class="metrics-info" type="button" :aria-label="description">ⓘ</button>
    </el-tooltip>
  </footer>
</template>
<style scoped>
.run-summary { display: flex; align-items: center; flex-wrap: wrap; gap: 3px 14px; margin: 7px 2px 0; padding: 0; color: var(--el-text-color-secondary); font-size: 11px; line-height: 1.8; font-variant-numeric: tabular-nums; }
.run-summary > span { display: inline-flex; align-items: baseline; gap: 4px; white-space: nowrap; }
.run-summary b { color: var(--el-text-color-regular); font-weight: 400; }
.run-summary small { font-size: inherit; }
.metrics-info { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; padding: 0; border: 0; border-radius: 4px; background: transparent; color: inherit; font: inherit; cursor: help; }
.metrics-info:hover, .metrics-info:focus-visible { color: var(--el-text-color-primary); background: var(--el-fill-color-light); }
.metrics-info:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 1px; }
@media(max-width: 640px) { .run-summary { gap: 2px 10px; font-size: 10px; } }
</style>
