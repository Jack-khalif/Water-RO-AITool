<template>
  <div class="quotation-preview">
    <h2>Quotation Preview</h2>
    <div class="quotation-table-wrapper">
      <table class="quotation-table">
        <thead>
          <tr>
            <th>Category</th>
            <th>Product Name</th>
            <th>Model Number</th>
            <th>Description</th>
            <th>Unit Price</th>
            <th>Quantity</th>
            <th>Total</th>
            <th class="sticky-remove">Remove</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="(section, sectionIdx) in productSections" :key="section.label">
            <tr v-for="(p, i) in section.products" :key="p.model_number">
              <td>{{ section.label }}</td>
              <td><input v-model="p.product_name" readonly class="readonly" /></td>
              <td><input v-model="p.model_number" readonly class="readonly" /></td>
              <td><textarea v-model="p.description" readonly class="readonly description-area" rows="2"></textarea></td>
              <td><input type="number" v-model.number="p.unit_price" readonly class="readonly" /></td>
              <td><input type="number" v-model.number="p.quantity" min="1" class="qty-input" /></td>
              <td>{{ (p.unit_price * p.quantity).toLocaleString() }}</td>
              <td>
                <button class="remove-btn" @click="removeProduct(sectionIdx, i)">Remove</button>
              </td>
            </tr>
          </template>


        </tbody>
      </table>
    </div>

    <!-- Additional Costs Section -->
    <div class="additional-costs-section">
      <h3>Add Costs</h3>
      <div class="costs-add-bar">
        <select v-model="addCostType">
          <option disabled value="">Add cost...</option>
          <option v-for="option in availableCostOptions" :key="option.key" :value="option.key">{{ option.label }}</option>
        </select>
        <template v-if="addCostType !== 'other' && addCostType">
          <button class="add-btn" @click="handleAddCost" :disabled="!addCostType">Add</button>
        </template>
        <template v-else-if="addCostType === 'other'">
          <input v-model="newOtherLabel" placeholder="Cost Label" />
          <input type="number" v-model.number="newOtherAmount" min="0" placeholder="Amount" />
          <button class="add-btn" @click="tryAddOtherCost">Add</button>
          <button class="cancel-btn" @click="cancelOtherForm">Cancel</button>
        </template>
      </div>

      <div class="costs-table-section" v-if="allCosts.length">
        <h4>All Costs</h4>
        <table class="quotation-table cost-table">
          <thead>
            <tr><th>Label</th><th>Amount</th><th>Remove</th></tr>
          </thead>
          <tbody>
            <tr v-for="(cost, i) in allCosts" :key="cost.key" :class="cost.preset ? '' : 'other-cost-row'">
              <td>
                <input v-if="cost.preset" v-model="cost.label" readonly class="readonly" />
                <span v-else style="color:#1749b1; font-weight:500;">{{ cost.label }}</span>
              </td>
              <td>
                <input v-if="cost.preset" type="number" v-model.number="cost.amount" min="0" />
                <span v-else style="color:#22314a; font-weight:600;">{{ cost.amount.toLocaleString() }}</span>
              </td>
              <td>
                <button class="remove-btn" @click="removeCustomCost(i)"><span class="remove-icon">✕</span></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>



      <div class="total-row">
        <strong>Grand Total:</strong> {{ grandTotal.toLocaleString() }}
      </div>

      <button class="download-btn" @click="downloadExcel">Download Excel</button>
    </div>
    <div class="preview-nav-btns">
      <router-link to="/quotation-cart" class="nav-btn">Go to Cart</router-link>
      <router-link to="/quotation-summary" class="nav-btn">Summary & Rationale</router-link>
      <router-link to="/proposal" class="nav-btn">Generate Proposal</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import * as XLSX from 'xlsx'

const productSections = ref([
  {
    label: 'Pretreatment',
    products: [
      { product_name: 'Multi-media filter', model_number: 'MMF-1500', description: 'Multi-media filter for sediment removal', unit_price: 500, quantity: 1 },
    ]
  },
  {
    label: 'RO',
    products: [
      { product_name: 'Reverse Osmosis Unit', model_number: 'RO-DSmart1500', description: 'Reverse Osmosis unit for desalination', unit_price: 1500, quantity: 1 },
    ]
  },
  {
    label: 'Post Treatment',
    products: [
      { product_name: 'UV Sterilizer', model_number: 'UV-400', description: 'UV sterilizer for disinfection', unit_price: 250, quantity: 1 },
    ]
  }
])

const PRESET_COST_OPTIONS = [
  { label: 'Transport', key: 'transport' },
  { label: 'Labor', key: 'labor' },
  { label: 'Installation', key: 'installation' },
]
const addedPresetCosts = ref([])
const customCosts = ref([])
const addCostType = ref("")
const newOtherLabel = ref("")
const newOtherAmount = ref(0)

const availableCostOptions = computed(() => {
  const preset = PRESET_COST_OPTIONS.filter(
    (opt) => !addedPresetCosts.value.some((c) => c.key === opt.key)
  )
  return [...preset, { label: 'Other', key: 'other' }]
})

function handleAddCost() {
  if (!addCostType.value) return
  if (addCostType.value === 'other') {
    return
  }
  const found = PRESET_COST_OPTIONS.find((c) => c.key === addCostType.value)
  if (found && !addedPresetCosts.value.some((c) => c.key === found.key)) {
    addedPresetCosts.value.push({ ...found, amount: 0, preset: true })
    addCostType.value = ""
  }
}

