<template>
  <el-dialog
    v-model="dialogVisible"
    title="用户登录"
    width="500px"
    :before-close="handleClose"
    class="login-dialog"
    center
    :modal-class="'custom-modal'"
  >
    <div class="login-content">
      <div class="login-hero">
        <div class="hero-glow"></div>
        <div class="hero-title">欢迎回来</div>
        <div class="hero-subtitle">登录后继续使用系统</div>
      </div>
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
                <el-icon class="is-loading">
                  <Loading/>
                </el-icon>
                <p>二维码生成中...</p>
              </div>

              <div v-else-if="qrCode" class="qrcode">
                <div class="qrcode-media">
                  <img v-if="qrCodeMode === 'image'" :src="qrCode" alt="微信登录二维码"/>
                  <iframe
                    v-else
                    :src="qrCode"
                    class="qrcode-iframe"
                    title="微信登录二维码"
                  />
                </div>
                <p class="qrcode-tip">请使用微信扫描二维码登录</p>
                <el-button @click="refreshQrCode" text>
                  <el-icon>
                    <Refresh/>
                  </el-icon>
                  刷新二维码
                </el-button>
              </div>

              <div v-else class="qrcode-error">
                <el-icon>
                  <Warning/>
                </el-icon>
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
import {ref, computed, watch} from 'vue'
import {ElMessage, type FormInstance, type FormRules} from 'element-plus'
import {User, Lock, Loading, Refresh, Warning} from '@element-plus/icons-vue'
import {useUserStore} from '@/stores/user'
import {getWechatAuthUrl} from '@/api'
import type {LoginForm} from '@/types'

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
    {required: true, message: '请输入用户名', trigger: 'blur'}
  ],
  password: [
    {required: true, message: '请输入密码', trigger: 'blur'},
    {min: 6, message: '密码长度不能少于6位', trigger: 'blur'}
  ]
}

// 登录状态
const loading = ref(false)

// 微信登录相关
const qrCode = ref('')
const qrCodeLoading = ref(false)
const qrCodeMode = ref<'image' | 'iframe'>('image')

const normalizeAuthUrl = (value?: string): string => {
  if (!value) return ''
  let cleaned = value.trim()
  cleaned = cleaned.replace(/^`+|`+$/g, '')
  cleaned = cleaned.replace(/^"+|"+$/g, '')
  cleaned = cleaned.replace(/^'+|'+$/g, '')
  return cleaned.trim()
}

const resolveAuthUrl = (payload: unknown): string => {
  if (typeof payload === 'string') {
    return normalizeAuthUrl(payload)
  }
  if (!payload || typeof payload !== 'object') {
    return ''
  }
  const root = payload as Record<string, unknown>
  const candidates: Record<string, unknown>[] = [root]
  const directData = root.data
  const directResult = root.result
  if (directData && typeof directData === 'object') {
    candidates.push(directData as Record<string, unknown>)
  } else if (typeof directData === 'string') {
    candidates.push({ url: directData })
  }
  if (directResult && typeof directResult === 'object') {
    candidates.push(directResult as Record<string, unknown>)
  } else if (typeof directResult === 'string') {
    candidates.push({ url: directResult })
  }
  const keys = ['authUrl', 'auth_url', 'url', 'link']
  for (const item of candidates) {
    for (const key of keys) {
      const value = item[key]
      if (typeof value === 'string' && value.trim()) {
        return normalizeAuthUrl(value)
      }
    }
  }
  return ''
}

// 账号密码登录
const handleLogin = async () => {
  if (!loginFormRef.value) return

  try {
    await loginFormRef.value.validate()
    loading.value = true

    await userStore.login(loginForm.value)

    emit('success')
  } catch (error) {
    console.error('登录失败:', error)
    ElMessage.error(error instanceof Error ? error.message : '登录失败')
  } finally {
    loading.value = false
  }
}

