<template>
  <div class="container">
    <h1>Water Analysis & Proposal Generator</h1>

    <div class="section">
      <h2>1. Enter Water Parameters</h2>
      <div v-for="(_, key) in waterParams" :key="key" class="param-input">
        <label :for="key">{{ key.toUpperCase() }}:</label>
        <input type="number" v-model.number="waterParams[key]" />
      </div>
    </div>

    <!-- Client Type and Use Case Dropdowns -->
    <div class="section">
      <h2>2. Client Details</h2>
      <div class="input-group">
        <label for="clientType">Client Type:</label>
        <select v-model="clientType" id="clientType">
          <option value="residential">Residential</option>
          <option value="commercial">Commercial</option>
        </select>
      </div>

      <div class="input-group">
        <label for="useCase">Use Case:</label>
        <select v-model="useCase" id="useCase">
          <option value="drinking">Drinking Water</option>
          <option value="industrial">Industrial Use</option>
          <option value="bottling">Bottled Water</option>
        </select>
      </div>
    </div>

    <div class="section">
      <h2>3. Upload Water Report (Optional)</h2>
      <input type="file" disabled />
      <small>(Coming soon: OCR-powered AI upload)</small>
    </div>

    <button @click="analyzeWater">Generate Proposal</button>

    <ProposalSummary v-if="proposal" :proposal="proposal" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ProposalSummary from './ProposalSummary.vue'

const waterParams = ref({
  ph: 7,
  tds: 500,
  iron: 0.1,
  manganese: 0.02,
  hardness: 150,
  turbidity: 1.0,
})

const proposal = ref<null | {
  pretreatment: string
  roSize: string
  postTreatment: string
  notes: string
}>(null)

const clientType = ref("residential")
const useCase = ref("drinking")

function analyzeWater() {
  const { ph, tds, iron, manganese, hardness } = waterParams.value

  let pretreatment = 'Standard Filtration'
  let roSize = '250 L/hr RO System'
  let postTreatment = 'UV Sterilizer'
  let notes = ''

  if (iron > 0.3 || manganese > 0.1) {
    pretreatment = 'DMI Filter + Chlorine Dosing'
    notes += 'DMI required for Fe/Mn.\n'
  }
  if (ph < 6.5) {
    pretreatment += ' + pH Correction'
    notes += 'Low pH detected. Add correction.\n'
  }
  if (tds > 1000) {
    roSize = '500 L/hr RO with Antiscalant'
    notes += 'High TDS: larger system and antiscalant required.\n'
  }
  if (hardness > 300) {
    pretreatment += ' + Softener'
    notes += 'Hard water: add softener.\n'
  }

  proposal.value = { pretreatment, roSize, postTreatment, notes }
}
</script>

<style scoped>
.container {
  max-width: 700px;
  margin: 2rem auto;
  background-color: #F5F9FC;
  padding: 2rem;
  border-radius: 12px;
  font-family: Arial, sans-serif;
}
h1 {
  color: #0066A1;
  margin-bottom: 1.5rem;
}
.section {
  margin-top: 2rem;
}
.param-input {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
}
label {
  font-weight: bold;
  width: 120px;
}
input[type="number"],
select {
  padding: 0.5rem;
  width: 200px;
  border: 1px solid #ccc;
  border-radius: 6px;
}
button {
  background-color: #0066A1;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 6px;
  margin-top: 2rem;
}
button:hover {
  background-color: #2C7DA0;
}
ul {
  margin-top: 1rem;
}
.input-group {
  margin-bottom: 1rem;
}
</style>
