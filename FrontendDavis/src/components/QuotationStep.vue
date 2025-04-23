<template>
  <div>
    <h2>Quotation</h2>
    <pre>{{ quote }}</pre>
    <button @click="generate">Generate Proposal</button>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'
const props = defineProps<{ quote: any }>()
const emit = defineEmits(['generate'])
function generate() {
  emit('generate', { /* template params */ })
}
</script>
