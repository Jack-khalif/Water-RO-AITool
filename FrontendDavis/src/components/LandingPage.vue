<template>
  <div class="landing-page">
    <section class="hero" id="home">
      <div class="hero-inner">
        <div class="hero-logo">
          <img :src="logo" alt="Davis & Shirtliff Logo" />
        </div>
        <div class="hero-text">
          <h1>The Best AI Tool for Water RO Design & Quotation</h1>
          <p>Create accurate RO proposals 100x faster.</p>
          <router-link to="/login" class="cta-button">Start Designing RO Systems</router-link>
        </div>
      </div>
    </section>
    <section class="features-preview" id="features">
      <Features />
    </section>
    <section class="footer-cta" id="contact">
      <a href="#contact" class="contact-link">Contact Us</a>
      <div class="contact-info">
        <h3>Contact Davis & Shirtliff</h3>
        <p>Phone: +254 20 823 8567</p>
        <p>Email: info@davischairtliff.com</p>
        <p>Address: 123 Water St, Nairobi, Kenya</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import Features from './Features.vue'
import logo from '../assets/logo.png'
</script>

<style scoped>
.landing-page {
  text-align: center;
  color: #213547;
}
.hero {
  padding: 4rem 2rem;
  background-color: #0066A1; /* Davis Blue only */
  color: #ffffff;
}
.hero-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto;
  flex-wrap: wrap;
}
.hero-logo img {
  max-width: 200px;
  margin-bottom: 1rem;
}
.hero-text {
  flex: 1 1 400px;
  text-align: left;
  margin-left: 2rem;
}
.hero h1 {
  color: #ffffff;
  font-size: 2.5rem;
  margin-bottom: 1rem;
}
.hero p {
  font-size: 1.25rem;
  margin-bottom: 2rem;
  color: rgba(255,255,255,0.9);
}
.cta-button {
  display: inline-block;
  margin: 0.25rem auto 0;
  background-color: #ffffff;
  color: #0066A1;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  text-decoration: none;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
.cta-button:hover {
  background-color: #f5f5f5;
}
.features-preview {
  margin: 2rem auto;
  max-width: 1200px;
}
.footer-cta {
  margin: 3rem 0;
}
.contact-link {
  color: #0066A1;
  text-decoration: none;
  font-weight: 600;
  border-bottom: 2px solid #0066A1;
}
.contact-link:hover {
  color: #004B7D;
}
.contact-info {
  margin-top: 1rem;
  text-align: center;
}
.contact-info h3 {
  margin-bottom: 0.5rem;
}
</style>
