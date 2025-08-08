<template>
  <div class="task-management">
    <div class="page-header">
      <h2>定时任务管理</h2>
      <p>管理系统定时任务</p>
    </div>

    <!-- 操作栏 -->
    <div class="action-section">
      <el-button
        type="primary"
        @click="handleAdd"
        v-if="hasPermission('monitor:task:create')"
      >
        <el-icon><Plus /></el-icon>
        新增任务
      </el-button>
    </div>

    <!-- 搜索区域 -->
    <div class="search-section">
      <el-form :model="searchForm" inline>
        <el-form-item label="任务名称">
          <el-input
            v-model="searchForm.name"
            placeholder="请输入任务名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="任务状态">
          <el-select
            v-model="searchForm.status"
            placeholder="请选择任务状态"
            clearable
            style="width: 150px"
          >
            <el-option label="运行中" value="running" />
            <el-option label="已停止" value="stopped" />
            <el-option label="已暂停" value="paused" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" :loading="loading">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
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
      >
        <el-table-column prop="name" label="任务名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="className" label="任务类" min-width="200" show-overflow-tooltip />
        <el-table-column prop="cronExpression" label="Cron表达式" min-width="120" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="备注" min-width="150" show-overflow-tooltip />
        <el-table-column prop="lastExecuteTime" label="上次执行时间" width="160" />
        <el-table-column prop="nextExecuteTime" label="下次执行时间" width="160" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button
              type="success"
              size="small"
              @click="handleStart(row)"
              v-if="row.status !== 'running' && hasPermission('monitor:task:start')"
            >
              <el-icon><VideoPlay /></el-icon>
              启动
            </el-button>
            <el-button
              type="warning"
              size="small"
              @click="handleStop(row)"
              v-if="row.status === 'running' && hasPermission('monitor:task:stop')"
            >
              <el-icon><VideoPause /></el-icon>
              停止
            </el-button>
            <el-button
              type="primary"
              size="small"
              @click="handleEdit(row)"
              v-if="hasPermission('monitor:task:edit')"
            >
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="handleDelete(row)"
              v-if="hasPermission('monitor:task:delete')"
            >
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-section">
        <el-pagination
          v-model:current-page="pagination.page"
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
      :title="isEdit ? '编辑任务' : '新增任务'"
      width="600px"
      :before-close="handleCloseDialog"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
      >
        <el-form-item label="任务名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="任务类路径" prop="className">
          <el-input v-model="formData.className" placeholder="请输入任务类完整路径" />
        </el-form-item>
        <el-form-item label="Cron表达式" prop="cronExpression">
          <el-input v-model="formData.cronExpression" placeholder="请输入Cron表达式，如：0 0 12 * * ?" />
          <div class="cron-help">
            <small>格式：秒 分 时 日 月 周 [年]，例如：0 0 12 * * ? 表示每天12点执行</small>
          </div>
        </el-form-item>
        <el-form-item label="任务描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入任务描述"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
          {{ isEdit ? '更新' : '创建' }}
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
  page: number
  size: number
  total: number
}

// 响应式数据
const loading = ref(false)
const submitLoading = ref(false)
const taskData = ref<Task[]>([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()

// 搜索表单
const searchForm = reactive<SearchForm>({
  name: '',
  status: ''
})

// 分页
const pagination = reactive<Pagination>({
  page: 1,
  size: 20,
  total: 0
})

// 表单数据
const formData = reactive<Task>({
  name: '',
  className: '',
  cronExpression: '',
  status: 'stopped',
  description: ''
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入任务名称', trigger: 'blur' },
    { min: 2, max: 50, message: '任务名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  className: [
    { required: true, message: '请输入任务类路径', trigger: 'blur' },
    { pattern: /^[a-zA-Z][a-zA-Z0-9._]*$/, message: '请输入有效的Java类路径', trigger: 'blur' }
  ],
  cronExpression: [
    { required: true, message: '请输入Cron表达式', trigger: 'blur' },
    { pattern: /^\s*(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)(\s+(\S+))?\s*$/, message: '请输入有效的Cron表达式', trigger: 'blur' }
  ]
}

// 获取任务列表
const loadTasks = async () => {
  try {
    loading.value = true
    const params = {
      page: pagination.page,
      size: pagination.size,
      name: searchForm.name,
      status: searchForm.status
    }
    const response = await getTasks(params)
    taskData.value = response.list
    pagination.total = response.total
  } catch (error: unknown) {
    console.error('获取任务列表失败:', error)
    ElMessage.error('获取任务列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadTasks()
}

// 重置
const handleReset = () => {
  searchForm.name = ''
  searchForm.status = ''
  pagination.page = 1
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
    ElMessage.success('任务启动成功')
    loadTasks()
  } catch (error: unknown) {
    console.error('启动任务失败:', error)
    ElMessage.error('启动任务失败')
  }
}

// 停止任务
const handleStop = async (row: Task) => {
  try {
    await stopTask(row.id!)
    ElMessage.success('任务停止成功')
    loadTasks()
  } catch (error: unknown) {
    console.error('停止任务失败:', error)
    ElMessage.error('停止任务失败')
  }
}

// 删除
const handleDelete = async (row: Task) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除任务 "${row.name}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await deleteTask(row.id!)
    ElMessage.success('删除成功')
    loadTasks()
  } catch (error: unknown) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
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
      ElMessage.success('更新成功')
    } else {
      await createTask(formData)
      ElMessage.success('创建成功')
    }
    
    dialogVisible.value = false
    loadTasks()
  } catch (error: unknown) {
    if (error !== false) { // 表单验证失败时error为false
      console.error('提交失败:', error)
      ElMessage.error('提交失败')
    }
  } finally {
    submitLoading.value = false
  }
}

// 分页大小改变
const handleSizeChange = (size: number) => {
  pagination.size = size
  pagination.page = 1
  loadTasks()
}

// 当前页改变
const handleCurrentChange = (page: number) => {
  pagination.page = page
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
    status: 'stopped',
    description: ''
  })
  formRef.value?.clearValidate()
}

// 获取状态标签类型
const getStatusTagType = (status: string) => {
  const statusMap: Record<string, string> = {
    running: 'success',
    stopped: 'danger',
    paused: 'warning'
  }
  return statusMap[status] || 'info'
}

// 获取状态标签文本
const getStatusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    running: '运行中',
    stopped: '已停止',
    paused: '已暂停'
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
  color: #303133;
}

.page-header p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.action-section {
  margin-bottom: 20px;
}

.search-section {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.table-section {
  background: #fff;
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
  color: #909399;
}

:deep(.el-table .el-table__cell) {
  padding: 12px 0;
}

:deep(.el-button + .el-button) {
  margin-left: 8px;
}
</style>