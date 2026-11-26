<template>
  <main class="third-workbench provider-workbench admin-page">
    <AdminPageHeader :title="t('thirdEmail.pageTitle')" :description="t('thirdEmail.pageDescription')">
      <el-button :icon="Refresh" :loading="loading" @click="loadProviders">{{ t('thirdCommon.refresh') }}</el-button>
    </AdminPageHeader>
    <section class="third-stats" :aria-label="t('thirdCommon.category')">
      <div>
        <span>{{ t('thirdCommon.providers') }}</span>
        <strong>{{ providerList.length }}</strong>
      </div>
      <div>
        <span>{{ t('thirdCommon.credentials') }}</span>
        <strong>{{ totalKeys }}</strong>
      </div>
      <div>
        <span>{{ t('thirdCommon.activeCredentials') }}</span>
        <strong>{{ activeKeys }}</strong>
      </div>
    </section>
    <div class="provider-toolbar">
      <el-input v-model="providerQuery"
                :prefix-icon="Search"
                clearable
                :placeholder="t('thirdCommon.searchProviders')"
                :aria-label="t('thirdCommon.searchProviders')"
      />
      <span>{{ visibleProviders.length }} {{ t('thirdCommon.providers') }}</span>
    </div>
    <div class="providers-grid" v-loading="loading">
      <article v-for="provider in visibleProviders" :key="provider.providerName" class="provider-card admin-lift">
        <div class="provider-header">
          <div class="provider-info">
            <span class="provider-icon">
              <span class="icon-text" :style="{ '--provider-accent': getProviderColor(provider.displayName) }">{{ getProviderInitials(provider.displayName) }}</span>
            </span>
            <div class="provider-details">
              <h2 class="provider-name">{{ provider.displayName }}</h2>
              <p class="provider-description">{{ provider.description || provider.providerName }}</p>
            </div>
          </div>
          <el-tag :type="provider.keys?.length ? 'success' : 'info'" effect="plain" size="small">{{ t(provider.keys?.length ? 'thirdCommon.configured' : 'thirdCommon.notConfigured') }}</el-tag>
        </div>
        <div class="provider-footer">
          <div class="provider-stats">
            <span>{{ t('thirdEmail.keyCount') }}</span>
            <strong>{{ provider.keys?.length || 0 }}</strong>
          </div>
          <el-button v-if="hasPermission('third:email:view')"
                     type="primary"
                     plain
                     :icon="Key"
                     @click="handleManageKeys(provider)"
          >{{ t('thirdEmail.manageKeys') }}</el-button>
        </div>
      </article>
      <el-empty v-if="!loading && !visibleProviders.length"
                class="provider-empty"
                :description="t('thirdCommon.noProviders')"
                :image-size="76"
      >
        <p>{{ t('thirdCommon.noProvidersHint') }}</p>
      </el-empty>
    </div>
    <!-- 密钥管理对话框 -->
    <el-dialog
      v-model="keyDialogVisible"
      :title="t('thirdEmail.keyManagementTitle')"
      width="min(1120px,96vw)"
      class="third-key-dialog"
      :close-on-click-modal="false"
    >
      <div class="key-management">
        <div class="key-header">
          <h3>{{ currentProvider?.displayName }} - {{ t('thirdEmail.keyManagementSubtitle') }}</h3>
          <el-button type="primary"
                     size="small"
                     @click="handleAddKey"
                     v-if="hasPermission('third:email:create')"
          >
            <el-icon>
              <Plus />
            </el-icon>
            {{ t('thirdEmail.addKey') }}
          </el-button>
        </div>
        <el-table :data="currentProvider?.keys || []" stripe>
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
                :disabled="!hasPermission('third:email:edit')"
                :active-value="'active'"
                :inactive-value="'inactive'"
                @change="handleKeyStatusChange(row)"
              />
            </template>
          </el-table-column>
          <el-table-column prop="createTime" :label="t('thirdEmail.createTime')" width="160" />
          <el-table-column :label="t('thirdEmail.operation')" width="180" fixed="right">
            <template #default="{ row }">
              <el-button
                type="primary"
                size="small"
                text
                @click="handleEditKey(row)"
                v-if="hasPermission('third:email:edit')"
              >
                <el-icon>
                  <Edit />
                </el-icon>
                {{ t('thirdEmail.edit') }}
              </el-button>
              <el-button
                type="danger"
                size="small"
                text
                @click="handleDeleteKey(row)"
                v-if="hasPermission('third:email:delete')"
              >
                <el-icon>
                  <Delete />
                </el-icon>
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
      width="min(640px,94vw)"
      class="third-key-dialog"
      :close-on-click-modal="false"
    >
      <el-form
        ref="keyFormRef"
        :model="keyForm"
        :rules="keyFormRules"
        label-position="top"
        class="key-form"
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
  </main>
</template>

<script setup lang="ts">
import AdminPageHeader from '@/components/common/AdminPageHeader.vue'
import { computed, ref, reactive, onMounted } from 'vue'
import { Refresh, Search } from '@element-plus/icons-vue'
import './third-management.scss'
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
const providerQuery = ref('')
const visibleProviders = computed(() => {
  const query = providerQuery.value.trim().toLowerCase()
  return providerList.value.filter(provider => `${provider.displayName} ${provider.description} ${provider.providerName}`.toLowerCase().includes(query))
})
const totalKeys = computed(() => providerList.value.reduce((sum, provider) => sum + (provider.keys?.length || 0), 0))
const activeKeys = computed(() => providerList.value.reduce((sum, provider) => sum + (provider.keys?.filter(key => key.status === 'active').length || 0), 0))

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
const getProviderInitials = (name: string) => name.trim().slice(0, 2).toUpperCase()

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
const maskKey = (key: string) => key ? '••••••••' : '—'

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
