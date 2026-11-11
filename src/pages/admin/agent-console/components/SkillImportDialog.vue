<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled, Files, Connection, Check, Close, ArrowRight, Document, CircleCheck } from '@element-plus/icons-vue'
import type { AxiosError } from 'axios'
import { agentConsole, type SkillImportItem, type SkillImportDraft } from '@/api/agentConsole'
import { hasPermission } from '@/utils/permission'
const props = defineProps<{ existingCodes: string[] }>()
const emit = defineEmits<{ close: []; imported: [] }>()
const mode = ref(hasPermission('ai:skill:import:archive:api') ? 'archive' : 'github')
const file = ref<File>()
const filePicker = ref<HTMLInputElement>()
const dragging = ref(false)
const url = ref(''), branch = ref(''), directory = ref('')
const loading = ref(false), saving = ref(false), error = ref('')
const drafts = ref<(SkillImportItem & { selected: boolean })[]>([])
const warnings = ref<string[]>([])
let alive = true, generation = 0
onBeforeUnmount(() => { alive = false; generation++ })
watch([mode, file, url, branch, directory], () => {
  generation++
  drafts.value = []
  warnings.value = []
  error.value = ''
})
const selected = computed(() => drafts.value.filter(item => item.selected))
const existing = computed(() => new Set(props.existingCodes.map(code => code.toLowerCase())))
function failure(reason: unknown, fallback: string) {
  const response = (reason as AxiosError<{ message?: string }> | undefined)?.response
  return response?.data?.message || (reason instanceof Error ? reason.message : fallback)
}
function toggleSelection() {
  const next = !drafts.value.every(item => item.selected)
  drafts.value.forEach(item => { item.selected = next })
}
function codeError(item: SkillImportItem) {
  if (!/^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/.test(item.code)) return '字母开头，最多64位字母、数字、下划线或短横线'
  if (existing.value.has(item.code.toLowerCase())) return '已有相同编码，请修改'
  if (selected.value.filter(other => other.code.toLowerCase() === item.code.toLowerCase()).length > 1) return '选中技能的编码重复'
  return ''
}
const valid = computed(() => selected.value.length > 0 && selected.value.every(item => !codeError(item) && item.name.trim() && item.name.length <= 120))
function acceptFile(candidate?: File) {
  if (loading.value || saving.value || !candidate) return
  if (candidate.size > 20 * 1024 * 1024 || !/\.(zip|tar\.gz|tgz)$/i.test(candidate.name)) {
    ElMessage.error('请选择不超过20MiB的 ZIP、tar.gz 或 tgz 文件')
    return
  }
  file.value = candidate
}
function choose(event: Event) {
  const target = event.target as HTMLInputElement
  acceptFile(target.files?.[0])
  target.value = ''
}
function dropFile(event: DragEvent) {
  dragging.value = false
  if (loading.value || saving.value) return
  if (event.dataTransfer?.files.length !== 1) {
    ElMessage.error('请一次上传一个压缩包')
    return
  }
  acceptFile(event.dataTransfer.files[0])
}
function removeFile() {
  if (!loading.value && !saving.value) file.value = undefined
}
function resetPreview() {
  if (loading.value || saving.value) return
  generation++
  drafts.value = []
  warnings.value = []
  error.value = ''
}
function changeMode(value: string) {
  if (!loading.value && !saving.value) mode.value = value
}
function fileSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
async function preview() {
  if (loading.value || saving.value || (mode.value === 'archive' ? !file.value : !url.value.trim())) return
  loading.value = true
  error.value = ''
  drafts.value = []
  warnings.value = []
  const token = ++generation
  try {
    const result = mode.value === 'archive'
      ? await agentConsole.previewSkillArchive(file.value!)
      : await agentConsole.previewGithubSkills({ url: url.value.trim(), ref: branch.value.trim() || undefined, path: directory.value.trim() || undefined })
    if (!alive || token !== generation) return
    drafts.value = result.skills.map(item => ({ ...item, selected: true }))
    warnings.value = result.warnings
  } catch (reason) {
    if (alive && token === generation) error.value = failure(reason, '解析失败，请检查文件或仓库地址后重试')
  } finally { if (alive && token === generation) loading.value = false }
}
async function commit() {
  if (!valid.value || saving.value || loading.value) return
  saving.value = true
  error.value = ''
  const payload: SkillImportDraft[] = selected.value.map(item => ({
    code: item.code, name: item.name, description: item.description, enabled: item.enabled,
    content: item.content, resources: item.resources, toolIds: item.toolIds,
  }))
  try {
    const result = await agentConsole.importSkills(payload)
    if (!alive) return
    ElMessage.success(`已导入 ${result.length} 个技能，重新发布绑定它们的智能体后生效`)
    emit('imported')
    emit('close')
  } catch (reason) {
    if (alive) error.value = failure(reason, '导入失败，请检查编码是否重复后重试')
  } finally { if (alive) saving.value = false }
}
function close() { if (!loading.value && !saving.value) emit('close') }
</script>
<template>
  <el-dialog :model-value="true" title="导入技能" :width="drafts.length ? 'min(1000px, calc(100vw - 32px))' : 'min(760px, calc(100vw - 32px))'"
    class="skill-import-dialog" align-center :close-on-click-modal="false"
    :close-on-press-escape="!loading && !saving" :show-close="!loading && !saving" @close="close">
    <template #header="{ titleId }">
      <div class="import-heading">
        <span class="import-heading-icon" aria-hidden="true"><el-icon><Files /></el-icon></span>
        <div><h2 :id="titleId">导入技能</h2><p>将现成的 Skill 加入你的技能库。</p></div>
      </div>
    </template>

    <div class="import-steps" aria-label="导入进度">
      <span :class="{ current: !drafts.length, complete: drafts.length }" :aria-current="!drafts.length ? 'step' : undefined"><i><el-icon v-if="drafts.length"><Check /></el-icon><template v-else>1</template></i>选择来源</span>
      <span class="step-line" aria-hidden="true"></span>
      <span :class="{ current: drafts.length }" :aria-current="drafts.length ? 'step' : undefined"><i>2</i>预览并导入</span>
    </div>

    <template v-if="!drafts.length">
      <div class="source-options" role="group" aria-label="导入来源">
        <button v-if="hasPermission('ai:skill:import:archive:api')" type="button" class="source-option"
          :class="{ 'is-active': mode === 'archive' }" :aria-pressed="mode === 'archive'" :disabled="loading || saving" @click="changeMode('archive')">
          <el-icon aria-hidden="true"><Files /></el-icon><span><strong>上传压缩包</strong><small>从本地文件导入</small></span><el-icon v-if="mode === 'archive'" class="source-check" aria-hidden="true"><CircleCheck /></el-icon>
        </button>
        <button v-if="hasPermission('ai:skill:import:github:api')" type="button" class="source-option"
          :class="{ 'is-active': mode === 'github' }" :aria-pressed="mode === 'github'" :disabled="loading || saving" @click="changeMode('github')">
          <el-icon aria-hidden="true"><Connection /></el-icon><span><strong>GitHub 仓库</strong><small>从公开仓库导入</small></span><el-icon v-if="mode === 'github'" class="source-check" aria-hidden="true"><CircleCheck /></el-icon>
        </button>
      </div>

      <section v-if="mode === 'archive'" class="archive-source" aria-label="上传压缩包">
        <input ref="filePicker" class="file-input-hidden" type="file" accept=".zip,.tar.gz,.tgz" aria-label="选择技能压缩包" tabindex="-1" :disabled="loading || saving" @change="choose" />
        <button v-if="!file" type="button" class="archive-dropzone" :class="{ 'is-dragging': dragging, 'is-loading': loading }"
          :disabled="loading || saving" @click="filePicker?.click()" @dragover.prevent="dragging = true" @dragleave.prevent="dragging = false" @drop.prevent="dropFile">
          <span class="upload-symbol" aria-hidden="true"><el-icon><UploadFilled /></el-icon></span>
          <strong>点击上传，或将压缩包拖到这里</strong>
          <span>支持 ZIP、tar.gz、tgz · 不超过 20 MiB</span>
        </button>
        <div v-else class="selected-archive" @dragover.prevent @drop.prevent="dropFile">
          <span class="archive-file-icon" aria-hidden="true"><el-icon><Files /></el-icon></span>
          <div class="archive-file-details"><strong :title="file.name">{{ file.name }}</strong><span>{{ fileSize(file.size) }}<i></i>已就绪，等待预览</span></div>
          <el-button text :disabled="loading || saving" @click="filePicker?.click()">更换文件</el-button>
          <el-button text :icon="Close" aria-label="移除所选文件" :disabled="loading || saving" @click="removeFile" />
        </div>
        <div class="source-tip"><el-icon aria-hidden="true"><Document /></el-icon><p>每个技能目录需包含 <code>SKILL.md</code>，一个压缩包可导入多个技能。</p></div>
      </section>

      <section v-else class="github-source" aria-label="GitHub 导入">
        <el-form label-position="top" @submit.prevent="preview">
          <el-form-item label="仓库地址" class="repository-field"><el-input v-model="url" :prefix-icon="Connection" :disabled="loading || saving" placeholder="https://github.com/owner/repository" maxlength="1000" clearable /><p class="field-caption">支持公开仓库地址，也可直接粘贴 tree 目录链接。</p></el-form-item>
          <div class="github-options">
            <el-form-item><template #label>分支 / Tag / 提交 <span class="optional">可选</span></template><el-input v-model="branch" :disabled="loading || saving" placeholder="默认分支" maxlength="200" /></el-form-item>
            <el-form-item><template #label>子目录 <span class="optional">可选</span></template><el-input v-model="directory" :disabled="loading || saving" placeholder="例如 skills/pdf" maxlength="500" /></el-form-item>
          </div>
          <p class="source-footnote">分支名含 / 时，请分别填写完整分支和子目录。</p>
        </el-form>
      </section>
      <p class="format-note">支持技能说明、脚本和参考文档等 UTF-8 文本，暂不支持二进制附件。每个技能最多 500 个配套资源，UTF-8 内容总量不超过 20MB。</p>
      <p v-if="loading" class="parsing-status" role="status">{{ mode === 'github' ? '正在读取仓库并解析技能，请稍候…' : '正在解析压缩包，请稍候…' }}</p>
    </template>

    <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon class="import-notice" />
    <el-alert v-for="warning in warnings" :key="warning" :title="warning" type="warning" :closable="false" class="import-notice" />

    <section v-if="drafts.length" aria-label="技能导入预览" class="preview-panel">
      <div class="source-summary"><span><el-icon aria-hidden="true"><component :is="mode === 'archive' ? Files : Connection" /></el-icon><strong>{{ mode === 'archive' ? file?.name : url }}</strong></span><el-button text :disabled="saving" @click="resetPreview">重新选择</el-button></div>
      <header class="preview-heading"><div><h3>选择要导入的技能 <span>{{ drafts.length }}</span></h3><p>可以修改名称和编码，重复编码需修改后再导入。</p></div><el-button text :disabled="saving" @click="toggleSelection">{{ selected.length === drafts.length ? '取消全选' : '全选' }}</el-button></header>
      <el-table :data="drafts" row-key="sourcePath" max-height="340" class="skills-preview-table">
        <el-table-column type="expand" width="36"><template #default="{ row }"><div class="skill-detail"><p>来源目录：{{ row.sourcePath }}</p><p>{{ row.description || '没有说明' }}</p><p>资源 {{ Object.keys(row.resources).length }} 个：{{ Object.keys(row.resources).join('、') || '无' }}</p><pre>{{ row.content }}</pre></div></template></el-table-column>
        <el-table-column label="选择" width="56"><template #default="{ row }"><el-checkbox v-model="row.selected" :disabled="saving" :aria-label="`选择 ${row.name}`" /></template></el-table-column>
        <el-table-column label="名称" min-width="190"><template #default="{ row }"><el-input v-model="row.name" :disabled="saving" maxlength="120" :aria-label="`技能名称 ${row.sourcePath}`" /><small class="skill-path">{{ row.sourcePath }}</small></template></el-table-column>
        <el-table-column label="唯一编码" min-width="210"><template #default="{ row }"><el-input v-model="row.code" :disabled="saving" maxlength="64" :aria-label="`技能编码 ${row.sourcePath}`" /><small v-if="row.selected && codeError(row)" class="code-error">{{ codeError(row) }}</small></template></el-table-column>
        <el-table-column label="资源" width="70"><template #default="{ row }"><span class="resource-count">{{ Object.keys(row.resources).length }} 项</span></template></el-table-column>
        <el-table-column label="启用" width="70"><template #default="{ row }"><el-switch v-model="row.enabled" :disabled="saving" :aria-label="`启用 ${row.name}`" /></template></el-table-column>
      </el-table>
    </section>

    <template #footer>
      <div class="import-footer"><span class="footer-note"><el-icon aria-hidden="true"><CircleCheck /></el-icon>{{ drafts.length ? `已选择 ${selected.length} 个技能，已有技能不会被覆盖` : '预览确认后才会导入' }}</span><div class="footer-actions">
        <el-button :disabled="loading || saving" @click="close">取消</el-button>
        <el-button v-if="!drafts.length" type="primary" :loading="loading" :disabled="saving || (mode === 'archive' ? !file : !url.trim())" @click="preview">预览技能<el-icon v-if="!loading" class="action-arrow"><ArrowRight /></el-icon></el-button>
        <el-button v-else-if="hasPermission('ai:skill:import:commit:api')" type="primary" :loading="saving" :disabled="!valid || loading" @click="commit">确认导入 {{ selected.length ? `(${selected.length})` : '' }}</el-button>
      </div></div>
    </template>
  </el-dialog>
