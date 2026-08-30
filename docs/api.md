# AI Teacher - REST API Documentation

Base URL: `http://localhost:5000/api`

---

## 1. System & Health Endpoints

### 1.1 General Health Check
* **Endpoint:** `GET /health`
* **Description:** Returns server uptime, memory usage, environment, and modular services readiness list.
* **Response:** `200 OK`
```json
{
  "success": true,
  "message": "AI Teacher API is operational and healthy",
  "data": {
    "status": "UP",
    "service": "ai-teacher-backend",
    "environment": "development",
    "uptime": "120 seconds",
    "timestamp": "2026-08-30T06:00:00.000Z",
    "memory": {
      "rssMb": 42,
      "heapUsedMb": 24,
      "heapTotalMb": 38
    },
    "readyModules": [
      "health",
      "auth",
      "student_profile",
      "document_processing",
      "rag",
      "lesson_planning",
      "ai_teaching_engine",
      "question_generation",
      "answer_evaluation",
      "adaptive_teaching",
      "assessment",
      "learning_progress",
      "learning_path",
      "multilingual_teaching",
      "text_to_speech",
      "ai_avatar_video"
    ]
  },
  "meta": {
    "timestamp": "2026-08-30T06:00:00.000Z"
  }
}
```

### 1.2 Database Connectivity Check
* **Endpoint:** `GET /health/db`
* **Description:** Verifies active PostgreSQL connection and tests for pgvector extension availability.
* **Response (Connected):** `200 OK`
```json
{
  "success": true,
  "message": "Database connection verified successfully",
  "data": {
    "database": "PostgreSQL",
    "connected": true,
    "version": "PostgreSQL 16.2...",
    "pgvectorAvailable": true,
    "databaseName": "ai_teacher",
    "host": "localhost"
  }
}
```

---

## 2. Planned REST Endpoints (Architectural Reference)

| Category | Method | Route | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/auth/register` | Register new student or teacher account |
| **Auth** | `POST` | `/auth/login` | Authenticate and obtain JWT bearer token |
| **Auth** | `GET` | `/auth/profile` | Retrieve profile of authenticated user |
| **Documents** | `POST` | `/documents/upload` | Ingest textbook/notes PDF for chunking & RAG |
| **Documents** | `GET` | `/documents` | List uploaded learning materials |
| **Lessons** | `GET` | `/lessons` | Fetch lessons list |
| **Lessons** | `GET` | `/lessons/:id` | Fetch specific lesson structure & concepts |
| **Lessons** | `POST` | `/lessons` | Generate new AI lesson curriculum |
| **AI Teaching** | `POST` | `/ai/explain` | Socratic explanation stream for concept |
| **AI Teaching** | `POST` | `/ai/interact` | Conversational query response |
| **Assessments**| `POST` | `/assessments/generate` | Generate targeted diagnostic quiz |
| **Assessments**| `POST` | `/assessments/submit` | Submit answers and receive AI evaluation |
| **Progress** | `GET` | `/progress/summary` | Student learning curve & weak concepts |
| **Voice** | `POST` | `/voice/synthesize` | TTS audio generation stream |
| **Video** | `POST` | `/video/generate` | Talking avatar generation job |
