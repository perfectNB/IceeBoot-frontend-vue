<template>
  <!-- 有子菜单的情况 -->
  <el-sub-menu 
    v-if="menu.children && menu.children.length > 0" 
    :index="menu.path"
    :popper-class="collapsed ? 'sidebar-popper' : ''"
  >
    <template #title>
      <el-icon v-if="menu.icon">
        <component :is="menu.icon" />
      </el-icon>
      <span v-show="!collapsed">{{ menu.title }}</span>
    </template>
    
    <template v-for="child in menu.children" :key="child.id">
      <SidebarMenuItem :menu="child" :collapsed="false" />
    </template>
  </el-sub-menu>
  
  <!-- 没有子菜单的情况 -->
  <el-menu-item v-else :index="menu.path">
    <el-icon v-if="menu.icon">
      <component :is="menu.icon" />
    </el-icon>
    <template #title>
      <span>{{ menu.title }}</span>
    </template>
  </el-menu-item>
</template>

<script setup lang="ts">
import type { MenuItem } from '@/types'

interface Props {
  menu: MenuItem
  collapsed: boolean
}

defineProps<Props>()
</script>

<style lang="scss">
// 折叠状态下的弹出菜单样式
.sidebar-popper {
  .el-menu {
    border: 1px solid var(--border-lighter);
    border-radius: 6px;
    box-shadow: var(--box-shadow-base);
    
    .el-menu-item {
      margin: 2px 4px;
      border-radius: 4px;
      
      &:hover {
        background: var(--primary-extra-light);
        color: var(--primary-color);
      }
      
      &.is-active {
        background: var(--primary-color);
        color: #ffffff;
      }
    }
    
    .el-sub-menu {
      .el-sub-menu__title {
        margin: 2px 4px;
        border-radius: 4px;
        
        &:hover {
          background: var(--primary-extra-light);
          color: var(--primary-color);
        }
      }
    }
  }
}
</style>