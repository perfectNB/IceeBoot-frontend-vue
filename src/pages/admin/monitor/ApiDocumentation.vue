<script setup lang="ts">
import AdminPageHeader from '@/components/common/AdminPageHeader.vue'
import { useI18n } from 'vue-i18n'
import { isMockEnabled } from '@/config/mock'
import { getBaseURL } from '@/utils/env'

const { t } = useI18n()
const docUrl = getBaseURL().replace(/\/$/, '') + '/api/doc.html'
const endpoints = ['stats', 'visit-trend', 'user-distribution']
</script>

<template>
  <section class="admin-page">
    <AdminPageHeader :title="t('apiDocumentation.pageTitle')" :description="t('apiDocumentation.pageDescription')" />
    <el-card v-if="isMockEnabled()" shadow="never">
      <h2>{{ t('dashboard.title') }}</h2>
      <ul><li v-for="endpoint in endpoints" :key="endpoint"><code>GET /api/v1/dashboard/{{ endpoint }}</code></li></ul>
    </el-card>
    <el-link v-else :href="docUrl" target="_blank" rel="noopener noreferrer" type="primary">{{ t('apiDocumentation.redirect.visitDoc') }}</el-link>
  </section>
</template>

<style scoped>
h1, h2 { color: var(--text-primary); }
h2 { font-size: 18px; margin: 0; }
p, li { color: var(--text-regular); }
li + li { margin-top: 10px; }
code { overflow-wrap: anywhere; }
</style>
