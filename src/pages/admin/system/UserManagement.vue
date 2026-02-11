<template>
  <div class="user-management">
    <div class="page-header">
      <h1 class="page-title">{{ t('userManagement.pageTitle') }}</h1>
      <p class="page-description">{{ t('userManagement.pageDescription') }}</p>
    </div>

    <!-- 操作区域 -->
    <div class="action-section">
      <el-button type="primary" @click="handleCreate" v-if="hasPermission('system:user:view')">
        <el-icon><Plus /></el-icon>
        {{ t('userManagement.createUser') }}
      </el-button>
      <el-button
        type="danger"
        @click="handleBatchDelete"
        :disabled="selectedUsers.length === 0"
        v-if="hasPermission('system:user:delete')"
      >
        <el-icon><Delete /></el-icon>
        {{ t('userManagement.batchDelete') }}
      </el-button>
      <el-button @click="handleExport"
                 v-if="hasPermission('system:user:export')"
      >
        <el-icon><Download /></el-icon>
        {{ t('userManagement.export') }}
      </el-button>
    </div>

    <!-- 搜索区域 -->
    <div class="search-section">
      <el-form :model="searchForm" :inline="true">
        <el-form-item :label="t('userManagement.username')">
          <el-input
            v-model="searchForm.username"
            :placeholder="t('userManagement.placeholderUsername')"
            clearable
            style="width: 150px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item :label="t('userManagement.nickname')">
          <el-input
            v-model="searchForm.nickname"
            :placeholder="t('userManagement.placeholderNickname')"
            clearable
            style="width: 150px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item :label="t('userManagement.email')">
          <el-input
            v-model="searchForm.email"
            :placeholder="t('userManagement.placeholderEmail')"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item :label="t('userManagement.phone')">
          <el-input
            v-model="searchForm.phone"
            :placeholder="t('userManagement.placeholderPhone')"
            clearable
            style="width: 150px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item :label="t('userManagement.status')">
          <el-select
            v-model="searchForm.status"
            :placeholder="t('userManagement.placeholderStatus')"
            clearable
            style="width: 120px"
          >
            <el-option :label="t('userManagement.active')" value="active" />
            <el-option :label="t('userManagement.inactive')" value="inactive" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch" :loading="loading">
            <el-icon><Search /></el-icon>
            {{ t('userManagement.search') }}
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            {{ t('userManagement.reset') }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 表格区域 -->
    <div class="table-section">
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
        <el-table-column :label="t('userManagement.avatar')" width="80">
          <template #default="{ row }">
            <el-avatar :size="40" :src="row.avatar">
              {{ row.username.charAt(0).toUpperCase() }}
            </el-avatar>
          </template>
        </el-table-column>
        <el-table-column prop="username" :label="t('userManagement.username')" min-width="120" />
        <el-table-column prop="nickname" :label="t('userManagement.nickname')" min-width="120" />
        <el-table-column prop="email" :label="t('userManagement.email')" min-width="180" />
        <el-table-column prop="phone" :label="t('userManagement.phone')" width="130" />
        <el-table-column :label="t('userManagement.role')" width="150">
          <template #default="{ row }">
            <div v-if="row.roleList && row.roleList.length > 0">
              <el-tag
                v-for="role in row.roleList"
                :key="role.id"
                :type="getRoleType(role.code)"
                size="small"
                style="margin-right: 4px; margin-bottom: 2px;"
              >
                {{ role.name }}
              </el-tag>
            </div>
            <span v-else class="text-gray-400">{{ t('userManagement.noRole') }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('userManagement.status')" width="80">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="'active'"
              :inactive-value="'inactive'"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="lastLoginTime" :label="t('userManagement.lastLogin')" width="160" />
        <el-table-column prop="createTime" :label="t('userManagement.createTime')" width="160" />
        <el-table-column :label="t('userManagement.operation')" width="280" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              :icon="Edit"
              @click="handleEdit(row)"
            >
              {{ t('userManagement.edit') }}
            </el-button>
            <el-button
              type="warning"
              size="small"
              :icon="Key"
              @click="handleResetPassword(row)"
            >
              {{ t('userManagement.resetPassword') }}
            </el-button>
            <el-button
              type="danger"
              size="small"
              :icon="Delete"
              @click="handleDelete(row)"
              :disabled="row.username === 'admin'"
              v-if="hasPermission('system:user:delete')"
            >
              {{ t('userManagement.delete') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-section">
        <el-pagination
          v-model:current-page="pagination.current"
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
        <el-form-item :label="t('userManagement.username')" prop="username">
          <el-input v-model="userForm.username" :placeholder="t('userManagement.placeholderUsername')" />
        </el-form-item>
        <el-form-item :label="t('userManagement.nickname')" prop="nickname">
          <el-input v-model="userForm.nickname" :placeholder="t('userManagement.placeholderNickname')" />
        </el-form-item>
        <el-form-item :label="t('userManagement.email')" prop="email">
          <el-input v-model="userForm.email" :placeholder="t('userManagement.placeholderEmail')" />
        </el-form-item>
        <el-form-item :label="t('userManagement.phone')" prop="phone">
          <el-input v-model="userForm.phone" :placeholder="t('userManagement.placeholderPhone')" />
        </el-form-item>
        <el-form-item :label="t('userManagement.roles')" prop="roles">
          <el-select
            v-model="userForm.roles"
            :placeholder="t('userManagement.placeholderRoles')"
            multiple
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="role in roleOptions"
              :key="role.value"
              :label="role.label"
              :value="role.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('userManagement.status')" prop="status">
          <el-select
            v-model="userForm.status"
            :placeholder="t('userManagement.placeholderStatus')"
            clearable
            style="width: 150px"
          >
            <el-option :label="t('userManagement.active')" value="active" />
            <el-option :label="t('userManagement.inactive')" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="!isEdit" :label="t('userManagement.password')" prop="password">
          <el-input
            v-model="userForm.password"
            type="password"
            :placeholder="t('userManagement.placeholderPassword')"
            show-password
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">{{ t('userManagement.cancel') }}</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            {{ t('userManagement.confirm') }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
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
import { deleteUsers } from '@/api/user'
import { getAllRoles } from '@/api/role'
import {hasPermission} from "@/utils/permission.ts";

const { t } = useI18n()

interface SearchForm {
  username: string
  nickname: string
  email: string
  phone: string
  status: string
}

interface UserForm {
  id?: string | number
  username: string
  nickname: string
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
  username: '',
  nickname: '',
  email: '',
  phone: '',
  status: ''
})

// 分页
const pagination = reactive({
  current: 1,
  size: 20,
  total: 0,
  pages: 0
})

// 用户表单
const userForm = reactive<UserForm>({
  username: '',
  nickname: '',
  email: '',
  phone: '',
  roles: [],
  status: 'active',
  password: ''
})

// 表单验证规则
const formRules = {
  username: [
    { required: true, message: t('userManagement.validationUsername'), trigger: 'blur' },
    { min: 3, max: 20, message: t('userManagement.validationUsernameLength'), trigger: 'blur' }
  ],
  nickname: [
    { required: true, message: t('userManagement.validationNickname'), trigger: 'blur' },
    { min: 2, max: 20, message: t('userManagement.validationNicknameLength'), trigger: 'blur' }
  ],
  email: [
    { required: true, message: t('userManagement.validationEmail'), trigger: 'blur' },
    { type: 'email', message: t('userManagement.validationEmailFormat'), trigger: 'blur' }
  ],
  phone: [
    { required: true, message: t('userManagement.validationPhone'), trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: t('userManagement.validationPhoneFormat'), trigger: 'blur' }
  ],
  roles: [
    { required: true, message: t('userManagement.validationRoles'), trigger: 'change' }
  ],
  password: [
    { required: true, message: t('userManagement.validationPassword'), trigger: 'blur' },
    { min: 6, max: 20, message: t('userManagement.validationPasswordLength'), trigger: 'blur' }
  ]
}



const tableData = ref<User[]>([])
const roleOptions = ref<{label: string, value: string, id: string | number}[]>([])

// 计算属性
const dialogTitle = computed(() => isEdit.value ? t('userManagement.editUserTitle') : t('userManagement.createUserTitle'))

// 获取角色类型
const getRoleType = (role: string) => {
  const typeMap: Record<string, string> = {
    admin: 'danger',
    editor: 'warning',
    user: 'info'
  }
  return typeMap[role] || 'info'
}



// 加载用户数据
const loadUsers = async () => {
  loading.value = true
  try {
    console.log('发送分页参数:', {
      pageNum: pagination.current,
      pageSize: pagination.size,
      username: searchForm.username,
      nickname: searchForm.nickname,
      email: searchForm.email,
      phone: searchForm.phone,
      status: searchForm.status
    })
    const result = await getUserList({
      pageNum: pagination.current,
      pageSize: pagination.size,
      username: searchForm.username,
      nickname: searchForm.nickname,
      email: searchForm.email,
      phone: searchForm.phone,
      status: searchForm.status
    })
    console.log('API返回结果:', result)
    tableData.value = result.records
    pagination.total = result.total
    pagination.pages = result.pages
    pagination.current = result.current
    pagination.size = result.size
  } catch (error) {
    console.error('加载用户数据失败:', error)
    ElMessage.error(t('userManagement.loadUsersFailed'))
  } finally {
    loading.value = false
  }
}



// 搜索
const handleSearch = () => {
  pagination.current = 1
  loadUsers()
}

// 重置搜索
const handleReset = () => {
  Object.assign(searchForm, {
    username: '',
    nickname: '',
    email: '',
    phone: '',
    status: ''
  })
  handleSearch()
}

// 新建用户
const handleCreate = async () => {
  isEdit.value = false
  resetForm()

  // 加载所有角色选项
  await loadRoles()

  dialogVisible.value = true
}

// 加载角色数据
const loadRoles = async () => {
  try {
    const roles = await getAllRoles()
    roleOptions.value = roles.map(role => ({
      label: role.name,
      value: role.code,
      id: role.id
    }))
  } catch (error) {
    console.error('加载角色数据失败:', error)
    ElMessage.error(t('userManagement.loadRolesFailed'))
  }
}

// 编辑用户
const handleEdit = async (row: User) => {
  isEdit.value = true

  // 先加载所有角色选项
  await loadRoles()

  // 处理角色回显，支持Role对象数组和字符串数组两种格式
  let userRoles: string[] = []
  if (row.roleList) {
    userRoles = row.roleList.map(role => {
      if (typeof role === 'string') {
        // 如果是字符串ID，需要找到对应的角色代码
        const foundRole = roleOptions.value.find(option => String(option.id) === role)
        return foundRole ? foundRole.value : ''
      } else {
        // 如果是Role对象，直接使用code
        return role.code
      }
    }).filter(code => code !== '')
  }

  Object.assign(userForm, {
    id: row.id,
    username: row.username,
    nickname: row.nickname || '',
    email: row.email,
    phone: row.phone,
    roles: userRoles,
    status: row.status
  })
  dialogVisible.value = true
}

// 删除用户
const handleDelete = async (row: User) => {
  try {
    await ElMessageBox.confirm(
      t('userManagement.deleteConfirm', { username: row.username }),
      t('userManagement.deleteTitle'),
      {
        confirmButtonText: t('userManagement.confirm'),
        cancelButtonText: t('userManagement.cancel'),
        type: 'warning'
      }
    )

    await deleteUser(row.id)
    ElMessage.success(t('userManagement.deleteSuccess'))
    await loadUsers()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除用户失败:', error)
      ElMessage.error(t('userManagement.deleteFailed'))
    }
  }
}

// 批量删除用户
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      t('userManagement.batchDeleteConfirm', { count: selectedUsers.value.length }),
      t('userManagement.batchDeleteTitle'),
      {
        confirmButtonText: t('userManagement.confirm'),
        cancelButtonText: t('userManagement.cancel'),
        type: 'warning'
      }
    )

    const userIds = selectedUsers.value.map(user => user.id)
    await deleteUsers(userIds)
    ElMessage.success(t('userManagement.batchDeleteSuccess', { count: selectedUsers.value.length }))
    selectedUsers.value = []
    await loadUsers()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除用户失败:', error)
      ElMessage.error(t('userManagement.batchDeleteFailed'))
    }
  }
}

