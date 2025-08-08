<template>
  <div class="frontend-codegen">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">前端代码生成</h1>
      <p class="page-description">快速生成Vue3 + TypeScript的增删改查页面</p>
    </div>

    <!-- 字段配置区域 -->
    <el-card class="config-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">字段配置</span>
          <div class="header-actions">
            <el-button size="small" @click="addField">
              <el-icon><Plus /></el-icon>
              添加字段
            </el-button>
            <el-button size="small" @click="importFields">
              <el-icon><Upload /></el-icon>
              导入字段
            </el-button>
            <el-button size="small" @click="exportFields">
              <el-icon><Download /></el-icon>
              导出字段
            </el-button>
            <el-button size="small" type="danger" @click="clearFields">
              <el-icon><Delete /></el-icon>
              清空
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="fields" border stripe>
        <el-table-column prop="chineseName" label="中文名" width="120">
          <template #default="{ row, $index }">
            <el-input v-model="row.chineseName" placeholder="请输入中文名" size="small" />
          </template>
        </el-table-column>
        <el-table-column prop="englishName" label="英文名" width="120">
          <template #default="{ row, $index }">
            <el-input v-model="row.englishName" placeholder="请输入英文名" size="small" />
          </template>
        </el-table-column>
        <el-table-column prop="required" label="必填" width="80">
          <template #default="{ row, $index }">
            <el-checkbox v-model="row.required" />
          </template>
        </el-table-column>
        <el-table-column prop="editable" label="可编辑" width="80">
          <template #default="{ row, $index }">
            <el-checkbox v-model="row.editable" />
          </template>
        </el-table-column>
        <el-table-column prop="addable" label="可添加" width="80">
          <template #default="{ row, $index }">
            <el-checkbox v-model="row.addable" />
          </template>
        </el-table-column>
        <el-table-column prop="formType" label="表单类型" width="120">
          <template #default="{ row, $index }">
            <el-select v-model="row.formType" placeholder="选择类型" size="small">
              <el-option label="输入框" value="input" />
              <el-option label="数字输入" value="number" />
              <el-option label="下拉选择" value="select" />
              <el-option label="日期选择" value="date" />
              <el-option label="时间选择" value="datetime" />
              <el-option label="文本域" value="textarea" />
              <el-option label="开关" value="switch" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column prop="searchable" label="可搜索" width="80">
          <template #default="{ row, $index }">
            <el-checkbox v-model="row.searchable" />
          </template>
        </el-table-column>
        <el-table-column prop="sortOrder" label="排序" width="80">
          <template #default="{ row, $index }">
            <el-input-number v-model="row.sortOrder" :min="0" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row, $index }">
            <el-button type="danger" size="small" @click="removeField($index)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 生成配置区域 -->
    <el-card class="config-card" shadow="hover">
      <template #header>
        <span class="card-title">生成配置</span>
      </template>

      <el-form :model="generateConfig" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="组件名称">
              <el-input v-model="generateConfig.componentName" placeholder="请输入组件名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="输出路径">
              <el-input v-model="generateConfig.outputPath" placeholder="默认: /pages" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="查询接口">
              <el-input v-model="generateConfig.apis.get" placeholder="GET接口路径" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="创建接口">
              <el-input v-model="generateConfig.apis.create" placeholder="POST接口路径" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="更新接口">
              <el-input v-model="generateConfig.apis.update" placeholder="PUT接口路径" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="删除接口">
              <el-input v-model="generateConfig.apis.delete" placeholder="DELETE接口路径" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <el-button type="primary" size="large" @click="handleGenerate" :loading="generating">
        <el-icon><Setting /></el-icon>
        开始生成
      </el-button>
      <el-button size="large" @click="handlePreview">
        <el-icon><View /></el-icon>
        预览代码
      </el-button>
    </div>

    <!-- 代码预览对话框 -->
    <el-dialog v-model="previewVisible" title="代码预览" width="80%" top="5vh">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="Vue组件" name="vue">
          <pre><code>{{ vueCode }}</code></pre>
        </el-tab-pane>
        <el-tab-pane label="API接口" name="api">
          <pre><code>{{ apiCode }}</code></pre>
        </el-tab-pane>
        <el-tab-pane label="Mock数据" name="mock">
          <pre><code>{{ mockCode }}</code></pre>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>

    <!-- 文件上传 -->
    <input ref="fileInput" type="file" accept=".json" style="display: none" @change="handleFileImport" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Upload, Download, Delete, Setting, View } from '@element-plus/icons-vue'

