<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { ArrowDown, Close, DataLine, Refresh } from '@element-plus/icons-vue'
import { agentConsole, type UsageOverview, type UsagePeriod, type UsageRow } from '@/api/agentConsole'
import { costText, reportedTokens, sumUsage, totalTokens } from '@/utils/agentUsage'
import UsageDetailTable from './UsageDetailTable.vue'

const periods = { TODAY: '今日', MONTH: '本月', ALL: '累计' } as const
const visible = ref(false)
const period = ref<UsagePeriod>('MONTH')
const view = ref<'models' | 'trend'>('models')
const details = ref(false)
const expanded = ref(false)
const data = ref<UsageOverview>()
const monthly = ref<UsageRow>()
const loading = ref(false)
const failed = ref(false)
let revision = 0
let latestMonthRequest = 0

async function refresh() {
  const current = ++revision
  const requested = period.value
  if (requested === 'MONTH') latestMonthRequest = current
  loading.value = true
  failed.value = false
  try {
    const response = await agentConsole.usageOverview(requested)
    if (requested === 'MONTH' && current === latestMonthRequest) monthly.value = sumUsage(response.models)
    if (current === revision) data.value = response
  } catch {
    if (current === revision) failed.value = true
  } finally {
    if (current === revision) loading.value = false
  }
}
watch(period, () => {
  expanded.value = false
  data.value = undefined
  void refresh()
})
watch(visible, open => {
  if (!open) details.value = false
  else if (!loading.value && (!data.value || failed.value)) void refresh()
})
onMounted(refresh)
const summary = computed(() => sumUsage(data.value?.models ?? []))
const shown = computed(() => expanded.value ? data.value?.models : data.value?.models.slice(0, 6))
const modelMax = computed(() => Math.max(1, totalTokens(data.value?.models[0] ?? summary.value)))
const days = computed(() => {
  if (!data.value) return []
  const end = new Date(data.value.updatedAt.slice(0, 10) + 'T00:00:00Z')
  if (Number.isNaN(end.getTime())) return data.value.days
  const count = period.value === 'ALL' ? 30 : period.value === 'MONTH' ? end.getUTCDate() : 1
  const records = new Map(data.value.days.map(row => [row.label, row]))
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(end.getTime() - (count - i - 1) * 86400000).toISOString().slice(0, 10)
    return records.get(date) ?? sumUsage([], date)
  })
})
const dayMax = computed(() => Math.max(1, ...days.value.map(totalTokens)))
const width = (n: number, max: number) => (n * 100 / max) + '%'
const breakdown = [
  ['输入', 'inputTokens'], ['输出', 'outputTokens'], ['缓存命中', 'cachedTokens'], ['缓存写入', 'cacheWriteTokens'],
] as const
</script>

<template>
  <el-popover v-model:visible="visible" placement="bottom-end" trigger="click" :show-arrow="false"
    :width="details ? 'min(960px, calc(100vw - 24px))' : 'min(570px, calc(100vw - 24px))'"
    :popper-style="{ padding: '0', borderRadius: '14px' }">
    <template #reference>
      <el-button class="usage-trigger" :icon="DataLine" aria-label="本月消耗，查看用量概览" :aria-expanded="visible">
        本月消耗 <b>{{ monthly ? reportedTokens(monthly, totalTokens(monthly), true) : '—' }}</b> Token
        <span v-if="monthly?.costCny != null" class="trigger-cost">{{ monthly.pricedCalls < monthly.calls ? '已计价 ' : '约 ' }}{{ costText(monthly.costCny) }}</span>
        <el-icon><ArrowDown /></el-icon>
      </el-button>
    </template>
    <section class="usage-panel" aria-label="全部智能体用量概览" @keydown.esc="visible = false">
      <header class="usage-head">
        <h2>用量概览</h2>
        <el-radio-group v-model="period" size="small" aria-label="统计周期">
          <el-radio-button v-for="(name, key) in periods" :key="key" :value="key">{{ name }}</el-radio-button>
        </el-radio-group>
        <el-button text circle :icon="Refresh" :loading="loading" aria-label="刷新用量" @click="refresh" />
        <el-button text circle :icon="Close" aria-label="关闭用量概览" @click="visible = false" />
      </header>
      <div class="usage-body" :aria-busy="loading">
        <p v-if="failed" role="alert">用量加载失败。<el-button link type="primary" @click="refresh">重试</el-button></p>
        <p v-else-if="!data" role="status">正在读取用量…</p>
        <template v-else>
          <div class="figures">
            <div><small>{{ periods[period] }} Token</small><strong>{{ reportedTokens(summary, totalTokens(summary)) }}</strong></div>
            <div><small>预估费用（CNY）</small><strong>{{ costText(summary.costCny) }}</strong></div>
          </div>
          <div class="breakdown">
            <span v-for="[label, field] in breakdown" :key="field">{{ label }} <b>{{ reportedTokens(summary, summary[field]) }}</b></span>
          </div>
          <div class="footnote">
            <span v-if="summary.knownCalls < summary.calls">{{ summary.calls - summary.knownCalls }} 次调用未返回用量</span>
            <span v-if="summary.pricedCalls < summary.calls">已计价 {{ summary.pricedCalls }} / {{ summary.calls }} 次</span>
            <time :datetime="data.updatedAt">更新于 {{ data.updatedAt.replace('T', ' ').slice(0, 16) }}</time>
          </div>
          <nav class="controls" aria-label="用量视图">
            <template v-if="!details">
              <button v-for="tab in (['models', 'trend'] as const)" :key="tab" :aria-pressed="view === tab" @click="view = tab">{{ tab === 'models' ? '模型分布' : '每日趋势' }}</button>
            </template>
            <b v-else>{{ periods[period] }}用量明细</b>
            <el-button link type="primary" @click="details = !details">{{ details ? '返回图表' : '查看明细 ›' }}</el-button>
          </nav>
          <p v-if="!data.models.length" class="empty">该时段暂无模型调用记录</p>
          <template v-else-if="details">
            <p class="note">输入已含缓存用量。缓存仅汇总可确认的数量，缺少记录以「—」显示。</p>
            <UsageDetailTable :rows="data.models" />
            <UsageDetailTable :rows="days" daily />
          </template>
          <template v-else>
            <div class="legend"><span>{{ view === 'models' ? data.models.length + ' 个模型 / 供应商' : (period === 'ALL' ? '近 30 天' : periods[period]) }}</span><i />输入<i class="output" />输出</div>
            <template v-if="view === 'models'">
              <div v-for="row in shown" :key="JSON.stringify([row.label, row.provider])" class="model-row">
                <div class="model-name"><b :title="row.label">{{ row.label }}</b><small>{{ row.provider || '供应商未记录' }}</small></div>
                <div class="bars" aria-hidden="true"><i :style="{ width: width(row.inputTokens, modelMax) }" /><i class="output" :style="{ width: width(row.outputTokens, modelMax) }" /></div>
                <span>{{ reportedTokens(row, totalTokens(row), true) }} <small>{{ totalTokens(summary) ? (100 * totalTokens(row) / totalTokens(summary)).toFixed(1) + '%' : '—' }}</small></span>
              </div>
              <el-button v-if="data.models.length > 6" link type="primary" @click="expanded = !expanded">{{ expanded ? '收起' : '展开其余 ' + (data.models.length - 6) + ' 个模型' }}</el-button>
            </template>
            <template v-else>
              <div class="day-chart" aria-label="每日输入与输出 Token">
                <div v-for="row in days" :key="row.label" :title="row.label + ' · 输入 ' + reportedTokens(row, row.inputTokens) + ' · 输出 ' + reportedTokens(row, row.outputTokens)">
                  <i class="output" :style="{ height: width(row.outputTokens, dayMax) }" /><i :style="{ height: width(row.inputTokens, dayMax) }" />
                </div>
              </div>
              <div class="axis"><span>{{ days[0]?.label }}</span><span v-if="days.length > 1">{{ days[days.length - 1]?.label }}</span></div>
            </template>
          </template>
        </template>
      </div>
    </section>
  </el-popover>
