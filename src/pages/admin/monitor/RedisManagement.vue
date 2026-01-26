<template>
  <div class="redis-management">
    <div class="page-header">
      <h2>Redis管理</h2>
      <p>管理Redis缓存数据</p>
    </div>

    <!-- 操作区域 -->
    <div class="action-section">
      <el-button
        type="primary"
        @click="handleCreate"
        v-if="hasPermission('monitor:redis:create')"
      >
        <el-icon><Plus /></el-icon>
        添加缓存
      </el-button>
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
        <el-table-column prop="size" label="大小" width="100">
          <template #default="{ row }">
            {{ formatSize(row.size) }}
          </template>
        </el-table-column>
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
            <el-descriptions-item label="大小">{{ formatSize(currentRedisItem.size) }}</el-descriptions-item>
          </el-descriptions>

          <div class="value-section" style="margin-top: 20px;">
            <h4>数据内容：</h4>
            <el-input
              :model-value="formatValueForDisplay(currentRedisItem.value)"
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

    <!-- 新增Redis缓存对话框 -->
    <el-dialog
      v-model="createDialogVisible"
      title="添加Redis缓存"
      width="600px"
      :close-on-click-modal="false"
      @close="resetCreateForm"
    >
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createFormRules"
        label-width="100px"
      >
        <el-form-item label="键名" prop="key">
          <el-input
            v-model="createForm.key"
            placeholder="请输入Redis键名"
          />
        </el-form-item>
        <el-form-item label="数据类型" prop="type">
          <el-select
            v-model="createForm.type"
            placeholder="请选择数据类型"
            style="width: 100%"
            @change="handleTypeChange"
          >
            <el-option label="字符串" value="string" />
            <el-option label="哈希" value="hash" />
            <el-option label="列表" value="list" />
            <el-option label="集合" value="set" />
            <el-option label="有序集合" value="zset" />
          </el-select>
        </el-form-item>
        <el-form-item label="过期时间" prop="ttl">
          <el-input-number
            v-model="createForm.ttl"
            :min="-1"
            placeholder="-1表示永不过期"
            style="width: 100%"
          />
          <div class="form-tip">单位：秒，-1表示永不过期</div>
        </el-form-item>
        <el-form-item label="数据内容" prop="value">
          <el-input
            v-if="createForm.type === 'string'"
            v-model="createForm.value"
            type="textarea"
            :rows="4"
            placeholder="请输入字符串内容"
          />
          <div v-else-if="createForm.type === 'hash'">
            <div v-for="(item, index) in createForm.hashFields" :key="index" class="hash-field">
              <el-input
                v-model="item.field"
                placeholder="字段名"
                style="width: 40%; margin-right: 10px"
              />
              <el-input
                v-model="item.value"
                placeholder="字段值"
                style="width: 40%; margin-right: 10px"
              />
              <el-button
                type="danger"
                size="small"
                @click="removeHashField(index)"
                :disabled="createForm.hashFields.length === 1"
              >
                删除
              </el-button>
            </div>
            <el-button type="primary" size="small" @click="addHashField" style="margin-top: 10px">
              添加字段
            </el-button>
          </div>
          <div v-else-if="createForm.type === 'list'">
            <div v-for="(item, index) in createForm.listValues" :key="index" class="list-item">
              <el-input
                v-model="createForm.listValues[index]"
                placeholder="列表项值"
                style="width: 80%; margin-right: 10px"
              />
              <el-button
                type="danger"
                size="small"
                @click="removeListItem(index)"
                :disabled="createForm.listValues.length === 1"
              >
                删除
              </el-button>
            </div>
            <el-button type="primary" size="small" @click="addListItem" style="margin-top: 10px">
              添加项
            </el-button>
          </div>
          <div v-else-if="createForm.type === 'set'">
            <div v-for="(item, index) in createForm.setValues" :key="index" class="set-item">
              <el-input
                v-model="createForm.setValues[index]"
                placeholder="集合成员值"
                style="width: 80%; margin-right: 10px"
              />
              <el-button
                type="danger"
                size="small"
                @click="removeSetItem(index)"
                :disabled="createForm.setValues.length === 1"
              >
                删除
              </el-button>
            </div>
            <el-button type="primary" size="small" @click="addSetItem" style="margin-top: 10px">
              添加成员
            </el-button>
          </div>
          <div v-else-if="createForm.type === 'zset'">
            <div v-for="(item, index) in createForm.zsetValues" :key="index" class="zset-item">
              <el-input-number
                v-model="item.score"
                placeholder="分数"
                style="width: 30%; margin-right: 10px"
              />
              <el-input
                v-model="item.member"
                placeholder="成员值"
                style="width: 50%; margin-right: 10px"
              />
              <el-button
                type="danger"
                size="small"
                @click="removeZsetItem(index)"
                :disabled="createForm.zsetValues.length === 1"
              >
                删除
              </el-button>
            </div>
            <el-button type="primary" size="small" @click="addZsetItem" style="margin-top: 10px">
              添加成员
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitCreate" :loading="creating">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, View, Delete, Plus } from '@element-plus/icons-vue'
import { getRedisKeys, deleteRedisKey, deleteRedisKeys, createRedisKey } from '../../../api/redis'
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

