<template>
  <div class="llm-management">
    <div class="page-header">
      <h1 class="page-title">{{ t('llmManagement.pageTitle') }}</h1>
      <p class="page-description">{{ t('llmManagement.pageDescription') }}</p>
    </div>

    <!-- 模型卡片区域 -->
    <div class="models-grid" v-loading="loading">
      <div
        v-for="model in modelList"
        :key="model.providerName"
        class="model-card"
      >
        <div class="model-header">
          <div class="model-info">
            <div class="model-icon">
              <div class="icon-text" :style="{ backgroundColor: getModelColor(model.displayName) }">
                {{ getModelInitials(model.displayName) }}
              </div>
            </div>
            <div class="model-details">
              <h3 class="model-name">{{ model.displayName }}</h3>
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
            <span class="stat-label">{{ t('llmManagement.apiKeyCount') }}</span>
            <span class="stat-value">{{ model.keys?.length || 0 }}</span>
          </div>
        </div>

        <div class="model-actions">
          <el-button
            type="primary"
            :icon="Key"
            @click="handleManageKeys(model)"
            class="manage-keys-btn"
            v-if="hasPermission('ai:llm:view')"
          >
            {{ t('llmManagement.manageKeys') }}
          </el-button>
        </div>
      </div>
    </div>



    <!-- 密钥管理对话框 -->
    <el-dialog
      v-model="keyDialogVisible"
      :title="t('llmManagement.apiKeyManagement')"
      width="800px"
      :close-on-click-modal="false"
    >
      <div class="key-management">
        <div class="key-header">
          <h3>{{ currentModel?.displayName }} - {{ t('llmManagement.apiKey') }}</h3>
          <el-button type="primary" size="small" @click="handleAddKey" v-if="hasPermission('ai:llm:create')">
            <el-icon><Plus /></el-icon>
            {{ t('llmManagement.addKey') }}
          </el-button>
        </div>

        <el-table :data="currentModel?.keys || []" stripe border>
          <el-table-column prop="id" :label="t('llmManagement.id')" width="80" />
          <el-table-column :label="t('llmManagement.apiKey')" min-width="200">
            <template #default="{ row }">
              <span class="key-display">
                {{ maskKey(row.apiKey) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column :label="t('llmManagement.secretKey')" min-width="200">
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
          <el-table-column prop="remark" :label="t('llmManagement.remark')" min-width="150" />
          <el-table-column :label="t('llmManagement.status')" width="100">
            <template #default="{ row }">
              <el-switch
                v-model="row.status"
                :active-value="'active'"
                :inactive-value="'inactive'"
                @change="handleKeyStatusChange(row)"
              />
            </template>
          </el-table-column>
          <el-table-column prop="createTime" :label="t('llmManagement.createTime')" width="160" />
          <el-table-column :label="t('llmManagement.operation')" width="180">
            <template #default="{ row }">
              <el-button
                type="primary"
                size="small"
                text
                @click="handleEditKey(row)"
                v-if="hasPermission('ai:llm:edit')"
              >
                <el-icon><Edit /></el-icon>
                {{ t('llmManagement.edit') }}
              </el-button>
              <el-button
                type="danger"
                size="small"
                text
                @click="handleDeleteKey(row)"
                v-if="hasPermission('ai:llm:delete')"
              >
                <el-icon><Delete /></el-icon>
                {{ t('llmManagement.delete') }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="keyDialogVisible = false">{{ t('llmManagement.close') }}</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 添加密钥对话框 -->
    <el-dialog
      v-model="addKeyDialogVisible"
      :title="t('llmManagement.addApiKey')"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="keyFormRef"
        :model="keyForm"
        :rules="keyFormRules"
        label-width="100px"
      >
        <el-form-item :label="t('llmManagement.keyRemark')" prop="remark">
          <el-input
            v-model="keyForm.remark"
            :placeholder="t('llmManagement.pleaseEnterKeyRemark')"
          />
        </el-form-item>
        <el-form-item :label="t('llmManagement.apiKey')" prop="apiKey">
          <el-input
            v-model="keyForm.apiKey"
            type="textarea"
            :rows="3"
            :placeholder="t('llmManagement.pleaseEnterApiKey')"
          />
        </el-form-item>
        <el-form-item :label="t('llmManagement.secretKey')" prop="secretKey">
          <el-input
            v-model="keyForm.secretKey"
            type="textarea"
            :rows="3"
            :placeholder="t('llmManagement.pleaseEnterSecretKey')"
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
          <el-button @click="addKeyDialogVisible = false">{{ t('llmManagement.cancel') }}</el-button>
          <el-button type="primary" @click="handleSubmitKey" :loading="submitting">
            {{ t('llmManagement.add') }}
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
  Edit,
  Delete,
  Key
} from '@element-plus/icons-vue'
import {
  getLLMModels,
  addLLMModelKey,
  updateLLMModelKey,
  deleteLLMModelKey,
  updateLLMModelKeyStatus
} from '@/api/llm'
import { hasPermission } from '@/utils/permission'
import type { LLMModel, LLMKey } from '@/types'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const keyDialogVisible = ref(false)
const addKeyDialogVisible = ref(false)
const keyFormRef = ref<FormInstance>()
const currentModel = ref<LLMModel | null>(null)

// AI模型列表
const modelList = ref<LLMModel[]>([])

// 密钥表单
const keyForm = reactive<{
  id?: number
  remark: string
  secretKey: string
  apiKey: string
}>({
  remark: '',
  secretKey: '',
  apiKey: ''
})

// 表单验证规则
const keyFormRules = {
  apiKey: [{ required: true, message: t('llmManagement.pleaseEnterApiKeyValidation'), trigger: 'blur' }]
}

// 加载模型数据
const loadModels = async () => {
  loading.value = true
  try {
    const models = await getLLMModels()
    // 为每个模型添加扩展字段
    modelList.value = models.map(model => ({
      ...model,
      description: getModelDescription(model.displayName),
      icon: model.displayName,
      status: 'active' as const
    }))
  } catch (error) {
    console.error('加载模型数据失败:', error)
    ElMessage.error(t('llmManagement.loadModelDataFailed'))
  } finally {
    loading.value = false
  }
}

// 获取模型首字母
const getModelInitials = (name: string) => {
  if (!name) return ''
  const words = name.split(' ')
  if (words.length === 1) {
    return name.substring(0, 2).toUpperCase()
  }
  return words.map(word => word.charAt(0)).join('').substring(0, 2).toUpperCase()
}

// 获取模型描述
const getModelDescription = (displayName: string) => {
  const descriptions: Record<string, string> = {
    'DeepSeek': t('llmManagement.deepseekDesc'),
    '文心一言': t('llmManagement.wenxinDesc'),
    '通义千问': t('llmManagement.qwenDesc'),
    'Kimi': t('llmManagement.kimiDesc'),
    '月之暗面 (Kimi)': t('llmManagement.kimiDesc'),
    'ChatGPT': t('llmManagement.chatgptDesc'),
    'Grok': t('llmManagement.grokDesc'),
    'Claude': t('llmManagement.claudeDesc'),
    'Gemini': t('llmManagement.geminiDesc'),
    '智谱AI': t('llmManagement.zhipuDesc'),
    '百川智能': t('llmManagement.baichuanDesc'),
    '讯飞星火': t('llmManagement.xunfeiDesc')
  }
  return descriptions[displayName] || t('llmManagement.advancedAiModel')
}

// 获取模型颜色
const getModelColor = (name: string) => {
  const colors = {
    'DeepSeek': '#4F46E5',
    '文心一言': '#FF6B35',
    '通义千问': '#00D4AA',
    'Kimi': '#8B5CF6',
    '月之暗面 (Kimi)': '#8B5CF6',
    'ChatGPT': '#10B981',
    'Grok': '#F59E0B',
    'Claude': '#EF4444',
    'Gemini': '#3B82F6',
    '智谱AI': '#9333EA',
    '百川智能': '#F97316',
    '讯飞星火': '#06B6D4'
  }
  return colors[name as keyof typeof colors] || '#6B7280'
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
    ElMessage.success(t('llmManagement.statusUpdateSuccess'))
  } catch (error) {
    console.error('状态更新失败:', error)
    ElMessage.error(t('llmManagement.statusUpdateFailed'))
    // 恢复原状态
    model.status = model.status === 'active' ? 'inactive' : 'active'
  }
}

// 管理密钥
const handleManageKeys = (row: LLMModel) => {
  // 直接使用模型中的密钥数据
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
      t('llmManagement.confirmDeleteKey'),
      t('llmManagement.deleteConfirm'),
      {
        confirmButtonText: t('llmManagement.confirm'),
        cancelButtonText: t('llmManagement.cancel'),
        type: 'warning'
      }
    )

    await deleteLLMModelKey(currentModel.value!.providerName, key.id)
    ElMessage.success(t('llmManagement.keyDeleteSuccess'))

    // 重新加载所有模型数据
    await loadModels()

    // 更新当前模型数据
    const updatedModel = modelList.value.find((m: LLMModel) => m.providerName === currentModel.value!.providerName)
    if (updatedModel) {
      currentModel.value = updatedModel
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除密钥失败:', error)
      ElMessage.error(t('llmManagement.keyDeleteFailed'))
    }
  }
}

