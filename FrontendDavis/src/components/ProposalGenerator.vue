<template>
  <div>
    <!-- Step 1: Upload PDF -->
    <div v-if="step === 1" class="upload-step full-page-step">
      <label class="upload-label">
        <span class="upload-title">Upload your Water Analysis Report (PDF/DOCX)</span>
        <input type="file" accept=".pdf,.docx" @change="onFileChange" class="file-input" />
      </label>
      <button 
        class="next-btn"
        :disabled="!file"
        @click="goToQueryStep"
      >Next: Enter Query</button>
    </div>
    <transition name="fade-slide">
      <div v-if="isStepLoading" class="step-loading-overlay">
        <div class="step-spinner"></div>
        <div class="step-loading-message">Preparing your query page...</div>
      </div>
    </transition>

    <!-- Step 2: Enter Query & Generate Quotation Cart -->
    <div v-else-if="step === 2" class="query-step full-page-step">
      <transition name="fade-slide">
        <div class="query-card prominent-query-card animated-card immersive-query-card" v-show="step === 2">
          <div class="step-indicator">Step 2 of 3</div>
          <form @submit.prevent="handleSubmit" class="query-form">
            <div class="floating-label-group" :class="{'focused': isFocused || query, 'has-content': query}">
              <textarea
                ref="queryTextarea"
                v-model="query"
                class="query-input big-query-input animated-input"
                rows="8"
                @focus="isFocused = true"
                @blur="isFocused = false; handleSubmit()"
                @keyup.enter="handleSubmit"
                :placeholder="showTypingDots ? typingPlaceholder : ''"
              ></textarea>
              <label class="floating-label">Describe what you want to generate</label>
              <transition name="typing-dots"><span v-if="showTypingDots" class="typing-dots">...</span></transition>
            </div>
            <p class="query-helper">For example: <span class="example">Generate a quotation and quotation cart for this analysis.</span></p>
            <button class="back-btn" type="button" @click="step = 1">Back</button>
          </form>
        </div>
      </transition>
    </div>

    <!-- Step 3: Show Quotation Cart -->
    <div v-else-if="step === 3" class="quotationCartep">
      <iframe v-if="quotationHtml" :srcdoc="quotationHtml" style="width:100%;height:80vh;border:1px solid #ccc;"></iframe>
      <button class="back-btn" @click="step = 2">Back to Query</button>
    </div>

    <!-- Loading Overlay -->
    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
      <div class="loading-message">Generating your quotation cart, please wait...</div>
    </div>

    <div v-if="error" class="error-msg">{{ error }}</div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch } from 'vue';

const step = ref(1); // 1 = upload, 2 = query, 3 = quotation cart
const file = ref<File | null>(null);
const query = ref('');
const quotationHtml = ref<string | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

// Animation and autofocus for query box
const isFocused = ref(false);
const queryTextarea = ref<HTMLTextAreaElement | null>(null);
const showTypingDots = ref(true);
const typingPlaceholder = '...';

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  file.value = target.files?.[0] || null;
}

const isStepLoading = ref(false);

function goToQueryStep() {
  if (file.value) {
    isStepLoading.value = true;
    setTimeout(() => {
      step.value = 2;
      isStepLoading.value = false;
    }, 1000); // 1 second transition
  }
}

// Autofocus when entering step 2
watch(step, (val) => {
  if (val === 2) {
    setTimeout(() => {
      queryTextarea.value?.focus();
    }, 250);
    // Show typing dots for 1.2s, then hide
    showTypingDots.value = true;
    setTimeout(() => { showTypingDots.value = false; }, 1200);
  }
});

async function handleSubmit() {
  if (!file.value || !query.value) return;
  loading.value = true;
  error.value = null;
  quotationHtml.value = null;
  try {
    const formData = new FormData();
    formData.append('report', file.value);
    formData.append('query', query.value);

    const response = await fetch('/api/generate-quotation-cart', {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error('Failed to generate quotation cart.');
    quotationHtml.value = await response.text();
    step.value = 3;
  } catch (e: any) {
    error.value = e.message || 'An error occurred.';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.full-page-step {
  min-height: 100vh;
  min-height: 100dvh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(120deg,#f7fafd 60%,#e3f1fb 100%);
  position: relative;
  z-index: 1;
}
.upload-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  margin: 0 auto;
  max-width: 400px;
  background: #f7fafd;
  padding: 2rem 2.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
}

.step-loading-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 9999;
  background: rgba(255,255,255,0.96);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.5s;
}
@keyframes fadeIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}
.step-spinner {
  border: 7px solid #e3e3e3;
  border-top: 7px solid #0066A1;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  animation: spin 1s linear infinite;
  margin-bottom: 1.3rem;
}
.step-loading-message {
  color: #0066A1;
  font-size: 1.2rem;
  font-weight: 600;
  letter-spacing: 0.03em;
}

.upload-label {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}
.upload-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #0066A1;
}
.file-input {
  margin-top: 0.5rem;
}
.next-btn {
  background: #0066A1;
  color: #fff;
  padding: 0.7rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  margin-top: 1.5rem;
  transition: background 0.2s;
}
.next-btn:disabled {
  background: #c6d6e3;
  cursor: not-allowed;
}

.query-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 3rem auto;
}
.query-card {
  background: #fff;
  padding: 2.5rem 2.5rem 3rem 2.5rem;
  border-radius: 18px;
  box-shadow: 0 4px 24px rgba(0,102,161,0.12);
  width: 100%;
  max-width: 700px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}
