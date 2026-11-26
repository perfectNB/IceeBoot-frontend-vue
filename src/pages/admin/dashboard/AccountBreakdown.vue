<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { UserDistribution } from '@/types'

const props = defineProps<{ rows: UserDistribution[] }>()
const { t, n } = useI18n()
const colors = { active: 'var(--el-color-primary)', inactive: 'var(--el-text-color-secondary)', other: 'var(--el-color-warning)' }
const total = computed(() => props.rows.reduce((sum, row) => sum + row.value, 0))
const enabled = computed(() => props.rows.find(row => row.name === 'active')?.value ?? 0)
const ring = computed(() => {
  let end = 0
  const stops = props.rows.map(row => {
    const start = end
    end += row.value / total.value * 100
    return colors[row.name] + ' ' + start + '% ' + end + '%'
  })
  return 'conic-gradient(' + stops.join(', ') + ')'
})
</script>
<template>
  <div v-if="total" class="breakdown">
    <div class="ring" :style="{ background: ring }">
      <div><strong>{{ n(enabled / total, { style: 'percent', maximumFractionDigits: 1 }) }}</strong><span>{{ t('dashboard.enabledShare') }}</span></div>
    </div>
    <ul>
      <li v-for="row in rows" :key="row.name">
        <span class="dot" :style="{ background: colors[row.name] }" aria-hidden="true"></span>
        <span>{{ t('dashboard.' + row.name) }}</span><b>{{ n(row.value) }}</b>
      </li>
    </ul>
  </div>
  <el-empty v-else :image-size="54" :description="t('dashboard.noAccounts')" />
</template>
<style scoped>
.breakdown { display: grid; justify-items: center; gap: 20px; }
.ring { width: 124px; aspect-ratio: 1; border-radius: 50%; display: grid; place-items: center; }
.ring > div { width: 100px; aspect-ratio: 1; border-radius: 50%; background: var(--el-bg-color); display: flex; flex-direction: column; align-items: center; justify-content: center; }
.ring strong { font-size: 24px; font-weight: 650; font-variant-numeric: tabular-nums; }
.ring span { font-size: 12px; color: var(--el-text-color-regular); }
ul { width: 100%; list-style: none; margin: 0; padding: 0; }
li { display: flex; align-items: center; gap: 8px; padding-block: 8px; font-size: 13px; }
li + li { border-top: 1px solid var(--el-border-color-lighter); }
.dot { width: 8px; height: 8px; border-radius: 50%; }
b { margin-inline-start: auto; font-variant-numeric: tabular-nums; }
</style>
