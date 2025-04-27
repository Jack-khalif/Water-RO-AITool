<template>
  <div class="upload-wrapper">
    <div class="upload-card">
      <h2>📄 Upload Water Lab Report</h2>
      <p class="subtext">Drag and drop a PDF/image or click to browse</p>

      <div
        class="drop-zone"
        @dragover.prevent
        @drop.prevent="handleDrop"
        @click="fileInput?.click()"
      >
        <span v-if="!selectedFile">Drop file here or click to select</span>
        <span v-else>📎 {{ selectedFile.name }}</span>
        <input
          type="file"
          accept=".pdf,image/*"
          ref="fileInput"
          class="hidden-input"
          @change="onFileChange"
        />
      </div>

      <input
        v-model="query"
        placeholder="Describe your use case or requirements (e.g., 'Design a water treatment system for a school in Nairobi')"
        class="query-input"
      />

      <button @click="handleSubmit" :disabled="!canSubmit" class="submit-button">
        <span v-if="loading">Analyzing...</span>
        <span v-else>Analyze & Go to Quotation Cart</span>
      </button>

      <div v-if="error" class="error-msg">{{ error }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const selectedFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const query = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const router = useRouter()

const canSubmit = computed(() => selectedFile.value && query.value && !loading.value)

function onFileChange(event: Event) {
  const files = (event.target as HTMLInputElement).files
  if (files?.length) selectedFile.value = files[0]
}

function handleDrop(event: DragEvent) {
  const files = event.dataTransfer?.files
  if (files?.length) selectedFile.value = files[0]
}

async function handleSubmit() {
  if (!selectedFile.value || !query.value) return

  loading.value = true
  error.value = null

  try {
    const formData = new FormData()
    formData.append('report', selectedFile.value)
    formData.append('query', query.value)

    const analyzeRes = await fetch('http://localhost:8080/api/analyze', {
      method: 'POST',
      body: formData
    })

    if (!analyzeRes.ok) throw new Error('Failed to analyze the report.')

    const { recommendation } = await analyzeRes.json()

    const populateRes = await fetch('http://localhost:8080/api/cart/populate_from_llm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recommendation)
    })

    if (!populateRes.ok) {
      const errorDetail = await populateRes.text()
      throw new Error(errorDetail || 'Failed to populate quotation cart.')
    }

    router.push('/quotation-cart')
  } catch (e: any) {
    error.value = e.message || 'An unexpected error occurred.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.upload-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 5rem);
  background-color: #f5f9fc;
  padding: 2rem;
}

.upload-card {
  background: white;
  padding: 2rem 3rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 100%;
  text-align: center;
}

h2 {
  color: #0066A1;
  margin-bottom: 0.5rem;
}

.subtext {
  color: #555;
  margin-bottom: 1.5rem;
}

.drop-zone {
  border: 2px dashed #0066a1;
  border-radius: 8px;
  padding: 2rem;
  background-color: #eaf4fb;
  color: #0066a1;
  font-weight: bold;
  cursor: pointer;
  margin-bottom: 1.5rem;
  transition: background-color 0.3s;
}

.drop-zone:hover {
  background-color: #d5eaf6;
}

.hidden-input {
  display: none;
}

.query-input {
  width: 100%;
  padding: 0.8rem;
  margin-bottom: 1rem;
  border: 1px solid #ccc;
  border-radius: 6px;
}

.submit-button {
  background-color: #0066A1;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 6px;
  font-weight: bold;
  transition: background-color 0.3s;
  margin-top: 1rem;
}

.submit-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.submit-button:hover:not(:disabled) {
  background-color: #2c7da0;
}

.error-msg {
  color: red;
  margin-top: 1rem;
}
</style>
