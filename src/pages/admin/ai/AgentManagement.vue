<template>
  <div class="agent-management">
    <div class="page-header">
      <h1 class="page-title">Agent管理</h1>
      <p class="page-description">管理Coze和Dify平台的AI工作流</p>
    </div>
    
    <!-- 搜索和操作栏 -->
    <div class="toolbar">
      <div class="search-section">
        <el-input
          v-model="searchForm.keyword"
          placeholder="搜索Agent名称或工作流名称"
          style="width: 300px"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select
          v-model="searchForm.platform"
          placeholder="平台类型"
          style="width: 120px"
          clearable
        >
          <el-option label="Coze" value="coze" />
          <el-option label="Dify" value="dify" />
        </el-select>
        <el-select
          v-model="searchForm.status"
          placeholder="状态"
          style="width: 100px"
          clearable
        >
          <el-option label="启用" value="active" />
          <el-option label="禁用" value="inactive" />
        </el-select>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
        <el-button @click="handleReset">
          <el-icon><Refresh /></el-icon>
          重置
        </el-button>
      </div>
      
      <div class="action-section">
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          新建Agent
        </el-button>
        <el-button @click="handleExport">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
      </div>
    </div>
    
    <!-- Agent表格 -->
    <div class="table-container">
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
        <el-table-column prop="name" label="Agent名称" min-width="150" />
        <el-table-column prop="workflowName" label="工作流名称" min-width="150" />
        <el-table-column label="平台" width="100">
          <template #default="{ row }">
            <el-tag :type="getPlatformType(row.platform)" size="small">
              {{ getPlatformLabel(row.platform) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="200" show-overflow-tooltip />
        <el-table-column label="API密钥" min-width="200">
          <template #default="{ row }">
            <span class="key-display">
              {{ maskKey(row.key) }}
            </span>
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
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              text
              @click="handleEdit(row)"
            >
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button
              type="danger"
              size="small"
              text
              @click="handleDelete(row)"
            >
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-container">
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
    
    <!-- 新建/编辑Agent对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="agentForm"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="Agent名称" prop="name">
          <el-input v-model="agentForm.name" placeholder="请输入Agent名称" />
        </el-form-item>
        <el-form-item label="工作流名称" prop="workflowName">
          <el-input v-model="agentForm.workflowName" placeholder="请输入工作流名称" />
        </el-form-item>
        <el-form-item label="平台类型" prop="platform">
          <el-select v-model="agentForm.platform" placeholder="请选择平台" style="width: 100%">
            <el-option label="Coze" value="coze" />
            <el-option label="Dify" value="dify" />
          </el-select>
        </el-form-item>
        <el-form-item label="API密钥" prop="key">
          <el-input
            v-model="agentForm.key"
            type="textarea"
            :rows="3"
            placeholder="请输入API密钥"
          />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="agentForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="agentForm.status">
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
  Delete
} from '@element-plus/icons-vue'
import {
  getAgents,
  createAgent,
  updateAgent,
  deleteAgent,
  updateAgentStatus
} from '@/api'
import type { Agent } from '@/types'

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()

// 搜索表单
const searchForm = reactive({
  keyword: '',
  platform: '',
  status: ''
})

// 分页
const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

// Agent表单
const agentForm = reactive({
  id: '',
  name: '',
  workflowName: '',
  platform: 'coze' as 'coze' | 'dify',
  key: '',
  remark: '',
  status: 'active' as 'active' | 'inactive'
})

// 表单验证规则
const formRules = {
  name: [{ required: true, message: '请输入Agent名称', trigger: 'blur' }],
  workflowName: [{ required: true, message: '请输入工作流名称', trigger: 'blur' }],
  platform: [{ required: true, message: '请选择平台', trigger: 'change' }],
  key: [{ required: true, message: '请输入API密钥', trigger: 'blur' }]
}

const tableData = ref<Agent[]>([])
const selectedRows = ref<Agent[]>([])

// 计算属性
const dialogTitle = computed(() => isEdit.value ? '编辑Agent' : '新建Agent')

// 获取平台类型
const getPlatformType = (platform: string) => {
  const typeMap: Record<string, string> = {
    coze: 'primary',
    dify: 'success'
  }
  return typeMap[platform] || 'info'
}

// 获取平台标签
const getPlatformLabel = (platform: string) => {
  const labelMap: Record<string, string> = {
    coze: 'Coze',
    dify: 'Dify'
  }
  return labelMap[platform] || '未知'
}

// 掩码显示密钥
const maskKey = (key: string) => {
  if (!key || key.length < 8) return key
  return key.substring(0, 4) + '****' + key.substring(key.length - 4)
}

// 加载Agent数据
const loadAgents = async () => {
  loading.value = true
  try {
    const result = await getAgents({
      page: pagination.page,
      size: pagination.size,
      keyword: searchForm.keyword,
      platform: searchForm.platform,
      status: searchForm.status
    })
    tableData.value = result.list
    pagination.total = result.total
  } catch (error) {
    console.error('加载Agent数据失败:', error)
    ElMessage.error('加载Agent数据失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadAgents()
}

// 重置搜索
const handleReset = () => {
  Object.assign(searchForm, {
    keyword: '',
    platform: '',
    status: ''
  })
  handleSearch()
}

// 新建Agent
const handleCreate = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

// 编辑Agent
const handleEdit = (row: Agent) => {
  isEdit.value = true
  Object.assign(agentForm, {
    id: row.id,
    name: row.name,
    workflowName: row.workflowName,
    platform: row.platform,
    key: row.key,
    remark: row.remark,
    status: row.status
  })
  dialogVisible.value = true
}

// 删除Agent
const handleDelete = async (row: Agent) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除Agent "${row.name}" 吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await deleteAgent(row.id)
    ElMessage.success('Agent删除成功')
    await loadAgents()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除Agent失败:', error)
      ElMessage.error('删除Agent失败')
    }
  }
}

