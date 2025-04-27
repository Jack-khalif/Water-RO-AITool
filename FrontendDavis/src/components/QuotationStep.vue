<template>
  <div>
    <h2>Quotation Cart</h2>
    <pre>{{ quote }}</pre>
    <button @click="generate">Generate Quotation Cart</button>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'
const props = defineProps<{ quote: any }>()
const emit = defineEmits(['generateQuotationCart'])
const emit = defineEmits(['generate'])
function generate() {
  emit('generate', { /* template params */ })
}
</script>
