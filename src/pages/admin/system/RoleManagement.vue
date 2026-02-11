<template>
  <div class="role-management">
    <div class="page-header">
      <h2>{{ t('roleManagement.pageTitle') }}</h2>
      <p>{{ t('roleManagement.pageDescription') }}</p>
    </div>

    <!-- 操作栏 -->
    <div class="action-section">
      <el-button
        type="primary"
        @click="handleCreate"
        v-if="hasPermission('system:role:create')"
      >
        <el-icon><Plus /></el-icon>
        {{ t('roleManagement.createRole') }}
      </el-button>
      <el-button
        type="danger"
        @click="handleBatchDelete"
        :disabled="selectedRoles.length === 0"
        v-if="hasPermission('system:role:delete')"
      >
        <el-icon><Delete /></el-icon>
        {{ t('roleManagement.batchDelete') }}
      </el-button>
    </div>

    <!-- 搜索区域 -->
    <div class="search-section">
      <el-form :model="searchForm" inline>
        <el-form-item :label="t('roleManagement.roleName')">
          <el-input
            v-model="searchForm.name"
            :placeholder="t('roleManagement.placeholderRoleName')"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item :label="t('roleManagement.status')">
          <el-select
            v-model="searchForm.status"
            :placeholder="t('roleManagement.placeholderStatus')"
            clearable
            style="width: 150px"
          >
            <el-option :label="t('roleManagement.active')" value="active" />
            <el-option :label="t('roleManagement.inactive')" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" :loading="loading">
            <el-icon><Search /></el-icon>
            {{ t('roleManagement.search') }}
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            {{ t('roleManagement.reset') }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 数据表格 -->
    <div class="table-section">
      <el-table
        v-loading="loading"
        :data="roles"
        stripe
        border
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" :label="t('roleManagement.roleName')" min-width="120">
          <template #default="{ row }">
            <el-tag :type="getRoleTagType(row.name)" effect="light">
              {{ row.name }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="code" :label="t('roleManagement.roleCode')" min-width="120" />
        <el-table-column prop="description" :label="t('roleManagement.description')" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" :label="t('roleManagement.status')" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="'active'"
              :inactive-value="'inactive'"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="createTime" :label="t('roleManagement.createTime')" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('roleManagement.operation')" width="350" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              :icon="Key"
              @click="handlePermissions(row)"
              v-if="hasPermission('system:role:permission:view')"
            >
              {{ t('roleManagement.permissions') }}
            </el-button>
            <el-button
              type="info"
              size="small"
              :icon="Menu"
              @click="handleMenus(row)"
              v-if="hasPermission('system:role:menu:view')"
            >
              {{ t('roleManagement.menus') }}
            </el-button>
            <el-button
              type="warning"
              size="small"
              :icon="Edit"
              @click="handleEdit(row)"
              v-if="hasPermission('system:role:edit')"
            >
              {{ t('roleManagement.edit') }}
            </el-button>
            <el-button
              type="danger"
              size="small"
              :icon="Delete"
              @click="handleDelete(row)"
              :disabled="row.name === 'admin'"
              v-if="hasPermission('system:role:delete')"
            >
              {{ t('roleManagement.delete') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

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
    </div>

    <!-- 新增/编辑角色对话框 -->
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
        label-width="80px"
      >
        <el-form-item :label="t('roleManagement.roleName')" prop="name">
          <el-input
            v-model="formData.name"
            :placeholder="t('roleManagement.placeholderRoleName')"
            :disabled="isEdit && formData.name === 'admin'"
          />
        </el-form-item>
        <el-form-item :label="t('roleManagement.roleCode')" prop="code">
          <el-input
            v-model="formData.code"
            :placeholder="t('roleManagement.placeholderRoleCode')"
            :disabled="isEdit"
          />
        </el-form-item>
        <el-form-item :label="t('roleManagement.description')" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            :placeholder="t('roleManagement.placeholderDescription')"
          />
        </el-form-item>
        <el-form-item :label="t('roleManagement.status')" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio label="active">{{ t('roleManagement.active') }}</el-radio>
            <el-radio label="inactive">{{ t('roleManagement.inactive') }}</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">{{ t('roleManagement.cancel') }}</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            {{ t('roleManagement.confirm') }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 权限配置对话框 -->
    <el-dialog
      v-model="permissionDialogVisible"
      :title="t('roleManagement.permissionConfigTitle')"
      width="800px"
      :close-on-click-modal="false"
    >
      <div class="permission-content">
        <div class="permission-header">
          <span class="role-name">{{ t('roleManagement.roleLabel') }}{{ currentRole?.name }}</span>
          <el-button type="primary" size="small" @click="handleSavePermissions">
            {{ t('roleManagement.savePermissions') }}
          </el-button>
        </div>
        <el-tree
          ref="permissionTreeRef"
          :data="permissionTree"
          :props="treeProps"
          show-checkbox
          node-key="id"
          :default-checked-keys="checkedPermissions"
          class="permission-tree"
        />
      </div>
    </el-dialog>

    <!-- 菜单配置对话框 -->
    <el-dialog
      v-model="menuDialogVisible"
      :title="t('roleManagement.menuConfigTitle')"
      width="800px"
      :close-on-click-modal="false"
    >
      <div class="permission-content">
        <div class="permission-header">
          <span class="role-name">{{ t('roleManagement.roleLabel') }}{{ currentRole?.name }}</span>
          <el-button type="primary" size="small" @click="handleSaveMenus">
            {{ t('roleManagement.saveMenus') }}
          </el-button>
        </div>
        <el-tree
          ref="menuTreeRef"
          :data="menuTree"
          :props="treeProps"
          show-checkbox
          node-key="id"
          :default-checked-keys="checkedMenus"
          class="permission-tree"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  Plus,
  Refresh,
  Search,
  Edit,
  Delete,
  Key,
  Menu
} from '@element-plus/icons-vue'
import { getRoles, createRole, updateRole, deleteRole, deleteRoles, saveRolePermissions, getRoleById, updateRoleStatus,saveRoleMenus } from '@/api/role'
import { getAllPermissions } from '@/api/permission'
import { getAllMenus } from '@/api/menu'
import { hasPermission } from '@/utils/permission'
import type { Role, Permission, MenuItem as MenuType } from '@/types'

const { t } = useI18n()

// 响应式数据
const loading = ref(false)
const roles = ref<Role[]>([])
const permissions = ref<Permission[]>([])
const menus = ref<MenuType[]>([])
const selectedRoles = ref<Role[]>([])

// 搜索表单
const searchForm = ref({
  name: '',
  status: ''
})

// 分页
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const pages = ref(0)

// 对话框
const dialogVisible = ref(false)
const permissionDialogVisible = ref(false)
const menuDialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()
const permissionTreeRef = ref()
const menuTreeRef = ref()

// 表单数据
const formData = ref<Partial<Role>>({
  name: '',
  code: '',
  description: '',
  status: 'active'
})

// 权限相关
const currentRole = ref<Role | null>(null)
const checkedPermissions = ref<string[]>([])
const checkedMenus = ref<string[]>([])

// 计算属性
const dialogTitle = computed(() => isEdit.value ? t('roleManagement.editRoleTitle') : t('roleManagement.createRoleTitle'))

// 注意：搜索和过滤现在由后端处理，通过loadRoles中的keyword参数实现

const permissionTree = computed(() => {
  // 直接使用后端返回的权限树结构，转换为Element Plus Tree组件需要的格式
  interface TreeNode {
    id: number
    label: string
    children: TreeNode[]
  }

  const convertToTreeFormat = (nodes: Permission[]): TreeNode[] => {
    return nodes.map(node => ({
      id: Number(node.id),
      label: node.name,
      children: node.children ? convertToTreeFormat(node.children) : []
    }))
  }

  return convertToTreeFormat(permissions.value)
})

const menuTree = computed(() => {
  // 菜单树结构，转换为Element Plus Tree组件需要的格式
  interface MenuTreeNode {
    id: number
    label: string
    children: MenuTreeNode[]
  }

  const convertMenuToTreeFormat = (nodes: MenuType[]): MenuTreeNode[] => {
    return nodes.map(node => ({
      id: Number(node.id),
      label: node.title,
      children: node.children ? convertMenuToTreeFormat(node.children) : []
    }))
  }

  return convertMenuToTreeFormat(menus.value)
})

const treeProps = {
  children: 'children',
  label: 'label'
}

// 表单验证规则
const formRules: FormRules = {
  name: [
    { required: true, message: t('roleManagement.validationRoleName'), trigger: 'blur' },
    { min: 2, max: 20, message: t('roleManagement.validationRoleNameLength'), trigger: 'blur' }
  ],
  code: [
    { required: true, message: t('roleManagement.validationRoleCode'), trigger: 'blur' },
    { min: 2, max: 50, message: t('roleManagement.validationRoleCodeLength'), trigger: 'blur' },
    { pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/, message: t('roleManagement.validationRoleCodeFormat'), trigger: 'blur' }
  ],
  description: [
    { max: 200, message: t('roleManagement.validationDescriptionLength'), trigger: 'blur' }
  ]
}

// 方法
const loadRoles = async () => {
  loading.value = true
  try {
    console.log('发送分页参数:', {
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      name: searchForm.value.name,
      status: searchForm.value.status
    })
    const result = await getRoles({
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      name: searchForm.value.name,
      status: searchForm.value.status
    })
    console.log('API返回结果:', result)
    roles.value = result.records
    total.value = result.total
    pages.value = result.pages
    currentPage.value = result.current
    pageSize.value = result.size
  } catch (error) {
    console.error('获取角色列表失败:', error)
    ElMessage.error(t('roleManagement.loadRolesFailed'))
  } finally {
    loading.value = false
  }
}

const loadPermissions = async () => {
  try {
    permissions.value = await getAllPermissions()
  } catch (error) {
    console.error('获取权限列表失败:', error)
    ElMessage.error(t('roleManagement.loadPermissionsFailed'))
  }
}

const loadMenus = async () => {
  try {
    menus.value = await getAllMenus()
  } catch (error) {
    console.error('获取菜单列表失败:', error)
    ElMessage.error(t('roleManagement.loadMenusFailed'))
  }
}

const handleSearch = () => {
  currentPage.value = 1
  loadRoles()
}

const handleReset = () => {
  searchForm.value.name = ''
  searchForm.value.status = ''
  currentPage.value = 1
  loadRoles()
}

const handleSelectionChange = (selection: Role[]) => {
  selectedRoles.value = selection
}

const handleCreate = () => {
  isEdit.value = false
  formData.value = {
    name: '',
    code: '',
    description: '',
    status: 'active'
  }
  dialogVisible.value = true
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

const handleEdit = (role: Role) => {
  isEdit.value = true
  formData.value = { ...role }
  dialogVisible.value = true
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitting.value = true

    if (isEdit.value) {
      await updateRole(formData.value.id!, formData.value)
      ElMessage.success(t('roleManagement.updateSuccess'))
    } else {
      await createRole(formData.value)
      ElMessage.success(t('roleManagement.createSuccess'))
    }

    dialogVisible.value = false
    await loadRoles()
  } catch (error) {
    console.error('保存角色失败:', error)
    ElMessage.error(t('roleManagement.saveFailed'))
  } finally {
    submitting.value = false
  }
}

const handleDelete = (role: Role) => {
  ElMessageBox.confirm(
    t('roleManagement.deleteConfirm', { name: role.name }),
    t('roleManagement.deleteTitle'),
    {
      confirmButtonText: t('roleManagement.confirm'),
      cancelButtonText: t('roleManagement.cancel'),
      type: 'warning'
    }
  ).then(async () => {
    try {
      await deleteRole(role.id)
      ElMessage.success(t('roleManagement.deleteSuccess'))
      await loadRoles()
    } catch (error) {
      console.error('删除角色失败:', error)
      ElMessage.error(t('roleManagement.deleteFailed'))
    }
  })
}

// 批量删除角色
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      t('roleManagement.batchDeleteConfirm', { count: selectedRoles.value.length }),
      t('roleManagement.batchDeleteTitle'),
      {
        confirmButtonText: t('roleManagement.confirm'),
        cancelButtonText: t('roleManagement.cancel'),
        type: 'warning'
      }
    )

    // 批量删除角色 - 使用新的批量删除API
    const roleIds = selectedRoles.value.map(role => role.id)
    await deleteRoles(roleIds)

    ElMessage.success(t('roleManagement.batchDeleteSuccess', { count: selectedRoles.value.length }))
    selectedRoles.value = []
    await loadRoles()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除角色失败:', error)
      ElMessage.error(t('roleManagement.batchDeleteFailed'))
    }
  }
}