</template>

<style scoped>
.usage-trigger b { margin: 0 4px; }
.usage-trigger .el-icon { margin-left: 5px; }
.trigger-cost { border-left: 1px solid var(--el-border-color); margin-left: 8px; padding-left: 8px; }
.usage-panel { --input: #377de8; --output: #9760d9; color: var(--el-text-color-primary); font-variant-numeric: tabular-nums; }
.usage-head, .controls, .legend, .breakdown, .axis, .footnote { display: flex; align-items: center; gap: 10px; }
.usage-head { padding: 16px 18px 8px; flex-wrap: wrap; gap: 5px; }
.usage-head h2 { font-size: 16px; margin: 0 auto 0 0; }
.usage-head .el-button { margin: 0; }
.usage-body { padding: 12px 18px 18px; max-height: min(67vh, 650px); overflow: auto; }
.figures { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.figures strong { display: block; font-size: clamp(19px, 2vw, 25px); line-height: 1.5; overflow-wrap: anywhere; }
small, .note, .footnote, .axis, .legend, .breakdown { color: var(--el-text-color-secondary); font-size: 12px; }
.breakdown, .footnote { flex-wrap: wrap; margin-top: 12px; gap: 4px 14px; }
.breakdown b { color: var(--el-text-color-regular); }
.footnote time { margin-left: auto; }
.controls { margin: 16px 0 12px; border-bottom: 1px solid var(--el-border-color-light); min-height: 35px; }
.controls button:not(.el-button) { align-self: stretch; font: inherit; border: 0; border-bottom: 2px solid transparent; color: var(--el-text-color-secondary); background: transparent; cursor: pointer; }
.controls button[aria-pressed=true] { color: var(--el-color-primary); border-bottom-color: currentColor; }
.controls .el-button { margin-left: auto; }
.legend { gap: 5px; }
.legend span { margin-right: auto; }
.legend i, .bars i, .day-chart i { background: var(--input); display: block; }
.legend i { width: 8px; height: 8px; border-radius: 50%; margin-left: 6px; }
.usage-panel .output { background: var(--output); }
.model-row { display: grid; grid-template-columns: minmax(85px, 1fr) minmax(40px, 1.45fr) auto; gap: 12px; align-items: center; margin: 14px 0; font-size: 13px; }
.model-name b, .model-name small { display: block; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.model-row span small { margin-left: 3px; }
.bars { height: 10px; display: flex; border-radius: 3px; overflow: hidden; }
.day-chart { display: flex; align-items: stretch; height: 120px; gap: 3px; margin-top: 12px; border-bottom: 1px solid var(--el-border-color); background: repeating-linear-gradient(to top, transparent 0 29px, var(--el-border-color-lighter) 29px 30px); }
.day-chart div { display: flex; flex: 1; max-width: 34px; flex-direction: column; justify-content: flex-end; }
.axis { justify-content: space-between; padding-top: 5px; }
.empty { color: var(--el-text-color-secondary); padding: 20px; text-align: center; }
</style>
