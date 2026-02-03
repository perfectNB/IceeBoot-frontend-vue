<template>
  <div class="workflow-page">
    <div class="page-header">
      <h2>BPMN设计</h2>
      <p>拖拽节点设计流程，支持导入、保存与部署</p>
    </div>

    <div class="designer-section" :class="{ 'designer-fullscreen': isDesignerFullscreen }">
      <div class="designer-toolbar">
        <el-space wrap>
          <el-button type="primary" :icon="Plus" @click="handleCreateDiagram">新建</el-button>
          <el-button :icon="Upload" @click="importDialogVisible = true">导入XML</el-button>
          <el-button :icon="Document" @click="handleSaveDesignerXml">保存XML</el-button>
          <el-button type="success" :icon="UploadFilled" :loading="deployingDesigner" @click="openDesignerDeployDialog">
            部署
          </el-button>
          <el-button :icon="FullScreen" @click="toggleDesignerFullscreen">
            {{ isDesignerFullscreen ? '退出全屏' : '全屏' }}
          </el-button>
        </el-space>
        <div class="designer-tip">拖拽左侧面板添加节点，双击节点可编辑名称，连线完成流程编排</div>
      </div>
      <div ref="designerRef" class="designer-canvas"></div>
    </div>

    <div class="table-section">
      <div class="section-title">使用指引</div>
      <el-row :gutter="16">
        <el-col :span="12">
          <div class="guide-block">
            <div class="guide-title">如何搭建流程</div>
            <div class="guide-item">1. 从左侧中文面板拖拽“开始事件”</div>
            <div class="guide-item">2. 选择“用户任务/服务任务”并连线</div>
            <div class="guide-item">3. 拖拽“结束事件”并完成连线</div>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="guide-block">
            <div class="guide-title">常用操作</div>
            <div class="guide-item">双击节点：修改节点名称</div>
            <div class="guide-item">拖拽节点：调整位置</div>
            <div class="guide-item">连线端点：选择分支方向</div>
          </div>
        </el-col>
      </el-row>
    </div>

    <div class="table-section">
      <div class="section-title">节点说明</div>
      <el-table :data="nodeGuideList" stripe border style="width: 100%">
        <el-table-column prop="name" label="节点名称" width="160" />
        <el-table-column prop="type" label="类型标识" width="200" show-overflow-tooltip />
        <el-table-column prop="description" label="作用说明" min-width="320" show-overflow-tooltip />
      </el-table>
    </div>

    <el-row :gutter="16">
      <el-col :span="12">
        <div class="table-section">
          <div class="section-title">上传部署</div>
          <el-form :model="deployForm" label-width="90px">
            <el-form-item label="流程名称">
              <el-input v-model="deployForm.name" placeholder="可选" />
            </el-form-item>
            <el-form-item label="流程分类">
              <el-input v-model="deployForm.category" placeholder="可选" />
            </el-form-item>
            <el-form-item label="租户ID">
              <el-input v-model="deployForm.tenantId" placeholder="可选" />
            </el-form-item>
            <el-form-item label="BPMN文件">
              <el-upload
                :auto-upload="false"
                :limit="1"
                :file-list="deployFileList"
                :on-change="handleDeployFileChange"
                :on-remove="handleDeployFileRemove"
                accept=".bpmn,.xml"
              >
                <el-button type="primary">选择文件</el-button>
              </el-upload>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="deploying" @click="handleDeployFile">部署</el-button>
              <el-button @click="resetDeployForm">重置</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="table-section">
          <div class="section-title">XML设计部署</div>
          <el-form :model="xmlForm" label-width="90px">
            <el-form-item label="流程名称">
              <el-input v-model="xmlForm.name" placeholder="可选" />
            </el-form-item>
            <el-form-item label="流程分类">
              <el-input v-model="xmlForm.category" placeholder="可选" />
            </el-form-item>
            <el-form-item label="租户ID">
              <el-input v-model="xmlForm.tenantId" placeholder="可选" />
            </el-form-item>
            <el-form-item label="BPMN XML">
              <el-input v-model="xmlForm.xml" type="textarea" :rows="12" placeholder="输入BPMN XML内容" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="deployingXml" @click="handleDeployXml">保存部署</el-button>
              <el-button @click="resetXmlForm">重置</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-col>
    </el-row>

    <el-dialog v-model="importDialogVisible" title="导入BPMN XML" width="70%">
      <el-input v-model="importXml" type="textarea" :rows="20" placeholder="粘贴BPMN XML内容" />
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="importDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleImportXml">导入</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="designerDeployDialogVisible" title="部署流程" width="520px" @close="resetDesignerDeployForm">
      <el-form :model="designerDeployForm" label-width="90px">
        <el-form-item label="流程名称">
          <el-input v-model="designerDeployForm.name" placeholder="必填" />
        </el-form-item>
        <el-form-item label="流程分类">
          <el-input v-model="designerDeployForm.category" placeholder="可选" />
        </el-form-item>
        <el-form-item label="租户ID">
          <el-input v-model="designerDeployForm.tenantId" placeholder="可选" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="deployingDesigner" @click="handleConfirmDesignerDeploy">部署</el-button>
          <el-button @click="designerDeployDialogVisible = false">取消</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { ElMessage, type UploadFile, type UploadUserFile } from 'element-plus'
