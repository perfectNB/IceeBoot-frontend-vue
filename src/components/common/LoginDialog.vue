<template>
  <el-dialog
    v-model="dialogVisible"
    :title="t('login.title')"
    width="min(780px, calc(100vw - 32px))"
    :before-close="handleClose"
    class="login-dialog"
    align-center
    modal-class="icee-login-overlay"
    @closed="resetForm"
    :show-close="true"
  >
    <div class="login-content">
      <aside class="brand-panel" aria-hidden="true">
        <div class="brand-signature"><img src="@/assets/logo.png" alt="" />IceeBoot</div>
        <BrandMascot :paused="paused || !dialogVisible" :eyes-closed="passwordFocused" />
      </aside>
      <div class="login-fields">
        <div class="login-hero">
          <h2 class="hero-title">{{ t('login.welcomeBack') }}</h2>
          <p class="hero-subtitle">{{ t('login.subtitle') }}</p>
        </div>
      <el-tabs v-model="activeTab" class="login-tabs">
        <!-- 账号密码登录 -->
        <el-tab-pane :label="t('login.accountTab')" name="account">
          <el-form
            ref="loginFormRef"
            :model="loginForm"
            :rules="loginRules"
            label-position="top"
            @submit.prevent="handleLogin"
            class="login-form"
          >
            <el-form-item prop="username" :label="t('login.usernameLabel')">
              <el-input
                v-model="loginForm.username"
                autocomplete="username"
                :validate-event="false"
                :placeholder="t('login.usernamePlaceholder')"
                size="large"
                :prefix-icon="User"
                clearable
              />
            </el-form-item>

            <el-form-item prop="password" :label="t('login.passwordLabel')">
              <el-input
                v-model="loginForm.password"
                autocomplete="current-password"
                :validate-event="false"
                @focus="passwordFocused = true"
                @blur="passwordFocused = false"
                type="password"
                :placeholder="t('login.passwordPlaceholder')"
                size="large"
                :prefix-icon="Lock"
                show-password
                clearable
              />
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                size="large"
                :loading="loading"
                native-type="submit"
                class="login-btn"
              >
                {{ t('login.loginBtn') }}
              </el-button>
            </el-form-item>
          </el-form>

          <div v-if="isMockEnabled()" class="login-tips">
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
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import {ref, computed, watch} from 'vue'
import {ElMessage, type FormInstance, type FormRules} from 'element-plus'
import {User, Lock, Loading, Refresh, Warning} from '@element-plus/icons-vue'
import BrandMascot from './BrandMascot.vue'
import {useUserStore} from '@/stores/user'
import {getWechatAuthUrl} from '@/api/auth'
import {isMockEnabled} from '@/config/mock'
import type {LoginForm} from '@/types'
import { useI18n } from 'vue-i18n'

interface Props {
  modelValue: boolean
  paused?: boolean
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
const passwordFocused = ref(false)

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
  if (!loginFormRef.value || loading.value) return
  loading.value = true
  try {
    if (!(await loginFormRef.value.validate().catch(() => false))) return

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

}

const resetForm = () => {
  if (dialogVisible.value) return
  passwordFocused.value = false
  loginFormRef.value?.clearValidate()
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
  }
})

</script>

<style scoped lang="scss">
:global(.el-dialog.login-dialog) {
  --login-surface: #fff;
  --login-ink: #17253b;
  --login-muted: #627086;
  --login-line: #e0e7ef;
  --login-soft: #f4f7fc;
  --login-accent: #2856d8;
  --login-button: #2856d8;
  --login-button-hover: #2047b6;
  --login-notice-bg: #fff7e8;
  --login-notice-ink: #845117;
  --login-notice-line: #eed6ae;
  --el-text-color-primary: var(--login-ink);
  --el-text-color-regular: var(--login-ink);
  --el-text-color-secondary: var(--login-muted);
  --el-color-primary: var(--login-accent);

  max-width: calc(100vw - 32px);
  max-height: calc(100dvh - 32px);
  padding: 0;
  overflow-y: auto;
  border: 1px solid var(--login-line);
  border-radius: 24px;
  background: var(--login-surface);
  color: var(--login-ink);
  box-shadow: 0 20px 60px -24px #14295840;
}

