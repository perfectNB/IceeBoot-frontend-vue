<template>
  <div class="pay-config-management admin-page">
    <AdminPageHeader :title="t('payConfig.title')" :description="t('payConfig.description')">
      <el-button v-if="hasPermission('pay:config:create:api')" type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>
        {{ t('payConfig.create') }}
      </el-button>
      <el-button v-if="hasPermission('pay:config:delete:api')"
        type="danger"
        @click="handleBatchDelete"
        :disabled="selectedConfigs.length === 0"
      >
        <el-icon><Delete /></el-icon>
        {{ t('payConfig.batchDelete') }}
      </el-button>
    </AdminPageHeader>

    <!-- 搜索区域 -->
    <div class="search-section">
      <el-form :model="searchForm" :inline="true">
        <el-form-item :label="t('payConfig.search.configName')">
          <el-input
            v-model="searchForm.configName"
            :placeholder="t('payConfig.search.configNamePlaceholder')"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item :label="t('payConfig.search.status')">
          <el-select
            v-model="searchForm.status"
            :placeholder="t('payConfig.search.statusPlaceholder')"
            clearable
            style="width: 120px"
          >
            <el-option :label="t('payConfig.status.enable')" value="active" />
            <el-option :label="t('payConfig.status.disable')" value="inactive" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch" :loading="loading">
            <el-icon><Search /></el-icon>
            {{ t('payConfig.search.search') }}
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            {{ t('payConfig.search.reset') }}
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
        <el-table-column prop="id" :label="t('payConfig.table.id')" width="80" />
        <el-table-column prop="configName" :label="t('payConfig.table.configName')" min-width="150" />
        <el-table-column prop="payCode" :label="t('payConfig.table.payCode')" min-width="150" />
        <el-table-column :label="t('payConfig.table.amount')" width="120">
          <template #default="{ row }">
            <span class="price-text">¥{{ row.amountYuan }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" :label="t('payConfig.table.description')" min-width="200" show-overflow-tooltip />
        <el-table-column :label="t('payConfig.table.status')" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :disabled="!hasPermission('pay:config:status:api')"
              :active-value="'active'"
              :inactive-value="'inactive'"
              :before-change="() => handleBeforeStatusChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="createBy" :label="t('payConfig.table.createBy')" width="120" />
        <el-table-column prop="createTime" :label="t('payConfig.table.createTime')" width="160" />
        <el-table-column :label="t('payConfig.table.operation')" width="280" fixed="right">
          <template #default="{ row }">
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <el-button v-if="hasPermission('pay:config:update:api')"
                type="primary"
                size="small"
                :icon="Edit"
                @click="handleEdit(row)"
              >
                {{ t('payConfig.edit') }}
              </el-button>
              <el-button
                type="success"
                size="small"
                :icon="QrCode"
                :disabled="row.status === 'inactive'"
                @click="handleShowQrCode(row)"
              >
                {{ t('payConfig.goPay') }}
              </el-button>
              <el-button v-if="hasPermission('pay:config:delete:api')"
                type="danger"
                size="small"
                :icon="Delete"
                @click="handleDelete(row)"
              >
                {{ t('payConfig.delete') }}
              </el-button>
            </div>
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

    <el-dialog v-model="checkoutVisible" title="扫码支付" width="min(430px, 95vw)" @closed="qrValue = ''">
      <p v-if="checkoutConfig">{{ checkoutConfig.configName }} · ¥{{ (checkoutConfig.amount / 100).toFixed(2) }}</p>
      <p v-if="!channels.length">暂未配置可用的收款渠道</p>
      <el-radio-group v-else v-model="channel" :disabled="creating" @change="qrValue = ''">
        <el-radio-button v-for="item in channels" :key="item" :value="item">{{ channelNames[item] }}</el-radio-button>
      </el-radio-group>
      <div v-if="qrValue" class="payment-qr"><QrcodeVue :value="qrValue" :size="196" :margin="3" />
        <p>{{ qrValue.startsWith('iceeboot-demo:') ? '演示二维码，无需付款' : '请使用对应支付应用扫码' }}</p>
        <a v-if="channel === 'YUNGOUOS' && qrValue.startsWith('https://')" :href="qrValue" target="_blank" rel="noopener">打开收银台</a>
      </div>
      <template #footer><el-button type="primary" :disabled="!channels.length || !!qrValue" :loading="creating" @click="createQr">生成付款码</el-button></template>
    </el-dialog>

    <!-- 配置表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="configForm"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item :label="t('payConfig.form.configName')" prop="configName">
          <el-input v-model="configForm.configName" :placeholder="t('payConfig.form.configNamePlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('payConfig.form.payCode')" prop="payCode">
          <el-select v-model="configForm.payCode" aria-label="权益策略">
            <el-option label="精油会员" value="ESSENTIAL_OIL_MEMBER" />
            <el-option label="MMK 会员" value="MMK_MEMBER" />
            <el-option label="98 会员" value="NINETY_EIGHT_MEMBER" />
            <el-option label="搓背会员" value="SCRUB_MEMBER" />
            <el-option label="SPA 会员" value="SPA_MEMBER" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('payConfig.form.amount')" prop="amountYuan">
          <el-input
            v-model="configForm.amountYuan"
            :placeholder="t('payConfig.form.amountPlaceholder')"
            @input="handleAmountChange"
          >
            <template #prepend>¥</template>
          </el-input>
        </el-form-item>
        <el-form-item :label="t('payConfig.form.description')" prop="description">
          <el-input
            v-model="configForm.description"
            type="textarea"
            :rows="4"
            :placeholder="t('payConfig.form.descriptionPlaceholder')"
          />
        </el-form-item>
        <el-form-item :label="t('payConfig.form.sort')" prop="sort">
          <el-input-number
            v-model="configForm.sort"
            :min="0"
            :max="9999"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item :label="t('payConfig.form.status')" prop="status">
          <el-select
            v-model="configForm.status"
            :placeholder="t('payConfig.form.statusPlaceholder')"
            style="width: 100%"
          >
            <el-option :label="t('payConfig.status.enable')" value="active" />
            <el-option :label="t('payConfig.status.disable')" value="inactive" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">{{ t('payConfig.cancel') }}</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            {{ t('payConfig.confirm') }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import AdminPageHeader from '@/components/common/AdminPageHeader.vue'
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import {
  Search,
  Refresh,
  Plus,
  Edit,
  Delete,
  Link as QrCode
} from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { hasPermission } from '@/utils/permission'
import QrcodeVue from 'qrcode.vue'
import { createPaymentOrder, paymentChannels, updatePaymentConfigStatus, type PaymentChannel } from '@/api/pay'
import type { PaymentConfigVO, PaymentConfigQueryParams } from '@/api/pay'
import {
  getPaymentConfigs,
  createPaymentConfig,
  updatePaymentConfig,
  deletePaymentConfig,
  deletePaymentConfigs
} from '@/api'

const { t } = useI18n()

interface SearchForm {
  configName: string
  status: string
}

interface ConfigForm {
  id?: number
  configName: string
  payCode: string
  amount: number
  amountYuan: string
  description: string
  status: 'active' | 'inactive'
  sort: number
}

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const selectedConfigs = ref<PaymentConfigVO[]>([])
const formRef = ref<FormInstance>()

// 搜索表单
const searchForm = reactive<SearchForm>({
  configName: '',
  status: ''
})

// 分页
const pagination = reactive({
  current: 1,
  size: 20,
  total: 0,
  pages: 0
})

// 配置表单
const configForm = reactive<ConfigForm>({
  configName: '',
  payCode: '',
  amount: 0,
  amountYuan: '0.00',
  description: '',
  status: 'active',
  sort: 0
})

// 表单验证规则
const formRules = {
  configName: [
    { required: true, message: () => t('payConfig.form.configNameRequired'), trigger: 'blur' },
    { min: 2, max: 50, message: () => t('payConfig.form.configNameLength'), trigger: 'blur' }
  ],
  payCode: [
    { required: true, message: () => t('payConfig.form.payCodeRequired'), trigger: 'blur' },
    { min: 2, max: 50, message: () => t('payConfig.form.payCodeLength'), trigger: 'blur' }
  ],
  amountYuan: [
    { required: true, message: () => t('payConfig.form.amountRequired'), trigger: 'blur' },
    {
      pattern: /^\d+(\.\d{1,2})?$/,
      message: () => t('payConfig.form.amountFormat'),
      trigger: 'blur'
    }
  ],
  description: [
    { required: true, message: () => t('payConfig.form.descriptionRequired'), trigger: 'blur' }
  ],
  sort: [
    { required: true, message: () => t('payConfig.form.sortRequired'), trigger: 'blur' }
  ],
  status: [
    { required: true, message: () => t('payConfig.form.statusRequired'), trigger: 'change' }
  ]
}

const tableData = ref<PaymentConfigVO[]>([])

// 计算属性
const dialogTitle = computed(() => isEdit.value ? t('payConfig.editTitle') : t('payConfig.createTitle'))

// 金额输入变化处理
const handleAmountChange = (value: string) => {
  // 将元转换为分
  const yuan = parseFloat(value) || 0
  configForm.amount = Math.round(yuan * 100)
}

// 加载配置数据
const loadConfigs = async () => {
  loading.value = true
  try {
    const params: PaymentConfigQueryParams = {
      pageNum: pagination.current,
      pageSize: pagination.size
    }

    // 只有非空字符串时才添加参数
    if (searchForm.configName) {
      params.configName = searchForm.configName
      params.keyword = searchForm.configName
    }

    if (searchForm.status) params.status = searchForm.status
    const result = await getPaymentConfigs(params)
    tableData.value = result.records
    pagination.total = result.total
    pagination.pages = result.pages
    pagination.current = result.current
    pagination.size = result.size
  } catch (error) {
    console.error('加载配置数据失败:', error)
    ElMessage.error(t('payConfig.loadFailed'))
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.current = 1
  loadConfigs()
}

// 重置搜索
const handleReset = () => {
  Object.assign(searchForm, {
    configName: '',
    status: ''
  })
  handleSearch()
}

// 新建配置
const handleCreate = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

// 编辑配置
const handleEdit = (row: PaymentConfigVO) => {
  isEdit.value = true
  Object.assign(configForm, {
    id: row.id,
    configName: row.configName,
    payCode: row.payCode,
    amount: row.amount,
    amountYuan: row.amountYuan,
    description: row.description,
    status: row.status,
    sort: row.sort
  })
  dialogVisible.value = true
}

// 删除配置
const handleDelete = async (row: PaymentConfigVO) => {
  try {
    await ElMessageBox.confirm(
      t('payConfig.deleteConfirm', { name: row.configName }),
      t('payConfig.deleteTitle'),
      {
        confirmButtonText: t('payConfig.confirm'),
        cancelButtonText: t('payConfig.cancel'),
        type: 'warning'
      }
    )

    await deletePaymentConfig(row.id)
    ElMessage.success(t('payConfig.deleteSuccess'))
    await loadConfigs()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除配置失败:', error)
      ElMessage.error(t('payConfig.deleteFailed'))
    }
  }
}

// 批量删除配置
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      t('payConfig.batchDeleteConfirm', { count: selectedConfigs.value.length }),
      t('payConfig.batchDeleteTitle'),
      {
        confirmButtonText: t('payConfig.confirm'),
        cancelButtonText: t('payConfig.cancel'),
        type: 'warning'
      }
    )

    const configIds = selectedConfigs.value.map(config => config.id)
    await deletePaymentConfigs(configIds)
    ElMessage.success(t('payConfig.batchDeleteSuccess', { count: selectedConfigs.value.length }))
    selectedConfigs.value = []
    await loadConfigs()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除配置失败:', error)
      ElMessage.error(t('payConfig.batchDeleteFailed'))
    }
  }
}

