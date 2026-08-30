# AI Teacher - Intelligent Multimodal Learning Platform

[![Repository](https://img.shields.io/badge/GitHub-AI--Teacher-indigo.svg)](https://github.com/JevilSavani/AI-Teacher.git)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18%2B-blue.svg)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%2B%20pgvector-336791.svg)](https://github.com/pgvector/pgvector)

An AI-powered, multimodal, adaptive tutoring platform designed for interactive education. Features Socratic teaching, PDF/Document ingestion via RAG, pgvector semantic search, dynamic diagnostic questions, speech synthesis, and AI avatar video instruction.

---

## 🛠️ Tech Stack

* **Frontend:** React.js, Vite, Vanilla CSS Design System, Lucide Icons
* **Backend:** Node.js, Express.js
* **Database:** PostgreSQL with `pgvector` extension
* **Authentication:** JWT (JSON Web Tokens)
* **Architecture Pattern:** Decoupled 3-Tier Layered Design (Routes → Controllers → Domain Services → DB/AI Engines)

---

## 📁 Project Structure

```text
ai-teacher/
│
├── frontend/
│   ├── src/
│   │   ├── components/         # Reusable UI components (HealthCard, Navbar, etc.)
│   │   ├── pages/              # View pages (HomePage, etc.)
│   │   ├── layouts/            # Layout wrappers (MainLayout)
│   │   ├── hooks/              # Custom React hooks (useApiHealth)
│   │   ├── services/           # Frontend API clients (healthService, api)
│   │   ├── context/            # Global React Context providers
│   │   ├── utils/              # Frontend constants and helpers
│   │   ├── assets/             # Static assets and icons
│   │   ├── App.jsx             # Root React component
│   │   ├── main.jsx            # React DOM mounting
│   │   └── index.css           # Global CSS variables & modern design system
│   ├── public/                 # Public static assets & favicon
│   ├── .env.example            # Frontend environment variable template
│   ├── package.json            # Frontend package configuration
│   └── vite.config.js          # Vite config & API reverse proxy
│
├── backend/
│   ├── src/
│   │   ├── config/             # DB pool, ENV parser, CORS settings
│   │   ├── controllers/        # HTTP controllers (Health, Auth, Lesson, Document)
│   │   ├── routes/             # REST route declarations & routers
│   │   ├── middleware/         # Error handler, 404, JWT auth, request logger
│   │   ├── services/           # 15 decoupled domain & AI services:
│   │   │   ├── auth/           # Authentication service
│   │   │   ├── student/        # Student profile service
│   │   │   ├── document/       # PDF parsing & text chunking
│   │   │   ├── rag/            # Vector embeddings & context retrieval
│   │   │   ├── lesson/         # Lesson planning & curriculum
│   │   │   ├── ai/             # Teaching engine, question gen, evaluator, adaptive
│   │   │   ├── assessment/     # Test creation & submission
│   │   │   ├── progress/       # Mastery tracking & weak concepts
│   │   │   ├── learningPath/   # Personalized syllabus navigation
│   │   │   ├── multilingual/   # Real-time localization & translation
│   │   │   ├── voice/          # Text-to-speech engine (ElevenLabs/Azure)
│   │   │   └── video/          # AI Avatar & video generator (D-ID/HeyGen)
│   │   ├── models/             # Data access layer
│   │   ├── utils/              # Logger & standardized ApiResponse helpers
│   │   ├── validators/         # Input validation helpers
│   │   ├── app.js              # Express application configuration
│   │   └── server.js           # Server bootstrap & DB connection test
│   ├── uploads/                # Directory for user-uploaded documents
│   ├── .env.example            # Backend environment variable template
│   └── package.json            # Backend dependencies
│
├── database/
│   ├── migrations/             # Database migration scripts
│   ├── seeds/                  # Initial seed data
│   └── schema.sql              # PostgreSQL schema with pgvector HNSW index
│
├── docs/
│   ├── architecture.md         # System design & layer specifications
│   └── api.md                  # REST API contract & endpoint documentation
│
├── .gitignore
├── README.md
└── package.json                # Root package manager & workspace scripts
```

---

## ⚙️ Environment Configuration

### Backend (`backend/.env`)
Copy `backend/.env.example` to `backend/.env` and configure:
```env
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173

# Database (PostgreSQL + pgvector)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_teacher
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=ai_teacher

# Authentication
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# AI & RAG (OpenAI / Gemini / Anthropic)
OPENAI_API_KEY=your_openai_api_key
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSION=1536

# Voice & Video (TTS & Avatars)
ELEVENLABS_API_KEY=your_elevenlabs_key
DID_API_KEY=your_did_key
```

### Frontend (`frontend/.env`)
Copy `frontend/.env.example` to `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 🚀 Running Locally

### 1. Install Dependencies
```bash
# Install all dependencies (root, backend, and frontend)
npm run install:all
```

### 2. Run in Development Mode
```bash
# Option A: Run backend and frontend concurrently
npm run dev

# Option B: Run in separate terminals
npm run dev:backend   # Starts Express on http://localhost:5000
npm run dev:frontend  # Starts Vite on http://localhost:5173
```

### 3. Verify Health
Open your browser and navigate to:
* **Frontend App:** [http://localhost:5173](http://localhost:5173)
* **Backend Health API:** [http://localhost:5000/api/health](http://localhost:5000/api/health)
* **Database Health API:** [http://localhost:5000/api/health/db](http://localhost:5000/api/health/db)

---

## 🗄️ Database Setup

To initialize the PostgreSQL database schema with `pgvector`:
```bash
# Using psql
psql -U postgres -d ai_teacher -f database/schema.sql
```

---

## 🧭 Next Implementation Steps

1. **Authentication:** Implement JWT register, login, and profile retrieval in `services/auth` & `controllers/auth.controller.js`.
2. **Document Processing & RAG:** Ingest PDF documents, extract text, generate vector embeddings, and store in `document_chunks` table with pgvector indexing.
3. **AI Teaching Engine:** Implement Socratic dialogue and concept breakdown in `services/ai/teachingEngine.js`.
4. **Assessment & Question Generator:** Create dynamic quizzes and automated evaluation in `services/ai/questionGenerator.js` and `services/assessment`.
5. **Multimodal Enhancements:** Add ElevenLabs TTS voice streaming and D-ID talking avatar video integration.
