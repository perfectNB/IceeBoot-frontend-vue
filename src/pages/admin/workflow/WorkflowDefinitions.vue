<template>
  <ApprovalWorkspace label="审批模板" :permission="['published', 'drafts']">
    <ApprovalCatalog />
    <template #legacy><LegacyWorkflowDefinitions /></template>
  </ApprovalWorkspace>
</template>
<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import ApprovalWorkspace from './ApprovalWorkspace.vue'
import ApprovalCatalog from './ApprovalCatalog.vue'
const LegacyWorkflowDefinitions = defineAsyncComponent(() => import('./LegacyWorkflowDefinitions.vue'))
</script>
