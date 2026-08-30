-- =========================================
-- AI TEACHER DATABASE
-- PostgreSQL + pgvector
-- =========================================

CREATE EXTENSION IF NOT EXISTS vector;

-- =========================================
-- USERS
-- =========================================

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- STUDENT PROFILES
-- =========================================

CREATE TABLE student_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    education_level VARCHAR(50),
    knowledge_level VARCHAR(50),
    preferred_language VARCHAR(50) DEFAULT 'English',
    learning_goal TEXT,
    teaching_style VARCHAR(50),
    available_time_minutes INTEGER,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- LEARNING MATERIALS
-- =========================================

CREATE TABLE learning_materials (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    title VARCHAR(255) NOT NULL,
    file_name VARCHAR(255),
    file_type VARCHAR(50),
    file_url TEXT,

    processing_status VARCHAR(30) DEFAULT 'pending',
    extracted_text TEXT,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- DOCUMENT CHUNKS / RAG
-- =========================================

CREATE TABLE document_chunks (
    id BIGSERIAL PRIMARY KEY,
    material_id BIGINT NOT NULL
        REFERENCES learning_materials(id)
        ON DELETE CASCADE,

    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,

    embedding VECTOR(1536),

    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- LESSONS
-- =========================================

CREATE TABLE lessons (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    material_id BIGINT
        REFERENCES learning_materials(id)
        ON DELETE SET NULL,

    topic VARCHAR(255) NOT NULL,
    level VARCHAR(50),
    language VARCHAR(50),
    duration_minutes INTEGER,

    learning_goal TEXT,

    status VARCHAR(30) DEFAULT 'created',

    lesson_plan JSONB,
    teaching_state JSONB,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- LESSON CONCEPTS
-- =========================================

CREATE TABLE lesson_concepts (
    id BIGSERIAL PRIMARY KEY,
    lesson_id BIGINT NOT NULL
        REFERENCES lessons(id)
        ON DELETE CASCADE,

    concept_order INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,

    difficulty VARCHAR(30),
    status VARCHAR(30) DEFAULT 'pending',

    understanding_score NUMERIC(5,2),

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- QUESTIONS
-- =========================================

CREATE TABLE questions (
    id BIGSERIAL PRIMARY KEY,

    lesson_id BIGINT NOT NULL
        REFERENCES lessons(id)
        ON DELETE CASCADE,

    concept_id BIGINT
        REFERENCES lesson_concepts(id)
        ON DELETE SET NULL,

    question_text TEXT NOT NULL,

    question_type VARCHAR(50),
    difficulty VARCHAR(30),

    options JSONB,
    correct_answer TEXT,

    explanation TEXT,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- STUDENT ANSWERS
-- =========================================

CREATE TABLE student_answers (
    id BIGSERIAL PRIMARY KEY,

    question_id BIGINT NOT NULL
        REFERENCES questions(id)
        ON DELETE CASCADE,

    user_id BIGINT NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    answer TEXT,

    is_correct BOOLEAN,
    score NUMERIC(5,2),

    ai_feedback TEXT,
    detected_misconception TEXT,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- ASSESSMENTS
-- =========================================

CREATE TABLE assessments (
    id BIGSERIAL PRIMARY KEY,

    lesson_id BIGINT NOT NULL
        REFERENCES lessons(id)
        ON DELETE CASCADE,

    user_id BIGINT NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    score NUMERIC(5,2),
    total_questions INTEGER,
    correct_answers INTEGER,

    feedback TEXT,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- LEARNING PROGRESS
-- =========================================

CREATE TABLE learning_progress (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    concept_name VARCHAR(255) NOT NULL,

    mastery_score NUMERIC(5,2) DEFAULT 0,

    status VARCHAR(30) DEFAULT 'learning',

    last_assessed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, concept_name)
);

-- =========================================
-- WEAK CONCEPTS
-- =========================================

CREATE TABLE weak_concepts (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    concept_name VARCHAR(255) NOT NULL,

    severity VARCHAR(30) DEFAULT 'medium',

    reason TEXT,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, concept_name)
);

-- =========================================
-- LEARNING PATHS
-- =========================================

CREATE TABLE learning_paths (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    title VARCHAR(255) NOT NULL,
    description TEXT,

    topics JSONB NOT NULL DEFAULT '[]',

    current_topic_index INTEGER DEFAULT 0,

    status VARCHAR(30) DEFAULT 'active',

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- INDEXES
-- =========================================

CREATE INDEX idx_student_profiles_user
ON student_profiles(user_id);

CREATE INDEX idx_materials_user
ON learning_materials(user_id);

CREATE INDEX idx_chunks_material
ON document_chunks(material_id);

CREATE INDEX idx_lessons_user
ON lessons(user_id);

CREATE INDEX idx_concepts_lesson
ON lesson_concepts(lesson_id);

CREATE INDEX idx_questions_lesson
ON questions(lesson_id);

CREATE INDEX idx_answers_user
ON student_answers(user_id);

CREATE INDEX idx_progress_user
ON learning_progress(user_id);

CREATE INDEX idx_weak_concepts_user
ON weak_concepts(user_id);

CREATE INDEX idx_learning_paths_user
ON learning_paths(user_id);

-- =========================================
-- VECTOR INDEX
-- =========================================

CREATE INDEX document_chunks_embedding_idx
ON document_chunks
USING hnsw (embedding vector_cosine_ops);