function tryAddOtherCost() {
  if (newOtherLabel.value && newOtherAmount.value > 0) {
    customCosts.value.push({
      label: newOtherLabel.value,
      amount: newOtherAmount.value,
      preset: false,
      key: Date.now() + Math.random(),
    })
    newOtherLabel.value = ""
    newOtherAmount.value = 0
    addCostType.value = ""
  }
}

function cancelOtherForm() {
  newOtherLabel.value = ""
  newOtherAmount.value = 0
  addCostType.value = ""
}

function removeCustomCost(idx) {
  if (idx < addedPresetCosts.value.length) {
    addedPresetCosts.value.splice(idx, 1)
  } else {
    customCosts.value.splice(idx - addedPresetCosts.value.length, 1)
  }
}

const allCosts = computed(() => [
  ...addedPresetCosts.value,
  ...customCosts.value
])

function removeProduct(sectionIdx, prodIdx) {
  productSections.value[sectionIdx].products.splice(prodIdx, 1)
}

const grandTotal = computed(() => {
  let total = 0
  productSections.value.forEach(section => {
    section.products.forEach(p => {
      total += (p.unit_price || 0) * (p.quantity || 0)
    })
  })
  allCosts.value.forEach(c => {
    total += c.amount || 0
  })
  return total
})

function downloadExcel() {
  const rows = []
  productSections.value.forEach(section => {
    section.products.forEach(p => {
      rows.push({
        Category: section.label,
        'Product Name': p.product_name,
        'Model Number': p.model_number,
        Description: p.description,
        'Unit Price': p.unit_price,
        Quantity: p.quantity,
        Total: p.unit_price * p.quantity
      })
    })
  })
  customCosts.value.forEach(c => {
    rows.push({
      Category: 'Custom Cost',
      'Product Name': c.label,
      'Model Number': '',
      Description: '',
      'Unit Price': '',
      Quantity: '',
      Total: c.amount
    })
  })
  rows.push({ Category: '', 'Product Name': '', 'Model Number': '', Description: '', 'Unit Price': '', Quantity: 'Grand Total', Total: grandTotal.value })
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Quotation')
  XLSX.writeFile(wb, 'quotation.xlsx')
}
</script>

<style scoped>
.quotation-preview {
  padding: 2rem;
  background: #f9f9f9;
}

.quotation-table-wrapper {
  overflow-x: auto;
}

.quotation-table {
  width: 100%;
  border-collapse: collapse;
}

.quotation-table th,
.quotation-table td {
  border: 1px solid #e0e6ed;
  padding: 12px 10px;
  text-align: left;
  background: #fff;
}

.quotation-table tr {
  transition: background 0.18s;
}
.quotation-table tr:hover {
  background: #f6faff;
}

.quotation-table {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(60,72,88,0.07);
}

.quotation-table th {
  background-color: #f2f2f2;
}

.readonly {
  background-color: #f5f5f5;
  border: none;
  resize: none;
}

.description-area {
  min-width: 220px;
  max-width: 420px;
  width: 100%;
  font-size: 1rem;
  padding: 6px 8px;
  border-radius: 6px;
  line-height: 1.4;
  background: #fafdff;
  color: #222;
  overflow-y: auto;
}

.qty-input {
  width: 60px;
}

.remove-btn {
  background: red;
  color: white;
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
  border: 1.5px solid #1749b1;
}
.remove-icon {
  font-size: 1.1em;
  font-weight: bold;
  line-height: 1;
}

.additional-costs-section {
  margin-top: 2rem;
  background: #eaf2fd;
  border: 1.5px solid #4f8dfd;
  box-shadow: 0 2px 10px rgba(37,99,235,0.06);
  padding: 1.5rem 1.2rem 2rem 1.2rem;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
}

.costs-add-bar {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin-bottom: 1.2rem;
  background: #eaf2fd;
  border-radius: 8px;
  padding: 0.85rem 1rem;
  box-shadow: 0 1px 4px rgba(60,72,88,0.04);
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
  background: #2563eb;
}

.cancel-btn {
  background: #e0e6ed;
  color: #444;
  border: none;
  padding: 7px 14px;
  border-radius: 6px;
  font-size: 1rem;
  margin-left: 2px;
  cursor: pointer;
  transition: background 0.15s;
}
.cancel-btn:hover {
  background: #cfd8e3;
}

.download-btn {
  background: #4f8dfd;
  color: #fff;
  border: none;
  border-radius: 7px;
  padding: 8px 20px;
  font-size: 1.07rem;
  font-weight: 500;
  margin-top: 1.7rem;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(60,72,88,0.04);
  transition: background 0.16s;
}
.download-btn:hover {
  background: #2563eb;
}

.remove-btn {
  background: #eaf2fd;
  color: #4f8dfd;
  border: 1.5px solid #4f8dfd;
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
  background: #4f8dfd;
  color: #fff;
  border: 1.5px solid #2563eb;
}
.remove-icon {
  font-size: 1.1em;
  font-weight: bold;
  line-height: 1;
}

.cost-row {
  margin-top: 0.5rem;
}
.preview-nav-btns {
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
