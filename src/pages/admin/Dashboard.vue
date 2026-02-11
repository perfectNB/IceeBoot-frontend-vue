<template>
  <div class="admin-dashboard">
    <div class="dashboard-header">
      <h1 class="page-title">{{ t('dashboard.pageTitle') }}</h1>
      <p class="page-description">{{ t('dashboard.pageDescription') }}</p>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card" v-for="stat in stats" :key="stat.title">
        <div class="stat-icon">
          <el-icon><component :is="stat.icon" /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-title">{{ stat.title }}</div>
          <div class="stat-trend" :class="stat.trend > 0 ? 'positive' : 'negative'">
            <el-icon>
              <component :is="stat.trend > 0 ? 'TrendCharts' : 'Bottom'" />
            </el-icon>
            <span>{{ Math.abs(stat.trend) }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-section">
      <div class="chart-row">
        <div class="chart-card">
          <div class="card-header">
            <h3>{{ t('dashboard.charts.visitTrend') }}</h3>
            <el-button-group>
              <el-button
                v-for="period in periods"
                :key="period.value"
                :type="activePeriod === period.value ? 'primary' : ''"
                @click="activePeriod = period.value"
                size="small"
              >
                {{ period.label }}
              </el-button>
            </el-button-group>
          </div>
          <div class="chart-content">
            <VChart :option="visitTrendOption" :loading="loading" autoresize />
          </div>
        </div>

        <div class="chart-card">
          <div class="card-header">
            <h3>{{ t('dashboard.charts.userDistribution') }}</h3>
          </div>
          <div class="chart-content">
            <VChart :option="userDistributionOption" :loading="loading" autoresize />
          </div>
        </div>
      </div>
    </div>

    <!-- 快捷操作 -->
    <div class="quick-actions">
      <div class="section-header">
        <h3>{{ t('dashboard.quickActions.title') }}</h3>
      </div>
      <div class="actions-grid">
        <div
          class="action-item"
          v-for="action in quickActions"
          :key="action.title"
          @click="handleQuickAction(action)"
        >
          <div class="action-icon">
            <el-icon><component :is="action.icon" /></el-icon>
          </div>
          <div class="action-content">
            <div class="action-title">{{ action.title }}</div>
            <div class="action-description">{{ action.description }}</div>
          </div>
          <el-icon class="action-arrow"><ArrowRight /></el-icon>
        </div>
      </div>
    </div>

    <!-- 最近活动 -->
    <div class="recent-activities">
      <div class="section-header">
        <h3>{{ t('dashboard.recentActivities.title') }}</h3>
        <el-button text @click="viewAllActivities">{{ t('dashboard.recentActivities.viewAll') }}</el-button>
      </div>
      <div class="activities-list">
        <div
          class="activity-item"
          v-for="activity in recentActivities"
          :key="activity.id"
        >
          <div class="activity-avatar">
            <el-avatar :size="32" :src="activity.avatar">
              {{ activity.user.charAt(0) }}
            </el-avatar>
          </div>
          <div class="activity-content">
            <div class="activity-text">
              <strong>{{ activity.user }}</strong> {{ activity.action }}
            </div>
            <div class="activity-time">{{ activity.time }}</div>
          </div>
          <div class="activity-type">
            <el-tag :type="getActivityType(activity.type)" size="small">
              {{ activity.type }}
            </el-tag>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'AdminDashboard' })

import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import {
  ArrowRight
} from '@element-plus/icons-vue'
import { getDashboardStats, getVisitTrend, getUserDistribution } from '@/api'
import type { DashboardStats, VisitTrend, UserDistribution } from '@/types'
import { isDark } from '@/utils/theme'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart as EChartsPieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'

