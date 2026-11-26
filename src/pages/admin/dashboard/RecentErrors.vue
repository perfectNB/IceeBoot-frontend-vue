<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ArrowRight } from '@element-plus/icons-vue'
import type { LogItem } from '@/api/log'

defineProps<{ rows?: LogItem[]; loading: boolean; failed: boolean; logPage?: string }>()
defineEmits<{ retry: [] }>()
const { t } = useI18n()
</script>
<template>
  <section class="panel recent" :aria-busy="loading">
    <header>
      <h2>{{ t('dashboard.recentErrors') }}</h2>
      <router-link v-if="logPage" :to="{ path: logPage, query: { level: 'ERROR' } }" class="log-link">
        {{ t('dashboard.openLogs') }} <el-icon><ArrowRight /></el-icon>
      </router-link>
    </header>
    <p v-if="loading" role="status">{{ t('dashboard.loading') }}</p>
    <p v-else-if="failed">{{ t('dashboard.unavailable') }} <el-button link type="primary" @click="$emit('retry')">{{ t('dashboard.retry') }}</el-button></p>
    <p v-else-if="!rows?.length">{{ t('dashboard.noErrors') }}</p>
    <ul v-else class="recent-list">
      <li v-for="log in rows" :key="log.id">
        <details>
          <summary>
            <time :datetime="log.timestamp">{{ log.timestamp.replace('T', ' ').slice(0, 19) }}</time>
            <span class="module">{{ log.module || '—' }}</span>
            <span class="preview">{{ log.message }}</span>
          </summary>
          <pre>{{ log.message }}</pre>
        </details>
      </li>
    </ul>
  </section>
</template>
<style scoped>
.recent header, .log-link { display: flex; align-items: center; gap: 8px; }
.recent header { justify-content: space-between; flex-wrap: wrap; }
.log-link { font-size: 13px; color: var(--el-link-text-color, var(--el-color-primary)); text-decoration: none; }
.log-link:hover { text-decoration: underline; }
.recent-list { list-style: none; margin: 8px 0 0; padding: 0; }
.recent-list li + li { border-top: 1px solid var(--el-border-color-lighter); }
summary { display: grid; grid-template-columns: 14px 150px minmax(65px, .28fr) minmax(0, 1fr); align-items: baseline; gap: 10px; padding: 12px 0; cursor: pointer; }
summary::-webkit-details-marker { display: none; }
summary::before { content: '›'; color: var(--el-text-color-regular); font-weight: 650; text-align: center; }
details[open] summary::before { transform: rotate(90deg); }
time { font-variant-numeric: tabular-nums; font-size: 12px; color: var(--el-text-color-regular); }
.preview, .module { font-size: 13px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.module { font-weight: 600; }
pre { margin: 0 0 12px; padding: 12px; border-radius: 8px; white-space: pre-wrap; overflow-wrap: anywhere; background: var(--el-fill-color-light); font: inherit; font-size: 13px; }
@media (max-width: 720px) {
  summary { grid-template-columns: 12px auto minmax(0, 1fr); gap: 5px 8px; }
  .preview { grid-column: 2 / -1; }
}
</style>
