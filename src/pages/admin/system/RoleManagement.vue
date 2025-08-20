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
        :data="filteredRoles"
        stripe
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
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
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
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
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
import { getRoles, createRole, updateRole, deleteRole, saveRolePermissions } from '@/api/role'
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
const total = computed(() => filteredRoles.value.length)

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
  description: '',
  status: 'active'
})

// 权限相关
const currentRole = ref<Role | null>(null)
const checkedPermissions = ref<string[]>([])

// 计算属性
const dialogTitle = computed(() => isEdit.value ? '编辑角色' : '新增角色')

const filteredRoles = computed(() => {
  let filtered = roles.value
  
  if (searchForm.value.name) {
    filtered = filtered.filter(role =>
      role.name.toLowerCase().includes(searchForm.value.name.toLowerCase()) ||
      (role.description && role.description.toLowerCase().includes(searchForm.value.name.toLowerCase()))
    )
  }
  
  if (searchForm.value.status) {
    filtered = filtered.filter(role => role.status === searchForm.value.status)
  }
  
  return filtered
})

const permissionTree = computed(() => {
  // 构建权限树结构
  interface TreeNode {
    id: number
    label: string
    children: TreeNode[]
  }

  const tree: TreeNode[] = []
  const map = new Map<number, TreeNode>()

  // 先创建所有节点
  permissions.value.forEach(permission => {
    map.set(Number(permission.id), {
      id: Number(permission.id),
      label: permission.name,
      children: []
    })
  })

  // 构建树结构
  permissions.value.forEach(permission => {
    const node = map.get(Number(permission.id))
    if (permission.parentId && map.has(Number(permission.parentId)) && node) {
      map.get(Number(permission.parentId))?.children.push(node)
    } else if (node) {
      tree.push(node)
    }
  })

  return tree
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
  description: [
    { max: 200, message: '描述不能超过 200 个字符', trigger: 'blur' }
  ]
}

// 方法
const loadRoles = async () => {
  loading.value = true
  try {
    const result = await getRoles({
      page: currentPage.value,
      size: pageSize.value,
      keyword: searchForm.value.name
    })
    roles.value = result.records
    // 注意：这里不需要更新total，因为使用的是filteredRoles的计算属性
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
}

const handleReset = () => {
  searchForm.value.name = ''
  searchForm.value.status = ''
  currentPage.value = 1
}

const handleSelectionChange = (selection: Role[]) => {
  selectedRoles.value = selection
}

const handleCreate = () => {
  isEdit.value = false
  formData.value = {
    name: '',
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

const handleStatusChange = async (role: Role) => {
  try {
    await updateRole(role.id, { status: role.status })
    ElMessage.success('状态更新成功')
  } catch (error) {
    console.error('状态更新失败:', error)
    ElMessage.error('状态更新失败')
    // 恢复原状态
    role.status = role.status === 'active' ? 'inactive' : 'active'
  }
}

const handlePermissions = (role: Role) => {
  currentRole.value = role
  // 这里应该获取角色的权限列表
  checkedPermissions.value = role.permissions || []
  permissionDialogVisible.value = true
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
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
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