// 状态变更前的确认
const handleBeforeStatusChange = async (row: PaymentConfigVO): Promise<boolean> => {
  const newStatus = row.status === 'active' ? 'inactive' : 'active'
  const statusText = newStatus === 'active' ? t('payConfig.enable') : t('payConfig.disable')

  try {
    await ElMessageBox.confirm(
      t('payConfig.statusChangeConfirm', { status: statusText, name: row.configName }),
      t('payConfig.statusChangeTitle'),
      {
        confirmButtonText: t('payConfig.confirm'),
        cancelButtonText: t('payConfig.cancel'),
        type: 'warning'
      }
    )

    await updatePaymentConfigStatus(row.id, newStatus)
    ElMessage.success(t('payConfig.statusUpdated', { status: statusText }))
    return true
  } catch (error) {
    if (error !== 'cancel') {
      console.error('状态更新失败:', error)
      ElMessage.error(t('payConfig.statusUpdateFailed'))
    }
    return false
  }
}

const checkoutVisible = ref(false)
const checkoutConfig = ref<PaymentConfigVO>()
const channels = ref<PaymentChannel[]>([])
const channelNames = { YUNGOUOS: 'YunGouOS 微信', WECHAT_NATIVE: '微信官方', ALIPAY: '支付宝官方' }
const channel = ref<PaymentChannel>('YUNGOUOS')
const qrValue = ref('')
const creating = ref(false)

