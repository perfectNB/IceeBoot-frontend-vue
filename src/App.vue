<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div id="app">
    <RouterView />
  </div>
</template>

<style>
#app {
  min-height: 100vh;
  font-family: var(--font-family);
  color: var(--text-primary);
  background-color: var(--bg-color-page);
}
</style>