// 字段接口定义
interface Field {
  chineseName: string
  englishName: string
  required: boolean
  editable: boolean
  addable: boolean
  formType: string
  searchable: boolean
  sortOrder: number
}

// 生成配置接口
interface GenerateConfig {
  componentName: string
  outputPath: string
  apis: {
    get: string
    create: string
    update: string
    delete: string
  }
}

// 响应式数据
const fields = ref<Field[]>([])
const generating = ref(false)
const previewVisible = ref(false)
const activeTab = ref('vue')
const fileInput = ref<HTMLInputElement>()

// 生成配置
const generateConfig = reactive<GenerateConfig>({
  componentName: '',
  outputPath: '/pages',
  apis: {
    get: '',
    create: '',
    update: '',
    delete: ''
  }
})

// 生成Vue代码
const generateVueCode = () => {
  const componentName = generateConfig.componentName || 'GeneratedComponent'
  
  // 生成搜索表单字段
  const searchFields = fields.value.filter(field => field.searchable)
  const searchFormCode = searchFields.map(field => `  ${field.englishName}: ''`).join(',\n')
  
  // 生成表格列
  const tableColumnsCode = fields.value.map(field => {
    return `        <el-table-column prop="${field.englishName}" label="${field.chineseName}" />`
  }).join('\n')
  
  // 生成表单字段
  const formFieldsCode = fields.value.filter(field => field.addable || field.editable).map(field => {
    const required = field.required ? ' required' : ''
    let formControl = ''
    
    switch (field.formType) {
      case 'input':
        formControl = `<el-input v-model="form.${field.englishName}" placeholder="请输入${field.chineseName}" />`
        break
      case 'number':
        formControl = `<el-input-number v-model="form.${field.englishName}" placeholder="请输入${field.chineseName}" />`
        break
      case 'select':
        formControl = `<el-select v-model="form.${field.englishName}" placeholder="请选择${field.chineseName}">\n          <!-- 选项需要根据实际情况添加 -->\n        </el-select>`
        break
      case 'date':
        formControl = `<el-date-picker v-model="form.${field.englishName}" type="date" placeholder="请选择${field.chineseName}" />`
        break
      case 'datetime':
        formControl = `<el-date-picker v-model="form.${field.englishName}" type="datetime" placeholder="请选择${field.chineseName}" />`
        break
      case 'textarea':
        formControl = `<el-input v-model="form.${field.englishName}" type="textarea" placeholder="请输入${field.chineseName}" />`
        break
      case 'switch':
        formControl = `<el-switch v-model="form.${field.englishName}" />`
        break
      default:
        formControl = `<el-input v-model="form.${field.englishName}" placeholder="请输入${field.chineseName}" />`
    }
    
    return `        <el-form-item label="${field.chineseName}"${required}>\n          ${formControl}\n        </el-form-item>`
  }).join('\n')
  
  // 生成表单数据
  const formCode = fields.value.map(field => `  ${field.englishName}: ''`).join(',\n')
  
  return `<template>
  <div class="${componentName.toLowerCase()}-management">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">${componentName}管理</h1>
    </div>

    <!-- 搜索区域 -->
    <div class="search-container">
      <el-form :model="searchForm" inline>
${searchFields.map(field => `        <el-form-item label="${field.chineseName}">
          <el-input v-model="searchForm.${field.englishName}" placeholder="请输入${field.chineseName}" />
        </el-form-item>`).join('\n')}
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
      
      <div class="action-section">
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          新建${componentName}
        </el-button>
      </div>
    </div>
    
    <!-- 数据表格 -->
    <div class="table-container">
      <el-table
        :data="tableData"
        v-loading="loading"
        stripe
        border
        style="width: 100%"
      >
${tableColumnsCode}
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 新建/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form ref="formRef" :model="form" label-width="100px">
${formFieldsCode}
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import { get${componentName}, create${componentName}, update${componentName}, delete${componentName} } from '@/api/${componentName.toLowerCase()}'

// 响应式数据
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const tableData = ref([])

// 搜索表单
const searchForm = reactive({
${searchFormCode}
})

// 表单数据
const form = reactive({
${formCode}
})

// 计算属性
const dialogTitle = computed(() => isEdit.value ? '编辑${componentName}' : '新建${componentName}')

// 方法
const handleSearch = () => {
  // 搜索逻辑
}

const handleReset = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = ''
  })
}

const handleCreate = () => {
  isEdit.value = false
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  isEdit.value = true
  Object.assign(form, row)
  dialogVisible.value = true
}

const handleDelete = (row: any) => {
  // 删除逻辑
}

const handleSubmit = () => {
  // 提交逻辑
}

onMounted(() => {
  // 初始化数据
})
</script>`
}

