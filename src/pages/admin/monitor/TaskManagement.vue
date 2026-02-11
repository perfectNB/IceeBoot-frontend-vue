<template>
  <div class="task-management">
    <div class="page-header">
      <h2>{{ t('taskManagement.pageTitle') }}</h2>
      <p>{{ t('taskManagement.pageDescription') }}</p>
    </div>

    <!-- 操作栏 -->
    <div class="action-section">
      <el-button
        type="primary"
        @click="handleAdd"
        v-if="hasPermission('monitor:task:create')"
      >
        <el-icon><Plus /></el-icon>
        {{ t('taskManagement.actions.addTask') }}
      </el-button>
      <el-button
        type="danger"
        @click="handleBatchDelete"
        :disabled="selectedTasks.length === 0 || selectedTasks.some(task => task.status === 'active')"
        v-if="hasPermission('monitor:task:delete')"
      >
        <el-icon><Delete /></el-icon>
        {{ t('taskManagement.actions.batchDelete') }}
      </el-button>
    </div>

    <!-- 搜索区域 -->
    <div class="search-section">
      <el-form :model="searchForm" inline>
        <el-form-item :label="t('taskManagement.search.taskName')">
          <el-input
            v-model="searchForm.name"
            :placeholder="t('taskManagement.search.enterTaskName')"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item :label="t('taskManagement.search.taskStatus')">
          <el-select
            v-model="searchForm.status"
            :placeholder="t('taskManagement.search.selectTaskStatus')"
            clearable
            style="width: 150px"
          >
            <el-option :label="t('taskManagement.status.active')" value="active" />
            <el-option :label="t('taskManagement.status.inactive')" value="inactive" />
            <!-- <el-option label="已暂停" value="paused" /> -->
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" :loading="loading">
            <el-icon><Search /></el-icon>
            {{ t('taskManagement.actions.search') }}
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            {{ t('taskManagement.actions.reset') }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 数据表格 -->
    <div class="table-section">
      <el-table
        :data="taskData"
        v-loading="loading"
        stripe
        border
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" :label="t('taskManagement.table.taskName')" min-width="150" show-overflow-tooltip />
        <el-table-column prop="className" :label="t('taskManagement.table.taskClass')" min-width="200" show-overflow-tooltip />
        <el-table-column prop="cronExpression" :label="t('taskManagement.table.cronExpression')" min-width="120" show-overflow-tooltip />
        <el-table-column prop="status" :label="t('taskManagement.table.status')" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" :label="t('taskManagement.table.remark')" min-width="150" show-overflow-tooltip />

        <el-table-column :label="t('taskManagement.table.operation')" width="280" fixed="right">
          <template #default="{ row }">
            <el-button
              type="success"
              size="small"
              @click="handleStart(row)"
              v-if="row.status === 'inactive' && hasPermission('monitor:task:start')"
            >
              <el-icon><VideoPlay /></el-icon>
              {{ t('taskManagement.actions.start') }}
            </el-button>
            <el-button
              type="warning"
              size="small"
              @click="handleStop(row)"
              v-if="row.status === 'active' && hasPermission('monitor:task:stop')"
            >
              <el-icon><VideoPause /></el-icon>
              {{ t('taskManagement.actions.stop') }}
            </el-button>
            <el-button
              type="primary"
              size="small"
              @click="handleEdit(row)"
              v-if="hasPermission('monitor:task:edit')"
            >
              <el-icon><Edit /></el-icon>
              {{ t('taskManagement.actions.edit') }}
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="handleDelete(row)"
              :disabled="row.status === 'active'"
              v-if="hasPermission('monitor:task:delete')"
            >
              <el-icon><Delete /></el-icon>
              {{ t('taskManagement.actions.delete') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-section">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? t('taskManagement.dialog.editTitle') : t('taskManagement.dialog.addTitle')"
      width="600px"
      :before-close="handleCloseDialog"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
      >
        <el-form-item :label="t('taskManagement.dialog.taskName')" prop="name">
          <el-input v-model="formData.name" :placeholder="t('taskManagement.dialog.enterTaskName')" />
        </el-form-item>
        <el-form-item :label="t('taskManagement.dialog.taskClassPath')" prop="className">
          <el-input v-model="formData.className" :placeholder="t('taskManagement.dialog.enterTaskClassPath')" />
        </el-form-item>
        <el-form-item :label="t('taskManagement.dialog.cronExpression')" prop="cronExpression">
          <el-input v-model="formData.cronExpression" :placeholder="t('taskManagement.dialog.enterCronExpression')" />
          <div class="cron-help">
            <small>{{ t('taskManagement.dialog.cronHelp') }}</small>
          </div>
        </el-form-item>
        <el-form-item :label="t('taskManagement.dialog.taskDescription')" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            :placeholder="t('taskManagement.dialog.enterTaskDescription')"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">{{ t('taskManagement.actions.cancel') }}</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
          {{ isEdit ? t('taskManagement.actions.update') : t('taskManagement.actions.create') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { Plus, Search, Refresh, VideoPlay, VideoPause, Edit, Delete } from '@element-plus/icons-vue'
import { getTasks, createTask, updateTask, deleteTask, startTask, stopTask } from '../../../api/task'
import { hasPermission } from '../../../utils/permission'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface Task {
  id?: string
  name: string
  className: string
  cronExpression: string
  status: string
  description: string
  lastExecuteTime?: string
  nextExecuteTime?: string | null
  createTime?: string
  updateTime?: string
}

interface SearchForm {
  name: string
  status: string
}

interface Pagination {
  current: number
  size: number
  total: number
  pages: number
}

// 响应式数据
const loading = ref(false)
const submitLoading = ref(false)
const taskData = ref<Task[]>([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()
const selectedTasks = ref<Task[]>([])

// 搜索表单
const searchForm = reactive<SearchForm>({
  name: '',
  status: ''
})

// 分页
const pagination = reactive<Pagination>({
  current: 1,
  size: 20,
  total: 0,
  pages: 0
})

// 表单数据
const formData = reactive<Task>({
  name: '',
  className: '',
  cronExpression: '',
  status: 'inactive',
  description: ''
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: t('taskManagement.validation.nameRequired'), trigger: 'blur' },
    { min: 2, max: 50, message: t('taskManagement.validation.nameLength'), trigger: 'blur' }
  ],
  className: [
    { required: true, message: t('taskManagement.validation.classPathRequired'), trigger: 'blur' },
    { pattern: /^[a-zA-Z][a-zA-Z0-9._]*$/, message: t('taskManagement.validation.classPathPattern'), trigger: 'blur' }
  ],
  cronExpression: [
    { required: true, message: t('taskManagement.validation.cronRequired'), trigger: 'blur' },
    { pattern: /^\s*(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)(\s+(\S+))?\s*$/, message: t('taskManagement.validation.cronPattern'), trigger: 'blur' }
  ]
}

// 获取任务列表
const loadTasks = async () => {
  try {
    loading.value = true
    const params = {
      pageNum: pagination.current,
      pageSize: pagination.size,
      name: searchForm.name,
      status: searchForm.status
    }
    console.log('TaskManagement loadTasks params:', params)
    const response = await getTasks(params)
    taskData.value = response.records
    pagination.total = response.total
    pagination.current = response.current
    pagination.size = response.size
    pagination.pages = response.pages
    console.log('TaskManagement loadTasks response:', response)
  } catch (error: unknown) {
    console.error('获取任务列表失败:', error)
    ElMessage.error(t('taskManagement.messages.loadFailed'))
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.current = 1
  loadTasks()
}

// 重置
const handleReset = () => {
  searchForm.name = ''
  searchForm.status = ''
  pagination.current = 1
  loadTasks()
}

// 新增
const handleAdd = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row: Task) => {
  isEdit.value = true
  Object.assign(formData, row)
  dialogVisible.value = true
}

// 启动任务
const handleStart = async (row: Task) => {
  try {
    await startTask(row.id!)
    ElMessage.success(t('taskManagement.messages.startSuccess'))
    loadTasks()
  } catch (error: unknown) {
    console.error('启动任务失败:', error)
    ElMessage.error(t('taskManagement.messages.startFailed'))
  }
}

// 停止任务
const handleStop = async (row: Task) => {
  try {
    await stopTask(row.id!)
    ElMessage.success(t('taskManagement.messages.stopSuccess'))
    loadTasks()
  } catch (error: unknown) {
    console.error('停止任务失败:', error)
    ElMessage.error(t('taskManagement.messages.stopFailed'))
  }
}

// 删除
const handleDelete = async (row: Task) => {
  try {
    await ElMessageBox.confirm(
      t('taskManagement.confirm.deleteMessage', { name: row.name }),
      t('taskManagement.confirm.deleteTitle'),
      {
        confirmButtonText: t('taskManagement.confirm.confirmButton'),
        cancelButtonText: t('taskManagement.confirm.cancelButton'),
        type: 'warning'
      }
    )

    await deleteTask(row.id!)
    ElMessage.success(t('taskManagement.messages.deleteSuccess'))
    loadTasks()
  } catch (error: unknown) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error(t('taskManagement.messages.deleteFailed'))
    }
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitLoading.value = true

    if (isEdit.value) {
      await updateTask(formData.id!, formData)
      ElMessage.success(t('taskManagement.messages.updateSuccess'))
    } else {
      await createTask(formData)
      ElMessage.success(t('taskManagement.messages.createSuccess'))
    }

    dialogVisible.value = false
    loadTasks()
  } catch (error: unknown) {
    if (error !== false) { // 表单验证失败时error为false
      console.error('提交失败:', error)
      ElMessage.error(t('taskManagement.messages.submitFailed'))
    }
  } finally {
    submitLoading.value = false
  }
}

// 分页大小改变
const handleSizeChange = (size: number) => {
  pagination.size = size
  pagination.current = 1
  loadTasks()
}

// 当前页改变
const handleCurrentChange = (page: number) => {
  pagination.current = page
  loadTasks()
}

// 关闭对话框
const handleCloseDialog = () => {
  dialogVisible.value = false
  resetForm()
}

// 重置表单
const resetForm = () => {
  Object.assign(formData, {
    name: '',
    className: '',
    cronExpression: '',
    status: 'inactive',
    description: ''
  })
  formRef.value?.clearValidate()
}

// 获取状态标签类型
const getStatusTagType = (status: string) => {
  const statusMap: Record<string, string> = {
    active: 'success',
    inactive: 'warning'
  }
  return statusMap[status] || 'info'
}

// 选择变更
const handleSelectionChange = (selection: Task[]) => {
  selectedTasks.value = selection
}

// 批量删除任务
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      t('taskManagement.confirm.batchDeleteMessage', { count: selectedTasks.value.length }),
      t('taskManagement.confirm.batchDeleteTitle'),
      {
        confirmButtonText: t('taskManagement.confirm.confirmButton'),
        cancelButtonText: t('taskManagement.confirm.cancelButton'),
        type: 'warning'
      }
    )

    // 批量删除任务
    for (const task of selectedTasks.value) {
      await deleteTask(task.id!)
    }

    ElMessage.success(t('taskManagement.messages.batchDeleteSuccess', { count: selectedTasks.value.length }))
    selectedTasks.value = []
    loadTasks()
  } catch (error: unknown) {
    if (error !== 'cancel') {
      console.error('批量删除任务失败:', error)
      ElMessage.error(t('taskManagement.messages.batchDeleteFailed'))
    }
  }
}

// 获取状态标签文本
const getStatusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    active: t('taskManagement.status.active'),
    inactive: t('taskManagement.status.inactive')
  }
  return statusMap[status] || status
}

// 组件挂载时加载数据
onMounted(() => {
  loadTasks()
})
</script>

<style scoped>
.task-management {
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

.action-section {
  margin-bottom: 20px;
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
}

.pagination-section {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.cron-help {
  margin-top: 5px;
  color: var(--text-secondary);
}

:deep(.el-table .el-table__cell) {
  padding: 12px 0;
}

:deep(.el-button + .el-button) {
  margin-left: 8px;
}
</style>
