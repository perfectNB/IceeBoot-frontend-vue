<template>
  <div class="menu-management">
    <div class="page-header">
      <h2>菜单管理</h2>
      <p>管理系统菜单结构和权限配置</p>
    </div>

    <div class="content-card">
      <div class="toolbar">
        <el-button 
          type="primary" 
          :icon="Plus" 
          @click="handleAdd"
          v-if="hasPermission('system:menu:create')"
        >
          新增菜单
        </el-button>
        <el-button 
          :icon="Refresh" 
          @click="loadMenus"
        >
          刷新
        </el-button>
      </div>

      <el-table 
        :data="menuList" 
        v-loading="loading"
        row-key="id"
        default-expand-all
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        border
        stripe
      >
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
            <el-tag :type="row.type === 'menu' ? 'primary' : 'info'">
              {{ row.type === 'menu' ? '菜单' : '按钮' }}
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
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
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
        <el-form-item label="菜单名称" prop="title">
          <el-input v-model="formData.title" placeholder="请输入菜单名称" />
        </el-form-item>
        <el-form-item label="路由名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入路由名称" />
        </el-form-item>
        <el-form-item label="路径" prop="path">
          <el-input v-model="formData.path" placeholder="请输入路径" />
        </el-form-item>
        <el-form-item label="组件" prop="component">
          <el-input v-model="formData.component" placeholder="请输入组件名称" />
        </el-form-item>
        <el-form-item label="图标" prop="icon">
          <el-input v-model="formData.icon" placeholder="请输入图标名称" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="formData.type" placeholder="请选择类型">
            <el-option label="菜单" value="menu" />
            <el-option label="按钮" value="button" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="formData.sort" :min="0" />
        </el-form-item>
        <el-form-item label="需要认证">
          <el-switch v-model="formData.requiresAuth" />
        </el-form-item>
        <el-form-item label="权限标识" prop="permissions">
          <el-select 
            v-model="formData.permissions" 
            multiple 
            placeholder="请选择权限"
            style="width: 100%"
          >
            <el-option 
              v-for="permission in permissionOptions" 
              :key="permission.code" 
              :label="permission.name" 
              :value="permission.code" 
            />
          </el-select>
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Edit, Delete } from '@element-plus/icons-vue'
import type { MenuItem, Permission } from '@/types'
import { getAllMenus, createMenu, updateMenu, deleteMenu } from '@/api/menu'
import { getAllPermissions } from '@/api/permission'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const menuList = ref<MenuItem[]>([])
const permissionOptions = ref<Permission[]>([])

// 表单相关
const formRef = ref()
const formData = reactive<Partial<MenuItem>>({
  title: '',
  name: '',
  path: '',
  component: '',
  icon: '',
  type: 'menu',
  sort: 0,
  requiresAuth: true,
  permissions: []
})

const formRules = {
  title: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
  name: [{ required: true, message: '请输入路由名称', trigger: 'blur' }],
  path: [{ required: true, message: '请输入路径', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }]
}

// 计算属性
const dialogTitle = ref('新增菜单')
const isEdit = ref(false)

// 权限检查
const hasPermission = (permission: string) => {
  return userStore.hasPermission(permission)
}

// 加载菜单列表
const loadMenus = async () => {
  try {
    loading.value = true
    menuList.value = await getAllMenus()
  } catch {
    ElMessage.error('加载菜单列表失败')
  } finally {
    loading.value = false
  }
}

// 加载权限选项
const loadPermissions = async () => {
  try {
    permissionOptions.value = await getAllPermissions()
  } catch {
    ElMessage.error('加载权限列表失败')
  }
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
  Object.assign(formData, row)
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
    
    if (isEdit.value) {
      await updateMenu(formData.id!, formData)
      ElMessage.success('更新成功')
    } else {
      await createMenu(formData)
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
    permissions: []
  })
  formRef.value?.clearValidate()
}

// 初始化
onMounted(() => {
  loadMenus()
  loadPermissions()
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

.content-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.toolbar {
  margin-bottom: 20px;
  display: flex;
  gap: 12px;
}

.menu-icon {
  margin-right: 8px;
  color: #409eff;
}
</style>