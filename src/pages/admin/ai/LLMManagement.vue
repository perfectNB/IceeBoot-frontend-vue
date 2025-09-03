<template>
  <div class="llm-management">
    <div class="page-header">
      <h1 class="page-title">大模型管理</h1>
      <p class="page-description">管理AI大模型配置和API密钥</p>
    </div>
    
    <!-- 模型卡片区域 -->
    <div class="models-grid" v-loading="loading">
      <div 
        v-for="model in modelList" 
        :key="model.id" 
        class="model-card"
      >
        <div class="model-header">
          <div class="model-info">
            <div class="model-icon">
              <img :src="model.icon" :alt="model.name" />
            </div>
            <div class="model-details">
              <h3 class="model-name">{{ model.name }}</h3>
              <p class="model-description">{{ model.description }}</p>
            </div>
          </div>
          <div class="model-status">
            <el-switch
              v-model="model.status"
              :active-value="'active'"
              :inactive-value="'inactive'"
              @change="handleStatusChange(model)"
            />
          </div>
        </div>
        
        <div class="model-stats">
          <div class="stat-item">
            <span class="stat-label">API密钥数量</span>
            <span class="stat-value">{{ model.keys?.length || 0 }}</span>
          </div>
        </div>
        
        <div class="model-actions">
          <el-button
            type="primary"
            :icon="Key"
            @click="handleManageKeys(model)"
            class="manage-keys-btn"
          >
            管理密钥
          </el-button>
        </div>
      </div>
    </div>
    

    
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import {
  Plus,
  Delete,
  Key
} from '@element-plus/icons-vue'
import {
  addLLMModelKey,
  deleteLLMModelKey,
  updateLLMModelKeyStatus
} from '@/api'
import type { LLMModel, LLMKey } from '@/types'

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const keyDialogVisible = ref(false)
const addKeyDialogVisible = ref(false)
const keyFormRef = ref<FormInstance>()
const currentModel = ref<LLMModel | null>(null)

// 固定的AI模型列表
const modelList = ref<LLMModel[]>([
  {
    id: '1',
    name: 'DeepSeek',
    remark: 'DeepSeek AI大模型',
    description: '由深度求索开发的AI大模型，擅长代码生成和推理',
    icon: 'https://via.placeholder.com/48/4F46E5/FFFFFF?text=DS',
    keys: [],
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  },
  {
    id: '2',
    name: '文心一言',
    remark: '百度文心一言',
    description: '百度开发的大语言模型，中文理解能力强',
    icon: 'https://via.placeholder.com/48/FF6B35/FFFFFF?text=文心',
    keys: [],
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  },
  {
    id: '3',
    name: '通义千问',
    remark: '阿里通义千问',
    description: '阿里云开发的大语言模型，支持多种任务',
    icon: 'https://via.placeholder.com/48/00D4AA/FFFFFF?text=通义',
    keys: [],
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  },
  {
    id: '4',
    name: 'Kimi',
    remark: 'Moonshot Kimi',
    description: 'Moonshot AI开发的长文本理解模型',
    icon: 'https://via.placeholder.com/48/8B5CF6/FFFFFF?text=K',
    keys: [],
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  },
  {
    id: '5',
    name: 'ChatGPT',
    remark: 'OpenAI ChatGPT',
    description: 'OpenAI开发的对话式AI模型',
    icon: 'https://via.placeholder.com/48/10B981/FFFFFF?text=GPT',
    keys: [],
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  },
  {
    id: '6',
    name: 'Grok',
    remark: 'xAI Grok',
    description: 'xAI开发的AI助手，具有幽默感',
    icon: 'https://via.placeholder.com/48/F59E0B/FFFFFF?text=G',
    keys: [],
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  },
  {
    id: '7',
    name: 'Claude',
    remark: 'Anthropic Claude',
    description: 'Anthropic开发的AI助手，注重安全性',
    icon: 'https://via.placeholder.com/48/EF4444/FFFFFF?text=C',
    keys: [],
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  },
  {
    id: '8',
    name: 'Gemini',
    remark: 'Google Gemini',
    description: 'Google开发的多模态AI模型',
    icon: 'https://via.placeholder.com/48/3B82F6/FFFFFF?text=G',
    keys: [],
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  }
])

