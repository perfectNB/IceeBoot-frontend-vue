<template>
  <el-drawer
    append-to-body
    class="approval-preview-drawer"
    :model-value="true"
    size="min(940px, 100%)"
    :title="design.name"
    @closed="emit('close')"
  >
    <template #header>
      <div class="identity">
        <span class="symbol"
          ><el-icon><Share /></el-icon
        ></span>
        <div>
          <h2>{{ design.name }}</h2>
          <small>{{ design.code }}</small>
        </div>
        <el-tag :type="published ? 'success' : 'warning'" effect="plain">
          {{ published ? '已发布 v' + blueprint.version : '草稿预览' }}
        </el-tag>
      </div>
    </template>
    <el-tabs v-model="tab" class="preview">
      <el-tab-pane label="审批路径" name="path">
        <div class="path-layout">
          <div class="stage">
            <header>
              <h3>
                流程图 <small>· {{ design.nodes.length }} 个审批节点</small>
              </h3>
              <small>点击节点查看流转规则</small>
            </header>
            <ApprovalGraph
              :design="design"
              :roles="roles"
              :selected="selected"
              @select="selectNode"
              @branch="selectBranch"
            />
          </div>
          <section class="inspector" aria-live="polite">
            <div class="node-title">
              <span class="symbol"
                ><el-icon><component :is="node ? User : Position" /></el-icon
              ></span>
              <div>
                <small>{{ node ? '审批节点' : '开始节点' }}</small>
                <h3>{{ node?.name || '提交申请' }}</h3>
              </div>
            </div>
            <p v-if="node" class="reviewers">
              {{ node.coRoles?.length ? '并行会签' : '办理角色' }} · {{ reviewerNames || '待选择角色' }}
            </p>
            <ol class="routes">
              <li v-for="(branch, i) in exit.branches" :key="i" :class="{ active: i === branchIndex }">
                <span>{{ branchLabel(design.fields, branch) }}</span
                ><el-icon><Right /></el-icon><strong>{{ targetName(branch.target) }}</strong>
              </li>
              <li>
                <span>{{ exit.branches.length ? '以上均不满足' : '下一步' }}</span
                ><el-icon><Right /></el-icon><strong>{{ targetName(exit.fallback) }}</strong>
              </li>
            </ol>
          </section>
        </div>
      </el-tab-pane>
      <el-tab-pane :label="'申请表单 · ' + design.fields.length" name="fields">
        <el-empty v-if="!design.fields.length" description="此流程无需填写表单字段" :image-size="60" />
        <ul v-else class="field-list">
          <li v-for="f in design.fields" :key="f.key">
            <div>
              <strong>{{ f.label }}</strong
              ><small>{{ f.key }}</small>
            </div>
            <span
              >{{ f.type === 'number' ? '数字' : '文本' }} ·
              {{ f.kind === 'routing' ? '判断字段' : '业务字段' }}</span
            >
            <el-tag size="small" :type="f.required ? 'primary' : 'info'" effect="plain">{{
              f.required ? '必填' : '选填'
            }}</el-tag>
          </li>
        </ul>
      </el-tab-pane>
    </el-tabs>
  </el-drawer>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { Position, Right, Share, User } from '@element-plus/icons-vue'
import { branchLabel, end, reviewerRoles } from '@/utils/approval'
import type { ApprovalRole, Blueprint } from '@/types/approval'
import ApprovalGraph from './ApprovalGraph.vue'
const props = defineProps<{ blueprint: Blueprint; published: boolean; roles: ApprovalRole[] }>()
const emit = defineEmits<{ close: [] }>()
const design = computed(() => props.blueprint.design)
const tab = ref('path')
const selected = ref('@start')
const branchIndex = ref<number>()
const node = computed(() => design.value.nodes.find((n) => n.id === selected.value))
const exit = computed(() => node.value?.exit || design.value.start)
const reviewerNames = computed(
  () =>
    node.value &&
    reviewerRoles(node.value)
      .map((code) => props.roles.find((r) => r.code === code)?.name || code)
      .join('、')
)
function targetName(id: string) {
  return id === end ? '审批通过' : design.value.nodes.find((n) => n.id === id)?.name || '阻止提交'
}
function selectNode(id: string) {
  selected.value = id
  branchIndex.value = undefined
}
function selectBranch(source: string, index: number) {
  selected.value = source
  branchIndex.value = index
}
</script>
<style scoped>
:global(.approval-preview-drawer .el-drawer__header) {
  margin: 0;
  padding: 22px 22px 18px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.path-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(180px, 26%);
  align-items: start;
  gap: 12px;
}
.stage {
  min-width: 0;
}
.stage h3 small {
  font-weight: 400;
}
@media (max-width: 740px) {
  .path-layout {
    grid-template-columns: minmax(0, 1fr);
  }
}

.identity,
.stage header,
.node-title,
.routes li,
.field-list li {
  display: flex;
  align-items: center;
  gap: 12px;
}
.identity {
  flex-wrap: wrap;
}
.identity > div {
  min-width: 0;
}
.identity h2,
h3,
p {
  margin: 0;
  overflow-wrap: anywhere;
}
.identity h2 {
  font-size: 20px;
  color: var(--el-text-color-primary);
}
.identity small,
.field-list small {
  font-family: var(--el-font-family);
  overflow-wrap: anywhere;
}
small,
.reviewers,
.field-list span {
  font-size: 13px;
  color: var(--el-text-color-regular);
}
.symbol {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 11px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.preview {
  margin-top: -12px;
}
.stage,
.inspector,
.field-list {
  border: 1px solid var(--el-border-color-light);
  border-radius: 14px;
  overflow: hidden;
}
.stage header {
  justify-content: space-between;
  flex-wrap: wrap;
  padding: 12px 18px;
}
h3 {
  font-size: 15px;
  color: var(--el-text-color-primary);
}
.stage :deep(.graph-scroll) {
  max-height: 52vh;
  border: 0;
  border-top: 1px solid var(--el-border-color-lighter);
  border-radius: 0;
}
.stage :deep(.graph-node.review) {
  border-left: 3px solid var(--el-color-primary);
}
.stage :deep(.graph-node.rule) {
  border-radius: 8px;
  color: var(--el-color-warning-dark-2);
  background: var(--el-color-warning-light-9);
  border-color: var(--el-color-warning-light-7);
}
.stage :deep(.rule .graph-icon) {
  color: inherit;
}
.inspector {
  padding: 16px;
}
.reviewers {
  margin-top: 10px;
}
.routes,
.field-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.routes {
  margin-top: 14px;
}
.routes li {
  padding: 9px 12px;
  background: var(--el-fill-color-lighter);
  border-radius: 6px;
  flex-wrap: wrap;
  font-size: 13px;
  overflow-wrap: anywhere;
}
.routes li + li {
  margin-top: 5px;
}
.routes li.active {
  background: var(--el-color-primary-light-9);
}
.routes .el-icon {
  color: var(--el-text-color-secondary);
}
.field-list li {
  padding: 14px 18px;
  flex-wrap: wrap;
}
.field-list li + li {
  border-top: 1px solid var(--el-border-color-lighter);
}
.field-list li > div {
  flex: 1;
  min-width: 100px;
  display: grid;
  gap: 3px;
  overflow-wrap: anywhere;
}
</style>
