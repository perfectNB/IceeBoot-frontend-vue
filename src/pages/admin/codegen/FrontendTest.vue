<template>
  <div class="student-management">
    <div class="page-header">
      <h1>{{ t('frontendTest.pageTitle') }}</h1>
      <p>{{ t('frontendTest.pageDescription') }}</p>
    </div>

    <!-- 操作按钮区域 -->
    <div class="action-section">
      <el-button type="primary" :icon="Plus" @click="handleCreate">
        {{ t('frontendTest.addStudent') }}
      </el-button>
      <el-button
        type="danger"
        :disabled="selectedRows.length === 0"
        @click="handleBatchDelete"
      >
        <el-icon><Delete /></el-icon>
        {{ t('frontendTest.batchDelete') }}
      </el-button>

    </div>

    <!-- 搜索区域 -->
    <div class="search-section">
      <el-form :model="searchForm" inline>
        <el-form-item>
          <el-input
            v-model="searchForm.name"
            :placeholder="t('frontendTest.searchName')"
            style="width: 200px"
            clearable
          />
        </el-form-item>
        <el-form-item>
          <el-select
            v-model="searchForm.sex"
            :placeholder="t('frontendTest.selectSex')"
            style="width: 200px"
            clearable
          >
            <el-option :label="t('frontendTest.option1')" value="option1" />
            <el-option :label="t('frontendTest.option2')" value="option2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            {{ t('frontendTest.search') }}
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            {{ t('frontendTest.reset') }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 数据表格 -->
    <div class="table-section">
      <el-table
        ref="tableRef"
        :data="studentList"
        v-loading="loading"
        stripe
        border
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" :label="t('frontendTest.name')" min-width="120" />
        <el-table-column prop="age" :label="t('frontendTest.age')" min-width="120" />
        <el-table-column prop="sex" :label="t('frontendTest.sex')" min-width="120" />
        <el-table-column prop="hobby" :label="t('frontendTest.hobby')" min-width="120" />
        <el-table-column :label="t('frontendTest.operation')" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              type="warning"
              size="small"
              :icon="Edit"
              @click="handleEdit(row)"
            >
              {{ t('frontendTest.edit') }}
            </el-button>
            <el-button
              type="danger"
              size="small"
              :icon="Delete"
              @click="handleDelete(row)"
            >
              {{ t('frontendTest.delete') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

    </div>

    <!-- 分页 -->
    <div class="pagination-section">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
      >
        <el-form-item :label="t('frontendTest.nameLabel')" prop="name">
          <el-input
            v-model="formData.name"
            :placeholder="t('frontendTest.namePlaceholder')"
          />
        </el-form-item>
        <el-form-item :label="t('frontendTest.ageLabel')" prop="age">
          <el-input-number
            v-model="formData.age"
            :placeholder="t('frontendTest.agePlaceholder')"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item :label="t('frontendTest.sexLabel')" prop="sex">
          <el-select
            v-model="formData.sex"
            :placeholder="t('frontendTest.sexPlaceholder')"
            style="width: 100%"
          >
            <el-option :label="t('frontendTest.option1')" value="option1" />
            <el-option :label="t('frontendTest.option2')" value="option2" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('frontendTest.hobbyLabel')">
          <el-input
            v-model="formData.hobby"
            :placeholder="t('frontendTest.hobbyPlaceholder')"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">{{ t('frontendTest.cancel') }}</el-button>
          <el-button
            type="primary"
            :loading="submitting"
            @click="handleSubmit"
          >
            {{ t('frontendTest.confirm') }}
          </el-button>
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
  Plus,
  Edit,
  Delete
} from '@element-plus/icons-vue'
import type { Student } from '@/types'
import {
  deleteStudent,
  updateStudent,
  getStudentList,
  createStudent
} from '@/api/student'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const studentList = ref<Student[]>([])
const selectedRows = ref<Student[]>([])
const tableRef = ref()
const formRef = ref()

// 对话框状态
const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)
const currentId = ref<number | null>(null)

// 搜索表单
const searchForm = reactive({
  name: '',
  age: '',
  sex: ''
})

// 表单数据
const formData = reactive({
  name: '',
  age: 0,
  sex: '',
  hobby: ''
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: t('frontendTest.nameRequired'), trigger: 'blur' }
  ],
  age: [
    { required: true, message: t('frontendTest.ageRequired'), trigger: 'blur' }
  ],
  sex: [
    { required: true, message: t('frontendTest.sexRequired'), trigger: 'blur' }
  ]
}

