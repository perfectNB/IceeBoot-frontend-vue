<template>
  <div class="workflow-page">
    <div class="page-header">
      <h2>{{ t('workflowInstances.title') }}</h2>
      <p>{{ t('workflowInstances.description') }}</p>
    </div>

    <el-row :gutter="16">
      <el-col :span="12">
        <div class="table-section">
          <div class="section-title">{{ t('workflowInstances.startProcess') }}</div>
          <el-form :model="startForm" label-width="90px">
            <el-form-item :label="t('workflowInstances.processDefinition')">
              <el-select v-model="startForm.processDefinitionKey" :placeholder="t('workflowInstances.selectProcessDefinition')">
                <el-option v-for="item in definitionKeyOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item :label="t('workflowInstances.businessKey')">
              <el-input v-model="startForm.businessKey" :placeholder="t('workflowInstances.optional')" />
            </el-form-item>
            <el-form-item :label="t('workflowInstances.processVariables')">
              <el-input v-model="startForm.variablesJson" type="textarea" :rows="6" :placeholder="t('workflowInstances.jsonObject')" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="startingProcess" @click="handleStartProcess">{{ t('workflowInstances.startProcessBtn') }}</el-button>
              <el-button @click="resetStartForm">{{ t('workflowInstances.reset') }}</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="table-section">
          <div class="section-title">{{ t('workflowInstances.processInstanceOperation') }}</div>
          <el-form :model="instanceForm" label-width="100px">
            <el-form-item :label="t('workflowInstances.instanceId')">
              <el-input v-model="instanceForm.processInstanceId" :placeholder="t('workflowInstances.inputProcessInstanceId')" />
            </el-form-item>
            <el-form-item :label="t('workflowInstances.deleteReason')">
              <el-input v-model="instanceForm.deleteReason" :placeholder="t('workflowInstances.optional')" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="loadingInstance" @click="handleLoadInstance">{{ t('workflowInstances.query') }}</el-button>
              <el-button type="warning" :loading="endingInstance" @click="handleEndInstance">{{ t('workflowInstances.end') }}</el-button>
              <el-button type="danger" :loading="deletingInstance" @click="handleDeleteInstance">{{ t('workflowInstances.delete') }}</el-button>
              <el-button type="info" :loading="checkingEnded" @click="handleCheckEnded">{{ t('workflowInstances.isEnded') }}</el-button>
            </el-form-item>
          </el-form>
          <el-descriptions v-if="instanceResult" :column="2" border>
            <el-descriptions-item :label="t('workflowInstances.instanceId')">{{ instanceResult.processInstanceId || instanceResult.id }}</el-descriptions-item>
            <el-descriptions-item :label="t('workflowInstances.processKey')">{{ instanceResult.processDefinitionKey }}</el-descriptions-item>
            <el-descriptions-item :label="t('workflowInstances.processName')">{{ instanceResult.processDefinitionName || instanceResult.name }}</el-descriptions-item>
            <el-descriptions-item :label="t('workflowInstances.version')">{{ instanceResult.processDefinitionVersion }}</el-descriptions-item>
            <el-descriptions-item :label="t('workflowInstances.startTime')">{{ instanceResult.startTime }}</el-descriptions-item>
            <el-descriptions-item :label="t('workflowInstances.initiator')">{{ instanceResult.startUserId }}</el-descriptions-item>
            <el-descriptions-item :label="t('workflowInstances.currentNode')">{{ instanceResult.activityId }}</el-descriptions-item>
            <el-descriptions-item :label="t('workflowInstances.endStatus')">{{ instanceResult.ended ? t('workflowInstances.ended') : t('workflowInstances.running') }}</el-descriptions-item>
          </el-descriptions>
          <div v-if="instanceEnded !== null" class="ended-tip">
            {{ t('workflowInstances.endStatusLabel') }}{{ instanceEnded ? t('workflowInstances.ended') : t('workflowInstances.notEnded') }}
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import {
  checkWorkflowProcessEnded,
  deleteWorkflowProcess,
  endWorkflowProcess,
  getWorkflowDefinitions,
  getWorkflowProcess,
  startWorkflowProcess,
  type ProcessInstance,
  type WorkflowDefinition
} from '@/api'

defineOptions({
  name: 'WorkflowInstances'
})

const { t } = useI18n()

const definitions = ref<WorkflowDefinition[]>([])

const startForm = reactive({
  processDefinitionKey: '',
  businessKey: '',
  variablesJson: ''
})
const startingProcess = ref(false)

const instanceForm = reactive({
  processInstanceId: '',
  deleteReason: ''
})
const instanceResult = ref<ProcessInstance | null>(null)
const instanceEnded = ref<boolean | null>(null)
const loadingInstance = ref(false)
const endingInstance = ref(false)
const deletingInstance = ref(false)
const checkingEnded = ref(false)

