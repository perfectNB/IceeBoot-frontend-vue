<template>
  <div class="frontend-codegen">
    <!-- 基础配置 -->
    <el-card class="config-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>基础配置</span>
        </div>
      </template>

      <el-form :model="configForm" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="文件名">
              <el-input v-model="configForm.fileName" placeholder="请输入文件名（如：User）" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="页面标题">
              <el-input v-model="configForm.pageTitle" placeholder="请输入页面标题" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="页面描述">
              <el-input v-model="configForm.pageDescription" placeholder="请输入页面描述" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 字段配置 -->
    <el-card class="config-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>字段配置</span>
          <div class="header-actions">
            <el-button type="primary" size="small" @click="addField">添加字段</el-button>
            <el-button type="success" size="small" @click="importFromJson">从JSON导入</el-button>
            <el-button type="info" size="small" @click="exportToJson">获取JSON格式</el-button>
          </div>
        </div>
      </template>

      <div class="fields-container">
        <el-table :data="fields" border stripe class="fields-table">
          <el-table-column label="中文名" width="130">
            <template #default="{ row }">
              <el-input v-model="row.chineseName" placeholder="中文名" size="small" />
            </template>
          </el-table-column>
          <el-table-column label="英文名" width="130">
            <template #default="{ row }">
              <el-input v-model="row.englishName" placeholder="英文名" size="small" />
            </template>
          </el-table-column>
          <el-table-column label="可搜索" width="100">
            <template #default="{ row }">
              <el-select v-model="row.searchable" placeholder="可搜索" size="small">
                <el-option label="是" :value="true" />
                <el-option label="否" :value="false" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="必填" width="80">
            <template #default="{ row }">
              <el-select v-model="row.required" placeholder="必填" size="small">
                <el-option label="是" :value="true" />
                <el-option label="否" :value="false" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="可编辑" width="80">
            <template #default="{ row }">
              <el-select v-model="row.canAddEdit" placeholder="可编辑" size="small">
                <el-option label="是" :value="true" />
                <el-option label="否" :value="false" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="表格显示" width="90">
            <template #default="{ row }">
              <el-select v-model="row.showInTable" placeholder="表格显示" size="small">
                <el-option label="是" :value="true" />
                <el-option label="否" :value="false" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="表单类型" width="120">
            <template #default="{ row }">
              <el-select v-model="row.formType" placeholder="表单类型" size="small">
                <el-option label="输入框" value="input" />
                <el-option label="数字" value="number" />
                <el-option label="文本域" value="textarea" />
                <el-option label="选择器" value="select" />
                <el-option label="开关" value="switch" />
                <el-option label="日期" value="date" />
                <el-option label="日期时间" value="datetime" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="例值" width="120">
            <template #default="{ row }">
              <el-input v-model="row.exampleValue" placeholder="例值" size="small" />
            </template>
          </el-table-column>
          <el-table-column label="排序" width="150">
            <template #default="{ row }">
              <el-input-number v-model="row.sortValue" :min="0" placeholder="排序" size="small" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" fixed="right">
            <template #default="{ $index }">
              <el-button type="danger" size="small" @click="removeField($index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <!-- API配置 -->
    <el-card class="config-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>API配置</span>
        </div>
      </template>

      <el-form label-width="120px">
        <el-form-item label="选择接口">
          <el-checkbox-group v-model="selectedApis">
            <el-checkbox label="list">查询列表</el-checkbox>
            <el-checkbox label="create">新增</el-checkbox>
            <el-checkbox label="update">更新</el-checkbox>
            <el-checkbox label="delete">删除</el-checkbox>
            <el-checkbox label="detail">详情</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="API前缀">
          <el-input v-model="apiPrefix" placeholder="自动生成" readonly />
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <el-button type="primary" size="large" @click="generateCode">生成代码</el-button>
      <el-button size="large" @click="resetConfig">重置配置</el-button>
    </div>

    <!-- 代码显示区域 -->
    <el-card v-if="generatedCode.vue" class="code-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>生成的代码</span>
        </div>
      </template>

      <div class="code-tabs">
        <el-button
          v-for="codeType in codeTypes"
          :key="codeType.key"
          :type="activeCodeType === codeType.key ? 'primary' : 'default'"
          @click="activeCodeType = codeType.key"
        >
          {{ codeType.label }}
        </el-button>
      </div>

      <div class="code-display">
        <div class="code-header">
          <span>{{ getCurrentCodeLabel() }}</span>
          <el-button type="primary" size="small" @click="copyCode">复制代码</el-button>
        </div>
        <pre class="code-content">{{ getCurrentCode() }}</pre>
      </div>
    </el-card>

    <!-- JSON导入对话框 -->
    <el-dialog v-model="jsonDialogVisible" title="从JSON导入字段" width="600px">
      <el-input
        v-model="jsonInput"
        type="textarea"
        :rows="10"
        placeholder="请输入JSON格式的字段配置"
      />
      <template #footer>
        <el-button @click="jsonDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleJsonImport">导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'

