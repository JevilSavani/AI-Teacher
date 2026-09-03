# 🎓 AI Teacher — Personalized AI Educator

> **Learn anything. With a teacher that adapts to you.**

AI Teacher is an intelligent, personalized learning platform that transforms
topics and educational materials into interactive lessons delivered by an AI Teacher.

Instead of simply generating answers, AI Teacher acts as a personal tutor —
planning lessons, explaining concepts, asking questions, identifying misconceptions,
adapting explanations, assessing understanding, and tracking learning progress.

---

## 🚀 Live Demo

### 🌐 Frontend

https://ai-teacher-nine-lime.vercel.app

### ⚙️ Backend API

https://ai-teacher-sfkr.onrender.com

### 🩺 Backend Health Check

https://ai-teacher-sfkr.onrender.com/api/health

### 💻 Source Code

https://github.com/JevilSavani/AI-Teacher

---

# ✨ Key Features

## 🧑‍🏫 Personalized AI Teaching

AI Teacher creates lessons based on the learner's profile and preferences.

The system considers:

- Education level
- Current knowledge level
- Learning objective
- Preferred teaching style
- Preferred language
- Available learning time
- Required learning depth

Personalization preferences are collected during onboarding and stored with
the student's profile.

---

# 📚 Learn From Your Own Materials

Students can upload educational material and learn directly from it.

### Supported formats

- PDF
- DOC
- DOCX
- PPT
- PPTX
- Course materials
- Research material
- Text-based educational content

Uploaded material is processed and converted into searchable knowledge that
can be used during lesson generation and follow-up teaching.

---

# 🧠 Retrieval-Augmented Generation (RAG)

AI Teacher uses Retrieval-Augmented Generation to ground AI explanations
in the student's uploaded learning material.

### RAG Pipeline

```text
Upload Material
      ↓
Document Processing
      ↓
Text Extraction
      ↓
Text Chunking
      ↓
Generate Embeddings
      ↓
PostgreSQL + pgvector
      ↓
Semantic Retrieval
      ↓
Relevant Context
      ↓
AI Teacher Response
