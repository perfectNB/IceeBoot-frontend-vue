<template>
  <div class="error-page">
    <div class="error-glow"></div>
    <div class="error-card">
      <div class="error-visual">
        <div class="orbit">
          <div class="planet"></div>
          <div class="satellite"></div>
        </div>
        <div class="error-code">404</div>
        <div class="error-icon">
          <el-icon><DocumentDelete /></el-icon>
        </div>
      </div>

      <div class="error-content">
        <h1 class="error-title">页面迷路了</h1>
        <p class="error-description">
          你访问的页面可能被移走、改名，或暂时不可用。
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

    <div class="background-decoration">
      <div class="floating-shape shape-1"></div>
      <div class="floating-shape shape-2"></div>
      <div class="floating-shape shape-3"></div>
      <div class="floating-shape shape-4"></div>
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
  background: var(--bg-color-page);
  position: relative;
  overflow: hidden;
  padding: 40px 20px;
  transition: background-color 0.5s;
}

.error-glow {
  position: absolute;
  top: -120px;
  left: 50%;
  width: 540px;
  height: 540px;
  transform: translateX(-50%);
  background: radial-gradient(circle, var(--primary-light), transparent 70%);
  filter: blur(80px);
  opacity: 0.15;
  z-index: 0;
}

.error-card {
  position: relative;
  z-index: 2;
  width: min(960px, 92vw);
  padding: 60px 40px;
  border-radius: 32px;
  background: var(--card-bg);
  border: 1px solid var(--border-light);
  backdrop-filter: blur(20px);
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  gap: 60px;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.05);
  animation: card-rise 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 40px;
    padding: 40px 24px;
    text-align: center;
  }
}

.error-visual {
  position: relative;
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.orbit {
  position: absolute;
  width: 260px;
  height: 260px;
  border-radius: 50%;
  border: 1px dashed var(--border-light);
  animation: spin 20s linear infinite;
}

.planet {
  position: absolute;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  top: -24px;
  left: 50%;
  transform: translateX(-50%);
  box-shadow: 0 0 20px var(--glow-color);
}

.satellite {
  position: absolute;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--text-secondary);
  bottom: 20px;
  right: 20px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.error-code {
  font-size: 140px;
  font-weight: 900;
  color: transparent;
  background: linear-gradient(135deg, var(--primary-light), var(--secondary-color));
  -webkit-background-clip: text;
  background-clip: text;
  line-height: 1;
  margin-bottom: 16px;
  opacity: 0.9;
}

.error-icon {
  margin-top: -20px;
  .el-icon {
    font-size: 64px;
    color: var(--text-tertiary);
    opacity: 0.5;
  }
}

.error-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 24px;
  
  @media (max-width: 768px) {
    align-items: center;
  }
}

.error-title {
  font-size: 36px;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -1px;
}

.error-description {
  font-size: 16px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.6;
  max-width: 400px;
}

.error-actions {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 8px;
  
  .el-button {
    padding: 12px 32px;
    height: auto;
    font-size: 15px;
    border-radius: 12px;
    
    &.el-button--primary {
      background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
      border: none;
      box-shadow: 0 8px 20px rgba(59, 130, 246, 0.25);
      transition: all 0.3s;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 28px rgba(59, 130, 246, 0.35);
      }
    }
    
    &:not(.el-button--primary) {
      background: var(--bg-surface);
      border-color: var(--border-light);
      color: var(--text-secondary);
      
      &:hover {
        background: var(--bg-color-soft);
        color: var(--primary-color);
        border-color: var(--primary-color);
      }
    }
  }
}

.background-decoration {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 1;
}

.floating-shape {
  position: absolute;
  background: var(--primary-light);
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.1;
  animation: float 20s infinite ease-in-out;
  
  &.shape-1 {
    width: 300px;
    height: 300px;
    top: -50px;
    left: -50px;
    animation-delay: 0s;
  }
  
  &.shape-2 {
    width: 400px;
    height: 400px;
    bottom: -100px;
    right: -100px;
    background: var(--secondary-color);
    animation-delay: -5s;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes card-rise {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes float {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(20px, 20px); }
}
</style>