// 接口定义
interface FieldConfig {
  chineseName: string
  englishName: string
  searchable: boolean
  required: boolean
  sortValue: number
  canAddEdit: boolean
  showInTable: boolean
  formType: 'input' | 'number' | 'textarea' | 'select' | 'switch' | 'date' | 'datetime'
  exampleValue: string
}

interface ConfigForm {
  fileName: string
  pageTitle: string
  pageDescription: string
}

interface GeneratedCode {
  vue: string
  mockData: string
  mockService: string
  api: string
  types: string
}

// 响应式数据
const configForm = reactive<ConfigForm>({
  fileName: '',
  pageTitle: '',
  pageDescription: ''
})

const fields = ref<FieldConfig[]>([])
const selectedApis = ref<string[]>([])
const generatedCode = reactive<GeneratedCode>({
  vue: '',
  mockData: '',
  mockService: '',
  api: '',
  types: ''
})

const activeCodeType = ref('types')
const jsonDialogVisible = ref(false)
const jsonInput = ref('')

// 计算属性
const apiPrefix = computed(() => {
  return configForm.fileName ? `/api/v1/${configForm.fileName.toLowerCase()}` : ''
})

const codeTypes = [
  { key: 'types', label: '类型定义' },
  { key: 'mockData', label: 'Mock数据' },
  { key: 'mockService', label: 'Mock服务' },
  { key: 'api', label: 'API接口' },
  { key: 'vue', label: 'Vue组件' }
]

// 方法
const addField = () => {
  fields.value.push({
    chineseName: '',
    englishName: '',
    searchable: false,
    required: false,
    sortValue: 0,
    canAddEdit: true,
    showInTable: true,
    formType: 'input',
    exampleValue: ''
  })
}

const removeField = (index: number) => {
  fields.value.splice(index, 1)
}

const importFromJson = () => {
  jsonDialogVisible.value = true
}

const exportToJson = () => {
  const jsonStr = JSON.stringify(fields.value, null, 2)
  navigator.clipboard.writeText(jsonStr)
  ElMessage.success('JSON格式已复制到剪贴板')
}

const handleJsonImport = () => {
  try {
    const importedFields = JSON.parse(jsonInput.value)
    if (Array.isArray(importedFields)) {
      fields.value = importedFields
      ElMessage.success('导入成功')
      jsonDialogVisible.value = false
      jsonInput.value = ''
    } else {
      ElMessage.error('JSON格式不正确，应为数组格式')
    }
  } catch {
    ElMessage.error('JSON格式错误')
  }
}

const generateCode = () => {
  if (!configForm.fileName) {
    ElMessage.error('请输入文件名')
    return
  }
  if (fields.value.length === 0) {
    ElMessage.error('请至少添加一个字段')
    return
  }

  generatedCode.vue = generateVueCode()
  generatedCode.mockData = generateMockDataCode()
  generatedCode.mockService = generateMockServiceCode()
  generatedCode.api = generateApiCode()
  generatedCode.types = generateTypesCode()

  ElMessage.success('代码生成成功')
}

const resetConfig = () => {
  Object.assign(configForm, {
    fileName: '',
    pageTitle: '',
    pageDescription: ''
  })
  fields.value = []
  selectedApis.value = []
  Object.assign(generatedCode, {
    vue: '',
    mockData: '',
    mockService: '',
    api: '',
    types: ''
  })
}