import { Document, FullScreen, Plus, Upload, UploadFilled } from '@element-plus/icons-vue'
import Modeler from 'bpmn-js/lib/Modeler'
import 'bpmn-js/dist/assets/diagram-js.css'
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css'
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css'
import { deployWorkflowDefinition, getWorkflowDefinitions, type WorkflowDefinition } from '@/api'

defineOptions({
  name: 'BPMNDesign'
})

const latestOnly = ref(true)
const definitions = ref<WorkflowDefinition[]>([])

const deployForm = reactive({
  name: '',
  category: '',
  tenantId: ''
})
const deployFileList = ref<UploadUserFile[]>([])
const deployFile = ref<File | null>(null)
const deploying = ref(false)

const xmlForm = reactive({
  name: '',
  category: '',
  tenantId: '',
  xml: ''
})
const deployingXml = ref(false)

const designerRef = ref<HTMLDivElement>()
const isDesignerFullscreen = ref(false)
const importDialogVisible = ref(false)
const importXml = ref('')
const deployingDesigner = ref(false)
const designerDeployDialogVisible = ref(false)
const designerDeployForm = reactive({
  name: '',
  category: '',
  tenantId: ''
})
let bpmnModeler: Modeler | null = null

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

const designerTranslations: Record<string, string> = {
  'Activate the hand tool': '启用抓手工具',
  'Activate the lasso tool': '启用套索工具',
  'Activate the create/remove space tool': '启用空间调整工具',
  'Activate the global connect tool': '启用全局连线工具',
  'Start Event': '开始事件',
  'Start event': '开始事件',
  'End Event': '结束事件',
  'End event': '结束事件',
  'Intermediate Throw Event': '中间抛出事件',
  'Intermediate Catch Event': '中间捕获事件',
  'Boundary Event': '边界事件',
  'Task': '任务',
  'User Task': '用户任务',
  'Service Task': '服务任务',
  'Script Task': '脚本任务',
  'Manual Task': '人工任务',
  'Receive Task': '接收任务',
  'Send Task': '发送任务',
  'Business Rule Task': '规则任务',
  'Call Activity': '调用活动',
  'Sub Process': '子流程',
  'Event Sub Process': '事件子流程',
  'Transaction': '事务子流程',
  'Collapsed Sub Process': '折叠子流程',
  'Expanded Sub Process': '展开子流程',
  'Data Object Reference': '数据对象',
  'Data Store Reference': '数据存储',
  'Data Input': '数据输入',
  'Data Output': '数据输出',
  'Pool/Participant': '泳池/参与者',
  'Lane': '泳道',
  'Group': '分组',
  'Gateway': '排他网关',
  'Create Gateway': '创建排他网关',
  'Append Gateway': '追加排他网关',
  'Exclusive Gateway': '排他网关',
  'Parallel Gateway': '并行网关',
  'Inclusive Gateway': '包含网关',
  'Event based Gateway': '事件网关',
  'Complex Gateway': '复杂网关',
  'Message Start Event': '消息开始事件',
  'Timer Start Event': '定时开始事件',
  'Error Start Event': '错误开始事件',
  'Signal Start Event': '信号开始事件',
  'Message End Event': '消息结束事件',
  'Error End Event': '错误结束事件',
  'Signal End Event': '信号结束事件',
  'Terminate End Event': '终止结束事件',
  'Compensation End Event': '补偿结束事件',
  'Message Intermediate Throw Event': '消息中间抛出事件',
  'Message Intermediate Catch Event': '消息中间捕获事件',
  'Timer Intermediate Catch Event': '定时中间捕获事件',
  'Signal Intermediate Throw Event': '信号中间抛出事件',
  'Signal Intermediate Catch Event': '信号中间捕获事件',
  'Conditional Intermediate Catch Event': '条件中间捕获事件',
  'Link Intermediate Throw Event': '链接中间抛出事件',
  'Link Intermediate Catch Event': '链接中间捕获事件',
  'Compensation Intermediate Throw Event': '补偿中间抛出事件',
  'Compensation Intermediate Catch Event': '补偿中间捕获事件',
  'Message Boundary Event': '消息边界事件',
  'Timer Boundary Event': '定时边界事件',
  'Error Boundary Event': '错误边界事件',
  'Signal Boundary Event': '信号边界事件',
  'Cancel Boundary Event': '取消边界事件',
  'Compensation Boundary Event': '补偿边界事件',
  'Conditional Boundary Event': '条件边界事件',
  'Parallel Multi Instance': '并行多实例',
  'Sequential Multi Instance': '串行多实例',
  'Loop': '循环',
  'Create StartEvent': '创建开始事件',
  'Create EndEvent': '创建结束事件',
  'Create Task': '创建任务',
  'Create UserTask': '创建用户任务',
  'Create ServiceTask': '创建服务任务',
  'Create ScriptTask': '创建脚本任务',
  'Create ManualTask': '创建人工任务',
  'Create ReceiveTask': '创建接收任务',
  'Create SendTask': '创建发送任务',
  'Create BusinessRuleTask': '创建规则任务',
  'Create CallActivity': '创建调用活动',
  'Create SubProcess': '创建子流程',
  'Create Expanded SubProcess': '创建展开子流程',
  'Create DataObjectReference': '创建数据对象',
  'Create DataStoreReference': '创建数据存储',
  'Create Pool/Participant': '创建泳池/参与者',
  'Create Lane': '创建泳道',
  'Create Group': '创建分组',
  'Create ExclusiveGateway': '创建排他网关',
  'Create ParallelGateway': '创建并行网关',
  'Create InclusiveGateway': '创建包含网关',
  'Create EventBasedGateway': '创建事件网关',
  'Create ComplexGateway': '创建复杂网关'
}