// 分页
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const result = await getStudentList({
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      name: searchForm.name,
      age: searchForm.age,
      sex: searchForm.sex
    })
    studentList.value = result.records
    total.value = result.total
    currentPage.value = result.current
    pageSize.value = result.size
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error(t('frontendTest.loadDataFailed'))
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  loadData()
}

// 重置搜索
const handleReset = () => {
  Object.assign(searchForm, {
    name: '',
    age: '',
    sex: ''
  })
  handleSearch()
}

// 新建
const handleCreate = () => {
  isEdit.value = false
  dialogTitle.value = t('frontendTest.addTitle')
  currentId.value = null
  resetForm()
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row: Student) => {
  isEdit.value = true
  dialogTitle.value = t('frontendTest.editTitle')
  currentId.value = row.id
  Object.assign(formData, row)
  dialogVisible.value = true
}

// 重置表单
const resetForm = () => {
  Object.assign(formData, {
    name: '',
    age: 0,
    sex: '',
    hobby: ''
  })
  formRef.value?.clearValidate()
}

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
    submitting.value = true

    if (isEdit.value && currentId.value) {
      await updateStudent(currentId.value, formData)
      ElMessage.success(t('frontendTest.updateSuccess'))
    } else {
      await createStudent(formData)
      ElMessage.success(t('frontendTest.createSuccess'))
    }

    dialogVisible.value = false
    await loadData()
  } catch (error) {
    if (error !== false) { // 表单验证失败时不显示错误
      console.error('提交失败:', error)
      ElMessage.error(t('frontendTest.operationFailed'))
    }
  } finally {
    submitting.value = false
  }
}

// 批量删除
const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning(t('frontendTest.selectDataWarning'))
    return
  }

  try {
    await ElMessageBox.confirm(
      t('frontendTest.batchDeleteMessage', { count: selectedRows.value.length }),
      t('frontendTest.batchDeleteConfirm'),
      {
        confirmButtonText: t('frontendTest.confirm'),
        cancelButtonText: t('frontendTest.cancel'),
        type: 'warning'
      }
    )

    // 批量删除
    for (const item of selectedRows.value) {
      await deleteStudent(item.id)
    }

    ElMessage.success(t('frontendTest.batchDeleteSuccess'))
    await loadData()
    tableRef.value?.clearSelection()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
      ElMessage.error(t('frontendTest.batchDeleteFailed'))
    }
  }
}

// 删除
const handleDelete = async (row: Student) => {
  try {
    await ElMessageBox.confirm(
      t('frontendTest.deleteMessage'),
      t('frontendTest.deleteConfirm'),
      {
        confirmButtonText: t('frontendTest.confirm'),
        cancelButtonText: t('frontendTest.cancel'),
        type: 'warning'
      }
    )

    await deleteStudent(row.id)
    ElMessage.success(t('frontendTest.deleteSuccess'))
    await loadData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error(t('frontendTest.deleteFailed'))
    }
  }
}

// 选择变更
const handleSelectionChange = (selection: Student[]) => {
  selectedRows.value = selection
}

// 分页大小变更
const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  loadData()
}

// 当前页变更
const handleCurrentChange = (page: number) => {
  currentPage.value = page
  loadData()
}

// 组件挂载
onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss">
.student-management {
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
  display: flex;
  gap: 12px;
  margin-bottom: 20px;

  .el-button + .el-button {
    margin-left: 0;
  }
}

.search-section {
  margin-bottom: 20px;
  padding: 20px;
  background: var(--bg-color);
  border: 1px solid var(--border-lighter);
  border-radius: 8px;

  .el-form {
    margin: 0;
  }

  .el-form-item {
    margin-bottom: 0;
  }
}

.table-section {
  background: var(--bg-color);
  border: 1px solid var(--border-lighter);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;

  .el-table {
    .el-table__cell {
      padding: 12px 0;
    }
  }
}

.pagination-section {
  display: flex;
  justify-content: flex-end;
}

// 响应式设计
@media (max-width: 768px) {
  .action-section {
    flex-direction: column;
    gap: 12px;
  }

  .search-section {
    .el-form {
      flex-direction: column;
      align-items: stretch;
    }
  }
}
</style>
