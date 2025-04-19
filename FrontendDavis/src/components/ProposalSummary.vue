<template>
    <div class="summary-container">
      <h2>AI-Generated Proposal Summary</h2>
      <ul>
        <li><strong>Pretreatment:</strong> {{ proposal.pretreatment }}</li>
        <li><strong>RO Size:</strong> {{ proposal.roSize }}</li>
        <li><strong>Post Treatment:</strong> {{ proposal.postTreatment }}</li>
        <li><strong>Notes:</strong>
          <pre>{{ proposal.notes }}</pre>
        </li>
      </ul>
    </div>
  </template>
  
  <script setup lang="ts">
  defineProps<{
    proposal: {
      pretreatment: string
      roSize: string
      postTreatment: string
      notes: string
    }
  }>()
  </script>
  
  <style scoped>
  .summary-container {
    margin-top: 2rem;
    background-color: #ffffff;
    padding: 1.5rem;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  ul {
    margin-top: 1rem;
    list-style-type: none;
    padding: 0;
  }
  li {
    margin-bottom: 0.5rem;
  }
  pre {
    white-space: pre-wrap;
  }
  </style>
  