// 密钥状态变更
const handleKeyStatusChange = async (key: LLMKey) => {
  try {
    await updateLLMModelKeyStatus(currentModel.value!.providerName, key.id, key.status)
    ElMessage.success(t('llmManagement.keyStatusUpdateSuccess'))
  } catch (error) {
    console.error('密钥状态更新失败:', error)
    ElMessage.error(t('llmManagement.keyStatusUpdateFailed'))
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

    if (keyForm.id) {
      // 编辑模式
      await updateLLMModelKey(currentModel.value!.providerName, keyForm.id, keyForm)
      ElMessage.success(t('llmManagement.keyUpdateSuccess'))
    } else {
      // 新增模式
      const keyData = {
        llmProvider: currentModel.value!.providerName,
        remark: keyForm.remark,
        secretKey: keyForm.secretKey,
        apiKey: keyForm.apiKey,
        status: 'active' as const
      }
      await addLLMModelKey(keyData)
      ElMessage.success(t('llmManagement.keyAddSuccess'))
    }

    // 重新加载所有模型数据
    await loadModels()

    // 更新当前模型数据
    const updatedModel = modelList.value.find((m: LLMModel) => m.providerName === currentModel.value!.providerName)
    if (updatedModel) {
      currentModel.value = updatedModel
    }

    // 关闭对话框
    addKeyDialogVisible.value = false
  } catch (error) {
    if (error !== 'cancel') {
      console.error('操作密钥失败:', error)
      ElMessage.error(t('llmManagement.operationFailed'))
    }
  } finally {
    submitting.value = false
  }
}

