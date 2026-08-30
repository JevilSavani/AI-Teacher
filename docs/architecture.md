# AI Teacher - System Architecture Document

## 1. System Overview

The **AI Teacher** application is an intelligent, multimodal, adaptive tutoring platform. It combines Retrieval-Augmented Generation (RAG), Large Language Models (LLMs), Voice Synthesis (TTS), and Talking AI Avatars to deliver hyper-personalized educational experiences.

---

## 2. Multi-Tiered Architecture Pattern

The system follows a strict layered, decoupled design pattern:

```text
[ React.js + Vite Frontend ]
              │  HTTP / REST API (JSON)
              ▼
    [ Express API Routes ]  (Validation & Route Mounting)
              │
              ▼
      [ Controllers ]       (HTTP Req/Res Parsing & Orchestration)
              │
              ▼
   [ Core Domain Services ] (Business Logic & Algorithmic Workflows)
       │            │             │              │
       ▼            ▼             ▼              ▼
[ AI / RAG ]   [ Auth/User ]  [ TTS / Video ]  [ PostgreSQL + pgvector ]
```

### Architectural Principles:
1. **Separation of Concerns**: Controllers never execute database queries or LLM calls directly. All domain logic resides in dedicated services.
2. **Modular AI Engine**: AI components (question generator, answer evaluator, teaching engine, adaptive logic) are pluggable and isolated.
3. **Pluggable Vector Storage**: Vector storage leverages PostgreSQL + pgvector with HNSW indexing for cosine similarity retrieval.
4. **Multimodal Ready**: Dedicated voice (TTS) and video (Avatar/LipSync) services integrate seamlessly with the pedagogical engine.

---

## 3. Core Service Directory Blueprint

| Service Module | Purpose & Scope |
| :--- | :--- |
| **`services/auth`** | User authentication, JWT issuance, token verification, password security |
| **`services/student`** | Student profile management, learning preferences, pace calibration |
| **`services/document`** | PDF / text document parsing, chunking, and pre-processing |
| **`services/rag`** | Text embedding generation, pgvector indexing, and semantic retrieval |
| **`services/lesson`** | Lesson plan generation, topic decomposition, and curriculum structuring |
| **`services/ai/teachingEngine`** | Socratic teaching dialog, conversational explanation engine |
| **`services/ai/questionGenerator`** | Dynamic MCQ, short answer, and diagnostic test question generation |
| **`services/ai/answerEvaluator`** | Student answer grading, conceptual analysis, misconception diagnosis |
| **`services/ai/adaptiveTeaching`** | Real-time pacing and difficulty adjustment based on student performance |
| **`services/assessment`** | Formal exam creation, submission, score computation, and reporting |
| **`services/progress`** | Student mastery tracking, concept error frequency, and weak concept registry |
| **`services/learningPath`** | Personalized roadmap generation and prerequisite progression |
| **`services/multilingual`** | Real-time lesson content localization and multilingual tutoring |
| **`services/voice`** | Text-to-speech audio synthesis (ElevenLabs, Azure Speech, Web Speech) |
| **`services/video`** | AI avatar video generation (D-ID, HeyGen) |

---

## 4. End-to-End Learning Workflow (Future Integration)

```text
1. Ingestion:
   Teacher/Student uploads PDF -> DocumentService chunks text -> RagService generates embeddings -> Stored in pgvector

2. Lesson Delivery:
   Student initiates topic -> LessonPlanningService creates structure -> AI Teaching Engine generates dialogue
   -> VoiceService produces audio stream -> VideoService renders talking avatar -> Frontend plays stream

3. Interactive Assessment & Adaptation:
   QuestionGenerator prompts student -> Student answers -> AnswerEvaluator grades response
   -> ProgressService updates mastery -> AdaptiveTeachingService adjusts next explanation complexity
```
