<template>
  <div>
    <h2>Report Analysis</h2>
    <pre>{{ data }}</pre>
    <button @click="$emit('next')">Proceed</button>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'
const props = defineProps<{ data: any }>()
const emit = defineEmits(['next'])
</script>
