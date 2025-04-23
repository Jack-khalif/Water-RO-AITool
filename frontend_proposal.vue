<template>
  <form @submit.prevent="handleSubmit">
    <input type="file" accept=".pdf,.docx" @change="onFileChange" />
    <input v-model="query" placeholder="Enter your query Engineer" />
    <button type="submit">Generate Proposal</button>
  </form>
  <iframe v-if="proposalHtml" :srcdoc="proposalHtml" style="width:100%;height:80vh;border:1px solid #ccc;"></iframe>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

const file = ref<File | null>(null);
const query = ref('');
const proposalHtml = ref<string | null>(null);

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  file.value = target.files?.[0] || null;
}

async function handleSubmit() {
  if (!file.value || !query.value) return;
  const formData = new FormData();
  formData.append('report', file.value);
  formData.append('query', query.value);

  const response = await fetch('/api/generate-proposal', {
    method: 'POST',
    body: formData,
  });
  proposalHtml.value = await response.text();
}
</script>
