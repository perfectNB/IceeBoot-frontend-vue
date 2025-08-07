<template>
  <div class="sidebar-menu">
    <el-menu
      :default-active="activeMenu"
      :collapse="collapsed"
      :unique-opened="true"
      router
      class="menu"
    >
      <template v-for="menu in menus" :key="menu.id">
        <SidebarMenuItem :menu="menu" :collapsed="collapsed" />
      </template>
    </el-menu>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import SidebarMenuItem from './SidebarMenuItem.vue'
import type { MenuItem } from '@/types'

interface Props {
  menus: MenuItem[]
  collapsed: boolean
}

defineProps<Props>()

const route = useRoute()

// 当前激活的菜单
const activeMenu = computed(() => {
  return route.path
})
</script>

<style scoped lang="scss">
.sidebar-menu {
  height: 100%;
}

.menu {
  border: none;
  background: transparent;
  
  :deep(.el-menu-item) {
    height: 48px;
    line-height: 48px;
    margin: 4px 8px;
    border-radius: 6px;
    color: var(--text-primary);
    transition: all var(--transition-duration) var(--transition-function);
    
    &:hover {
      background: var(--primary-extra-light);
      color: var(--primary-color);
    }
    
    &.is-active {
      background: var(--primary-color);
      color: #ffffff !important;
      
      &::before {
        display: none;
      }
    }
    
    .el-icon {
      margin-right: 8px;
      font-size: 16px;
    }
  }
  
  :deep(.el-sub-menu) {
    .el-sub-menu__title {
      height: 48px;
      line-height: 48px;
      margin: 4px 8px;
      border-radius: 6px;
      color: var(--text-primary);
      transition: all var(--transition-duration) var(--transition-function);
      
      &:hover {
        background: var(--primary-extra-light);
        color: var(--primary-color);
      }
      
      .el-icon {
        margin-right: 8px;
        font-size: 16px;
      }
    }
    
    &.is-active > .el-sub-menu__title {
      color: var(--primary-color);
    }
    
    .el-menu {
      background: transparent;
      
      .el-menu-item {
        margin: 2px 16px;
        padding-left: 40px !important;
        color: var(--text-primary);
        
        &:hover {
          background: var(--primary-extra-light);
          color: var(--primary-color);
        }
        
        &.is-active {
          background: var(--primary-color);
          color: #ffffff !important;
        }
      }
      
      .el-sub-menu {
        .el-sub-menu__title {
          margin: 2px 16px;
          padding-left: 40px !important;
          color: var(--text-primary);
          
          &:hover {
            background: var(--primary-extra-light);
            color: var(--primary-color);
          }
        }
        
        .el-menu-item {
          padding-left: 60px !important;
          color: var(--text-primary);
          
          &:hover {
            background: var(--primary-extra-light);
            color: var(--primary-color);
          }
          
          &.is-active {
            background: var(--primary-color);
            color: #ffffff !important;
          }
        }
      }
    }
  }
  
  // 折叠状态样式
  &.el-menu--collapse {
    :deep(.el-menu-item),
    :deep(.el-sub-menu__title) {
      margin: 4px;
      text-align: center;
      
      .el-icon {
        margin-right: 0;
      }
    }
    
    :deep(.el-sub-menu) {
      .el-menu {
        .el-menu-item {
          padding-left: 20px !important;
        }
      }
    }
  }
}
</style>