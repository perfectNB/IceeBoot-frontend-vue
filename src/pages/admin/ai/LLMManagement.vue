<template>
  <div class="llm-management">
    <div class="page-header">
      <h1 class="page-title">大模型管理</h1>
      <p class="page-description">管理AI大模型配置和API密钥</p>
    </div>
    
    <!-- 操作区域 -->
    <div class="action-section">
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>
        新建模型
      </el-button>
      <el-button
        type="danger"
        @click="handleBatchDelete"
        :disabled="selectedRows.length === 0"
      >
        <el-icon><Delete /></el-icon>
        批量删除
      </el-button>
      <el-button @click="handleExport">
        <el-icon><Download /></el-icon>
        导出
      </el-button>
    </div>
    
    <!-- 搜索区域 -->
    <div class="search-section">
      <el-form :model="searchForm" :inline="true">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="请输入模型名称或备注"
            clearable
            style="width: 300px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">
            搜索
          </el-button>
          <el-button :icon="Refresh" @click="handleReset">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <!-- 表格区域 -->
    <div class="table-section">
      <el-table
        :data="tableData"
        v-loading="loading"
        stripe
        border
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="模型名称" min-width="150" />
        <el-table-column prop="remark" label="备注" min-width="200" show-overflow-tooltip />
        <el-table-column label="API密钥数量" width="120">
          <template #default="{ row }">
            <span class="key-count">{{ row.keys?.length || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="'active'"
              :inactive-value="'inactive'"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column prop="updateTime" label="更新时间" width="160" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              :icon="Edit"
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              type="warning"
              size="small"
              :icon="Key"
              @click="handleManageKeys(row)"
            >
              密钥管理
            </el-button>
            <el-button
              type="danger"
              size="small"
              :icon="Delete"
              @click="handleDelete(row)"
            >
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
    
    <!-- 新建/编辑模型对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="modelForm"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="模型名称" prop="name">
          <el-input v-model="modelForm.name" placeholder="请输入模型名称" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="modelForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="modelForm.status">
            <el-radio value="active">启用</el-radio>
            <el-radio value="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            {{ isEdit ? '更新' : '创建' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
    
    <!-- 密钥管理对话框 -->
    <el-dialog
      v-model="keyDialogVisible"
      title="API密钥管理"
      width="800px"
      :close-on-click-modal="false"
    >
      <div class="key-management">
        <div class="key-header">
          <h3>{{ currentModel?.name }} - API密钥</h3>
          <el-button type="primary" size="small" @click="handleAddKey">
            <el-icon><Plus /></el-icon>
            添加密钥
          </el-button>
        </div>
        
        <el-table :data="currentModel?.keys || []" stripe border>
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column label="密钥" min-width="200">
            <template #default="{ row }">
              <span class="key-display">
                {{ maskKey(row.key) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="SecretKey" min-width="200">
            <template #default="{ row }">
              <span class="key-display">
                {{ maskKey(row.secretKey) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="ApiKey" min-width="200">
            <template #default="{ row }">
              <span class="key-display">
                {{ maskKey(row.apiKey) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" min-width="150" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-switch
                v-model="row.status"
                :active-value="'active'"
                :inactive-value="'inactive'"
                @change="handleKeyStatusChange(row)"
              />
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="160" />
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button
                type="danger"
                size="small"
                text
                @click="handleDeleteKey(row)"
              >
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="keyDialogVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
    
    <!-- 添加密钥对话框 -->
    <el-dialog
      v-model="addKeyDialogVisible"
      title="添加API密钥"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="keyFormRef"
        :model="keyForm"
        :rules="keyFormRules"
        label-width="100px"
      >
        <el-form-item label="密钥备注" prop="remark">
          <el-input
            v-model="keyForm.remark"
            placeholder="请输入密钥备注"
          />
        </el-form-item>
        <el-form-item label="API密钥" prop="key">
          <el-input
            v-model="keyForm.key"
            type="textarea"
            :rows="3"
            placeholder="请输入API密钥"
          />
        </el-form-item>
        <el-form-item label="SecretKey" prop="secretKey">
          <el-input
            v-model="keyForm.secretKey"
            type="textarea"
            :rows="3"
            placeholder="请输入SecretKey"
          />
        </el-form-item>
        <el-form-item label="ApiKey" prop="apiKey">
          <el-input
            v-model="keyForm.apiKey"
            type="textarea"
            :rows="3"
            placeholder="请输入ApiKey"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="addKeyDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmitKey" :loading="submitting">
            添加
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import {
  Search,
  Refresh,
  Plus,
  Download,
  Edit,
  Delete,
  Key
} from '@element-plus/icons-vue'
import {
  getLLMModels,
  createLLMModel,
  updateLLMModel,
  deleteLLMModel,
  addLLMModelKey,
  deleteLLMModelKey,
  updateLLMModelKeyStatus
} from '@/api'
import type { LLMModel, LLMKey } from '@/types'

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const keyDialogVisible = ref(false)
const addKeyDialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()
const keyFormRef = ref<FormInstance>()
const currentModel = ref<LLMModel | null>(null)

// 搜索表单
const searchForm = reactive({
  keyword: ''
})

// 分页
const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

// 模型表单
const modelForm = reactive({
  id: '',
  name: '',
  remark: '',
  status: 'active' as 'active' | 'inactive'
})

// 密钥表单
const keyForm = reactive({
  remark: '',
  key: '',
  secretKey: '',
  apiKey: ''
})

// 表单验证规则
const formRules = {
  name: [{ required: true, message: '请输入模型名称', trigger: 'blur' }],
  remark: [{ required: true, message: '请输入备注', trigger: 'blur' }]
}

const keyFormRules = {
  key: [{ required: true, message: '请输入API密钥', trigger: 'blur' }]
}

const tableData = ref<LLMModel[]>([])
const selectedRows = ref<LLMModel[]>([])

// 计算属性
const dialogTitle = computed(() => isEdit.value ? '编辑模型' : '新建模型')



// 掩码显示密钥
const maskKey = (key: string) => {
  if (!key || key.length < 8) return key
  return key.substring(0, 4) + '****' + key.substring(key.length - 4)
}

// 加载模型数据
const loadModels = async () => {
  loading.value = true
  try {
    const result = await getLLMModels({
      page: pagination.page,
      size: pagination.size,
      keyword: searchForm.keyword
    })
    tableData.value = result.records
    pagination.total = result.total
  } catch (error) {
    console.error('加载模型数据失败:', error)
    ElMessage.error('加载模型数据失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadModels()
}

// 重置搜索
const handleReset = () => {
  Object.assign(searchForm, {
    keyword: ''
  })
  handleSearch()
}

// 新建模型
const handleCreate = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

// 编辑模型
const handleEdit = (row: LLMModel) => {
  isEdit.value = true
  Object.assign(modelForm, {
    id: row.id,
    name: row.name,
    remark: row.remark,
    status: row.status
  })
  dialogVisible.value = true
}

// 删除模型
const handleDelete = async (row: LLMModel) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除模型 "${row.name}" 吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await deleteLLMModel(row.id)
    ElMessage.success('模型删除成功')
    await loadModels()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除模型失败:', error)
      ElMessage.error('删除模型失败')
    }
  }
}

// 状态变更
const handleStatusChange = async (row: LLMModel) => {
  try {
    await updateLLMModel(row.id, { status: row.status })
    ElMessage.success('状态更新成功')
  } catch (error) {
    console.error('状态更新失败:', error)
    ElMessage.error('状态更新失败')
    // 恢复原状态
    row.status = row.status === 'active' ? 'inactive' : 'active'
  }
}

// 管理密钥
const handleManageKeys = (row: LLMModel) => {
  currentModel.value = row
  keyDialogVisible.value = true
}

// 添加密钥
const handleAddKey = () => {
  resetKeyForm()
  addKeyDialogVisible.value = true
}

// 删除密钥
const handleDeleteKey = async (key: LLMKey) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除这个密钥吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await deleteLLMModelKey(currentModel.value!.id, key.id)
    ElMessage.success('密钥删除成功')
    await loadModels()
    // 更新当前模型数据
    const updatedModel = tableData.value.find(m => m.id === currentModel.value!.id)
    if (updatedModel) {
      currentModel.value = updatedModel
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除密钥失败:', error)
      ElMessage.error('删除密钥失败')
    }
  }
}

// 密钥状态变更
const handleKeyStatusChange = async (key: LLMKey) => {
  try {
    await updateLLMModelKeyStatus(currentModel.value!.id, key.id, key.status)
    ElMessage.success('密钥状态更新成功')
  } catch (error) {
    console.error('密钥状态更新失败:', error)
    ElMessage.error('密钥状态更新失败')
    // 恢复原状态
    key.status = key.status === 'active' ? 'inactive' : 'active'
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    
    if (isEdit.value) {
      await updateLLMModel(modelForm.id, modelForm)
      ElMessage.success('模型更新成功')
    } else {
      await createLLMModel(modelForm)
      ElMessage.success('模型创建成功')
    }
    
    dialogVisible.value = false
    await loadModels()
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

// 提交密钥
const handleSubmitKey = async () => {
  if (!keyFormRef.value) return
  
  try {
    await keyFormRef.value.validate()
    submitting.value = true
    
    await addLLMModelKey(currentModel.value!.id, keyForm)
    ElMessage.success('密钥添加成功')
    
    addKeyDialogVisible.value = false
    await loadModels()
    // 更新当前模型数据
    const updatedModel = tableData.value.find(m => m.id === currentModel.value!.id)
    if (updatedModel) {
      currentModel.value = updatedModel
    }
  } catch (error) {
    console.error('添加密钥失败:', error)
    ElMessage.error('添加密钥失败')
  } finally {
    submitting.value = false
  }
}

// 重置表单
const resetForm = () => {
  Object.assign(modelForm, {
    id: '',
    name: '',
    remark: '',
    status: 'active'
  })
  formRef.value?.clearValidate()
}

// 重置密钥表单
const resetKeyForm = () => {
  Object.assign(keyForm, {
    remark: '',
    key: '',
    secretKey: '',
    apiKey: ''
  })
  keyFormRef.value?.clearValidate()
}

// 选择变更
const handleSelectionChange = (selection: LLMModel[]) => {
  selectedRows.value = selection
}

// 批量删除模型
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRows.value.length} 个模型吗？`,
      '批量删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 批量删除模型
    for (const model of selectedRows.value) {
      await deleteLLMModel(model.id)
    }
    
    ElMessage.success(`成功删除 ${selectedRows.value.length} 个模型`)
    selectedRows.value = []
    await loadModels()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除模型失败:', error)
      ElMessage.error('批量删除模型失败')
    }
  }
}

// 分页变更
const handleSizeChange = (size: number) => {
  pagination.size = size
  pagination.page = 1
  loadModels()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  loadModels()
}

// 导出
const handleExport = () => {
  ElMessage.info('导出功能开发中')
}

// 初始化
onMounted(() => {
  loadModels()
})
</script>

<style scoped>
.llm-management {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h1 {
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

.key-count {
  font-weight: 600;
  color: #409eff;
  font-size: 14px;
}

.key-management .key-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.key-management .key-header h3 {
  margin: 0;
  color: #303133;
}

.key-management .key-display {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  color: #606266;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.el-table .el-table__cell) {
  padding: 12px 0;
}

:deep(.el-button + .el-button) {
  margin-left: 8px;
}
</style>