const handleStatusChange = async (role: Role) => {
  try {
    await updateRoleStatus(role.id, role.status!)
    const statusText = role.status === 'active' ? t('roleManagement.active') : t('roleManagement.inactive')
    ElMessage.success(t('roleManagement.statusUpdateSuccess', { status: statusText }))
  } catch (error) {
    // 恢复原状态
    role.status = role.status === 'active' ? 'inactive' : 'active'
    console.error('状态更新失败:', error)
    ElMessage.error(t('roleManagement.statusUpdateFailed'))
  }
}

const handlePermissions = async (role: Role) => {
  try {
    currentRole.value = role
    // 获取角色的完整权限信息
    const roleDetail = await getRoleById(role.id)

    // 更新权限树数据
    permissions.value = roleDetail.permissionTree || []

    // 获取已选中的权限ID列表
     const getCheckedPermissionIds = (permissionTree: Permission[]): string[] => {
       const checkedIds: string[] = []
       const traverse = (nodes: Permission[]) => {
         nodes.forEach(node => {
           if (node.hasPermission && (!node.children || node.children.length === 0)) {
             // 只添加叶子节点的权限ID
             checkedIds.push(String(node.id))
           }
           if (node.children && node.children.length > 0) {
             traverse(node.children)
           }
         })
       }
       traverse(permissionTree)
       return checkedIds
     }

    checkedPermissions.value = getCheckedPermissionIds(roleDetail.permissionTree || [])
    permissionDialogVisible.value = true
  } catch (error) {
    console.error('获取角色权限失败:', error)
    ElMessage.error(t('roleManagement.getRolePermissionsFailed'))
  }
}

