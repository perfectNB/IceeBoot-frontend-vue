<template>
  <div class="error-page">
    <div class="error-container">
      <div class="error-illustration">
        <div class="error-code">404</div>
        <div class="error-icon">
          <el-icon><DocumentDelete /></el-icon>
        </div>
      </div>
      
      <div class="error-content">
        <h1 class="error-title">页面不存在</h1>
        <p class="error-description">
          抱歉，您访问的页面不存在或已被删除。
        </p>
        
        <div class="error-actions">
          <el-button type="primary" @click="goHome">
            <el-icon><HomeFilled /></el-icon>
            返回首页
          </el-button>
          <el-button @click="goBack">
            <el-icon><Back /></el-icon>
            返回上页
          </el-button>
        </div>
      </div>
    </div>
    
    <!-- 背景装饰 -->
    <div class="background-decoration">
      <div class="floating-shape shape-1"></div>
      <div class="floating-shape shape-2"></div>
      <div class="floating-shape shape-3"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { DocumentDelete, HomeFilled, Back } from '@element-plus/icons-vue'

const router = useRouter()

// 返回首页
const goHome = () => {
  router.push('/')
}

// 返回上一页
const goBack = () => {
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    router.push('/')
  }
}
</script>

<style scoped lang="scss">
.error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
}

.error-container {
  text-align: center;
  z-index: 2;
  position: relative;
}

.error-illustration {
  margin-bottom: 40px;
  position: relative;
}

.error-code {
  font-size: 120px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  margin-bottom: 20px;
  line-height: 1;
  
  @media (max-width: 768px) {
    font-size: 80px;
  }
}

.error-icon {
  .el-icon {
    font-size: 80px;
    color: rgba(255, 255, 255, 0.8);
    
    @media (max-width: 768px) {
      font-size: 60px;
    }
  }
}

.error-content {
  max-width: 500px;
  margin: 0 auto;
  padding: 0 20px;
}

.error-title {
  font-size: 32px;
  font-weight: 600;
  color: white;
  margin: 0 0 16px 0;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  
  @media (max-width: 768px) {
    font-size: 24px;
  }
}

.error-description {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 32px 0;
  line-height: 1.6;
  
  @media (max-width: 768px) {
    font-size: 14px;
  }
}

.error-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
  
  .el-button {
    padding: 12px 24px;
    font-size: 14px;
    border-radius: 8px;
    
    &.el-button--primary {
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: white;
      backdrop-filter: blur(10px);
      
      &:hover {
        background: rgba(255, 255, 255, 0.3);
        border-color: rgba(255, 255, 255, 0.4);
      }
    }
    
    &:not(.el-button--primary) {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: white;
      
      &:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.4);
      }
    }
  }
}

.background-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.floating-shape {
  position: absolute;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  animation: float 6s ease-in-out infinite;
  
  &.shape-1 {
    width: 100px;
    height: 100px;
    top: 20%;
    left: 10%;
    animation-delay: 0s;
  }
  
  &.shape-2 {
    width: 150px;
    height: 150px;
    top: 60%;
    right: 15%;
    animation-delay: 2s;
  }
  
  &.shape-3 {
    width: 80px;
    height: 80px;
    bottom: 20%;
    left: 20%;
    animation-delay: 4s;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
    opacity: 0.7;
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
    opacity: 1;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .error-actions {
    flex-direction: column;
    align-items: center;
    
    .el-button {
      width: 200px;
    }
  }
  
  .floating-shape {
    &.shape-1 {
      width: 60px;
      height: 60px;
    }
    
    &.shape-2 {
      width: 80px;
      height: 80px;
    }
    
    &.shape-3 {
      width: 50px;
      height: 50px;
    }
  }
}
</style>