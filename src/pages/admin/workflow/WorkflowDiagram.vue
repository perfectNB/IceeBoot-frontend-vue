<template>
  <ApprovalWorkspace label="审批流程图" permission="published">
    <ApprovalCatalog :diagram="true" />
    <template #legacy><LegacyWorkflowDiagram /></template>
  </ApprovalWorkspace>
</template>
<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import ApprovalWorkspace from './ApprovalWorkspace.vue'
import ApprovalCatalog from './ApprovalCatalog.vue'
const LegacyWorkflowDiagram = defineAsyncComponent(() => import('./LegacyWorkflowDiagram.vue'))
</script>
