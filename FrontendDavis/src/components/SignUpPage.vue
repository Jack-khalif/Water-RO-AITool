<template>
    <div class="auth-container">
      <img :src="logo" alt="Davis & Shirtliff Logo" class="signup-logo" />
      <h1>Create an Account</h1>
      <input v-model="name" placeholder="Full Name" />
      <input v-model="email" placeholder="Email" />
      <input v-model="password" type="password" placeholder="Password" />
      <button @click="signup">Sign Up</button>
      <p>Already have an account? <router-link to="/">Login</router-link></p>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import logo from '../assets/logo.png'
  
  const name = ref('')
  const email = ref('')
  const password = ref('')
  const router = useRouter()
  
  function signup() {
    if (name.value && email.value && password.value) {
      alert('Account created successfully!')
      router.push('/dashboard')
    } else {
      alert('Please fill in all fields.')
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
  p {
    margin-top: 1rem;
  }
  .signup-logo {
    max-width: 150px;
    display: block;
    margin: 0 auto 1rem;
  }
  </style>