const generateQrCode = async () => {
  try {
    qrCodeLoading.value = true
    const response = await getWechatAuthUrl()
    const authUrl = resolveAuthUrl(response)
    if (!authUrl) {
      throw new Error('登录链接为空')
    }
    qrCode.value = authUrl
    qrCodeMode.value = 'iframe'
    window.location.href = authUrl
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
  qrCodeMode.value = 'image'
  generateQrCode()
}

// 关闭对话框
const handleClose = () => {
  dialogVisible.value = false

  // 重置表单
  loginForm.value = {
    username: '',
    password: ''
  }
  qrCode.value = ''
  qrCodeMode.value = 'image'
  activeTab.value = 'account'
}

// 监听标签页切换
watch(activeTab, (newTab) => {
  if (newTab === 'wechat' && !qrCode.value) {
    generateQrCode()
  } else if (newTab === 'account') {
    // no-op
  }
})

// 监听对话框关闭
watch(dialogVisible, (visible) => {
  if (!visible) return
})
</script>

<style scoped lang="scss">
.login-dialog {
  :deep(.el-dialog) {
    max-width: 480px;
    border-radius: 20px;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.18), 0 0 40px rgba(64, 158, 255, 0.15);
    background: radial-gradient(circle at top, rgba(64, 158, 255, 0.08), transparent 45%), var(--bg-color);
    backdrop-filter: blur(20px);
    border: 1px solid var(--border-extra-light);
    overflow: hidden;
    position: relative;
    animation: dialog-pop 0.45s cubic-bezier(0.22, 1, 0.36, 1);

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, var(--primary-color), var(--success-color), var(--info-color));
    }

    &::after {
      content: '';
      position: absolute;
      inset: -2px;
      border-radius: 22px;
      padding: 2px;
      background: linear-gradient(135deg, rgba(64, 158, 255, 0.35), rgba(103, 194, 58, 0.25), rgba(144, 147, 153, 0.15));
      mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      mask-composite: xor;
      pointer-events: none;
      opacity: 0.6;
    }
  }

  :deep(.el-dialog__header) {
    text-align: center;
    padding: 35px 30px 25px;
    border-bottom: 1px solid var(--border-extra-light);
    background: linear-gradient(135deg, var(--bg-color) 0%, var(--bg-color-page) 100%);
    position: relative;

    &::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 50%;
      transform: translateX(-50%);
      width: 60px;
      height: 2px;
      background: linear-gradient(90deg, var(--primary-color), var(--primary-light));
      border-radius: 1px;
    }

    .el-dialog__title {
      font-size: 26px;
      font-weight: 700;
      color: var(--text-primary);
      background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 8px;
    }
  }

  :deep(.el-dialog__body) {
    padding: 30px;
    background: var(--bg-color);
  }

  :deep(.el-dialog__headerbtn) {
    top: 20px;
    right: 20px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--bg-color-page);
    transition: all var(--transition-duration);
    border: 1px solid var(--border-extra-light);

    &:hover {
      background: var(--danger-color);
      transform: rotate(90deg) scale(1.1);
      border-color: var(--danger-color);
      box-shadow: 0 4px 12px rgba(245, 108, 108, 0.3);

      .el-dialog__close {
        color: #ffffff;
      }
    }
  }
}

.login-content {
  animation: content-fade 0.5s ease;

  .login-hero {
    position: relative;
    padding: 18px 16px 24px;
    border-radius: 16px;
    background: linear-gradient(135deg, rgba(64, 158, 255, 0.08), rgba(103, 194, 58, 0.08));
    border: 1px solid var(--border-extra-light);
    margin-bottom: 22px;
    overflow: hidden;
  }

  .hero-glow {
    position: absolute;
    top: -60px;
    right: -40px;
    width: 140px;
    height: 140px;
    background: radial-gradient(circle, rgba(64, 158, 255, 0.35), transparent 70%);
    filter: blur(2px);
    animation: glow-float 6s ease-in-out infinite;
  }

  .hero-title {
    font-size: 20px;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: 0.5px;
  }

  .hero-subtitle {
    margin-top: 6px;
    font-size: 13px;
    color: var(--text-secondary);
  }

  .login-tabs {
    :deep(.el-tabs__header) {
      margin-bottom: 35px;
      background: var(--bg-color-page);
      border-radius: 16px;
      padding: 6px;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    :deep(.el-tabs__nav-wrap::after) {
      display: none;
    }

    :deep(.el-tabs__item) {
      font-size: 16px;
      font-weight: 600;
      border-radius: 12px;
      margin: 0 3px;
      padding: 12px 20px;
      transition: all var(--transition-duration);
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
        transition: left 0.6s;
      }

      &:hover::before {
        left: 100%;
      }

      &.is-active {
        background: linear-gradient(135deg, var(--bg-color), var(--border-extra-light));
        color: var(--primary-color);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        border: 1px solid var(--border-lighter);
        transform: translateY(-1px);
      }
    }

    :deep(.el-tabs__active-bar) {
      display: none;
    }
  }
}

