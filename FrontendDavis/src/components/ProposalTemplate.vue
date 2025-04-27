<template>
  <div class="quotation-wrapper">
    <!-- Paste your existing HTML template here -->
    <h1>{{ params.title }}</h1>
    <!-- ... other dynamic content ... -->
    <div class="images-section">
      <img v-for="src in images" :key="src" :src="src" alt="Report image" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'
const props = defineProps<{ params: Record<string, any>, images: string[] }>()
</script>
