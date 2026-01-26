<template>
  <div class="agent-management">
    <div class="page-header">
      <h1 class="page-title">Agent管理</h1>
      <p class="page-description">管理Coze和Dify平台的AI工作流</p>
    </div>
    
    <!-- 操作区域 -->
    <div class="action-section">
      <el-button type="primary" @click="handleCreate" v-if="hasPermission('ai:agent:create')">
        <el-icon><Plus /></el-icon>
        新建Agent
      </el-button>
      <el-button
        type="danger"
        @click="handleBatchDelete"
        :disabled="selectedRows.length === 0"
        v-if="hasPermission('ai:agent:delete')"
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
        <el-form-item label="名称">
          <el-input
            v-model="searchForm.name"
            placeholder="请输入名称"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="类型">
          <el-select
            v-model="searchForm.type"
            placeholder="请选择类型"
            clearable
            style="width: 120px"
          >
            <el-option label="工作流" value="workflow" />
            <el-option label="智能体" value="agent" />
          </el-select>
        </el-form-item>
        <el-form-item label="平台">
          <el-select
            v-model="searchForm.platform"
            placeholder="请选择平台"
            clearable
            style="width: 120px"
          >
            <el-option label="Coze" value="coze" />
            <el-option label="Dify" value="dify" />
          </el-select>
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
        <el-table-column prop="name" label="名称" min-width="150" />
        <el-table-column label="平台" width="100">
          <template #default="{ row }">
            <el-tag :type="getPlatformType(row.platform)" size="small">
              {{ getPlatformLabel(row.platform) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="200" show-overflow-tooltip />
        <el-table-column label="配置信息" min-width="300">
          <template #default="{ row }">
            <div v-if="row.platform === 'coze'">
              <div><strong>Token:</strong> <span class="key-display">{{ maskKey(row.token) }}</span></div>
              <div><strong>BotId:</strong> {{ row.botId }}</div>
              <div><strong>WorkFlowId:</strong> {{ row.workFlowId }}</div>
            </div>
            <div v-else-if="row.platform === 'dify'">
              <div><strong>Key:</strong> <span class="key-display">{{ maskKey(row.key) }}</span></div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeColor(row.type)" size="small">
              {{ getTypeLabel(row.type) }}
            </el-tag>
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
              v-if="hasPermission('ai:agent:edit')"
            >
              编辑
            </el-button>
            <el-button
              type="danger"
              size="small"
              :icon="Delete"
              @click="handleDelete(row)"
              v-if="hasPermission('ai:agent:delete')"
            >
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
        <el-form-item label="名称" prop="name">
          <el-input v-model="agentForm.name" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="agentForm.type" placeholder="请选择类型" style="width: 100%">
            <el-option label="工作流" value="workflow" />
            <el-option label="智能体" value="agent" />
          </el-select>
        </el-form-item>
        <el-form-item label="平台类型" prop="platform">
          <el-select v-model="agentForm.platform" placeholder="请选择平台" style="width: 100%">
            <el-option label="Coze" value="coze" />
            <el-option label="Dify" value="dify" />
          </el-select>
        </el-form-item>
        
        <!-- Coze平台字段 -->
        <template v-if="agentForm.platform === 'coze'">
          <el-form-item label="Token" prop="token">
            <el-input
              v-model="agentForm.token"
              type="textarea"
              :rows="3"
              placeholder="请输入Token"
            />
          </el-form-item>
          <el-form-item label="BotId" prop="botId" v-if="agentForm.type === 'agent'">
            <el-input
              v-model="agentForm.botId"
              placeholder="请输入BotId（智能体必填）"
            />
          </el-form-item>
          <el-form-item label="WorkFlowId" prop="workFlowId">
            <el-input
              v-model="agentForm.workFlowId"
              placeholder="请输入WorkFlowId"
            />
          </el-form-item>
        </template>
        
        <!-- Dify平台字段 -->
        <template v-else-if="agentForm.platform === 'dify'">
          <el-form-item label="API密钥" prop="key">
            <el-input
              v-model="agentForm.key"
              type="textarea"
              :rows="3"
              placeholder="请输入API密钥"
            />
          </el-form-item>
        </template>
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
import { hasPermission } from '@/utils/permission'
import type { Agent } from '@/types'

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()

// 搜索表单
const searchForm = reactive({
  name: '',
  type: '',
  platform: ''
})

// 分页
interface Pagination {
  current: number
  size: number
  total: number
  pages: number
}

const pagination = reactive<Pagination>({
  current: 1,
  size: 10,
  total: 0,
  pages: 0
})

// Agent表单
const agentForm = reactive({
  id: '',
  name: '',
  type: 'workflow' as 'workflow' | 'agent',
  platform: 'coze' as 'coze' | 'dify',
  remark: '',
  status: 'active' as 'active' | 'inactive',
  // 平台特定字段
  token: '',
  botId: '',
  workFlowId: '',
  // API密钥
  key: ''
})

// 表单验证规则
const formRules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  platform: [{ required: true, message: '请选择平台', trigger: 'change' }],
  token: [{ required: true, message: '请输入Token', trigger: 'blur' }],
  botId: [{ 
    validator: (rule: unknown, value: string, callback: (error?: Error) => void) => {
      if (agentForm.type === 'agent' && !value) {
        callback(new Error('智能体必须填写BotId'))
      } else {
        callback()
      }
    }, 
    trigger: 'blur' 
  }],
  workFlowId: [{ required: true, message: '请输入WorkFlowId', trigger: 'blur' }],
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

// 获取类型颜色
const getTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    workflow: 'primary',
    agent: 'success'
  }
  return colorMap[type] || 'info'
}

