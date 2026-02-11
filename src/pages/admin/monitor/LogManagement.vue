<template>
  <div class="log-management">
    <div class="page-header">
      <h2>{{ t('logManagement.pageTitle') }}</h2>
      <p>{{ t('logManagement.pageDescription') }}</p>
    </div>

    <!-- 操作区域 -->
    <div class="action-section">
      <el-button
        type="danger"
        @click="handleBatchDelete"
        :disabled="selectedLogs.length === 0"
        v-if="hasPermission('monitor:log:delete')"
      >
        <el-icon><Delete /></el-icon>
        {{ t('logManagement.actions.batchDelete') }}
      </el-button>
    </div>

    <!-- 搜索区域 -->
    <div class="search-section">
      <el-form :model="searchForm" inline>
        <el-form-item :label="t('logManagement.search.logLevel')">
          <el-select
            v-model="searchForm.level"
            :placeholder="t('logManagement.search.selectLogLevel')"
            clearable
            style="width: 150px"
          >
            <el-option label="DEBUG" value="DEBUG" />
            <el-option label="INFO" value="INFO" />
            <el-option label="WARN" value="WARN" />
            <el-option label="ERROR" value="ERROR" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('logManagement.search.module')">
          <el-input
            v-model="searchForm.module"
            :placeholder="t('logManagement.search.enterModule')"
            clearable
            style="width: 150px"
          />
        </el-form-item>
        <el-form-item :label="t('logManagement.search.keyword')">
          <el-input
            v-model="searchForm.keyword"
            :placeholder="t('logManagement.search.enterKeyword')"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item :label="t('logManagement.search.timeRange')">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="datetimerange"
            :range-separator="t('logManagement.search.to')"
            :start-placeholder="t('logManagement.search.startTime')"
            :end-placeholder="t('logManagement.search.endTime')"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 350px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" :loading="loading">
            <el-icon><Search /></el-icon>
            {{ t('logManagement.actions.search') }}
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            {{ t('logManagement.actions.reset') }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 数据表格 -->
    <div class="table-section">
      <el-table
        :data="logData"
        v-loading="loading"
        stripe
        border
        style="width: 100%"
        :row-class-name="getRowClassName"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="level" :label="t('logManagement.table.level')" width="90">
          <template #default="{ row }">
            <el-tag :type="getLevelTagType(row.level)" size="small">{{ row.level }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="timestamp" :label="t('logManagement.table.time')" width="180">
          <template #default="{ row }">
            {{ formatDate(row.timestamp) }}
          </template>
        </el-table-column>
        <el-table-column prop="module" :label="t('logManagement.table.module')" width="120" show-overflow-tooltip />
        <el-table-column prop="message" :label="t('logManagement.table.logContent')" min-width="400" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="log-message" :class="`log-${row.level.toLowerCase()}`">{{ row.message }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="thread" :label="t('logManagement.table.thread')" width="120" show-overflow-tooltip />
        <el-table-column prop="className" :label="t('logManagement.table.className')" width="200" show-overflow-tooltip />
        <el-table-column :label="t('logManagement.table.operation')" width="180" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="handleView(row)"
              v-if="hasPermission('monitor:log:view')"
            >
              <el-icon><View /></el-icon>
              {{ t('logManagement.actions.view') }}
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="handleDelete(row)"
              v-if="hasPermission('monitor:log:delete')"
            >
              <el-icon><Delete /></el-icon>
              {{ t('logManagement.actions.delete') }}
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

    <!-- 查看详情对话框 -->
    <el-dialog
      v-model="viewDialogVisible"
      :title="t('logManagement.dialog.title')"
      width="70%"
      :before-close="handleCloseViewDialog"
    >
      <div class="log-detail" v-if="currentLogItem">
        <el-descriptions :column="2" border>
          <el-descriptions-item :label="t('logManagement.dialog.logLevel')">
            <el-tag :type="getLevelTagType(currentLogItem.level)">{{ currentLogItem.level }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item :label="t('logManagement.dialog.time')">{{ currentLogItem.timestamp }}</el-descriptions-item>
          <el-descriptions-item :label="t('logManagement.dialog.module')">{{ currentLogItem.module }}</el-descriptions-item>
          <el-descriptions-item :label="t('logManagement.dialog.thread')">{{ currentLogItem.thread }}</el-descriptions-item>
          <el-descriptions-item :label="t('logManagement.dialog.className')" :span="2">{{ currentLogItem.className }}</el-descriptions-item>
        </el-descriptions>

        <div class="message-section" style="margin-top: 20px;">
          <h4>{{ t('logManagement.dialog.logContent') }}</h4>
          <el-input
            v-model="currentLogItem.message"
            type="textarea"
            :rows="8"
            readonly
            style="margin-top: 10px;"
          />
        </div>

        <div class="stack-section" style="margin-top: 20px;" v-if="currentLogItem.stackTrace">
          <h4>{{ t('logManagement.dialog.stackTrace') }}</h4>
          <el-input
            v-model="currentLogItem.stackTrace"
            type="textarea"
            :rows="10"
            readonly
            style="margin-top: 10px;"
          />
        </div>
      </div>

      <template #footer>
        <el-button @click="viewDialogVisible = false">{{ t('logManagement.actions.close') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, View, Delete } from '@element-plus/icons-vue'
import { getLogs, deleteLog, deleteLogs } from '../../../api/log'
import { hasPermission } from '../../../utils/permission'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface LogItem {
  id: string
  level: string
  timestamp: string
  module: string
  message: string
  thread: string
  className: string
  stackTrace?: string
}

interface SearchForm {
  level: string
  module: string
  keyword: string
  dateRange: [string, string] | null
}

interface Pagination {
  current: number
  size: number
  total: number
  pages: number
}

// 响应式数据
const loading = ref(false)
const logData = ref<LogItem[]>([])
const viewDialogVisible = ref(false)
const currentLogItem = ref<LogItem | null>(null)
const selectedLogs = ref<LogItem[]>([])

// 搜索表单
const searchForm = reactive<SearchForm>({
  level: '',
  module: '',
  keyword: '',
  dateRange: null
})

// 分页
const pagination = reactive<Pagination>({
  current: 1,
  size: 20,
  total: 0,
  pages: 0
})

// 获取日志数据
const loadLogs = async () => {
  try {
    loading.value = true
    const params = {
      pageNum: pagination.current,
      pageSize: pagination.size,
      level: searchForm.level,
      module: searchForm.module,
      keyword: searchForm.keyword,
      startTime: searchForm.dateRange?.[0],
      endTime: searchForm.dateRange?.[1]
    }
    console.log('LogManagement loadLogs params:', params)
    const response = await getLogs(params)
    logData.value = response.records
    pagination.total = response.total
    pagination.current = response.current
    pagination.size = response.size
    pagination.pages = response.pages
    console.log('LogManagement loadLogs response:', response)
  } catch (error: unknown) {
    console.error('获取日志数据失败:', error)
    ElMessage.error(t('logManagement.messages.loadFailed'))
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.current = 1
  loadLogs()
}

// 重置
const handleReset = () => {
  searchForm.level = ''
  searchForm.module = ''
  searchForm.keyword = ''
  searchForm.dateRange = null
  pagination.current = 1
  loadLogs()
}

// 查看详情
const handleView = (row: LogItem) => {
  currentLogItem.value = { ...row }
  viewDialogVisible.value = true
}

// 删除
const handleDelete = async (row: LogItem) => {
  try {
    await ElMessageBox.confirm(
      t('logManagement.confirm.deleteMessage'),
      t('logManagement.confirm.deleteTitle'),
      {
        confirmButtonText: t('logManagement.confirm.confirmButton'),
        cancelButtonText: t('logManagement.confirm.cancelButton'),
        type: 'warning'
      }
    )

    await deleteLog(row.id)
    ElMessage.success(t('logManagement.messages.deleteSuccess'))
    loadLogs()
  } catch (error: unknown) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error(t('logManagement.messages.deleteFailed'))
    }
  }
}

// 分页大小改变
const handleSizeChange = (size: number) => {
  pagination.size = size
  pagination.current = 1
  loadLogs()
}

// 当前页改变
const handleCurrentChange = (page: number) => {
  pagination.current = page
  loadLogs()
}

// 关闭查看对话框
const handleCloseViewDialog = () => {
  viewDialogVisible.value = false
  currentLogItem.value = null
}

// 获取级别标签类型
const getLevelTagType = (level: string) => {
  const levelMap: Record<string, string> = {
    DEBUG: 'info',
    INFO: 'success',
    WARN: 'warning',
    ERROR: 'danger'
  }
  return levelMap[level] || 'default'
}

// 选择变更
const handleSelectionChange = (selection: LogItem[]) => {
  selectedLogs.value = selection
}

// 批量删除日志
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      t('logManagement.confirm.batchDeleteMessage', { count: selectedLogs.value.length }),
      t('logManagement.confirm.batchDeleteTitle'),
      {
        confirmButtonText: t('logManagement.confirm.confirmButton'),
        cancelButtonText: t('logManagement.confirm.cancelButton'),
        type: 'warning'
      }
    )

    const logIds = selectedLogs.value.map(log => log.id)
    await deleteLogs(logIds)
    ElMessage.success(t('logManagement.messages.batchDeleteSuccess', { count: selectedLogs.value.length }))
    selectedLogs.value = []
    loadLogs()
  } catch (error: unknown) {
    if (error !== 'cancel') {
      console.error('批量删除日志失败:', error)
      ElMessage.error(t('logManagement.messages.batchDeleteFailed'))
    }
  }
}

// 格式化时间显示
const formatDate = (date: string | Date) => {
  if (!date) return '-'
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// 获取行类名
const getRowClassName = ({ row }: { row: LogItem }) => {
  if (row.level === 'ERROR') {
    return 'error-row'
  }
  if (row.level === 'WARN') {
    return 'warning-row'
  }
  return ''
}

// 组件挂载时加载数据
onMounted(() => {
  loadLogs()
})
</script>

<style scoped>
.log-management {
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
}

.pagination-section {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.log-message {
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.log-debug {
  color: var(--text-secondary);
}

.log-info {
  color: #409eff;
}

.log-warn {
  color: #e6a23c;
}

.log-error {
  color: #f56c6c;
  font-weight: bold;
}

.log-detail .message-section h4,
.log-detail .stack-section h4 {
  margin: 0;
  color: var(--text-primary);
}

:deep(.el-table .error-row) {
  background-color: rgba(245, 108, 108, 0.12);
}

:deep(.el-table .warning-row) {
  background-color: rgba(230, 162, 60, 0.12);
}

:deep(.el-table .el-table__cell) {
  padding: 8px 0;
}

:deep(.el-button + .el-button) {
  margin-left: 8px;
}
.action-section {
  margin-bottom: 20px;
}

</style>
