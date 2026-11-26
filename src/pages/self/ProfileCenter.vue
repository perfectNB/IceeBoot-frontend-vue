<template>
  <div class="profile-center admin-page">
    <AdminPageHeader :title="t('profile.title')" :description="t('profile.description')" />

    <div class="profile-content">
      <!-- 左侧个人信息卡片 -->
      <div class="profile-card">
        <div class="profile-header">
          <div class="avatar-section">
            <el-avatar
              :src="userStore.user?.avatar"
              :size="80"
              class="user-avatar"
            >
              {{ userStore.user?.nickname?.charAt(0) || userStore.user?.username?.charAt(0) }}
            </el-avatar>
            <el-button type="primary" size="small" class="upload-btn">
              <el-icon><Camera /></el-icon>
              {{ t('profile.changeAvatar') }}
            </el-button>
          </div>
          <div class="user-info">
            <h2 class="user-name">{{ userStore.user?.nickname || userStore.user?.username }}</h2>
            <p class="user-username">@{{ userStore.user?.username }}</p>
            <div class="user-status">
              <el-tag :type="userStore.user?.status === 'active' ? 'success' : 'danger'" size="small">
                {{ userStore.user?.status === 'active' ? t('profile.statusActive') : t('profile.statusDisabled') }}
              </el-tag>
            </div>
          </div>
        </div>

        <div class="profile-stats">
          <div class="stat-item">
            <div class="stat-value">{{ userStore.user?.roles?.length || 0 }}</div>
            <div class="stat-label">{{ t('profile.roleCount') }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ userStore.user?.permissions?.length || 0 }}</div>
            <div class="stat-label">{{ t('profile.permissionCount') }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ formatDate(userStore.user?.createTime) }}</div>
            <div class="stat-label">{{ t('profile.registerTime') }}</div>
          </div>
        </div>
      </div>

      <!-- 右侧详细信息 -->
      <div class="profile-details">
        <!-- 基本信息 -->
        <div class="info-section">
          <div class="section-header">
            <h3 class="section-title">
              <el-icon><User /></el-icon>
              {{ t('profile.basicInfo') }}
            </h3>
            <el-button type="primary" text @click="editMode = !editMode">
              <el-icon><Edit /></el-icon>
              {{ editMode ? t('profile.cancelEdit') : t('profile.editInfo') }}
            </el-button>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <label class="info-label">{{ t('profile.username') }}</label>
              <div class="info-value">{{ userStore.user?.username }}</div>
            </div>
            <div class="info-item">
              <label class="info-label">{{ t('profile.nickname') }}</label>
              <div class="info-value" v-if="!editMode">{{ userStore.user?.nickname || '-' }}</div>
              <el-input v-else v-model="editForm.nickname" :placeholder="t('profile.nicknamePlaceholder')" />
            </div>
            <div class="info-item">
              <label class="info-label">{{ t('profile.email') }}</label>
              <div class="info-value" v-if="!editMode">{{ userStore.user?.email || '-' }}</div>
              <el-input v-else v-model="editForm.email" :placeholder="t('profile.emailPlaceholder')" />
            </div>
            <div class="info-item">
              <label class="info-label">{{ t('profile.phone') }}</label>
              <div class="info-value" v-if="!editMode">{{ userStore.user?.phone || '-' }}</div>
              <el-input v-else v-model="editForm.phone" :placeholder="t('profile.phonePlaceholder')" />
            </div>
          </div>

          <div class="edit-actions" v-if="editMode">
            <el-button @click="editMode = false">{{ t('common.cancel') }}</el-button>
            <el-button type="primary" @click="handleSave" :loading="saving">
              {{ t('profile.saveChanges') }}
            </el-button>
          </div>
        </div>

        <!-- 角色权限信息 -->
        <div class="info-section">
          <div class="section-header">
            <h3 class="section-title">
              <el-icon><Key /></el-icon>
              {{ t('profile.rolesPermissions') }}
            </h3>
          </div>

          <div class="roles-section">
            <div class="roles-list">
              <h4>{{ t('profile.currentRoles') }}</h4>
              <div class="role-tags">
                <el-tag
                  v-for="role in userStore.user?.roles"
                  :key="role"
                  type="primary"
                  class="role-tag"
                >
                  {{ role }}
                </el-tag>
                <el-tag v-if="!userStore.user?.roles?.length" type="info">
                  {{ t('profile.noRoles') }}
                </el-tag>
              </div>
            </div>

            <div class="permissions-list">
              <h4>{{ t('profile.permissionList') }}</h4>
              <div class="permission-tags">
                <el-tag
                  v-for="permission in userStore.user?.permissions?.slice(0, 10)"
                  :key="permission"
                  size="small"
                  class="permission-tag"
                >
                  {{ permission }}
                </el-tag>
                <el-tag
                  v-if="(userStore.user?.permissions?.length || 0) > 10"
                  size="small"
                  type="info"
                >
                  {{ t('profile.morePermissions', { count: (userStore.user?.permissions?.length || 0) - 10 }) }}
                </el-tag>
                <el-tag v-if="!userStore.user?.permissions?.length" type="info" size="small">
                  {{ t('profile.noPermissions') }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>

        <!-- 登录信息 -->
        <div class="info-section">
          <div class="section-header">
            <h3 class="section-title">
              <el-icon><Clock /></el-icon>
              {{ t('profile.loginInfo') }}
            </h3>
          </div>

          <div class="login-info">
            <div class="login-item">
              <span class="login-label">{{ t('profile.lastLoginTime') }}</span>
              <span class="login-value">{{ formatDateTime(userStore.user?.lastLoginTime) }}</span>
            </div>
            <div class="login-item">
              <span class="login-label">{{ t('profile.lastLoginIP') }}</span>
              <span class="login-value">{{ userStore.user?.lastLoginIp || '-' }}</span>
            </div>
            <div class="login-item">
              <span class="login-label">{{ t('profile.accountCreateTime') }}</span>
              <span class="login-value">{{ formatDateTime(userStore.user?.createTime) }}</span>
            </div>
            <div class="login-item">
              <span class="login-label">{{ t('profile.lastUpdateTime') }}</span>
              <span class="login-value">{{ formatDateTime(userStore.user?.updateTime) }}</span>
            </div>
          </div>
        </div>

        <!-- 安全设置 -->
        <div class="info-section">
          <div class="section-header">
            <h3 class="section-title">
              <el-icon><Lock /></el-icon>
              {{ t('profile.security') }}
            </h3>
          </div>

          <div class="security-actions">
            <el-button type="primary" @click="showPasswordDialog = true">
              <el-icon><Key /></el-icon>
              {{ t('profile.changePassword') }}
            </el-button>
            <el-button type="warning">
              <el-icon><Warning /></el-icon>
              {{ t('profile.clearLoginState') }}
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 修改密码对话框 -->
    <el-dialog
      v-model="showPasswordDialog"
      :title="t('profile.changePasswordTitle')"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-width="100px"
      >
        <el-form-item :label="t('profile.currentPassword')" prop="oldPassword">
          <el-input
            v-model="passwordForm.oldPassword"
            type="password"
            show-password
            :placeholder="t('profile.currentPasswordPlaceholder')"
          />
        </el-form-item>
        <el-form-item :label="t('profile.newPassword')" prop="newPassword">
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            show-password
            :placeholder="t('profile.newPasswordPlaceholder')"
          />
        </el-form-item>
        <el-form-item :label="t('profile.confirmPassword')" prop="confirmPassword">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            show-password
            :placeholder="t('profile.confirmPasswordPlaceholder')"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showPasswordDialog = false">{{ t('common.cancel') }}</el-button>
          <el-button type="primary" @click="handleChangePassword" :loading="changingPassword">
            {{ t('profile.confirmChange') }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import AdminPageHeader from '@/components/common/AdminPageHeader.vue'
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, type FormInstance } from 'element-plus'
import {
  User,
  Edit,
  Camera,
  Key,
  Lock,
  Clock,
  Warning
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useI18n } from 'vue-i18n'

const userStore = useUserStore()
const { t } = useI18n()

// 编辑模式
const editMode = ref(false)
const saving = ref(false)

// 编辑表单
const editForm = reactive({
  nickname: '',
  email: '',
  phone: ''
})

// 密码修改
const showPasswordDialog = ref(false)
const changingPassword = ref(false)
const passwordFormRef = ref<FormInstance>()

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const passwordRules = computed(() => ({
  oldPassword: [{ required: true, message: t('profile.currentPasswordRequired'), trigger: 'blur' }],
  newPassword: [
    { required: true, message: t('profile.newPasswordRequired'), trigger: 'blur' },
    { min: 6, message: t('profile.passwordMinLength'), trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: t('profile.confirmPasswordRequired'), trigger: 'blur' },
    {
      validator: (_rule: unknown, value: string, callback: (error?: Error) => void) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error(t('profile.passwordMismatch')))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}))

// 格式化日期
const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

// 保存基本信息
const handleSave = async () => {
  saving.value = true
  try {
    // TODO: 调用更新用户信息API
    await new Promise(resolve => setTimeout(resolve, 1000)) // 模拟API调用
    ElMessage.success(t('profile.saveSuccess'))
    editMode.value = false
  } catch (error) {
    console.error('更新用户信息失败:', error)
    ElMessage.error(t('profile.saveFailed'))
  } finally {
    saving.value = false
  }
}

// 修改密码
const handleChangePassword = async () => {
  if (!passwordFormRef.value) return

  try {
    await passwordFormRef.value.validate()
    changingPassword.value = true

    // TODO: 调用修改密码API
    await new Promise(resolve => setTimeout(resolve, 1000)) // 模拟API调用

    ElMessage.success(t('profile.passwordChangeSuccess'))
    showPasswordDialog.value = false

    // 重置表单
    Object.assign(passwordForm, {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
  } catch (error) {
    console.error('修改密码失败:', error)
    ElMessage.error(t('profile.passwordChangeFailed'))
  } finally {
    changingPassword.value = false
  }
}

// 初始化编辑表单
const initEditForm = () => {
  if (userStore.user) {
    editForm.nickname = userStore.user.nickname || ''
    editForm.email = userStore.user.email || ''
    editForm.phone = userStore.user.phone || ''
  }
}

onMounted(() => {
  initEditForm()
})
</script>

<style scoped lang="scss">
.profile-center {
  padding: 20px;
  background: var(--bg-color-page);
  min-height: 100vh;
}

.page-title {
  margin: 0 0 12px 0;
  color: var(--text-primary);
  font-size: 32px;
  font-weight: 700;
}

.page-description {
  margin: 0;
  color: var(--text-secondary);
  font-size: 16px;
}

.profile-content {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 24px;
}

.profile-card {
  background: var(--bg-color);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--border-light);
  height: fit-content;
}

.profile-header {
  text-align: center;
  margin-bottom: 24px;
}

.avatar-section {
  position: relative;
  display: inline-block;
  margin-bottom: 16px;
}

.user-avatar {
  background: linear-gradient(135deg, #409eff, #67c23a);
  color: white;
  font-weight: 600;
  font-size: 32px;
}

.upload-btn {
  position: absolute;
  bottom: -5px;
  right: -5px;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  padding: 0;
}

.user-info {
  .user-name {
    margin: 0 0 8px 0;
    font-size: 24px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .user-username {
    margin: 0 0 12px 0;
    color: var(--text-secondary);
    font-size: 14px;
  }
}

.profile-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding-top: 24px;
  border-top: 1px solid var(--border-light);
}

.stat-item {
  text-align: center;

  .stat-value {
    font-size: 20px;
    font-weight: 600;
    color: #409eff;
    margin-bottom: 4px;
  }

  .stat-label {
    font-size: 12px;
    color: var(--text-secondary);
  }
}

.profile-details {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.info-section {
  background: var(--bg-color);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--border-light);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-light);
}

.section-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.info-item {
  .info-label {
    display: block;
    font-size: 14px;
    color: var(--text-regular);
    margin-bottom: 8px;
    font-weight: 500;
  }

  .info-value {
    font-size: 16px;
    color: var(--text-primary);
    min-height: 32px;
    display: flex;
    align-items: center;
  }
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid var(--border-light);
}

.roles-section {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 24px;

  h4 {
    margin: 0 0 12px 0;
    font-size: 14px;
    color: var(--text-regular);
    font-weight: 500;
  }
}

.role-tags, .permission-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.role-tag {
  font-size: 12px;
}

.permission-tag {
  font-size: 11px;
}

.login-info {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.login-item {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .login-label {
    font-size: 14px;
    color: var(--text-regular);
    font-weight: 500;
  }

  .login-value {
    font-size: 14px;
    color: var(--text-primary);
  }
}

.security-actions {
  display: flex;
  gap: 12px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

// 响应式设计
@media (max-width: 1024px) {
  .profile-content {
    grid-template-columns: 1fr;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .roles-section {
    grid-template-columns: 1fr;
  }

  .login-info {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .profile-center {
    padding: 16px;
  }

  .page-title {
    font-size: 24px;
  }

  .profile-card,
  .info-section {
    padding: 16px;
  }

  .security-actions {
    flex-direction: column;
  }
}
</style>
