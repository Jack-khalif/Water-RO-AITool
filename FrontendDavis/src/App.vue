<template>
  <GlobalHeader v-if="route.path === '/'" />
  <router-view />
</template>

<script setup lang="ts">
import GlobalHeader from './components/GlobalHeader.vue'
import { useRoute } from 'vue-router'
const route = useRoute()
</script>