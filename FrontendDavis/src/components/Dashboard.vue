<template>
    <div class="dashboard-layout">
      <header class="header">
        <div class="nav-left">
          <router-link to="/dashboard" class="nav-link">Dashboard</router-link>
          
          <router-link to="/dashboard/upload-report" class="nav-link">Upload Report</router-link>
        </div>
        <div class="nav-right">
          <router-link to="/" class="logout-button">Logout</router-link>
        </div>
      </header>
  
      <main class="page-content">
        <router-view />
      </main>
    </div>
  </template>
  
  <style scoped>
  .dashboard-layout {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background-color: #F5F9FC;
  }
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #0066A1; /* Davis Blue */
    padding: 1rem 2rem;
    color: white;
  }
  
  .nav-left {
    display: flex;
    gap: 1rem;
  }
  
  .nav-link {
    color: white;
    text-decoration: none;
    font-weight: 500;
    padding: 0.5rem 1rem;
    transition: background-color 0.2s ease;
  }
  
  .nav-link:hover {
    background-color: #004B7D;
    border-radius: 4px;
  }
  
  .logout-button {
    background-color: #D71920; /* Shirtliff Red */
    padding: 0.5rem 1rem;
    border-radius: 4px;
    color: white;
    text-decoration: none;
    font-weight: 600;
    transition: background-color 0.2s ease;
  }
  
  .logout-button:hover {
    background-color: #b0161c;
  }
  
  .page-content {
    flex: 1;
    padding: 2rem;
  }
  </style>
  