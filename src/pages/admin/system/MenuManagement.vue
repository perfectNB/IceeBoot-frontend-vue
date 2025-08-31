<template>
  <div class="menu-management">
    <div class="page-header">
      <h2>菜单管理</h2>
      <p>管理系统菜单结构和权限配置</p>
    </div>

    <!-- 操作区域 -->
    <div class="action-section">
      <el-button 
        type="primary" 
        :icon="Plus" 
        @click="handleAdd"
        v-if="hasPermission('system:menu:create')"
      >
        新增菜单
      </el-button>
      <el-button
        type="danger"
        @click="handleBatchDelete"
        :disabled="selectedMenus.length === 0"
        v-if="hasPermission('system:menu:delete')"
      >
        <el-icon><Delete /></el-icon>
        批量删除
      </el-button>
      <el-button 
        :icon="Refresh" 
        @click="loadMenus"
      >
        刷新
      </el-button>
      <el-button @click="expandAll">
        <el-icon><Sort /></el-icon>
        展开全部
      </el-button>
      <el-button @click="collapseAll">
        <el-icon><Sort /></el-icon>
        收起全部
      </el-button>
    </div>

    <!-- 搜索区域 -->
    <div class="search-section">
      <el-form :model="searchForm" :inline="true">
        <el-form-item label="菜单名称">
          <el-input
            v-model="searchForm.title"
            placeholder="请输入菜单名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="类型">
          <el-select
            v-model="searchForm.type"
            placeholder="请选择类型"
            clearable
            style="width: 150px"
          >
            <el-option label="菜单" value="menu" />
            <el-option label="按钮" value="button" />
            <el-option label="链接" value="link" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">
            搜索
          </el-button>
          <el-button :icon="Refresh" @click="handleReset">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 表格区域 -->
    <div class="table-section">
      <el-table 
        ref="tableRef"
        :data="filteredMenuList" 
        v-loading="loading"
        row-key="id"
        default-expand-all
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        border
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="title" label="菜单名称" min-width="200">
          <template #default="{ row }">
            <el-icon v-if="row.icon" class="menu-icon">
              <component :is="row.icon" />
            </el-icon>
            {{ row.title }}
          </template>
        </el-table-column>
        <el-table-column prop="path" label="路径" min-width="200" />
        <el-table-column prop="component" label="组件" min-width="150" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)">
              {{ getTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column prop="requiresAuth" label="需要认证" width="100">
          <template #default="{ row }">
            <el-tag :type="row.requiresAuth ? 'success' : 'danger'">
              {{ row.requiresAuth ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button 
              type="success" 
              size="small" 
              :icon="Plus"
              @click="handleAddChild(row)"
              v-if="hasPermission('system:menu:create') && row.type === 'menu'"
            >
              添加子菜单
            </el-button>
            <el-button 
              type="primary" 
              size="small" 
              :icon="Edit"
              @click="handleEdit(row)"
              v-if="hasPermission('system:menu:edit')"
            >
              编辑
            </el-button>
            <el-button 
              type="danger" 
              size="small" 
              :icon="Delete"
              @click="handleDelete(row)"
              v-if="hasPermission('system:menu:delete')"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog 
      :title="dialogTitle" 
      v-model="dialogVisible" 
      width="600px"
      @close="resetForm"
    >
      <el-form 
        ref="formRef" 
        :model="formData" 
        :rules="formRules" 
        label-width="100px"
      >
        <el-form-item label="父级菜单">
          <el-tree-select
            v-model="formData.parentId"
            :data="parentMenuOptions"
            placeholder="请选择父级菜单（不选择则为顶级菜单）"
            clearable
            check-strictly
            :render-after-expand="false"
            style="width: 100%"
            node-key="id"
            :props="{ label: 'title', value: 'id', children: 'children' }"
          />
        </el-form-item>
        <el-form-item label="菜单名称" prop="title">
          <el-input v-model="formData.title" placeholder="请输入菜单名称" />
        </el-form-item>
        <el-form-item label="路由名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入路由名称" />
        </el-form-item>
        <el-form-item label="路径" prop="path">
          <el-input v-model="formData.path" placeholder="请输入路径" />
        </el-form-item>
        <el-form-item label="组件" prop="component" v-if="formData.type !== 'link'">
          <el-input v-model="formData.component" placeholder="请输入组件名称" />
        </el-form-item>
        <el-form-item label="图标" prop="icon">
          <el-input v-model="formData.icon" placeholder="请输入图标名称" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="formData.type" placeholder="请选择类型" @change="handleTypeChange">
            <el-option label="菜单" value="menu" />
            <el-option label="按钮" value="button" />
            <el-option label="链接" value="link" />
          </el-select>
        </el-form-item>
        <el-form-item label="链接地址" prop="link" v-if="formData.type === 'link'">
          <el-input v-model="formData.link" placeholder="请输入链接地址" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="formData.sort" :min="0" />
        </el-form-item>
        <el-form-item label="需要认证">
          <el-switch v-model="formData.requiresAuth" />
        </el-form-item>
        <el-form-item label="权限标识" prop="permissions">
          <el-input 
            v-model="formData.permissions" 
            placeholder="请输入权限标识，如：system:menu:list"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox, type FormRules } from 'element-plus'
import { Plus, Refresh, Edit, Delete, Search, Sort } from '@element-plus/icons-vue'
import type { MenuItem } from '@/types'
import { getAllMenus, createMenu, updateMenu, deleteMenu, deleteMenus } from '@/api/menu'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const menuList = ref<MenuItem[]>([])
const parentMenuOptions = ref<MenuItem[]>([])
const selectedMenus = ref<MenuItem[]>([])
const tableRef = ref()

// 搜索表单
const searchForm = reactive({
  title: '',
  type: ''
})

// 表单相关
const formRef = ref()
const formData = reactive<Partial<Omit<MenuItem, 'permissions'> & { link?: string; permissions?: string }>>({
  title: '',
  name: '',
  path: '',
  component: '',
  icon: '',
  type: 'menu',
  sort: 0,
  requiresAuth: true,
  permissions: '',
  parentId: null,
  link: ''
})

const formRules = computed((): FormRules => {
  const rules: FormRules = {
    title: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
    name: [{ required: true, message: '请输入路由名称', trigger: 'blur' }],
    type: [{ required: true, message: '请选择类型', trigger: 'change' }],
    permissions: [{ required: true, message: '请输入权限标识', trigger: 'blur' }]
  }
  
  // 根据类型动态添加验证规则
  if (formData.type === 'link') {
    rules.link = [{ required: true, message: '请输入链接地址', trigger: 'blur' }]
  } else {
    rules.path = [{ required: true, message: '请输入路径', trigger: 'blur' }]
  }
  
  return rules
})

// 计算属性
const dialogTitle = ref('新增菜单')
const isEdit = ref(false)

// 过滤菜单列表
const filteredMenuList = computed(() => {
  let filtered = menuList.value
  
  if (searchForm.title) {
    filtered = filtered.filter(menu => 
      menu.title.toLowerCase().includes(searchForm.title.toLowerCase())
    )
  }
  
  if (searchForm.type) {
    filtered = filtered.filter(menu => menu.type === searchForm.type)
  }
  
  return filtered
})

// 权限检查
const hasPermission = (permission: string) => {
  return userStore.hasPermission(permission)
}

// 加载菜单列表
const loadMenus = async () => {
  try {
    loading.value = true
    menuList.value = await getAllMenus()
    buildParentMenuOptions()
  } catch {
    ElMessage.error('加载菜单列表失败')
  } finally {
    loading.value = false
  }
}

// 构建父级菜单选项
const buildParentMenuOptions = () => {
  const filterMenusForParent = (menus: MenuItem[]): MenuItem[] => {
    return menus.filter(menu => menu.type === 'menu').map(menu => ({
      ...menu,
      children: menu.children ? filterMenusForParent(menu.children) : undefined
    }))
  }
  parentMenuOptions.value = filterMenusForParent(menuList.value)
}

// 新增菜单
const handleAdd = () => {
  isEdit.value = false
  dialogTitle.value = '新增菜单'
  resetForm()
  dialogVisible.value = true
}

// 编辑菜单
const handleEdit = (row: MenuItem) => {
  isEdit.value = true
  dialogTitle.value = '编辑菜单'
  // 将MenuItem的permissions数组转换为字符串
  const editData = {
    ...row,
    permissions: Array.isArray(row.permissions) ? row.permissions.join(',') : (row.permissions || '')
  }
  Object.assign(formData, editData)
  dialogVisible.value = true
}

// 删除菜单
const handleDelete = async (row: MenuItem) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除菜单 "${row.title}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await deleteMenu(row.id)
    ElMessage.success('删除成功')
    loadMenus()
  } catch (error: unknown) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
    submitting.value = true
    
    // 准备提交数据，将permissions字符串转换为数组
    const submitData = {
      ...formData,
      permissions: formData.permissions ? formData.permissions.split(',').map(p => p.trim()).filter(p => p) : []
    } as MenuItem
    
    if (isEdit.value) {
      await updateMenu(submitData.id!, submitData)
      ElMessage.success('更新成功')
    } else {
      await createMenu(submitData)
      ElMessage.success('创建成功')
    }
    
    dialogVisible.value = false
    loadMenus()
  } catch {
    ElMessage.error(isEdit.value ? '更新失败' : '创建失败')
  } finally {
    submitting.value = false
  }
}

