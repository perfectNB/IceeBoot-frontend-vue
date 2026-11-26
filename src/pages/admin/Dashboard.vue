<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import AdminPageHeader from '@/components/common/AdminPageHeader.vue'
import AccountBreakdown from './dashboard/AccountBreakdown.vue'
import RecentErrors from './dashboard/RecentErrors.vue'
import { getLogs } from '@/api/log'
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
const router = useRouter()
const userStore = useUserStore()
const logPage = computed(() => {
  const route = router.getRoutes().find(item => item.name === 'LogManagement' || item.path === '/admin/monitor/log')
  if (!route || !userStore.hasPermission('monitor:log:list:api')) return undefined
  const required = route.meta.permissions
  if (Array.isArray(required) && required.length && !required.some(code => userStore.hasPermission(code))) return undefined
  return route.path
})
const recent = reactive(useDashboardSection(async () => (await getLogs({ pageNum: 1, pageSize: 5, level: 'ERROR' })).records))
const summary = computed(() => {
  const rows = trend.data ?? []
  const logs = rows.reduce((sum, row) => sum + row.logCount, 0)
  const errors = rows.reduce((sum, row) => sum + row.errorCount, 0)
  const peak = rows.reduce<(typeof rows)[number] | undefined>(
    (best, row) => !best || row.logCount > best.logCount ? row : best, undefined,
  )
  return { logs, rate: logs ? errors / logs : null, peak }
})
const metrics = [
  { key: 'totalUsers', icon: UserFilled }, { key: 'newUsers', icon: User },
  { key: 'logCount', icon: Document }, { key: 'errorCount', icon: Warning },
] as const

function refresh() {
  return Promise.all([stats.load(), trend.load(), accounts.load(), logPage.value ? recent.load() : undefined])
}
watch(period, trend.load)
onMounted(refresh)
</script>

<template>
  <div class="dashboard admin-page">
    <AdminPageHeader :title="t('dashboard.title')" :description="t('dashboard.intro')">
        <el-tag v-if="isMockEnabled()" type="info" effect="plain">{{ t('dashboard.source') }}</el-tag>
        <el-button :icon="Refresh" :loading="stats.loading || trend.loading || accounts.loading || recent.loading" @click="refresh">{{ t('dashboard.refresh') }}</el-button>
    </AdminPageHeader>
    <el-alert v-if="stats.failed" type="error" :closable="false" :title="t('dashboard.unavailable')" />
    <section class="metrics" :aria-busy="stats.loading">
      <article v-for="metric in metrics" :key="metric.key" class="metric admin-lift" :class="{ attention: metric.key === 'errorCount' && stats.data?.errorCount }">
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
        <template v-else-if="trend.data && summary.logs">
          <dl class="period-summary">
            <div><dt>{{ t('dashboard.periodLogs') }}</dt><dd>{{ format.format(summary.logs) }}</dd></div>
            <div><dt>{{ t('dashboard.errorShare') }}</dt><dd>{{ $n(summary.rate!, { style: 'percent', maximumFractionDigits: 1 }) }}</dd></div>
            <div v-if="summary.peak"><dt>{{ t('dashboard.peakDay') }}</dt><dd>{{ summary.peak.date.slice(5) }} <small>{{ t('dashboard.events', { count: format.format(summary.peak.logCount) }) }}</small></dd></div>
          </dl>
          <log-trend :rows="trend.data" />
        </template>
        <el-empty v-else :image-size="54" :description="t('dashboard.empty')" />
      </section>
      <section class="panel" :aria-busy="accounts.loading">
        <header><h2>{{ t('dashboard.accounts') }}</h2></header>
        <p v-if="accounts.loading" role="status">{{ t('dashboard.loading') }}</p>
        <p v-else-if="accounts.failed">{{ t('dashboard.unavailable') }} <el-button link type="primary" @click="accounts.load">{{ t('dashboard.retry') }}</el-button></p>
        <AccountBreakdown v-else :rows="accounts.data ?? []" />
      </section>
    </div>
    <RecentErrors v-if="logPage" :rows="recent.data" :loading="recent.loading" :failed="recent.failed"
      :log-page="logPage" @retry="recent.load" />
  </div>
</template>

<style scoped>
.dashboard { display: grid; gap: 16px; color: var(--el-text-color-primary); }
.dashboard .admin-heading { margin: 0 0 2px; }
.metrics, .panels { display: grid; gap: 14px; }
.metrics { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.panels { grid-template-columns: minmax(0, 2.2fr) minmax(220px, 1fr); }
.metric, .panel { min-width: 0; border: 1px solid var(--admin-line); border-radius: var(--admin-radius); background: var(--admin-surface); box-shadow: var(--admin-shadow); }
.metric { padding: 16px 18px; }
.metric-label { display: flex; align-items: center; gap: 9px; color: var(--el-text-color-regular); font-size: 13px; }
.metric-label svg { width: 30px; height: 30px; padding: 7px; border-radius: 9px; color: var(--el-color-primary); background: var(--el-color-primary-light-9); }
.metric.attention .metric-label svg { color: var(--el-color-danger); background: var(--el-color-danger-light-9); }
.metric strong { display: block; margin-top: 10px; font-size: clamp(26px, 3vw, 34px); font-weight: 640; line-height: 1.1; font-variant-numeric: tabular-nums; }
.panel { padding: clamp(16px, 2vw, 24px); }
.panel > header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; }
.panel :deep(h2) { margin: 0; font-size: 17px; line-height: 1.5; font-weight: 650; }
.panel > p { color: var(--el-text-color-regular); }
.period-summary { display: flex; flex-wrap: wrap; gap: 12px 24px; padding-bottom: 14px; margin: 0 0 14px; border-bottom: 1px solid var(--el-border-color-lighter); }
.period-summary dt, dd small { color: var(--el-text-color-regular); font-size: 12px; font-weight: 400; }
.period-summary dd { margin: 3px 0 0; font-size: 17px; font-weight: 620; font-variant-numeric: tabular-nums; }
@media (max-width: 840px) {
  .metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .panels { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 480px) {
  .metrics, .panels { gap: 10px; }
  .metric { padding: 12px; }
  .period-summary { gap: 10px 14px; }
}
</style>
