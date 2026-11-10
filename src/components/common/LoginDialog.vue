<template>
  <el-dialog
    v-model="dialogVisible"
    title=""
    width="480px"
    :before-close="handleClose"
    class="login-dialog"
    align-center
    :modal-class="'custom-modal'"
    :show-close="true"
  >
    <div class="login-content">
      <div class="login-hero">
        <div class="hero-glow"></div>
        <div class="hero-title">{{ t('login.welcomeBack') }}</div>
        <div class="hero-subtitle">{{ t('login.subtitle') }}</div>
      </div>
      <el-tabs v-model="activeTab" class="login-tabs">
        <!-- 账号密码登录 -->
        <el-tab-pane :label="t('login.accountTab')" name="account">
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
                :placeholder="t('login.usernamePlaceholder')"
                size="large"
                :prefix-icon="User"
                clearable
              />
            </el-form-item>

            <el-form-item prop="password">
              <el-input
                v-model="loginForm.password"
                type="password"
                :placeholder="t('login.passwordPlaceholder')"
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
                {{ t('login.loginBtn') }}
              </el-button>
            </el-form-item>
          </el-form>

          <div class="login-tips">
            <p>{{ t('login.testAccount') }}</p>
          </div>
        </el-tab-pane>

        <!-- 微信扫码登录 -->
        <el-tab-pane :label="t('login.wechatTab')" name="wechat">
          <div class="wechat-login">
            <!-- Mock模式提示 -->
            <div v-if="isMockEnabled()" class="mock-notice">
              <el-icon class="notice-icon">
                <Warning/>
              </el-icon>
              <div class="notice-content">
                <p class="notice-title">{{ t('login.mockEnabled') }}</p>
                <p class="notice-text">{{ t('login.mockWechatUnavailable') }}</p>
                <p class="notice-text">{{ t('login.mockSwitchAccount') }}</p>
              </div>
            </div>

            <!-- 二维码容器 -->
            <div v-else class="qrcode-container">
              <div v-if="qrCodeLoading" class="qrcode-loading">
                <el-icon class="is-loading">
                  <Loading/>
                </el-icon>
                <p>{{ t('login.qrCodeLoading') }}</p>
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
                <p class="qrcode-tip">{{ t('login.qrCodeTip') }}</p>
                <el-button @click="refreshQrCode" text>
                  <el-icon>
                    <Refresh/>
                  </el-icon>
                  {{ t('login.refreshQrCode') }}
                </el-button>
              </div>

              <div v-else class="qrcode-error">
                <el-icon>
                  <Warning/>
                </el-icon>
                <p>{{ t('login.qrCodeFailed') }}</p>
                <el-button @click="generateQrCode" type="primary">
                  {{ t('login.regenerate') }}
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
import {getWechatAuthUrl} from '@/api/auth'
import {isMockEnabled} from '@/config/mock'
import type {LoginForm} from '@/types'
import { useI18n } from 'vue-i18n'

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
const { t } = useI18n()

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
const loginRules = computed<FormRules>(() => ({
  username: [
    {required: true, message: t('login.usernameRequired'), trigger: 'blur'}
  ],
  password: [
    {required: true, message: t('login.passwordRequired'), trigger: 'blur'},
    {min: 6, message: t('login.passwordMinLength'), trigger: 'blur'}
  ]
}))

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
    ElMessage.error(error instanceof Error ? error.message : t('login.loginFailed'))
  } finally {
    loading.value = false
  }
}

const generateQrCode = async () => {
  // 检查是否为Mock模式
  if (isMockEnabled()) {
    ElMessage.warning(t('login.mockWechatWarning'))
    qrCode.value = ''
    return
  }

  try {
    qrCodeLoading.value = true
    const response = await getWechatAuthUrl()
    const authUrl = resolveAuthUrl(response)
    if (!authUrl) {
      throw new Error(t('login.authUrlEmpty'))
    }
    qrCode.value = authUrl
    qrCodeMode.value = 'iframe'
    window.location.href = authUrl
  } catch (error) {
    console.error('生成二维码失败:', error)
    ElMessage.error(t('login.generateQrCodeFailed'))
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
    border-radius: 24px;
    box-shadow:
      0 25px 50px -12px rgba(0, 0, 0, 0.25),
      0 0 0 1px rgba(255, 255, 255, 0.1) inset;
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.2);
    overflow: hidden;
    position: relative;
    animation: dialog-pop 0.5s cubic-bezier(0.16, 1, 0.3, 1);

    .dark & {
      background: rgba(30, 30, 30, 0.7);
      border-color: rgba(255, 255, 255, 0.05);
      box-shadow:
        0 25px 50px -12px rgba(0, 0, 0, 0.5),
        0 0 0 1px rgba(255, 255, 255, 0.05) inset;
    }
  }

  :deep(.el-dialog__header) {
    padding: 0;
    margin-right: 0;
    text-align: center;
    background: transparent;

    .el-dialog__title {
      display: none;
    }
  }

  :deep(.el-dialog__body) {
    padding: 40px 48px 48px;
  }

  :deep(.el-dialog__headerbtn) {
    top: 24px;
    right: 24px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.05);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: none;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;

    .dark & {
      background: rgba(255, 255, 255, 0.1);
    }

    &:hover {
      background: var(--primary-color);
      transform: rotate(90deg) scale(1.1);
      box-shadow: 0 4px 12px rgba(var(--primary-color-rgb), 0.3);

      .el-dialog__close {
        color: white;
      }
    }

    .el-dialog__close {
      color: var(--text-secondary);
      font-size: 18px;
      transition: color 0.3s;
    }
  }
}