use([
  CanvasRenderer,
  LineChart,
  EChartsPieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

const router = useRouter()
const { t } = useI18n()

const getCssVarValue = (name: string) => {
  if (typeof window === 'undefined') {
    return ''
  }
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

const chartBorderColor = computed(() => {
  const color = getCssVarValue('--bg-color')
  if (color) {
    return color
  }
  return isDark.value ? '#1f1f1f' : '#fff'
})

// 响应式数据
const dashboardStats = ref<DashboardStats>({
  totalUsers: 0,
  todayVisits: 0,
  totalArticles: 0,
  systemStatus: t('dashboard.stats.statusNormal'),
  userGrowth: 0,
  visitGrowth: 0,
  articleGrowth: 0
})

const visitTrendData = ref<VisitTrend[]>([])
const userDistributionData = ref<UserDistribution[]>([])
const loading = ref(false)

// 统计数据（基于API数据）
const stats = computed(() => [
  {
    title: t('dashboard.stats.totalUsers'),
    value: dashboardStats.value.totalUsers.toLocaleString(),
    icon: 'User',
    trend: dashboardStats.value.userGrowth
  },
  {
    title: t('dashboard.stats.todayVisits'),
    value: dashboardStats.value.todayVisits.toLocaleString(),
    icon: 'DataAnalysis',
    trend: dashboardStats.value.visitGrowth
  },
  {
    title: t('dashboard.stats.totalArticles'),
    value: dashboardStats.value.totalArticles.toLocaleString(),
    icon: 'Document',
    trend: dashboardStats.value.articleGrowth
  },
  {
    title: t('dashboard.stats.systemStatus'),
    value: dashboardStats.value.systemStatus,
    icon: 'Setting',
    trend: 0
  }
])

// 时间周期
const periods = computed(() => [
  { label: t('dashboard.periods.today'), value: 'today' },
  { label: t('dashboard.periods.week'), value: 'week' },
  { label: t('dashboard.periods.month'), value: 'month' },
  { label: t('dashboard.periods.year'), value: 'year' }
])

const activePeriod = ref('week')

// 快捷操作
const quickActions = computed(() => [
  {
    title: t('dashboard.quickActions.createArticle'),
    description: t('dashboard.quickActions.createArticleDesc'),
    icon: 'Plus',
    action: 'create-article'
  },
  {
    title: t('dashboard.quickActions.userManagement'),
    description: t('dashboard.quickActions.userManagementDesc'),
    icon: 'User',
    action: 'user-management'
  },
  {
    title: t('dashboard.quickActions.systemSettings'),
    description: t('dashboard.quickActions.systemSettingsDesc'),
    icon: 'Setting',
    action: 'system-settings'
  },
  {
    title: t('dashboard.quickActions.dataAnalysis'),
    description: t('dashboard.quickActions.dataAnalysisDesc'),
    icon: 'DataAnalysis',
    action: 'data-analysis'
  }
])

// 最近活动
const recentActivities = computed(() => [
  {
    id: 1,
    user: t('dashboard.activities.user1'),
    action: t('dashboard.activities.action1'),
    time: t('dashboard.activities.time1'),
    type: t('dashboard.recentActivities.types.create'),
    avatar: ''
  },
  {
    id: 2,
    user: t('dashboard.activities.user2'),
    action: t('dashboard.activities.action2'),
    time: t('dashboard.activities.time2'),
    type: t('dashboard.recentActivities.types.update'),
    avatar: ''
  },
  {
    id: 3,
    user: t('dashboard.activities.user3'),
    action: t('dashboard.activities.action3'),
    time: t('dashboard.activities.time3'),
    type: t('dashboard.recentActivities.types.delete'),
    avatar: ''
  },
  {
    id: 4,
    user: t('dashboard.activities.user4'),
    action: t('dashboard.activities.action4'),
    time: t('dashboard.activities.time4'),
    type: t('dashboard.recentActivities.types.login'),
    avatar: ''
  }
])

// 处理快捷操作
const handleQuickAction = (action: { action: string }) => {
  switch (action.action) {
    case 'create-article':
      router.push('/admin/content/article/create')
      break
    case 'user-management':
      router.push('/admin/system/user')
      break
    case 'system-settings':
      router.push('/admin/system/settings')
      break
    case 'data-analysis':
      router.push('/admin/statistics')
      break
    default:
      ElMessage.info(t('dashboard.messages.featureInDevelopment'))
  }
}

// 查看全部活动
const viewAllActivities = () => {
  router.push('/admin/activities')
}

// 获取活动类型样式
const getActivityType = (type: string) => {
  const typeMap: Record<string, string> = {
    [t('dashboard.recentActivities.types.create')]: 'success',
    [t('dashboard.recentActivities.types.update')]: 'warning',
    [t('dashboard.recentActivities.types.delete')]: 'danger',
    [t('dashboard.recentActivities.types.login')]: 'info'
  }
  return typeMap[type] || 'info'
}

// 加载统计数据
const loadDashboardStats = async () => {
  try {
    loading.value = true
    const response = await getDashboardStats()
    dashboardStats.value = response
  } catch (error) {
    console.error('加载统计数据失败:', error)
    ElMessage.error(t('dashboard.messages.loadStatsFailed'))
  } finally {
    loading.value = false
  }
}

// 加载访问趋势数据
const loadVisitTrend = async () => {
  try {
    const response = await getVisitTrend(activePeriod.value)
    visitTrendData.value = response
  } catch (error) {
    console.error('加载访问趋势数据失败:', error)
    ElMessage.error(t('dashboard.messages.loadVisitTrendFailed'))
  }
}

// 加载用户分布数据
const loadUserDistribution = async () => {
  try {
    const response = await getUserDistribution()
    userDistributionData.value = response
  } catch (error) {
    console.error('加载用户分布数据失败:', error)
    ElMessage.error(t('dashboard.messages.loadUserDistributionFailed'))
  }
}

// 初始化数据
const initData = async () => {
  await Promise.all([
    loadDashboardStats(),
    loadVisitTrend(),
    loadUserDistribution()
  ])
}

// 访问趋势图表配置
const visitTrendOption = computed(() => ({
  title: {
    show: false
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'cross'
    }
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: visitTrendData.value.map(item => item.date)
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      name: t('dashboard.charts.visits'),
      type: 'line',
      stack: 'Total',
      smooth: true,
      lineStyle: {
        color: '#409EFF'
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            {
              offset: 0,
              color: 'rgba(64, 158, 255, 0.3)'
            },
            {
              offset: 1,
              color: 'rgba(64, 158, 255, 0.05)'
            }
          ]
        }
      },
      data: visitTrendData.value.map(item => item.visits)
    }
  ]
}))