const handleMenus = async (role: Role) => {
  try {
    currentRole.value = role
    // 获取角色的完整菜单信息
    const roleDetail = await getRoleById(role.id)

    // 更新菜单树数据
    menus.value = roleDetail.menuTree || []

    // 获取已选中的菜单ID列表
     const getCheckedMenuIds = (menuTree: MenuType[]): string[] => {
       const checkedIds: string[] = []
       const traverse = (nodes: MenuType[]) => {
         nodes.forEach(node => {
           if (node.hasPermission && (!node.children || node.children.length === 0)) {
             // 只添加叶子节点的菜单ID
             checkedIds.push(String(node.id))
           }
           if (node.children && node.children.length > 0) {
             traverse(node.children)
           }
         })
       }
       traverse(menuTree)
       return checkedIds
     }

    checkedMenus.value = getCheckedMenuIds(roleDetail.menuTree || [])
    menuDialogVisible.value = true
  } catch (error) {
    console.error('获取角色菜单失败:', error)
    ElMessage.error(t('roleManagement.getRoleMenusFailed'))
  }
}

const handleSavePermissions = async () => {
  if (!permissionTreeRef.value || !currentRole.value) return

  const checkedKeys = permissionTreeRef.value.getCheckedKeys()
  const halfCheckedKeys = permissionTreeRef.value.getHalfCheckedKeys()
  const allCheckedKeys = [...checkedKeys, ...halfCheckedKeys]

  try {
    // 调用API保存角色权限
    await saveRolePermissions(currentRole.value.id, allCheckedKeys.map(String))
    ElMessage.success(t('roleManagement.permissionSaveSuccess'))
    permissionDialogVisible.value = false
    // 重新加载角色列表以更新权限信息
    await loadRoles()
  } catch (error) {
    console.error('保存权限失败:', error)
    ElMessage.error(t('roleManagement.permissionSaveFailed'))
  }
}

