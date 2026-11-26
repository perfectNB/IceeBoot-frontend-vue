<template>
  <div class="permission-management admin-page">
    <AdminPageHeader :title="t('permissionManagement.pageTitle')" :description="t('permissionManagement.pageDescription')">
      <el-button
        type="primary"
        :icon="Plus"
        @click="handleCreate"
        v-if="hasPermission('system:permission:create')"
      >
        {{ t('permissionManagement.createPermission') }}
      </el-button>
      <el-button
        type="danger"
        @click="handleBatchDelete"
        :disabled="selectedPermissions.length === 0"
        v-if="hasPermission('system:permission:delete')"
      >
        <el-icon><Delete /></el-icon>
        {{ t('permissionManagement.batchDelete') }}
      </el-button>
      <el-button
        :icon="Refresh"
        @click="loadPermissions"
      >
        {{ t('permissionManagement.refresh') }}
      </el-button>
      <el-button @click="expandAll">
        <el-icon><Sort /></el-icon>
        {{ t('permissionManagement.expandAll') }}
      </el-button>
      <el-button @click="collapseAll">
        <el-icon><Sort /></el-icon>
        {{ t('permissionManagement.collapseAll') }}
      </el-button>
    </AdminPageHeader>

    <!-- 搜索区域 -->
    <div class="search-section">
      <el-form :model="searchForm" :inline="true">
        <el-form-item :label="t('permissionManagement.permissionName')">
          <el-input
            v-model="searchForm.name"
            :placeholder="t('permissionManagement.placeholderPermissionName')"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item :label="t('permissionManagement.type')">
          <el-select
            v-model="searchForm.type"
            :placeholder="t('permissionManagement.placeholderType')"
            clearable
            style="width: 150px"
          >
            <el-option :label="t('permissionManagement.typeMenu')" value="menu" />
            <el-option :label="t('permissionManagement.typeButton')" value="button" />
            <el-option :label="t('permissionManagement.typeApi')" value="api" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('permissionManagement.status')">
          <el-select
            v-model="searchForm.status"
            :placeholder="t('permissionManagement.placeholderStatus')"
            clearable
            style="width: 120px"
          >
            <el-option :label="t('permissionManagement.active')" value="active" />
            <el-option :label="t('permissionManagement.inactive')" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">
            {{ t('permissionManagement.search') }}
          </el-button>
          <el-button :icon="Refresh" @click="handleReset">
            {{ t('permissionManagement.reset') }}
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
        <el-table-column prop="name" :label="t('permissionManagement.permissionName')" min-width="275">
          <template #default="{ row }">
            <el-icon v-if="getPermissionIcon(row.type)" class="permission-icon">
              <component :is="getPermissionIcon(row.type)" />
            </el-icon>
            {{ row.name }}
          </template>
        </el-table-column>
        <el-table-column prop="code" :label="t('permissionManagement.permissionCode')" min-width="200" />
        <el-table-column prop="type" :label="t('permissionManagement.type')" width="100">
          <template #default="{ row }">
            <el-tag :type="getPermissionTypeTag(row.type)">
              {{ getPermissionTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="path" :label="t('permissionManagement.apiPath')" min-width="255">
          <template #default="{ row }">
            <span v-if="row.path">{{ row.path }}</span>
            <span v-else class="text-gray-400">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="method" :label="t('permissionManagement.requestMethod')" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.method" :type="getMethodTagType(row.method)" size="small">
              {{ row.method }}
            </el-tag>
            <span v-else class="text-gray-400">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="sort" :label="t('permissionManagement.sort')" width="80" />
        <el-table-column :label="t('permissionManagement.status')" width="80">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="'active'"
              :inactive-value="'inactive'"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="description" :label="t('permissionManagement.description')" min-width="150">
          <template #default="{ row }">
            <span v-if="row.description">{{ row.description }}</span>
            <span v-else class="text-gray-400">-</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('permissionManagement.operation')" width="280" fixed="right">
          <template #default="{ row }">
            <el-button
              type="success"
              size="small"
              :icon="Plus"
              @click="handleCreateChild(row)"
              v-if="hasPermission('system:permission:create') && row.type === 'menu'"
            >
              {{ t('permissionManagement.addChildPermission') }}
            </el-button>
            <el-button
              type="primary"
              size="small"
              :icon="Edit"
              @click="handleEdit(row)"
              v-if="hasPermission('system:permission:edit')"
            >
              {{ t('permissionManagement.edit') }}
            </el-button>
            <el-button
              type="danger"
              size="small"
              :icon="Delete"
              @click="handleDelete(row)"
              v-if="hasPermission('system:permission:delete')"
            >
              {{ t('permissionManagement.delete') }}
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
        <el-form-item :label="t('permissionManagement.parentPermission')">
          <el-tree-select
            v-model="formData.parentId"
            :data="parentPermissionOptions"
            :placeholder="t('permissionManagement.placeholderParentPermission')"
            clearable
            check-strictly
            :render-after-expand="false"
            style="width: 100%"
            node-key="value"
            :props="treeSelectProps"
          />
        </el-form-item>
        <el-form-item :label="t('permissionManagement.permissionName')" prop="name">
          <el-input v-model="formData.name" :placeholder="t('permissionManagement.placeholderPermissionName')" />
        </el-form-item>
        <el-form-item :label="t('permissionManagement.permissionCode')" prop="code">
          <el-input v-model="formData.code" :placeholder="t('permissionManagement.placeholderPermissionCode')" />
        </el-form-item>
        <el-form-item :label="t('permissionManagement.type')" prop="type">
          <el-select v-model="formData.type" :placeholder="t('permissionManagement.placeholderType')" @change="handleTypeChange">
            <el-option :label="t('permissionManagement.typeMenu')" value="menu" />
            <el-option :label="t('permissionManagement.typeButton')" value="button" />
            <el-option :label="t('permissionManagement.typeApi')" value="api" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('permissionManagement.apiPath')" prop="path" v-if="formData.type === 'api'">
          <el-input v-model="formData.path" :placeholder="t('permissionManagement.placeholderApiPath')" />
        </el-form-item>
        <el-form-item :label="t('permissionManagement.requestMethod')" prop="method" v-if="formData.type === 'api'">
          <el-select v-model="formData.method" :placeholder="t('permissionManagement.placeholderRequestMethod')">
            <el-option label="GET" value="GET" />
            <el-option label="POST" value="POST" />
            <el-option label="PUT" value="PUT" />
            <el-option label="DELETE" value="DELETE" />
            <el-option label="PATCH" value="PATCH" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('permissionManagement.sort')" prop="sort">
          <el-input-number v-model="formData.sort" :min="0" />
        </el-form-item>
        <el-form-item :label="t('permissionManagement.status')">
          <el-switch
            v-model="formData.status"
            :active-value="'active'"
            :inactive-value="'inactive'"
          />
        </el-form-item>
        <el-form-item :label="t('permissionManagement.description')" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            :placeholder="t('permissionManagement.placeholderDescription')"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ t('permissionManagement.cancel') }}</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ t('permissionManagement.confirm') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import AdminPageHeader from '@/components/common/AdminPageHeader.vue'