const getCurrentCodeLabel = () => {
  const codeType = codeTypes.find(type => type.key === activeCodeType.value)
  return codeType ? codeType.label : ''
}

const getCurrentCode = () => {
  return generatedCode[activeCodeType.value as keyof GeneratedCode] || ''
}

const copyCode = () => {
  const code = getCurrentCode()
  if (code) {
    navigator.clipboard.writeText(code)

    // 根据不同类型显示不同提示
    if (activeCodeType.value === 'api') {
      ElMessage({
        message: '代码已复制到剪贴板，新建文件在/api下后，要在 /api/index.ts 暴露接口',
        type: 'success',
        duration: 3000
      })
    } else if (activeCodeType.value === 'mockService') {
      ElMessage({
        message: '代码已复制到剪贴板，新建文件在/services，要在 /services/index.ts 暴露接口',
        type: 'success',
        duration: 3000
      })
    } else if (activeCodeType.value === 'mockData') {
      ElMessage({
        message: '代码已复制到剪贴板，新建文件在/data，要在 /data/index.ts 暴露接口',
        type: 'success',
        duration: 3000
      })
    }else if (activeCodeType.value === 'types') {
      ElMessage({
        message: '代码已复制到剪贴板，要在 /types/index.ts 填写实体类',
        type: 'success',
        duration: 3000
      })
    } else {
      ElMessage.success('代码已复制到剪贴板')
    }
  } else {
    ElMessage.error('没有可复制的代码')
  }
}