async function handleShowQrCode(row: PaymentConfigVO) {
  checkoutConfig.value = row
  qrValue.value = ''
  try {
    channels.value = await paymentChannels()
    if (channels.value[0]) channel.value = channels.value[0]
    checkoutVisible.value = true
  } catch {
    ElMessage.error('读取支付渠道失败')
  }
}

async function createQr() {
  if (!checkoutConfig.value || creating.value) return
  const config = checkoutConfig.value
  creating.value = true
  try {
    const result = await createPaymentOrder(config.id, channel.value)
    if (checkoutConfig.value === config && checkoutVisible.value) qrValue.value = result
  } catch {
    ElMessage.error(t('payConfig.getPayLinkFailed'))
  } finally {
    creating.value = false
  }
}

// 选择变更
const handleSelectionChange = (selection: PaymentConfigVO[]) => {
  selectedConfigs.value = selection
}

// 分页大小变更
const handleSizeChange = (size: number) => {
  pagination.size = size
  pagination.current = 1
  loadConfigs()
}

// 当前页变更
const handleCurrentChange = (page: number) => {
  pagination.current = page
  loadConfigs()
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    submitting.value = true

    if (isEdit.value) {
      // 更新配置
      await updatePaymentConfig(configForm.id!, {
        configName: configForm.configName,
        payCode: configForm.payCode,
        amount: configForm.amount,
        description: configForm.description,
        status: configForm.status,
        sort: configForm.sort
      })
      ElMessage.success(t('payConfig.updateSuccess'))
    } else {
      // 创建配置
      await createPaymentConfig({
        configName: configForm.configName,
        payCode: configForm.payCode,
        amount: configForm.amount,
        description: configForm.description,
        status: configForm.status,
        sort: configForm.sort
      })
      ElMessage.success(t('payConfig.createSuccess'))
    }

    // 重新加载配置列表
    await loadConfigs()

    // 自动关闭弹窗
    dialogVisible.value = false
  } catch {
    // 表单验证失败
  } finally {
    submitting.value = false
  }
}