interface CreateForm {
  key: string
  type: string
  value: string
  ttl: number
  hashFields: Array<{ field: string; value: string }>
  listValues: string[]
  setValues: string[]
  zsetValues: Array<{ score: number; member: string }>
}

// 响应式数据
const loading = ref(false)
const redisData = ref<RedisItem[]>([])
const viewDialogVisible = ref(false)
const currentRedisItem = ref<RedisItem | null>(null)
const selectedRedisItems = ref<RedisItem[]>([])

// 新增对话框相关
const createDialogVisible = ref(false)
const creating = ref(false)
const createFormRef = ref()
const createForm = reactive<CreateForm>({
  key: '',
  type: 'string',
  value: '',
  ttl: -1,
  hashFields: [{ field: '', value: '' }],
  listValues: [''],
  setValues: [''],
  zsetValues: [{ score: 0, member: '' }]
})

// 表单验证规则
const createFormRules = {
  key: [
    { required: true, message: '请输入Redis键名', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择数据类型', trigger: 'change' }
  ],
  value: [
    { required: true, message: '请输入数据内容', trigger: 'blur' }
  ]
}

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

    // 提取键名数组
    const keys = selectedRedisItems.value.map(item => item.key)

    // 批量删除Redis键
    await deleteRedisKeys(keys)

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
    const str = JSON.stringify(value, null, 2)
    return str.length > 100 ? str.substring(0, 100) + '...' : str
  }
  return String(value)
}

// 格式化值用于详情显示
const formatValueForDisplay = (value: string | number | object | boolean) => {
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }
  return String(value)
}

// 格式化大小显示
const formatSize = (size: string | number) => {
  const sizeNum = typeof size === 'string' ? parseInt(size) : size
  if (isNaN(sizeNum)) {
    return size + ' KB'
  }
  // 假设后端返回的是字节数，转换为KB
  const sizeInKB = (sizeNum / 1024).toFixed(2)
  return sizeInKB + ' KB'
}

// 新增Redis缓存相关函数
const handleCreate = () => {
  createDialogVisible.value = true
}

const resetCreateForm = () => {
  createForm.key = ''
  createForm.type = 'string'
  createForm.value = ''
  createForm.ttl = -1
  createForm.hashFields = [{ field: '', value: '' }]
  createForm.listValues = ['']
  createForm.setValues = ['']
  createForm.zsetValues = [{ score: 0, member: '' }]
  createFormRef.value?.clearValidate()
}

const handleTypeChange = () => {
  // 类型改变时重置相关字段
  createForm.value = ''
  createForm.hashFields = [{ field: '', value: '' }]
  createForm.listValues = ['']
  createForm.setValues = ['']
  createForm.zsetValues = [{ score: 0, member: '' }]
}

