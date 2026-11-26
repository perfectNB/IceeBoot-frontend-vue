<template>
  <main class="third-workbench provider-workbench admin-page">
    <AdminPageHeader :title="t('thirdOss.title')" :description="t('thirdOss.description')">
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
            <span>{{ t('thirdOss.keyCount') }}</span>
            <strong>{{ provider.keys?.length || 0 }}</strong>
          </div>
          <el-button v-if="hasPermission('third:oss:view')"
                     type="primary"
                     plain
                     :icon="Key"
                     @click="handleManageKeys(provider)"
          >{{ t('thirdOss.manageKeys') }}</el-button>
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
      :title="t('thirdOss.keyManagementTitle')"
      width="min(1120px,96vw)"
      class="third-key-dialog"
      :close-on-click-modal="false"
    >
      <div class="key-management">
        <div class="key-header">
          <h3>{{ currentProvider?.displayName }} - {{ t('thirdOss.keyManagementSubtitle') }}</h3>
          <el-button type="primary"
                     size="small"
                     @click="handleAddKey"
                     v-if="hasPermission('third:oss:create')"
          >
            <el-icon>
              <Plus />
            </el-icon>
            {{ t('thirdOss.addKey') }}
          </el-button>
        </div>
        <el-table :data="currentProvider?.keys || []" stripe>
          <el-table-column prop="id" :label="t('thirdOss.id')" width="80" />
          <el-table-column :label="t('thirdOss.accessKeyId')" min-width="200">
            <template #default="{ row }">
              <span class="key-display">
                {{ maskKey(row.accessKeyId) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column :label="t('thirdOss.accessKeySecret')" min-width="200">
            <template #default="{ row }">
              <span class="key-display">
                {{ maskKey(row.accessKeySecret) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="customDomain" :label="t('thirdOss.customDomain')" min-width="150" />
          <el-table-column prop="endpoint" :label="t('thirdOss.endpoint')" min-width="200" />
          <el-table-column prop="region" :label="t('thirdOss.region')" width="120" />
          <el-table-column prop="remark" :label="t('thirdOss.remark')" min-width="150" />
          <el-table-column :label="t('thirdOss.status')" width="100">
            <template #default="{ row }">
              <el-switch
                v-model="row.status"
                :disabled="!hasPermission('third:oss:edit')"
                :active-value="'active'"
                :inactive-value="'inactive'"
                @change="handleKeyStatusChange(row)"
              />
            </template>
          </el-table-column>
          <el-table-column prop="createTime" :label="t('thirdOss.createTime')" width="160" />
          <el-table-column :label="t('thirdOss.operation')" width="180" fixed="right">
            <template #default="{ row }">
              <el-button
                type="primary"
                size="small"
                text
                @click="handleEditKey(row)"
                v-if="hasPermission('third:oss:edit')"
              >
                <el-icon>
                  <Edit />
                </el-icon>
                {{ t('thirdOss.edit') }}
              </el-button>
              <el-button
                type="danger"
                size="small"
                text
                @click="handleDeleteKey(row)"
                v-if="hasPermission('third:oss:delete')"
              >
                <el-icon>
                  <Delete />
                </el-icon>
                {{ t('thirdOss.delete') }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="keyDialogVisible = false">{{ t('thirdOss.close') }}</el-button>
        </div>
      </template>
    </el-dialog>
    <!-- 添加密钥对话框 -->
    <el-dialog
      v-model="addKeyDialogVisible"
      :title="t('thirdOss.addKeyTitle')"
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
        <el-form-item :label="t('thirdOss.remark')" prop="remark">
          <el-input
            v-model="keyForm.remark"
            :placeholder="t('thirdOss.placeholderKeyRemark')"
          />
        </el-form-item>
        <el-form-item :label="t('thirdOss.accessKeyId')" prop="accessKeyId">
          <el-input
            v-model="keyForm.accessKeyId"
            :placeholder="t('thirdOss.placeholderAccessKeyId')"
          />
        </el-form-item>
        <el-form-item :label="t('thirdOss.accessKeySecret')" prop="accessKeySecret">
          <el-input
            v-model="keyForm.accessKeySecret"
            type="password"
            show-password
            :placeholder="t('thirdOss.placeholderAccessKeySecret')"
          />
        </el-form-item>
        <el-form-item :label="t('thirdOss.customDomain')" prop="customDomain">
          <el-input
            v-model="keyForm.customDomain"
            :placeholder="t('thirdOss.placeholderCustomDomain')"
          />
        </el-form-item>
        <el-form-item :label="t('thirdOss.endpoint')" prop="endpoint">
          <el-input
            v-model="keyForm.endpoint"
            :placeholder="t('thirdOss.placeholderEndpoint')"
          />
        </el-form-item>
        <el-form-item :label="t('thirdOss.region')" prop="region">
          <el-input
            v-model="keyForm.region"
            :placeholder="t('thirdOss.placeholderRegion')"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="addKeyDialogVisible = false">{{ t('thirdOss.cancel') }}</el-button>
          <el-button type="primary" @click="handleSubmitKey" :loading="submitting">
            {{ keyForm.id ? t('thirdOss.update') : t('thirdOss.add') }}
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
import {
  Plus,
  Edit,
  Delete,
  Key
} from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'

// 导入API接口
import {
  getOSSProviders,
  addOSSKey,
  updateOSSKey,
  deleteOSSKey,
  updateOSSKeyStatus
} from '@/api/oss'
import { hasPermission } from '@/utils/permission'
import type { OSSProvider, OSSKey } from '@/api/oss'

const { t } = useI18n()

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const keyDialogVisible = ref(false)
const addKeyDialogVisible = ref(false)
const keyFormRef = ref<FormInstance>()
const currentProvider = ref<OSSProvider | null>(null)

// OSS服务商列表
const providerList = ref<OSSProvider[]>([])
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
  endpoint: string
  region: string
  customDomain: string
}>({
  remark: '',
  accessKeyId: '',
  accessKeySecret: '',
  endpoint: '',
  region: '',
  customDomain: ''
})

// 表单验证规则
const keyFormRules = {
  accessKeyId: [{ required: true, message: () => t('thirdOss.validationAccessKeyId'), trigger: 'blur' }],
  accessKeySecret: [{ required: true, message: () => t('thirdOss.validationAccessKeySecret'), trigger: 'blur' }]
}

// 获取服务商首字母
const getProviderInitials = (name: string) => name.trim().slice(0, 2).toUpperCase()

// 获取服务商颜色
const getProviderColor = (name: string) => {
  const colors = {
    '阿里云OSS': '#FF6A00',
    '华为云OBS': '#FF6B35',
    '腾讯云COS': '#006EFF',
    'MinIO': '#C72E29',
    '七牛云': '#00D4AA',
    '亚马逊S3': '#FF9900',
    '谷歌云存储': '#4285F4',
    '微软Azure': '#0078D4'
  }
  return colors[name as keyof typeof colors] || '#6B7280'
}

// 掩码显示密钥
const maskKey = (key: string) => key ? '••••••••' : '—'

// 状态变更
// const handleStatusChange = async (provider: OSSProvider) => {
//   try {
//     // TODO: 调用API更新服务商状态
//     // await updateOSSProviderStatus(provider.providerName, provider.status)
//     ElMessage.success('状态更新成功')
//   } catch (error) {
//     console.error('状态更新失败:', error)
//     ElMessage.error('状态更新失败')
//     // 恢复原状态
//     provider.status = provider.status === 'active' ? 'inactive' : 'active'
//   }
// }

// 管理密钥
const handleManageKeys = (provider: OSSProvider) => {
  currentProvider.value = provider
  keyDialogVisible.value = true
}

// 添加密钥
const handleAddKey = () => {
  resetKeyForm()
  addKeyDialogVisible.value = true
}

// 删除密钥
const handleDeleteKey = async (key: OSSKey) => {
  try {
    await ElMessageBox.confirm(
      t('thirdOss.deleteConfirm'),
      t('thirdOss.deleteTitle'),
      {
        confirmButtonText: t('thirdOss.confirm'),
        cancelButtonText: t('thirdOss.cancel'),
        type: 'warning'
      }
    )

    await deleteOSSKey(key.id)
    ElMessage.success(t('thirdOss.keyDeleteSuccess'))

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
      ElMessage.error(t('thirdOss.keyDeleteFailed'))
    }
  }
}

// 密钥状态变更
const handleKeyStatusChange = async (key: OSSKey) => {
  try {
    await updateOSSKeyStatus(currentProvider.value!.providerName, key.id, key.status)
    ElMessage.success(t('thirdOss.keyStatusUpdateSuccess'))
  } catch (error) {
    console.error('密钥状态更新失败:', error)
    ElMessage.error(t('thirdOss.keyStatusUpdateFailed'))
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
        ossProvider: currentProvider.value!.providerName,
        id: keyForm.id,
        remark: keyForm.remark,
        accessKeyId: keyForm.accessKeyId,
        accessKeySecret: keyForm.accessKeySecret,
        endpoint: keyForm.endpoint,
        region: keyForm.region,
        customDomain: keyForm.customDomain
      }
      await updateOSSKey(keyForm.id, keyData)
      ElMessage.success(t('thirdOss.keyUpdateSuccess'))

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
        ossProvider: currentProvider.value!.providerName,
        ...keyForm,
        status: 'active' as const
      }
      await addOSSKey(keyData)
      ElMessage.success(t('thirdOss.keyAddSuccess'))
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
      ElMessage.error(t('thirdOss.keyOperationFailed'))
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
    endpoint: '',
    region: '',
    customDomain: ''
  })
  keyFormRef.value?.clearValidate()
}

// 编辑密钥
const handleEditKey = (key: OSSKey) => {
  resetKeyForm()

  Object.assign(keyForm, {
    id: key.id,
    remark: key.remark || '',
    accessKeyId: key.accessKeyId || '',
    accessKeySecret: key.accessKeySecret || '',
    endpoint: key.endpoint || '',
    region: key.region || '',
    customDomain: key.customDomain || ''
  })

  addKeyDialogVisible.value = true
}

// 加载服务商数据
const loadProviders = async () => {
  loading.value = true
  try {
    const providers = await getOSSProviders()
    providerList.value = providers
  } catch (error) {
    console.error('加载服务商数据失败:', error)
    ElMessage.error(t('thirdOss.loadProvidersFailed'))
  } finally {
    loading.value = false
  }
}

// 初始化
onMounted(() => {
  loadProviders()
})
</script>
