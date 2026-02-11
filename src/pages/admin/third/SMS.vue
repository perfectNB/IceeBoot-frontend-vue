<template>
  <div class="sms-management">
    <div class="page-header">
      <h1 class="page-title">{{ t('thirdSms.title') }}</h1>
      <p class="page-description">{{ t('thirdSms.description') }}</p>
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
            <span class="stat-label">{{ t('thirdSms.keyCount') }}</span>
            <span class="stat-value">{{ provider.keys?.length || 0 }}</span>
          </div>
        </div>

        <div class="provider-actions">
          <el-button
            type="primary"
            :icon="Key"
            @click="handleManageKeys(provider)"
            class="manage-keys-btn"
            v-if="hasPermission('third:sms:view')"
          >
            {{ t('thirdSms.manageKeys') }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- 密钥管理对话框 -->
    <el-dialog
      v-model="keyDialogVisible"
      :title="t('thirdSms.keyManagementTitle')"
      width="900px"
      :close-on-click-modal="false"
    >
      <div class="key-management">
        <div class="key-header">
          <h3>{{ currentProvider?.displayName }} - {{ t('thirdSms.smsKeys') }}</h3>
          <el-button type="primary" size="small" @click="handleAddKey" v-if="hasPermission('third:sms:create')">
            <el-icon><Plus /></el-icon>
            {{ t('thirdSms.addKey') }}
          </el-button>
        </div>

        <el-table :data="currentProvider?.keys || []" stripe border>
          <el-table-column prop="id" :label="t('thirdSms.table.id')" width="80" />
          <el-table-column :label="t('thirdSms.table.accessKeyId')" min-width="200">
            <template #default="{ row }">
              <span class="key-display">
                {{ maskKey(row.accessKeyId) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column :label="t('thirdSms.table.accessKeySecret')" min-width="200">
            <template #default="{ row }">
              <span class="key-display">
                {{ maskKey(row.accessKeySecret) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="defaultSignName" :label="t('thirdSms.table.defaultSignName')" min-width="150" />
          <el-table-column prop="defaultTemplateId" :label="t('thirdSms.table.defaultTemplateId')" min-width="150" />
          <el-table-column prop="sender" :label="t('thirdSms.table.sender')" min-width="150" />
          <el-table-column prop="remark" :label="t('thirdSms.table.remark')" min-width="150" />
          <el-table-column :label="t('thirdSms.table.status')" width="100">
            <template #default="{ row }">
              <el-switch
                v-model="row.status"
                :active-value="'active'"
                :inactive-value="'inactive'"
                @change="handleKeyStatusChange(row)"
              />
            </template>
          </el-table-column>
          <el-table-column prop="createTime" :label="t('thirdSms.table.createTime')" width="160" />
          <el-table-column :label="t('thirdSms.table.actions')" width="180">
            <template #default="{ row }">
              <el-button
                type="primary"
                size="small"
                text
                @click="handleEditKey(row)"
                v-if="hasPermission('third:sms:edit')"
              >
                <el-icon><Edit /></el-icon>
                {{ t('thirdSms.edit') }}
              </el-button>
              <el-button
                type="danger"
                size="small"
                text
                @click="handleDeleteKey(row)"
                v-if="hasPermission('third:sms:delete')"
              >
                <el-icon><Delete /></el-icon>
                {{ t('thirdSms.delete') }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="keyDialogVisible = false">{{ t('thirdSms.close') }}</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 添加密钥对话框 -->
    <el-dialog
      v-model="addKeyDialogVisible"
      :title="t('thirdSms.addKeyTitle')"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="keyFormRef"
        :model="keyForm"
        :rules="keyFormRules"
        label-width="120px"
      >
        <el-form-item :label="t('thirdSms.form.remark')" prop="remark">
          <el-input
            v-model="keyForm.remark"
            :placeholder="t('thirdSms.form.remarkPlaceholder')"
          />
        </el-form-item>
        <el-form-item :label="t('thirdSms.form.accessKeyId')" prop="accessKeyId">
          <el-input
            v-model="keyForm.accessKeyId"
            :placeholder="t('thirdSms.form.accessKeyIdPlaceholder')"
          />
        </el-form-item>
        <el-form-item :label="t('thirdSms.form.accessKeySecret')" prop="accessKeySecret">
          <el-input
            v-model="keyForm.accessKeySecret"
            type="password"
            show-password
            :placeholder="t('thirdSms.form.accessKeySecretPlaceholder')"
          />
        </el-form-item>
        <el-form-item :label="t('thirdSms.form.defaultSignName')" prop="defaultSignName">
          <el-input
            v-model="keyForm.defaultSignName"
            :placeholder="t('thirdSms.form.defaultSignNamePlaceholder')"
          />
        </el-form-item>
        <el-form-item :label="t('thirdSms.form.defaultTemplateId')" prop="defaultTemplateId">
          <el-input
            v-model="keyForm.defaultTemplateId"
            :placeholder="t('thirdSms.form.defaultTemplateIdPlaceholder')"
          />
        </el-form-item>
        <el-form-item :label="t('thirdSms.form.sender')" prop="sender">
          <el-input
            v-model="keyForm.sender"
            :placeholder="t('thirdSms.form.senderPlaceholder')"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="addKeyDialogVisible = false">{{ t('thirdSms.cancel') }}</el-button>
          <el-button type="primary" @click="handleSubmitKey" :loading="submitting">
            {{ keyForm.id ? t('thirdSms.update') : t('thirdSms.add') }}
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
import { useI18n } from 'vue-i18n'

// 导入API接口
import {
  getSMSProviders,
  addSMSKey,
  updateSMSKey,
  deleteSMSKey,
  updateSMSKeyStatus
} from '@/api/sms'
import { hasPermission } from '@/utils/permission'
import type { SMSProvider, SMSKey } from '@/api/sms'

const { t } = useI18n()

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
  accessKeyId: [{ required: true, message: () => t('thirdSms.form.accessKeyIdRequired'), trigger: 'blur' }],
  accessKeySecret: [{ required: true, message: () => t('thirdSms.form.accessKeySecretRequired'), trigger: 'blur' }],
  defaultSignName: [{ required: true, message: () => t('thirdSms.form.defaultSignNameRequired'), trigger: 'blur' }]
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
      t('thirdSms.deleteConfirm'),
      t('thirdSms.deleteTitle'),
      {
        confirmButtonText: t('thirdSms.confirm'),
        cancelButtonText: t('thirdSms.cancel'),
        type: 'warning'
      }
    )

    await deleteSMSKey(key.id)
    ElMessage.success(t('thirdSms.deleteSuccess'))

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
      ElMessage.error(t('thirdSms.deleteFailed'))
    }
  }
}

// 密钥状态变更
const handleKeyStatusChange = async (key: SMSKey) => {
  try {
    await updateSMSKeyStatus(currentProvider.value!.providerName, key.id, key.status)
    ElMessage.success(t('thirdSms.statusUpdateSuccess'))
  } catch (error) {
    console.error('密钥状态更新失败:', error)
    ElMessage.error(t('thirdSms.statusUpdateFailed'))
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
      ElMessage.success(t('thirdSms.updateSuccess'))

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
      ElMessage.success(t('thirdSms.addSuccess'))
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
      ElMessage.error(t('thirdSms.operationFailed'))
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
    ElMessage.error(t('thirdSms.loadFailed'))
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

.providers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.provider-card {
  background: var(--bg-color);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--border-light);
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
  color: var(--text-primary);
  line-height: 1.2;
}

.provider-description {
  margin: 0;
  font-size: 14px;
  color: var(--text-regular);
  line-height: 1.4;
}

.provider-status {
  flex-shrink: 0;
}

.provider-stats {
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
