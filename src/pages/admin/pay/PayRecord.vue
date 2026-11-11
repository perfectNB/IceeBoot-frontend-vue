<template>
  <div class="pay-record-management">
    <div class="page-header">
      <h1 class="page-title">{{ t('payRecord.title') }}</h1>
      <p class="page-description">{{ t('payRecord.description') }}</p>
    </div>

    <!-- 操作区域 -->
    <div class="action-section">
      <el-button
        type="danger"
        @click="handleBatchDelete"
        :disabled="selectedRecords.length === 0"
      >
        <el-icon><Delete /></el-icon>
        {{ t('payRecord.batchDelete') }}
      </el-button>
      <el-button @click="handleExport">
        <el-icon><Download /></el-icon>
        {{ t('payRecord.export') }}
      </el-button>
    </div>

    <!-- 搜索区域 -->
    <div class="search-section">
      <el-form :model="searchForm" :inline="true">
        <el-form-item :label="t('payRecord.search.orderNo')">
          <el-input
            v-model="searchForm.outTradeNo"
            :placeholder="t('payRecord.search.orderNoPlaceholder')"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item :label="t('payRecord.search.username')">
          <el-input
            v-model="searchForm.keyword"
            :placeholder="t('payRecord.search.usernamePlaceholder')"
            clearable
            style="width: 150px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item :label="t('payRecord.search.payType')">
          <el-select
            v-model="searchForm.payType"
            :placeholder="t('payRecord.search.payTypePlaceholder')"
            clearable
            style="width: 130px"
          >
            <el-option :label="t('payRecord.payType.wechat')" :value="1" />
            <el-option :label="t('payRecord.payType.alipay')" :value="2" />
            <el-option :label="t('payRecord.payType.bank')" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('payRecord.search.payStatus')">
          <el-select
            v-model="searchForm.payStatus"
            :placeholder="t('payRecord.search.payStatusPlaceholder')"
            clearable
            style="width: 130px"
          >
            <el-option :label="t('payRecord.payStatus.paying')" :value="1" />
            <el-option :label="t('payRecord.payStatus.success')" :value="2" />
            <el-option :label="t('payRecord.payStatus.failed')" :value="3" />
            <el-option :label="t('payRecord.payStatus.refunded')" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('payRecord.search.dateRange')">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            :range-separator="t('payRecord.search.rangeSeparator')"
            :start-placeholder="t('payRecord.search.startDate')"
            :end-placeholder="t('payRecord.search.endDate')"
            value-format="YYYY-MM-DD"
            style="width: 240px"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch" :loading="loading">
            <el-icon><Search /></el-icon>
            {{ t('payRecord.search.search') }}
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            {{ t('payRecord.search.reset') }}
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
        <el-table-column prop="id" :label="t('payRecord.table.id')" width="80" />
        <el-table-column prop="outTradeNo" :label="t('payRecord.table.outTradeNo')" min-width="180" />
        <el-table-column prop="tradeNo" :label="t('payRecord.table.tradeNo')" min-width="200" show-overflow-tooltip />
        <el-table-column prop="orderName" :label="t('payRecord.table.orderName')" min-width="150" />
        <el-table-column :label="t('payRecord.table.payType')" width="110">
          <template #default="{ row }">
            <el-tag :type="getPayTypeTag(row.payType)">
              {{ row.payTypeName }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('payRecord.table.payAmount')" width="120">
          <template #default="{ row }">
            <span class="price-text">¥{{ row.payAmountYuan }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('payRecord.table.payStatus')" width="110">
          <template #default="{ row }">
            <el-tag :type="getPayStatusTag(row.payStatus)">
              {{ row.payStatusName }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="username" :label="t('payRecord.table.username')" width="120" />
        <el-table-column prop="configName" :label="t('payRecord.table.configName')" min-width="120" />
        <el-table-column prop="remark" :label="t('payRecord.table.remark')" min-width="120" show-overflow-tooltip />
        <el-table-column prop="createTime" :label="t('payRecord.table.createTime')" width="160" />
        <el-table-column :label="t('payRecord.table.operation')" width="180" fixed="right">
          <template #default="{ row }">
            <div style="display: flex; gap: 8px;">
              <el-button
                type="primary"
                size="small"
                :icon="View"
                @click="handleView(row)"
              >
                {{ t('payRecord.detailButton') }}
              </el-button>
              <el-button
                type="danger"
                size="small"
                :icon="Delete"
                @click="handleDelete(row)"
              >
                {{ t('payRecord.delete') }}
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

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="t('payRecord.detailTitle')"
      width="600px"
    >
      <el-descriptions :column="2" border v-if="currentRecord">
        <el-descriptions-item :label="t('payRecord.detail.id')">
          {{ currentRecord.id }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('payRecord.detail.outTradeNo')">
          {{ currentRecord.outTradeNo }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('payRecord.detail.tradeNo')" :span="2">
          {{ currentRecord.tradeNo || t('payRecord.detail.none') }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('payRecord.detail.orderName')" :span="2">
          {{ currentRecord.orderName }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('payRecord.detail.payType')">
          <el-tag :type="getPayTypeTag(currentRecord.payType)">
            {{ currentRecord.payTypeName }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="t('payRecord.detail.payStatus')">
          <el-tag :type="getPayStatusTag(currentRecord.payStatus)">
            {{ currentRecord.payStatusName }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="t('payRecord.detail.payAmount')">
          <span class="price-text">¥{{ currentRecord.payAmountYuan }}</span>
        </el-descriptions-item>
        <el-descriptions-item :label="t('payRecord.detail.configName')">
          {{ currentRecord.configName }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('payRecord.detail.userId')">
          {{ currentRecord.userId }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('payRecord.detail.username')">
          {{ currentRecord.username }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('payRecord.detail.createTime')" :span="2">
          {{ currentRecord.createTime }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('payRecord.detail.updateTime')" :span="2">
          {{ currentRecord.updateTime }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('payRecord.detail.remark')" :span="2">
          {{ currentRecord.remark || t('payRecord.detail.noRemark') }}
        </el-descriptions-item>
      </el-descriptions>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="detailDialogVisible = false">{{ t('payRecord.close') }}</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  Refresh,
  Download,
  Delete,
  View
} from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import type { PayRecordVO, PayRecordQueryParams } from '@/api/pay'
import {
  getPayRecords,
  getPayRecordDetail,
  deletePayRecord,
  deletePayRecords
} from '@/api'

const { t } = useI18n()

interface SearchForm {
  outTradeNo: string
  keyword: string
  payType?: number
  payStatus?: number
  startTime?: string
  endTime?: string
}

// 响应式数据
const loading = ref(false)
const detailDialogVisible = ref(false)
const selectedRecords = ref<PayRecordVO[]>([])
const currentRecord = ref<PayRecordVO | null>(null)
const dateRange = ref<string[]>([])

// 搜索表单
const searchForm = reactive<SearchForm>({
  outTradeNo: '',
  keyword: '',
  payType: undefined,
  payStatus: undefined
})

// 分页
const pagination = reactive({
  current: 1,
  size: 20,
  total: 0,
  pages: 0
})

const tableData = ref<PayRecordVO[]>([])

// 获取支付方式标签类型
const getPayTypeTag = (payType: number) => {
  const typeMap: Record<number, string> = {
    1: 'success', // 微信
    2: 'primary', // 支付宝
    3: 'warning'  // 网银
  }
  return typeMap[payType] || 'info'
}

// 获取支付状态标签类型
const getPayStatusTag = (payStatus: number) => {
  const statusMap: Record<number, string> = {
    1: 'warning',  // 支付中
    2: 'success',  // 支付成功
    3: 'danger',   // 支付失败
    4: 'info'      // 已退款
  }
  return statusMap[payStatus] || 'info'
}

// 加载支付记录数据
const loadRecords = async () => {
  loading.value = true
  try {
    const params: PayRecordQueryParams = {
      pageNum: pagination.current,
      pageSize: pagination.size
    }

    // 只有非空字符串时才添加参数
    if (searchForm.outTradeNo) {
      params.outTradeNo = searchForm.outTradeNo
    }
    
    if (searchForm.keyword) {
      params.keyword = searchForm.keyword
    }
    
    if (searchForm.payType !== undefined) {
      params.payType = searchForm.payType
    }
    
    if (searchForm.payStatus !== undefined) {
      params.payStatus = searchForm.payStatus
    }

    // 处理日期范围
    if (dateRange.value && dateRange.value.length === 2) {
      params.startTime = dateRange.value[0]
      params.endTime = dateRange.value[1]
    }

    const result = await getPayRecords(params)
    tableData.value = result.records
    pagination.total = result.total
    pagination.pages = result.pages
    pagination.current = result.current
    pagination.size = result.size
  } catch (error) {
    console.error('加载支付记录失败:', error)
    ElMessage.error(t('payRecord.loadFailed'))
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.current = 1
  loadRecords()
}

// 重置搜索
const handleReset = () => {
  Object.assign(searchForm, {
    outTradeNo: '',
    keyword: '',
    payType: undefined,
    payStatus: undefined
  })
  dateRange.value = []
  handleSearch()
}

// 查看详情
const handleView = async (row: PayRecordVO) => {
  try {
    currentRecord.value = await getPayRecordDetail(row.id)
    detailDialogVisible.value = true
  } catch (error) {
    console.error('获取支付记录详情失败:', error)
    ElMessage.error(t('payRecord.detailFailed'))
  }
}

// 删除记录
const handleDelete = async (row: PayRecordVO) => {
  try {
    await ElMessageBox.confirm(
      t('payRecord.deleteConfirm', { orderNo: row.outTradeNo }),
      t('payRecord.deleteTitle'),
      {
        confirmButtonText: t('payRecord.confirm'),
        cancelButtonText: t('payRecord.cancel'),
        type: 'warning'
      }
    )

    await deletePayRecord(row.id)
    ElMessage.success(t('payRecord.deleteSuccess'))
    await loadRecords()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除支付记录失败:', error)
      ElMessage.error(t('payRecord.deleteFailed'))
    }
  }
}

// 批量删除记录
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      t('payRecord.batchDeleteConfirm', { count: selectedRecords.value.length }),
      t('payRecord.batchDeleteTitle'),
      {
        confirmButtonText: t('payRecord.confirm'),
        cancelButtonText: t('payRecord.cancel'),
        type: 'warning'
      }
    )

    const recordIds = selectedRecords.value.map(record => record.id)
    await deletePayRecords(recordIds)
    ElMessage.success(t('payRecord.batchDeleteSuccess', { count: selectedRecords.value.length }))
    selectedRecords.value = []
    await loadRecords()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除支付记录失败:', error)
      ElMessage.error(t('payRecord.batchDeleteFailed'))
    }
  }
}

// 导出
const handleExport = () => {
  ElMessage.info(t('payRecord.exportInProgress'))
}

// 选择变更
const handleSelectionChange = (selection: PayRecordVO[]) => {
  selectedRecords.value = selection
}

// 分页大小变更
const handleSizeChange = (size: number) => {
  pagination.size = size
  pagination.current = 1
  loadRecords()
}

// 当前页变更
const handleCurrentChange = (page: number) => {
  pagination.current = page
  loadRecords()
}

// 组件挂载
onMounted(() => {
  loadRecords()
})
</script>

<style scoped lang="scss">
.pay-record-management {
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