// 用户分布饼图配置
const userDistributionOption = computed(() => ({
  title: {
    show: false
  },
  tooltip: {
    trigger: 'item',
    formatter: '{a} <br/>{b}: {c} ({d}%)'
  },
  legend: {
    orient: 'vertical',
    left: 'left'
  },
  series: [
    {
      name: t('dashboard.charts.userDistribution'),
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: chartBorderColor.value,
        borderWidth: 2
      },
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 20,
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      data: userDistributionData.value.map(item => ({
         value: item.value,
         name: item.name
       }))
    }
  ]
}))

// 组件挂载时加载数据
onMounted(() => {
  initData()
})
</script>

<style scoped lang="scss">
.admin-dashboard {
  padding: 0;
}

/* AdminDashboard component styles */

.dashboard-header {
  margin-bottom: 24px;

  .page-title {
    font-size: 24px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 8px 0;
  }

  .page-description {
    color: var(--text-secondary);
    margin: 0;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: var(--bg-color);
  border: 1px solid var(--border-lighter);
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all var(--transition-duration);

  &:hover {
    box-shadow: var(--box-shadow-light);
    transform: translateY(-2px);
  }
}

.stat-icon {
  width: 48px;
  height: 48px;
  background: var(--primary-extra-light);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;

  .el-icon {
    font-size: 24px;
    color: var(--primary-color);
  }
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1;
  margin-bottom: 4px;
}

.stat-title {
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 4px;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;

  &.positive {
    color: var(--success-color);
  }

  &.negative {
    color: var(--danger-color);
  }

  .el-icon {
    font-size: 12px;
  }
}

.charts-section {
  margin-bottom: 24px;
}

.chart-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.chart-card {
  background: var(--bg-color);
  border: 1px solid var(--border-lighter);
  border-radius: 8px;
  overflow: hidden;
}

.card-header {
  padding: 20px;
  border-bottom: 1px solid var(--border-lighter);
  display: flex;
  align-items: center;
  justify-content: space-between;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
  }
}

.chart-content {
  padding: 20px;
  height: 300px;
}

.mock-chart {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-placeholder {
  text-align: center;
  color: var(--text-secondary);

  .el-icon {
    font-size: 48px;
    margin-bottom: 12px;
  }

  p {
    margin: 0 0 8px 0;
    font-size: 16px;
  }

  small {
    font-size: 12px;
    opacity: 0.7;
  }
}

.quick-actions,
.recent-activities {
  background: var(--bg-color);
  border: 1px solid var(--border-lighter);
  border-radius: 8px;
  margin-bottom: 24px;
}

.section-header {
  padding: 20px;
  border-bottom: 1px solid var(--border-lighter);
  display: flex;
  align-items: center;
  justify-content: space-between;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
  }
}

.actions-grid {
  padding: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border: 1px solid var(--border-lighter);
  border-radius: 6px;
  cursor: pointer;
  transition: all var(--transition-duration);

  &:hover {
    background: var(--bg-color-page);
    border-color: var(--primary-color);
  }
}

.action-icon {
  width: 40px;
  height: 40px;
  background: var(--primary-extra-light);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;

  .el-icon {
    font-size: 20px;
    color: var(--primary-color);
  }
}

.action-content {
  flex: 1;
}

.action-title {
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.action-description {
  font-size: 12px;
  color: var(--text-secondary);
}

.action-arrow {
  color: var(--text-placeholder);
  font-size: 14px;
}

.activities-list {
  padding: 20px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-extra-light);

  &:last-child {
    border-bottom: none;
  }
}

.activity-avatar {
  flex-shrink: 0;
}

.activity-content {
  flex: 1;
}

.activity-text {
  color: var(--text-primary);
  font-size: 14px;
  margin-bottom: 4px;
}

.activity-time {
  color: var(--text-secondary);
  font-size: 12px;
}

.activity-type {
  flex-shrink: 0;
}

// 响应式设计
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .chart-row {
    grid-template-columns: 1fr;
  }

  .actions-grid {
    grid-template-columns: 1fr;
  }
}
</style>
