<template>
  <div class="api-documentation">
    <div class="page-header">
      <h2>接口文档</h2>
      <p>系统API接口文档</p>
    </div>

    <div class="redirect-section">
      <el-card class="redirect-card">
        <div class="redirect-content">
          <el-icon class="redirect-icon"><Link /></el-icon>
          <h3>正在跳转到接口文档...</h3>
          <p>如果没有自动跳转，请点击下方按钮手动跳转</p>
          <el-button type="primary" size="large" @click="redirectToDoc">
            <el-icon><TopRight /></el-icon>
            访问接口文档
          </el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { Link, TopRight } from '@element-plus/icons-vue'

// 文档链接
const DOC_URL = 'https://www.baidu.com'

// 跳转到文档
const redirectToDoc = () => {
  window.open(DOC_URL, '_blank')
}

// 组件挂载时自动跳转
onMounted(() => {
  // 延迟2秒后自动跳转，给用户一个提示
  setTimeout(() => {
    redirectToDoc()
  }, 2000)
})
</script>

<style scoped>
.api-documentation {
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
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

.redirect-section {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.redirect-card {
  width: 100%;
  max-width: 500px;
  text-align: center;
}

.redirect-content {
  padding: 40px 20px;
}

.redirect-icon {
  font-size: 64px;
  color: #409eff;
  margin-bottom: 20px;
}

.redirect-content h3 {
  margin: 0 0 16px 0;
  color: var(--text-primary);
  font-size: 20px;
}

.redirect-content p {
  margin: 0 0 30px 0;
  color: var(--text-regular);
  font-size: 14px;
}

:deep(.el-card__body) {
  padding: 0;
}
</style>
