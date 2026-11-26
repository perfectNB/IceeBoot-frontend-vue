<template>
  <ApprovalDesigner v-if="editing" :blueprint="editing" @close="returnToList" />
  <section v-else class="approval-shell" v-loading="busy">
    <AdminPageHeader
      :title="diagram ? '审批流程图' : '流程定义'"
      :count="rows.length"
      :description="
        diagram ? '查看已发布版本的审批路径与表单。' : '查看流程版本、继续编辑草稿，或发起已发布的审批。'
      "
    >
      <el-button :icon="Refresh" @click="load">刷新</el-button>
    </AdminPageHeader>
    <div class="approval-panel">
      <el-empty v-if="!rows.length" description="暂无可查看的流程" :image-size="64" />
      <article v-for="row in rows" :key="row.code" class="approval-list-item">
        <span class="approval-mark"
          ><el-icon><Share /></el-icon
        ></span>
        <div class="approval-list-name">
          <strong>{{ row.name }}</strong>
          <small>{{ row.code }}</small>
        </div>
        <div class="status">
          <el-tag v-if="row.live" type="success" effect="light">已发布 v{{ row.live.version }}</el-tag>
          <el-tag v-if="row.draft && (!row.draft.version || row.changed)" type="warning" effect="plain">
            {{ row.draft.version ? '有未发布修改' : '草稿' }}
          </el-tag>
          <el-tag v-else-if="!row.live && row.draft?.version" type="success"
            >已发布 v{{ row.draft.version }}</el-tag
          >
        </div>
        <div class="row-actions">
          <el-button v-if="row.live || row.draft" @click="preview(row.live || row.draft!, !!row.live)">
            {{ row.live ? '查看流程图' : '预览草稿' }}
          </el-button>
          <el-button v-if="row.draft && can('save')" :icon="EditPen" @click="editing = row.draft">
            修改流程
          </el-button>
          <router-link
            v-if="row.live && canStart"
            :to="{ name: 'WorkflowInstances', query: { approval: row.code } }"
            >发起审批</router-link
          >
        </div>
      </article>
    </div>
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
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { canOpenWorkflowPage } from './approvalNavigation'
import { EditPen, Refresh, Share } from '@element-plus/icons-vue'
import AdminPageHeader from '@/components/common/AdminPageHeader.vue'
import ApprovalDesigner from './ApprovalDesigner.vue'
import ApprovalPreview from './ApprovalPreview.vue'
import { approvalApi } from '@/api/approval'
import { hasPermission } from '@/utils/permission'
import type { ApprovalRole, Blueprint } from '@/types/approval'
const props = defineProps<{ diagram?: boolean }>()
const can = (p: string) => hasPermission('workflow:approval:' + p + ':api')
const router = useRouter()
const canStart = computed(() => can('start') && can('list') && canOpenWorkflowPage(router, 'WorkflowInstances'))
const busy = ref(false)
const published = ref<Blueprint[]>([])
const drafts = ref<Blueprint[]>([])
const roles = ref<ApprovalRole[]>([])
const editing = ref<Blueprint>()
const selected = ref<Blueprint>()
const publishedPreview = ref(false)
const rows = computed(() => {
  const liveByCode = new Map(published.value.map((b) => [b.design.code, b]))
  const draftByCode = new Map(drafts.value.map((b) => [b.design.code, b]))
  return [...new Set([...liveByCode.keys(), ...draftByCode.keys()])].map((code) => {
    const live = liveByCode.get(code)
    const draft = draftByCode.get(code)
    return {
      code,
      live,
      draft,
      name: live?.design.name || draft?.design.name || code,
      changed: !!live && !!draft && JSON.stringify(live.design) !== JSON.stringify(draft.design)
    }
  })
})
function preview(b: Blueprint, isPublished: boolean) {
  selected.value = b
  publishedPreview.value = isPublished
}
function returnToList() {
  editing.value = undefined
  load()
}
async function load() {
  if (busy.value) return
  busy.value = true
  try {
    const [live, saved, reviewers] = await Promise.all([
      can('published') ? approvalApi.published() : [],
      !props.diagram && can('drafts') ? approvalApi.drafts() : [],
      can('roles') ? approvalApi.roles() : []
    ])
    published.value = live
    drafts.value = saved
    roles.value = reviewers
  } finally {
    busy.value = false
  }
}
onMounted(load)
</script>
<style scoped>
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
.row-actions a {
  color: var(--el-color-primary);
  font-size: 14px;
}
</style>
