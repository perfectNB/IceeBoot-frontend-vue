<template>
  <div class="workflow-page">
    <div class="page-header">
      <h2>任务处理</h2>
      <p>查询负责人或候选任务，完成任务或执行跳转</p>
    </div>

    <div class="search-section">
      <el-form :model="taskQueryForm" inline>
        <el-form-item label="负责人">
          <el-input v-model="taskQueryForm.assignee" placeholder="请输入用户标识" style="width: 200px" />
        </el-form-item>
        <el-form-item label="候选人">
          <el-input v-model="taskQueryForm.candidateUser" placeholder="请输入候选用户" style="width: 200px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loadingTasks" @click="handleLoadUserTasks">查询负责人任务</el-button>
          <el-button type="success" :loading="loadingTasks" @click="handleLoadCandidateTasks">查询候选任务</el-button>
          <el-button :icon="Refresh" @click="resetTaskQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-section">
      <el-table :data="tasks" v-loading="loadingTasks" stripe border style="width: 100%">
        <el-table-column prop="id" label="任务ID" min-width="180" show-overflow-tooltip />
        <el-table-column prop="name" label="任务名称" min-width="160" show-overflow-tooltip />
        <el-table-column prop="assignee" label="负责人" width="140" show-overflow-tooltip />
        <el-table-column prop="processInstanceId" label="实例ID" min-width="180" show-overflow-tooltip />
        <el-table-column prop="createTime" label="创建时间" width="160" show-overflow-tooltip />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" :icon="Check" @click="openCompleteDialog(row)">完成</el-button>
            <el-button type="warning" size="small" :icon="RefreshRight" @click="openJumpDialog(row)">跳转</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="completeDialogVisible" title="完成任务" width="520px">
      <el-form :model="completeForm" label-width="90px">
        <el-form-item label="任务ID">
          <el-input v-model="completeForm.taskId" readonly />
        </el-form-item>
        <el-form-item label="流程变量">
          <el-input v-model="completeForm.variablesJson" type="textarea" :rows="6" placeholder="JSON对象" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="completingTask" @click="handleCompleteTask">提交</el-button>
          <el-button @click="completeDialogVisible = false">取消</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>

    <el-dialog v-model="jumpDialogVisible" title="跳转任务" width="520px">
      <el-form :model="jumpForm" label-width="100px">
        <el-form-item label="任务ID">
          <el-input v-model="jumpForm.taskId" readonly />
        </el-form-item>
        <el-form-item label="目标节点">
          <el-input v-model="jumpForm.targetActivityId" placeholder="请输入目标节点ID" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="jumpingTask" @click="handleJumpTask">提交</el-button>
          <el-button @click="jumpDialogVisible = false">取消</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Check, Refresh, RefreshRight } from '@element-plus/icons-vue'
import { completeTask, getCandidateTasks, getUserTasks, jumpTask, type TaskCompleteDTO, type TaskItem, type TaskJumpDTO } from '@/api'

defineOptions({
  name: 'WorkflowTasks'
})

const tasks = ref<TaskItem[]>([])
const loadingTasks = ref(false)
const taskQueryForm = reactive({
  assignee: '',
  candidateUser: ''
})

const completeDialogVisible = ref(false)
const completeForm = reactive({
  taskId: '',
  variablesJson: ''
})
const completingTask = ref(false)

const jumpDialogVisible = ref(false)
const jumpForm = reactive({
  taskId: '',
  targetActivityId: ''
})
const jumpingTask = ref(false)

const handleLoadUserTasks = async () => {
  if (!taskQueryForm.assignee) {
    ElMessage.warning('请输入负责人')
    return
  }
  loadingTasks.value = true
  try {
    tasks.value = await getUserTasks(taskQueryForm.assignee)
  } catch {
    ElMessage.error('查询任务失败')
  } finally {
    loadingTasks.value = false
  }
}

const handleLoadCandidateTasks = async () => {
  if (!taskQueryForm.candidateUser) {
    ElMessage.warning('请输入候选人')
    return
  }
  loadingTasks.value = true
  try {
    tasks.value = await getCandidateTasks(taskQueryForm.candidateUser)
  } catch {
    ElMessage.error('查询任务失败')
  } finally {
    loadingTasks.value = false
  }
}

const resetTaskQuery = () => {
  taskQueryForm.assignee = ''
  taskQueryForm.candidateUser = ''
  tasks.value = []
}

const openCompleteDialog = (task: TaskItem) => {
  completeForm.taskId = task.id || ''
  completeForm.variablesJson = ''
  completeDialogVisible.value = true
}

const handleCompleteTask = async () => {
  if (!completeForm.taskId) {
    ElMessage.warning('任务ID不能为空')
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
    ElMessage.success('任务已完成')
  } catch {
    ElMessage.error('任务完成失败')
  } finally {
    completingTask.value = false
  }
}

const openJumpDialog = (task: TaskItem) => {
  jumpForm.taskId = task.id || ''
  jumpForm.targetActivityId = ''
  jumpDialogVisible.value = true
}

const handleJumpTask = async () => {
  if (!jumpForm.taskId || !jumpForm.targetActivityId) {
    ElMessage.warning('任务ID和目标节点不能为空')
    return
  }
  jumpingTask.value = true
  try {
    const payload: TaskJumpDTO = {
      taskId: jumpForm.taskId,
      targetActivityId: jumpForm.targetActivityId
    }
    await jumpTask(jumpForm.taskId, payload)
    jumpDialogVisible.value = false
    ElMessage.success('任务已跳转')
  } catch {
    ElMessage.error('任务跳转失败')
  } finally {
    jumpingTask.value = false
  }
}

const parseJson = (value: string): Record<string, unknown> | undefined | null => {
  if (!value) return undefined
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      ElMessage.error('变量需要是JSON对象')
      return null
    }
    return parsed
  } catch {
    ElMessage.error('JSON格式不正确')
    return null
  }
}
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

:deep(.el-table .el-table__cell) {
  padding: 12px 0;
}

:deep(.el-button + .el-button) {
  margin-left: 8px;
}
</style>
