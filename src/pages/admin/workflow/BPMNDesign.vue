<template>
  <ApprovalWorkspace label="审批设计" permission="drafts">
    <ApprovalDesigner />
    <template #legacy><LegacyBPMNDesign /></template>
  </ApprovalWorkspace>
</template>
<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import ApprovalWorkspace from './ApprovalWorkspace.vue'
import ApprovalDesigner from './ApprovalDesigner.vue'
const LegacyBPMNDesign = defineAsyncComponent(() => import('./LegacyBPMNDesign.vue'))
</script>
