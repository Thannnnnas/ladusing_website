<script setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <RouterView />
</template>

<style>
/* Reset default margin dan padding browser */
html, body {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* Pastikan #app (root div Vue) memenuhi seluruh layar */
#app {
  width: 100%;
  height: 100%;
  overflow-x: hidden; /* Hindari scroll horizontal */
}
</style>
