<template>
  <div class="pay-record-management">
    <div class="page-header">
      <h1 class="page-title">支付记录管理</h1>
      <p class="page-description">查看和管理系统支付记录</p>
    </div>

    <!-- 操作区域 -->
    <div class="action-section">
      <el-button
        type="danger"
        @click="handleBatchDelete"
        :disabled="selectedRecords.length === 0"
      >
        <el-icon><Delete /></el-icon>
        批量删除
      </el-button>
      <el-button @click="handleExport">
        <el-icon><Download /></el-icon>
        导出
      </el-button>
    </div>

    <!-- 搜索区域 -->
    <div class="search-section">
      <el-form :model="searchForm" :inline="true">
        <el-form-item label="订单号">
          <el-input
            v-model="searchForm.outTradeNo"
            placeholder="请输入订单号"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="用户名">
          <el-input
            v-model="searchForm.keyword"
            placeholder="请输入用户名"
            clearable
            style="width: 150px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="支付方式">
          <el-select
            v-model="searchForm.payType"
            placeholder="请选择支付方式"
            clearable
            style="width: 130px"
          >
            <el-option label="微信支付" :value="1" />
            <el-option label="支付宝" :value="2" />
            <el-option label="网银支付" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="支付状态">
          <el-select
            v-model="searchForm.payStatus"
            placeholder="请选择状态"
            clearable
            style="width: 130px"
          >
            <el-option label="支付中" :value="1" />
            <el-option label="支付成功" :value="2" />
            <el-option label="支付失败" :value="3" />
            <el-option label="已退款" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 240px"
          />
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
        <el-table-column prop="outTradeNo" label="商户订单号" min-width="180" />
        <el-table-column prop="tradeNo" label="第三方订单号" min-width="200" show-overflow-tooltip />
        <el-table-column prop="orderName" label="订单名称" min-width="150" />
        <el-table-column label="支付方式" width="110">
          <template #default="{ row }">
            <el-tag :type="getPayTypeTag(row.payType)">
              {{ row.payTypeName }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="支付金额" width="120">
          <template #default="{ row }">
            <span class="price-text">¥{{ row.payAmountYuan }}</span>
          </template>
        </el-table-column>
        <el-table-column label="支付状态" width="110">
          <template #default="{ row }">
            <el-tag :type="getPayStatusTag(row.payStatus)">
              {{ row.payStatusName }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="configName" label="套餐名称" min-width="120" />
        <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <div style="display: flex; gap: 8px;">
              <el-button
                type="primary"
                size="small"
                :icon="View"
                @click="handleView(row)"
              >
                详情
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

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="支付记录详情"
      width="600px"
    >
      <el-descriptions :column="2" border v-if="currentRecord">
        <el-descriptions-item label="记录ID">
          {{ currentRecord.id }}
        </el-descriptions-item>
        <el-descriptions-item label="商户订单号">
          {{ currentRecord.outTradeNo }}
        </el-descriptions-item>
        <el-descriptions-item label="第三方订单号" :span="2">
          {{ currentRecord.tradeNo || '暂无' }}
        </el-descriptions-item>
        <el-descriptions-item label="订单名称" :span="2">
          {{ currentRecord.orderName }}
        </el-descriptions-item>
        <el-descriptions-item label="支付方式">
          <el-tag :type="getPayTypeTag(currentRecord.payType)">
            {{ currentRecord.payTypeName }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="支付状态">
          <el-tag :type="getPayStatusTag(currentRecord.payStatus)">
            {{ currentRecord.payStatusName }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="支付金额">
          <span class="price-text">¥{{ currentRecord.payAmountYuan }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="套餐名称">
          {{ currentRecord.configName }}
        </el-descriptions-item>
        <el-descriptions-item label="用户ID">
          {{ currentRecord.userId }}
        </el-descriptions-item>
        <el-descriptions-item label="用户名">
          {{ currentRecord.username }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">
          {{ currentRecord.createTime }}
        </el-descriptions-item>
        <el-descriptions-item label="更新时间" :span="2">
          {{ currentRecord.updateTime }}
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">
          {{ currentRecord.remark || '无' }}
        </el-descriptions-item>
      </el-descriptions>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
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
import type { PayRecordVO, PayRecordQueryParams } from '@/api/pay'
import {
  getPayRecords,
  getPayRecordDetail,
  deletePayRecord,
  deletePayRecords
} from '@/api'

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
    ElMessage.error('加载支付记录失败')
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
    ElMessage.error('获取支付记录详情失败')
  }
}

// 删除记录
const handleDelete = async (row: PayRecordVO) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除订单号为 "${row.outTradeNo}" 的记录吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await deletePayRecord(row.id)
    ElMessage.success('支付记录删除成功')
    await loadRecords()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除支付记录失败:', error)
      ElMessage.error('删除支付记录失败')
    }
  }
}

// 批量删除记录
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRecords.value.length} 条记录吗？`,
      '批量删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const recordIds = selectedRecords.value.map(record => record.id)
    await deletePayRecords(recordIds)
    ElMessage.success(`成功删除 ${selectedRecords.value.length} 条记录`)
    selectedRecords.value = []
    await loadRecords()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除支付记录失败:', error)
      ElMessage.error('批量删除支付记录失败')
    }
  }
}

// 导出
const handleExport = () => {
  ElMessage.info('导出功能开发中...')
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
