<template>
  <div class="pay-config-management">
    <div class="page-header">
      <h1 class="page-title">支付配置管理</h1>
      <p class="page-description">管理系统支付套餐配置</p>
    </div>

    <!-- 操作区域 -->
    <div class="action-section">
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>
        新建配置
      </el-button>
      <el-button
        type="danger"
        @click="handleBatchDelete"
        :disabled="selectedConfigs.length === 0"
      >
        <el-icon><Delete /></el-icon>
        批量删除
      </el-button>
    </div>

    <!-- 搜索区域 -->
    <div class="search-section">
      <el-form :model="searchForm" :inline="true">
        <el-form-item label="配置名称">
          <el-input
            v-model="searchForm.configName"
            placeholder="请输入配置名称"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.status"
            placeholder="请选择状态"
            clearable
            style="width: 120px"
          >
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="inactive" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch" :loading="loading">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
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
        <el-table-column prop="configName" label="配置名称" min-width="150" />
        <el-table-column prop="payCode" label="支付策略编码" min-width="150" />
        <el-table-column label="金额" width="120">
          <template #default="{ row }">
            <span class="price-text">¥{{ row.amountYuan }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="'active'"
              :inactive-value="'inactive'"
              :before-change="() => handleBeforeStatusChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="createBy" label="创建者" width="120" />
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <el-button
                type="primary"
                size="small"
                :icon="Edit"
                @click="handleEdit(row)"
              >
                编辑
              </el-button>
              <el-button
                type="success"
                size="small"
                :icon="QrCode"
                @click="handleShowQrCode(row)"
              >
                去支付
              </el-button>
              <el-button
                type="danger"
                size="small"
                :icon="Delete"
                @click="handleDelete(row)"
              >
                删除
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
        <el-form-item label="配置名称" prop="configName">
          <el-input v-model="configForm.configName" placeholder="请输入配置名称" />
        </el-form-item>
        <el-form-item label="支付策略编码" prop="payCode">
          <el-input v-model="configForm.payCode" placeholder="请输入支付策略编码" />
        </el-form-item>
        <el-form-item label="金额(元)" prop="amountYuan">
          <el-input
            v-model="configForm.amountYuan"
            placeholder="请输入金额"
            @input="handleAmountChange"
          >
            <template #prepend>¥</template>
          </el-input>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="configForm.description"
            type="textarea"
            :rows="4"
            placeholder="请输入配置描述"
          />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number
            v-model="configForm.sort"
            :min="0"
            :max="9999"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select
            v-model="configForm.status"
            placeholder="请选择状态"
            style="width: 100%"
          >
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="inactive" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            确定
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
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
import type { PaymentConfigVO, PaymentConfigQueryParams } from '@/api/pay'
import {
  getPaymentConfigs,
  createPaymentConfig,
  updatePaymentConfig,
  deletePaymentConfig,
  deletePaymentConfigs,
  createPayQrCode
} from '@/api'

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
    { required: true, message: '请输入配置名称', trigger: 'blur' },
    { min: 2, max: 50, message: '配置名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  payCode: [
    { required: true, message: '请输入支付策略编码', trigger: 'blur' },
    { min: 2, max: 50, message: '支付策略编码长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  amountYuan: [
    { required: true, message: '请输入金额', trigger: 'blur' },
    {
      pattern: /^\d+(\.\d{1,2})?$/,
      message: '请输入正确的金额格式',
      trigger: 'blur'
    }
  ],
  description: [
    { required: true, message: '请输入描述', trigger: 'blur' }
  ],
  sort: [
    { required: true, message: '请输入排序', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
}

const tableData = ref<PaymentConfigVO[]>([])

// 计算属性
const dialogTitle = computed(() => isEdit.value ? '编辑配置' : '新建配置')

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

    const result = await getPaymentConfigs(params)
    
    // 根据状态筛选（前端过滤）
    let filteredConfigs = result.records
    if (searchForm.status) {
      filteredConfigs = filteredConfigs.filter(c => c.status === searchForm.status)
    }
    
    tableData.value = filteredConfigs
    pagination.total = result.total
    pagination.pages = result.pages
    pagination.current = result.current
    pagination.size = result.size
  } catch (error) {
    console.error('加载配置数据失败:', error)
    ElMessage.error('加载配置数据失败')
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
      `确定要删除配置 "${row.configName}" 吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await deletePaymentConfig(row.id)
    ElMessage.success('配置删除成功')
    await loadConfigs()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除配置失败:', error)
      ElMessage.error('删除配置失败')
    }
  }
}

// 批量删除配置
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedConfigs.value.length} 个配置吗？`,
      '批量删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const configIds = selectedConfigs.value.map(config => config.id)
    await deletePaymentConfigs(configIds)
    ElMessage.success(`成功删除 ${selectedConfigs.value.length} 个配置`)
    selectedConfigs.value = []
    await loadConfigs()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除配置失败:', error)
      ElMessage.error('批量删除配置失败')
    }
  }
}

// 状态变更前的确认
const handleBeforeStatusChange = async (row: PaymentConfigVO): Promise<boolean> => {
  const newStatus = row.status === 'active' ? 'inactive' : 'active'
  const statusText = newStatus === 'active' ? '启用' : '禁用'
  
  try {
    await ElMessageBox.confirm(
      `确定要${statusText}配置 "${row.configName}" 吗？`,
      '状态变更确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 用户确认后调用编辑接口更新状态
    await updatePaymentConfig(row.id, {
      configName: row.configName,
      payCode: row.payCode,
      amount: row.amount,
      description: row.description,
      sort: row.sort,
      status: newStatus
    })
    ElMessage.success(`配置状态已${statusText}`)
    return true
  } catch (error) {
    if (error !== 'cancel') {
      console.error('状态更新失败:', error)
      ElMessage.error('状态更新失败')
    }
    return false
  }
}

// 打开支付链接
const handleShowQrCode = async (row: PaymentConfigVO) => {
  const loadingMessage = ElMessage({
    message: '正在生成支付链接...',
    type: 'info',
    duration: 0
  })
  
  try {
    // 调用接口获取支付链接
    const url = await createPayQrCode(row.id)
    
    loadingMessage.close()
    
    // 直接在新窗口打开支付链接
    window.open(url, '_blank')
    
    ElMessage.success('支付页面已打开，请在新窗口中完成支付')
  } catch (error) {
    loadingMessage.close()
    console.error('获取支付链接失败:', error)
    ElMessage.error('获取支付链接失败')
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
      ElMessage.success('配置更新成功')
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
      ElMessage.success('配置创建成功')
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
.pay-config-management {
  padding: 0;
}

.page-header {
  margin-bottom: 24px;

  h1 {
    font-size: 24px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 8px 0;
  }

  p {
    color: var(--text-secondary);
    margin: 0;
  }
}

.action-section {
  margin-bottom: 16px;

  .el-button + .el-button {
    margin-left: 12px;
  }
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

  .action-section {
    justify-content: center;
  }
}
</style>