// 代码生成函数
const generateVueCode = (): string => {
  const entityName = configForm.fileName
  const entityNameLower = entityName.toLowerCase()
  const searchableFields = fields.value.filter(f => f.searchable)
  const tableFields = fields.value.filter(f => f.showInTable)
  const editableFields = fields.value.filter(f => f.canAddEdit)

  // 生成搜索字段，超过3个时换行
  const searchFieldsHtml = searchableFields.map(field => {
    if (field.formType === 'input') {
      return `        <el-form-item>
          <el-input
            v-model="searchForm.${field.englishName}"
            placeholder="搜索${field.chineseName}"
            style="width: 200px"
            clearable
          />
        </el-form-item>`
    } else if (field.formType === 'select') {
      return `        <el-form-item>
          <el-select
            v-model="searchForm.${field.englishName}"
            placeholder="请选择${field.chineseName}"
            style="width: 200px"
            clearable
          >
            <el-option label="选项1" value="option1" />
            <el-option label="选项2" value="option2" />
          </el-select>
        </el-form-item>`
    }
    return ''
  }).filter(Boolean)

  // 生成搜索字段HTML
  const searchSection = searchFieldsHtml.length > 0 ? searchFieldsHtml.join('\n') : ''

  const tableColumns = tableFields.map(field => {
    if (field.formType === 'switch') {
      return `        <el-table-column label="${field.chineseName}" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.${field.englishName}"
              :active-value="true"
              :inactive-value="false"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>`
    } else {
      return `        <el-table-column prop="${field.englishName}" label="${field.chineseName}" min-width="120" />`
    }
  }).join('\n')

  const createButton = selectedApis.value.includes('create') ? `        <el-button type="primary" :icon="Plus" @click="handleCreate">
          新增${configForm.pageTitle.replace('管理', '')}
        </el-button>` : ''

  const actionButtons = [
    selectedApis.value.includes('update') ? `            <el-button
              type="warning"
              size="small"
              :icon="Edit"
              @click="handleEdit(row)"
            >
              编辑
            </el-button>` : '',
    selectedApis.value.includes('delete') ? `            <el-button
              type="danger"
              size="small"
              :icon="Delete"
              @click="handleDelete(row)"
            >
              删除
            </el-button>` : ''
  ].filter(Boolean).join('\n')

  const imports = selectedApis.value.map(api => {
    if (api === 'list') return `get${entityName}List`
    if (api === 'create') return `create${entityName}`
    if (api === 'update') return `update${entityName}`
    if (api === 'delete') return `delete${entityName}`
    if (api === 'detail') return `get${entityName}ById`
    return ''
  }).filter(Boolean).join(',\n  ')

  // 生成表单字段
  const formFields = editableFields.map(field => {
    const isRequired = field.required ? ' prop="' + field.englishName + '"' : ''

    if (field.formType === 'input') {
      return `        <el-form-item label="${field.chineseName}"${isRequired}>
          <el-input
            v-model="formData.${field.englishName}"
            placeholder="请输入${field.chineseName}"
          />
        </el-form-item>`
    } else if (field.formType === 'number') {
      return `        <el-form-item label="${field.chineseName}"${isRequired}>
          <el-input-number
            v-model="formData.${field.englishName}"
            placeholder="请输入${field.chineseName}"
            style="width: 100%"
          />
        </el-form-item>`
    } else if (field.formType === 'textarea') {
      return `        <el-form-item label="${field.chineseName}"${isRequired}>
          <el-input
            v-model="formData.${field.englishName}"
            type="textarea"
            :rows="3"
            placeholder="请输入${field.chineseName}"
          />
        </el-form-item>`
    } else if (field.formType === 'select') {
      return `        <el-form-item label="${field.chineseName}"${isRequired}>
          <el-select
            v-model="formData.${field.englishName}"
            placeholder="请选择${field.chineseName}"
            style="width: 100%"
          >
            <el-option label="选项1" value="option1" />
            <el-option label="选项2" value="option2" />
          </el-select>
        </el-form-item>`
    } else if (field.formType === 'switch') {
      return `        <el-form-item label="${field.chineseName}"${isRequired}>
          <el-switch
            v-model="formData.${field.englishName}"
            :active-value="true"
            :inactive-value="false"
          />
        </el-form-item>`
    } else if (field.formType === 'date') {
      return `        <el-form-item label="${field.chineseName}"${isRequired}>
          <el-date-picker
            v-model="formData.${field.englishName}"
            type="date"
            placeholder="请选择${field.chineseName}"
            style="width: 100%"
          />
        </el-form-item>`
    } else if (field.formType === 'datetime') {
      return `        <el-form-item label="${field.chineseName}"${isRequired}>
          <el-date-picker
            v-model="formData.${field.englishName}"
            type="datetime"
            placeholder="请选择${field.chineseName}"
            style="width: 100%"
          />
        </el-form-item>`
    }
    return ''
  }).join('\n')

  // 生成表单验证规则
  const formRules = editableFields.filter(f => f.required).map(field => {
    return `  ${field.englishName}: [
    { required: true, message: '请输入${field.chineseName}', trigger: 'blur' }
  ]`
  }).join(',\n')

  // 生成表单数据初始化
  const formDataInit = editableFields.map(field => {
    let defaultValue = "''"
    if (field.formType === 'number') defaultValue = '0'
    if (field.formType === 'switch') defaultValue = 'false'
    return `  ${field.englishName}: ${defaultValue}`
  }).join(',\n')

  const searchFormFields = searchableFields.map(field => `  ${field.englishName}: ''`).join(',\n')

  return `<template>
  <div class="${entityNameLower}-management">
    <div class="page-header">
      <h1>${configForm.pageTitle}</h1>
      <p>${configForm.pageDescription}</p>
    </div>

    <!-- 操作按钮区域 -->
    <div class="action-section">
${createButton}
      <el-button
        type="danger"
        :disabled="selectedRows.length === 0"
        @click="handleBatchDelete"
      >
        <el-icon><Delete /></el-icon>
        批量删除
      </el-button>

    </div>

    <!-- 搜索区域 -->
    <div class="search-section">
      <el-form :model="searchForm" inline>
${searchSection}
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
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

    <!-- 数据表格 -->
    <div class="table-section">
      <el-table
        ref="tableRef"
        :data="${entityNameLower}List"
        v-loading="loading"
        stripe
        border
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
${tableColumns}
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
${actionButtons}
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
${formFields}
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            :loading="submitting"
            @click="handleSubmit"
          >
            确定
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  Refresh,
  Plus,
  Download,
  Edit,
  Delete
} from '@element-plus/icons-vue'
import type { ${entityName} } from '@/types'
import {
  ${imports}
} from '@/api/${entityNameLower}'

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const ${entityNameLower}List = ref<${entityName}[]>([])
const selectedRows = ref<${entityName}[]>([])
const tableRef = ref()
const formRef = ref()

// 对话框状态
const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)
const currentId = ref<number | null>(null)

// 搜索表单
const searchForm = reactive({
${searchFormFields}
})

// 表单数据
const formData = reactive({
${formDataInit}
})

// 表单验证规则
const formRules = {
${formRules}
}

// 分页
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const result = await get${entityName}List({
      pageNum: currentPage.value,
      pageSize: pageSize.value,
${searchableFields.map(field => `      ${field.englishName}: searchForm.${field.englishName}`).join(',\n')}
    })
    ${entityNameLower}List.value = result.records
    total.value = result.total
    currentPage.value = result.current
    pageSize.value = result.size
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败')
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
${searchableFields.map(field => `    ${field.englishName}: ''`).join(',\n')}
  })
  handleSearch()
}

// 新建
const handleCreate = () => {
  isEdit.value = false
  dialogTitle.value = '新增${configForm.pageTitle.replace('管理', '')}'
  currentId.value = null
  resetForm()
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row: ${entityName}) => {
  isEdit.value = true
  dialogTitle.value = '编辑${configForm.pageTitle.replace('管理', '')}'
  currentId.value = row.id
  Object.assign(formData, row)
  dialogVisible.value = true
}

// 重置表单
const resetForm = () => {
  Object.assign(formData, {
${formDataInit}
  })
  formRef.value?.clearValidate()
}

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
    submitting.value = true

    if (isEdit.value && currentId.value) {
      await update${entityName}(currentId.value, formData)
      ElMessage.success('更新成功')
    } else {
      await create${entityName}(formData)
      ElMessage.success('创建成功')
    }

    dialogVisible.value = false
    await loadData()
  } catch (error) {
    if (error !== false) { // 表单验证失败时不显示错误
      console.error('提交失败:', error)
      ElMessage.error('操作失败')
    }
  } finally {
    submitting.value = false
  }
}

// 批量删除
const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择要删除的数据')
    return
  }

  try {
    await ElMessageBox.confirm(
      \`确定要删除选中的 \${selectedRows.value.length} 条数据吗？\`,
      '批量删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 批量删除
    for (const item of selectedRows.value) {
      await delete${entityName}(item.id)
    }

    ElMessage.success('批量删除成功')
    await loadData()
    tableRef.value?.clearSelection()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
      ElMessage.error('批量删除失败')
    }
  }
}

// 删除
const handleDelete = async (row: ${entityName}) => {
  try {
    await ElMessageBox.confirm(
      \`确定要删除该${configForm.pageTitle.replace('管理', '')}吗？\`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await delete${entityName}(row.id)
    ElMessage.success('删除成功')
    await loadData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 导出
const handleExport = () => {
  ElMessage.info('导出功能开发中...')
}

// 选择变更
const handleSelectionChange = (selection: ${entityName}[]) => {
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

// 状态变更
const handleStatusChange = async (row: ${entityName}) => {
  try {
    await update${entityName}(row.id, row)
    ElMessage.success('状态更新成功')
  } catch (error) {
    console.error('状态更新失败:', error)
    ElMessage.error('状态更新失败')
    await loadData() // 重新加载数据恢复状态
  }
}

// 组件挂载
onMounted(() => {
  loadData()
})
<\/script>

<style scoped lang="scss">
.${entityNameLower}-management {
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
<\/style>`
}

