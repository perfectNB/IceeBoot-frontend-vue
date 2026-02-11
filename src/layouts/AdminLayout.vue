<template>
  <div class="admin-layout">
    <!-- 侧边栏 -->
    <aside
      class="sidebar"
      :class="{ 'sidebar-collapsed': isCollapsed }"
    >
      <div class="sidebar-header">
        <div class="logo">
          <img src="@/assets/logo.svg" alt="IceeBoot" class="logo-img" />
          <span v-show="!isCollapsed" class="logo-text">IceeBoot</span>
        </div>
      </div>

      <div class="sidebar-content">
        <SidebarMenu :menus="menus" :collapsed="isCollapsed" />
      </div>
    </aside>

    <!-- 主内容区 -->
    <div class="main-container">
      <!-- 顶部导航 -->
      <header class="header">
        <div class="header-left">
          <el-button
            :icon="isCollapsed ? Expand : Fold"
            @click="toggleSidebar"
            text
            class="collapse-btn"
          />

          <el-breadcrumb separator="/" class="breadcrumb">
            <el-breadcrumb-item
              v-for="item in breadcrumbs"
              :key="item.path"
              :to="item.path"
            >
              {{ item.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-right">
          <!-- 主题切换 -->
          <el-button
            :icon="isDark ? Sunny : Moon"
            @click="toggleTheme"
            text
            class="theme-btn"
          />

          <!-- 语言切换 -->
          <LanguageSwitcher />

          <!-- 消息中心 -->
          <el-dropdown @command="handleMessageCommand" class="message-dropdown">
            <div class="message-info">
              <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99">
                <el-button
                  :icon="Bell"
                  text
                  class="message-btn"
                />
              </el-badge>
            </div>

            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="center">
                  <el-icon><Message /></el-icon>
                  {{ t('layout.messageCenter') }}
                  <el-tag v-if="unreadCount > 0" type="danger" size="small" class="unread-tag">
                    {{ unreadCount }}
                  </el-tag>
                </el-dropdown-item>
                <el-dropdown-item command="markAllRead" :disabled="unreadCount === 0">
                  <el-icon><Check /></el-icon>
                  {{ t('layout.markAllRead') }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <!-- 用户信息 -->
          <el-dropdown @command="handleUserCommand">
            <div class="user-info">
              <el-avatar
                :src="userStore.user?.avatar"
                :size="32"
                class="user-avatar"
              >
                {{ userStore.user?.nickname?.charAt(0) }}
              </el-avatar>
              <span class="user-name">{{ userStore.user?.nickname }}</span>
              <el-icon class="arrow-down"><ArrowDown /></el-icon>
            </div>

            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  {{ t('layout.profileCenter') }}
                </el-dropdown-item>
<!--                <el-dropdown-item command="settings">-->
<!--                  <el-icon><Setting /></el-icon>-->
<!--                  系统设置-->
<!--                </el-dropdown-item>-->
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  {{ t('layout.logout') }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <!-- 内容区域 -->
      <main class="content">
        <router-view v-slot="{ Component }">
          <transition name="page" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import {
  Fold,
  Expand,
  Moon,
  Sunny,
  User,
  SwitchButton,
  ArrowDown,
  Bell,
  Message,
  Check
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { logout } from '@/api/auth'
import { isMockEnabled } from '@/config/mock'
import { isDark, toggleTheme } from '@/utils/theme'
import { getMessageStats, allRead } from '@/api/message'
import SidebarMenu from '@/components/common/SidebarMenu.vue'
import LanguageSwitcher from '@/components/common/LanguageSwitcher.vue'

const { t } = useI18n()

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 侧边栏状态
const isCollapsed = ref(false)

// 未读消息数量
const unreadCount = ref(0)
let unreadTimer: number | undefined

// 菜单数据 - 从user store中获取
const menus = computed(() => userStore.user?.menus || [])

// 面包屑导航
const breadcrumbs = computed(() => {
  const matched = route.matched.filter(item => item.meta?.title && !item.meta?.layout)
  return matched.map(item => ({
    title: item.meta?.title as string,
    path: item.path
  }))
})

const getLayoutPath = (suffix: string) => {
  const basePath = route.matched[0]?.path || '/'
  const normalizedBase = basePath === '/' ? '' : basePath.replace(/\/+$/, '')
  const normalizedSuffix = suffix.replace(/^\/+/, '')
  return `${normalizedBase}/${normalizedSuffix}`.replace(/\/+/g, '/')
}

// 切换侧边栏
const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
}

// 处理用户下拉菜单命令
const handleUserCommand = (command: string) => {
  switch (command) {
    case 'profile':
      router.push(getLayoutPath('profile-center'))
      break
    case 'settings':
      router.push(getLayoutPath('settings'))
      break
    case 'logout':
      handleLogout()
      break

  }
}

// 处理消息下拉菜单命令
const handleMessageCommand = async (command: string) => {
  switch (command) {
    case 'center':
      router.push(getLayoutPath('message-center'))
      break
    case 'markAllRead':
      try {
        await allRead()
        unreadCount.value = 0
        ElMessage.success(t('layout.allMessagesRead'))
      } catch (error) {
        console.error('标记所有消息已读失败:', error)
        ElMessage.error(t('layout.operationFailed'))
      }
      break
  }
}

// 加载未读消息数量
const loadUnreadCount = async () => {
  try {
    const stats = await getMessageStats()
    unreadCount.value = stats.unread
  } catch (error) {
    console.error('获取未读消息数量失败:', error)
  }
}

// 退出登录
const handleLogout = () => {
  ElMessageBox.confirm(t('layout.logoutConfirm'), t('common.tip'), {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    type: 'warning'
  }).then(async () => {
    try {
      // 调用退出登录API（非mock模式）
      if (isMockEnabled()) {
        await logout()
      }

      // 清除本地状态
      userStore.logout()
      router.push('/')
      ElMessage.success(t('layout.logoutSuccess'))
    } catch (error) {
      console.error('退出登录失败:', error)
      // 即使API调用失败，也要清除本地状态
      userStore.logout()
      router.push('/')
      ElMessage.success(t('layout.logoutSuccess'))
    }
  })
}

// 组件挂载时加载数据
onMounted(() => {
  // 菜单数据通过computed从user store获取，无需额外加载
  // 加载未读消息数量
  loadUnreadCount()

  // 定期刷新未读消息数量（每5分钟）
  unreadTimer = window.setInterval(loadUnreadCount, 5 * 60 * 1000)
})

onBeforeUnmount(() => {
  if (unreadTimer !== undefined) {
    window.clearInterval(unreadTimer)
    unreadTimer = undefined
  }
})
</script>

<style scoped lang="scss">
.admin-layout {
  display: flex;
  height: 100vh;
  background: var(--bg-color-page);
  color: var(--text-primary);
}

.sidebar {
  width: var(--sidebar-width);
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-right: 1px solid var(--border-extra-light);
  transition: all var(--transition-duration) cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  z-index: 50;
  display: flex;
  flex-direction: column;

  &.sidebar-collapsed {
    width: var(--sidebar-collapsed-width);
  }
}

.sidebar-header {
  height: var(--header-height);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-bottom: 1px solid var(--border-extra-light);
  background: transparent;

  .logo {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 16px;
    height: 100%;
    width: 100%;
    overflow: hidden;
    transition: all 0.3s;
    
    .logo-img {
      width: 32px;
      height: 32px;
      flex-shrink: 0;
      filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
    }

    .logo-text {
      font-size: 18px;
      font-weight: 700;
      background: linear-gradient(120deg, var(--primary-color), var(--secondary-color));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      white-space: nowrap;
      letter-spacing: -0.5px;
      opacity: 1;
      transition: opacity 0.3s;
    }
  }
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px 0;

  // 隐藏滚动条但保持滚动功能
  scrollbar-width: none; // Firefox
  -ms-overflow-style: none; // IE/Edge

  &::-webkit-scrollbar {
    display: none; // Chrome/Safari/Edge
  }
}

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  background: var(--bg-color-page);
}

.header {
  height: var(--header-height);
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-extra-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  z-index: 40;
  transition: all 0.3s;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 24px;
}

.collapse-btn {
  font-size: 20px;
  color: var(--text-secondary);
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  cursor: pointer;

  &:hover {
    background: var(--bg-color-soft);
    color: var(--primary-color);
  }
}

.breadcrumb {
  :deep(.el-breadcrumb__item) {
    .el-breadcrumb__inner {
      color: var(--text-tertiary);
      font-weight: 400;
      transition: color 0.2s;

      &:hover {
        color: var(--primary-color);
        cursor: pointer;
      }
    }

    &:last-child .el-breadcrumb__inner {
      color: var(--text-primary);
      font-weight: 500;
    }
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.theme-btn, .message-btn {
  font-size: 18px;
  color: var(--text-secondary);
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  
  &:hover {
    background: var(--bg-color-soft);
    color: var(--primary-color);
  }
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 8px 4px 4px;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
  margin-left: 12px;

  &:hover {
    background: var(--bg-color-soft);
    border-color: var(--border-extra-light);
  }
}

.user-avatar {
  border: 2px solid var(--bg-color);
  box-shadow: 0 0 0 1px var(--border-extra-light);
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  max-width: 120px;
}

.arrow-down {
  font-size: 12px;
  color: var(--text-tertiary);
}

.content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  overflow-x: hidden;
  
  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--border-light);
    border-radius: 3px;
  }
  
  // Card effect for router view wrapper if needed, 
  // but better to let pages define their own cards.
  // We just ensure the scroll container is nice.
}

// 响应式设计
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    box-shadow: 20px 0 50px rgba(0,0,0,0.1);
    
    &.sidebar-collapsed {
      transform: translateX(-100%);
      width: var(--sidebar-width); // Keep width when "collapsed" (hidden) on mobile
    }
  }

  .main-container {
    margin-left: 0;
  }

  .header {
    padding: 0 16px;
  }

  .breadcrumb {
    display: none;
  }

  .user-name {
    display: none;
  }
}
</style>
