<template>
  <ApprovalWorkspace label="审批申请" permission="list">
    <ApprovalDesk :inbox="false" />
    <template #legacy><LegacyWorkflowInstances /></template>
  </ApprovalWorkspace>
</template>
<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import ApprovalWorkspace from './ApprovalWorkspace.vue'
import ApprovalDesk from './ApprovalDesk.vue'
const LegacyWorkflowInstances = defineAsyncComponent(() => import('./LegacyWorkflowInstances.vue'))
</script>
