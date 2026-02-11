<template>
  <el-dropdown @command="handleCommand" trigger="click">
    <el-button text class="lang-btn">
      <el-icon><GlobeFilled /></el-icon>
    </el-button>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item
          v-for="item in localeOptions"
          :key="item.value"
          :command="item.value"
          :class="{ 'is-active': currentLocale === item.value }"
        >
          {{ item.label }}
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLocale, type LocaleType } from '@/locales'

// Use a globe-like icon from element-plus icons
const GlobeFilled = {
  name: 'GlobeFilled',
  render() {
    return h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 1024 1024' }, [
      h('path', {
        fill: 'currentColor',
        d: 'M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372zm-40-580.7c-6.6 0-12 5.4-12 12v52.1c0 6.6 5.4 12 12 12h80c6.6 0 12-5.4 12-12v-52.1c0-6.6-5.4-12-12-12h-80zm40 156.7c-123.5 0-224 100.5-224 224s100.5 224 224 224 224-100.5 224-224-100.5-224-224-224z'
      })
    ])
  }
}

import { h } from 'vue'

const localeOptions = [
  { label: '简体中文', value: 'zh-CN' as LocaleType },
  { label: 'English', value: 'en' as LocaleType },
]

const { locale } = useI18n()
const currentLocale = computed(() => locale.value)

const handleCommand = (val: LocaleType) => {
  setLocale(val)
}
</script>

<style scoped>
.lang-btn {
  font-size: 18px;
  color: var(--text-secondary);
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.lang-btn:hover {
  background: var(--bg-color-soft);
  color: var(--primary-color);
}
:deep(.is-active) {
  color: var(--el-color-primary);
  font-weight: 600;
}
</style>