</template>
<style>
.skill-import-dialog.el-dialog { padding: 0; border-radius: 16px; overflow: hidden; max-height: calc(100dvh - 48px); display: flex; flex-direction: column; }
.skill-import-dialog .el-dialog__header { padding: 26px 28px 0; margin-right: 0; flex-shrink: 0; }
.skill-import-dialog .el-dialog__headerbtn { top: 18px; right: 16px; }
.skill-import-dialog .el-dialog__body { padding: 22px 28px 24px; overflow-y: auto; min-height: 0; }
.skill-import-dialog .el-dialog__footer { padding: 17px 28px; border-top: 1px solid var(--el-border-color-lighter); background: var(--el-fill-color-light); flex-shrink: 0; }
.skill-import-dialog .import-heading { display: flex; align-items: center; gap: 14px; padding-right: 26px; }
.skill-import-dialog .import-heading-icon { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 12px; color: var(--el-color-primary); background: var(--el-color-primary-light-9); font-size: 23px; flex-shrink: 0; }
.skill-import-dialog .import-heading h2 { margin: 0; color: var(--el-text-color-primary); font-size: 20px; line-height: 1.4; font-weight: 600; }
.skill-import-dialog .import-heading p { margin: 5px 0 0; font-size: 13px; color: var(--el-text-color-regular); line-height: 1.5; }
.skill-import-dialog .import-steps { display: flex; align-items: center; gap: 14px; padding-bottom: 23px; color: var(--el-text-color-placeholder); font-size: 12px; }
.skill-import-dialog .import-steps > span:not(.step-line) { display: flex; align-items: center; gap: 7px; white-space: nowrap; }
.skill-import-dialog .import-steps i { display: grid; place-items: center; width: 20px; height: 20px; border-radius: 50%; font-style: normal; background: var(--el-fill-color); font-size: 11px; }
.skill-import-dialog .import-steps .current { color: var(--el-color-primary); font-weight: 500; }
.skill-import-dialog .import-steps .current i { color: var(--el-color-white); background: var(--el-color-primary); }
.skill-import-dialog .import-steps .complete { color: var(--el-text-color-regular); }
.skill-import-dialog .import-steps .complete i { color: var(--el-color-primary); background: var(--el-color-primary-light-9); }
.skill-import-dialog .step-line { width: 38px; height: 1px; background: var(--el-border-color-light); }
.skill-import-dialog .source-options { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
.skill-import-dialog .source-option { display: flex; align-items: center; gap: 12px; padding: 15px 17px; border: 1px solid var(--el-border-color); border-radius: 10px; background: var(--el-bg-color); text-align: left; color: var(--el-text-color-regular); cursor: pointer; font: inherit; transition: border-color .16s ease, background .16s ease; }
.skill-import-dialog .source-option > .el-icon { font-size: 22px; }
.skill-import-dialog .source-option > span { display: flex; flex-direction: column; gap: 4px; flex: 1; }
.skill-import-dialog .source-option strong { font-weight: 500; font-size: 14px; color: var(--el-text-color-primary); }
.skill-import-dialog .source-option small { font-size: 12px; color: var(--el-text-color-regular); }
.skill-import-dialog .source-option.is-active { border-color: var(--el-color-primary); background: var(--el-color-primary-light-9); color: var(--el-color-primary); }
.skill-import-dialog .source-option .source-check { font-size: 17px; }
.skill-import-dialog .source-option:disabled { cursor: wait; }
.skill-import-dialog .source-option:focus-visible, .skill-import-dialog .archive-dropzone:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 3px; }
.skill-import-dialog .file-input-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.skill-import-dialog .archive-dropzone { width: 100%; min-height: 185px; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 10px; padding: 24px; border: 1px dashed var(--el-border-color); border-radius: 12px; background: var(--el-fill-color-lighter); color: var(--el-text-color-regular); font: inherit; cursor: pointer; transition: border-color .16s ease, background .16s ease; }
.skill-import-dialog .archive-dropzone:hover, .skill-import-dialog .archive-dropzone.is-dragging { border-color: var(--el-color-primary); background: var(--el-color-primary-light-9); }
.skill-import-dialog .upload-symbol { width: 48px; height: 48px; display: grid; place-items: center; border: 1px solid var(--el-border-color-lighter); border-radius: 13px; background: var(--el-bg-color); color: var(--el-color-primary); font-size: 28px; margin-bottom: 3px; }
.skill-import-dialog .archive-dropzone strong { font-size: 15px; font-weight: 500; color: var(--el-text-color-primary); }
.skill-import-dialog .archive-dropzone > span:last-child { font-size: 12px; color: var(--el-text-color-regular); }
.skill-import-dialog .source-tip { display: flex; align-items: flex-start; gap: 8px; color: var(--el-text-color-regular); margin-top: 13px; }
.skill-import-dialog .source-tip > .el-icon { margin-top: 2px; flex-shrink: 0; }
.skill-import-dialog .source-tip p { margin: 0; font-size: 12px; line-height: 1.7; }
.skill-import-dialog code { padding: 1px 5px; border-radius: 4px; background: var(--el-fill-color); color: var(--el-text-color-primary); font-size: 11px; }
.skill-import-dialog .selected-archive { display: flex; align-items: center; gap: 13px; min-height: 102px; padding: 20px; border: 1px solid var(--el-color-primary-light-7); border-radius: 12px; background: var(--el-color-primary-light-9); }
.skill-import-dialog .archive-file-icon { display: grid; place-items: center; width: 44px; height: 48px; color: var(--el-color-primary); background: var(--el-bg-color); border-radius: 9px; font-size: 25px; flex-shrink: 0; }
.skill-import-dialog .archive-file-details { min-width: 0; flex: 1; }
.skill-import-dialog .archive-file-details strong { display: block; font-size: 14px; font-weight: 500; color: var(--el-text-color-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.skill-import-dialog .archive-file-details > span { display: flex; gap: 9px; align-items: center; margin-top: 7px; color: var(--el-text-color-regular); font-size: 12px; }
.skill-import-dialog .archive-file-details i { width: 3px; height: 3px; border-radius: 50%; background: var(--el-text-color-placeholder); }
.skill-import-dialog .selected-archive .el-button + .el-button { margin-left: 0; }
.skill-import-dialog .github-source { padding-top: 2px; }
.skill-import-dialog .github-source .el-form-item { margin-bottom: 16px; }
.skill-import-dialog .github-source .el-form-item__label { font-size: 13px; font-weight: 500; padding-bottom: 7px; line-height: 20px; }
.skill-import-dialog .github-source .el-input__wrapper { padding: 5px 11px; }
.skill-import-dialog .field-caption { margin: 7px 0 0; color: var(--el-text-color-regular); font-size: 12px; line-height: 1.6; }
.skill-import-dialog .github-options { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.skill-import-dialog .optional { font-size: 11px; font-weight: 400; color: var(--el-text-color-placeholder); margin-left: 4px; }
.skill-import-dialog .source-footnote { margin: -3px 0 0; font-size: 12px; color: var(--el-text-color-regular); line-height: 1.6; }
.skill-import-dialog .format-note { margin: 17px 0 0; padding-top: 14px; border-top: 1px solid var(--el-border-color-lighter); font-size: 12px; line-height: 1.6; color: var(--el-text-color-regular); }
.skill-import-dialog .parsing-status { margin: 12px 0 0; color: var(--el-color-primary); font-size: 12px; }
.skill-import-dialog .import-notice { margin-top: 14px; }
.skill-import-dialog .import-footer { display: flex; justify-content: space-between; align-items: center; gap: 16px; text-align: left; }
.skill-import-dialog .footer-note { display: flex; align-items: center; gap: 6px; color: var(--el-text-color-regular); font-size: 12px; line-height: 1.5; }
.skill-import-dialog .footer-note > .el-icon { color: var(--el-color-primary); flex-shrink: 0; }
.skill-import-dialog .footer-actions { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.skill-import-dialog .footer-actions .el-button + .el-button { margin-left: 0; }
.skill-import-dialog .footer-actions .el-button { min-height: 36px; padding-left: 18px; padding-right: 18px; }
.skill-import-dialog .action-arrow { margin-left: 8px; }
.skill-import-dialog .source-summary { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 10px 13px; border: 1px solid var(--el-border-color-lighter); background: var(--el-fill-color-lighter); border-radius: 8px; margin-bottom: 20px; }
.skill-import-dialog .source-summary > span { min-width: 0; display: flex; gap: 8px; align-items: center; color: var(--el-text-color-regular); }
.skill-import-dialog .source-summary strong { font-size: 12px; font-weight: 400; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.skill-import-dialog .preview-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 15px; }
.skill-import-dialog .preview-heading h3 { font-size: 15px; font-weight: 500; margin: 0; color: var(--el-text-color-primary); }
.skill-import-dialog .preview-heading h3 span { font-size: 12px; background: var(--el-fill-color); border-radius: 5px; padding: 2px 6px; margin-left: 5px; }
.skill-import-dialog .preview-heading p { margin: 6px 0 0; font-size: 12px; color: var(--el-text-color-regular); }
.skill-import-dialog .skills-preview-table { border: 1px solid var(--el-border-color-lighter); border-radius: 8px; }
.skill-import-dialog .skills-preview-table th.el-table__cell { background: var(--el-fill-color-light); font-size: 12px; font-weight: 500; }
.skill-import-dialog .skills-preview-table .el-table__cell { padding-top: 12px; padding-bottom: 12px; vertical-align: top; }
.skill-import-dialog .skill-path { display: block; margin-top: 5px; color: var(--el-text-color-secondary); font-size: 11px; line-height: 1.5; overflow-wrap: anywhere; }
.skill-import-dialog .resource-count { color: var(--el-text-color-regular); font-size: 12px; line-height: 32px; }
.skill-import-dialog .code-error { display: block; color: var(--el-color-danger); margin-top: 5px; font-size: 11px; }
.skill-import-dialog .skill-detail { padding: 0 20px 16px; overflow-wrap: anywhere; font-size: 12px; }
.skill-import-dialog .skill-detail pre { max-height: 220px; overflow: auto; white-space: pre-wrap; font: 12px/1.7 var(--el-font-family); padding: 14px; background: var(--el-fill-color-light); border-radius: 8px; }
@media (max-width: 640px) {
  .skill-import-dialog .el-dialog__header { padding: 20px 20px 0; }
  .skill-import-dialog .el-dialog__body { padding: 18px 20px 20px; }
  .skill-import-dialog .el-dialog__footer { padding: 14px 20px; }
  .skill-import-dialog .source-option { padding: 12px 10px; gap: 8px; }
  .skill-import-dialog .source-option small { font-size: 11px; }
  .skill-import-dialog .source-option .source-check { display: none; }
  .skill-import-dialog .github-options { grid-template-columns: 1fr; gap: 0; }
  .skill-import-dialog .import-footer { flex-wrap: wrap; gap: 12px; }
  .skill-import-dialog .footer-actions { margin-left: auto; }
  .skill-import-dialog .selected-archive { padding: 15px; gap: 9px; flex-wrap: wrap; }
  .skill-import-dialog .archive-file-details { min-width: 140px; }
}
@media (prefers-reduced-motion: reduce) {
  .skill-import-dialog .source-option, .skill-import-dialog .archive-dropzone { transition: none; }
}
</style>
