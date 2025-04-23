<template>
  <div>
    <h2>Upload Report</h2>
    <input type="file" @change="onFileChange" />
  </div>
</template>

<script setup lang="ts">
import { defineEmits } from 'vue'
const emit = defineEmits(['uploaded'])

function onFileChange(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (files && files.length) emit('uploaded', files[0])
}
</script>
