<template>
  <main class="third-workbench provider-workbench">
    <header class="third-heading">
      <div class="third-title">
        <span class="third-title-icon">
          <el-icon aria-hidden="true">
            <ChatDotSquare />
          </el-icon>
        </span>
        <div>
          <p class="third-eyebrow">{{ t('thirdCommon.category') }}</p>
          <h1>{{ t('thirdSms.title') }}</h1>
          <p class="third-description">{{ t('thirdSms.description') }}</p>
        </div>
      </div>
      <el-button :icon="Refresh" :loading="loading" @click="loadProviders">{{ t('thirdCommon.refresh') }}</el-button>
    </header>
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
      <article v-for="provider in visibleProviders" :key="provider.providerName" class="provider-card">
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
            <span>{{ t('thirdSms.keyCount') }}</span>
            <strong>{{ provider.keys?.length || 0 }}</strong>
          </div>
          <el-button v-if="hasPermission('third:sms:view')"
                     type="primary"
                     plain
                     :icon="Key"
                     @click="handleManageKeys(provider)"
          >{{ t('thirdSms.manageKeys') }}</el-button>
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
      :title="t('thirdSms.keyManagementTitle')"
      width="min(1120px,96vw)"
      class="third-key-dialog"
      :close-on-click-modal="false"
    >
      <div class="key-management">
        <div class="key-header">
          <h3>{{ currentProvider?.displayName }} - {{ t('thirdSms.keyManagementSubtitle') }}</h3>
          <el-button type="primary"
                     size="small"
                     @click="handleAddKey"
                     v-if="hasPermission('third:sms:create')"
          >
            <el-icon>
              <Plus />
            </el-icon>
            {{ t('thirdSms.addKey') }}
          </el-button>
        </div>
        <el-table :data="currentProvider?.keys || []" stripe>
          <el-table-column prop="id" :label="t('thirdSms.id')" width="80" />
          <el-table-column :label="t('thirdSms.accessKeyId')" min-width="200">
            <template #default="{ row }">
              <span class="key-display">
                {{ maskKey(row.accessKeyId) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column :label="t('thirdSms.accessKeySecret')" min-width="200">
            <template #default="{ row }">
              <span class="key-display">
                {{ maskKey(row.accessKeySecret) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="defaultSignName" :label="t('thirdSms.defaultSignName')" min-width="150" />
          <el-table-column prop="defaultTemplateId" :label="t('thirdSms.defaultTemplateId')" min-width="150" />
          <el-table-column prop="sender" :label="t('thirdSms.sender')" min-width="150" />
          <el-table-column prop="remark" :label="t('thirdSms.remark')" min-width="150" />
          <el-table-column :label="t('thirdSms.status')" width="100">
            <template #default="{ row }">
              <el-switch
                v-model="row.status"
                :disabled="!hasPermission('third:sms:edit')"
                :active-value="'active'"
                :inactive-value="'inactive'"
                @change="handleKeyStatusChange(row)"
              />
            </template>
          </el-table-column>
          <el-table-column prop="createTime" :label="t('thirdSms.createTime')" width="160" />
          <el-table-column :label="t('thirdSms.operation')" width="180" fixed="right">
            <template #default="{ row }">
              <el-button
                type="primary"
                size="small"
                text
                @click="handleEditKey(row)"
                v-if="hasPermission('third:sms:edit')"
              >
                <el-icon>
                  <Edit />
                </el-icon>
                {{ t('thirdSms.edit') }}
              </el-button>
              <el-button
                type="danger"
                size="small"
                text
                @click="handleDeleteKey(row)"
                v-if="hasPermission('third:sms:delete')"
              >
                <el-icon>
                  <Delete />
                </el-icon>
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
        <el-form-item :label="t('thirdSms.remark')" prop="remark">
          <el-input
            v-model="keyForm.remark"
            :placeholder="t('thirdSms.placeholderKeyRemark')"
          />
        </el-form-item>
        <el-form-item :label="t('thirdSms.accessKeyId')" prop="accessKeyId">
          <el-input
            v-model="keyForm.accessKeyId"
            :placeholder="t('thirdSms.placeholderAccessKeyId')"
          />
        </el-form-item>
        <el-form-item :label="t('thirdSms.accessKeySecret')" prop="accessKeySecret">
          <el-input
            v-model="keyForm.accessKeySecret"
            type="password"
            show-password
            :placeholder="t('thirdSms.placeholderAccessKeySecret')"
          />
        </el-form-item>
        <el-form-item :label="t('thirdSms.defaultSignName')" prop="defaultSignName">
          <el-input
            v-model="keyForm.defaultSignName"
            :placeholder="t('thirdSms.placeholderDefaultSignName')"
          />
        </el-form-item>
        <el-form-item :label="t('thirdSms.defaultTemplateId')" prop="defaultTemplateId">
          <el-input
            v-model="keyForm.defaultTemplateId"
            :placeholder="t('thirdSms.placeholderDefaultTemplateId')"
          />
        </el-form-item>
        <el-form-item :label="t('thirdSms.sender')" prop="sender">
          <el-input
            v-model="keyForm.sender"
            :placeholder="t('thirdSms.placeholderSender')"
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
  </main>
</template>

<script setup lang="ts">
import { computed, ref, reactive, onMounted } from 'vue'
import { ChatDotSquare, Refresh, Search } from '@element-plus/icons-vue'
import './third-management.scss'
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
  accessKeyId: [{ required: true, message: () => t('thirdSms.validationAccessKeyId'), trigger: 'blur' }],
  accessKeySecret: [{ required: true, message: () => t('thirdSms.validationAccessKeySecret'), trigger: 'blur' }],
  defaultSignName: [{ required: true, message: () => t('thirdSms.validationDefaultSignName'), trigger: 'blur' }]
}

// 获取服务商首字母
const getProviderInitials = (name: string) => name.trim().slice(0, 2).toUpperCase()

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
const maskKey = (key: string) => key ? '••••••••' : '—'

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
    ElMessage.success(t('thirdSms.keyDeleteSuccess'))

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
      ElMessage.error(t('thirdSms.keyDeleteFailed'))
    }
  }
}

// 密钥状态变更
const handleKeyStatusChange = async (key: SMSKey) => {
  try {
    await updateSMSKeyStatus(currentProvider.value!.providerName, key.id, key.status)
    ElMessage.success(t('thirdSms.keyStatusUpdateSuccess'))
  } catch (error) {
    console.error('密钥状态更新失败:', error)
    ElMessage.error(t('thirdSms.keyStatusUpdateFailed'))
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
      ElMessage.success(t('thirdSms.keyUpdateSuccess'))

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
      ElMessage.success(t('thirdSms.keyAddSuccess'))
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
      ElMessage.error(t('thirdSms.keyOperationFailed'))
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
    ElMessage.error(t('thirdSms.loadProvidersFailed'))
  } finally {
    loading.value = false
  }
}

// 初始化
onMounted(() => {
  loadProviders()
})
</script>