const generateMockDataCode = (): string => {
  const entityName = configForm.fileName

  const mockFields = fields.value.map(field => {
    const { englishName, formType, exampleValue } = field

    let mockValue
    switch (formType) {
      case 'input':
        mockValue = `'${exampleValue || 'Mock数据'}'`
        break
      case 'number':
        mockValue = exampleValue || '1'
        break
      case 'select':
        mockValue = `'${exampleValue || '选项1'}'`
        break
      case 'switch':
        mockValue = 'true'
        break
      case 'date':
        mockValue = `'2025-08-09'`
        break
      case 'datetime':
        mockValue = `'2025-08-09 12:00:00'`
        break
      default:
        mockValue = `'${exampleValue || 'Mock数据'}'`
    }

    return `    ${englishName}: ${mockValue}`
  }).join(',\n')

  return `/**
 * ${configForm.pageTitle.replace('管理', '')}相关Mock数据
 */

import type { ${entityName} } from '@/types'

// ${configForm.pageTitle.replace('管理', '')}Mock数据
export const mock${entityName}s: ${entityName}[] = [
${Array.from({ length: 10 }, (_, index) => `  {
    id: ${index + 1},
${mockFields},
    createTime: '2025-08-${String(index % 30 + 1).padStart(2, '0')} 10:00:00',
    updateTime: '2028-08-${String(index % 30 + 1).padStart(2, '0')} 10:00:00'
  }`).join(',\n')}
]


`
}

