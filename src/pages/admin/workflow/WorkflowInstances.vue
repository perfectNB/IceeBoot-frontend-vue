<template>
  <div class="workflow-page">
    <div class="page-header">
      <h2>流程实例</h2>
      <p>启动流程实例、查询状态、结束或删除实例</p>
    </div>

    <el-row :gutter="16">
      <el-col :span="12">
        <div class="table-section">
          <div class="section-title">启动流程</div>
          <el-form :model="startForm" label-width="90px">
            <el-form-item label="流程定义">
              <el-select v-model="startForm.processDefinitionKey" placeholder="请选择流程定义">
                <el-option v-for="item in definitionKeyOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="业务Key">
              <el-input v-model="startForm.businessKey" placeholder="可选" />
            </el-form-item>
            <el-form-item label="流程变量">
              <el-input v-model="startForm.variablesJson" type="textarea" :rows="6" placeholder="JSON对象" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="startingProcess" @click="handleStartProcess">启动流程</el-button>
              <el-button @click="resetStartForm">重置</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="table-section">
          <div class="section-title">流程实例操作</div>
          <el-form :model="instanceForm" label-width="100px">
            <el-form-item label="实例ID">
              <el-input v-model="instanceForm.processInstanceId" placeholder="请输入流程实例ID" />
            </el-form-item>
            <el-form-item label="删除原因">
              <el-input v-model="instanceForm.deleteReason" placeholder="可选" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="loadingInstance" @click="handleLoadInstance">查询</el-button>
              <el-button type="warning" :loading="endingInstance" @click="handleEndInstance">结束</el-button>
              <el-button type="danger" :loading="deletingInstance" @click="handleDeleteInstance">删除</el-button>
              <el-button type="info" :loading="checkingEnded" @click="handleCheckEnded">是否结束</el-button>
            </el-form-item>
          </el-form>
          <el-descriptions v-if="instanceResult" :column="2" border>
            <el-descriptions-item label="实例ID">{{ instanceResult.processInstanceId || instanceResult.id }}</el-descriptions-item>
            <el-descriptions-item label="流程Key">{{ instanceResult.processDefinitionKey }}</el-descriptions-item>
            <el-descriptions-item label="流程名称">{{ instanceResult.processDefinitionName || instanceResult.name }}</el-descriptions-item>
            <el-descriptions-item label="版本">{{ instanceResult.processDefinitionVersion }}</el-descriptions-item>
            <el-descriptions-item label="开始时间">{{ instanceResult.startTime }}</el-descriptions-item>
            <el-descriptions-item label="发起人">{{ instanceResult.startUserId }}</el-descriptions-item>
            <el-descriptions-item label="当前节点">{{ instanceResult.activityId }}</el-descriptions-item>
            <el-descriptions-item label="结束状态">{{ instanceResult.ended ? '已结束' : '运行中' }}</el-descriptions-item>
          </el-descriptions>
          <div v-if="instanceEnded !== null" class="ended-tip">
            结束状态：{{ instanceEnded ? '已结束' : '未结束' }}
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
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
    ElMessage.error('加载流程定义失败')
  }
}

const handleStartProcess = async () => {
  if (!startForm.processDefinitionKey) {
    ElMessage.warning('请选择流程定义')
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
    ElMessage.success('流程已启动')
    resetStartForm()
  } catch {
    ElMessage.error('启动失败')
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
    ElMessage.warning('请输入流程实例ID')
    return
  }
  loadingInstance.value = true
  try {
    instanceResult.value = await getWorkflowProcess(instanceForm.processInstanceId)
    ElMessage.success('查询完成')
  } catch {
    ElMessage.error('查询失败')
  } finally {
    loadingInstance.value = false
  }
}

const handleEndInstance = async () => {
  if (!instanceForm.processInstanceId) {
    ElMessage.warning('请输入流程实例ID')
    return
  }
  endingInstance.value = true
  try {
    await endWorkflowProcess(instanceForm.processInstanceId)
    ElMessage.success('流程已结束')
  } catch {
    ElMessage.error('结束失败')
  } finally {
    endingInstance.value = false
  }
}

const handleDeleteInstance = async () => {
  if (!instanceForm.processInstanceId) {
    ElMessage.warning('请输入流程实例ID')
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
    ElMessage.success('流程已删除')
  } catch {
    ElMessage.error('删除失败')
  } finally {
    deletingInstance.value = false
  }
}

const handleCheckEnded = async () => {
  if (!instanceForm.processInstanceId) {
    ElMessage.warning('请输入流程实例ID')
    return
  }
  checkingEnded.value = true
  try {
    instanceEnded.value = await checkWorkflowProcessEnded(instanceForm.processInstanceId)
  } catch {
    ElMessage.error('查询失败')
  } finally {
    checkingEnded.value = false
  }
}

const parseJson = (value: string): Record<string, unknown> | undefined | null => {
  if (!value) return undefined
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      ElMessage.error('变量需要是JSON对象')
      return null
    }
    return parsed
  } catch {
    ElMessage.error('JSON格式不正确')
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
