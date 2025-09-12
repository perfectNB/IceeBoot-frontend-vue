<template>
  <div class="sms-management">
    <div class="page-header">
      <h1 class="page-title">短信服务管理</h1>
      <p class="page-description">管理短信服务配置和API密钥</p>
    </div>

    <!-- 服务商卡片区域 -->
    <div class="providers-grid" v-loading="loading">
      <div
        v-for="provider in providerList"
        :key="provider.providerName"
        class="provider-card"
      >
        <div class="provider-header">
          <div class="provider-info">
            <div class="provider-icon">
              <div class="icon-text" :style="{ backgroundColor: getProviderColor(provider.displayName) }">
                {{ getProviderInitials(provider.displayName) }}
              </div>
            </div>
            <div class="provider-details">
              <h3 class="provider-name">{{ provider.displayName }}</h3>
              <p class="provider-description">{{ provider.description }}</p>
            </div>
          </div>
<!--          <div class="provider-status">-->
<!--            <el-switch-->
<!--              v-model="provider.status"-->
<!--              :active-value="'active'"-->
<!--              :inactive-value="'inactive'"-->
<!--              @change="handleStatusChange(provider)"-->
<!--            />-->
<!--          </div>-->
        </div>

        <div class="provider-stats">
          <div class="stat-item">
            <span class="stat-label">密钥数量</span>
            <span class="stat-value">{{ provider.keys?.length || 0 }}</span>
          </div>
        </div>

        <div class="provider-actions">
          <el-button
            type="primary"
            :icon="Key"
            @click="handleManageKeys(provider)"
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
      title="短信密钥管理"
      width="900px"
      :close-on-click-modal="false"
    >
      <div class="key-management">
        <div class="key-header">
          <h3>{{ currentProvider?.displayName }} - 短信密钥</h3>
          <el-button type="primary" size="small" @click="handleAddKey">
            <el-icon><Plus /></el-icon>
            添加密钥
          </el-button>
        </div>

        <el-table :data="currentProvider?.keys || []" stripe border>
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column label="AccessKey ID" min-width="200">
            <template #default="{ row }">
              <span class="key-display">
                {{ maskKey(row.accessKeyId) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="AccessKey Secret" min-width="200">
            <template #default="{ row }">
              <span class="key-display">
                {{ maskKey(row.accessKeySecret) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="defaultSignName" label="默认签名" min-width="150" />
          <el-table-column prop="defaultTemplateId" label="默认模板ID" min-width="150" />
          <el-table-column prop="sender" label="发送方" min-width="150" />
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
          <el-table-column label="操作" width="180">
            <template #default="{ row }">
              <el-button
                type="primary"
                size="small"
                text
                @click="handleEditKey(row)"
              >
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
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
      title="添加短信密钥"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="keyFormRef"
        :model="keyForm"
        :rules="keyFormRules"
        label-width="120px"
      >
        <el-form-item label="密钥备注" prop="remark">
          <el-input
            v-model="keyForm.remark"
            placeholder="请输入密钥备注"
          />
        </el-form-item>
        <el-form-item label="AccessKey ID" prop="accessKeyId">
          <el-input
            v-model="keyForm.accessKeyId"
            placeholder="请输入AccessKey ID"
          />
        </el-form-item>
        <el-form-item label="AccessKey Secret" prop="accessKeySecret">
          <el-input
            v-model="keyForm.accessKeySecret"
            type="password"
            show-password
            placeholder="请输入AccessKey Secret"
          />
        </el-form-item>
        <el-form-item label="默认签名" prop="defaultSignName">
          <el-input
            v-model="keyForm.defaultSignName"
            placeholder="请输入默认短信签名"
          />
        </el-form-item>
        <el-form-item label="默认模板ID" prop="defaultTemplateId">
          <el-input
            v-model="keyForm.defaultTemplateId"
            placeholder="请输入默认短信模板ID"
          />
        </el-form-item>
        <el-form-item label="发送方" prop="sender">
          <el-input
            v-model="keyForm.sender"
            placeholder="请输入发送方（如需要）"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="addKeyDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmitKey" :loading="submitting">
            {{ keyForm.id ? '更新' : '添加' }}
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

// 导入API接口
import {
  getSMSProviders,
  addSMSKey,
  updateSMSKey,
  deleteSMSKey,
  updateSMSKeyStatus
} from '@/api/sms'
import type { SMSProvider, SMSKey } from '@/api/sms'

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const keyDialogVisible = ref(false)
const addKeyDialogVisible = ref(false)
const keyFormRef = ref<FormInstance>()
const currentProvider = ref<SMSProvider | null>(null)

// 短信服务商列表
const providerList = ref<SMSProvider[]>([])

// 密钥表单
const keyForm = reactive<{
  id?: number
  remark: string
  accessKeyId: string
  accessKeySecret: string
  defaultSignName: string
  defaultTemplateId: string
  sender: string
}>({
  remark: '',
  accessKeyId: '',
  accessKeySecret: '',
  defaultSignName: '',
  defaultTemplateId: '',
  sender: ''
})

// 表单验证规则
const keyFormRules = {
  accessKeyId: [{ required: true, message: '请输入AccessKey ID', trigger: 'blur' }],
  accessKeySecret: [{ required: true, message: '请输入AccessKey Secret', trigger: 'blur' }],
  defaultSignName: [{ required: true, message: '请输入默认短信签名', trigger: 'blur' }]
}

// 获取服务商首字母
const getProviderInitials = (name: string) => {
  if (!name) return ''
  const words = name.split(' ')
  if (words.length === 1) {
    return name.substring(0, 2).toUpperCase()
  }
  return words.map(word => word.charAt(0)).join('').substring(0, 2).toUpperCase()
}

// 获取服务商颜色
const getProviderColor = (name: string) => {
  const colors = {
    '阿里云短信': '#FF6A00',
    '华为云短信': '#FF6B35',
    '腾讯云短信': '#006EFF',
    '七牛云短信': '#00D4AA',
    '网易云信': '#E60012',
    '容联云通讯': '#4285F4'
  }
  return colors[name as keyof typeof colors] || '#6B7280'
}

// 掩码显示密钥
const maskKey = (key: string) => {
  if (!key || key.length < 8) return key
  return key.substring(0, 4) + '****' + key.substring(key.length - 4)
}

// 状态变更
// const handleStatusChange = async (provider: SMSProvider) => {
//   try {
//     // TODO: 调用API更新服务商状态
//     // await updateSMSProviderStatus(provider.providerName, provider.status)
//     ElMessage.success('状态更新成功')
//   } catch (error) {
//     console.error('状态更新失败:', error)
//     ElMessage.error('状态更新失败')
//     // 恢复原状态
//     provider.status = provider.status === 'active' ? 'inactive' : 'active'
//   }
// }

// 管理密钥
const handleManageKeys = (provider: SMSProvider) => {
  currentProvider.value = provider
  keyDialogVisible.value = true
}

// 添加密钥
const handleAddKey = () => {
  resetKeyForm()
  addKeyDialogVisible.value = true
}

// 删除密钥
const handleDeleteKey = async (key: SMSKey) => {
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

    await deleteSMSKey(key.id)
    ElMessage.success('密钥删除成功')

    // 重新加载所有服务商数据
    await loadProviders()

    // 更新当前服务商数据
    const updatedProvider = providerList.value.find(p => p.providerName === currentProvider.value!.providerName)
    if (updatedProvider) {
      currentProvider.value = updatedProvider
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除密钥失败:', error)
      ElMessage.error('删除密钥失败')
    }
  }
}

// 密钥状态变更
const handleKeyStatusChange = async (key: SMSKey) => {
  try {
    await updateSMSKeyStatus(currentProvider.value!.providerName, key.id, key.status)
    ElMessage.success('密钥状态更新成功')
  } catch (error) {
    console.error('密钥状态更新失败:', error)
    ElMessage.error('密钥状态更新失败')
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
      const keyData = {
        smsProvider: currentProvider.value!.providerName,
        ...keyForm
      }
      await updateSMSKey(currentProvider.value!.providerName, keyForm.id, keyData)
      ElMessage.success('密钥更新成功')

      // 重新加载所有服务商数据
      await loadProviders()

      // 更新当前服务商数据
      const updatedProvider = providerList.value.find(p => p.providerName === currentProvider.value!.providerName)
      if (updatedProvider) {
        currentProvider.value = updatedProvider
      }
    } else {
      // 新增模式
      const keyData = {
        smsProvider: currentProvider.value!.providerName,
        ...keyForm,
        status: 'active' as const
      }
      await addSMSKey(keyData)
      ElMessage.success('密钥添加成功')
    }

    // 重新加载所有服务商数据
    await loadProviders()

    // 更新当前服务商数据
    const updatedProvider = providerList.value.find(p => p.providerName === currentProvider.value!.providerName)
    if (updatedProvider) {
      currentProvider.value = updatedProvider
    }

    addKeyDialogVisible.value = false
  } catch (error) {
    if (error !== 'cancel') {
      console.error('操作密钥失败:', error)
      ElMessage.error('操作密钥失败')
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
    accessKeyId: '',
    accessKeySecret: '',
    defaultSignName: '',
    defaultTemplateId: '',
    sender: ''
  })
  keyFormRef.value?.clearValidate()
}

// 编辑密钥
const handleEditKey = (key: SMSKey) => {
  resetKeyForm()

  Object.assign(keyForm, {
    id: key.id,
    remark: key.remark || '',
    accessKeyId: key.accessKeyId || '',
    accessKeySecret: key.accessKeySecret || '',
    defaultSignName: key.defaultSignName || '',
    defaultTemplateId: key.defaultTemplateId || '',
    sender: key.sender || ''
  })

  addKeyDialogVisible.value = true
}

// 加载服务商数据
const loadProviders = async () => {
  loading.value = true
  try {
    const providers = await getSMSProviders()
    providerList.value = providers
  } catch (error) {
    console.error('加载服务商数据失败:', error)
    ElMessage.error('加载服务商数据失败')
  } finally {
    loading.value = false
  }
}

// 初始化
onMounted(() => {
  loadProviders()
})
</script>

<style scoped>
.sms-management {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 32px;
  text-align: left;
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

.providers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.provider-card {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e4e7ed;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.provider-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.provider-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.provider-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.provider-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  overflow: hidden;
  margin-right: 16px;
  flex-shrink: 0;
}

.provider-icon .icon-text {
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

.provider-details {
  flex: 1;
}

.provider-name {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  line-height: 1.2;
}

.provider-description {
  margin: 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.4;
}

.provider-status {
  flex-shrink: 0;
}

.provider-stats {
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

.provider-actions {
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
  .providers-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .provider-card {
    padding: 20px;
  }

  .page-header h1 {
    font-size: 24px;
  }
}
</style>
