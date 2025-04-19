# 💧 Water RO AI Tool

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/status-active-brightgreen)]()
[![Built With](https://img.shields.io/badge/built_with-React-blue?logo=react)]()
[![Maintainer](https://img.shields.io/badge/maintainer-Jack--khalif-blue)](https://github.com/Jack-khalif)

A smart, user-friendly web interface designed to guide Davis & Shirtliff engineers and technicians through reverse osmosis (RO) system calculations and design logic.

---

---

## UI Screenshots

### 🏠 Landing Page

> Clean and minimal entry point to the app.

![Landing Page](https://github.com/Jack-khalif/Water-RO-AITool/blob/main/landing.png)

---

### 🚪 Login Page

> For returning users to securely log in.

![Login Page](https://github.com/Jack-khalif/Water-RO-AITool/blob/main/login.png)

---

### 📝 Sign Up Page

> New users can create an account to access the RO design tool.

![Sign Up Page](https://github.com/Jack-khalif/Water-RO-AITool/blob/main/signup.png)

---

### 📊 Dashboard

> Core interface for accessing tools, input parameters, and managing results.

![Dashboard](https://github.com/Jack-khalif/Water-RO-AITool/blob/main/dashboard.png)

---


---

## 🚀 Getting Started

```bash
# 1. Clone the repository
git clone https://github.com/Jack-khalif/Water-RO-AITool.git

# 2. Navigate to the project folder
cd Water-RO-AITool

# 3. Install dependencies
npm install

# 4. Start the development server
npm start


```markdown
# <img src="./logo.png" alt="Davis & Shirtliff Logo" width="200"/>

### Davis & Shirtliff Water RO AI Tool

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A powerful AI-powered tool built with **Vue 3 + Vite** on the frontend and **Node.js + LangChain** backend, designed for:

-  Uploading and analyzing **Water Lab Reports**
-  Automatically **sizing and designing RO Systems**
-  Generating detailed **PDF Proposals** for clients
-  OTP-secured **Email Authentication**

>  **Live demo coming soon!**

---

##  Quick Start

### 1. Clone the Repo & Install Dependencies

```bash
git clone https://github.com/Jack-khalif/Water-RO-AITool.git
cd Water-RO-AITool
npm install
```

---

### 2. Setup Environment Variables

Copy example env file and fill in your credentials:

```bash
cp .env.example .env.local
```

**Frontend (`.env.local`):**

```env
VITE_OPENAI_KEY=your_openai_key
VITE_API_BASE_URL=http://localhost:3000/api
```

**Backend (`backend/.env`):**

```env
OPENAI_API_KEY=your_openai_key
DATABASE_URL=postgresql://user:pass@host:port/db
SMTP_URL=smtp://user:pass@smtp.server:port
```

---

### 3. Run the App Locally

```bash
# Frontend
npm run dev
# Runs at http://localhost:5173

# Backend (in a new terminal)
cd backend
npm run dev
```

---

##  Features

###  Authentication

<img src="./Screenshot 2025-04-19 220253.png" width="500"/>

- Signup/Login with email & OTP
- Secure sessions and protected routes

---

###  Lab Report Upload

- Upload PDF/text/image reports
- LangChain-powered **RAG analysis**
- Pre-fills proposal data for RO design

---

###  RO System Design

- Auto-sizing based on input lab data
- Configurable for **Economy / Standard / Premium**
- Output includes pretreatment stages, system capacity, pricing

---

###  PDF Proposal Generation

- Professionally formatted downloadable PDFs
- Generated instantly from your RO design
- Great for client presentations

---



##  Project Structure

```
Water-RO-AITool/
├── frontend/
│   ├── src/
│   │   ├── components/       # UI components
│   │   └── main.ts
│   ├── .env.local            # VITE_ env vars
│   └── vite.config.ts
├── backend/
│   ├── src/                  # LangChain + Express backend
│   ├── .env                  # OPENAI, DATABASE, SMTP keys
│   └── package.json
├── public/
├── README.md
└── LICENSE
```

---

##  Dev Scripts

| Action | Frontend | Backend |
|--------|----------|---------|
| Start Dev | `npm run dev` | `cd backend && npm run dev` |
| Build | `npm run build` | `npm run start` |
| Preview Build | `npm run preview` | - |

---

##  Contributing

1. Fork this repo  
2. Create a feature branch: `git checkout -b feature/my-feature`  
3. Push and open a PR  
4. Ensure your code is linted and tested  

---

##  License

This project is licensed under the **MIT License**. See [`LICENSE`](./LICENSE) for details.

---

> Made with 💙 by Davis & Shirtliff AI Lab

```

---

