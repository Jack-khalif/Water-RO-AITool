<template>
  <div class="quotation-cart-layout">
    <div class="cart-main">
      <h2>Quotation Cart</h2>
      <div class="cart-table-wrapper">
        <table class="cart-table">
        <thead>
          <tr>
            <th><span class="material-icons th-icon" title="Product Name">inventory_2</span> Product Name</th>
            <th><span class="material-icons th-icon" title="Model Number">confirmation_number</span> Model Number</th>
            <th><span class="material-icons th-icon" title="Description">info</span> Description</th>
            <th>Price</th>
            <th><span class="material-icons th-icon" title="Quantity">edit</span> Quantity</th>
            <th class="sticky-remove">Remove</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="(section, sectionIdx) in productSections" :key="section.label">
            <tr class="category-row">
              <td :colspan="6"><strong>{{ section.label }}</strong></td>
            </tr>
            <tr v-for="(p, i) in section.products" :key="p.model_number">
              <td :title="p.product_name" class="td-product">{{ p.product_name }}</td>
              <td :title="p.model_number" class="td-model">{{ p.model_number }}</td>
              <td :title="p.description" class="td-desc">{{ p.description }}</td>
              <td class="td-price">{{ p.unit_price }}</td>
              <td class="td-qty">
                <input
                  type="number"
                  :value="p.quantity"
                  min="1"
                  :title="'Edit quantity for ' + p.product_name"
                  @change="updateQuantity(sectionIdx, i, $event.target.value)"
                />
              </td>
              <td class="td-remove">
                <button
                  class="remove-btn"
                  @click="removeProduct(sectionIdx, i)"
                  :title="'Remove ' + p.product_name"
                >
                  <span class="material-icons">remove_circle_outline</span>
                  Remove
                </button>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <div class="search-bar">
      <input
        v-model="search"
        placeholder="Search for products..."
        @input="searchProducts"
      />
      <div v-if="searchResults.length" class="search-results">
        <div
          v-for="item in searchResults"
          :key="item.model_number"
          class="search-result-item"
        >
          {{ item.product_name }} ({{ item.model_number }})
          <div v-if="addCategoryIdx !== item.model_number">
            <button class="add-btn" @click="showCategorySelect(item.model_number)">
              Add
            </button>
          </div>
          <div v-else>
            <select v-model="chosenCategoryIdx">
              <option
                v-for="(section, idx) in productSections"
                :key="section.label"
                :value="idx"
              >
                {{ section.label }}
              </option>
            </select>
            <button class="add-btn" @click="addProduct(item, chosenCategoryIdx)">
              Confirm
            </button>
            <button class="remove-btn" @click="addCategoryIdx = null">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
    </div>
    <div class="cart-nav-btns">
      <router-link to="/quotation-summary" class="nav-btn">Summary & Rationale</router-link>
    </div>
    <div class="summary-horizontal-bar">
      <h3>Summary & Rationale</h3>
      <div v-html="summaryHtml" class="summary-html"></div>
    </div>
    <div class="cart-btn-bar">
      <button class="next-btn" @click="goToPreview">Continue to Preview</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const API_BASE = 'http://localhost:8000'
const productSections = ref([])
const search = ref('')
const searchResults = ref([])
const addCategoryIdx = ref(null)
const chosenCategoryIdx = ref(0)

const summaryHtml = ref('')

async function fetchSummary() {
  try {
    const res = await axios.get(`${API_BASE}/api/cart/summary`)
    // Merge summary and rationale into a single block
    summaryHtml.value = (res.data.summary_html || '') + '<br><br>' + (res.data.rationale_html || '')
  } catch (e) {
    summaryHtml.value = 'Unable to load summary and rationale.'
  }
}

function goToPreview() {
  window.location.href = '/quotation-preview';
}

// Fetch cart and summary on mount
onMounted(async () => {
  await fetchCart()
  await fetchSummary()
})

async function fetchCart() {
  const res = await axios.get(`${API_BASE}/api/cart`)
  productSections.value = res.data.sections
}

async function addProduct(item, sectionIdx) {
  const section = productSections.value[sectionIdx]
  await axios.post(`${API_BASE}/api/cart/add`, {
    section_label: section.label,
    product: { ...item, quantity: 1 },
  })
  await fetchCart()
  addCategoryIdx.value = null
}

async function removeProduct(sectionIdx, prodIdx) {
  const section = productSections.value[sectionIdx]
  const product = section.products[prodIdx]
  await axios.post(`${API_BASE}/api/cart/remove`, {
    section_label: section.label,
    model_number: product.model_number,
  })
  await fetchCart()
}

function showCategorySelect(modelNumber) {
  addCategoryIdx.value = modelNumber
  chosenCategoryIdx.value = 0
}

async function searchProducts() {
  if (search.value.length < 2) {
    searchResults.value = []
    return
  }
  const res = await axios.get(`${API_BASE}/api/products/search`, {
    params: { query: search.value }
  })
  searchResults.value = res.data.results
}

async function updateQuantity(sectionIdx, prodIdx, quantity) {
  const section = productSections.value[sectionIdx]
  const product = section.products[prodIdx]
  await axios.post(`${API_BASE}/api/cart/update_quantity`, {
    section_label: section.label,
    model_number: product.model_number,
    quantity: quantity,
  })
  await fetchCart()
}
</script>