// 重置密钥表单
const resetKeyForm = () => {
  Object.assign(keyForm, {
    id: undefined,
    remark: '',
    secretKey: '',
    apiKey: ''
  })
  keyFormRef.value?.clearValidate()
}

// 编辑密钥
const handleEditKey = (key: LLMKey) => {
  // 重置表单
  resetKeyForm()

  // 填充表单数据
  Object.assign(keyForm, {
    id: key.id,
    remark: key.remark || '',
    secretKey: key.secretKey || '',
    apiKey: key.apiKey || ''
  })

  addKeyDialogVisible.value = true
}

// 初始化
onMounted(() => {
  loadModels()
})
</script>

<style scoped>
.llm-management {
  padding: 20px;
  background: var(--bg-color-page);
  min-height: 100vh;
}

.page-header {
  margin-bottom: 32px;
  text-align: left;
}

.page-header h1 {
  margin: 0 0 12px 0;
  color: var(--text-primary);
  font-size: 32px;
  font-weight: 700;
}

.page-header p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 16px;
}

.models-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.model-card {
  background: var(--bg-color);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--border-light);
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

.model-icon .icon-text {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 16px;
  border-radius: 12px;
}

.model-details {
  flex: 1;
}

.model-name {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.2;
}

.model-description {
  margin: 0;
  font-size: 14px;
  color: var(--text-regular);
  line-height: 1.4;
}

.model-status {
  flex-shrink: 0;
}

.model-stats {
  margin-bottom: 20px;
  padding: 16px;
  background: var(--bg-color-overlay);
  border-radius: 12px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  font-size: 14px;
  color: var(--text-regular);
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
  border-bottom: 1px solid var(--border-light);
}

.key-management .key-header h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: 20px;
  font-weight: 600;
}

.key-management .key-display {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  color: var(--text-regular);
  background: var(--bg-color-overlay);
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
