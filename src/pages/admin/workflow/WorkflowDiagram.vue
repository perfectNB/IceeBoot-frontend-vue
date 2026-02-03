<template>
  <div class="workflow-page">
    <div class="page-header">
      <h2>流程图展示</h2>
      <p>按流程定义或流程实例查看流程图与节点状态</p>
    </div>

    <div class="search-section">
      <el-form :model="diagramForm" inline>
        <el-form-item label="展示类型">
          <el-radio-group v-model="diagramForm.mode">
            <el-radio-button label="definition">流程定义</el-radio-button>
            <el-radio-button label="instance">流程实例</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="流程定义" v-if="diagramForm.mode === 'definition'">
          <el-select v-model="diagramForm.definitionId" placeholder="请选择流程定义" style="width: 240px">
            <el-option v-for="item in definitionOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="流程实例" v-else>
          <el-input v-model="diagramForm.processInstanceId" placeholder="请输入流程实例ID" style="width: 260px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loadingDiagram" @click="loadDiagram">加载流程图</el-button>
          <el-button :icon="FullScreen" @click="toggleDiagramFullscreen">
            {{ isDiagramFullscreen ? '退出全屏' : '全屏' }}
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
      <el-empty v-else description="暂无流程图" />
    </div>

    <div class="table-section">
      <div class="section-title">节点状态</div>
      <el-table :data="currentNodes" stripe border style="width: 100%">
        <el-table-column prop="activityId" label="节点ID" min-width="160" show-overflow-tooltip />
        <el-table-column prop="name" label="节点名称" min-width="160" show-overflow-tooltip />
        <el-table-column prop="type" label="类型" width="120" show-overflow-tooltip />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getNodeTagType(row.status)">
              {{ row.status || '-' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="x" label="X" width="80" />
        <el-table-column prop="y" label="Y" width="80" />
        <el-table-column prop="width" label="宽度" width="80" />
        <el-table-column prop="height" label="高度" width="80" />
        <el-table-column label="说明" min-width="240" show-overflow-tooltip>
          <template #default="{ row }">
            {{ getNodeDescription(row.type) }}
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { FullScreen } from '@element-plus/icons-vue'
import {
  getWorkflowDefinitionDiagram,
  getWorkflowDefinitionNodes,
  getWorkflowDefinitions,
  getWorkflowProcess,
  getWorkflowProcessNodes,
  type WorkflowDefinition,
  type WorkflowNode
} from '@/api'

defineOptions({
  name: 'WorkflowDiagram'
})

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
    ElMessage.error('加载流程定义失败')
  }
}

const loadDiagram = async () => {
  if (diagramForm.mode === 'definition' && !diagramForm.definitionId) {
    ElMessage.warning('请选择流程定义')
    return
  }
  if (diagramForm.mode === 'instance' && !diagramForm.processInstanceId) {
    ElMessage.warning('请输入流程实例ID')
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
      const instance = await getWorkflowProcess(instanceId)
      const definitionId = instance.processDefinitionId || instance.id || ''
      if (!definitionId) {
        ElMessage.warning('无法获取流程定义ID')
        return
      }
      const diagramData = await getWorkflowDefinitionDiagram(definitionId)
      diagramImage.value = normalizeDiagramImage(diagramData)
      currentNodes.value = await getWorkflowProcessNodes(instanceId)
    }
    await nextTick()
    updateDiagramSize()
  } catch {
    ElMessage.error('加载流程图失败')
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

const normalizeDiagramImage = (payload: Record<string, unknown> | string): string => {
  if (typeof payload === 'string') {
    return buildImageSource(payload)
  }
  const normalizedPayloads: Record<string, unknown>[] = [payload]
  const dataPayload = payload.data
  if (dataPayload && typeof dataPayload === 'object') {
    normalizedPayloads.push(dataPayload as Record<string, unknown>)
  }
  const resultPayload = payload.result
  if (resultPayload && typeof resultPayload === 'object') {
    normalizedPayloads.push(resultPayload as Record<string, unknown>)
  }
  const candidates = ['data', 'image', 'diagram', 'content', 'base64', 'diagramImage', 'file']
  for (const item of normalizedPayloads) {
    for (const key of candidates) {
      const value = item[key]
      if (typeof value === 'string' && value) {
        const contentType = resolveContentType(item)
        return buildImageSource(value, contentType)
      }
    }
  }
  return ''
}

const resolveContentType = (payload: Record<string, unknown>): string => {
  const contentType = payload.contentType
  if (typeof contentType === 'string' && contentType) return contentType
  const type = payload.type
  if (typeof type === 'string' && type) return type
  return ''
}

const buildImageSource = (value: string, contentType?: string): string => {
  if (value.startsWith('data:image')) return value
  const trimmed = value.trim()
  const isSvgText = trimmed.startsWith('<svg') || trimmed.includes('<svg')
  const isSvgBase64 = trimmed.startsWith('PD94') || trimmed.startsWith('PHN2Zy')
  if (isSvgText) {
    return `data:image/svg+xml;utf8,${encodeURIComponent(trimmed)}`
  }
  if (isSvgBase64) {
    return `data:image/svg+xml;base64,${trimmed}`
  }
  if (contentType && contentType.includes('svg')) {
    return `data:${contentType};base64,${trimmed}`
  }
  if (contentType && contentType.startsWith('image/')) {
    return `data:${contentType};base64,${trimmed}`
  }
  return `data:image/png;base64,${trimmed}`
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
  if (!type) return '暂无说明'
  const lowered = type.toLowerCase()
  const matched = nodeGuideList.find(item => lowered.includes(item.type.toLowerCase()))
  return matched ? matched.description : '暂无说明'
}

const getNodeTooltip = (node: WorkflowNode) => {
  const name = node.name || node.activityId || node.id || '节点'
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
