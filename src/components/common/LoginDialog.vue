<template>
  <el-dialog
    v-model="dialogVisible"
    title="用户登录"
    width="400px"
    :before-close="handleClose"
    class="login-dialog"
  >
    <div class="login-content">
      <!-- 登录方式切换 -->
      <el-tabs v-model="activeTab" class="login-tabs">
        <!-- 账号密码登录 -->
        <el-tab-pane label="账号登录" name="account">
          <el-form
            ref="loginFormRef"
            :model="loginForm"
            :rules="loginRules"
            label-width="0"
            class="login-form"
          >
            <el-form-item prop="username">
              <el-input
                v-model="loginForm.username"
                placeholder="请输入用户名"
                size="large"
                :prefix-icon="User"
                clearable
              />
            </el-form-item>
            
            <el-form-item prop="password">
              <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="请输入密码"
                size="large"
                :prefix-icon="Lock"
                show-password
                clearable
                @keyup.enter="handleLogin"
              />
            </el-form-item>
            
            <el-form-item>
              <el-button
                type="primary"
                size="large"
                :loading="loading"
                @click="handleLogin"
                class="login-btn"
              >
                登录
              </el-button>
            </el-form-item>
          </el-form>
          
          <div class="login-tips">
            <p>测试账号：admin / 111111</p>
          </div>
        </el-tab-pane>
        
        <!-- 微信扫码登录 -->
        <el-tab-pane label="微信登录" name="wechat">
          <div class="wechat-login">
            <div class="qrcode-container">
              <div v-if="qrCodeLoading" class="qrcode-loading">
                <el-icon class="is-loading"><Loading /></el-icon>
                <p>二维码生成中...</p>
              </div>
              
              <div v-else-if="qrCode" class="qrcode">
                <img :src="qrCode" alt="微信登录二维码" />
                <p class="qrcode-tip">请使用微信扫描二维码登录</p>
                <el-button @click="refreshQrCode" text>
                  <el-icon><Refresh /></el-icon>
                  刷新二维码
                </el-button>
              </div>
              
              <div v-else class="qrcode-error">
                <el-icon><Warning /></el-icon>
                <p>二维码生成失败</p>
                <el-button @click="generateQrCode" type="primary">
                  重新生成
                </el-button>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { User, Lock, Loading, Refresh, Warning } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import type { LoginForm } from '@/types'

interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const userStore = useUserStore()

// 对话框显示状态
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 当前激活的标签页
const activeTab = ref('account')

// 登录表单
const loginFormRef = ref<FormInstance>()
const loginForm = ref<LoginForm>({
  username: '',
  password: ''
})

// 表单验证规则
const loginRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

// 登录状态
const loading = ref(false)

// 微信登录相关
const qrCode = ref('')
const qrCodeLoading = ref(false)
const scene = ref('')

// 账号密码登录
const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  try {
    await loginFormRef.value.validate()
    loading.value = true
    
    await userStore.login(loginForm.value)
    
    ElMessage.success('登录成功')
    emit('success')
  } catch (error) {
    console.error('登录失败:', error)
    ElMessage.error(error instanceof Error ? error.message : '登录失败')
  } finally {
    loading.value = false
  }
}

// 生成微信登录二维码
const generateQrCode = async () => {
  try {
    qrCodeLoading.value = true
    
    // 模拟生成二维码
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 这里应该调用真实的API
    // const response = await getWechatQrCode()
    // qrCode.value = response.data.qrCode
    // scene.value = response.data.scene
    
    // 模拟数据
    qrCode.value = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+5b6u5L+h5LqM57u05LiB</text></svg>'
    scene.value = 'mock-scene-' + Date.now()
    
    // 开始轮询检查登录状态
    startPolling()
  } catch (error) {
    console.error('生成二维码失败:', error)
    ElMessage.error('生成二维码失败')
  } finally {
    qrCodeLoading.value = false
  }
}

// 刷新二维码
const refreshQrCode = () => {
  qrCode.value = ''
  generateQrCode()
}

// 轮询检查微信登录状态
let pollingTimer: number | null = null

const startPolling = () => {
  if (pollingTimer) {
    clearInterval(pollingTimer)
  }
  
  pollingTimer = setInterval(async () => {
    try {
      // 这里应该调用真实的API检查登录状态
      // const response = await checkWechatLogin(scene.value)
      // if (response.data.accessToken) {
      //   userStore.setToken(response.data.accessToken)
      //   userStore.setUser(response.data.user)
      //   ElMessage.success('登录成功')
      //   emit('success')
      //   stopPolling()
      // }
    } catch {
      // 忽略轮询错误
    }
  }, 2000)
}

const stopPolling = () => {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
}

// 关闭对话框
const handleClose = () => {
  stopPolling()
  dialogVisible.value = false
  
  // 重置表单
  loginForm.value = {
    username: '',
    password: ''
  }
  qrCode.value = ''
  activeTab.value = 'account'
}

// 监听标签页切换
watch(activeTab, (newTab) => {
  if (newTab === 'wechat' && !qrCode.value) {
    generateQrCode()
  } else if (newTab === 'account') {
    stopPolling()
  }
})

// 监听对话框关闭
watch(dialogVisible, (visible) => {
  if (!visible) {
    stopPolling()
  }
})
</script>

<style scoped lang="scss">
.login-dialog {
  :deep(.el-dialog__header) {
    text-align: center;
    padding: 20px 20px 0;
    
    .el-dialog__title {
      font-size: 20px;
      font-weight: 600;
      color: var(--text-primary);
    }
  }
  
  :deep(.el-dialog__body) {
    padding: 20px;
  }
}

.login-content {
  .login-tabs {
    :deep(.el-tabs__header) {
      margin-bottom: 30px;
    }
    
    :deep(.el-tabs__nav-wrap::after) {
      display: none;
    }
    
    :deep(.el-tabs__item) {
      font-size: 16px;
      font-weight: 500;
    }
  }
}

.login-form {
  .el-form-item {
    margin-bottom: 20px;
  }
  
  .login-btn {
    width: 100%;
    height: 44px;
    font-size: 16px;
    font-weight: 500;
  }
}

.login-tips {
  text-align: center;
  margin-top: 20px;
  
  p {
    color: var(--text-secondary);
    font-size: 14px;
    margin: 0;
  }
}

.wechat-login {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.qrcode-container {
  text-align: center;
  width: 200px;
}

.qrcode-loading,
.qrcode-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 40px 0;
  
  .el-icon {
    font-size: 32px;
    color: var(--text-secondary);
  }
  
  p {
    color: var(--text-secondary);
    margin: 0;
  }
}

.qrcode {
  img {
    width: 200px;
    height: 200px;
    border: 1px solid var(--border-lighter);
    border-radius: 8px;
  }
  
  .qrcode-tip {
    margin: 16px 0 8px;
    color: var(--text-secondary);
    font-size: 14px;
  }
}
</style>