<template>
  <ApprovalWorkspace label="我的审批" permission="list">
    <ApprovalDesk :inbox="true" />
    <template #legacy><LegacyWorkflowTasks /></template>
  </ApprovalWorkspace>
</template>
<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import ApprovalWorkspace from './ApprovalWorkspace.vue'
import ApprovalDesk from './ApprovalDesk.vue'
const LegacyWorkflowTasks = defineAsyncComponent(() => import('./LegacyWorkflowTasks.vue'))
</script>
