<template>
  <div class="redis-management">
    <div class="page-header">
      <h2>Redis管理</h2>
      <p>管理Redis缓存数据</p>
    </div>

    <!-- 搜索区域 -->
    <div class="search-section">
      <el-form :model="searchForm" inline>
        <el-form-item label="键名">
          <el-input
            v-model="searchForm.key"
            placeholder="请输入Redis键名"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="数据类型">
          <el-select
            v-model="searchForm.type"
            placeholder="请选择数据类型"
            clearable
            style="width: 150px"
          >
            <el-option label="字符串" value="string" />
            <el-option label="哈希" value="hash" />
            <el-option label="列表" value="list" />
            <el-option label="集合" value="set" />
            <el-option label="有序集合" value="zset" />
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

    <!-- 操作区域 -->
    <div class="action-section">
      <el-button
        type="danger"
        @click="handleBatchDelete"
        :disabled="selectedRedisItems.length === 0"
        v-if="hasPermission('monitor:redis:delete')"
      >
        <el-icon><Delete /></el-icon>
        批量删除
      </el-button>
    </div>

    <!-- 数据表格 -->
    <div class="table-section">
      <el-table
        :data="redisData"
        v-loading="loading"
        stripe
        border
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="key" label="键名" min-width="200" show-overflow-tooltip />
        <el-table-column prop="type" label="数据类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)">{{ getTypeLabel(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="value" label="值" min-width="300" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="redis-value">{{ formatValue(row.value) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="ttl" label="过期时间(秒)" width="120">
          <template #default="{ row }">
            <span v-if="row.ttl === -1">永不过期</span>
            <span v-else-if="row.ttl === -2">已过期</span>
            <span v-else>{{ row.ttl }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="size" label="大小" width="100" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="handleView(row)"
              v-if="hasPermission('monitor:redis:view')"
            >
              <el-icon><View /></el-icon>
              查看
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="handleDelete(row)"
              v-if="hasPermission('monitor:redis:delete')"
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
      title="Redis数据详情"
      width="60%"
      :before-close="handleCloseViewDialog"
    >
      <div class="redis-detail">
        <div v-if="currentRedisItem">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="键名">{{ currentRedisItem.key }}</el-descriptions-item>
            <el-descriptions-item label="数据类型">
              <el-tag :type="getTypeTagType(currentRedisItem.type)">{{ getTypeLabel(currentRedisItem.type) }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="过期时间">
              <span v-if="currentRedisItem.ttl === -1">永不过期</span>
              <span v-else-if="currentRedisItem.ttl === -2">已过期</span>
              <span v-else>{{ currentRedisItem.ttl }}秒</span>
            </el-descriptions-item>
            <el-descriptions-item label="大小">{{ currentRedisItem.size }}</el-descriptions-item>
          </el-descriptions>
          
          <div class="value-section" style="margin-top: 20px;">
            <h4>数据内容：</h4>
            <el-input
              v-model="currentRedisItem.value"
              type="textarea"
              :rows="10"
              readonly
              style="margin-top: 10px;"
            />
          </div>
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
import { getRedisKeys, deleteRedisKey } from '../../../api/redis'
import { hasPermission } from '../../../utils/permission'

interface RedisItem {
  key: string
  type: string
  value: string | number | object | boolean
  ttl: number
  size: string
}

interface SearchForm {
  key: string
  type: string
}

interface Pagination {
  current: number
  size: number
  total: number
  pages: number
}

// 响应式数据
const loading = ref(false)
const redisData = ref<RedisItem[]>([])
const viewDialogVisible = ref(false)
const currentRedisItem = ref<RedisItem | null>(null)
const selectedRedisItems = ref<RedisItem[]>([])

// 搜索表单
const searchForm = reactive<SearchForm>({
  key: '',
  type: ''
})

// 分页
const pagination = reactive<Pagination>({
  current: 1,
  size: 20,
  total: 0,
  pages: 0
})

// 获取Redis数据
const loadRedisData = async () => {
  try {
    loading.value = true
    const params = {
      pageNum: pagination.current,
      pageSize: pagination.size,
      key: searchForm.key,
      type: searchForm.type
    }
    console.log('RedisManagement loadRedisData params:', params)
    const response = await getRedisKeys(params)
    redisData.value = response.records
    pagination.total = response.total
    pagination.current = response.current
    pagination.size = response.size
    pagination.pages = response.pages
    console.log('RedisManagement loadRedisData response:', response)
  } catch (error: unknown) {
    console.error('获取Redis数据失败:', error)
    ElMessage.error('获取Redis数据失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.current = 1
  loadRedisData()
}

// 重置
const handleReset = () => {
  searchForm.key = ''
  searchForm.type = ''
  pagination.current = 1
  loadRedisData()
}

// 查看详情
const handleView = (row: RedisItem) => {
  currentRedisItem.value = { ...row }
  viewDialogVisible.value = true
}

// 删除
const handleDelete = async (row: RedisItem) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除Redis键 "${row.key}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await deleteRedisKey(row.key)
    ElMessage.success('删除成功')
    loadRedisData()
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
  pagination.current = 1
  loadRedisData()
}

// 当前页改变
const handleCurrentChange = (page: number) => {
  pagination.current = page
  loadRedisData()
}

// 关闭查看对话框
const handleCloseViewDialog = () => {
  viewDialogVisible.value = false
  currentRedisItem.value = null
}

// 获取类型标签类型
const getTypeTagType = (type: string) => {
  const typeMap: Record<string, string> = {
    string: 'primary',
    hash: 'success',
    list: 'warning',
    set: 'info',
    zset: 'danger'
  }
  return typeMap[type] || 'default'
}

// 获取类型标签文本
const getTypeLabel = (type: string) => {
  const typeMap: Record<string, string> = {
    string: '字符串',
    hash: '哈希',
    list: '列表',
    set: '集合',
    zset: '有序集合'
  }
  return typeMap[type] || type
}

// 选择变更
const handleSelectionChange = (selection: RedisItem[]) => {
  selectedRedisItems.value = selection
}

// 批量删除Redis键
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRedisItems.value.length} 个Redis键吗？`,
      '批量删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 批量删除Redis键
    for (const item of selectedRedisItems.value) {
      await deleteRedisKey(item.key)
    }
    
    ElMessage.success(`成功删除 ${selectedRedisItems.value.length} 个Redis键`)
    selectedRedisItems.value = []
    loadRedisData()
  } catch (error: unknown) {
    if (error !== 'cancel') {
      console.error('批量删除Redis键失败:', error)
      ElMessage.error('批量删除Redis键失败')
    }
  }
}

// 格式化值显示
const formatValue = (value: string | number | object | boolean) => {
  if (typeof value === 'string') {
    return value.length > 100 ? value.substring(0, 100) + '...' : value
  }
  if (typeof value === 'object') {
    const str = JSON.stringify(value)
    return str.length > 100 ? str.substring(0, 100) + '...' : str
  }
  return String(value)
}

// 组件挂载时加载数据
onMounted(() => {
  loadRedisData()
})
</script>

<style scoped>
.redis-management {
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

.redis-value {
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.redis-detail .value-section h4 {
  margin: 0;
  color: #303133;
}

:deep(.el-table .el-table__cell) {
  padding: 12px 0;
}

:deep(.el-button + .el-button) {
  margin-left: 8px;
}
</style>