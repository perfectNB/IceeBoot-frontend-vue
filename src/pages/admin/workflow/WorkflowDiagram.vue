<template>
  <div class="workflow-page admin-page">
    <AdminPageHeader :title="t('workflowDiagram.title')" :description="t('workflowDiagram.description')" />

    <div class="search-section">
      <el-form :model="diagramForm" inline>
        <el-form-item :label="t('workflowDiagram.displayType')">
          <el-radio-group v-model="diagramForm.mode">
            <el-radio-button label="definition">{{ t('workflowDiagram.processDefinition') }}</el-radio-button>
            <el-radio-button label="instance">{{ t('workflowDiagram.processInstance') }}</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="t('workflowDiagram.processDefinition')" v-if="diagramForm.mode === 'definition'">
          <el-select v-model="diagramForm.definitionId" :placeholder="t('workflowDiagram.selectProcessDefinition')" style="width: 240px">
            <el-option v-for="item in definitionOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('workflowDiagram.processInstance')" v-else>
          <el-input v-model="diagramForm.processInstanceId" :placeholder="t('workflowDiagram.inputProcessInstanceId')" style="width: 260px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loadingDiagram" @click="loadDiagram">{{ t('workflowDiagram.loadDiagram') }}</el-button>
          <el-button :icon="FullScreen" @click="toggleDiagramFullscreen">
            {{ isDiagramFullscreen ? t('workflowDiagram.exitFullscreen') : t('workflowDiagram.fullscreen') }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="diagram-section" :class="{ 'diagram-fullscreen': isDiagramFullscreen }">
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
      <el-empty v-else :description="t('workflowDiagram.noDiagram')" />
    </div>

    <div class="table-section">
      <div class="section-title">{{ t('workflowDiagram.nodeStatus') }}</div>
      <el-table :data="currentNodes" stripe border style="width: 100%">
        <el-table-column prop="activityId" :label="t('workflowDiagram.nodeId')" min-width="160" show-overflow-tooltip />
        <el-table-column prop="name" :label="t('workflowDiagram.nodeName')" min-width="160" show-overflow-tooltip />
        <el-table-column prop="type" :label="t('workflowDiagram.type')" width="120" show-overflow-tooltip />
        <el-table-column :label="t('workflowDiagram.status')" width="120">
          <template #default="{ row }">
            <el-tag :type="getNodeTagType(row.status)">
              {{ row.status || '-' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="x" label="X" width="80" />
        <el-table-column prop="y" label="Y" width="80" />
        <el-table-column prop="width" :label="t('workflowDiagram.width')" width="80" />
        <el-table-column prop="height" :label="t('workflowDiagram.height')" width="80" />
        <el-table-column :label="t('workflowDiagram.description')" min-width="240" show-overflow-tooltip>
          <template #default="{ row }">
            {{ getNodeDescription(row.type) }}
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { normalizeDiagramImage } from '@/utils/workflowDiagram'
import AdminPageHeader from '@/components/common/AdminPageHeader.vue'
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { FullScreen } from '@element-plus/icons-vue'
import {
  getWorkflowDefinitionDiagram,
  getWorkflowDefinitionNodes,
  getWorkflowDefinitions,
  workflowInstanceDiagram,
  getWorkflowProcessNodes,
  type WorkflowDefinition,
  type WorkflowNode
} from '@/api'
import { useI18n } from 'vue-i18n'

defineOptions({
  name: 'WorkflowDiagram'
})

const { t } = useI18n()

const definitions = ref<WorkflowDefinition[]>([])

const diagramForm = reactive({
  mode: 'definition',
  definitionId: '',
  processInstanceId: ''
})
const isDiagramFullscreen = ref(false)
const loadingDiagram = ref(false)
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
  { name: '开始事件', type: 'startEvent', description: '流程启动入口，触发后进入后续节点' },
  { name: '结束事件', type: 'endEvent', description: '流程结束出口，标识流程完成或终止' },
  { name: '用户任务', type: 'userTask', description: '需要人工处理的审批或填单节点' },
  { name: '服务任务', type: 'serviceTask', description: '由系统自动执行的服务或接口调用节点' },
  { name: '脚本任务', type: 'scriptTask', description: '执行脚本逻辑，适合数据处理与转换' },
  { name: '人工任务', type: 'manualTask', description: '线下人工动作，系统仅记录' },
  { name: '接收任务', type: 'receiveTask', description: '等待消息或事件触发后继续流程' },
  { name: '排他网关', type: 'exclusiveGateway', description: '条件判断，只走一条分支' },
  { name: '并行网关', type: 'parallelGateway', description: '同时分叉或汇聚多个分支' },
  { name: '包含网关', type: 'inclusiveGateway', description: '满足条件的分支可并行执行' },
  { name: '调用活动', type: 'callActivity', description: '调用子流程复用流程定义' },
  { name: '子流程', type: 'subProcess', description: '将复杂流程封装为可折叠子流程' }
]

const definitionOptions = computed(() =>
  definitions.value
    .map(item => ({
      label: `${item.name || item.key || item.id} ${item.version ? `v${item.version}` : ''}`.trim(),
      value: resolveDefinitionId(item)
    }))
    .filter(item => item.value)
)

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
  try {
    definitions.value = await getWorkflowDefinitions({ latestOnly: true })
  } catch {
    ElMessage.error(t('workflowDiagram.loadDefinitionsFailed'))
  }
}

const loadDiagram = async () => {
  if (diagramForm.mode === 'definition' && !diagramForm.definitionId) {
    ElMessage.warning(t('workflowDiagram.selectProcessDefinitionRequired'))
    return
  }
  if (diagramForm.mode === 'instance' && !diagramForm.processInstanceId) {
    ElMessage.warning(t('workflowDiagram.inputProcessInstanceIdRequired'))
    return
  }
  loadingDiagram.value = true
  try {
    if (diagramForm.mode === 'definition') {
      const diagramData = await getWorkflowDefinitionDiagram(diagramForm.definitionId)
      diagramImage.value = normalizeDiagramImage(diagramData)
      currentNodes.value = await getWorkflowDefinitionNodes(diagramForm.definitionId)
    } else {
      const instanceId = diagramForm.processInstanceId
      const diagramData = await workflowInstanceDiagram(instanceId)
      diagramImage.value = normalizeDiagramImage(diagramData)
      currentNodes.value = await getWorkflowProcessNodes(instanceId)
    }
    await nextTick()
    updateDiagramSize()
  } catch {
    ElMessage.error(t('workflowDiagram.loadDiagramFailed'))
  } finally {
    loadingDiagram.value = false
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

const resolveDefinitionId = (definition: WorkflowDefinition): string => {
  if (typeof definition.id === 'string' && definition.id) return definition.id
  const definitionId = (definition as Record<string, unknown>).definitionId
  if (typeof definitionId === 'string' && definitionId) return definitionId
  const processDefinitionId = (definition as Record<string, unknown>).processDefinitionId
  if (typeof processDefinitionId === 'string' && processDefinitionId) return processDefinitionId
  return ''
}

const getNodeDescription = (type?: string) => {
  if (!type) return t('workflowDiagram.noDescription')
  const lowered = type.toLowerCase()
  const matched = nodeGuideList.find(item => lowered.includes(item.type.toLowerCase()))
  return matched ? matched.description : t('workflowDiagram.noDescription')
}

const getNodeTooltip = (node: WorkflowNode) => {
  const name = node.name || node.activityId || node.id || t('workflowDiagram.node')
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

const toggleDiagramFullscreen = () => {
  isDiagramFullscreen.value = !isDiagramFullscreen.value
}

onMounted(() => {
  loadDefinitions()
  window.addEventListener('resize', resizeHandler)
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeHandler)
})

watch(
  () => isDiagramFullscreen.value,
  value => {
    document.body.style.overflow = value ? 'hidden' : ''
  },
  { immediate: true }
)
</script>

<style scoped>
.workflow-page {
  padding: 20px;
}

.search-section {
  background: var(--bg-color);
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
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

.diagram-fullscreen {
  position: fixed;
  inset: 16px;
  z-index: 3000;
  margin: 0;
  overflow: auto;
}

.diagram-fullscreen .diagram-container {
  max-height: calc(100vh - 160px);
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