const generateMockServiceCode = (): string => {
  const entityName = configForm.fileName

  return `/**
 * Mock${configForm.pageTitle.replace('管理', '')}服务
 */

import type { ${entityName}, PageParams, PageResult } from '@/types'
import { mock${entityName}s } from '../data'
import { mockLog, mockDelay } from '@/config/mock'

export class Mock${entityName}Service {

  // 获取${configForm.pageTitle.replace('管理', '')}列表
  static async get${entityName}List(params: PageParams): Promise<PageResult<${entityName}>> {
    await mockDelay()
    mockLog('获取${configForm.pageTitle.replace('管理', '')}列表', params)

    let filteredList = [...mock${entityName}s]

    // 关键词搜索
    if (params.keyword) {
      const keyword = params.keyword.toLowerCase()
      filteredList = filteredList.filter(item =>
${fields.value.filter(f => f.searchable).map(field =>
        `        item.${field.englishName}.toString().toLowerCase().includes(keyword)`
      ).join(' ||\n')}
      )
    }

    // 分页参数默认值
    const pageNum = params.pageNum || 1
    const pageSize = params.pageSize || 10

    // 分页
    const total = filteredList.length
    const start = (pageNum - 1) * pageSize
    const end = start + pageSize
    const records = filteredList.slice(start, end)
    const pages = Math.ceil(total / pageSize)

    return {
      records,
      total,
      current: pageNum,
      size: pageSize,
      pages,
      hasPrevious: pageNum > 1,
      hasNext: pageNum < pages
    }
  }

  // 获取所有${configForm.pageTitle.replace('管理', '')}
  static async getAll${entityName}s(): Promise<${entityName}[]> {
    await mockDelay()
    mockLog('获取所有${configForm.pageTitle.replace('管理', '')}')
    return [...mock${entityName}s]
  }

  // 根据ID获取${configForm.pageTitle.replace('管理', '')}
  static async get${entityName}ById(id: number): Promise<${entityName}> {
    await mockDelay()
    mockLog('根据ID获取${configForm.pageTitle.replace('管理', '')}', { id })

    const item = mock${entityName}s.find(r => r.id === id)
    if (!item) {
      throw new Error('${configForm.pageTitle.replace('管理', '')}不存在')
    }

    return item
  }

  // 创建${configForm.pageTitle.replace('管理', '')}
  static async create${entityName}(data: Partial<${entityName}>): Promise<${entityName}> {
    await mockDelay()
    mockLog('创建${configForm.pageTitle.replace('管理', '')}', data)

    const newItem: ${entityName} = {
      id: Math.max(...mock${entityName}s.map(r => Number(r.id))) + 1,
${fields.value.map(field => {
        const { englishName, formType, exampleValue } = field
        let defaultValue
        switch (formType) {
          case 'input':
            defaultValue = `data.${englishName} || '${exampleValue || '默认值'}'`
            break
          case 'number':
            defaultValue = `data.${englishName} || ${exampleValue || '0'}`
            break
          case 'select':
            defaultValue = `data.${englishName} || '${exampleValue || '选项1'}'`
            break
          case 'switch':
            defaultValue = `data.${englishName} || false`
            break
          case 'date':
          case 'datetime':
            defaultValue = `data.${englishName} || '${exampleValue || '2024-01-01'}'`
            break
          default:
            defaultValue = `data.${englishName} || '${exampleValue || '默认值'}'`
        }
        return `      ${englishName}: ${defaultValue}`
      }).join(',\n')},
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString()
    }

    mock${entityName}s.push(newItem)
    return newItem
  }

  // 更新${configForm.pageTitle.replace('管理', '')}
  static async update${entityName}(id: number, data: Partial<${entityName}>): Promise<${entityName}> {
    await mockDelay()
    mockLog('更新${configForm.pageTitle.replace('管理', '')}', { id, data })

    const index = mock${entityName}s.findIndex(r => r.id === id)
    if (index === -1) {
      throw new Error('${configForm.pageTitle.replace('管理', '')}不存在')
    }

    const updatedItem = {
      ...mock${entityName}s[index],
      ...data,
      id: id,
      updateTime: new Date().toISOString()
    }

    mock${entityName}s[index] = updatedItem
    return updatedItem
  }

  // 删除${configForm.pageTitle.replace('管理', '')}（批量删除）
  static async delete${entityName}s(ids: number[]): Promise<boolean> {
    await mockDelay()
    mockLog('批量删除${configForm.pageTitle.replace('管理', '')}', { ids })

    ids.forEach(id => {
      const index = mock${entityName}s.findIndex(r => r.id === id)
      if (index !== -1) {
        mock${entityName}s.splice(index, 1)
      }
    })
    return true
  }

  // 删除单个${configForm.pageTitle.replace('管理', '')}（兼容性保留）
  static async delete${entityName}(id: number): Promise<boolean> {
    await mockDelay()
    mockLog('删除${configForm.pageTitle.replace('管理', '')}', { id })

    const index = mock${entityName}s.findIndex(r => r.id === id)
    if (index === -1) {
      throw new Error('${configForm.pageTitle.replace('管理', '')}不存在')
    }

    mock${entityName}s.splice(index, 1)
    return true
  }
}`
}