// 生成API代码
const generateApiCode = () => {
  const componentName = generateConfig.componentName || 'GeneratedComponent'
  const lowerName = componentName.toLowerCase()
  
  const getUrl = generateConfig.apis.get || '/api/v1/' + lowerName
  const createUrl = generateConfig.apis.create || '/api/v1/' + lowerName
  const updateUrl = generateConfig.apis.update || '/api/v1/' + lowerName + '/${id}'
  const deleteUrl = generateConfig.apis.delete || '/api/v1/' + lowerName + '/${id}'
  
  return `import request from '@/utils/request'
import { useMockData } from '@/config'
import { Mock${componentName}Service } from '@/mock/services/${lowerName}'

// ${componentName} API
export const get${componentName} = (params?: any) => {
  if (useMockData) {
    return Mock${componentName}Service.get${componentName}(params)
  }
  return request({
    url: '${getUrl}',
    method: 'get',
    params
  })
}

export const create${componentName} = (data: any) => {
  if (useMockData) {
    return Mock${componentName}Service.save${componentName}(data)
  }
  return request({
    url: '${createUrl}',
    method: 'post',
    data
  })
}

export const update${componentName} = (id: string | number, data: any) => {
  if (useMockData) {
    return Mock${componentName}Service.update${componentName}(id, data)
  }
  return request({
    url: '${updateUrl}'.replace('\${id}', String(id)),
    method: 'put',
    data
  })
}

export const delete${componentName} = (id: string | number) => {
  if (useMockData) {
    return Mock${componentName}Service.delete${componentName}(id)
  }
  return request({
    url: '${deleteUrl}'.replace('\${id}', String(id)),
    method: 'delete'
  })
}`
}

// 生成Mock数据代码
const generateMockCode = () => {
  const componentName = generateConfig.componentName || 'GeneratedComponent'
  const lowerName = componentName.toLowerCase()
  
  // 生成mock数据
  const mockDataFields = fields.value.map(field => {
    let mockValue = ''
    switch (field.formType) {
      case 'number':
        mockValue = '1'
        break
      case 'date':
      case 'datetime':
        mockValue = "'2024-01-01'"
        break
      case 'switch':
        mockValue = 'true'
        break
      default:
        mockValue = `'示例${field.chineseName}'`
    }
    return `    ${field.englishName}: ${mockValue}`
  }).join(',\n')
  
  return `// Mock数据文件: /src/mock/data/${lowerName}.ts
export const mock${componentName}List = [
  {
    id: 1,
${mockDataFields}
  },
  {
    id: 2,
${mockDataFields}
  }
]

// Mock服务文件: /src/mock/services/${lowerName}.ts
import { mock${componentName}List } from '../data/${lowerName}'

export const Mock${componentName}Service = {
  get${componentName}(params?: any) {
    return {
      code: 200,
      data: {
        list: mock${componentName}List,
        total: mock${componentName}List.length
      },
      message: '获取成功'
    }
  },
  
  save${componentName}(data: any) {
    return {
      code: 200,
      data: { ...data, id: Date.now() },
      message: '创建成功'
    }
  },
  
  update${componentName}(id: string | number, data: any) {
    return {
      code: 200,
      data: { ...data, id },
      message: '更新成功'
    }
  },
  
  delete${componentName}(id: string | number) {
    return {
      code: 200,
      data: null,
      message: '删除成功'
    }
  }
}`
}

