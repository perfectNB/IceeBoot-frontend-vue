<template>
  <div>
    <nav v-if="available" class="approval-switch" aria-label="工作流模式">
      <button type="button" :aria-pressed="!legacy" @click="legacy = false">{{ label }}</button>
      <button type="button" :aria-pressed="legacy" @click="legacy = true">BPMN 工作流</button>
    </nav>
    <div v-if="legacy || !available"><slot name="legacy" /></div>
    <div v-else class="admin-page"><slot /></div>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { hasPermission } from '@/utils/permission'
const props = defineProps<{ label: string; permission: string }>()
const route = useRoute()
const legacy = ref(
  route.query.mode === 'bpmn' ||
    !!route.query.processInstanceId ||
    !!route.query.definitionId ||
    !!route.query.definitionKey ||
    !!route.query.run
)
const available = computed(() => hasPermission('workflow:approval:' + props.permission + ':api'))
</script>
<style src="./approval.css"></style>