.immersive-query-card {
  min-height: 60vh;
  min-width: 40vw;
  justify-content: center;
  margin: 0 auto;
  background: linear-gradient(120deg,#fafdff 60%,#e3f1fb 100%);
  box-shadow: 0 8px 40px rgba(0,102,161,0.10);
  position: relative;
  z-index: 2;
}
.step-indicator {
  position: absolute;
  top: 2rem;
  left: 2rem;
  background: #e3f1fb;
  color: #0066A1;
  font-size: 1.07rem;
  font-weight: 600;
  padding: 0.35em 1.1em;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0,102,161,0.04);
  letter-spacing: 0.04em;
}

.prominent-query-card {
  border: 3px solid #0066A1;
  background: linear-gradient(120deg,#f7fafd 60%,#e3f1fb 100%);
  box-shadow: 0 8px 40px rgba(0,102,161,0.10);
}
.big-query-title {
  font-size: 2.2rem;
  font-weight: 700;
  color: #0066A1;
  margin-bottom: 0.5rem;
  text-align: center;
}
.query-helper {
  font-size: 1.18rem;
  color: #555;
  margin-bottom: 1.5rem;
  text-align: center;
}
.example {
  color: #2C7DA0;
  font-style: italic;
}
.big-query-input {
  width: 100%;
  min-height: 160px;
  font-size: 1.3rem;
  border: 2.5px solid #0066A1;
  border-radius: 10px;
  padding: 1.5rem 1.5rem;
  outline: none;
  margin-bottom: 1rem;
  resize: vertical;
  background: #fafdff;
  box-shadow: 0 2px 12px rgba(0,102,161,0.04);
  transition: border 0.2s, box-shadow 0.2s;
}
.big-query-input:focus {
  border: 3px solid #2C7DA0;
  background: #f7fafd;
  box-shadow: 0 0 0 4px #b3e1fa, 0 4px 20px rgba(0,102,161,0.13);
  animation: pulse-glow 1s;
}
@keyframes pulse-glow {
  0% { box-shadow: 0 0 0 0 #b3e1fa, 0 4px 20px rgba(0,102,161,0.08); }
  70% { box-shadow: 0 0 0 8px #b3e1fa, 0 4px 20px rgba(0,102,161,0.16); }
  100% { box-shadow: 0 0 0 4px #b3e1fa, 0 4px 20px rgba(0,102,161,0.13); }
}

.floating-label-group {
  position: relative;
  width: 100%;
  margin-bottom: 1.5rem;
  transition: box-shadow 0.3s;
}
.floating-label {
  position: absolute;
  left: 1.7rem;
  top: 2.3rem;
  color: #0066A1;
  font-size: 1.2rem;
  font-weight: 600;
  pointer-events: none;
  opacity: 0.7;
  transition: all 0.22s cubic-bezier(.4,0,.2,1);
}
.floating-label-group.focused .floating-label,
.floating-label-group.has-content .floating-label {
  top: 0.7rem;
  left: 1.5rem;
  font-size: 1.05rem;
  color: #2C7DA0;
  opacity: 1;
  background: #fafdff;
  padding: 0 0.3em;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,102,161,0.03);
}
.animated-card {
  animation: fadeInUp 0.7s cubic-bezier(.4,0,.2,1);
}
@keyframes fadeInUp {
  0% { opacity: 0; transform: translateY(40px); }
  100% { opacity: 1; transform: translateY(0); }
}
.animated-input {
  transition: box-shadow 0.2s, border 0.2s;
}
.typing-dots {
  position: absolute;
  right: 2rem;
  top: 2.3rem;
  color: #2C7DA0;
  font-size: 1.3rem;
  letter-spacing: 2px;
  animation: blink-dots 1s steps(1) infinite;
}
@keyframes blink-dots {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}
.fade-slide-enter-active, .fade-slide-leave-active {
  transition: all 0.45s cubic-bezier(.4,0,.2,1);
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(32px) scale(0.97);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(32px) scale(0.97);
}

.query-card h2 {
  color: #0066A1;
  margin-bottom: 0.5rem;
}
.query-input {
  width: 100%;
  min-height: 70px;
  font-size: 1.1rem;
  border: 1.5px solid #0066A1;
  border-radius: 6px;
  padding: 0.75rem 1rem;
  outline: none;
  margin-bottom: 1rem;
  resize: vertical;
  transition: border 0.2s;
}
.query-input:focus {
  border: 2px solid #2C7DA0;
  background: #f7fafd;
}
.generate-btn {
  background: #0066A1;
  color: #fff;
  padding: 0.7rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}
.generate-btn:disabled {
  background: #c6d6e3;
  cursor: not-allowed;
}
.back-btn {
  background: transparent;
  color: #0066A1;
  border: none;
  margin-top: 1rem;
  font-size: 1rem;
  cursor: pointer;
  text-decoration: underline;
}

.quotationCartep {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 2rem auto;
}

.loading-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 9999;
  background: rgba(255,255,255,0.75);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.spinner {
  border: 6px solid #e3e3e3;
  border-top: 6px solid #0066A1;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
.loading-message {
  color: #0066A1;
  font-size: 1.1rem;
  font-weight: 500;
}
.error-msg {
  color: red;
  text-align: center;
  margin-top: 1rem;
}
</style>