.login-form {
  .el-form-item {
    margin-bottom: 28px;
    position: relative;
  }

  :deep(.el-input) {
    .el-input__wrapper {
      border-radius: 14px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      border: 2px solid var(--border-lighter);
      transition: all var(--transition-duration);
      padding: 4px 16px;
      background: var(--bg-color);
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(64, 158, 255, 0.05), transparent);
        transition: left 0.6s;
      }

      &:hover {
        border-color: var(--primary-light);
        box-shadow: 0 8px 18px rgba(64, 158, 255, 0.18), 0 0 0 1px rgba(64, 158, 255, 0.12);

        &::before {
          left: 100%;
        }
      }

      &.is-focus {
        border-color: var(--primary-color);
        box-shadow: 0 10px 22px rgba(64, 158, 255, 0.3), 0 0 0 2px rgba(64, 158, 255, 0.18);
      }

      .el-input__inner {
        font-size: 15px;
        font-weight: 500;
      }
    }

    .el-input__prefix {
      .el-icon {
        font-size: 18px;
        color: var(--text-secondary);
        transition: color var(--transition-duration);
      }
    }

    &:hover .el-input__prefix .el-icon {
      color: var(--primary-color);
    }
  }

  .login-btn {
    width: 100%;
    height: 52px;
    font-size: 16px;
    font-weight: 700;
    border-radius: 14px;
    background: linear-gradient(135deg, var(--primary-color), var(--primary-light), rgba(64, 158, 255, 0.6));
    border: none;
    box-shadow: 0 6px 16px rgba(64, 158, 255, 0.3);
    transition: all var(--transition-duration);
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
      transition: left 0.6s;
    }

    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 14px 28px rgba(64, 158, 255, 0.45), 0 0 18px rgba(64, 158, 255, 0.35);

      &::before {
        left: 100%;
      }
    }

    &:active {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(64, 158, 255, 0.3);
    }

    &.is-loading {
      transform: none;
    }
  }
}

.login-tips {
  text-align: center;
  margin-top: 20px;
  opacity: 0.8;
  letter-spacing: 0.3px;

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
  display: flex;
  flex-direction: column;
  align-items: center;

  .qrcode-media {
    width: 180px;
    height: 180px;
    border: 1px solid var(--border-lighter);
    border-radius: 8px;
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
    overflow: hidden;
    background: #ffffff;
  }

  img {
    width: 100%;
    height: 100%;
    display: block;
    animation: qrcode-float 4s ease-in-out infinite;
  }

  .qrcode-iframe {
    width: 240px;
    height: 240px;
    border: none;
    transform: scale(0.75);
    transform-origin: top left;
  }

  .qrcode-tip {
    margin: 12px 0 6px;
    color: var(--text-secondary);
    font-size: 14px;
  }
}

:deep(.custom-modal) {
  backdrop-filter: blur(16px);
  background: rgba(12, 17, 28, 0.55);
}

@keyframes dialog-pop {
  0% {
    transform: translateY(20px) scale(0.98);
    opacity: 0;
  }
  100% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

@keyframes content-fade {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes glow-float {
  0%, 100% {
    transform: translateY(0);
    opacity: 0.7;
  }
  50% {
    transform: translateY(10px);
    opacity: 1;
  }
}

@keyframes qrcode-float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}
</style>