// 重置密码
const handleResetPassword = async (row: User) => {
  try {
    const { value: newPassword } = await ElMessageBox.prompt(
      t('userManagement.resetPasswordPrompt', { username: row.username }),
      t('userManagement.resetPasswordTitle'),
      {
        confirmButtonText: t('userManagement.confirm'),
        cancelButtonText: t('userManagement.cancel'),
        inputType: 'password',
        inputPlaceholder: t('userManagement.resetPasswordPlaceholder'),
        inputValidator: (value) => {
          if (!value) {
            return t('userManagement.resetPasswordEmpty')
          }
          if (value.length < 6) {
            return t('userManagement.resetPasswordMinLength')
          }
          if (value.length > 20) {
            return t('userManagement.resetPasswordMaxLength')
          }
          return true
        }
      }
    )

    await resetUserPassword(row.id, newPassword)
    ElMessage.success(t('userManagement.resetPasswordSuccess'))
  } catch (error) {
    if (error !== 'cancel') {
      console.error('重置密码失败:', error)
      ElMessage.error(t('userManagement.resetPasswordFailed'))
    }
  }
}

// 状态变更
const handleStatusChange = async (row: User) => {
  try {
    await updateUserStatus(row.id, row.status!)
    const statusText = row.status === 'active' ? t('userManagement.active') : t('userManagement.inactive')
    ElMessage.success(t('userManagement.statusUpdateSuccess', { status: statusText }))
  } catch (error) {
    // 恢复原状态
    row.status = row.status === 'active' ? 'inactive' : 'active'
    console.error('状态更新失败:', error)
    ElMessage.error(t('userManagement.statusUpdateFailed'))
  }
}

