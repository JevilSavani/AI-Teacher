# 🎓 AI Teacher — Human-Like Personalized AI Educator

> **Learn anything. With a teacher that adapts to you.**

AI Teacher is an intelligent, personalized learning platform that transforms educational materials and topics into interactive lessons delivered by an AI Teacher.

Instead of simply generating answers, AI Teacher acts like a personal tutor — planning lessons, explaining concepts, asking questions, identifying misconceptions, adapting explanations, assessing understanding, and tracking long-term learning progress.

---

## 🚀 Live Demo

**Frontend:**  
https://ai-teacher-nine-lime.vercel.app

**Backend API:**  
https://ai-teacher-sfkr.onrender.com

**Health Check:**  
https://ai-teacher-sfkr.onrender.com/api/health

---

## ✨ Key Features

### 🧑‍🏫 Personalized AI Teaching

AI Teacher adapts lessons according to:

- Education level
- Current knowledge
- Learning objective
- Preferred teaching style
- Preferred language
- Available learning time
- Required depth

---

### 📚 Learn From Your Materials

Upload educational content and learn directly from it.

Supported formats include:

- PDF
- DOC
- DOCX
- PPT
- PPTX
- Text-based learning materials
- Research/course material

The system extracts, processes and indexes the content so the AI can teach from the user's material.

---

### 🧠 RAG-Based Knowledge Grounding

AI Teacher uses Retrieval-Augmented Generation (RAG) to ground explanations in uploaded learning material.

Pipeline:

```text
Upload Material
      ↓
Document Processing
      ↓
Text Extraction
      ↓
Chunking
      ↓
Embeddings
      ↓
PostgreSQL + pgvector
      ↓
Semantic Retrieval
      ↓
Relevant Context
      ↓
AI Teacher
