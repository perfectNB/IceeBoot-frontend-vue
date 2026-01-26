<template>
  <div class="permission-management">
    <div class="page-header">
      <h2>权限管理</h2>
      <p>管理系统权限结构和访问控制</p>
    </div>

    <!-- 操作区域 -->
    <div class="action-section">
      <el-button
        type="primary"
        :icon="Plus"
        @click="handleCreate"
        v-if="hasPermission('system:permission:create')"
      >
        新增权限
      </el-button>
      <el-button
        type="danger"
        @click="handleBatchDelete"
        :disabled="selectedPermissions.length === 0"
        v-if="hasPermission('system:permission:delete')"
      >
        <el-icon><Delete /></el-icon>
        批量删除
      </el-button>
      <el-button
        :icon="Refresh"
        @click="loadPermissions"
      >
        刷新
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
      <el-form :model="searchForm" :inline="true">
        <el-form-item label="权限名称">
          <el-input
            v-model="searchForm.name"
            placeholder="请输入权限名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="类型">
          <el-select
            v-model="searchForm.type"
            placeholder="请选择类型"
            clearable
            style="width: 150px"
          >
            <el-option label="菜单" value="menu" />
            <el-option label="按钮" value="button" />
            <el-option label="接口" value="api" />
          </el-select>
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
          <el-button type="primary" :icon="Search" @click="handleSearch">
            搜索
          </el-button>
          <el-button :icon="Refresh" @click="handleReset">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 表格区域 -->
    <div class="table-section">
      <el-table
        ref="tableRef"
        :data="filteredPermissions"
        v-loading="loading"
        row-key="id"
        default-expand-all
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        border
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="40" />
        <el-table-column prop="name" label="权限名称" min-width="275">
          <template #default="{ row }">
            <el-icon v-if="getPermissionIcon(row.type)" class="permission-icon">
              <component :is="getPermissionIcon(row.type)" />
            </el-icon>
            {{ row.name }}
          </template>
        </el-table-column>
        <el-table-column prop="code" label="权限编码" min-width="200" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getPermissionTypeTag(row.type)">
              {{ getPermissionTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="path" label="接口路径" min-width="255">
          <template #default="{ row }">
            <span v-if="row.path">{{ row.path }}</span>
            <span v-else class="text-gray-400">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="method" label="请求方法" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.method" :type="getMethodTagType(row.method)" size="small">
              {{ row.method }}
            </el-tag>
            <span v-else class="text-gray-400">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="'active'"
              :inactive-value="'inactive'"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="150">
          <template #default="{ row }">
            <span v-if="row.description">{{ row.description }}</span>
            <span v-else class="text-gray-400">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button
              type="success"
              size="small"
              :icon="Plus"
              @click="handleCreateChild(row)"
              v-if="hasPermission('system:permission:create') && row.type === 'menu'"
            >
              添加子权限
            </el-button>
            <el-button
              type="primary"
              size="small"
              :icon="Edit"
              @click="handleEdit(row)"
              v-if="hasPermission('system:permission:edit')"
            >
              编辑
            </el-button>
            <el-button
              type="danger"
              size="small"
              :icon="Delete"
              @click="handleDelete(row)"
              v-if="hasPermission('system:permission:delete')"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="600px"
      @close="resetFormData"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="父级权限">
          <el-tree-select
            v-model="formData.parentId"
            :data="parentPermissionOptions"
            placeholder="请选择父级权限（不选择则为顶级权限）"
            clearable
            check-strictly
            :render-after-expand="false"
            style="width: 100%"
            node-key="value"
            :props="treeSelectProps"
          />
        </el-form-item>
        <el-form-item label="权限名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入权限名称" />
        </el-form-item>
        <el-form-item label="权限编码" prop="code">
          <el-input v-model="formData.code" placeholder="请输入权限编码" />
        </el-form-item>
        <el-form-item label="权限类型" prop="type">
          <el-select v-model="formData.type" placeholder="请选择类型" @change="handleTypeChange">
            <el-option label="菜单" value="menu" />
            <el-option label="按钮" value="button" />
            <el-option label="接口" value="api" />
          </el-select>
        </el-form-item>
        <el-form-item label="接口路径" prop="path" v-if="formData.type === 'api'">
          <el-input v-model="formData.path" placeholder="请输入接口路径" />
        </el-form-item>
        <el-form-item label="请求方法" prop="method" v-if="formData.type === 'api'">
          <el-select v-model="formData.method" placeholder="请选择请求方法">
            <el-option label="GET" value="GET" />
            <el-option label="POST" value="POST" />
            <el-option label="PUT" value="PUT" />
            <el-option label="DELETE" value="DELETE" />
            <el-option label="PATCH" value="PATCH" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="formData.sort" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch
            v-model="formData.status"
            :active-value="'active'"
            :inactive-value="'inactive'"
          />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入权限描述"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          确定
        </el-button>
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
import { getAllPermissions, createPermission, updatePermission, deletePermission, deletePermissions } from '@/api/permission'
import type { Permission } from '@/types'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

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
  sort: 0,
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
  } catch {
    ElMessage.error('获取权限列表失败')
  } finally {
    loading.value = false
  }
}

// 权限检查
const hasPermission = (permission: string) => {
  return userStore.hasPermission(permission)
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

// 批量删除权限
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedPermissions.value.length} 个权限吗？`,
      '批量删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 批量删除权限
    const permissionIds = selectedPermissions.value.map(permission => permission.id)
    await deletePermissions(permissionIds)

    ElMessage.success(`成功删除 ${selectedPermissions.value.length} 个权限`)
    selectedPermissions.value = []
    await loadPermissions()
  } catch (error) {
      if (error !== 'cancel') {
        ElMessage.error('批量删除权限失败')
      }
    }
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
    sort: 0,
    status: 'active'
  }
  formRef.value?.clearValidate()
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
  try {
    await formRef.value?.validate()
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
  } catch {
    ElMessage.error(isEdit.value ? '更新权限失败' : '创建权限失败')
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (permission: Permission) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除权限 "${permission.name}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await deletePermission(permission.id)
    ElMessage.success('删除权限成功')
    await loadPermissions()
  } catch (error: unknown) {
    if (error !== 'cancel') {
      ElMessage.error('删除权限失败')
    }
  }
}

const handleStatusChange = async (permission: Permission) => {
  try {
    await updatePermission(permission.id, { status: permission.status })
    ElMessage.success('状态更新成功')
  } catch {
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
  color: var(--text-primary);
}

.page-header p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.action-section {
  margin-bottom: 20px;
}

.search-section {
  background: var(--bg-color);
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.table-section {
  background: var(--bg-color);
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.permission-icon {
  margin-right: 8px;
  color: #409eff;
}

.text-gray-400 {
  color: var(--text-secondary);
}

:deep(.el-table .el-table__cell) {
  padding: 12px 0;
}

:deep(.el-button + .el-button) {
  margin-left: 8px;
}
</style>
