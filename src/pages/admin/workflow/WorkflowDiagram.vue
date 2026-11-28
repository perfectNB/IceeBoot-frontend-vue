<template>
  <LegacyWorkflowDiagram v-if="legacy" />
  <div v-else-if="hasPermission('workflow:approval:published:api')" class="admin-page">
    <ApprovalCatalog diagram />
  </div>
  <el-empty v-else description="没有发起审批的访问权限" />
</template>
<script setup lang="ts">
import './approval.css'
import { computed, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'
import { hasPermission } from '@/utils/permission'
import ApprovalCatalog from './ApprovalCatalog.vue'
const route = useRoute()
const legacy = computed(
  () =>
    route.query.mode === 'bpmn' ||
    !!(
      route.query.run ||
      route.query.processInstanceId ||
      route.query.definitionId ||
      route.query.definitionKey
    )
)
const LegacyWorkflowDiagram = defineAsyncComponent(() => import('./LegacyWorkflowDiagram.vue'))
</script>
