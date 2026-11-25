<template>
  <div class="documentation-page">
    <iframe 
      src="/document/index.html" 
      class="doc-iframe"
      :title="t('home.docs')"
    ></iframe>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// Simple iframe implementation for Docsify documentation
</script>

<style scoped>
.documentation-page {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.doc-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

/* Responsive design */
@media (max-width: 768px) {
  .documentation-page {
    height: calc(100vh - 60px);
  }
}
</style>