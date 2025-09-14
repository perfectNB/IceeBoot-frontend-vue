<template>
  <div class="admin-layout">
    <!-- 侧边栏 -->
    <aside
      class="sidebar"
      :class="{ 'sidebar-collapsed': isCollapsed }"
    >
      <div class="sidebar-header">
        <div class="logo">
          <img src="@/assets/logo.svg" alt="ZBoot" class="logo-img" />
          <span v-show="!isCollapsed" class="logo-text">ZBoot</span>
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
                  消息中心
                  <el-tag v-if="unreadCount > 0" type="danger" size="small" class="unread-tag">
                    {{ unreadCount }}
                  </el-tag>
                </el-dropdown-item>
                <el-dropdown-item command="markAllRead" :disabled="unreadCount === 0">
                  <el-icon><Check /></el-icon>
                  全部已读
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
                  个人中心
                </el-dropdown-item>
                <el-dropdown-item command="settings">
                  <el-icon><Setting /></el-icon>
                  系统设置
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
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
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Fold,
  Expand,
  Moon,
  Sunny,
  User,
  Setting,
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

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 侧边栏状态
const isCollapsed = ref(false)

// 未读消息数量
const unreadCount = ref(0)

// 菜单数据 - 从user store中获取
const menus = computed(() => userStore.user?.menus || [])

// 面包屑导航
const breadcrumbs = computed(() => {
  const matched = route.matched.filter(item => item.meta?.title)
  return matched.map(item => ({
    title: item.meta?.title as string,
    path: item.path
  }))
})

// 切换侧边栏
const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
}

// 处理用户下拉菜单命令
const handleUserCommand = (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/admin/profile-center')
      break
    case 'settings':
      router.push('/admin/settings')
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
      router.push('/admin/message-center')
      break
    case 'markAllRead':
      try {
        await allRead()
        unreadCount.value = 0
        ElMessage.success('所有消息已标记为已读')
      } catch (error) {
        console.error('标记所有消息已读失败:', error)
        ElMessage.error('操作失败，请重试')
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
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      // 调用退出登录API（非mock模式）
      if (!isMockEnabled()) {
        await logout()
      }

      // 清除本地状态
      userStore.logout()
      router.push('/')
      ElMessage.success('退出登录成功')
    } catch (error) {
      console.error('退出登录失败:', error)
      // 即使API调用失败，也要清除本地状态
      userStore.logout()
      router.push('/')
      ElMessage.success('退出登录成功')
    }
  })
}

// 组件挂载时加载数据
onMounted(() => {
  // 菜单数据通过computed从user store获取，无需额外加载
  // 加载未读消息数量
  loadUnreadCount()
  
  // 定期刷新未读消息数量（每5分钟）
  setInterval(loadUnreadCount, 5 * 60 * 1000)
})
</script>

<style scoped lang="scss">
.admin-layout {
  display: flex;
  height: 100vh;
  background: var(--bg-color-page);
}

.sidebar {
  width: var(--sidebar-width);
  background: var(--bg-color);
  border-right: 1px solid var(--border-lighter);
  transition: width var(--transition-duration) var(--transition-function);
  overflow: hidden;

  &.sidebar-collapsed {
    width: var(--sidebar-collapsed-width);
  }
}

.sidebar-header {
  height: var(--header-height);
  display: flex;
  align-items: center;
  padding: 0 20px;
  border-bottom: 1px solid var(--border-lighter);
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;

  .logo-img {
    width: 32px;
    height: 32px;
    flex-shrink: 0;
  }

  .logo-text {
    font-size: 20px;
    font-weight: 600;
    color: var(--primary-color);
    transition: opacity var(--transition-duration);
  }
}

.sidebar-content {
  height: calc(100% - var(--header-height));
  overflow-y: auto;
}

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  height: var(--header-height);
  background: var(--bg-color);
  border-bottom: 1px solid var(--border-lighter);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: var(--box-shadow-light);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.collapse-btn {
  font-size: 18px;

  &:hover {
    background: var(--primary-extra-light);
  }
}

.breadcrumb {
  :deep(.el-breadcrumb__item) {
    .el-breadcrumb__inner {
      color: var(--text-regular);

      &:hover {
        color: var(--primary-color);
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
  gap: 16px;
}

.theme-btn {
  font-size: 18px;

  &:hover {
    background: var(--primary-extra-light);
  }
}

.message-dropdown {
  .message-info {
    display: flex;
    align-items: center;
    cursor: pointer;
  }

  .message-btn {
    font-size: 18px;

    &:hover {
      background: var(--primary-extra-light);
    }
  }

  :deep(.el-dropdown-menu__item) {
    display: flex;
    align-items: center;
    gap: 8px;

    .unread-tag {
      margin-left: auto;
    }
  }
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background var(--transition-duration);

  &:hover {
    background: var(--bg-color-page);
  }
}

.user-avatar {
  flex-shrink: 0;
}

.user-name {
  font-size: 14px;
  color: var(--text-primary);
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.arrow-down {
  font-size: 12px;
  color: var(--text-secondary);
  transition: transform var(--transition-duration);
}

.content {
  flex: 1;
  padding: var(--content-padding);
  overflow-y: auto;
  background: var(--bg-color-page);
}

// 响应式设计
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1000;
    height: 100vh;

    &.sidebar-collapsed {
      transform: translateX(-100%);
    }
  }

  .main-container {
    margin-left: 0;
  }

  .header-left {
    gap: 10px;
  }

  .breadcrumb {
    display: none;
  }

  .user-name {
    display: none;
  }
}
</style>
