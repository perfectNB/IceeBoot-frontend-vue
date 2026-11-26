<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import * as icons from '@element-plus/icons-vue'

defineProps<{ title?: string; description?: string; count?: number }>()
const route = useRoute()
const icon = computed(() => {
  const name = route.meta.icon
  return typeof name === 'string' && Object.prototype.hasOwnProperty.call(icons, name)
    ? icons[name as keyof typeof icons]
    : icons.Grid
})
</script>

<template>
  <header class="admin-heading">
    <div class="heading-identity">
      <span class="heading-icon" aria-hidden="true"><el-icon><component :is="icon" /></el-icon></span>
      <div class="heading-copy">
        <h1>{{ title || route.meta.title }} <span v-if="count != null" class="heading-count">{{ count }}</span></h1>
        <p v-if="description">{{ description }}</p>
      </div>
    </div>
    <div v-if="$slots.default" class="heading-actions"><slot /></div>
  </header>
</template>

<style scoped>
.admin-heading, .heading-identity, .heading-actions { display: flex; align-items: center; }
.admin-heading { gap: 14px 22px; justify-content: space-between; flex-wrap: wrap; margin-bottom: var(--admin-gap); min-height: 48px; }
.heading-identity { gap: 14px; min-width: 0; }
.heading-icon {
  flex: none; display: grid; place-items: center; width: 42px; height: 42px; border-radius: 12px;
  color: var(--el-color-primary); background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  box-shadow: 0 3px 0 var(--el-border-color-light), inset 0 1px 0 var(--el-fill-color-blank);
  font-size: 21px;
}
.heading-copy { min-width: 0; overflow-wrap: anywhere; }
.heading-copy h1 { display: flex; align-items: center; gap: 8px; margin: 0; font-size: clamp(21px, 2vw, 26px); line-height: 1.25; font-weight: 660; letter-spacing: -.03em; color: var(--el-text-color-primary); }
.heading-copy p { margin: 4px 0 0; line-height: 1.55; font-size: 13px; color: var(--el-text-color-regular); }
.heading-count { border-radius: 6px; padding: 2px 6px; font-size: 12px; line-height: 1.45; font-variant-numeric: tabular-nums; background: var(--el-fill-color); color: var(--el-text-color-regular); }
.heading-actions { gap: 8px; flex-wrap: wrap; max-width: 100%; }
.heading-actions :deep(.el-button + .el-button) { margin-left: 0; }
@media (prefers-reduced-motion: no-preference) and (hover: hover) {
  .heading-icon { transition: transform 180ms ease; }
  .heading-identity:hover .heading-icon { transform: perspective(260px) rotateY(-12deg) rotateX(6deg) translateY(-1px); }
}
</style>