// Hash字段操作
const addHashField = () => {
  createForm.hashFields.push({ field: '', value: '' })
}

const removeHashField = (index: number) => {
  if (createForm.hashFields.length > 1) {
    createForm.hashFields.splice(index, 1)
  }
}

// List操作
const addListItem = () => {
  createForm.listValues.push('')
}

const removeListItem = (index: number) => {
  if (createForm.listValues.length > 1) {
    createForm.listValues.splice(index, 1)
  }
}

// Set操作
const addSetItem = () => {
  createForm.setValues.push('')
}

const removeSetItem = (index: number) => {
  if (createForm.setValues.length > 1) {
    createForm.setValues.splice(index, 1)
  }
}

// ZSet操作
const addZsetItem = () => {
  createForm.zsetValues.push({ score: 0, member: '' })
}

const removeZsetItem = (index: number) => {
  if (createForm.zsetValues.length > 1) {
    createForm.zsetValues.splice(index, 1)
  }
}

// 提交新增
const handleSubmitCreate = async () => {
  try {
    await createFormRef.value?.validate()
    
    // 根据数据类型进行额外验证
    let hasValidData = false
    let value: string | Record<string, string> | string[] | Array<{score: number, member: string}> = createForm.value

    switch (createForm.type) {
      case 'string':
        if (!createForm.value.trim()) {
          ElMessage.error('请输入字符串内容')
          return
        }
        value = createForm.value
        hasValidData = true
        break
      case 'hash':
        const hashValue: Record<string, string> = {}
        createForm.hashFields.forEach(item => {
          if (item.field && item.value) {
            hashValue[item.field] = item.value
            hasValidData = true
          }
        })
        if (!hasValidData) {
          ElMessage.error('请至少添加一个有效的哈希字段')
          return
        }
        value = hashValue
        break
      case 'list':
        const listValues = createForm.listValues.filter(item => item.trim() !== '')
        if (listValues.length === 0) {
          ElMessage.error('请至少添加一个有效的列表项')
          return
        }
        value = listValues
        hasValidData = true
        break
      case 'set':
        const setValues = createForm.setValues.filter(item => item.trim() !== '')
        if (setValues.length === 0) {
          ElMessage.error('请至少添加一个有效的集合成员')
          return
        }
        value = setValues
        hasValidData = true
        break
      case 'zset':
        const zsetValues = createForm.zsetValues.filter(item => item.member.trim() !== '')
        if (zsetValues.length === 0) {
          ElMessage.error('请至少添加一个有效的有序集合成员')
          return
        }
        value = zsetValues.map(item => ({ score: item.score, member: item.member }))
        hasValidData = true
        break
    }
    
    if (!hasValidData) {
      ElMessage.error('请输入有效的数据内容')
      return
    }
    
    creating.value = true

    // 调用创建Redis缓存的API
    await createRedisKey({ key: createForm.key, type: createForm.type, value, ttl: createForm.ttl })

    ElMessage.success('添加Redis缓存成功')
    createDialogVisible.value = false
    resetCreateForm()
    loadRedisData()
  } catch (error: unknown) {
    console.error('添加Redis缓存失败:', error)
    ElMessage.error('添加Redis缓存失败')
  } finally {
    creating.value = false
  }
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

.redis-value {
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.redis-detail .value-section h4 {
  margin: 0;
  color: var(--text-primary);
}

:deep(.el-table .el-table__cell) {
  padding: 12px 0;
}

:deep(.el-button + .el-button) {
  margin-left: 8px;
}

.action-section {
  margin-bottom: 20px;
}

.form-tip {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 5px;
}

.hash-field,
.list-item,
.set-item,
.zset-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.hash-field:last-of-type,
.list-item:last-of-type,
.set-item:last-of-type,
.zset-item:last-of-type {
  margin-bottom: 0;
}

</style>
