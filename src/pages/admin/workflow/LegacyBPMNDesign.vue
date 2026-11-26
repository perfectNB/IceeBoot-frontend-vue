<template>
  <div class="workflow-page admin-page">
    <AdminPageHeader :title="t('bpmnDesign.studio')" :description="t('bpmnDesign.intro')">
      <el-button :icon="FolderOpened" @click="openImport">{{ t('bpmnDesign.importProcess') }}</el-button>
      <el-button v-if="canPublish" type="primary" :icon="Promotion" :disabled="!ready" @click="openPublish('canvas')">{{ t('bpmnDesign.publish') }}</el-button>
    </AdminPageHeader>

    <div v-if="published" class="published" role="status">
      <span><el-icon><CircleCheck /></el-icon> {{ t('bpmnDesign.published', { name: published }) }}</span>
      <router-link v-if="hasPermission('workflow:definition')" to="/admin/workflow/definition?mode=bpmn">{{ t('bpmnDesign.toDefinitions') }} →</router-link>
    </div>

    <section ref="studio" class="studio">
      <header class="studio-bar">
        <strong><el-icon><Share /></el-icon>{{ t('bpmnDesign.canvas') }}</strong>
        <div class="studio-actions">
          <el-button text :icon="Plus" :disabled="!ready" @click="newDesign">{{ t('bpmnDesign.new') }}</el-button>
          <el-button text :icon="Download" :disabled="!ready" @click="download">{{ t('bpmnDesign.download') }}</el-button>
          <el-button text :icon="FullScreen" @click="fullscreen">{{ t('bpmnDesign.fullscreen') }}</el-button>
        </div>
      </header>
      <div class="studio-body">
        <div class="board">
          <div ref="container" class="canvas"></div>
          <button type="button" class="fit" @click="fit">{{ t('bpmnDesign.fit') }}</button>
        </div>
        <aside class="inspector">
          <h2>{{ selected ? t('bpmnDesign.nodeSettings') : t('bpmnDesign.getStarted') }}</h2>
          <template v-if="selected">
            <label>{{ t('bpmnDesign.nodeName') }}<el-input :model-value="nodeName" @change="setProperty('name', $event)" /></label>
            <label v-if="selected.type === 'bpmn:UserTask'">{{ t('workflowTasks.assignee') }}
              <el-input :model-value="assignee" :placeholder="t('bpmnDesign.assigneeHint')" @change="setProperty('activiti:assignee', $event)" />
            </label>
            <p>{{ t('bpmnDesign.nodeTip') }}</p>
          </template>
          <template v-else>
            <div class="step"><i class="symbol start"></i><div><b>{{ t('bpmnDesign.stepStart') }}</b><p>{{ t('bpmnDesign.startHint') }}</p></div></div>
            <div class="step"><i class="symbol task"></i><div><b>{{ t('bpmnDesign.stepReview') }}</b><p>{{ t('bpmnDesign.reviewHint') }}</p></div></div>
            <div class="step"><i class="symbol end"></i><div><b>{{ t('bpmnDesign.stepEnd') }}</b><p>{{ t('bpmnDesign.endHint') }}</p></div></div>
          </template>
          <details class="guide"><summary>{{ t('bpmnDesign.nodeDescription') }}</summary>
            <dl><template v-for="key in guideKeys" :key="key"><dt>{{ t('bpmnDesign.' + key) }}</dt><dd>{{ t('bpmnDesign.' + key + 'Desc') }}</dd></template></dl>
          </details>
        </aside>
      </div>
    </section>

    <el-dialog v-model="importOpen" :title="t('bpmnDesign.importProcess')" width="min(570px, 92vw)">
      <el-tabs v-model="importMode"><el-tab-pane :label="t('bpmnDesign.bpmnFile')" name="file">
        <label class="file-pick"><el-icon><FolderOpened /></el-icon><span>{{ file?.name || t('bpmnDesign.selectFile') }}</span>
          <input type="file" accept=".bpmn,.xml,.bpmn20.xml" @change="pickFile" /></label>
      </el-tab-pane><el-tab-pane :label="t('bpmnDesign.pasteXml')" name="xml">
        <el-input v-model="sourceText" type="textarea" :rows="9" :placeholder="t('bpmnDesign.pasteBpmnXml')" />
      </el-tab-pane></el-tabs>
      <template #footer>
        <el-button v-if="canPublish" :disabled="!hasSource" @click="openPublish('source')">{{ t('bpmnDesign.publishSource') }}</el-button>
        <el-button type="primary" :disabled="!hasSource" :loading="importing" @click="importSource">{{ t('bpmnDesign.openCanvas') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="publishOpen" :title="t('bpmnDesign.publish')" width="min(480px, 92vw)">
      <el-form label-position="top" @submit.prevent="publish">
        <el-form-item :label="t('bpmnDesign.processName')" required><el-input v-model="form.name" autofocus /></el-form-item>
        <details class="guide"><summary>{{ t('bpmnDesign.advanced') }}</summary>
          <el-form-item :label="t('bpmnDesign.processCategory')"><el-input v-model="form.category" /></el-form-item>
          <el-form-item :label="t('bpmnDesign.tenantId')"><el-input v-model="form.tenantId" /></el-form-item>
        </details>
      </el-form>
      <template #footer><el-button @click="publishOpen = false">{{ t('bpmnDesign.cancel') }}</el-button>
        <el-button type="primary" :loading="publishing" :disabled="!form.name.trim()" @click="publish">{{ t('bpmnDesign.publish') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CircleCheck, Download, FolderOpened, FullScreen, Plus, Promotion, Share } from '@element-plus/icons-vue'
import Modeler from 'bpmn-js/lib/Modeler'
import type Modeling from 'bpmn-js/lib/features/modeling/Modeling'
import type { Element } from 'bpmn-js/lib/model/Types'
import type Canvas from 'diagram-js/lib/core/Canvas'
import 'bpmn-js/dist/assets/diagram-js.css'
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css'
import AdminPageHeader from '@/components/common/AdminPageHeader.vue'
import { deployWorkflowDefinition } from '@/api/workflow'
import { useUserStore } from '@/stores/user'
import { hasPermission } from '@/utils/permission'
import activitiAssignment from './activitiAssignment.json'
import { approvalTemplate } from './approvalTemplate'
import { createDesignerTranslate } from './designerTranslate'

const { t, locale } = useI18n()
const store = useUserStore()
const canPublish = computed(() => hasPermission('workflow:definition:deploy:api'))
const container = ref<HTMLDivElement>()
const studio = ref<HTMLElement>()
const ready = ref(false)
const dirty = ref(false)
const selected = shallowRef<Element>()
const nodeName = ref('')
const assignee = ref('')
const published = ref('')
const importOpen = ref(false)
const importMode = ref('file')
const sourceText = ref('')
const file = ref<File>()
const importing = ref(false)
const hasSource = computed(() => importMode.value === 'file' ? !!file.value : !!sourceText.value.trim())
const publishOpen = ref(false)
const publishing = ref(false)
const source = ref<'source' | 'canvas'>('canvas')
const form = reactive({ name: '', category: '', tenantId: '' })
const guideKeys = ['startEvent','userTask','exclusiveGateway','parallelGateway','endEvent','serviceTask','scriptTask','manualTask','receiveTask','inclusiveGateway','callActivity','subProcess']
let modeler: Modeler | undefined

function templateXml() {
  return approvalTemplate(store.user?.id, ['sample','stepStart','reviewName','stepEnd'].map(key => t('bpmnDesign.' + key)))
}
function fit() {
  const canvas = modeler?.get<Canvas>('canvas')
  if (canvas) {
    const { width, height } = canvas.getSize()
    canvas.zoom('fit-viewport', { x: width / 2, y: height / 2 })
  }
}
async function fullscreen() {
  if (document.fullscreenElement) await document.exitFullscreen()
  else await studio.value?.requestFullscreen()
  fit()
}
function showNode(element?: Element) {
  selected.value = element
  nodeName.value = element?.businessObject.name || ''
  assignee.value = element?.businessObject.get('activiti:assignee') || ''
}
function setProperty(key: string, value: string) {
  if (!selected.value || !modeler) return
  modeler.get<Modeling>('modeling').updateProperties(selected.value, { [key]: value.trim() || undefined })
}
async function loadXml(xml: string) {
  await modeler!.importXML(xml)
  showNode()
  fit()
  dirty.value = false
}
async function allowReplace() {
  if (!dirty.value) return true
  try {
    await ElMessageBox.confirm(t('bpmnDesign.replaceHint'), t('bpmnDesign.replace'), { type: 'warning' })
    return true
  } catch { return false }
}
async function newDesign() {
  if (await allowReplace()) {
    await loadXml(templateXml())
    published.value = ''
  }
}
function openImport() {
  importOpen.value = true
}
function pickFile(event: Event) {
  file.value = (event.target as HTMLInputElement).files?.[0]
}
async function readSource() {
  return importMode.value === 'file' ? (await file.value?.text()) || '' : sourceText.value
}
async function importSource() {
  if (!modeler || !await allowReplace()) return
  importing.value = true
  const wasDirty = dirty.value
  let backup: string | undefined
  try {
    backup = (await modeler.saveXML()).xml
    await loadXml(await readSource())
    dirty.value = true
    published.value = ''
    importOpen.value = false
  } catch {
    if (backup) await loadXml(backup)
    dirty.value = wasDirty
    ElMessage.error(t('bpmnDesign.importFailed'))
  } finally { importing.value = false }
}
async function download() {
  try {
    const xml = (await modeler?.saveXML({ format: true }))?.xml
    if (!xml) return
    const url = URL.createObjectURL(new Blob([xml], { type: 'application/xml' }))
    const link = document.createElement('a')
    link.href = url
    link.download = (modeler?.get<Canvas>('canvas').getRootElement().businessObject.name || 'workflow') + '.bpmn'
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  } catch { ElMessage.error(t('bpmnDesign.saveXmlFailed')) }
}
function openPublish(mode: 'source' | 'canvas') {
  source.value = mode
  form.name = mode === 'canvas' ? modeler?.get<Canvas>('canvas').getRootElement().businessObject.name || '' :
    importMode.value === 'file' ? file.value?.name.replace(/\.(bpmn20\.xml|bpmn|xml)$/i, '') || '' : ''
  form.category = ''
  form.tenantId = ''
  publishOpen.value = true
}
async function publish() {
  if (publishing.value || !canPublish.value || !form.name.trim()) return
  publishing.value = true
  try {
    const name = form.name.trim()
    const xml = source.value === 'source' ? await readSource() : (await modeler?.saveXML({ format: true }))?.xml
    if (!xml) throw new Error()
    const doc = new DOMParser().parseFromString(xml, 'application/xml')
    const process = doc.getElementsByTagNameNS('http://www.omg.org/spec/BPMN/20100524/MODEL', 'process')[0]
    if (!process || doc.querySelector('parsererror')) throw new Error()
    // The engine displays the BPMN process name, independently of the deployment name.
    if (doc.getElementsByTagNameNS(process.namespaceURI!, 'process').length === 1) process.setAttribute('name', name)
    const payload = new File([new XMLSerializer().serializeToString(doc)], name + '.bpmn', { type: 'application/xml' })
    await deployWorkflowDefinition({ file: payload, name, category: form.category || undefined, tenantId: form.tenantId || undefined })
    if (source.value === 'canvas') dirty.value = false
    publishOpen.value = false
    importOpen.value = false
    published.value = name
    ElMessage.success(t('bpmnDesign.deploySuccess'))
  } catch { ElMessage.error(t('bpmnDesign.deployFailed')) }
  finally { publishing.value = false }
}
onMounted(async () => {
  modeler = new Modeler({ container: container.value, additionalModules: locale.value.startsWith('zh') ? [{ translate: ['value', createDesignerTranslate()] }] : [],
    moddleExtensions: { activiti: activitiAssignment }
  })
  modeler.on('selection.changed', ({ newSelection }: { newSelection: Element[] }) => showNode(newSelection.length === 1 ? newSelection[0] : undefined))
  modeler.on('commandStack.changed', () => { dirty.value = true; showNode(selected.value) })
  await loadXml(templateXml())
  ready.value = true
})
onBeforeUnmount(() => modeler?.destroy())
</script>

<style scoped src="./workflow.css"></style>
<style scoped>
.studio { overflow: hidden; border: 1px solid var(--el-border-color-light); border-radius: 16px; background: var(--el-bg-color); box-shadow: 0 8px 28px rgb(25 43 74 / 5%); }
.studio:fullscreen { border-radius: 0; display: flex; flex-direction: column; }
.studio:fullscreen .studio-body { flex: 1; }
.studio-bar, .studio-actions, .studio-bar strong, .published, .published span { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.studio-bar { min-height: 52px; padding: 8px 18px; justify-content: space-between; border-bottom: 1px solid var(--el-border-color-light); }
.studio-bar strong .el-icon { color: var(--el-color-primary); }
.studio-body { display: grid; grid-template-columns: minmax(0,1fr) minmax(190px, 23%); }
.board { position: relative; min-width: 0; background-color: #f7faff; background-image: radial-gradient(#cad7e6 1px, transparent 1px); background-size: 16px 16px; }
.canvas { height: clamp(360px, 54vh, 620px); width: 100%; color-scheme: light; }
.studio:fullscreen .canvas { height: 100%; }
.fit { position: absolute; left: 14px; bottom: 14px; border: 1px solid #cdd9e7; border-radius: 7px; padding: 6px 12px; background: white; color: #38526d; cursor: pointer; }
.inspector { border-left: 1px solid var(--el-border-color-light); padding: 22px 18px; }
.inspector h2 { font-size: 16px; margin: 0 0 23px; }
.inspector label { display: grid; gap: 7px; margin-bottom: 15px; font-size: 13px; }
.step { position: relative; display: flex; gap: 12px; padding: 0 0 18px; }
.step:not(:last-of-type)::before { content: ''; position: absolute; left: 7px; top: 20px; bottom: 0; border-left: 1px dashed var(--el-border-color); }
.symbol { flex: 0 0 15px; width: 15px; height: 15px; margin-top: 3px; border-radius: 50%; box-sizing: border-box; border: 2px solid #319377; background: #ecfaf5; }
.symbol.task { border-color: #5171c1; background: #eff4ff; border-radius: 4px; }
.symbol.end { border: 3px double #748096; background: transparent; }
.inspector b { font-size: 14px; }.inspector p { font-size: 13px; color: var(--el-text-color-regular); line-height: 1.65; margin: 4px 0; }
.guide { border-top: 1px solid var(--el-border-color-light); padding-top: 10px; }
.guide dl { max-height: 245px; overflow: auto; font-size: 13px; }.guide dt { font-weight: 600; }.guide dd { margin: 4px 0 10px; color: var(--el-text-color-regular); }
.published { justify-content: space-between; padding: 12px 16px; margin-bottom: 14px; border-radius: 10px; background: var(--el-color-success-light-9); }
.published a { color: var(--el-text-color-primary); }
.file-pick { position: relative; display: flex; align-items: center; justify-content: center; gap: 10px; min-height: 110px; border: 1px dashed var(--el-border-color); border-radius: 10px; background: var(--el-fill-color-lighter); }
.file-pick:focus-within { outline: 2px solid var(--el-color-primary); }.file-pick input { position: absolute; inset: 0; opacity: 0; width: 100%; cursor: pointer; }
@media(max-width: 850px) { .studio-body { grid-template-columns: 1fr; }.inspector { border-left: 0; border-top: 1px solid var(--el-border-color-light); }.canvas { height: 360px; }.studio:fullscreen { overflow: auto; } }
</style>
