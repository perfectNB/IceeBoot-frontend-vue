<script setup lang="ts">
import { computed } from 'vue'
import type { AgentProgress } from '@/api/agentConsole'
import { runMetrics, formatDuration } from './runMetrics'
const props = defineProps<{ events: AgentProgress[] }>()
const metrics = computed(() => runMetrics(props.events))
const description = computed(() => '准备是首次模型调用前的总等待，包含上下文恢复、配置装配、沙箱与文件同步，并非单独的沙箱启动。模型与工具为累计调用耗时，含子智能体，可能并行。Token 为多次请求的输入 / 输出累计。'
  + (metrics.value.firstTokenMs == null ? '' : `模型请求发出至首个内容 ${formatDuration(metrics.value.firstTokenMs)}。`))
</script>
<template>
  <footer v-if="events.length" class="run-summary" aria-label="本轮耗时与模型用量">
    <el-popover placement="top-start" trigger="click" :width="310">
      <template #reference><button type="button" class="preparation-detail">准备 <b>{{ metrics.environmentMs == null ? '—' : formatDuration(metrics.environmentMs) }}</b><span aria-hidden="true">⌄</span><span class="sr-only">查看各阶段耗时</span></button></template>
      <div class="phase-breakdown"><strong>本轮耗时</strong><p v-if="metrics.totalMs != null">总耗时 <b>{{ formatDuration(metrics.totalMs) }}</b></p><p v-if="metrics.firstResponseMs != null">执行开始至首个模型内容 <b>{{ formatDuration(metrics.firstResponseMs) }}</b></p><p v-for="item in metrics.phases" :key="item.key">{{ item.title }}<b>{{ formatDuration(item.durationMs) }}{{ item.status === 'SUCCEEDED' ? '' : ' · 未完成' }}</b></p><small>恢复可能发生多次；装配和沙箱阶段可能包含恢复或文件同步，以上阶段不能直接相加。模型、工具和上下文整理的时间也可能重叠。</small></div>
    </el-popover>
    <span>模型 <b>{{ metrics.modelCalls ? formatDuration(metrics.modelMs) : '—' }}</b><small>· {{ metrics.modelCalls }}次</small></span>
    <span>工具 <b>{{ metrics.toolCalls }}次</b><small v-if="metrics.toolCalls">· {{ formatDuration(metrics.toolMs) }}</small></span>
    <span>Token <b>{{ metrics.usageKnown ? `${metrics.inputTokens.toLocaleString()} / ${metrics.outputTokens.toLocaleString()}` : '未完整返回' }}</b></span>
    <span v-if="metrics.modelCalls" :title="'缓存统计覆盖 ' + metrics.cache.coverage + ' 次模型请求'">缓存命中 <b>{{ metrics.cache.hits?.toLocaleString() ?? '未确认' }}</b><small v-if="metrics.cache.rate != null">· {{ metrics.cache.rate }}%</small></span>
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
.preparation-detail { display: inline-flex; align-items: baseline; gap: 4px; padding: 0; border: 0; color: inherit; background: transparent; font: inherit; cursor: pointer; text-decoration: underline dotted; text-underline-offset: 4px; }
.preparation-detail:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 3px; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.phase-breakdown { font-size: 12px; color: var(--el-text-color-regular); }
.phase-breakdown p { display: flex; justify-content: space-between; gap: 12px; margin: 9px 0; }
.phase-breakdown b { flex-shrink: 0; font-weight: 500; }
.phase-breakdown small { display: block; padding-top: 8px; border-top: 1px solid var(--el-border-color-lighter); line-height: 1.7; color: var(--el-text-color-secondary); }
.metrics-info { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; padding: 0; border: 0; border-radius: 4px; background: transparent; color: inherit; font: inherit; cursor: help; }
.metrics-info:hover, .metrics-info:focus-visible { color: var(--el-text-color-primary); background: var(--el-fill-color-light); }
.metrics-info:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 1px; }
@media(max-width: 640px) { .run-summary { gap: 2px 10px; font-size: 10px; } }
</style>
