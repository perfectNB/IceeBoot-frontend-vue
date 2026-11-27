<template>
  <ApprovalDesigner v-if="editing" :blueprint="editing" @close="returnToList" />
  <section v-else class="approval-shell" v-loading="busy">
    <AdminPageHeader
      :title="diagram ? '发起审批' : '流程定义'"
      :count="total"
      :description="diagram ? '按名称查找流程，选择后填写申请。' : '查看已发布版本，预览和修改流程草稿。'"
    >
      <el-input
        v-if="diagram"
        v-model="search"
        class="catalog-search"
        :prefix-icon="Search"
        aria-label="搜索流程名称"
        placeholder="搜索流程名称"
        clearable
        @input="scheduleSearch"
        @keyup.enter="searchNow"
      />
      <el-button v-else :icon="Refresh" @click="load">刷新</el-button>
    </AdminPageHeader>
    <div class="approval-panel">
      <el-empty
        v-if="!rows.length"
        :description="diagram ? (search ? '没有匹配的流程' : '暂无可发起的流程') : '暂无可查看的流程'"
        :image-size="64"
      />
      <article v-for="row in rows" :key="row.code" class="approval-list-item">
        <span class="approval-mark"
          ><el-icon><Share /></el-icon
        ></span>
        <div class="approval-list-name">
          <strong>{{ row.name }}</strong>
          <small v-if="!diagram">{{ row.code }}</small>
        </div>
        <div class="status">
          <el-tag :type="row.stopped ? 'info' : row.version ? 'success' : 'warning'" effect="light">
            {{ row.stopped ? '已停用 · v' + row.version : row.version ? '已发布 v' + row.version : '草稿' }}
          </el-tag>
          <el-tag v-if="row.changed" type="warning" effect="plain">有未发布修改</el-tag>
        </div>
        <div class="row-actions">
          <template v-if="!diagram">
            <el-button
              v-if="row.version && (manageDrafts || can('published'))"
              @click="openTemplate(row, 'published')"
              >查看流程</el-button
            >
            <el-button
              v-if="manageDrafts && (!row.version || row.changed)"
              @click="openTemplate(row, 'draft')"
              >预览草稿</el-button
            >
            <el-button v-if="manageDrafts && can('save')" :icon="EditPen" @click="openTemplate(row, 'edit')"
              >修改流程</el-button
            >
          </template>
          <el-button
            v-else-if="!row.stopped && can('start')"
            type="primary"
            :icon="Position"
            @click="openTemplate(row, 'start')"
            >发起审批</el-button
          >
        </div>
      </article>
      <footer class="catalog-footer">
        <span>共 {{ total }} 个流程</span>
        <el-pagination
          :current-page="page"
          :page-size="size"
          :page-sizes="[10, 20, 50]"
          :total="total"
          :pager-count="5"
          background
          layout="sizes, prev, pager, next"
          @current-change="loadPage($event, size)"
          @size-change="loadPage(1, $event)"
        />
      </footer>
    </div>
    <el-dialog
      :model-value="!!application"
      @close="application = undefined"
      title="发起审批"
      width="min(540px,94vw)"
      destroy-on-close
      :close-on-click-modal="false"
    >
      <template v-if="application">
        <div class="application-title">
          <strong>{{ application.design.name }}</strong
          ><el-tag effect="plain">v{{ application.version }}</el-tag>
        </div>
        <ApprovalForm v-model="values" :fields="application.design.fields" />
        <p class="approval-hint">
          {{
            application.design.fields.length
              ? '提交后，本轮申请信息将锁定。'
              : '此流程无需填写表单，可以直接提交。'
          }}
        </p>
      </template>
      <template #footer
        ><el-button @click="application = undefined">取消</el-button
        ><el-button type="primary" :loading="busy" @click="submit">提交申请</el-button></template
      >
    </el-dialog>
    <ApprovalPreview
      v-if="selected"
      :blueprint="selected"
      :published="publishedPreview"
      :roles="roles"
      @close="selected = undefined"
    />
  </section>