// 密钥表单
const keyForm = reactive({
  remark: '',
  key: '',
  secretKey: '',
  apiKey: ''
})

// 表单验证规则
const keyFormRules = {
  key: [{ required: true, message: '请输入API密钥', trigger: 'blur' }]
}

// 掩码显示密钥
const maskKey = (key: string) => {
  if (!key || key.length < 8) return key
  return key.substring(0, 4) + '****' + key.substring(key.length - 4)
}

// 状态变更
const handleStatusChange = async (model: LLMModel) => {
  try {
    // 这里可以调用API更新状态，暂时只更新本地状态
    ElMessage.success('状态更新成功')
  } catch (error) {
    console.error('状态更新失败:', error)
    ElMessage.error('状态更新失败')
    // 恢复原状态
    model.status = model.status === 'active' ? 'inactive' : 'active'
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
    // 更新当前模型数据
    const model = modelList.value.find((m: LLMModel) => m.id === currentModel.value!.id)
    if (model) {
      // 从密钥列表中移除删除的密钥
      const keyIndex = model.keys.findIndex(k => k.id === key.id)
      if (keyIndex > -1) {
        model.keys.splice(keyIndex, 1)
      }
      currentModel.value = model
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

// 提交密钥
const handleSubmitKey = async () => {
  if (!keyFormRef.value) return
  
  try {
    await keyFormRef.value.validate()
    submitting.value = true
    
    await addLLMModelKey(currentModel.value!.id, keyForm)
    ElMessage.success('密钥添加成功')
    
    addKeyDialogVisible.value = false
    // 更新当前模型的密钥列表
    const model = modelList.value.find((m: LLMModel) => m.id === currentModel.value!.id)
    if (model) {
      // 这里应该重新获取密钥列表，暂时模拟添加
      const newKey = {
        id: Date.now().toString(),
        key: keyForm.key,
        secretKey: keyForm.secretKey,
        apiKey: keyForm.apiKey,
        remark: keyForm.remark,
        status: 'active' as const,
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString()
      }
      model.keys.push(newKey)
      currentModel.value = model
    }
  } catch (error) {
    console.error('添加密钥失败:', error)
    ElMessage.error('添加密钥失败')
  } finally {
    submitting.value = false
  }
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

// 初始化
onMounted(() => {
  // 页面加载完成，模型数据已经在modelList中定义
  loading.value = false
})
</script>

<style scoped>
.llm-management {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 32px;
  text-align: center;
}

.page-header h1 {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 32px;
  font-weight: 700;
}

.page-header p {
  margin: 0;
  color: #909399;
  font-size: 16px;
}

.models-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.model-card {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e4e7ed;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.model-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.model-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.model-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.model-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  overflow: hidden;
  margin-right: 16px;
  flex-shrink: 0;
}

.model-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.model-details {
  flex: 1;
}

.model-name {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  line-height: 1.2;
}

.model-description {
  margin: 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.4;
}

.model-status {
  flex-shrink: 0;
}

.model-stats {
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #409eff;
}

.model-actions {
  display: flex;
  justify-content: center;
}

.manage-keys-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
}

.key-management .key-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e4e7ed;
}

.key-management .key-header h3 {
  margin: 0;
  color: #303133;
  font-size: 20px;
  font-weight: 600;
}

.key-management .key-display {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  color: #606266;
  background: #f8f9fa;
  padding: 4px 8px;
  border-radius: 4px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

:deep(.el-table .el-table__cell) {
  padding: 16px 12px;
}

:deep(.el-dialog) {
  border-radius: 16px;
}

:deep(.el-dialog__header) {
  padding: 24px 24px 0;
}

:deep(.el-dialog__body) {
  padding: 24px;
}

:deep(.el-dialog__footer) {
  padding: 0 24px 24px;
}

:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-input), :deep(.el-textarea) {
  border-radius: 8px;
}

:deep(.el-button) {
  border-radius: 8px;
  font-weight: 500;
}

@media (max-width: 768px) {
  .models-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .model-card {
    padding: 20px;
  }
  
  .page-header h1 {
    font-size: 24px;
  }
}
</style>