const handleSaveMenus = async () => {
  if (!menuTreeRef.value || !currentRole.value) return

  const checkedKeys = menuTreeRef.value.getCheckedKeys()
  const halfCheckedKeys = menuTreeRef.value.getHalfCheckedKeys()
  const allCheckedKeys = [...checkedKeys, ...halfCheckedKeys]

  try {
    // 调用API保存角色菜单
    await saveRoleMenus(currentRole.value.id, allCheckedKeys.map(String))
    ElMessage.success(t('roleManagement.menuSaveSuccess'))
    menuDialogVisible.value = false
    // 重新加载角色列表以更新菜单信息
    await loadRoles()
  } catch (error) {
    console.error('保存菜单失败:', error)
    ElMessage.error(t('roleManagement.menuSaveFailed'))
  }
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  loadRoles()
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
  loadRoles()
}

const getRoleTagType = (roleName: string) => {
  switch (roleName) {
    case 'admin':
      return 'danger'
    case 'user':
      return 'success'
    case 'guest':
      return 'info'
    default:
      return 'primary'
  }
}

const formatDate = (date: string | Date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

// 生命周期
onMounted(() => {
  loadRoles()
  loadPermissions()
  loadMenus()
})
</script>

<style scoped>
.role-management {
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

.pagination-section {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.permission-content .permission-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-lighter);
}

.permission-content .permission-header .role-name {
  font-weight: 600;
  color: var(--text-primary);
}

.permission-content .permission-tree {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid var(--border-lighter);
  border-radius: 6px;
  padding: 12px;
}

:deep(.el-table .el-table__cell) {
  padding: 12px 0;
}

:deep(.el-button + .el-button) {
  margin-left: 8px;
}
</style>
