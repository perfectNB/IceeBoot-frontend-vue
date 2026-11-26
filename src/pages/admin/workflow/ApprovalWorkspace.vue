<template>
  <div>
    <nav v-if="available" class="advanced-entry" aria-label="工作流工具">
      <el-button v-if="legacy" text @click="returnToApproval">← 返回{{ label }}</el-button>
      <el-dropdown v-else trigger="click" @command="legacy = true">
        <el-button text>高级选项 ▾</el-button>
        <template #dropdown
          ><el-dropdown-menu
            ><el-dropdown-item command="bpmn">BPMN 工作流</el-dropdown-item></el-dropdown-menu
          ></template
        >
      </el-dropdown>
    </nav>
    <div v-if="legacy || !available"><slot name="legacy" /></div>
    <div v-if="available && visitedApproval" v-show="!legacy" class="admin-page"><slot /></div>
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
const visitedApproval = ref(!legacy.value)
function returnToApproval() {
  visitedApproval.value = true
  legacy.value = false
}
const available = computed(() => hasPermission('workflow:approval:' + props.permission + ':api'))
</script>
<style scoped>
.advanced-entry {
  display: flex;
  justify-content: flex-end;
  padding-inline: 20px;
}
</style>
<style src="./approval.css"></style>
