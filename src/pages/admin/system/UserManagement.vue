<template>
  <div class="user-management">
    <div class="page-header">
      <h1 class="page-title">用户管理</h1>
      <p class="page-description">管理系统用户信息和权限</p>
    </div>
    
    <!-- 搜索和操作栏 -->
    <div class="toolbar">
      <div class="search-section">
        <el-input
          v-model="searchForm.keyword"
          placeholder="搜索用户名、邮箱或手机号"
          style="width: 300px"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select
          v-model="searchForm.status"
          placeholder="用户状态"
          style="width: 120px"
          clearable
        >
          <el-option label="启用" value="active" />
          <el-option label="禁用" value="inactive" />
        </el-select>
        <el-select
          v-model="searchForm.role"
          placeholder="用户角色"
          style="width: 120px"
          clearable
        >
          <el-option label="管理员" value="admin" />
          <el-option label="编辑" value="editor" />
          <el-option label="用户" value="user" />
        </el-select>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
        <el-button @click="handleReset">
          <el-icon><Refresh /></el-icon>
          重置
        </el-button>
      </div>
      
      <div class="action-section">
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          新建用户
        </el-button>
        <el-button @click="handleExport">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
      </div>
    </div>
    
    <!-- 用户表格 -->
    <div class="table-container">
      <el-table
        :data="tableData"
        v-loading="loading"
        stripe
        border
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="头像" width="80">
          <template #default="{ row }">
            <el-avatar :size="40" :src="row.avatar">
              {{ row.username.charAt(0).toUpperCase() }}
            </el-avatar>
          </template>
        </el-table-column>
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="getRoleType(row.roles?.[0] || '')" size="small">
              {{ getRoleLabel(row.roles?.[0] || '') }}
            </el-tag>
          </template>
        </el-table-column>
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
        <el-table-column prop="lastLoginTime" label="最后登录" width="160" />
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              :icon="Edit"
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              type="warning"
              size="small"
              :icon="Key"
              @click="handleResetPassword(row)"
            >
              重置密码
            </el-button>
            <el-button
              type="danger"
              size="small"
              :icon="Delete"
              @click="handleDelete(row)"
              :disabled="row.username === 'admin'"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
    
    <!-- 用户表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="userForm"
        :rules="formRules"
        label-width="80px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="userForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="角色" prop="roles">
          <el-select v-model="userForm.roles" placeholder="请选择角色" multiple style="width: 100%">
            <el-option label="管理员" value="admin" />
            <el-option label="编辑" value="editor" />
            <el-option label="用户" value="user" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="userForm.status">
            <el-radio value="active">启用</el-radio>
            <el-radio value="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="!isEdit" label="密码" prop="password">
          <el-input
            v-model="userForm.password"
            type="password"
            placeholder="请输入密码"
            show-password
          />
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
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import {
  Search,
  Refresh,
  Plus,
  Download,
  Edit,
  Delete,
  Key
} from '@element-plus/icons-vue'
import type { User } from '@/types'
import {
  getUserList,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  updateUserStatus
} from '@/api'

interface SearchForm {
  keyword: string
  status: string
  role: string
}

interface UserForm {
  id?: string | number
  username: string
  email: string
  phone: string
  roles: string[]
  status: 'active' | 'inactive'
  password?: string
}

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const selectedUsers = ref<User[]>([])
const formRef = ref<FormInstance>()

// 搜索表单
const searchForm = reactive<SearchForm>({
  keyword: '',
  status: '',
  role: ''
})

// 分页
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 用户表单
const userForm = reactive<UserForm>({
  username: '',
  email: '',
  phone: '',
  roles: [],
  status: 'active',
  password: ''
})

// 表单验证规则
const formRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' }
  ],
  roles: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ]
}



const tableData = ref<User[]>([])

// 计算属性
const dialogTitle = computed(() => isEdit.value ? '编辑用户' : '新建用户')

// 获取角色类型
const getRoleType = (role: string) => {
  const typeMap: Record<string, string> = {
    admin: 'danger',
    editor: 'warning',
    user: 'info'
  }
  return typeMap[role] || 'info'
}

// 获取角色标签
const getRoleLabel = (role: string) => {
  const labelMap: Record<string, string> = {
    admin: '管理员',
    editor: '编辑',
    user: '用户'
  }
  return labelMap[role] || '未知'
}