const createDesignerTranslate = (translations: Record<string, string>) => {
  return (template: string, replacements?: Record<string, string>) => {
    const text = translations[template] || template
    if (!replacements) return text
    return text.replace(/\{([^}]+)\}/g, (_, key) => replacements[key] || `{${key}}`)
  }
}

const defaultBpmnXml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
  id="Definitions_1"
  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="152" y="102" width="36" height="36" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`

const initDesigner = async () => {
  if (!designerRef.value) return
  if (bpmnModeler) {
    bpmnModeler.destroy()
    bpmnModeler = null
  }
  bpmnModeler = new Modeler({
    container: designerRef.value,
    additionalModules: [
      {
        translate: ['value', createDesignerTranslate(designerTranslations)]
      }
    ]
  })
  await importXmlToDesigner(defaultBpmnXml)
}

const ensureDesignerReady = async () => {
  if (bpmnModeler) return
  await nextTick()
  if (!designerRef.value) return
  await initDesigner()
}

const importXmlToDesigner = async (xml: string) => {
  if (!bpmnModeler) return
  try {
    await bpmnModeler.importXML(xml)
    const canvas = bpmnModeler.get('canvas') as { zoom: (value: string) => void }
    canvas.zoom('fit-viewport')
  } catch {
    ElMessage.error('导入BPMN失败')
  }
}

const handleCreateDiagram = async () => {
  if (!bpmnModeler) {
    await ensureDesignerReady()
  }
  await importXmlToDesigner(defaultBpmnXml)
}

const handleImportXml = async () => {
  if (!importXml.value.trim()) {
    ElMessage.warning('请输入BPMN XML内容')
    return
  }
  if (!bpmnModeler) {
    await ensureDesignerReady()
  }
  await importXmlToDesigner(importXml.value)
  importDialogVisible.value = false
  ElMessage.success('导入成功')
}

const handleSaveDesignerXml = async () => {
  if (!bpmnModeler) {
    await ensureDesignerReady()
  }
  if (!bpmnModeler) return
  try {
    const { xml } = await bpmnModeler.saveXML({ format: true })
    if (!xml) {
      ElMessage.error('保存XML失败')
      return
    }
    xmlForm.xml = xml
    ElMessage.success('已同步到XML输入框')
  } catch {
    ElMessage.error('保存XML失败')
  }
}

const openDesignerDeployDialog = () => {
  designerDeployDialogVisible.value = true
}

const resetDesignerDeployForm = () => {
  designerDeployForm.name = ''
  designerDeployForm.category = ''
  designerDeployForm.tenantId = ''
}

const handleConfirmDesignerDeploy = async () => {
  if (!designerDeployForm.name.trim()) {
    ElMessage.warning('请输入流程名称')
    return
  }
  if (!bpmnModeler) {
    await ensureDesignerReady()
  }
  if (!bpmnModeler) return
  deployingDesigner.value = true
  try {
    const { xml } = await bpmnModeler.saveXML({ format: true })
    if (!xml) {
      ElMessage.error('部署失败')
      return
    }
    const name = designerDeployForm.name.trim()
    const file = new File([xml], `${name}.bpmn`, { type: 'text/xml' })
    await deployWorkflowDefinition({
      file,
      name,
      category: designerDeployForm.category || undefined,
      tenantId: designerDeployForm.tenantId || undefined
    })
    ElMessage.success('部署成功')
    designerDeployDialogVisible.value = false
    resetDesignerDeployForm()
    await loadDefinitions()
  } catch {
    ElMessage.error('部署失败')
  } finally {
    deployingDesigner.value = false
  }
}

const loadDefinitions = async () => {
  try {
    definitions.value = await getWorkflowDefinitions({ latestOnly: latestOnly.value })
  } catch {
    ElMessage.error('加载流程定义失败')
  }
}

const handleDeployFileChange = (file: UploadFile) => {
  deployFile.value = file.raw || null
  deployFileList.value = file.raw ? [{ name: file.name, url: file.url, uid: file.uid }] : []
}

const handleDeployFileRemove = () => {
  deployFile.value = null
  deployFileList.value = []
}

const handleDeployFile = async () => {
  if (!deployFile.value) {
    ElMessage.warning('请选择BPMN文件')
    return
  }
  deploying.value = true
  try {
    await deployWorkflowDefinition({
      file: deployFile.value,
      name: deployForm.name || undefined,
      category: deployForm.category || undefined,
      tenantId: deployForm.tenantId || undefined
    })
    ElMessage.success('部署成功')
    resetDeployForm()
    await loadDefinitions()
  } catch {
    ElMessage.error('部署失败')
  } finally {
    deploying.value = false
  }
}

const resetDeployForm = () => {
  deployForm.name = ''
  deployForm.category = ''
  deployForm.tenantId = ''
  deployFile.value = null
  deployFileList.value = []
}

const handleDeployXml = async () => {
  if (!xmlForm.xml.trim()) {
    ElMessage.warning('请输入BPMN XML内容')
    return
  }
  deployingXml.value = true
  try {
    const filename = `${xmlForm.name || 'process'}.bpmn`
    const file = new File([xmlForm.xml], filename, { type: 'text/xml' })
    await deployWorkflowDefinition({
      file,
      name: xmlForm.name || undefined,
      category: xmlForm.category || undefined,
      tenantId: xmlForm.tenantId || undefined
    })
    ElMessage.success('部署成功')
    resetXmlForm()
    await loadDefinitions()
  } catch {
    ElMessage.error('部署失败')
  } finally {
    deployingXml.value = false
  }
}

const resetXmlForm = () => {
  xmlForm.name = ''
  xmlForm.category = ''
  xmlForm.tenantId = ''
  xmlForm.xml = ''
}

const toggleDesignerFullscreen = () => {
  isDesignerFullscreen.value = !isDesignerFullscreen.value
}

onMounted(async () => {
  await loadDefinitions()
  await ensureDesignerReady()
})

onUnmounted(() => {
  if (bpmnModeler) {
    bpmnModeler.destroy()
    bpmnModeler = null
  }
})

watch(
  () => isDesignerFullscreen.value,
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

.designer-section {
  background: var(--bg-color);
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.designer-toolbar {
  margin-bottom: 16px;
}

.designer-tip {
  margin-top: 12px;
  color: var(--text-secondary);
  font-size: 13px;
}

.designer-canvas {
  width: 100%;
  height: 560px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-color);
}

.guide-block {
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 16px;
  height: 100%;
}

.guide-title {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.guide-item {
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.8;
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

.designer-fullscreen {
  position: fixed;
  inset: 16px;
  z-index: 3000;
  height: auto;
}

.designer-fullscreen .designer-canvas {
  height: calc(100vh - 200px);
}

:deep(.el-table .el-table__cell) {
  padding: 12px 0;
}

:deep(.el-button + .el-button) {
  margin-left: 8px;
}
</style>
