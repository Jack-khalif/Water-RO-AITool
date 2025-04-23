<template>
  <div>
    <h2>Pre-treatment Suggestions</h2>
    <ul>
      <li v-for="s in suggestions" :key="s">{{ s }}</li>
    </ul>
    <button @click="$emit('next')">Next</button>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'
const props = defineProps<{ suggestions: string[] }>()
const emit = defineEmits(['next'])
</script>
