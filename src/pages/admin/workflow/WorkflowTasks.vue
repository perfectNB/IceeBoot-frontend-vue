<template>
  <div class="workflow-page admin-page">
    <AdminPageHeader :title="t('workflowTasks.title')" :description="t('workflowTasks.description')" />

    <div class="table-section">
      <div class="panel-tools"><strong>{{ listTitle }}</strong>
        <el-button v-if="hasPermission('workflow:task:my:api')" :icon="Refresh" @click="loadMyTasks">{{ t('bpmnDesign.myTasks') }}</el-button>
      </div>
      <details class="search-section" :open="!hasPermission('workflow:task:my:api')"><summary>{{ t('bpmnDesign.searchPeople') }}</summary>
        <el-form :model="taskQueryForm" inline>
          <el-form-item :label="t('workflowTasks.assignee')">
            <el-input v-model="taskQueryForm.assignee" :placeholder="t('workflowTasks.inputUserIdentifier')" style="width: 200px" />
          </el-form-item>
          <el-form-item :label="t('workflowTasks.candidateUser')">
            <el-input v-model="taskQueryForm.candidateUser" :placeholder="t('workflowTasks.inputCandidateUser')" style="width: 200px" />
          </el-form-item>
          <el-form-item>
            <el-button v-if="hasPermission('workflow:task:user:api')" type="primary" :loading="loadingTasks" @click="handleLoadUserTasks">{{ t('workflowTasks.queryAssigneeTasks') }}</el-button>
            <el-button v-if="hasPermission('workflow:task:candidate:api')" type="success" :loading="loadingTasks" @click="handleLoadCandidateTasks">{{ t('workflowTasks.queryCandidateTasks') }}</el-button>
            <el-button :icon="Refresh" @click="resetTaskQuery">{{ t('workflowTasks.reset') }}</el-button>
          </el-form-item>
        </el-form>
      </details>

      <el-table :data="tasks" v-loading="loadingTasks" :empty-text="t('bpmnDesign.noTasks')" style="width: 100%">
        <el-table-column prop="name" :label="t('workflowTasks.taskName')" min-width="160" show-overflow-tooltip />
        <el-table-column prop="assignee" :label="t('workflowTasks.assigneeLabel')" width="140" show-overflow-tooltip />
        <el-table-column prop="processInstanceId" :label="t('workflowTasks.instanceId')" min-width="180" show-overflow-tooltip />
        <el-table-column prop="createTime" :label="t('workflowTasks.createTime')" width="160" show-overflow-tooltip />
        <el-table-column :label="t('workflowTasks.operation')" width="200" fixed="right">
          <template #default="{ row }">
            <el-button v-if="isMine(row) && hasPermission('workflow:task:complete:api')" type="primary" size="small" :icon="Check" @click="openCompleteDialog(row)">{{ t('workflowTasks.complete') }}</el-button>
            <el-button v-if="!row.assignee && hasPermission('workflow:task:claim:api')" link type="primary" @click="claim(row, false)">认领</el-button>
            <el-button v-if="isMine(row) && hasPermission('workflow:task:unclaim:api')" link @click="claim(row, true)">取消认领</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="completeDialogVisible" :title="t('workflowTasks.completeTask')" width="520px">
      <el-form :model="completeForm" label-width="90px">
        <el-form-item :label="t('workflowTasks.taskName')">
          <strong>{{ taskName }}</strong>
        </el-form-item>
        <details class="optional-fields"><summary>{{ t('bpmnDesign.advancedInput') }}</summary><el-form-item :label="t('workflowTasks.processVariables')">
          <el-input v-model="completeForm.variablesJson" type="textarea" :rows="6" :placeholder="t('workflowTasks.jsonObject')" />
        </el-form-item></details>
        <el-form-item>
          <el-button type="primary" :loading="completingTask" @click="handleCompleteTask">{{ t('workflowTasks.submit') }}</el-button>
          <el-button @click="completeDialogVisible = false">{{ t('workflowTasks.cancel') }}</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>


  </div>
</template>

<script setup lang="ts">
import AdminPageHeader from '@/components/common/AdminPageHeader.vue'
import { reactive, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Check, Refresh } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { completeTask, getCandidateTasks, getUserTasks, myWorkflowTasks, claimWorkflowTask, type TaskCompleteDTO, type TaskItem } from '@/api'

