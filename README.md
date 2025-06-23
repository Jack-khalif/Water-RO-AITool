
#  Water RO AI Tool

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/status-active-brightgreen)]()
[![Built With](https://img.shields.io/badge/built_with-Vue3-blue?logo=vue.js)]()
[![Maintainer](https://img.shields.io/badge/maintainer-Jack--khalif-blue)](https://github.com/Jack-khalif)

An AI-powered platform that automates **reverse osmosis (RO)** system sizing, proposal generation, and water lab report analysis — built for **Davis & Shirtliff** engineers and technicians.

---

## 🎥 Demo Video

> Watch the full walk-through of the AI-powered RO design platform:

[![Watch on YouTube](https://img.youtube.com/vi/fti0qnG6p7A/maxresdefault.jpg)](https://youtu.be/fti0qnG6p7A)

🔗 [Click here to view the demo on YouTube](https://youtu.be/fti0qnG6p7A)

---

## ⚡ Key Features

- 🔐 OTP-based email authentication
- 📄 Upload water lab reports (PDF/text/image)
- ⚙️ Auto-generate RO design with tier options (Economy, Standard, Premium)
- 🧠 LangChain + OpenAI-powered analysis and proposal writing
- 🧾 One-click professional PDF generation for client quotes
- 📊 Dashboard interface for managing sessions and output

---

## 🖥️ UI Walkthrough

> A quick preview of the sleek, production-ready interface.

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
SMTP_HOST=your_smtp_host
SMTP_PORT=your_port
EMAIL_USER=your_email
EMAIL_PASS=your_password
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

* Modern **Composition API** for modular and scalable UI
* Built with **TailwindCSS** for rapid responsive design
* OTP-based **email auth** integration

#### 🧠 Backend — *Node.js + Express*

* API routes for user auth, uploads, LangChain logic
* Handles OpenAI prompts and returns AI responses
* Supports email validation and secured sessions

#### 📚 LangChain — *RAG AI Workflow*

* Parses and chunks uploaded reports (PDFs or images)
* Uses **Retrieval-Augmented Generation** (RAG)
* Generates contextual prompts based on extracted text

#### 🧠 FAISS — *Semantic Search*

* Stores embedded chunks from uploaded reports
* Enables **fast, relevant context retrieval** for prompts
* Boosts performance and reliability of GPT responses

#### 💬 OpenAI — *LLM-Powered Proposal Generator*

* GPT-4/GPT-3.5 used to:

  * Extract design parameters from lab results
  * Write full proposal content
  * Explain treatment logic (TDS, hardness, etc.)

#### 📄 PDF Proposal Generator

* Populates professional PDF templates using AI-generated content
* Supports branding and pricing logic per RO tier
* Downloadable instantly by end-user

---

## 🧪 Core Workflow

1. **Upload Water Report** (PDF/Image/Text)
2. **Extract Content** → Indexed with FAISS
3. **User Selects Tier** → Economy / Standard / Premium
4. **AI Generates Full RO Design** with pricing
5. **Proposal Created** → Instant PDF download

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

## 🛠 Dev Scripts

| Task           | Command                     |
| -------------- | --------------------------- |
| Start Frontend | `npm run dev`               |
| Start Backend  | `cd backend && npm run dev` |
| Build Frontend | `npm run build`             |
| Preview Build  | `npm run preview`           |

---

## 🤝 Contributing

1. Fork this repository
2. Create your feature branch: `git checkout -b feature/your-feature`
3. Commit your changes
4. Push and open a Pull Request
5. Follow formatting and testing conventions

---

## 📜 License

This project is licensed under the **MIT License**.
See [`LICENSE`](./LICENSE) for full details.

---

> *Developed with 💙 to empower water engineers with smarter, faster tools.*

```
