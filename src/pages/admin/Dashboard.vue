<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Refresh, User, UserFilled, Document, Warning } from '@element-plus/icons-vue'
import { getDashboardStats, getUserDistribution, getVisitTrend } from '@/api/dashboard'
import { isMockEnabled } from '@/config/mock'
import type { DashboardPeriod } from '@/types'
import LogTrend from './dashboard/LogTrend.vue'
import { useDashboardSection } from './dashboard/useDashboardSection'

defineOptions({ name: 'OperationsDashboard' })
const { t, locale } = useI18n()
const format = computed(() => new Intl.NumberFormat(locale.value))
const period = ref<DashboardPeriod>('week')
const stats = reactive(useDashboardSection(getDashboardStats))
const trend = reactive(useDashboardSection(() => getVisitTrend(period.value)))
const accounts = reactive(useDashboardSection(getUserDistribution))
const total = computed(() => accounts.data?.reduce((sum, row) => sum + row.value, 0) ?? 0)
const metrics = [
  { key: 'totalUsers', icon: UserFilled }, { key: 'newUsers', icon: User },
  { key: 'logCount', icon: Document }, { key: 'errorCount', icon: Warning },
] as const

function refresh() {
  return Promise.all([stats.load(), trend.load(), accounts.load()])
}
watch(period, trend.load)
onMounted(refresh)
</script>

<template>
  <div class="dashboard">
    <header class="heading">
      <div><h1>{{ t('dashboard.title') }}</h1><p>{{ t('dashboard.intro') }}</p></div>
      <div class="controls">
        <el-tag v-if="isMockEnabled()" type="info" effect="plain">{{ t('dashboard.source') }}</el-tag>
        <el-button :icon="Refresh" :loading="stats.loading || trend.loading || accounts.loading" @click="refresh">{{ t('dashboard.refresh') }}</el-button>
      </div>
    </header>
    <el-alert v-if="stats.failed" type="error" :closable="false" :title="t('dashboard.unavailable')" />
    <section class="metrics" :aria-busy="stats.loading">
      <article v-for="metric in metrics" :key="metric.key" class="metric">
        <div class="metric-label"><component :is="metric.icon" />{{ t('dashboard.' + metric.key) }}</div>
        <strong>{{ stats.data ? format.format(stats.data[metric.key]) : '—' }}</strong>
      </article>
    </section>
    <div class="panels">
      <section class="panel" :aria-busy="trend.loading">
        <header><h2>{{ t('dashboard.trend') }}</h2>
          <el-radio-group v-model="period" size="small" :aria-label="t('dashboard.trend')">
            <el-radio-button value="week">{{ t('dashboard.week') }}</el-radio-button>
            <el-radio-button value="month">{{ t('dashboard.month') }}</el-radio-button>
          </el-radio-group>
        </header>
        <p v-if="trend.loading" role="status">{{ t('dashboard.loading') }}</p>
        <p v-else-if="trend.failed">{{ t('dashboard.unavailable') }} <el-button link type="primary" @click="trend.load">{{ t('dashboard.retry') }}</el-button></p>
        <log-trend v-else-if="trend.data?.some(row => row.logCount > 0)" :rows="trend.data" />
        <el-empty v-else :image-size="54" :description="t('dashboard.empty')" />
      </section>
      <section class="panel" :aria-busy="accounts.loading">
        <header><h2>{{ t('dashboard.accounts') }}</h2></header>
        <p v-if="accounts.loading" role="status">{{ t('dashboard.loading') }}</p>
        <p v-else-if="accounts.failed">{{ t('dashboard.unavailable') }} <el-button link type="primary" @click="accounts.load">{{ t('dashboard.retry') }}</el-button></p>
        <ul v-else-if="total">
          <li v-for="row in accounts.data" :key="row.name">
            <div><span>{{ t('dashboard.' + row.name) }}</span><b>{{ format.format(row.value) }}</b></div>
            <el-progress :percentage="Math.round(row.value / total * 100)" :show-text="false" :status="row.name === 'active' ? 'success' : undefined" :aria-label="t('dashboard.' + row.name)" />
          </li>
        </ul>
        <el-empty v-else :image-size="54" :description="t('dashboard.empty')" />
      </section>
    </div>
  </div>
</template>

<style scoped>
.dashboard { display: grid; gap: 20px; max-width: 1480px; margin: 0 auto; color: var(--text-primary); }
.heading, .panel header, .controls, .metric-label, li div { display: flex; align-items: center; gap: 10px; }
.heading, .panel header, li div { justify-content: space-between; }
.heading { flex-wrap: wrap; padding: 8px 0; }
h1, h2, p { margin: 0; }
h1 { font-size: clamp(24px, 3vw, 34px); letter-spacing: -.03em; }
h2 { font-size: 18px; }
p { margin-top: 8px; color: var(--text-regular); }
.metrics, .panels { display: grid; gap: 16px; }
.metrics { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.panels { grid-template-columns: minmax(0, 2fr) minmax(220px, 1fr); align-items: start; }
.metric, .panel { background: var(--bg-color); border: 1px solid var(--border-light); border-radius: 14px; padding: clamp(16px, 2vw, 26px); }
.metric-label { color: var(--text-regular); font-size: 14px; }
.metric-label svg { width: 17px; color: var(--el-color-primary); }
.metric strong { display: block; margin-top: 14px; font-size: clamp(26px, 3vw, 38px); line-height: 1.15; font-variant-numeric: tabular-nums; }
.panel header { flex-wrap: wrap; gap: 12px; margin-bottom: 20px; }
.panel ul { list-style: none; margin: 0; padding: 0; }
.panel li + li { margin-top: 20px; }
li div { margin-bottom: 8px; font-size: 14px; }
@media (max-width: 840px) { .metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); } .panels { grid-template-columns: minmax(0, 1fr); } }
@media (prefers-reduced-motion: no-preference) {
  .metric, .panel { animation: reveal 280ms ease-out backwards; }
  .metric:nth-child(2) { animation-delay: 35ms; }
  .metric:nth-child(3) { animation-delay: 70ms; }
  .metric:nth-child(4) { animation-delay: 105ms; }
  @keyframes reveal { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
}
</style>
