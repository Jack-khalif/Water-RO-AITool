#  Water RO AI Tool

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/status-active-brightgreen)]()
[![Built With](https://img.shields.io/badge/built_with-Vue3-blue?logo=vue.js)]()
[![Maintainer](https://img.shields.io/badge/maintainer-Jack--khalif-blue)](https://github.com/Jack-khalif)

A smart, AI-powered platform that automates **Reverse Osmosis (RO)** system sizing, proposal generation, and water lab report analysis — built for **Davis & Shirtliff** engineers and technicians.

---

## ⚡ Key Features

- 🔐 Email OTP-secured login & sign-up
- 🧠 Upload water reports (PDF/text/image) for automatic analysis
- ⚙️ Auto-generate RO design configurations (Economy / Standard / Premium)
- 📄 Generate branded, client-ready PDF proposals in one click
- 🗂️ Secure session and clean modern UI

> 🎥 **Live demo video coming soon!**

---

## 🖥️ UI Walkthrough

<div align="center">

<table>
  <tr>
    <td align="center">
      <strong>Landing Page</strong><br>
      <img src="https://github.com/Jack-khalif/Water-RO-AITool/blob/main/landing%20page.png" width="400"/>
    </td>
    <td align="center">
      <strong>Login Page</strong><br>
      <img src="https://github.com/Jack-khalif/Water-RO-AITool/blob/main/officallogin.png" width="400"/>
    </td>
  </tr>
  <tr>
    <td align="center">
      <strong>Sign Up Page</strong><br>
      <img src="https://github.com/Jack-khalif/Water-RO-AITool/blob/main/sign%20up%20page.png" width="400"/>
    </td>
    <td align="center">
      <strong>Dashboard</strong><br>
      <img src="https://github.com/Jack-khalif/Water-RO-AITool/blob/main/dashboard.png" width="400"/>
    </td>
  </tr>
</table>

</div>

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Jack-khalif/Water-RO-AITool.git
cd Water-RO-AITool
````

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

```bash
cp .env.example .env.local
```

#### Frontend (`.env.local`):

```env
VITE_OPENAI_KEY=your_openai_key
VITE_API_BASE_URL=http://localhost:3000/api
```

#### Backend (`.env`):

```env
OPENAI_API_KEY=your_key
DATABASE_URL=your_mongo_url
SMTP_HOST=mail.example.com
```

### 4. Run the App Locally

```bash
# Frontend
npm run dev      # http://localhost:5173

# Backend
cd backend
npm install
npm run dev
```

---

## 🧠 Technical Overview & Methodology

### ⚙️ Architecture Overview

```
User Interface (Vue 3 + Vite)
        ↓
REST API (Node.js + Express)
        ↓
LangChain Agents (PDF Parsing + RAG)
        ↓
Vector Store (FAISS)
        ↓
OpenAI LLMs (GPT-4 / GPT-3.5)
        ↓
Output: RO System Design + PDF Proposal
```

---

### 🧩 Technologies Explained

#### 🔧 Frontend — *Vue 3 + Vite*

* Modern **Composition API** with clean modular components
* Fast, lightweight, and reactive
* **TailwindCSS** for responsive design
* OTP-based email auth UI

#### 🧠 Backend — *Node.js + Express*

* **REST API** for file handling, auth, and AI logic
* Secure middleware for OTP, session management
* Supports JSON and file payloads (PDF/image)

#### 🔍 LangChain — *AI Pipeline Framework*

* Used for **RAG (Retrieval-Augmented Generation)**
* Parses, chunks, and prompts lab reports
* Extracts TDS, hardness, flowrate, and more

#### 🧠 FAISS — *Semantic Search Engine*

* Indexes PDF data as vector embeddings
* Enables fast, accurate context retrieval
* Provides relevant chunks to LLM during prompt time

#### 🧠 OpenAI — *GPT-4/3.5-Powered RO Reasoning*

* Processes retrieved chunks and prompt instructions
* Translates lab values into:

  * Component recommendations
  * Pricing tiers
  * Design notes and justifications

#### 📄 PDF Proposal Generator

* Dynamic proposal formatting from final design data
* Supports **branding and formatting logic**
* Instant client-ready PDF download

---

## 🧪 Core Workflow

1. **User Uploads Water Report**

   * Accepted: PDF, image, or raw text

2. **LangChain Loads and Chunks Content**

   * Automatically extracts and indexes with FAISS

3. **User Chooses Design Type**

   * Economy | Standard | Premium

4. **OpenAI Generates Design Details**

   * Returns final parameters, pricing, recommendations

5. **System Generates PDF Proposal**

   * One-click download available

---

## 📁 Project Structure

```
Water-RO-AITool/
├── frontend/                # Vue 3 + Vite UI
│   ├── components/
│   ├── pages/
│   └── main.ts
├── backend/                 # Node.js + LangChain logic
│   ├── src/
│   └── .env
├── public/
├── README.md
└── LICENSE
```

---

## 🔧 Dev Scripts

| Task           | Command                     |
| -------------- | --------------------------- |
| Start Frontend | `npm run dev`               |
| Start Backend  | `cd backend && npm run dev` |
| Build Frontend | `npm run build`             |
| Preview Build  | `npm run preview`           |

---

## 🤝 Contributing

1. Fork this repository
2. Create your feature branch: `git checkout -b feature/awesome-feature`
3. Commit your changes
4. Push and open a Pull Request
5. Follow formatting and testing standards

---

## 📜 License

This project is licensed under the **MIT License**.
See the [`LICENSE`](./LICENSE) file for more information.

---

> *Developed with 💙 to empower water engineers with smarter, faster tools.*