</template>
<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import ApprovalForm from './ApprovalForm.vue'
import { validateForm } from '@/utils/approval'
import { ElMessage } from 'element-plus'
import { EditPen, Position, Refresh, Search, Share } from '@element-plus/icons-vue'
import AdminPageHeader from '@/components/common/AdminPageHeader.vue'
import ApprovalDesigner from './ApprovalDesigner.vue'
import ApprovalPreview from './ApprovalPreview.vue'
import { approvalApi } from '@/api/approval'
import { hasPermission } from '@/utils/permission'
import type { ApprovalRole, Blueprint, TemplateRow, Values } from '@/types/approval'
const props = defineProps<{ diagram?: boolean }>()
const can = (p: string) => hasPermission('workflow:approval:' + p + ':api')
const manageDrafts = computed(() => !props.diagram && can('drafts'))
const busy = ref(false)
const rows = ref<TemplateRow[]>([])
const roles = ref<ApprovalRole[]>([])
const page = ref(1)
const size = ref(10)
const total = ref(0)
const editing = ref<Blueprint>()
const selected = ref<Blueprint>()
const publishedPreview = ref(false)
let requestId = 0
const search = ref('')
const application = ref<Blueprint>()
const values = ref<Values>({})
let timer: ReturnType<typeof setTimeout>
function searchNow() {
  clearTimeout(timer)
  loadPage(1, size.value)
}
function scheduleSearch() {
  clearTimeout(timer)
  timer = setTimeout(searchNow, 200)
}
onBeforeUnmount(() => clearTimeout(timer))
async function openTemplate(row: TemplateRow, mode: 'draft' | 'published' | 'edit' | 'start') {
  busy.value = true
  try {
    const released = mode === 'published'
    const managed = released && manageDrafts.value
    const template = await approvalApi.template(mode === 'start' || (released && !managed), row.code, managed)
    if (mode === 'start') {
      if (template.stopped || template.version !== row.version) {
        ElMessage.warning('模板状态或版本已更新，请重新选择')
        await load()
        return
      }
      values.value = {}
      application.value = template
    } else if (mode === 'edit') editing.value = template
    else {
      selected.value = template
      publishedPreview.value = released
    }
  } finally {
    busy.value = false
  }
}
async function submit() {
  const b = application.value
  if (!b || busy.value) return
  busy.value = true
  try {
    validateForm(b.design, values.value)
    await approvalApi.submit(b.design.code, b.version, values.value)
    application.value = undefined
    ElMessage.success('申请已提交')
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '提交失败，请重试')
  } finally {
    busy.value = false
  }
}
function returnToList() {
  editing.value = undefined
  load()
}
async function loadPage(next: number, limit: number) {
  const seq = ++requestId
  busy.value = true
  try {
    const result = await approvalApi.page(
      !manageDrafts.value,
      next,
      limit,
      props.diagram ? search.value.trim() : undefined
    )
    if (seq !== requestId) return
    rows.value = result.records
    total.value = result.total
    page.value = result.current
    size.value = result.size
  } finally {
    if (seq === requestId) busy.value = false
  }
}
function load() {
  return loadPage(page.value, size.value)
}
onMounted(async () => {
  await Promise.all([
    load(),
    !props.diagram &&
      can('roles') &&
      approvalApi.roles().then((result) => {
        roles.value = result
      })
  ])
})
</script>
<style scoped>
.catalog-search {
  width: min(290px, 100%);
}
.application-title {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 17px;
}

.approval-list-item:first-child {
  padding-top: 0;
}
.approval-list-item:last-child {
  border: 0;
  padding-bottom: 0;
}
.approval-list-name {
  overflow-wrap: anywhere;
}
.status,
.row-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.row-actions :deep(.el-button + .el-button) {
  margin: 0;
}
.catalog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 16px;
  color: var(--el-text-color-regular);
  font-size: 13px;
}
.catalog-footer :deep(.el-pagination) {
  max-width: 100%;
  flex-wrap: wrap;
  row-gap: 8px;
}
.row-actions .el-button {
  margin: 0;
}
</style>