const generateApiCode = (): string => {
  const entityName = configForm.fileName
  const entityNameLower = entityName.toLowerCase()

  const apiMethods = selectedApis.value.map(api => {
    if (api === 'list') {
      return `// 获取${configForm.pageTitle.replace('管理', '')}列表
export const get${entityName}List = async (params: PageParams): Promise<PageResult<${entityName}>> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await Mock${entityName}Service.get${entityName}List(params)
  } else {
    // 调用真实API
    const response = await request.get<{data: PageResult<${entityName}>}>('/api/v1/${entityNameLower}', params)
    const apiResponse = response as unknown as {code: number, message: string, data: PageResult<${entityName}>, success: boolean}
    if (!apiResponse || !apiResponse.data) {
      throw new Error('获取${configForm.pageTitle.replace('管理', '')}列表响应数据格式错误')
    }
    return apiResponse.data
  }
}`
    } else if (api === 'create') {
      return `// 创建${configForm.pageTitle.replace('管理', '')}
export const create${entityName} = async (data: Partial<${entityName}>): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    await Mock${entityName}Service.create${entityName}(data)
  } else {
    // 调用真实API
    const response = await request.post('/api/v1/${entityNameLower}', data)
    const apiResponse = response as unknown as {code: number, message: string, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('创建${configForm.pageTitle.replace('管理', '')}失败')
    }
  }
}`
    } else if (api === 'update') {
      return `// 更新${configForm.pageTitle.replace('管理', '')}
export const update${entityName} = async (id: string | number, data: Partial<${entityName}>): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    await Mock${entityName}Service.update${entityName}(Number(id), data)
  } else {
    // 调用真实API
    const requestData = { ...data, id }
    const response = await request.put('/api/v1/${entityNameLower}', requestData)
    const apiResponse = response as unknown as {code: number, message: string, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('更新${configForm.pageTitle.replace('管理', '')}失败')
    }
  }
}`
    } else if (api === 'delete') {
      return `// 删除${configForm.pageTitle.replace('管理', '')}（批量删除）
export const delete${entityName}s = async (ids: (string | number)[]): Promise<boolean> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await Mock${entityName}Service.delete${entityName}s(ids.map(Number))
  } else {
    // 调用真实API
    const response = await request.delete('/api/v1/${entityNameLower}', {}, {
      data: ids.map(Number)
    })
    const apiResponse = response as unknown as {code: number, message: string, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('删除${configForm.pageTitle.replace('管理', '')}失败')
    }
    return true
  }
}

// 删除单个${configForm.pageTitle.replace('管理', '')}（兼容性保留）
export const delete${entityName} = async (id: string | number): Promise<boolean> => {
  return await delete${entityName}s([id])
}`
    } else if (api === 'detail') {
      return `// 获取${configForm.pageTitle.replace('管理', '')}详情
export const get${entityName}ById = async (id: string | number): Promise<${entityName}> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await Mock${entityName}Service.get${entityName}ById(Number(id))
  } else {
    // 调用真实API
    const response = await request.get<{data: ${entityName}}>('/api/v1/${entityNameLower}/' + id)
    const apiResponse = response as unknown as {code: number, message: string, data: ${entityName}, success: boolean}
    if (!apiResponse || !apiResponse.data) {
      throw new Error('获取${configForm.pageTitle.replace('管理', '')}详情响应数据格式错误')
    }
    return apiResponse.data
  }
}`
    }
    return ''
  }).filter(Boolean).join('\n\n')

  return `import { request } from '@/utils/request'
import type { ${entityName}, PageParams, PageResult } from '@/types'
import { isMockEnabled } from '@/config/mock'
import { Mock${entityName}Service } from '@/mock/services/${entityNameLower}'

${apiMethods}`
}

