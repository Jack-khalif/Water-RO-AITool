<template>
  <div class="home-container">
    <div class="options-grid">
      <router-link class="option-card" to="/dashboard/upload-report">
        <h3>Upload Report</h3>
        <p>Start by uploading the water lab report (PDF/image)</p>
      </router-link>

      <!-- More tools can be added here -->
    </div>
  </div>
</template>

<script setup lang="ts">
// logic can go here if needed later
</script>

<style scoped>
.home-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: calc(100vh - 4rem); /* adjust based on nav height */
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  max-width: 800px;
  width: 100%;
}

.option-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  text-decoration: none;
  color: #213547;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s, box-shadow 0.2s;
}

.option-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

</style>
