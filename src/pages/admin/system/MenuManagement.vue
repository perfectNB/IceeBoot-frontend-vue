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
          <div class="icon-input-wrapper">
            <el-input
              v-model="formData.icon"
              placeholder="请输入图标名称或点击选择"
              class="icon-input"
            >
              <template #prepend>
                <el-icon v-if="formData.icon" class="selected-icon">
                  <component :is="formData.icon" />
                </el-icon>
                <el-icon v-else class="placeholder-icon">
                  <Picture />
                </el-icon>
              </template>
              <template #append>
                <el-button @click="showIconSelector = true" :icon="Search">
                  选择
                </el-button>
              </template>
            </el-input>
          </div>
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

      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 图标选择器对话框 -->
    <el-dialog
      title="选择图标"
      v-model="showIconSelector"
      width="800px"
      @close="iconSearchKeyword = ''"
    >
      <div class="icon-selector">
        <div class="icon-search">
          <el-input
            v-model="iconSearchKeyword"
            placeholder="搜索图标..."
            :prefix-icon="Search"
            clearable
          />
        </div>
        <div class="icon-grid">
          <div
            v-for="iconName in filteredIconList"
            :key="iconName"
            class="icon-item"
            @click="selectIcon(iconName)"
          >
            <el-icon class="icon">
              <component :is="iconName" />
            </el-icon>
            <span class="icon-name">{{ iconName }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showIconSelector = false">取消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox, type FormRules } from 'element-plus'
import { Plus, Refresh, Edit, Delete, Search, Sort, Picture } from '@element-plus/icons-vue'
import type { MenuItem } from '@/types'
import { getAllMenus, createMenu, updateMenu, deleteMenu, deleteMenus } from '@/api/menu'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const showIconSelector = ref(false)
const menuList = ref<MenuItem[]>([])
const parentMenuOptions = ref<MenuItem[]>([])
const selectedMenus = ref<MenuItem[]>([])
const tableRef = ref()
const iconSearchKeyword = ref('')

// 图标列表数据
const iconList = [
  // 基础图标
  'HomeFilled', 'User', 'Setting', 'Document', 'Folder', 'Star', 'Bell', 'Message', 'Calendar', 'TrendCharts',
  'Lock', 'Key', 'Tools', 'Camera', 'VideoCamera', 'Headset', 'Trophy', 'Flag', 'PriceTag', 'Link',
  'Share', 'Download', 'Upload', 'Printer', 'Files', 'CopyDocument', 'FolderAdd', 'FolderDelete', 'FolderOpened',
  'Collection', 'DataBoard', 'PieChart', 'Histogram', 'DataLine', 'DataAnalysis', 'Guide', 'Compass',
  'Place', 'MapLocation', 'OfficeBuilding', 'School', 'Shop', 'HotWater', 'ColdDrink', 'IceCream',
  'Coffee', 'Orange', 'Apple', 'Watermelon', 'Burger', 'Chicken', 'Bowl', 'FirstAidKit',
  'Smoking', 'NoSmoking', 'Male', 'Female', 'Suitcase', 'Briefcase', 'Handbag', 'WalletFilled',
  'CreditCard', 'Money', 'GoldMedal', 'Present', 'Box', 'Goods', 'ShoppingBag', 'ShoppingCart',
  'Sell', 'Promotion', 'Stamp', 'MessageBox', 'Notification', 'Mute', 'Service', 'Avatar',
  'UserFilled', 'SwitchButton', 'Switch', 'Operation', 'Management', 'Coordinate', 'Expand', 'Fold',
  'Aim', 'ScaleToOriginal', 'View', 'Hide', 'Loading', 'More', 'MoreFilled', 'Grid', 'Menu', 'List',

  // 箭头和方向图标
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'ArrowLeftBold', 'ArrowRightBold', 'ArrowUpBold', 'ArrowDownBold',
  'CaretLeft', 'CaretRight', 'CaretTop', 'CaretBottom', 'DArrowLeft', 'DArrowRight', 'DCaret', 'Back',
  'Right', 'Bottom', 'Top', 'Sort', 'SortUp', 'SortDown', 'Rank', 'Position',

  // 状态和操作图标
  'Check', 'Close', 'CircleCheck', 'CircleClose', 'CirclePlus', 'CircleCheckFilled', 'CircleCloseFilled', 'CirclePlusFilled',
  'SuccessFilled', 'InfoFilled', 'WarningFilled', 'QuestionFilled', 'Minus', 'Plus', 'Remove', 'Delete',
  'DeleteFilled', 'Edit', 'EditPen', 'Refresh', 'RefreshLeft', 'RefreshRight', 'Search', 'ZoomIn',
  'ZoomOut', 'FullScreen', 'ScaleToOriginal', 'Crop', 'Picture', 'PictureFilled', 'PictureRounded', 'AlarmClock',

  // 媒体和娱乐图标
  'VideoPlay', 'VideoPause', 'Microphone', 'MicrophoneFilled', 'Headset', 'Monitor', 'Mouse', 'Keyboard',
  'Cpu', 'HardDrive', 'MemoryCard', 'Wifi', 'WifiOff', 'Signal', 'Cellphone', 'Iphone',
  'TabletButton', 'Laptop', 'Watch', 'Camera', 'VideoCamera', 'Film', 'Headphones', 'MagicStick',

  // 天气和自然图标
  'Sunny', 'Cloudy', 'PartlyCloudy', 'Overcast', 'Drizzling', 'Raining', 'Lightning', 'LightningFilled',
  'Snowing', 'WindPower', 'Tornado', 'Typhoon', 'Sunrise', 'Sunset', 'MoonNight', 'Moon',
  'Thermometer', 'Umbrella', 'UmbrellaFilled', 'Rainbow', 'Snowflake', 'IceCreamRound', 'IceCreamSquare', 'Cherry',

  // 交通和地点图标
  'Van', 'Truck', 'CarFilled', 'BicycleFilled', 'MotorcycleFilled', 'Ship', 'AirplaneFilled', 'Train',
  'Bus', 'Subway', 'Walking', 'MapLocation', 'LocationFilled', 'LocationInformation', 'Navigation', 'Guide',
  'Compass', 'Position', 'AddLocation', 'RemoveLocation', 'OfficeBuilding', 'School', 'Hospital', 'Bank',

  // 食物和饮品图标
  'Apple', 'Orange', 'Pear', 'Cherry', 'Watermelon', 'Grape', 'Strawberry', 'Lollipop',
  'Sugar', 'Dessert', 'IceCream', 'IceCreamRound', 'IceCreamSquare', 'IceTea', 'Coffee', 'CoffeeCup',
  'Milk', 'WineGlass', 'Goblet', 'GobletFull', 'GobletSquare', 'GobletSquareFull', 'Dish', 'DishDot',
  'Bowl', 'KnifeFork', 'Fork', 'Spoon', 'ChopSticks', 'FoodAndDrinks', 'Burger', 'Pizza',

  // 购物和商业图标
  'ShoppingBag', 'ShoppingCart', 'ShoppingCartFull', 'ShoppingTrolley', 'Goods', 'Box', 'Package',
  'Present', 'GiftFilled', 'Sell', 'Sold', 'Promotion', 'DiscountFilled', 'PriceTag', 'Ticket',
  'TicketFilled', 'Stamp', 'Postcard', 'CreditCard', 'BankCard', 'Money', 'Coin', 'Wallet',
  'WalletFilled', 'PaymentFilled', 'GoldMedal', 'SilverMedal', 'BronzeMedal', 'Medal', 'Trophy', 'TrophyBase',

  // 办公和文档图标
  'Document', 'DocumentAdd', 'DocumentDelete', 'DocumentRemove', 'DocumentChecked', 'DocumentCopy', 'CopyDocument', 'Notebook',
  'Reading', 'ReadingLamp', 'Paperclip', 'TakeawayBox', 'Briefcase', 'Suitcase', 'SuitcaseLine', 'Handbag',
  'Files', 'Folder', 'FolderAdd', 'FolderDelete', 'FolderOpened', 'FolderRemove', 'FolderChecked', 'Collection',
  'Tickets', 'DataBoard', 'DataLine', 'DataAnalysis', 'PieChart', 'Histogram', 'TrendCharts', 'Platform',

  // 用户和社交图标
  'User', 'UserFilled', 'Avatar', 'Male', 'Female', 'Postman', 'ChatDotRound',
  'ChatLineRound', 'ChatRound', 'ChatSquare', 'Connection', 'Phone', 'PhoneFilled', 'Message', 'MessageBox',
  'Bell', 'BellFilled', 'Notification', 'Mute', 'MuteNotification', 'Service', 'CustomerService', 'Headset'
]

// 过滤后的图标列表
const filteredIconList = computed(() => {
  if (!iconSearchKeyword.value) {
    return iconList
  }
  return iconList.filter(icon =>
    icon.toLowerCase().includes(iconSearchKeyword.value.toLowerCase())
  )
})

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

// 选择图标
const selectIcon = (iconName: string) => {
  formData.icon = iconName
  showIconSelector.value = false
  iconSearchKeyword.value = ''
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
  color: var(--text-primary);
}

.page-header p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.action-section {
  margin-bottom: 20px;
}

.search-section {
  background: var(--bg-color);
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.table-section {
  background: var(--bg-color);
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

/* 图标选择器样式 */
.icon-input-wrapper {
  width: 100%;
}

.icon-input {
  width: 100%;
}

.selected-icon,
.placeholder-icon {
  font-size: 16px;
}

.selected-icon {
  color: #409eff;
}

.placeholder-icon {
  color: var(--text-placeholder);
}

.icon-selector {
  max-height: 500px;
}

.icon-search {
  margin-bottom: 20px;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
  padding: 10px;
  border: 1px solid var(--border-light);
  border-radius: 8px;
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  border: 1px solid var(--border-light);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--bg-color);
}

.icon-item:hover {
  border-color: #409eff;
  background: rgba(64, 158, 255, 0.12);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
}

.icon-item .icon {
  font-size: 24px;
  color: var(--text-regular);
  margin-bottom: 8px;
  transition: color 0.3s ease;
}

.icon-item:hover .icon {
  color: #409eff;
}

.icon-item .icon-name {
  font-size: 12px;
  color: var(--text-secondary);
  text-align: center;
  word-break: break-all;
  line-height: 1.2;
}

.icon-item:hover .icon-name {
  color: #409eff;
}
</style>
