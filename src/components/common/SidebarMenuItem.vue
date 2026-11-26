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
  <el-menu-item v-else :index="menu.path" @click="handleMenuClick">
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

const props = defineProps<Props>()

// 处理菜单点击事件
const handleMenuClick = () => {
  // 如果是链接类型，直接跳转到外部链接
  if (props.menu.type === 'link' && props.menu.link) {
    window.open(props.menu.link, '_blank')
  }
}
</script>

<style lang="scss">
@use '@/styles/navigation' as nav;

// 折叠状态下的弹出菜单样式
.sidebar-popper {
  &.el-popper {
    border: none !important;
    background: transparent !important;
    box-shadow: none !important;
  }

  .el-menu {
    border: 1px solid var(--border-extra-light);
    border-radius: 12px;
    box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.15);
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    padding: 6px;
    overflow: hidden;

    .dark & {
      background: rgba(30, 30, 30, 0.85);
      border-color: var(--border-light);
    }
    
    .el-menu-item {
      margin: 4px 0;
      border-radius: 8px;
      height: 40px;
      line-height: 40px;
      transition: background-color 160ms ease, color 160ms ease;
      
      &:hover {
        background: var(--bg-color-soft);
        color: var(--text-primary);
      }
      
      &.is-active {
        @include nav.selected-item;
      }
    }
    
    .el-sub-menu {
      .el-sub-menu__title {
        margin: 4px 0;
        border-radius: 8px;
        height: 40px;
        line-height: 40px;
        transition: all 0.2s;
        
        &:hover {
          background: var(--bg-color-soft);
          color: var(--text-primary);
        }
      }
    }
  }
}
</style>