<style scoped>
.quotation-cart-layout {
  max-width: 1100px;
  margin: 2.5rem auto;
}
.cart-main {
  background: #f7fafd;
  padding: 2.5rem 2.2rem 2rem 2.2rem;
  border-radius: 14px;
  box-shadow: 0 6px 32px rgba(37,99,235,0.09);
  font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
  border: 1.5px solid #2563eb;
  overflow-x: auto;
}
.summary-sidebar {
  flex: 0 0 260px;
  background: #eaf2fd;
  border-radius: 14px;
  border: 1.5px solid #1749b1;
  box-shadow: 0 2px 10px rgba(23,73,177,0.07);
  padding: 1.4rem 1rem 1.4rem 1rem;
  color: #22314a;
  font-size: 0.99rem;
  position: sticky;
  top: 2.5rem;
  height: fit-content;
  min-width: 210px;
  max-width: 260px;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  align-self: flex-start;
}

@media (max-width: 900px) {
  .summary-horizontal-bar {
    padding: 0.8rem 0.5rem;
    font-size: 0.98rem;
  }
  .cart-btn-bar {
    margin-top: 1.2rem;
  }

  .quotation-cart-layout {
    flex-direction: column;
    max-width: 98vw;
    gap: 1.2rem;
  }
  .cart-main, .summary-sidebar {
    max-width: 100vw;
    min-width: 0;
    padding: 1.1rem 0.5rem;
  }
  .summary-sidebar {
    position: static;
  }
  .cart-table {
    min-width: 500px;
  }
}

.summary-sidebar h3, .summary-sidebar h4 {
  color: #1749b1;
  margin-bottom: 0.7rem;
  margin-top: 0;
}
.summary-html, .rationale-html {
  background: #fff;
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid #c3dafe;
  margin-bottom: 1.1rem;
  min-height: 60px;
}
.next-btn {
  background: #1749b1;
  color: #fff;
  padding: 0.7rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.18s;
}
.next-btn:hover {
  background: #0066A1;
}

.cart-nav-btns {
  display: flex;
  gap: 1.2rem;
  margin-bottom: 1.7rem;
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


.cart-table-wrapper {
  overflow-x: auto;
  margin-bottom: 2.2rem;
  max-width: 100%;
}

.cart-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 700px;
  max-width: 100%;
  table-layout: auto;
}

.cart-table th,
.cart-table td {
  border: 1px solid #e0e6ed;
  padding: 12px 10px;
  text-align: left;
  background: #fff;
}

.cart-table tr {
  transition: background 0.18s;
}
.cart-table tr:hover {
  background: #f6faff;
}

.cart-table {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(60,72,88,0.07);
}

.cart-table th {
  background: #eaf2fd;
  font-size: 0.97rem;
  color: #22314a;
  border-bottom: 2px solid #2563eb;
  position: sticky;
  top: 0;
  z-index: 2;
  letter-spacing: 0.01em;
}

.th-icon {
  vertical-align: middle;
  margin-right: 0.4rem;
  font-size: 1.1rem;
}

.sticky-remove {
  text-align: center;
}

.category-row td {
  background: #eaf2fd;
  font-weight: bold;
  padding-top: 1rem;
  padding-bottom: 1rem;
  font-size: 1.07rem;
  color: #1749b1;
  border-top: 2px solid #2563eb;
}

.td-product, .td-model, .td-desc {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.td-price {
  color: #27ae60;
  font-weight: 600;
}

.td-qty input {
  width: 70px;
  padding: 0.3rem 0.4rem;
  font-size: 0.95rem;
}

.remove-btn {
  background: #eaf2fd;
  color: #2563eb;
  border: 1.5px solid #2563eb;
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 1rem;
  cursor: pointer;
  margin-left: 2px;
  transition: background 0.15s;
  font-weight: bold;
  box-shadow: none;
  display: flex;
  align-items: center;
}
.remove-btn:hover {
  background: #2563eb;
  color: #fff;
}

.add-btn {
  background: #4f8dfd;
  color: #fff;
  border: none;
  padding: 7px 16px;
  border-radius: 6px;
  font-weight: 500;
  font-size: 1rem;
  margin-left: 2px;
  cursor: pointer;
  transition: background 0.18s;
  display: flex;
  align-items: center;
}
.add-btn:hover {
  background: #1749b1;
}

.remove-btn .material-icons {
  margin-right: 0.3rem;
}

.search-bar {
  margin-bottom: 2rem;
}

.search-bar input {
  width: 100%;
  padding: 0.7rem 1rem;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.search-results {
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 1rem;
}

.search-result-item {
  margin-bottom: 1rem;
  font-size: 0.95rem;
}

.add-btn, .remove-btn {
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  border: none;
  margin-right: 0.5rem;
  font-size: 0.95rem;
  cursor: pointer;
}

.add-btn {
  background-color: #3498db;
  color: white;
}

.remove-btn {
  background-color: #e74c3c;
  color: white;
}

.summary-link {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1.5rem;
}
.go-to-summary-btn {
  background: #1749b1;
  color: #fff;
  padding: 0.8rem 2rem;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.18s;
}
.go-to-summary-btn:hover {
  background: #0066A1;
}

</style>
