<template>
  <header class="global-header">
    <nav>
      <a href="#home">Home</a>
      <a href="#features">Features</a>
      <a href="#contact">Contact</a>
      
    </nav>
  </header>
</template>

<script setup lang="ts">
// Global navigation header
</script>

<style scoped>
.global-header {
  background-color: #0066A1;
  padding: 1rem 2rem;
}
.global-header nav {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}
.global-header a {
  color: #ffffff;
  text-decoration: none;
  font-weight: 500;
}
.global-header nav a:hover {
  animation: bounce 0.5s both;
  color: #f0f0f0;
}
.sign-up-button {
  margin-left: auto;
  color: #ffffff;
  text-decoration: none;
  font-weight: 500;
  border: 1px solid #ffffff;
  padding: 0.5rem 1rem;
  border-radius: 4px;
}
.sign-up-button:hover {
  background-color: rgba(255,255,255,0.1);
}
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}
</style>
