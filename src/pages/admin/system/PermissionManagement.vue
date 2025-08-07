<template>
  <div class="permission-management">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">权限管理</h2>
      <p class="page-description">管理系统权限，配置权限层级结构</p>
    </div>

    <!-- 操作栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleCreate">
          新增权限
        </el-button>
        <el-button :icon="Refresh" @click="loadPermissions">
          刷新
        </el-button>
        <el-button :icon="Sort" @click="expandAll">
          展开全部
        </el-button>
        <el-button :icon="Sort" @click="collapseAll">
          收起全部
        </el-button>
      </div>
      <div class="toolbar-right">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索权限名称或编码"
          :prefix-icon="Search"
          clearable
          style="width: 300px"
          @input="handleSearch"
        />
      </div>
    </div>

    <!-- 权限树表格 -->
    <el-card class="table-card">
      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="filteredPermissions"
        row-key="id"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        :default-expand-all="false"
        stripe
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="权限名称" min-width="200">
          <template #default="{ row }">
            <div class="permission-name">
              <el-icon v-if="getPermissionIcon(row.type)" class="permission-icon">
                <component :is="getPermissionIcon(row.type)" />
              </el-icon>
              <span>{{ row.name }}</span>
              <el-tag :type="getPermissionTypeTag(row.type)" size="small" class="type-tag">
                {{ getPermissionTypeText(row.type) }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="code" label="权限编码" min-width="180" show-overflow-tooltip />
        <el-table-column prop="path" label="路径/接口" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.path">{{ row.path }}</span>
            <span v-else class="text-placeholder">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="method" label="请求方法" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.method" :type="getMethodTagType(row.method)" size="small">
              {{ row.method }}
            </el-tag>
            <span v-else class="text-placeholder">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.description">{{ row.description }}</span>
            <span v-else class="text-placeholder">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              active-value="active"
              inactive-value="inactive"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              :icon="Plus"
              @click="handleCreateChild(row)"
              v-if="row.type === 'menu'"
            >
              添加子权限
            </el-button>
            <el-button
              type="warning"
              size="small"
              :icon="Edit"
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              type="danger"
              size="small"
              :icon="Delete"
              @click="handleDelete(row)"
              :disabled="row.children && row.children.length > 0"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑权限对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="权限名称" prop="name">
              <el-input
                v-model="formData.name"
                placeholder="请输入权限名称"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="权限编码" prop="code">
              <el-input
                v-model="formData.code"
                placeholder="请输入权限编码"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="权限类型" prop="type">
              <el-select
                v-model="formData.type"
                placeholder="请选择权限类型"
                style="width: 100%"
                @change="handleTypeChange"
              >
                <el-option label="菜单权限" value="menu" />
                <el-option label="按钮权限" value="button" />
                <el-option label="接口权限" value="api" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="上级权限" prop="parentId">
              <el-tree-select
                v-model="formData.parentId"
                :data="parentPermissionOptions"
                :props="treeSelectProps"
                placeholder="请选择上级权限"
                style="width: 100%"
                clearable
                check-strictly
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20" v-if="formData.type !== 'button'">
          <el-col :span="12">
            <el-form-item label="路径" :prop="formData.type === 'api' ? 'path' : ''">
              <el-input
                v-model="formData.path"
                :placeholder="formData.type === 'menu' ? '菜单路径（可选）' : '接口路径'"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="formData.type === 'api'">
            <el-form-item label="请求方法" prop="method">
              <el-select
                v-model="formData.method"
                placeholder="请选择请求方法"
                style="width: 100%"
              >
                <el-option label="GET" value="GET" />
                <el-option label="POST" value="POST" />
                <el-option label="PUT" value="PUT" />
                <el-option label="DELETE" value="DELETE" />
                <el-option label="PATCH" value="PATCH" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入权限描述"
          />
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio label="active">启用</el-radio>
            <el-radio label="inactive">禁用</el-radio>
          </el-radio-group>
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
import { ref, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  Plus,
  Refresh,
  Search,
  Edit,
  Delete,
  Sort,
  Menu,
  Operation,
  Link
} from '@element-plus/icons-vue'
import { getAllPermissions, createPermission, updatePermission, deletePermission } from '@/api/permission'
import type { Permission } from '@/types'

// 响应式数据
const loading = ref(false)
const permissions = ref<Permission[]>([])
const searchKeyword = ref('')
const selectedPermissions = ref<Permission[]>([])
const tableRef = ref()

// 对话框
const dialogVisible = ref(false)
const isEdit = ref(false)
const isCreateChild = ref(false)
const parentPermission = ref<Permission | null>(null)
const submitting = ref(false)
const formRef = ref<FormInstance>()

// 表单数据
const formData = ref<Partial<Permission>>({
  name: '',
  code: '',
  type: 'menu',
  parentId: null,
  path: '',
  method: undefined,
  description: '',
  status: 'active'
})

// 计算属性
const dialogTitle = computed(() => {
  if (isCreateChild.value) {
    return `为 "${parentPermission.value?.name}" 添加子权限`
  }
  return isEdit.value ? '编辑权限' : '新增权限'
})

const filteredPermissions = computed(() => {
  if (!searchKeyword.value) return permissions.value
  
  const filterTree = (nodes: Permission[]): Permission[] => {
    return nodes.filter(node => {
      const matchesKeyword = 
        node.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
        node.code.toLowerCase().includes(searchKeyword.value.toLowerCase())
      
      if (node.children && node.children.length > 0) {
        const filteredChildren = filterTree(node.children)
        if (filteredChildren.length > 0) {
          return true
        }
      }
      
      return matchesKeyword
    }).map(node => {
      if (node.children && node.children.length > 0) {
        return {
          ...node,
          children: filterTree(node.children)
        }
      }
      return node
    })
  }
  
  return filterTree(permissions.value)
})

interface TreeSelectOption {
  value: string | number
  label: string
  disabled?: boolean
  children?: TreeSelectOption[]
}

const parentPermissionOptions = computed(() => {
  const buildOptions = (nodes: Permission[], level = 0): TreeSelectOption[] => {
    return nodes.map(node => ({
      value: node.id,
      label: node.name,
      disabled: isEdit.value && node.id === formData.value.id,
      children: node.children && node.children.length > 0 ? buildOptions(node.children, level + 1) : undefined
    }))
  }
  
  return buildOptions(permissions.value.filter(p => p.type === 'menu'))
})

const treeSelectProps = {
  children: 'children',
  label: 'label',
  value: 'value'
}

// 表单验证规则
const formRules: FormRules = {
  name: [
    { required: true, message: '请输入权限名称', trigger: 'blur' },
    { min: 2, max: 50, message: '权限名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入权限编码', trigger: 'blur' },
    { pattern: /^[a-zA-Z][a-zA-Z0-9:_-]*$/, message: '权限编码只能包含字母、数字、冒号、下划线和连字符，且必须以字母开头', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择权限类型', trigger: 'change' }
  ],
  path: [
    { required: true, message: '请输入接口路径', trigger: 'blur' }
  ],
  method: [
    { required: true, message: '请选择请求方法', trigger: 'change' }
  ],
  description: [
    { max: 200, message: '描述不能超过 200 个字符', trigger: 'blur' }
  ]
}

// 方法
const loadPermissions = async () => {
  try {
    loading.value = true
    permissions.value = await getAllPermissions()
  } catch (error) {
    console.error('获取权限列表失败:', error)
    ElMessage.error('获取权限列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  // 搜索时展开所有节点以便查看结果
  if (searchKeyword.value) {
    expandAll()
  }
}

const handleSelectionChange = (selection: Permission[]) => {
  selectedPermissions.value = selection
}

const expandAll = () => {
  if (tableRef.value) {
    const expandAllNodes = (data: Permission[]) => {
      data.forEach(item => {
        tableRef.value.toggleRowExpansion(item, true)
        if (item.children && item.children.length > 0) {
          expandAllNodes(item.children)
        }
      })
    }
    expandAllNodes(filteredPermissions.value)
  }
}

const collapseAll = () => {
  if (tableRef.value) {
    const collapseAllNodes = (data: Permission[]) => {
      data.forEach(item => {
        tableRef.value.toggleRowExpansion(item, false)
        if (item.children && item.children.length > 0) {
          collapseAllNodes(item.children)
        }
      })
    }
    collapseAllNodes(filteredPermissions.value)
  }
}

const handleCreate = () => {
  isEdit.value = false
  isCreateChild.value = false
  parentPermission.value = null
  resetFormData()
  dialogVisible.value = true
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

const handleCreateChild = (parent: Permission) => {
  isEdit.value = false
  isCreateChild.value = true
  parentPermission.value = parent
  resetFormData()
  formData.value.parentId = parent.id
  formData.value.type = 'button' // 子权限默认为按钮类型
  dialogVisible.value = true
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

const handleEdit = (permission: Permission) => {
  isEdit.value = true
  isCreateChild.value = false
  parentPermission.value = null
  formData.value = { ...permission }
  dialogVisible.value = true
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

const resetFormData = () => {
  formData.value = {
    name: '',
    code: '',
    type: 'menu',
    parentId: null,
    path: '',
    method: undefined,
    description: '',
    status: 'active'
  }
}

const handleTypeChange = () => {
  // 类型改变时清空相关字段
  if (formData.value.type === 'button') {
    formData.value.path = ''
    formData.value.method = undefined
  } else if (formData.value.type === 'menu') {
    formData.value.method = undefined
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    
    if (isEdit.value) {
      await updatePermission(formData.value.id!, formData.value)
      ElMessage.success('更新权限成功')
    } else {
      await createPermission(formData.value)
      ElMessage.success('创建权限成功')
    }
    
    dialogVisible.value = false
    await loadPermissions()
  } catch (error) {
    console.error('保存权限失败:', error)
    ElMessage.error('保存权限失败')
  } finally {
    submitting.value = false
  }
}

const handleDelete = (permission: Permission) => {
  ElMessageBox.confirm(
    `确定要删除权限 "${permission.name}" 吗？`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await deletePermission(permission.id)
      ElMessage.success('删除权限成功')
      await loadPermissions()
    } catch (error) {
      console.error('删除权限失败:', error)
      ElMessage.error('删除权限失败')
    }
  })
}

const handleStatusChange = async (permission: Permission) => {
  try {
    await updatePermission(permission.id, { status: permission.status })
    ElMessage.success('状态更新成功')
  } catch (error) {
    console.error('状态更新失败:', error)
    ElMessage.error('状态更新失败')
    // 恢复原状态
    permission.status = permission.status === 'active' ? 'inactive' : 'active'
  }
}

const getPermissionIcon = (type: string) => {
  switch (type) {
    case 'menu':
      return Menu
    case 'button':
      return Operation
    case 'api':
      return Link
    default:
      return null
  }
}

const getPermissionTypeTag = (type: string) => {
  switch (type) {
    case 'menu':
      return 'primary'
    case 'button':
      return 'success'
    case 'api':
      return 'warning'
    default:
      return 'info'
  }
}

const getPermissionTypeText = (type: string) => {
  switch (type) {
    case 'menu':
      return '菜单'
    case 'button':
      return '按钮'
    case 'api':
      return '接口'
    default:
      return '未知'
  }
}

const getMethodTagType = (method: string) => {
  switch (method) {
    case 'GET':
      return 'success'
    case 'POST':
      return 'primary'
    case 'PUT':
      return 'warning'
    case 'DELETE':
      return 'danger'
    case 'PATCH':
      return 'info'
    default:
      return 'info'
  }
}

const formatDate = (date: string | Date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

// 生命周期
onMounted(() => {
  loadPermissions()
})
</script>

<style scoped lang="scss">
.permission-management {
  padding: var(--content-padding);
}

.page-header {
  margin-bottom: 24px;
  
  .page-title {
    font-size: 24px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 8px 0;
  }
  
  .page-description {
    color: var(--text-secondary);
    margin: 0;
  }
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  
  .toolbar-left {
    display: flex;
    gap: 12px;
  }
}

.table-card {
  .permission-name {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .permission-icon {
      color: var(--primary-color);
    }
    
    .type-tag {
      margin-left: auto;
    }
  }
  
  .text-placeholder {
    color: var(--text-placeholder);
    font-style: italic;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

// 响应式设计
@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
    
    .toolbar-left {
      flex-wrap: wrap;
    }
    
    .toolbar-right {
      .el-input {
        width: 100% !important;
      }
    }
  }
  
  .table-card {
    :deep(.el-table) {
      .el-table__body-wrapper {
        overflow-x: auto;
      }
    }
  }
}
</style>