<script setup lang="ts">
import type { UsageRow } from '@/api/agentConsole'
import { costText, reportedTokens, totalTokens } from '@/utils/agentUsage'
defineProps<{ rows: UsageRow[]; daily?: boolean }>()
</script>
<template>
  <div class="table-scroll">
    <table>
      <caption>{{ daily ? '按日汇总' : '按模型汇总' }}</caption>
      <thead><tr><th>{{ daily ? '日期' : '模型 / 供应商' }}</th><th>输入</th><th>缓存命中</th><th>缓存写入</th><th>输出</th><th>合计</th><th>预估费用</th></tr></thead>
      <tbody>
        <tr v-for="row in rows" :key="JSON.stringify([row.label, row.provider])">
          <th scope="row">{{ row.label }}<small v-if="!daily">{{ row.provider || '供应商未记录' }}</small></th>
          <td>{{ reportedTokens(row, row.inputTokens) }}</td><td>{{ reportedTokens(row, row.cachedTokens) }}</td>
          <td>{{ reportedTokens(row, row.cacheWriteTokens) }}</td><td>{{ reportedTokens(row, row.outputTokens) }}</td>
          <td>{{ reportedTokens(row, totalTokens(row)) }}</td><td>{{ costText(row.costCny) }}<small v-if="row.pricedCalls > 0 && row.pricedCalls < row.calls">部分计价</small></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<style scoped>
.table-scroll { overflow-x: auto; margin-top: 18px; }
table { width: 100%; border-collapse: collapse; font-size: 13px; font-variant-numeric: tabular-nums; }
caption { text-align: left; padding-bottom: 10px; font-weight: 650; color: var(--el-text-color-primary); }
th, td { padding: 9px 10px; border-bottom: 1px solid var(--el-border-color-lighter); text-align: right; white-space: nowrap; }
thead { color: var(--el-text-color-secondary); background: var(--el-fill-color-light); }
th { font-weight: 550; }
th:first-child { text-align: left; }
small { display: block; font-weight: 400; color: var(--el-text-color-secondary); }
</style>