// 计算属性
const vueCode = computed(() => generateVueCode())
const apiCode = computed(() => generateApiCode())
const mockCode = computed(() => generateMockCode())

// 添加字段
const addField = () => {
  fields.value.push({
    chineseName: '',
    englishName: '',
    required: false,
    editable: true,
    addable: true,
    formType: 'input',
    searchable: false,
    sortOrder: fields.value.length
  })
}

// 删除字段
const removeField = (index: number) => {
  fields.value.splice(index, 1)
}

// 清空字段
const clearFields = async () => {
  try {
    await ElMessageBox.confirm('确定要清空所有字段吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    fields.value = []
    ElMessage.success('已清空所有字段')
  } catch {
    // 用户取消
  }
}

// 导入字段
const importFields = () => {
  fileInput.value?.click()
}

// 处理文件导入
const handleFileImport = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string)
      if (Array.isArray(data)) {
        fields.value = data
        ElMessage.success('导入成功')
      } else {
        ElMessage.error('文件格式不正确')
      }
    } catch {
      ElMessage.error('文件解析失败')
    }
  }
  reader.readAsText(file)
}

// 导出字段
const exportFields = () => {
  const dataStr = JSON.stringify(fields.value, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'fields.json'
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}

// 预览代码
const handlePreview = () => {
  if (!generateConfig.componentName) {
    ElMessage.warning('请先填写组件名称')
    return
  }
  if (fields.value.length === 0) {
    ElMessage.warning('请先添加字段')
    return
  }
  previewVisible.value = true
}

// 生成代码
const handleGenerate = async () => {
  if (!generateConfig.componentName) {
    ElMessage.warning('请先填写组件名称')
    return
  }
  if (fields.value.length === 0) {
    ElMessage.warning('请先添加字段')
    return
  }
  
  try {
    generating.value = true
    
    // 这里应该调用后端API来生成文件
    // 暂时模拟生成过程
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    ElMessage.success('代码生成成功！')
  } catch {
    ElMessage.error('生成失败')
  } finally {
    generating.value = false
  }
}
</script>

<style scoped lang="scss">
.frontend-codegen {
  padding: 20px;
  
  .page-header {
    margin-bottom: 20px;
    
    .page-title {
      font-size: 24px;
      font-weight: 600;
      margin: 0 0 8px 0;
      color: var(--el-text-color-primary);
    }
    
    .page-description {
      color: var(--el-text-color-regular);
      margin: 0;
    }
  }
  
  .config-card {
    margin-bottom: 20px;
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .card-title {
        font-weight: 600;
        color: var(--el-text-color-primary);
      }
      
      .header-actions {
        display: flex;
        gap: 8px;
      }
    }
  }
  
  .action-buttons {
    display: flex;
    justify-content: center;
    gap: 16px;
    margin-top: 30px;
  }
  
  pre {
    background: var(--el-bg-color-page);
    padding: 16px;
    border-radius: 6px;
    overflow-x: auto;
    max-height: 500px;
    
    code {
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 13px;
      line-height: 1.5;
    }
  }
}

// 暗色模式适配
.dark {
  .frontend-codegen {
    pre {
      background: var(--el-bg-color);
      border: 1px solid var(--el-border-color);
    }
  }
}
</style>