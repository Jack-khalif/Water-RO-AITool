<template>
  <div class="quotation-summary">
    <h2>{{ summaryTitle }}</h2>
    <div v-html="summaryHtml"></div>
    <h3>{{ rationaleTitle }}</h3>
    <div v-html="rationaleHtml"></div>
    <button class="go-to-cart-btn" @click="goToCart">Continue to Cart</button>
    <div class="summary-nav-btns">
      <router-link to="/quotation-cart" class="nav-btn">Go to Cart</router-link>
      <router-link to="/quotation-preview" class="nav-btn">Preview Quotation</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const summaryHtml = ref('');
const rationaleHtml = ref('');
const summaryTitle = ref('Summary');
const rationaleTitle = ref('Rationale');

onMounted(async () => {
  // Fetch summary/rationale from backend or local storage as needed
  // Example: fetch from /api/cart/summary
  try {
    const res = await axios.get('http://localhost:8000/api/cart/summary');
    // Adapt to backend response structure
    summaryHtml.value = res.data.summary || '';
    rationaleHtml.value = res.data.rationale || '';
    // Optionally, allow dynamic titles based on time of day
    const hour = new Date().getHours();
    if (hour >= 17 || hour < 5) {
      summaryTitle.value = 'Evening Summary';
      rationaleTitle.value = 'Evening Rationale';
    } else {
      summaryTitle.value = 'Summary';
      rationaleTitle.value = 'Rationale';
    }
  } catch (e) {
    summaryHtml.value = 'Could not load summary.';
    rationaleHtml.value = '';
  }
});

function goToCart() {
  router.push('/quotation-cart');
}
</script>

<style scoped>
.quotation-summary {
  max-width: 700px;
  margin: 3rem auto 2rem auto;
  background: #fafdff;
  padding: 2.5rem 2rem;
  border-radius: 14px;
  box-shadow: 0 6px 32px rgba(37,99,235,0.09);
  font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
  border: 1.5px solid #2563eb;
  text-align: left;
}
h2, h3 {
  color: #1749b1;
  margin-top: 0;
}
.go-to-cart-btn {
  background: #0066A1;
  color: #fff;
  padding: 0.9rem 2rem;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  margin-top: 2rem;
  cursor: pointer;
  transition: background 0.18s;
}
.go-to-cart-btn:hover {
  background: #1749b1;
}
.summary-nav-btns {
  display: flex;
  gap: 1.2rem;
  margin-top: 2.2rem;
  margin-bottom: 0;
  justify-content: flex-end;
}
.nav-btn {
  background: #eaf2fd;
  color: #1749b1;
  border: 1.5px solid #1749b1;
  border-radius: 8px;
  padding: 0.65rem 1.5rem;
  font-size: 1.02rem;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.18s, color 0.18s;
  cursor: pointer;
  display: inline-block;
}
.nav-btn:hover {
  background: #1749b1;
  color: #fff;
}
</style>