// 处理类型变化
const handleTypeChange = () => {
  // 当类型为链接时，清空组件字段
  if (formData.type === 'link') {
    formData.component = ''
  } else {
    formData.link = ''
  }
}

// 获取类型标签类型
const getTypeTagType = (type: string) => {
  switch (type) {
    case 'menu':
      return 'primary'
    case 'button':
      return 'info'
    case 'link':
      return 'warning'
    default:
      return 'info'
  }
}

// 获取类型文本
const getTypeText = (type: string) => {
  switch (type) {
    case 'menu':
      return '菜单'
    case 'button':
      return '按钮'
    case 'link':
      return '链接'
    default:
      return '未知'
  }
}

// 搜索处理
const handleSearch = () => {
  // 搜索逻辑已在计算属性中处理
}

// 重置搜索
const handleReset = () => {
  searchForm.title = ''
  searchForm.type = ''
}

// 选择变更
const handleSelectionChange = (selection: MenuItem[]) => {
  selectedMenus.value = selection
}

// 批量删除菜单
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedMenus.value.length} 个菜单吗？`,
      '批量删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 批量删除菜单
    const menuIds = selectedMenus.value.map(menu => menu.id)
    await deleteMenus(menuIds)
    
    ElMessage.success(`成功删除 ${selectedMenus.value.length} 个菜单`)
    selectedMenus.value = []
    loadMenus()
  } catch (error: unknown) {
    if (error !== 'cancel') {
      console.error('批量删除菜单失败:', error)
      ElMessage.error('批量删除菜单失败')
    }
  }
}

// 重置表单
const resetForm = () => {
  Object.assign(formData, {
    title: '',
    name: '',
    path: '',
    component: '',
    icon: '',
    type: 'menu',
    sort: 0,
    requiresAuth: true,
    permissions: '',
    parentId: null,
    link: ''
  })
  formRef.value?.clearValidate()
}

// 添加子菜单
const handleAddChild = (parentMenu: MenuItem) => {
  isEdit.value = false
  dialogTitle.value = `为 "${parentMenu.title}" 添加子菜单`
  resetForm()
  formData.parentId = parentMenu.id
  dialogVisible.value = true
}

// 展开全部
const expandAll = () => {
  if (tableRef.value) {
    const expandAllNodes = (data: MenuItem[]) => {
      data.forEach(item => {
        tableRef.value.toggleRowExpansion(item, true)
        if (item.children && item.children.length > 0) {
          expandAllNodes(item.children)
        }
      })
    }
    expandAllNodes(filteredMenuList.value)
  }
}

// 收起全部
const collapseAll = () => {
  if (tableRef.value) {
    const collapseAllNodes = (data: MenuItem[]) => {
      data.forEach(item => {
        tableRef.value.toggleRowExpansion(item, false)
        if (item.children && item.children.length > 0) {
          collapseAllNodes(item.children)
        }
      })
    }
    collapseAllNodes(filteredMenuList.value)
  }
}

// 初始化
onMounted(() => {
  loadMenus()
})
</script>

<style scoped>
.menu-management {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  color: #303133;
}

.page-header p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.action-section {
  margin-bottom: 20px;
}

.search-section {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.table-section {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.menu-icon {
  margin-right: 8px;
  color: #409eff;
}

:deep(.el-table .el-table__cell) {
  padding: 12px 0;
}

:deep(.el-button + .el-button) {
  margin-left: 8px;
}
</style>