const generateTypesCode = (): string => {
const entityName = configForm.fileName

const entityFields = fields.value.map(field => {
const { englishName, formType, required } = field

let tsType
switch (formType) {
case 'input':
case 'select':
case 'date':
case 'datetime':
tsType = 'string'
break
case 'number':
tsType = 'number'
break
case 'switch':
tsType = 'boolean'
break
default:
tsType = 'string'
}

const optional = required ? '' : '?'
return `  ${englishName}${optional}: ${tsType} // ${field.chineseName}`
}).join('\n')

const searchFields = fields.value.filter(field => field.searchable).map(field => {
const { englishName, formType } = field

let tsType
switch (formType) {
case 'input':
case 'select':
case 'date':
case 'datetime':
tsType = 'string'
break
case 'number':
tsType = 'number'
break
case 'switch':
tsType = 'boolean'
break
default:
tsType = 'string'
}

return `  ${englishName}?: ${tsType} // ${field.chineseName}`
}).join('\n')

const createFields = fields.value.filter(field => field.canAddEdit).map(field => {
const { englishName, formType, required } = field

let tsType
switch (formType) {
case 'input':
case 'select':
case 'date':
case 'datetime':
tsType = 'string'
break
case 'number':
tsType = 'number'
break
case 'switch':
tsType = 'boolean'
break
default:
tsType = 'string'
}

const optional = required ? '' : '?'
return `  ${englishName}${optional}: ${tsType} // ${field.chineseName}`
}).join('\n')

return `// ${configForm.pageTitle}相关类型定义

// ${entityName}实体
export interface ${entityName} {
id: number
${entityFields}
createTime: string
updateTime: string
}

// ${entityName}搜索表单
export interface ${entityName}SearchForm {
${searchFields}
pageNum?: number
pageSize?: number
}

// ${entityName}创建数据
export interface ${entityName}CreateData {
${createFields}
}`
}
</script>


<style scoped lang="scss">
.frontend-codegen {
  padding: 20px;
}

.config-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .header-actions {
    display: flex;
    gap: 8px;
  }
}

.fields-container {
  .field-item {
    margin-bottom: 12px;
    padding: 12px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 6px;
    background: var(--el-bg-color-page);
  }
}

.action-buttons {
  text-align: center;
  margin: 30px 0;
}

.code-card {
  margin-top: 20px;
}

.code-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.code-display {
  .code-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding: 8px 12px;
    background: var(--el-bg-color-page);
    border-radius: 4px;

    span {
      font-weight: 500;
      color: var(--el-text-color-primary);
    }
  }

  .code-content {
    background: #f8f9fa;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 6px;
    padding: 16px;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 13px;
    line-height: 1.5;
    color: #333;
    white-space: pre-wrap;
    word-wrap: break-word;
    max-height: 600px;
    overflow-y: auto;
  }
}

@media (max-width: 768px) {
  .frontend-codegen {
    padding: 10px;
  }

  .code-tabs {
    flex-wrap: wrap;
  }

  .fields-container .field-item {
    .el-row .el-col {
      margin-bottom: 8px;
    }
  }
}
</style>