const definitionKeyOptions = computed(() =>
  definitions.value
    .map(item => ({
      label: `${item.name || item.key || item.id}`,
      value: resolveDefinitionKey(item)
    }))
    .filter(item => item.value)
)

const loadDefinitions = async () => {
  try {
    definitions.value = await getWorkflowDefinitions({ latestOnly: true })
  } catch {
    ElMessage.error(t('workflowInstances.loadDefinitionsFailed'))
  }
}

const handleStartProcess = async () => {
  if (!startForm.processDefinitionKey) {
    ElMessage.warning(t('workflowInstances.selectProcessDefinitionRequired'))
    return
  }
  const variables = parseJson(startForm.variablesJson)
  if (variables === null) return
  startingProcess.value = true
  try {
    const payload = {
      processDefinitionKey: startForm.processDefinitionKey,
      businessKey: startForm.businessKey || undefined,
      variables: variables || undefined
    }
    instanceResult.value = await startWorkflowProcess(payload)
    instanceForm.processInstanceId = instanceResult.value.processInstanceId || instanceResult.value.id || ''
    ElMessage.success(t('workflowInstances.processStarted'))
    resetStartForm()
  } catch {
    ElMessage.error(t('workflowInstances.startFailed'))
  } finally {
    startingProcess.value = false
  }
}

const resetStartForm = () => {
  startForm.processDefinitionKey = ''
  startForm.businessKey = ''
  startForm.variablesJson = ''
}

const handleLoadInstance = async () => {
  if (!instanceForm.processInstanceId) {
    ElMessage.warning(t('workflowInstances.inputProcessInstanceIdRequired'))
    return
  }
  loadingInstance.value = true
  try {
    instanceResult.value = await getWorkflowProcess(instanceForm.processInstanceId)
    ElMessage.success(t('workflowInstances.queryCompleted'))
  } catch {
    ElMessage.error(t('workflowInstances.queryFailed'))
  } finally {
    loadingInstance.value = false
  }
}

const handleEndInstance = async () => {
  if (!instanceForm.processInstanceId) {
    ElMessage.warning(t('workflowInstances.inputProcessInstanceIdRequired'))
    return
  }
  endingInstance.value = true
  try {
    await endWorkflowProcess(instanceForm.processInstanceId)
    ElMessage.success(t('workflowInstances.processEnded'))
  } catch {
    ElMessage.error(t('workflowInstances.endFailed'))
  } finally {
    endingInstance.value = false
  }
}

const handleDeleteInstance = async () => {
  if (!instanceForm.processInstanceId) {
    ElMessage.warning(t('workflowInstances.inputProcessInstanceIdRequired'))
    return
  }
  deletingInstance.value = true
  try {
    await deleteWorkflowProcess(instanceForm.processInstanceId, {
      processInstanceId: instanceForm.processInstanceId,
      deleteReason: instanceForm.deleteReason || undefined
    })
    instanceResult.value = null
    instanceEnded.value = null
    ElMessage.success(t('workflowInstances.processDeleted'))
  } catch {
    ElMessage.error(t('workflowInstances.deleteFailed'))
  } finally {
    deletingInstance.value = false
  }
}

const handleCheckEnded = async () => {
  if (!instanceForm.processInstanceId) {
    ElMessage.warning(t('workflowInstances.inputProcessInstanceIdRequired'))
    return
  }
  checkingEnded.value = true
  try {
    instanceEnded.value = await checkWorkflowProcessEnded(instanceForm.processInstanceId)
  } catch {
    ElMessage.error(t('workflowInstances.queryFailed'))
  } finally {
    checkingEnded.value = false
  }
}

const parseJson = (value: string): Record<string, unknown> | undefined | null => {
  if (!value) return undefined
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      ElMessage.error(t('workflowInstances.variablesMustBeJsonObject'))
      return null
    }
    return parsed
  } catch {
    ElMessage.error(t('workflowInstances.jsonFormatIncorrect'))
    return null
  }
}

const resolveDefinitionKey = (definition: WorkflowDefinition): string => {
  if (typeof definition.key === 'string' && definition.key) return definition.key
  const processDefinitionKey = (definition as Record<string, unknown>).processDefinitionKey
  if (typeof processDefinitionKey === 'string' && processDefinitionKey) return processDefinitionKey
  return ''
}

onMounted(() => {
  loadDefinitions()
})
</script>

<style scoped>
.workflow-page {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  color: var(--text-primary);
}

.page-header p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.table-section {
  background: var(--bg-color);
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.section-title {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.ended-tip {
  margin-top: 12px;
  color: var(--text-secondary);
}

:deep(.el-button + .el-button) {
  margin-left: 8px;
}
</style>
