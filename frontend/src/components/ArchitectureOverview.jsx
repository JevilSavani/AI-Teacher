import React from 'react';
import {
  ShieldCheck,
  UserCheck,
  FileText,
  Database,
  BookOpen,
  Brain,
  HelpCircle,
  CheckSquare,
  Sliders,
  Award,
  TrendingUp,
  Compass,
  Languages,
  Mic,
  Video
} from 'lucide-react';

const MODULES = [
  { name: '1. Authentication', path: 'services/auth', icon: ShieldCheck, desc: 'JWT token lifecycle & passwords' },
  { name: '2. Student Profile', path: 'services/student', icon: UserCheck, desc: 'Grade, preferences & learning style' },
  { name: '3. Document Upload & Processing', path: 'services/document', icon: FileText, desc: 'PDF extraction, chunking & parsing' },
  { name: '4. RAG & Vector Engine', path: 'services/rag', icon: Database, desc: 'pgvector embeddings & context retrieval' },
  { name: '5. Lesson Planning', path: 'services/lesson', icon: BookOpen, desc: 'Structured curricula & concepts' },
  { name: '6. AI Teaching Engine', path: 'services/ai/teachingEngine', icon: Brain, desc: 'Socratic dialogue & explanations' },
  { name: '7. Question Generation', path: 'services/ai/questionGenerator', icon: HelpCircle, desc: 'MCQs, diagnostics & short tests' },
  { name: '8. Answer Evaluation', path: 'services/ai/answerEvaluator', icon: CheckSquare, desc: 'Scoring & misconception analysis' },
  { name: '9. Adaptive Teaching', path: 'services/ai/adaptiveTeaching', icon: Sliders, desc: 'Pacing calibration & remediation' },
  { name: '10. Assessment', path: 'services/assessment', icon: Award, desc: 'Formal exams & test submission' },
  { name: '11. Learning Progress', path: 'services/progress', icon: TrendingUp, desc: 'Mastery tracking & weak concepts' },
  { name: '12. Learning Path', path: 'services/learningPath', icon: Compass, desc: 'Personalized syllabus roadmaps' },
  { name: '13. Multilingual Teaching', path: 'services/multilingual', icon: Languages, desc: 'Real-time localization & translation' },
  { name: '14. Text-to-Speech (TTS)', path: 'services/voice', icon: Mic, desc: 'ElevenLabs & Speech synthesis' },
  { name: '15. AI Avatar & Video', path: 'services/video', icon: Video, desc: 'Talking avatar & LipSync pipelines' }
];

export default function ArchitectureOverview() {
  return (
    <div style={{ marginTop: '2.5rem' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.35rem' }}>
          Modular Architecture & Prepared Services
        </h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Each module is cleanly isolated in the backend services layer, ready for progressive implementation.
        </p>
      </div>

      <div className="grid-3">
        {MODULES.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="card" style={{ padding: '1.1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
                <div style={{
                  padding: '0.45rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(99, 102, 241, 0.1)',
                  color: 'var(--primary-light)'
                }}>
                  <Icon size={18} />
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  {item.name}
                </div>
              </div>

              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.65rem', minHeight: '36px' }}>
                {item.desc}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                <span className="code-pill" style={{ fontSize: '0.7rem' }}>backend/src/{item.path}</span>
                <span className="badge badge-primary" style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem' }}>Ready</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