:global([data-theme='dark'] .el-dialog.login-dialog) {
  --login-surface: #172131;
  --login-ink: #edf2fc;
  --login-muted: #a8b6cb;
  --login-line: #2d3a4e;
  --login-soft: #1e2a3d;
  --login-accent: #94b3ff;
  --login-notice-bg: #322a20;
  --login-notice-ink: #f0c58d;
  --login-notice-line: #655033;
}

:global(.login-dialog .el-dialog__header) {
  padding: 0;
  margin: 0;
}

:global(.login-dialog .el-dialog__body) {
  padding: 0;
}

:global(.login-dialog .el-dialog__headerbtn) {
  z-index: 2;
  top: 10px;
  right: 10px;
  width: 44px;
  height: 44px;
  border-radius: 8px;
  color: var(--login-muted);
  transition: background-color 160ms ease, color 160ms ease;
}

:global(.login-dialog .el-dialog__headerbtn:hover) {
  background: var(--login-soft);
  color: var(--login-accent);
}

:global(.login-dialog .el-dialog__headerbtn:focus-visible) {
  outline: 2px solid var(--login-accent);
  outline-offset: -4px;
}

:global(.login-dialog .el-dialog__close) {
  color: inherit;
}

/* Element Plus owns the dialog header and its accessible title. */
:global(.login-dialog .el-dialog__title) {
  position: absolute;
  clip-path: inset(50%);
  width: 1px;
  height: 1px;
  overflow: hidden;
}
:global(.icee-login-overlay) { background: #102a4380; backdrop-filter: blur(5px); }
.login-content {
  display: grid;
  grid-template-columns: minmax(0, .82fr) minmax(0, 1.18fr);
  min-width: 0;
  font-family: inherit;
}

.brand-panel {
  position: relative;
  display: grid;
  align-items: center;
  overflow: hidden;
  background: radial-gradient(ellipse at 17% 2%, #72dcff, transparent 58%),
    linear-gradient(145deg, #42b6ef 5%, #1475cb 62%, #124b9c);
}
.brand-signature {
  position: absolute;
  top: 25px;
  left: 24px;
  display: flex;
  align-items: center;
  gap: 7px;
  color: #092b54;
  font-weight: 750;
  font-size: 19px;
}
.brand-signature img { width: 26px; height: 26px; }
.brand-panel .brand-scene { width: 110%; margin-left: -5%; color: #fff; }
.login-fields { min-width: 0; padding: 42px 32px 26px; }
.login-form :deep(.el-form-item__label) { margin-bottom: 5px; line-height: 18px; color: var(--login-ink); }
.login-form :deep(.el-form-item__label::before) { display: none; }

.login-hero {
  margin-bottom: 24px;
  text-align: left;

  .hero-title {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0 0 6px;
    color: var(--login-ink);
    font-size: 27px;
    font-weight: 650;
    line-height: 1.3;
    letter-spacing: -0.03em;
  }

  .hero-subtitle {
    margin: 0;
    color: var(--login-muted);
    font-size: 14px;
    line-height: 1.7;
    overflow-wrap: anywhere;
  }
}

.login-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 20px;
  }

  :deep(.el-tabs__nav-wrap::after) {
    height: 1px;
    background: var(--login-line);
  }

  :deep(.el-tabs__nav) {
    display: flex;
    float: none;
    width: 100%;
  }

  :deep(.el-tabs__item) {
    flex: 1;
    height: 48px;
    padding: 0 12px;
    color: var(--login-muted);
    font-size: 14px;
    font-weight: 500;
    transition: color 160ms ease;
  }

  :deep(.el-tabs__item.is-active),
  :deep(.el-tabs__item:hover) {
    color: var(--login-accent);
  }

  :deep(.el-tabs__item:focus-visible) {
    outline: 2px solid var(--login-accent);
    outline-offset: -4px;
    border-radius: 4px;
  }

  :deep(.el-tabs__active-bar) {
    height: 2px;
    background: var(--login-accent);
  }
}

.login-form {
  :deep(.el-form-item) {
    margin-bottom: 22px;
  }

  :deep(.el-input__wrapper) {
    min-height: 48px;
    padding: 0 14px;
    border: 1px solid var(--login-line);
    border-radius: 8px;
    background: var(--login-surface);
    box-shadow: none;
    transition: border-color 160ms ease, background-color 160ms ease;
  }

  :deep(.el-input__wrapper:hover) {
    border-color: var(--login-muted);
  }

  :deep(.el-input__wrapper.is-focus) {
    border-color: var(--login-accent);
    outline: 2px solid var(--login-accent);
    outline-offset: 2px;
    box-shadow: none;
  }

  :deep(.el-form-item.is-error .el-input__wrapper) {
    border-color: var(--el-color-danger);
    box-shadow: none;
  }

  :deep(.el-input__inner) {
    height: 46px;
    color: var(--login-ink);
    font-size: 16px;
  }

  :deep(.el-input__inner::placeholder),
  :deep(.el-input__prefix) {
    color: var(--login-muted);
  }

  .login-btn {
    width: 100%;
    height: 48px;
    margin-top: 4px;
    border: 1px solid var(--login-button);
    border-radius: 8px;
    background: var(--login-button);
    color: #fff;
    font-size: 15px;
    font-weight: 600;
    box-shadow: none;
    transition: background-color 160ms ease, border-color 160ms ease;

    &:hover:not(.is-loading) {
      border-color: var(--login-button-hover);
      background: var(--login-button-hover);
    }

    &:focus-visible {
      outline: 2px solid var(--login-accent);
      outline-offset: 3px;
    }
  }
}

.login-tips {
  padding: 12px 14px;
  border: 1px solid var(--login-line);
  border-radius: 8px;
  background: var(--login-soft);
  color: var(--login-muted);
  font-size: 12px;
  line-height: 1.7;
  overflow-wrap: anywhere;

  p {
    margin: 0;
  }
}

.wechat-login {
  display: flex;
  justify-content: center;
  padding-block: 8px;

  .mock-notice {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    width: 100%;
    padding: 20px;
    border: 1px solid var(--login-notice-line);
    border-radius: 8px;
    background: var(--login-notice-bg);
    color: var(--login-notice-ink);
  }

  .notice-icon {
    flex-shrink: 0;
    margin-top: 2px;
    font-size: 20px;
  }

  .notice-content {
    min-width: 0;

    p {
      margin: 0;
      overflow-wrap: anywhere;
    }

    .notice-title {
      margin-bottom: 8px;
      font-size: 14px;
      font-weight: 600;
    }

    .notice-text {
      font-size: 13px;
      line-height: 1.8;
    }
  }

  .qrcode-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    max-width: 280px;
    min-height: 280px;
    padding: 20px;
    border: 1px solid var(--login-line);
    border-radius: 10px;
    background: var(--login-surface);

    .qrcode-media {
      width: 200px;
      max-width: 100%;
      aspect-ratio: 1;
      margin-bottom: 16px;
      background: #fff;

      img,
      iframe {
        display: block;
        width: 100%;
        height: 100%;
        border: 0;
      }
    }

    .qrcode-tip {
      margin: 0 0 8px;
      color: var(--login-muted);
      font-size: 13px;
      line-height: 1.7;
      text-align: center;
    }

    .qrcode-loading,
    .qrcode-error {
      color: var(--login-muted);
      font-size: 14px;
      line-height: 1.7;
      text-align: center;

      > .el-icon {
        color: var(--login-accent);
        font-size: 24px;
      }
    }
  }
}

@media (max-width: 640px) {
  .login-content { grid-template-columns: 1fr; }
  .brand-panel { height: 92px; }
  .brand-signature { left: 24px; top: 29px; }
  .brand-panel .brand-scene { position: absolute; width: 135px; right: 13%; top: -17px; }
  .login-fields { padding: 20px 24px 24px; }
  .login-hero { margin-bottom: 12px; }
  :global(.login-dialog .el-dialog__headerbtn) { background: var(--login-surface); }
}
@media (prefers-reduced-motion: reduce) {
  :global(.login-dialog .el-dialog__headerbtn),
  .login-content :deep(.el-tabs__item),
  .login-content :deep(.el-tabs__active-bar),
  .login-content :deep(.el-input__wrapper),
  .login-form .login-btn {
    transition: none;
  }
}
</style>
