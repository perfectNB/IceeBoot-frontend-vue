<template>
  <div class="email-management">
    <div class="page-header">
      <h1 class="page-title">{{ t('thirdEmail.pageTitle') }}</h1>
      <p class="page-description">{{ t('thirdEmail.pageDescription') }}</p>
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
            <span class="stat-label">{{ t('thirdEmail.keyCount') }}</span>
            <span class="stat-value">{{ provider.keys?.length || 0 }}</span>
          </div>
        </div>

        <div class="provider-actions">
          <el-button
            type="primary"
            :icon="Key"
            @click="handleManageKeys(provider)"
            class="manage-keys-btn"
            v-if="hasPermission('third:email:view')"
          >
            {{ t('thirdEmail.manageKeys') }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- 密钥管理对话框 -->
    <el-dialog
      v-model="keyDialogVisible"
      :title="t('thirdEmail.keyManagementTitle')"
      width="1000px"
      :close-on-click-modal="false"
    >
      <div class="key-management">
        <div class="key-header">
          <h3>{{ currentProvider?.displayName }} - {{ t('thirdEmail.keyManagementSubtitle') }}</h3>
          <el-button type="primary" size="small" @click="handleAddKey" v-if="hasPermission('third:email:create')">
            <el-icon><Plus /></el-icon>
            {{ t('thirdEmail.addKey') }}
          </el-button>
        </div>

        <el-table :data="currentProvider?.keys || []" stripe border>
          <el-table-column prop="id" :label="t('thirdEmail.id')" width="80" />
          <el-table-column prop="emailAddress" :label="t('thirdEmail.emailAddress')" min-width="200" />
          <el-table-column :label="t('thirdEmail.passwordOrAuthCode')" min-width="150">
            <template #default="{ row }">
              <span class="key-display">
                {{ maskKey(row.emailPassword) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="smtpHost" :label="t('thirdEmail.smtpServer')" min-width="180" />
          <el-table-column prop="smtpPort" :label="t('thirdEmail.port')" width="80" />
          <el-table-column :label="t('thirdEmail.ssl')" width="80">
            <template #default="{ row }">
              <el-tag :type="row.enableSsl ? 'success' : 'info'" size="small">
                {{ row.enableSsl ? t('thirdEmail.yes') : t('thirdEmail.no') }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="senderName" :label="t('thirdEmail.senderName')" min-width="150" />
          <el-table-column prop="remark" :label="t('thirdEmail.remark')" min-width="150" />
          <el-table-column :label="t('thirdEmail.status')" width="100">
            <template #default="{ row }">
              <el-switch
                v-model="row.status"
                :active-value="'active'"
                :inactive-value="'inactive'"
                @change="handleKeyStatusChange(row)"
              />
            </template>
          </el-table-column>
          <el-table-column prop="createTime" :label="t('thirdEmail.createTime')" width="160" />
          <el-table-column :label="t('thirdEmail.operation')" width="180">
            <template #default="{ row }">
              <el-button
                type="primary"
                size="small"
                text
                @click="handleEditKey(row)"
                v-if="hasPermission('third:email:edit')"
              >
                <el-icon><Edit /></el-icon>
                {{ t('thirdEmail.edit') }}
              </el-button>
              <el-button
                type="danger"
                size="small"
                text
                @click="handleDeleteKey(row)"
                v-if="hasPermission('third:email:delete')"
              >
                <el-icon><Delete /></el-icon>
                {{ t('thirdEmail.delete') }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="keyDialogVisible = false">{{ t('thirdEmail.close') }}</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 添加密钥对话框 -->
    <el-dialog
      v-model="addKeyDialogVisible"
      :title="t('thirdEmail.addKeyTitle')"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="keyFormRef"
        :model="keyForm"
        :rules="keyFormRules"
        label-width="120px"
      >
        <el-form-item :label="t('thirdEmail.keyRemark')" prop="remark">
          <el-input
            v-model="keyForm.remark"
            :placeholder="t('thirdEmail.placeholderKeyRemark')"
          />
        </el-form-item>
        <el-form-item :label="t('thirdEmail.emailAddress')" prop="emailAddress">
          <el-input
            v-model="keyForm.emailAddress"
            :placeholder="t('thirdEmail.placeholderEmailAddress')"
          />
        </el-form-item>
        <el-form-item :label="t('thirdEmail.passwordOrAuthCode')" prop="emailPassword">
          <el-input
            v-model="keyForm.emailPassword"
            type="password"
            show-password
            :placeholder="t('thirdEmail.placeholderPasswordOrAuthCode')"
          />
        </el-form-item>
        <el-form-item :label="t('thirdEmail.smtpServer')" prop="smtpHost">
          <el-input
            v-model="keyForm.smtpHost"
            :placeholder="t('thirdEmail.placeholderSmtpServer')"
          />
        </el-form-item>
        <el-form-item :label="t('thirdEmail.smtpPort')" prop="smtpPort">
          <el-input-number
            v-model="keyForm.smtpPort"
            :min="1"
            :max="65535"
            :placeholder="t('thirdEmail.placeholderPort')"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item :label="t('thirdEmail.enableSsl')" prop="enableSsl">
          <el-switch
            v-model="keyForm.enableSsl"
            :active-text="t('thirdEmail.enable')"
            :inactive-text="t('thirdEmail.disable')"
          />
        </el-form-item>
        <el-form-item :label="t('thirdEmail.senderName')" prop="senderName">
          <el-input
            v-model="keyForm.senderName"
            :placeholder="t('thirdEmail.placeholderSenderName')"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="addKeyDialogVisible = false">{{ t('thirdEmail.cancel') }}</el-button>
          <el-button type="primary" @click="handleSubmitKey" :loading="submitting">
            {{ keyForm.id ? t('thirdEmail.update') : t('thirdEmail.add') }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { useI18n } from 'vue-i18n'

// 定义组件名称
defineOptions({
  name: 'EmailManagement'
})
import {
  Plus,
  Edit,
  Delete,
  Key
} from '@element-plus/icons-vue'

const { t } = useI18n()

// 导入API接口
import {
  getEmailProviders,
  addEmailKey,
  updateEmailKey,
  deleteEmailKey,
  updateEmailKeyStatus
} from '@/api/email'
import { hasPermission } from '@/utils/permission'
import type { EmailProvider, EmailKey } from '@/api/email'

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const keyDialogVisible = ref(false)
const addKeyDialogVisible = ref(false)
const keyFormRef = ref<FormInstance>()
const currentProvider = ref<EmailProvider | null>(null)

// 邮件服务商列表
const providerList = ref<EmailProvider[]>([])

// 密钥表单
const keyForm = reactive<{
  id?: number
  remark: string
  emailAddress: string
  emailPassword: string
  smtpHost: string
  smtpPort: number
  enableSsl: boolean
  senderName: string
}>({
  remark: '',
  emailAddress: '',
  emailPassword: '',
  smtpHost: '',
  smtpPort: 587,
  enableSsl: true,
  senderName: ''
})

// 表单验证规则
const keyFormRules = {
  emailAddress: [
    { required: true, message: t('thirdEmail.validationEmailAddress'), trigger: 'blur' },
    { type: 'email', message: t('thirdEmail.validationEmailFormat'), trigger: 'blur' }
  ],
  emailPassword: [{ required: true, message: t('thirdEmail.validationPasswordOrAuthCode'), trigger: 'blur' }],
  smtpHost: [{ required: true, message: t('thirdEmail.validationSmtpServer'), trigger: 'blur' }],
  smtpPort: [{ required: true, message: t('thirdEmail.validationSmtpPort'), trigger: 'blur' }]
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
    '阿里云邮件': '#FF6A00',
    'Gmail邮箱': '#EA4335',
    '网易邮箱': '#E60012',
    'QQ邮箱': '#12B7F5',
    '腾讯企业邮箱': '#006EFF',
    'Outlook邮箱': '#0078D4'
  }
  return colors[name as keyof typeof colors] || '#6B7280'
}

// 掩码显示密钥
const maskKey = (key: string) => {
  if (!key || key.length < 8) return key
  return key.substring(0, 4) + '****' + key.substring(key.length - 4)
}

// // 状态变更
// const handleStatusChange = async (provider: EmailProvider) => {
//   try {
//     // TODO: 调用API更新服务商状态
//     // await updateEmailProviderStatus(provider.providerName, provider.status)
//     ElMessage.success('状态更新成功')
//   } catch (error) {
//     console.error('状态更新失败:', error)
//     ElMessage.error('状态更新失败')
//     // 恢复原状态
//     provider.status = provider.status === 'active' ? 'inactive' : 'active'
//   }
// }

// 管理密钥
const handleManageKeys = (provider: EmailProvider) => {
  currentProvider.value = provider
  keyDialogVisible.value = true
}

// 添加密钥
const handleAddKey = () => {
  resetKeyForm()
  // 根据服务商设置默认值
  if (currentProvider.value) {
    setDefaultValues(currentProvider.value.providerName)
  }
  addKeyDialogVisible.value = true
}

// 设置默认值
const setDefaultValues = (providerName: string) => {
  const defaults = {
    gmail: {
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      ssl: true
    },
    netease: {
      smtpHost: 'smtp.163.com',
      smtpPort: 465,
      ssl: true
    },
    qq: {
      smtpHost: 'smtp.qq.com',
      smtpPort: 587,
      ssl: true
    },
    aliyun: {
      smtpHost: 'smtpdm.aliyun.com',
      smtpPort: 465,
      ssl: true
    },
    tencent: {
      smtpHost: 'smtp.exmail.qq.com',
      smtpPort: 465,
      ssl: true
    },
    outlook: {
      smtpHost: 'smtp-mail.outlook.com',
      smtpPort: 587,
      ssl: true
    }
  }

  const config = defaults[providerName as keyof typeof defaults]
  if (config) {
    Object.assign(keyForm, config)
  }
}

// 删除密钥
const handleDeleteKey = async (key: EmailKey) => {
  try {
    await ElMessageBox.confirm(
      t('thirdEmail.deleteConfirm'),
      t('thirdEmail.deleteTitle'),
      {
        confirmButtonText: t('thirdEmail.confirm'),
        cancelButtonText: t('thirdEmail.cancel'),
        type: 'warning'
      }
    )

    await deleteEmailKey(key.id)
    ElMessage.success(t('thirdEmail.keyDeleteSuccess'))

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
      ElMessage.error(t('thirdEmail.keyDeleteFailed'))
    }
  }
}

// 密钥状态变更
const handleKeyStatusChange = async (key: EmailKey) => {
  try {
    await updateEmailKeyStatus(currentProvider.value!.providerName, key.id, key.status)
    ElMessage.success(t('thirdEmail.keyStatusUpdateSuccess'))
  } catch (error) {
    console.error('密钥状态更新失败:', error)
    ElMessage.error(t('thirdEmail.keyStatusUpdateFailed'))
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
        emailProvider: currentProvider.value!.providerName,
        ...keyForm
      }
      await updateEmailKey(currentProvider.value!.providerName, keyForm.id, keyData)
      ElMessage.success(t('thirdEmail.keyUpdateSuccess'))

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
        emailProvider: currentProvider.value!.providerName,
        ...keyForm,
        status: 'active' as const
      }
      await addEmailKey(keyData)
      ElMessage.success(t('thirdEmail.keyAddSuccess'))
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
      ElMessage.error(t('thirdEmail.keyOperationFailed'))
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
    emailAddress: '',
    emailPassword: '',
    smtpHost: '',
    smtpPort: 587,
    enableSsl: true,
    senderName: ''
  })
  keyFormRef.value?.clearValidate()
}

// 编辑密钥
const handleEditKey = (key: EmailKey) => {
  resetKeyForm()

  Object.assign(keyForm, {
    id: key.id,
    remark: key.remark || '',
    emailAddress: key.emailAddress || '',
    emailPassword: key.emailPassword || '',
    smtpHost: key.smtpHost || '',
    smtpPort: key.smtpPort || 587,
    enableSsl: key.enableSsl !== undefined ? key.enableSsl : true,
    senderName: key.senderName || ''
  })

  addKeyDialogVisible.value = true
}

// 加载服务商数据
const loadProviders = async () => {
  loading.value = true
  try {
    const providers = await getEmailProviders()
    providerList.value = providers
  } catch (error) {
    console.error('加载服务商数据失败:', error)
    ElMessage.error(t('thirdEmail.loadProvidersFailed'))
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
.email-management {
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

:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-input-number .el-input__inner) {
  text-align: left;
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
