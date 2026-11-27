<template>
  <slot v-if="legacy" name="legacy" />
  <div v-else-if="available" class="admin-page"><slot /></div>
  <el-empty v-else :description="'没有访问权限：' + label" />
</template>
<script setup lang="ts">
import './approval.css'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { hasPermission } from '@/utils/permission'

const props = defineProps<{ label: string; permission: string | string[] }>()
const route = useRoute()
const legacy = computed(() =>
  route.query.mode === 'bpmn' ||
  !!(route.query.processInstanceId || route.query.definitionId || route.query.definitionKey || route.query.run)
)
const available = computed(() => {
  const permissions = Array.isArray(props.permission) ? props.permission : [props.permission]
  return permissions.some((p) => hasPermission('workflow:approval:' + p + ':api'))
})
</script>
