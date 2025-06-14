<script setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <RouterView />
</template>

<style>
html,
body {
  overflow-x: hidden;
  
  margin: 0;
  padding: 0;
}

#app {
  height: 100vh;
  width: 100vw;
  padding: 0 0;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}
</style>