// 获取类型标签
const getTypeLabel = (type: string) => {
  const labelMap: Record<string, string> = {
    workflow: '工作流',
    agent: '智能体'
  }
  return labelMap[type] || '未知'
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
      pageNum: pagination.current,
      pageSize: pagination.size,
      name: searchForm.name,
      type: searchForm.type,
      platform: searchForm.platform
    })
    tableData.value = result.records
    pagination.total = result.total
    pagination.current = result.current
    pagination.size = result.size
    pagination.pages = result.pages
  } catch (error) {
    console.error('加载Agent数据失败:', error)
    ElMessage.error('加载Agent数据失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.current = 1
  loadAgents()
}

// 重置搜索
const handleReset = () => {
  Object.assign(searchForm, {
    name: '',
    type: '',
    platform: ''
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
    type: row.type || 'workflow',
    platform: row.platform,
    remark: row.remark,
    status: row.status,
    // coze平台字段
    token: row.token || '',
    botId: row.botId || '',
    workFlowId: row.workFlowId || '',
    // dify平台字段
    key: row.key || ''
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
    type: 'workflow',
    platform: 'coze',
    remark: '',
    status: 'active',
    // 平台特定字段
    token: '',
    botId: '',
    workFlowId: '',
    // API密钥
    key: ''
  })
  formRef.value?.clearValidate()
}

// 选择变更
const handleSelectionChange = (selection: Agent[]) => {
  selectedRows.value = selection
}

// 批量删除Agent
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRows.value.length} 个Agent吗？`,
      '批量删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 批量删除Agent
    for (const agent of selectedRows.value) {
      await deleteAgent(agent.id)
    }
    
    ElMessage.success(`成功删除 ${selectedRows.value.length} 个Agent`)
    selectedRows.value = []
    await loadAgents()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除Agent失败:', error)
      ElMessage.error('批量删除Agent失败')
    }
  }
}

// 分页变更
const handleSizeChange = (size: number) => {
  pagination.size = size
  pagination.current = 1
  loadAgents()
}

const handleCurrentChange = (page: number) => {
  pagination.current = page
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

<style scoped>
.agent-management {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h1 {
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

.key-display {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  color: var(--text-regular);
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
