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
  padding: 0 8px;
  
  :deep(.el-menu-item) {
    height: 44px;
    line-height: 44px;
    margin: 4px 0;
    border-radius: 8px;
    color: var(--text-secondary);
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    
    &:hover {
      background: var(--bg-color-soft);
      color: var(--text-primary);
      transform: translateX(4px);
    }
    
    &.is-active {
      background: linear-gradient(90deg, var(--primary-color), var(--primary-light));
      color: #ffffff !important;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
      transform: translateX(4px);
      
      &::before {
        display: none;
      }
    }
    
    .el-icon {
      margin-right: 12px;
      font-size: 18px;
      vertical-align: middle;
      transition: all 0.3s;
    }
  }
  
  :deep(.el-sub-menu) {
    .el-sub-menu__title {
      height: 44px;
      line-height: 44px;
      margin: 4px 0;
      border-radius: 8px;
      color: var(--text-secondary);
      transition: all 0.2s;
      
      &:hover {
        background: var(--bg-color-soft);
        color: var(--text-primary);
        transform: translateX(4px);
      }
      
      .el-icon {
        margin-right: 12px;
        font-size: 18px;
        vertical-align: middle;
      }
    }
    
    &.is-active > .el-sub-menu__title {
      color: var(--primary-color);
      font-weight: 500;
    }
    
    .el-menu {
      background: transparent;
      padding: 4px 0;
      
      .el-menu-item {
        margin: 2px 0 2px 0;
        height: 40px;
        line-height: 40px;
        color: var(--text-secondary);
        
        // Indentation logic handled by Element Plus padding-left usually,
        // but we can enforce some if needed.
        // Element Plus adds padding inline style.
        
        &:hover {
          background: var(--bg-color-soft);
          color: var(--text-primary);
          transform: translateX(4px);
        }
        
        &.is-active {
          background: rgba(59, 130, 246, 0.1); // softer active for subitems
          color: var(--primary-color) !important;
          box-shadow: none;
          font-weight: 600;
          
          &::before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 3px;
            height: 16px;
            background: var(--primary-color);
            border-radius: 0 4px 4px 0;
          }
        }
      }
    }
  }
  
  // 折叠状态样式
  &.el-menu--collapse {
    padding: 0 4px;

    :deep(.el-menu-item),
    :deep(.el-sub-menu__title) {
      margin: 4px 0;
      text-align: center;
      padding: 0 !important;
      display: flex;
      justify-content: center;
      align-items: center;
      
      .el-icon {
        margin-right: 0;
        font-size: 20px;
      }
      
      &:hover {
        transform: none;
        background: var(--bg-color-soft);
      }

      &.is-active {
        transform: none;
      }
    }
    
    :deep(.el-sub-menu) {
      &.is-active > .el-sub-menu__title {
        background: var(--bg-color-soft);
        color: var(--primary-color);
      }
    }
  }
}
</style>