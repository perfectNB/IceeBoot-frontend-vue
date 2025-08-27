<template>
  <div class="role-management">
    <div class="page-header">
      <h2>角色管理</h2>
      <p>管理系统角色，配置角色权限</p>
    </div>

    <!-- 操作栏 -->
    <div class="action-section">
      <el-button
        type="primary"
        @click="handleCreate"
      >
        <el-icon><Plus /></el-icon>
        新增角色
      </el-button>
      <el-button 
        type="danger" 
        @click="handleBatchDelete"
        :disabled="selectedRoles.length === 0"
      >
        <el-icon><Delete /></el-icon>
        批量删除
      </el-button>
    </div>

    <!-- 搜索区域 -->
    <div class="search-section">
      <el-form :model="searchForm" inline>
        <el-form-item label="角色名称">
          <el-input
            v-model="searchForm.name"
            placeholder="请输入角色名称"
            clearable
            style="width: 200px"
          />
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
        v-loading="loading"
        :data="roles"
        stripe
        border
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="角色名称" min-width="120">
          <template #default="{ row }">
            <el-tag :type="getRoleTagType(row.name)" effect="light">
              {{ row.name }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="code" label="角色编码" min-width="120" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="'active'"
              :inactive-value="'inactive'"
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
              :icon="Key"
              @click="handlePermissions(row)"
            >
              权限
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
              :disabled="row.name === 'admin'"
            >
              删除
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
        <el-form-item label="角色名称" prop="name">
          <el-input
            v-model="formData.name"
            placeholder="请输入角色名称"
            :disabled="isEdit && formData.name === 'admin'"
          />
        </el-form-item>
        <el-form-item label="角色编码" prop="code">
          <el-input
            v-model="formData.code"
            placeholder="请输入角色编码，如：admin、user等"
            :disabled="isEdit"
          />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入角色描述"
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

    <!-- 权限配置对话框 -->
    <el-dialog
      v-model="permissionDialogVisible"
      title="权限配置"
      width="800px"
      :close-on-click-modal="false"
    >
      <div class="permission-content">
        <div class="permission-header">
          <span class="role-name">角色：{{ currentRole?.name }}</span>
          <el-button type="primary" size="small" @click="handleSavePermissions">
            保存权限
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
  Key
} from '@element-plus/icons-vue'
import { getRoles, createRole, updateRole, deleteRole, saveRolePermissions, getRoleById, updateRoleStatus } from '@/api/role'
import { getAllPermissions } from '@/api/permission'
import type { Role, Permission } from '@/types'

// 响应式数据
const loading = ref(false)
const roles = ref<Role[]>([])
const permissions = ref<Permission[]>([])
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
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()
const permissionTreeRef = ref()

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

// 计算属性
const dialogTitle = computed(() => isEdit.value ? '编辑角色' : '新增角色')

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

const treeProps = {
  children: 'children',
  label: 'label'
}

// 表单验证规则
const formRules: FormRules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 20, message: '角色名称长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入角色编码', trigger: 'blur' },
    { min: 2, max: 50, message: '角色编码长度在 2 到 50 个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/, message: '角色编码必须以字母开头，只能包含字母、数字和下划线', trigger: 'blur' }
  ],
  description: [
    { max: 200, message: '描述不能超过 200 个字符', trigger: 'blur' }
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
    ElMessage.error('获取角色列表失败')
  } finally {
    loading.value = false
  }
}

const loadPermissions = async () => {
  try {
    permissions.value = await getAllPermissions()
  } catch (error) {
    console.error('获取权限列表失败:', error)
    ElMessage.error('获取权限列表失败')
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
      ElMessage.success('更新角色成功')
    } else {
      await createRole(formData.value)
      ElMessage.success('创建角色成功')
    }

    dialogVisible.value = false
    await loadRoles()
  } catch (error) {
    console.error('保存角色失败:', error)
    ElMessage.error('保存角色失败')
  } finally {
    submitting.value = false
  }
}

const handleDelete = (role: Role) => {
  ElMessageBox.confirm(
    `确定要删除角色 "${role.name}" 吗？`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await deleteRole(role.id)
      ElMessage.success('删除角色成功')
      await loadRoles()
    } catch (error) {
      console.error('删除角色失败:', error)
      ElMessage.error('删除角色失败')
    }
  })
}

// 批量删除角色
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRoles.value.length} 个角色吗？`,
      '批量删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 批量删除角色
    for (const role of selectedRoles.value) {
      await deleteRole(role.id)
    }
    
    ElMessage.success(`成功删除 ${selectedRoles.value.length} 个角色`)
    selectedRoles.value = []
    await loadRoles()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除角色失败:', error)
      ElMessage.error('批量删除角色失败')
    }
  }
}

const handleStatusChange = async (role: Role) => {
  try {
    await updateRoleStatus(role.id, role.status!)
    ElMessage.success(`角色状态已${role.status === 'active' ? '启用' : '禁用'}`)
  } catch (error) {
    // 恢复原状态
    role.status = role.status === 'active' ? 'inactive' : 'active'
    console.error('状态更新失败:', error)
    ElMessage.error('状态更新失败')
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
    ElMessage.error('获取角色权限失败')
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
    ElMessage.success('权限保存成功')
    permissionDialogVisible.value = false
    // 重新加载角色列表以更新权限信息
    await loadRoles()
  } catch (error) {
    console.error('保存权限失败:', error)
    ElMessage.error('保存权限失败')
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
  border-bottom: 1px solid #ebeef5;
}

.permission-content .permission-header .role-name {
  font-weight: 600;
  color: #303133;
}

.permission-content .permission-tree {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #ebeef5;
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