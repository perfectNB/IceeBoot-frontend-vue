<template>
  <div class="permission-management">
    <div class="page-header">
      <h2>权限管理</h2>
      <p>管理系统权限，配置权限层级结构</p>
    </div>

    <!-- 操作栏 -->
    <div class="action-section">
      <el-button
        type="primary"
        @click="handleCreate"
      >
        <el-icon><Plus /></el-icon>
        新增权限
      </el-button>
      <el-button @click="expandAll">
        <el-icon><Sort /></el-icon>
        展开全部
      </el-button>
      <el-button @click="collapseAll">
        <el-icon><Sort /></el-icon>
        收起全部
      </el-button>
    </div>

    <!-- 搜索区域 -->
    <div class="search-section">
      <el-form :model="searchForm" inline>
        <el-form-item label="权限名称">
          <el-input
            v-model="searchForm.name"
            placeholder="请输入权限名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="权限类型">
          <el-select
            v-model="searchForm.type"
            placeholder="请选择权限类型"
            clearable
            style="width: 150px"
          >
            <el-option label="菜单权限" value="menu" />
            <el-option label="按钮权限" value="button" />
            <el-option label="接口权限" value="api" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.status"
            placeholder="请选择状态"
            clearable
            style="width: 150px"
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

    <!-- 数据表格 -->
    <div class="table-section">
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
    </div>

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
const selectedPermissions = ref<Permission[]>([])
const tableRef = ref()

// 搜索表单
const searchForm = ref({
  name: '',
  type: '',
  status: ''
})

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
  const filterTree = (nodes: Permission[]): Permission[] => {
    return nodes.filter(node => {
      let matches = true
      
      // 按名称搜索
      if (searchForm.value.name) {
        matches = matches && (
          node.name.toLowerCase().includes(searchForm.value.name.toLowerCase()) ||
          node.code.toLowerCase().includes(searchForm.value.name.toLowerCase())
        )
      }
      
      // 按类型搜索
      if (searchForm.value.type) {
        matches = matches && node.type === searchForm.value.type
      }
      
      // 按状态搜索
      if (searchForm.value.status) {
        matches = matches && node.status === searchForm.value.status
      }
      
      // 如果有子节点，递归过滤
      if (node.children && node.children.length > 0) {
        const filteredChildren = filterTree(node.children)
        if (filteredChildren.length > 0) {
          return true
        }
      }
      
      return matches
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
  if (searchForm.value.name || searchForm.value.type || searchForm.value.status) {
    expandAll()
  }
}

const handleReset = () => {
  searchForm.value.name = ''
  searchForm.value.type = ''
  searchForm.value.status = ''
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

const expandParentNode = (parentId: string | number) => {
  if (tableRef.value) {
    const findAndExpandNode = (data: Permission[]) => {
      data.forEach(item => {
        if (item.id === parentId) {
          tableRef.value.toggleRowExpansion(item, true)
        }
        if (item.children && item.children.length > 0) {
          findAndExpandNode(item.children)
        }
      })
    }
    findAndExpandNode(permissions.value)
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
    
    const parentIdToExpand = formData.value.parentId
    
    if (isEdit.value) {
      await updatePermission(formData.value.id!, formData.value)
      ElMessage.success('更新权限成功')
    } else {
      await createPermission(formData.value)
      ElMessage.success('创建权限成功')
    }
    
    dialogVisible.value = false
    await loadPermissions()
    
    // 如果是新增子权限，展开父节点
    if (parentIdToExpand && !isEdit.value) {
      nextTick(() => {
        expandParentNode(parentIdToExpand)
      })
    }
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

<style scoped>
.permission-management {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  color: #303133;
}

.page-header p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.action-section {
  margin-bottom: 20px;
}

.search-section {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.table-section {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.table-section {
}

.permission-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.permission-name .permission-icon {
  color: #409eff;
}

.permission-name .type-tag {
  margin-left: auto;
}

.text-placeholder {
  color: #c0c4cc;
  font-style: italic;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.el-table .el-table__cell) {
  padding: 12px 0;
}

:deep(.el-button + .el-button) {
  margin-left: 8px;
}
</style>