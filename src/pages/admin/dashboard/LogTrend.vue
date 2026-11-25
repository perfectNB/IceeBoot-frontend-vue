<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { VisitTrend } from '@/types'
import { isDark } from '@/utils/theme'

use([LineChart, GridComponent, TooltipComponent, CanvasRenderer])
const props = defineProps<{ rows: VisitTrend[] }>()
const { t } = useI18n()
const option = computed(() => {
  const ink = isDark.value ? '#bdbdbd' : '#555e68'
  return {
    animation: false,
    grid: { left: 8, right: 16, top: 16, bottom: 8, containLabel: true },
    tooltip: { trigger: 'axis', renderMode: 'richText', confine: true },
    xAxis: { type: 'category', boundaryGap: false, data: props.rows.map(row => row.date.slice(5)), axisLabel: { color: ink }, axisTick: { show: false } },
    yAxis: { type: 'value', minInterval: 1, axisLabel: { color: ink }, splitLine: { lineStyle: { color: isDark.value ? '#353535' : '#e4e8ed', type: 'dashed' } } },
    series: [
      { name: t('dashboard.allLogs'), type: 'line', data: props.rows.map(row => row.logCount), showSymbol: false, itemStyle: { color: '#3277d8' }, areaStyle: { opacity: 0.08 } },
      { name: t('dashboard.errors'), type: 'line', data: props.rows.map(row => row.errorCount), showSymbol: false, lineStyle: { type: 'dashed' }, itemStyle: { color: '#cb7042' } },
    ],
  }
})
</script>

<template>
  <div>
    <div class="legend"><span>{{ t('dashboard.allLogs') }}</span><span>{{ t('dashboard.errors') }}</span></div>
    <v-chart class="chart" :option="option" autoresize aria-hidden="true" />
    <details>
      <summary>{{ t('dashboard.details') }}</summary>
      <table><thead><tr><th>{{ t('dashboard.date') }}</th><th>{{ t('dashboard.allLogs') }}</th><th>{{ t('dashboard.errors') }}</th></tr></thead>
        <tbody><tr v-for="row in rows" :key="row.date"><td>{{ row.date }}</td><td>{{ row.logCount }}</td><td>{{ row.errorCount }}</td></tr></tbody>
      </table>
    </details>
  </div>
</template>

<style scoped>
.chart { height: 218px; width: 100%; }
.legend { display: flex; gap: 18px; font-size: 13px; color: var(--text-regular); }
.legend span::before { content: ''; display: inline-block; width: 16px; margin-right: 6px; vertical-align: middle; border-top: 2px solid #3277d8; }
.legend span + span::before { border-top: 2px dashed #cb7042; }
details { margin-top: 12px; font-size: 13px; color: var(--text-regular); }
summary { cursor: pointer; width: fit-content; }
table { width: 100%; border-collapse: collapse; margin-top: 8px; font-variant-numeric: tabular-nums; }
td, th { padding: 6px; text-align: right; border-bottom: 1px solid var(--border-light); }
td:first-child, th:first-child { text-align: left; }
</style>