// 加载用户数据
const loadUsers = async () => {
  loading.value = true
  try {
    const result = await getUserList({
      page: pagination.page,
      size: pagination.size,
      keyword: searchForm.keyword
    })
    tableData.value = result.list
    pagination.total = result.total
  } catch (error) {
    console.error('加载用户数据失败:', error)
    ElMessage.error('加载用户数据失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadUsers()
}

// 重置搜索
const handleReset = () => {
  Object.assign(searchForm, {
    keyword: '',
    status: '',
    role: ''
  })
  handleSearch()
}

// 新建用户
const handleCreate = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

// 编辑用户
const handleEdit = (row: User) => {
  isEdit.value = true
  Object.assign(userForm, {
    id: row.id,
    username: row.username,
    email: row.email,
    phone: row.phone,
    roles: row.roles || [],
    status: row.status
  })
  dialogVisible.value = true
}

// 删除用户
const handleDelete = async (row: User) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${row.username}" 吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await deleteUser(row.id)
    ElMessage.success('用户删除成功')
    await loadUsers()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除用户失败:', error)
      ElMessage.error('删除用户失败')
    }
  }
}

// 重置密码
const handleResetPassword = async (row: User) => {
  try {
    await ElMessageBox.confirm(
      `确定要重置用户 "${row.username}" 的密码吗？`,
      '重置密码确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const result = await resetUserPassword(row.id)
    ElMessage.success(`密码重置成功，新密码为：${result.newPassword}`)
  } catch (error) {
    if (error !== 'cancel') {
      console.error('重置密码失败:', error)
      ElMessage.error('重置密码失败')
    }
  }
}

// 状态变更
const handleStatusChange = async (row: User) => {
  try {
    await updateUserStatus(row.id, row.status!)
    ElMessage.success(`用户状态已${row.status === 'active' ? '启用' : '禁用'}`)
  } catch (error) {
    // 恢复原状态
    row.status = row.status === 'active' ? 'inactive' : 'active'
    console.error('状态更新失败:', error)
    ElMessage.error('状态更新失败')
  }
}

// 导出
const handleExport = () => {
  ElMessage.info('导出功能开发中...')
}

// 选择变更
const handleSelectionChange = (selection: User[]) => {
  selectedUsers.value = selection
}

// 分页大小变更
const handleSizeChange = (size: number) => {
  pagination.size = size
  loadUsers()
}

// 当前页变更
const handleCurrentChange = (page: number) => {
  pagination.page = page
  loadUsers()
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    submitting.value = true
    
    if (isEdit.value) {
      // 更新用户
      await updateUser(userForm.id!, {
        username: userForm.username,
        email: userForm.email,
        phone: userForm.phone,
        roles: userForm.roles,
        status: userForm.status
      })
      ElMessage.success('用户更新成功')
    } else {
      // 创建用户
      await createUser({
        username: userForm.username,
        email: userForm.email,
        phone: userForm.phone,
        roles: userForm.roles,
        status: userForm.status,
        password: userForm.password
      })
      ElMessage.success('用户创建成功')
    }
    
    // 重新加载用户列表
    await loadUsers()
    
    dialogVisible.value = false
  } catch {
    // 表单验证失败
  } finally {
    submitting.value = false
  }
}

// 对话框关闭
const handleDialogClose = () => {
  resetForm()
}



// 重置表单
const resetForm = () => {
  Object.assign(userForm, {
    id: undefined,
    username: '',
    email: '',
    phone: '',
    roles: [],
    status: 'active',
    password: ''
  })
  formRef.value?.clearValidate()
}

// 组件挂载
onMounted(() => {
  loadUsers()
})
</script>

<style scoped lang="scss">
.user-management {
  padding: 0;
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
  margin-bottom: 20px;
  padding: 20px;
  background: var(--bg-color);
  border: 1px solid var(--border-lighter);
  border-radius: 8px;
}

.search-section {
  display: flex;
  gap: 12px;
  align-items: center;
}

.action-section {
  display: flex;
  gap: 12px;
}

.table-container {
  background: var(--bg-color);
  border: 1px solid var(--border-lighter);
  border-radius: 8px;
  overflow: hidden;
}

.pagination-container {
  padding: 20px;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid var(--border-lighter);
}

.dialog-footer {
  text-align: right;
}

// 响应式设计
@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .search-section {
    flex-wrap: wrap;
  }
  
  .action-section {
    justify-content: center;
  }
}
</style>