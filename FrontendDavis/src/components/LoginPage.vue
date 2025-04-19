<template>
    <div class="auth-container">
      <img :src="logo" alt="Davis & Shirtliff Logo" class="logo" />
      <h1>Davis & Shirtliff Portal</h1>
      <input v-model="email" placeholder="Email" />
      <input v-model="password" type="password" placeholder="Password" />
      <button @click="login">Login</button>
      <p>Don't have an account? <router-link to="/signup">Sign up</router-link></p>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue'
  import logo from '../assets/logo.png'
  import { useRouter } from 'vue-router'
  
  const email = ref('')
  const password = ref('')
  const router = useRouter()
  
  function login() {
    if (email.value && password.value) {
      router.push('/dashboard')
    } else {
      alert('Please enter your email and password.')
    }
  }
  </script>
  
  <style scoped>
  .auth-container {
    max-width: 400px;
    margin: 5rem auto;
    padding: 2rem;
    background-color: #F5F9FC;
    border-radius: 10px;
    text-align: center;
  }
  .logo {
    max-width: 150px;
    margin: 0 auto 1.5rem;
    display: block;
  }
  h1 {
    color: #0066A1;
  }
  input {
    display: block;
    margin: 1rem auto;
    padding: 0.8rem;
    width: 80%;
    border: 1px solid #ccc;
    border-radius: 6px;
  }
  button {
    background-color: #0066A1;
    color: white;
    padding: 0.7rem 1.5rem;
    border: none;
    border-radius: 6px;
    margin-top: 1rem;
  }
  button:hover {
    background-color: #2C7DA0;
  }
  .auth-container p {
    margin-top: 1rem;
  }
  .auth-container p a {
    color: #0066A1;
  }
  .auth-container p a:hover {
    text-decoration: underline;
  }
  </style>