import { ref, computed, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
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

const { t } = useI18n()
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
    return t('permissionManagement.addChildPermissionTitle', { name: parentPermission.value?.name })
  }
  return isEdit.value ? t('permissionManagement.editPermissionTitle') : t('permissionManagement.createPermissionTitle')
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
    { required: true, message: t('permissionManagement.validationPermissionName'), trigger: 'blur' },
    { min: 2, max: 50, message: t('permissionManagement.validationPermissionNameLength'), trigger: 'blur' }
  ],
  code: [
    { required: true, message: t('permissionManagement.validationPermissionCode'), trigger: 'blur' },
    { pattern: /^[a-zA-Z][a-zA-Z0-9:_-]*$/, message: t('permissionManagement.validationPermissionCodeFormat'), trigger: 'blur' }
  ],
  type: [
    { required: true, message: t('permissionManagement.validationType'), trigger: 'change' }
  ],
  path: [
    { required: true, message: t('permissionManagement.validationApiPath'), trigger: 'blur' }
  ],
  method: [
    { required: true, message: t('permissionManagement.validationRequestMethod'), trigger: 'change' }
  ],
  description: [
    { max: 200, message: t('permissionManagement.validationDescriptionLength'), trigger: 'blur' }
  ]
}

// 方法
const loadPermissions = async () => {
  try {
    loading.value = true
    permissions.value = await getAllPermissions()
  } catch {
    ElMessage.error(t('permissionManagement.loadPermissionsFailed'))
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
      t('permissionManagement.batchDeleteConfirm', { count: selectedPermissions.value.length }),
      t('permissionManagement.batchDeleteTitle'),
      {
        confirmButtonText: t('permissionManagement.confirm'),
        cancelButtonText: t('permissionManagement.cancel'),
        type: 'warning'
      }
    )

    // 批量删除权限
    const permissionIds = selectedPermissions.value.map(permission => permission.id)
    await deletePermissions(permissionIds)

    ElMessage.success(t('permissionManagement.batchDeleteSuccess', { count: selectedPermissions.value.length }))
    selectedPermissions.value = []
    await loadPermissions()
  } catch (error) {
      if (error !== 'cancel') {
        ElMessage.error(t('permissionManagement.batchDeleteFailed'))
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
      ElMessage.success(t('permissionManagement.updateSuccess'))
    } else {
      await createPermission(formData.value)
      ElMessage.success(t('permissionManagement.createSuccess'))
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
    ElMessage.error(isEdit.value ? t('permissionManagement.updateFailed') : t('permissionManagement.createFailed'))
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (permission: Permission) => {
  try {
    await ElMessageBox.confirm(
      t('permissionManagement.deleteConfirm', { name: permission.name }),
      t('permissionManagement.deleteTitle'),
      {
        confirmButtonText: t('permissionManagement.confirm'),
        cancelButtonText: t('permissionManagement.cancel'),
        type: 'warning'
      }
    )

    await deletePermission(permission.id)
    ElMessage.success(t('permissionManagement.deleteSuccess'))
    await loadPermissions()
  } catch (error: unknown) {
    if (error !== 'cancel') {
      ElMessage.error(t('permissionManagement.deleteFailed'))
    }
  }
}

const handleStatusChange = async (permission: Permission) => {
  try {
    await updatePermission(permission.id, { status: permission.status })
    ElMessage.success(t('permissionManagement.statusUpdateSuccess'))
  } catch {
    ElMessage.error(t('permissionManagement.statusUpdateFailed'))
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
      return t('permissionManagement.typeMenu')
    case 'button':
      return t('permissionManagement.typeButton')
    case 'api':
      return t('permissionManagement.typeApi')
    default:
      return t('permissionManagement.typeUnknown')
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
