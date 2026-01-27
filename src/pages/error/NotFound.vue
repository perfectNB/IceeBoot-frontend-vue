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
  background: radial-gradient(circle at top, #1e293b 0%, #0f172a 45%, #0b1120 100%);
  position: relative;
  overflow: hidden;
  padding: 40px 20px;
}

.error-glow {
  position: absolute;
  top: -120px;
  left: 50%;
  width: 540px;
  height: 540px;
  transform: translateX(-50%);
  background: radial-gradient(circle, rgba(56, 189, 248, 0.25), transparent 70%);
  filter: blur(10px);
  opacity: 0.8;
  z-index: 0;
}

.error-card {
  position: relative;
  z-index: 2;
  width: min(960px, 92vw);
  padding: 40px;
  border-radius: 28px;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(148, 163, 184, 0.2);
  backdrop-filter: blur(18px);
  display: grid;
  grid-template-columns: minmax(260px, 1fr) minmax(260px, 1fr);
  gap: 32px;
  box-shadow: 0 30px 60px rgba(15, 23, 42, 0.45);
  animation: card-rise 0.6s ease;
}

.error-visual {
  position: relative;
  min-height: 260px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.orbit {
  position: absolute;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  border: 1px dashed rgba(148, 163, 184, 0.35);
  animation: spin 12s linear infinite;
}

.planet {
  position: absolute;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #38bdf8, #6366f1);
  top: -18px;
  left: 50%;
  transform: translateX(-50%);
  box-shadow: 0 0 16px rgba(56, 189, 248, 0.6);
}

.satellite {
  position: absolute;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #f8fafc;
  bottom: 10px;
  right: 10px;
  box-shadow: 0 0 10px rgba(248, 250, 252, 0.6);
}

.error-code {
  font-size: 120px;
  font-weight: 900;
  color: transparent;
  background: linear-gradient(135deg, #60a5fa, #a78bfa, #f472b6);
  -webkit-background-clip: text;
  background-clip: text;
  text-shadow: 0 10px 30px rgba(56, 189, 248, 0.25);
  line-height: 1;
  margin-bottom: 8px;
}

.error-icon {
  margin-top: 6px;
  .el-icon {
    font-size: 56px;
    color: rgba(248, 250, 252, 0.9);
  }
}

.error-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 16px;
}

.error-title {
  font-size: 30px;
  font-weight: 700;
  color: #f8fafc;
  margin: 0;
}

.error-description {
  font-size: 15px;
  color: rgba(226, 232, 240, 0.85);
  margin: 0 0 8px 0;
  line-height: 1.7;
}

.error-actions {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  
  .el-button {
    padding: 12px 28px;
    font-size: 14px;
    border-radius: 999px;
    
    &.el-button--primary {
      background: linear-gradient(135deg, #38bdf8, #6366f1);
      border: none;
      color: #f8fafc;
      box-shadow: 0 10px 24px rgba(56, 189, 248, 0.35);
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 14px 30px rgba(99, 102, 241, 0.4);
      }
    }
    
    &:not(.el-button--primary) {
      background: rgba(148, 163, 184, 0.1);
      border: 1px solid rgba(148, 163, 184, 0.3);
      color: rgba(248, 250, 252, 0.9);
      
      &:hover {
        background: rgba(148, 163, 184, 0.2);
        transform: translateY(-2px);
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
  background: rgba(56, 189, 248, 0.12);
  border-radius: 50%;
  animation: float 6s ease-in-out infinite;
  
  &.shape-1 {
    width: 120px;
    height: 120px;
    top: 15%;
    left: 8%;
    animation-delay: 0s;
  }
  
  &.shape-2 {
    width: 180px;
    height: 180px;
    top: 70%;
    right: 10%;
    animation-delay: 2s;
  }
  
  &.shape-3 {
    width: 90px;
    height: 90px;
    bottom: 16%;
    left: 22%;
    animation-delay: 4s;
  }

  &.shape-4 {
    width: 140px;
    height: 140px;
    top: 30%;
    right: 25%;
    animation-delay: 1s;
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

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes card-rise {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.98);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .error-card {
    grid-template-columns: 1fr;
    padding: 28px;
  }

  .error-code {
    font-size: 86px;
  }

  .error-actions {
    flex-direction: column;
    align-items: flex-start;

    .el-button {
      width: 200px;
    }
  }
}
</style>