import { useUserStore } from '@/stores/user'
import { hasPermission } from '@/utils/permission'

defineOptions({
  name: 'WorkflowTasks'
})

const { t } = useI18n()

const tasks = ref<TaskItem[]>([])
const loadingTasks = ref(false)
const taskQueryForm = reactive({
  assignee: '',
  candidateUser: ''
})

const taskName = ref('')
const completeDialogVisible = ref(false)
const completeForm = reactive({
  taskId: '',
  variablesJson: ''
})
const completingTask = ref(false)

const store = useUserStore()
const isMine = (row: TaskItem) => !!row.assignee && [String(store.user?.id), store.user?.username].includes(row.assignee)
const listTitle = ref(t('bpmnDesign.myTasks'))
let reload: () => Promise<void> = loadMyTasks

async function loadMyTasks() {
  if (!hasPermission('workflow:task:my:api')) return
  listTitle.value = t('bpmnDesign.myTasks')
  reload = loadMyTasks
  loadingTasks.value = true
  try { tasks.value = await myWorkflowTasks() }
  catch { ElMessage.error(t('workflowTasks.queryTasksFailed')) }
  finally { loadingTasks.value = false }
}

async function claim(row: TaskItem, release: boolean) {
  if (!row.id) return
  try {
    await claimWorkflowTask(row.id, release)
    await reload()
  } catch { ElMessage.error('任务状态已变化或当前用户无权办理，请刷新任务') }
}

onMounted(loadMyTasks)

const handleLoadUserTasks = async () => {
  if (!taskQueryForm.assignee) {
    ElMessage.warning(t('workflowTasks.inputAssignee'))
    return
  }
  loadingTasks.value = true
  try {
    reload = handleLoadUserTasks
    tasks.value = await getUserTasks(taskQueryForm.assignee)
    listTitle.value = taskQueryForm.assignee + ' · ' + t('workflowTasks.assignee')
  } catch {
    ElMessage.error(t('workflowTasks.queryTasksFailed'))
  } finally {
    loadingTasks.value = false
  }
}

const handleLoadCandidateTasks = async () => {
  if (!taskQueryForm.candidateUser) {
    ElMessage.warning(t('workflowTasks.inputCandidateUserRequired'))
    return
  }
  loadingTasks.value = true
  try {
    reload = handleLoadCandidateTasks
    tasks.value = await getCandidateTasks(taskQueryForm.candidateUser)
    listTitle.value = taskQueryForm.candidateUser + ' · ' + t('workflowTasks.candidateUser')
  } catch {
    ElMessage.error(t('workflowTasks.queryTasksFailed'))
  } finally {
    loadingTasks.value = false
  }
}

const resetTaskQuery = () => {
  taskQueryForm.assignee = ''
  taskQueryForm.candidateUser = ''
  void loadMyTasks()
}

const openCompleteDialog = (task: TaskItem) => {
  taskName.value = task.name || task.id || ''
  completeForm.taskId = task.id || ''
  completeForm.variablesJson = ''
  completeDialogVisible.value = true
}

const handleCompleteTask = async () => {
  if (!completeForm.taskId) {
    ElMessage.warning(t('workflowTasks.taskIdCannotBeEmpty'))
    return
  }
  const variables = parseJson(completeForm.variablesJson)
  if (variables === null) return
  completingTask.value = true
  try {
    const payload: TaskCompleteDTO = {
      taskId: completeForm.taskId,
      variables: variables || undefined
    }
    await completeTask(completeForm.taskId, payload)
    completeDialogVisible.value = false
    await reload()
    ElMessage.success(t('workflowTasks.taskCompleted'))
  } catch {
    ElMessage.error(t('workflowTasks.taskCompleteFailed'))
  } finally {
    completingTask.value = false
  }
}

const parseJson = (value: string): Record<string, unknown> | undefined | null => {
  if (!value) return undefined
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      ElMessage.error(t('workflowTasks.variablesMustBeJsonObject'))
      return null
    }
    return parsed
  } catch {
    ElMessage.error(t('workflowTasks.jsonFormatIncorrect'))
    return null
  }
}
</script>

<style scoped src="./workflow.css"></style>
<style scoped>



:deep(.el-table .el-table__cell) {
  padding: 12px 0;
}

:deep(.el-button + .el-button) {
  margin-left: 8px;
}
</style>
