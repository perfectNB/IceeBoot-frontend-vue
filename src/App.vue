<script setup lang="ts">
import { computed } from 'vue'
import { RouterView } from 'vue-router'
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

const elementLocale = computed(() => {
  return locale.value === 'zh-CN' ? zhCn : en
})
</script>

<template>
  <ElConfigProvider :locale="elementLocale">
    <div id="app">
      <RouterView />
    </div>
  </ElConfigProvider>
</template>

<style>
#app {
  min-height: 100vh;
  font-family: var(--font-family);
  color: var(--text-primary);
  background-color: var(--bg-color-page);
}
</style>
