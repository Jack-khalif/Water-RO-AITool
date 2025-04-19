<template>
  <div class="features-page">
    <h1>Features</h1>
    <div class="features-grid">
      <div class="feature-card">
        <h3>AI-Powered Water Analysis</h3>
        <p>Automatically interpret lab results.</p>
      </div>
      <div class="feature-card">
        <h3>RO System Design</h3>
        <p>Size and configure RO units.</p>
      </div>
      <div class="feature-card">
        <h3>Proposal Generation</h3>
        <p>Download Word/PDF proposals.</p>
      </div>
      <div class="feature-card">
        <h3>Client Dashboards</h3>
        <p>Manage past analyses & quotations.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// placeholder for future logic
</script>

<style scoped>
.features-page {
  padding: 2rem;
  background: #f5f9fc;
}
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  margin-top: 1rem;
}
.feature-card {
  background: #ffffff;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
  transition: transform 0.2s, box-shadow 0.2s;
}
.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>