// 状态变更
const handleStatusChange = async (row: Agent) => {
  try {
    await updateAgentStatus(row.id, row.status)
    ElMessage.success('状态更新成功')
  } catch (error) {
    console.error('状态更新失败:', error)
    ElMessage.error('状态更新失败')
    // 恢复原状态
    row.status = row.status === 'active' ? 'inactive' : 'active'
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    
    if (isEdit.value) {
      await updateAgent(agentForm.id, agentForm)
      ElMessage.success('Agent更新成功')
    } else {
      await createAgent(agentForm)
      ElMessage.success('Agent创建成功')
    }
    
    dialogVisible.value = false
    await loadAgents()
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

// 重置表单
const resetForm = () => {
  Object.assign(agentForm, {
    id: '',
    name: '',
    workflowName: '',
    platform: 'coze',
    key: '',
    remark: '',
    status: 'active'
  })
  formRef.value?.clearValidate()
}

// 选择变更
const handleSelectionChange = (selection: Agent[]) => {
  selectedRows.value = selection
}

// 分页变更
const handleSizeChange = (size: number) => {
  pagination.size = size
  pagination.page = 1
  loadAgents()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  loadAgents()
}

// 导出
const handleExport = () => {
  ElMessage.info('导出功能开发中')
}

// 初始化
onMounted(() => {
  loadAgents()
})
</script>

<style scoped lang="scss">
.agent-management {
  padding: 20px;
  
  .page-header {
    margin-bottom: 20px;
    
    .page-title {
      font-size: 24px;
      font-weight: 600;
      color: #303133;
      margin: 0 0 8px 0;
    }
    
    .page-description {
      color: #606266;
      margin: 0;
    }
  }
  
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 16px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    
    .search-section {
      display: flex;
      gap: 12px;
      align-items: center;
    }
    
    .action-section {
      display: flex;
      gap: 12px;
    }
  }
  
  .table-container {
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    
    .pagination-container {
      padding: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }
  
  .key-display {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 12px;
    color: #606266;
  }
  
  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
}
</style>