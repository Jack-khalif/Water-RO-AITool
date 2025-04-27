<template>
  <div class="summary-container">
    <h2>AI-Generated Water Treatment Recommendation</h2>
    
    <!-- Cart Items -->
    <div v-if="cartSections && cartSections.length > 0">
      <h3>Recommended Products</h3>
      <div v-for="(section, index) in cartSections" :key="index" class="cart-section">
        <h4>{{ section.label }}</h4>
        <ul v-if="section.products && section.products.length > 0">
          <li v-for="(product, pIndex) in section.products" :key="pIndex" class="product-item">
            <div class="product-name">{{ product.product_name }}</div>
            <div class="product-details">
              <span class="model">Model: {{ product.model_number }}</span>
              <span class="price">Price: ${{ product.unit_price }}</span>
              <span class="quantity">Qty: {{ product.quantity }}</span>
            </div>
            <div class="product-description">{{ product.description }}</div>
          </li>
        </ul>
        <p v-else class="empty-section">No products in this section</p>
      </div>
    </div>
    <p v-else class="empty-cart">No products in cart</p>

    <!-- Summary and Rationale -->
    <div class="explanation">
      <div v-if="summaryHtml" class="summary">
        <h3>System Summary</h3>
        <div v-html="summaryHtml"></div>
      </div>
      
      <div v-if="rationaleHtml" class="rationale">
        <h3>Recommendation Rationale</h3>
        <div v-html="rationaleHtml"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const cartSections = ref([]);
const summaryHtml = ref('');
const rationaleHtml = ref('');

onMounted(async () => {
  try {
    // Fetch cart sections
    const cartResponse = await fetch('http://localhost:8080/api/cart');
    const cartData = await cartResponse.json();
    cartSections.value = cartData.sections;
    
    // Fetch summary and rationale
    const summaryResponse = await fetch('http://localhost:8080/api/cart/summary');
    const summaryData = await summaryResponse.json();
    summaryHtml.value = summaryData.summary_html;
    rationaleHtml.value = summaryData.rationale_html;
  } catch (error) {
    console.error('Error fetching cart data:', error);
  }
});
</script>

<style scoped>
.summary-container {
  margin-top: 2rem;
  background-color: #ffffff;
  padding: 1.5rem;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.cart-section {
  margin-bottom: 1.5rem;
}

.product-item {
  margin-bottom: 1rem;
  padding: 0.8rem;
  border: 1px solid #eaeaea;
  border-radius: 6px;
}

.product-name {
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.product-details {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.product-description {
  font-size: 0.9rem;
  color: #555;
}

.empty-section, .empty-cart {
  color: #888;
  font-style: italic;
}

.explanation {
  margin-top: 2rem;
  border-top: 1px solid #eaeaea;
  padding-top: 1rem;
}

.summary, .rationale {
  margin-bottom: 1.5rem;
}

h3 {
  color: #0066A1;
  margin-bottom: 0.8rem;
}

h4 {
  color: #2C7DA0;
  margin-bottom: 0.5rem;
}
</style>