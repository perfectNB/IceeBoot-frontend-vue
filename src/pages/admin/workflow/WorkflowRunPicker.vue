<template>
  <el-select v-if="hasPermission('workflow:process:list:api')" v-model="id" filterable clearable allow-create default-first-option
    :placeholder="t('bpmnDesign.pickRun')" :aria-label="t('workflowInstances.instanceId')" :loading="loading" @visible-change="load">
    <el-option v-for="run in runs" :key="run.id" :value="run.id" :label="[run.name || run.key, run.businessKey, run.id].filter(Boolean).join(' · ')" />
  </el-select>
  <el-input v-else v-model="id" :placeholder="t('workflowInstances.inputProcessInstanceId')" />
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { getWorkflowRuns, type WorkflowRunSummary } from '@/api/workflow'
import { hasPermission } from '@/utils/permission'
const id = defineModel<string>({ required: true })
const { t } = useI18n()
const runs = ref<WorkflowRunSummary[]>([])
const loading = ref(false)
async function load(open: boolean) {
  if (!open || loading.value) return
  loading.value = true
  try { runs.value = await getWorkflowRuns() }
  catch { ElMessage.error(t('bpmnDesign.runListFailed')) }
  finally { loading.value = false }
}
</script>
