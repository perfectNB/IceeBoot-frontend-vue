<template>
  <div class="log-management">
    <div class="page-header">
      <h2>日志管理</h2>
      <p>查看和管理系统日志</p>
    </div>

    <!-- 搜索区域 -->
    <div class="search-section">
      <el-form :model="searchForm" inline>
        <el-form-item label="日志级别">
          <el-select
            v-model="searchForm.level"
            placeholder="请选择日志级别"
            clearable
            style="width: 150px"
          >
            <el-option label="DEBUG" value="DEBUG" />
            <el-option label="INFO" value="INFO" />
            <el-option label="WARN" value="WARN" />
            <el-option label="ERROR" value="ERROR" />
          </el-select>
        </el-form-item>
        <el-form-item label="模块">
          <el-input
            v-model="searchForm.module"
            placeholder="请输入模块名称"
            clearable
            style="width: 150px"
          />
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="请输入关键词"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 350px"
          />
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
        :data="logData"
        v-loading="loading"
        stripe
        border
        style="width: 100%"
        :row-class-name="getRowClassName"
      >
        <el-table-column prop="level" label="级别" width="80">
          <template #default="{ row }">
            <el-tag :type="getLevelTagType(row.level)" size="small">{{ row.level }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="timestamp" label="时间" width="160" />
        <el-table-column prop="module" label="模块" width="120" show-overflow-tooltip />
        <el-table-column prop="message" label="日志内容" min-width="400" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="log-message" :class="`log-${row.level.toLowerCase()}`">{{ row.message }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="thread" label="线程" width="120" show-overflow-tooltip />
        <el-table-column prop="className" label="类名" width="200" show-overflow-tooltip />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="handleView(row)"
              v-if="hasPermission('monitor:log:view')"
            >
              <el-icon><View /></el-icon>
              查看
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="handleDelete(row)"
              v-if="hasPermission('monitor:log:delete')"
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

    <!-- 查看详情对话框 -->
    <el-dialog
      v-model="viewDialogVisible"
      title="日志详情"
      width="70%"
      :before-close="handleCloseViewDialog"
    >
      <div class="log-detail" v-if="currentLogItem">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="日志级别">
            <el-tag :type="getLevelTagType(currentLogItem.level)">{{ currentLogItem.level }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="时间">{{ currentLogItem.timestamp }}</el-descriptions-item>
          <el-descriptions-item label="模块">{{ currentLogItem.module }}</el-descriptions-item>
          <el-descriptions-item label="线程">{{ currentLogItem.thread }}</el-descriptions-item>
          <el-descriptions-item label="类名" :span="2">{{ currentLogItem.className }}</el-descriptions-item>
        </el-descriptions>
        
        <div class="message-section" style="margin-top: 20px;">
          <h4>日志内容：</h4>
          <el-input
            v-model="currentLogItem.message"
            type="textarea"
            :rows="8"
            readonly
            style="margin-top: 10px;"
          />
        </div>
        
        <div class="stack-section" style="margin-top: 20px;" v-if="currentLogItem.stackTrace">
          <h4>堆栈信息：</h4>
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
        <el-button @click="viewDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, View, Delete } from '@element-plus/icons-vue'
import { getLogs, deleteLog } from '../../../api/log'
import { hasPermission } from '../../../utils/permission'

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
  page: number
  size: number
  total: number
}

// 响应式数据
const loading = ref(false)
const logData = ref<LogItem[]>([])
const viewDialogVisible = ref(false)
const currentLogItem = ref<LogItem | null>(null)

// 搜索表单
const searchForm = reactive<SearchForm>({
  level: '',
  module: '',
  keyword: '',
  dateRange: null
})

// 分页
const pagination = reactive<Pagination>({
  page: 1,
  size: 20,
  total: 0
})

// 获取日志数据
const loadLogs = async () => {
  try {
    loading.value = true
    const params = {
      page: pagination.page,
      size: pagination.size,
      level: searchForm.level,
      module: searchForm.module,
      keyword: searchForm.keyword,
      startTime: searchForm.dateRange?.[0],
      endTime: searchForm.dateRange?.[1]
    }
    const response = await getLogs(params)
    logData.value = response.data.list
    pagination.total = response.data.total
  } catch (error: unknown) {
    console.error('获取日志数据失败:', error)
    ElMessage.error('获取日志数据失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadLogs()
}

// 重置
const handleReset = () => {
  searchForm.level = ''
  searchForm.module = ''
  searchForm.keyword = ''
  searchForm.dateRange = null
  pagination.page = 1
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
      `确定要删除这条日志吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await deleteLog(row.id)
    ElMessage.success('删除成功')
    loadLogs()
  } catch (error: unknown) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 分页大小改变
const handleSizeChange = (size: number) => {
  pagination.size = size
  pagination.page = 1
  loadLogs()
}

// 当前页改变
const handleCurrentChange = (page: number) => {
  pagination.page = page
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
  color: #303133;
}

.page-header p {
  margin: 0;
  color: #909399;
  font-size: 14px;
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

.log-message {
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.log-debug {
  color: #909399;
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
  color: #303133;
}

:deep(.el-table .error-row) {
  background-color: #fef0f0;
}

:deep(.el-table .warning-row) {
  background-color: #fdf6ec;
}

:deep(.el-table .el-table__cell) {
  padding: 8px 0;
}

:deep(.el-button + .el-button) {
  margin-left: 8px;
}
</style>