// 对话框关闭
const handleDialogClose = () => {
  resetForm()
}

// 重置表单
const resetForm = () => {
  Object.assign(configForm, {
    id: undefined,
    configName: '',
    payCode: '',
    amount: 0,
    amountYuan: '0.00',
    description: '',
    status: 'active',
    sort: 0
  })
  formRef.value?.clearValidate()
}

// 组件挂载
onMounted(() => {
  loadConfigs()
})
</script>

<style scoped lang="scss">
.payment-qr { margin-top: 20px; text-align: center; }
.pay-config-management {
  padding: 0;
}

.search-section {
  margin-bottom: 16px;
  padding: 20px;
  background: var(--bg-color);
  border: 1px solid var(--border-lighter);
  border-radius: 8px;
}

.table-section {
  background: var(--bg-color);
  border: 1px solid var(--border-lighter);
  border-radius: 8px;
  overflow: hidden;

  :deep(.el-table) {
    .el-table__cell {
      padding: 12px 0;
    }
  }
}

.pagination-section {
  padding: 20px;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid var(--border-lighter);
}

.price-text {
  color: #f56c6c;
  font-weight: 600;
  font-size: 14px;
}

.dialog-footer {
  text-align: right;
}

// 响应式设计
@media (max-width: 768px) {
  .search-section {
    flex-wrap: wrap;
  }

}
</style>