.login-content {
  .login-hero {
    text-align: center;
    margin-bottom: 40px;
    position: relative;

    .hero-glow {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 120px;
      height: 120px;
      background: var(--primary-color);
      opacity: 0.15;
      filter: blur(40px);
      border-radius: 50%;
      z-index: -1;
    }

    .hero-title {
      font-size: 32px;
      font-weight: 800;
      color: var(--text-primary);
      margin-bottom: 12px;
      background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      letter-spacing: -0.5px;
    }

    .hero-subtitle {
      font-size: 16px;
      color: var(--text-secondary);
      font-weight: 500;
    }
  }

  .login-tabs {
    :deep(.el-tabs__header) {
      margin-bottom: 32px;
    }

    :deep(.el-tabs__nav-wrap::after) {
      height: 1px;
      background-color: var(--border-light);
      opacity: 0.5;
    }

    :deep(.el-tabs__item) {
      font-size: 16px;
      font-weight: 500;
      color: var(--text-secondary);
      padding: 0 24px;
      transition: all 0.3s;
      height: 48px;
      line-height: 48px;

      &.is-active {
        color: var(--primary-color);
        font-weight: 700;
      }

      &:hover {
        color: var(--primary-color);
      }
    }

    :deep(.el-tabs__active-bar) {
      background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
      height: 3px;
      border-radius: 3px;
      box-shadow: 0 2px 8px rgba(var(--primary-color-rgb), 0.3);
    }
  }

  .login-form {
    :deep(.el-input__wrapper) {
      box-shadow: none;
      background: var(--bg-color-soft);
      border: 1px solid transparent;
      border-radius: 12px;
      padding: 8px 16px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &.is-focus {
        background: var(--bg-surface);
        border-color: var(--primary-color);
        box-shadow: 0 0 0 4px rgba(var(--primary-color-rgb), 0.1);
      }

      &:hover:not(.is-focus) {
        background: var(--bg-surface);
        border-color: var(--border-light);
      }
    }

    :deep(.el-input__inner) {
      height: 32px;
      font-size: 16px;
    }

    .login-btn {
      width: 100%;
      height: 52px;
      font-size: 18px;
      font-weight: 600;
      border-radius: 12px;
      margin-top: 12px;
      background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
      border: none;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 8px 20px -6px rgba(var(--primary-color-rgb), 0.4);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 24px -8px rgba(var(--primary-color-rgb), 0.5);
      }

      &:active {
        transform: translateY(0);
      }
    }
  }

  .login-tips {
    margin-top: 24px;
    text-align: center;
    font-size: 14px;
    color: var(--text-tertiary);
    background: var(--bg-color-soft);
    padding: 12px;
    border-radius: 8px;
    border: 1px dashed var(--border-light);
  }

  .wechat-login {
    display: flex;
    justify-content: center;
    padding: 20px 0;

    .mock-notice {
      width: 100%;
      max-width: 360px;
      background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
      border: 2px solid #ffb74d;
      border-radius: 16px;
      padding: 24px;
      display: flex;
      align-items: flex-start;
      gap: 16px;
      box-shadow: 0 4px 12px rgba(255, 152, 0, 0.15);

      .dark & {
        background: linear-gradient(135deg, rgba(255, 152, 0, 0.15) 0%, rgba(255, 152, 0, 0.1) 100%);
        border-color: rgba(255, 152, 0, 0.3);
      }

      .notice-icon {
        font-size: 28px;
        color: #f57c00;
        flex-shrink: 0;
        margin-top: 2px;
      }

      .notice-content {
        flex: 1;

        .notice-title {
          font-size: 16px;
          font-weight: 600;
          color: #e65100;
          margin-bottom: 8px;

          .dark & {
            color: #ffb74d;
          }
        }

        .notice-text {
          font-size: 14px;
          color: #f57c00;
          line-height: 1.6;
          margin-bottom: 4px;

          .dark & {
            color: #ffcc80;
          }

          &:last-child {
            margin-bottom: 0;
          }
        }
      }
    }

    .qrcode-container {
      width: 280px;
      height: 280px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--border-extra-light);

      .qrcode-media {
        width: 200px;
        height: 200px;
        margin-bottom: 16px;

        img, iframe {
          width: 100%;
          height: 100%;
          border: none;
        }
      }

      .qrcode-tip {
        font-size: 14px;
        color: var(--text-secondary);
        margin-bottom: 8px;
      }
    }
  }
}

@keyframes dialog-pop {
  0% {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