// 导出
const handleExport = () => {
  ElMessage.info(t('userManagement.exportInProgress'))
}

// 选择变更
const handleSelectionChange = (selection: User[]) => {
  selectedUsers.value = selection
}

// 分页大小变更
const handleSizeChange = (size: number) => {
  pagination.size = size
  pagination.current = 1
  loadUsers()
}

// 当前页变更
const handleCurrentChange = (page: number) => {
  pagination.current = page
  loadUsers()
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    submitting.value = true

    // 将角色代码转换为角色ID
    const roleIds = userForm.roles.map(roleCode => {
      const role = roleOptions.value.find(option => option.value === roleCode)
      return role ? String(role.id) : null
    }).filter(id => id !== null) as string[]

    if (isEdit.value) {
      // 更新用户
      await updateUser(userForm.id!, {
        username: userForm.username,
        nickname: userForm.nickname,
        email: userForm.email,
        phone: userForm.phone,
        roleIds: roleIds,
        status: userForm.status
      })
      ElMessage.success(t('userManagement.userUpdateSuccess'))
    } else {
      // 创建用户
      await createUser({
        username: userForm.username,
        nickname: userForm.nickname,
        email: userForm.email,
        phone: userForm.phone,
        roleIds: roleIds,
        status: userForm.status,
        password: userForm.password
      })
      ElMessage.success(t('userManagement.userCreateSuccess'))
    }

    // 重新加载用户列表
    await loadUsers()

    // 自动关闭弹窗
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
    nickname: '',
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
  margin-bottom: 16px;

  .el-button + .el-button {
    margin-left: 12px;
  }
}

.search-section {
  margin-bottom: 16px;
  padding: 20px;
  background: var(--bg-color);
  border: 1px solid var(--border-lighter);
  border-radius: 8px;
}

.table-section {
  background: var(--bg-color);
  border: 1px solid var(--border-lighter);
  border-radius: 8px;
  overflow: hidden;

  :deep(.el-table) {
    .el-table__cell {
      padding: 12px 0;
    }
  }
}

.pagination-section {
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
