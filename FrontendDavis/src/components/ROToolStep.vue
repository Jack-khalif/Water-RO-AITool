<template>
  <div>
    <h2>Trigger RO Tool</h2>
    <button @click="execute">Run RO Tool</button>
  </div>
</template>

<script setup lang="ts">
import { defineEmits } from 'vue'
const emit = defineEmits(['done'])
function execute() {
  // TODO: integrate ERP call
  emit('done', {})
}
</script>
