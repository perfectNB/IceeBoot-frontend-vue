<template>
  <div class="workflow-page admin-page">
    <AdminPageHeader :title="t('workflowDefinitions.title')" :description="t('workflowDefinitions.description')">
      <el-space wrap>
        <el-button type="primary" :icon="Refresh" :loading="loadingDefinitions" @click="loadDefinitions">
          {{ t('workflowDefinitions.refresh') }}
        </el-button>
        <el-switch v-model="latestOnly" :active-text="t('workflowDefinitions.latestVersionOnly')" :inactive-text="t('workflowDefinitions.allVersions')" @change="loadDefinitions" />
      </el-space>
    </AdminPageHeader>

    <div class="table-section">
      <el-table :data="definitions" v-loading="loadingDefinitions" stripe border style="width: 100%">
        <el-table-column prop="id" :label="t('workflowDefinitions.definitionId')" min-width="180" show-overflow-tooltip />
        <el-table-column prop="key" :label="t('workflowDefinitions.processKey')" min-width="160" show-overflow-tooltip />
        <el-table-column prop="name" :label="t('workflowDefinitions.processName')" min-width="180" show-overflow-tooltip />
        <el-table-column prop="version" :label="t('workflowDefinitions.version')" width="80" />
        <el-table-column prop="category" :label="t('workflowDefinitions.category')" min-width="120" show-overflow-tooltip />
        <el-table-column prop="deploymentId" :label="t('workflowDefinitions.deploymentId')" min-width="160" show-overflow-tooltip />
        <el-table-column :label="t('workflowDefinitions.operation')" width="260" fixed="right">
          <template #default="{ row }">
            <el-button v-if="hasPermission('workflow:definition:xml:api')" type="primary" size="small" :icon="View" @click="handleViewXml(row)">{{ t('workflowDefinitions.xml') }}</el-button>
            <el-button v-if="hasPermission('workflow:definition:diagram:api')" type="info" size="small" :icon="Picture" @click="handleViewDiagram(row)">{{ t('workflowDefinitions.diagram') }}</el-button>
            <el-button v-if="hasPermission('workflow:process:start:api')" type="success" size="small" :icon="VideoPlay" @click="openStartDialog(row)">{{ t('workflowDefinitions.start') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="xmlDialogVisible" :title="t('workflowDefinitions.processDefinitionXml')" width="70%">
      <el-input v-model="xmlContent" type="textarea" :rows="20" readonly />
    </el-dialog>

    <el-dialog v-model="diagramDialogVisible" :title="t('workflowDefinitions.diagramPreview')" width="80%">
      <div class="diagram-section">
        <div v-if="diagramImage" class="diagram-container">
          <div class="diagram-wrapper">
            <img ref="diagramImageRef" :src="diagramImage" class="diagram-image" @load="handleDiagramLoaded" />
            <div
              v-for="node in overlayNodes"
              :key="node.id || node.activityId || node.name"
              class="diagram-node"
              :style="node.style"
            >
              <el-tooltip :content="getNodeTooltip(node)" placement="top">
                <el-tag :type="getNodeTagType(node.status)" size="small">
                  {{ node.name || node.activityId || node.id }}
                </el-tag>
              </el-tooltip>
            </div>
          </div>
        </div>
        <el-empty v-else :description="t('workflowDefinitions.noDiagram')" />
      </div>

      <div class="table-section">
        <div class="section-title">{{ t('workflowDefinitions.nodeStatus') }}</div>
        <el-table :data="currentNodes" stripe border style="width: 100%">
          <el-table-column prop="activityId" :label="t('workflowDefinitions.nodeId')" min-width="160" show-overflow-tooltip />
          <el-table-column prop="name" :label="t('workflowDefinitions.nodeName')" min-width="160" show-overflow-tooltip />
          <el-table-column prop="type" :label="t('workflowDefinitions.type')" width="120" show-overflow-tooltip />
          <el-table-column :label="t('workflowDefinitions.status')" width="120">
            <template #default="{ row }">
              <el-tag :type="getNodeTagType(row.status)">
                {{ row.status || '-' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="x" label="X" width="80" />
          <el-table-column prop="y" label="Y" width="80" />
          <el-table-column prop="width" :label="t('workflowDefinitions.width')" width="80" />
          <el-table-column prop="height" :label="t('workflowDefinitions.height')" width="80" />
          <el-table-column :label="t('workflowDefinitions.description')" min-width="240" show-overflow-tooltip>
            <template #default="{ row }">
              {{ getNodeDescription(row.type) }}
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>

    <el-dialog v-model="startDialogVisible" :title="t('workflowDefinitions.startProcessInstance')" width="520px">
      <el-form :model="startDialogForm" label-width="90px">
        <el-form-item :label="t('workflowDefinitions.processKey')">
          <el-input v-model="startDialogForm.processDefinitionKey" readonly />
        </el-form-item>
        <el-form-item :label="t('workflowDefinitions.businessKey')">
          <el-input v-model="startDialogForm.businessKey" :placeholder="t('workflowDefinitions.optional')" />
        </el-form-item>
        <el-form-item :label="t('workflowDefinitions.processVariables')">
          <el-input v-model="startDialogForm.variablesJson" type="textarea" :rows="6" :placeholder="t('workflowDefinitions.jsonObject')" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="startingProcess" @click="handleStartDialog">{{ t('workflowDefinitions.start') }}</el-button>
          <el-button @click="startDialogVisible = false">{{ t('workflowDefinitions.cancel') }}</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { hasPermission } from '@/utils/permission'
import { normalizeDiagramImage } from '@/utils/workflowDiagram'
import AdminPageHeader from '@/components/common/AdminPageHeader.vue'
import { computed, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Picture, Refresh, VideoPlay, View } from '@element-plus/icons-vue'
import {
  getWorkflowDefinitionDiagram,
  getWorkflowDefinitionNodes,
  getWorkflowDefinitionXml,
  getWorkflowDefinitions,
  startWorkflowProcess,
  type WorkflowDefinition,
  type WorkflowNode
} from '@/api'
import { useI18n } from 'vue-i18n'

defineOptions({
  name: 'WorkflowDefinitions'
})

const { t } = useI18n()

const latestOnly = ref(true)
const loadingDefinitions = ref(false)
const definitions = ref<WorkflowDefinition[]>([])

const xmlDialogVisible = ref(false)
const xmlContent = ref('')

const startDialogVisible = ref(false)
const startingProcess = ref(false)
const startDialogForm = reactive({
  processDefinitionKey: '',
  businessKey: '',
  variablesJson: ''
})

const diagramDialogVisible = ref(false)
const diagramImage = ref('')
const currentNodes = ref<WorkflowNode[]>([])
const diagramImageRef = ref<HTMLImageElement>()
const diagramSize = reactive({
  width: 0,
  height: 0,
  naturalWidth: 0,
  naturalHeight: 0
})

const nodeGuideList = [
  { name: t('bpmnDesign.startEvent'), type: 'startEvent', description: t('bpmnDesign.startEventDesc') },
  { name: t('bpmnDesign.endEvent'), type: 'endEvent', description: t('bpmnDesign.endEventDesc') },
  { name: t('bpmnDesign.userTask'), type: 'userTask', description: t('bpmnDesign.userTaskDesc') },
  { name: t('bpmnDesign.serviceTask'), type: 'serviceTask', description: t('bpmnDesign.serviceTaskDesc') },
  { name: t('bpmnDesign.scriptTask'), type: 'scriptTask', description: t('bpmnDesign.scriptTaskDesc') },
  { name: t('bpmnDesign.manualTask'), type: 'manualTask', description: t('bpmnDesign.manualTaskDesc') },
  { name: t('bpmnDesign.receiveTask'), type: 'receiveTask', description: t('bpmnDesign.receiveTaskDesc') },
  { name: t('bpmnDesign.exclusiveGateway'), type: 'exclusiveGateway', description: t('bpmnDesign.exclusiveGatewayDesc') },
  { name: t('bpmnDesign.parallelGateway'), type: 'parallelGateway', description: t('bpmnDesign.parallelGatewayDesc') },
  { name: t('bpmnDesign.inclusiveGateway'), type: 'inclusiveGateway', description: t('bpmnDesign.inclusiveGatewayDesc') },
  { name: t('bpmnDesign.callActivity'), type: 'callActivity', description: t('bpmnDesign.callActivityDesc') },
  { name: t('bpmnDesign.subProcess'), type: 'subProcess', description: t('bpmnDesign.subProcessDesc') }
]

const overlayNodes = computed(() => {
  if (!diagramSize.naturalWidth || !diagramSize.naturalHeight) {
    return []
  }
  const scaleX = diagramSize.width / diagramSize.naturalWidth
  const scaleY = diagramSize.height / diagramSize.naturalHeight
  return currentNodes.value
    .filter(node => typeof node.x === 'number' && typeof node.y === 'number')
    .map(node => {
      const width = (node.width || 40) * scaleX
      const height = (node.height || 20) * scaleY
      return {
        ...node,
        style: {
          left: `${(node.x || 0) * scaleX}px`,
          top: `${(node.y || 0) * scaleY}px`,
          width: `${width}px`,
          height: `${height}px`
        }
      }
    })
})

const loadDefinitions = async () => {
  loadingDefinitions.value = true
  try {
    definitions.value = await getWorkflowDefinitions({ latestOnly: latestOnly.value })
  } catch {
    ElMessage.error(t('workflowDefinitions.loadDefinitionsFailed'))
  } finally {
    loadingDefinitions.value = false
  }
}

const handleViewXml = async (definition: WorkflowDefinition) => {
  const definitionId = resolveDefinitionId(definition)
  if (!definitionId) {
    ElMessage.warning(t('workflowDefinitions.cannotRecognizeDefinitionId'))
    return
  }
  try {
    xmlContent.value = await getWorkflowDefinitionXml(definitionId)
    xmlDialogVisible.value = true
  } catch {
    ElMessage.error(t('workflowDefinitions.getXmlFailed'))
  }
}

const handleViewDiagram = async (definition: WorkflowDefinition) => {
  const definitionId = resolveDefinitionId(definition)
  if (!definitionId) {
    ElMessage.warning(t('workflowDefinitions.cannotRecognizeDefinitionId'))
    return
  }
  try {
    const diagramData = await getWorkflowDefinitionDiagram(definitionId)
    diagramImage.value = normalizeDiagramImage(diagramData)
    currentNodes.value = await getWorkflowDefinitionNodes(definitionId)
    diagramDialogVisible.value = true
    await nextTick()
    updateDiagramSize()
  } catch {
    ElMessage.error(t('workflowDefinitions.loadDiagramFailed'))
  }
}

const handleDiagramLoaded = () => {
  updateDiagramSize()
}

const updateDiagramSize = () => {
  if (!diagramImageRef.value) return
  const rect = diagramImageRef.value.getBoundingClientRect()
  diagramSize.width = rect.width
  diagramSize.height = rect.height
  diagramSize.naturalWidth = diagramImageRef.value.naturalWidth
  diagramSize.naturalHeight = diagramImageRef.value.naturalHeight
}

const openStartDialog = (definition: WorkflowDefinition) => {
  const key = resolveDefinitionKey(definition)
  if (!key) {
    ElMessage.warning(t('workflowDefinitions.cannotRecognizeProcessKey'))
    return
  }
  startDialogForm.processDefinitionKey = key
  startDialogForm.businessKey = ''
  startDialogForm.variablesJson = ''
  startDialogVisible.value = true
}

const handleStartDialog = async () => {
  const variables = parseJson(startDialogForm.variablesJson)
  if (variables === null) return
  startingProcess.value = true
  try {
    const payload = {
      processDefinitionKey: startDialogForm.processDefinitionKey,
      businessKey: startDialogForm.businessKey || undefined,
      variables: variables || undefined
    }
    await startWorkflowProcess(payload)
    startDialogVisible.value = false
    ElMessage.success(t('workflowDefinitions.processStarted'))
  } catch {
    ElMessage.error(t('workflowDefinitions.startFailed'))
  } finally {
    startingProcess.value = false
  }
}

const parseJson = (value: string): Record<string, unknown> | undefined | null => {
  if (!value) return undefined
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      ElMessage.error(t('workflowDefinitions.variablesMustBeJsonObject'))
      return null
    }
    return parsed
  } catch {
    ElMessage.error(t('workflowDefinitions.jsonFormatIncorrect'))
    return null
  }
}

const resolveDefinitionId = (definition: WorkflowDefinition): string => {
  if (typeof definition.id === 'string' && definition.id) return definition.id
  const definitionId = (definition as Record<string, unknown>).definitionId
  if (typeof definitionId === 'string' && definitionId) return definitionId
  const processDefinitionId = (definition as Record<string, unknown>).processDefinitionId
  if (typeof processDefinitionId === 'string' && processDefinitionId) return processDefinitionId
  return ''
}

const resolveDefinitionKey = (definition: WorkflowDefinition): string => {
  if (typeof definition.key === 'string' && definition.key) return definition.key
  const processDefinitionKey = (definition as Record<string, unknown>).processDefinitionKey
  if (typeof processDefinitionKey === 'string' && processDefinitionKey) return processDefinitionKey
  return ''
}

const getNodeDescription = (type?: string) => {
  if (!type) return t('workflowDefinitions.noDescription')
  const lowered = type.toLowerCase()
  const matched = nodeGuideList.find(item => lowered.includes(item.type.toLowerCase()))
  return matched ? matched.description : t('workflowDefinitions.noDescription')
}

const getNodeTooltip = (node: WorkflowNode) => {
  const name = node.name || node.activityId || node.id || t('workflowDefinitions.node')
  const type = node.type || 'unknown'
  const description = getNodeDescription(type)
  return `${name} · ${type} · ${description}`
}

const getNodeTagType = (status?: string) => {
  if (!status) return 'info'
  const text = status.toLowerCase()
  if (text.includes('active') || text.includes('running')) return 'success'
  if (text.includes('end') || text.includes('finished')) return 'info'
  if (text.includes('suspend')) return 'warning'
  if (text.includes('error') || text.includes('fail')) return 'danger'
  return 'info'
}

const resizeHandler = () => {
  updateDiagramSize()
}

onMounted(() => {
  loadDefinitions()
  window.addEventListener('resize', resizeHandler)
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeHandler)
})
</script>

<style scoped>
.workflow-page {
  padding: 20px;
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

.diagram-section {
  background: var(--bg-color);
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.diagram-container {
  width: 100%;
  overflow: auto;
}

.diagram-wrapper {
  position: relative;
  width: fit-content;
  max-width: 100%;
}

.diagram-image {
  max-width: 100%;
  display: block;
}

.diagram-node {
  position: absolute;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

:deep(.el-table .el-table__cell) {
  padding: 12px 0;
}

:deep(.el-button + .el-button) {
  margin-left: 8px;
}
</style>
