import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowRight, 
  BookOpen, 
  Volume2, 
  Brain, 
  Target, 
  Globe, 
  Clock, 
  CheckCircle2, 
  BarChart3, 
  Layers, 
  Play, 
  GraduationCap,
  FileText,
  Zap,
  ShieldCheck,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

export default function HomePage() {
  return (
    <div style={{ color: 'var(--text-primary)', overflowX: 'hidden' }}>
      
      {/* 1. HERO SECTION */}
      <section style={{ padding: '4rem 0 5rem', position: 'relative' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '3.5rem', alignItems: 'center' }}>
          
          {/* Hero Left Content */}
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 0.9rem',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--primary-light)',
              marginBottom: '1.5rem'
            }}>
              <Sparkles size={15} />
              <span>Next-Generation Adaptive AI Education</span>
            </div>

            <h1 style={{
              fontSize: '3.25rem',
              fontWeight: 800,
              letterSpacing: '-0.035em',
              lineHeight: 1.15,
              marginBottom: '1.25rem'
            }}>
              Learn Anything. With a Teacher That <span className="brand-text-gradient">Adapts to You.</span>
            </h1>

            <p style={{
              fontSize: '1.15rem',
              color: 'var(--text-secondary)',
              lineHeight: '1.65',
              marginBottom: '2rem',
              maxWidth: '560px'
            }}>
              AI Teacher turns study materials, textbooks, and complex topics into interactive visual lessons, spoken explanations, adaptive questions, and real-time feedback tailored to your exact pace.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <Link 
                to="/register" 
                className="btn-primary" 
                style={{ padding: '0.85rem 1.8rem', fontSize: '1rem', borderRadius: 'var(--radius-sm)' }}
              >
                Start Learning Free
                <ArrowRight size={18} />
              </Link>

              <a 
                href="#how-it-works" 
                className="btn-secondary" 
                style={{ padding: '0.85rem 1.6rem', fontSize: '1rem', borderRadius: 'var(--radius-sm)' }}
              >
                See How It Works
              </a>
            </div>

            {/* Trust badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShieldCheck size={16} color="var(--accent-emerald)" />
                <span>No Credit Card Required</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={16} color="var(--accent-cyan)" />
                <span>50+ Languages</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Zap size={16} color="var(--primary-light)" />
                <span>Instant Ingestion</span>
              </div>
            </div>
          </div>

          {/* Hero Right Visual Showcase */}
          <div style={{ position: 'relative' }}>
            <div className="card" style={{ padding: '1.75rem', borderRadius: 'var(--radius-lg)', background: 'linear-gradient(145deg, rgba(23, 32, 54, 0.9), rgba(15, 23, 42, 0.95))', border: '1px solid rgba(99, 102, 241, 0.25)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
              
              {/* Product Header Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', paddingBottom: '0.85rem', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }}></div>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }}></div>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></div>
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>AI Teacher Studio &bull; Classroom</span>
                </div>
                <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>Live Session</span>
              </div>

              {/* Simulated Teacher Video & Canvas Preview */}
              <div style={{ borderRadius: 'var(--radius-md)', background: '#0a0e1a', padding: '1.25rem', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0, boxShadow: '0 0 15px rgba(99,102,241,0.4)' }}>
                    <GraduationCap size={28} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Dr. Maya &bull; AI Educator</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Topic: C++ RAII & Automatic Memory Cleanup</p>
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.3rem', alignItems: 'center', padding: '0.3rem 0.6rem', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-light)', fontSize: '0.75rem' }}>
                    <Volume2 size={14} className="spin-animation" />
                    <span>Speaking</span>
                  </div>
                </div>

                {/* Subtitle speech text */}
                <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--primary)', fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  "RAII binds the resource lifetime to an object's scope. Notice how memory is freed automatically in the destructor!"
                </div>
              </div>

              {/* Visual Diagram Preview */}
              <div style={{ borderRadius: 'var(--radius-sm)', background: 'rgba(18, 24, 41, 0.8)', padding: '1rem', border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Layers size={20} color="var(--accent-cyan)" />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Interactive Flowchart Canvas</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Object Instantiation &rarr; Destructor Call &rarr; Auto Release</div>
                  </div>
                </div>
                <div style={{ padding: '0.3rem 0.6rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                  Active Visual
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* 2. TRUST / VALUE STRIP */}
      <section style={{ margin: '2rem 0 5rem', padding: '1.75rem 2rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', textAlign: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <Target size={26} color="var(--primary-light)" />
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Personalized Pace</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>5 min express to 7-day courses</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <Brain size={26} color="var(--accent-cyan)" />
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Socratic AI Tutor</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Teaches through active questioning</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={26} color="var(--accent-emerald)" />
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Material Ingestion</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Upload PDF, DOCX, & PPTX</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <Globe size={26} color="var(--accent-amber)" />
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>50+ Languages</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Learn in English, German, Spanish...</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={26} color="var(--accent-rose)" />
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Adaptive Remediation</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Detects & fixes misconceptions</p>
          </div>
        </div>
      </section>


      {/* 3. FEATURE CARDS: "A Teacher That Understands How You Learn" */}
      <section id="features" style={{ padding: '3rem 0 5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>
            A Teacher That Understands <span className="brand-text-gradient">How You Learn</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '640px', margin: '0 auto' }}>
            Unlike static video courses or generic chatbots, AI Teacher dynamically adapts explanation depth, visual diagrams, and check questions based on your live responses.
          </p>
        </div>

        <div className="grid-3" style={{ gap: '1.5rem' }}>
          <div className="card" style={{ padding: '2rem' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <Layers size={22} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>Dynamic Lesson Planning</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Select available time (5m, 20m, 60m, or 7 days). AI Teacher generates a structured curriculum with concept checkpoints.
            </p>
          </div>

          <div className="card" style={{ padding: '2rem' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <Brain size={22} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>Socratic Questioning</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Rather than passive listening, your teacher presents checkpoint questions after every concept to verify true comprehension.
            </p>
          </div>

          <div className="card" style={{ padding: '2rem' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <TrendingUp size={22} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>Misconception Detection</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Give an incorrect answer? The AI diagnoses your exact flawed reasoning, offers a fresh analogy, and adjusts the difficulty.
            </p>
          </div>

          <div className="card" style={{ padding: '2rem' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <BarChart3 size={22} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>Student Learning Profile</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Tracks topics studied, concept mastery scores, weak points, and quiz accuracy in your isolated student profile.
            </p>
          </div>

          <div className="card" style={{ padding: '2rem' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', background: 'rgba(244, 63, 94, 0.15)', color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <Sparkles size={22} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>Visual Diagram Canvas</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Generates real-time Mermaid flowcharts, SVG diagrams, step-by-step cards, and syntax-highlighted code blocks.
            </p>
          </div>

          <div className="card" style={{ padding: '2rem' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <Globe size={22} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.5rem' }}>Multilingual Voice & Text</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Learn fluently in English, German, Spanish, Hindi, French, and over 50 languages with native voice playback.
            </p>
          </div>
        </div>
      </section>


      {/* 4. WORKFLOW SECTION: "Turn Your Study Material Into a Lesson" */}
      <section id="how-it-works" style={{ padding: '4rem 0 5rem', background: 'rgba(18, 24, 41, 0.5)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', margin: '2rem 0' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem', padding: '0 1.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.85rem', borderRadius: 'var(--radius-full)', background: 'rgba(6, 182, 212, 0.12)', color: 'var(--accent-cyan)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '1rem' }}>
            <FileText size={14} /> Seamless Document Ingestion
          </div>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>
            Turn Your Study Material Into <span className="brand-text-gradient">an Interactive Lesson</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '640px', margin: '0 auto' }}>
            Upload any textbook, lecture slides, or enter a topic. AI Teacher parses chapters, sections, and slide ranges to scope your learning.
          </p>
        </div>

        {/* Steps Flow */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', padding: '0 2rem' }}>
          <div className="card" style={{ background: 'var(--bg-card)', position: 'relative' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary-light)', marginBottom: '0.5rem' }}>STEP 01</div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem' }}>Upload or Pick Topic</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Upload PDF, DOCX, PPTX or type any concept (e.g. "Data Structures").
            </p>
          </div>

          <div className="card" style={{ background: 'var(--bg-card)', position: 'relative' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-cyan)', marginBottom: '0.5rem' }}>STEP 02</div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem' }}>Select Chapter/Section</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Choose specific chapters or slide ranges to target your studying.
            </p>
          </div>

          <div className="card" style={{ background: 'var(--bg-card)', position: 'relative' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-emerald)', marginBottom: '0.5rem' }}>STEP 03</div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem' }}>Interactive Teaching</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              AI Teacher explains using voice, visual diagrams, and clear text.
            </p>
          </div>

          <div className="card" style={{ background: 'var(--bg-card)', position: 'relative' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-amber)', marginBottom: '0.5rem' }}>STEP 04</div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem' }}>Adaptive Checkpoint</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Answer questions. Get diagnosed feedback and re-teaching if confused.
            </p>
          </div>
        </div>
      </section>


      {/* 5. AI TEACHER VIDEO SHOWCASE SECTION */}
      <section id="ai-avatar" style={{ padding: '4rem 0 5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.85rem', borderRadius: 'var(--radius-full)', background: 'rgba(168, 85, 247, 0.12)', color: '#c084fc', fontSize: '0.8rem', fontWeight: 600, marginBottom: '1rem' }}>
              <Play size={14} /> Human-Like AI Avatar & Voice
            </div>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '1rem', lineHeight: 1.2 }}>
              Meet Your <span className="brand-text-gradient">AI Teacher</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.65, marginBottom: '1.5rem' }}>
              Step into an immersive teaching video room where your AI Teacher speaks aloud, renders diagrams in real-time, highlights key takeaways, and conducts active checkpoint quizzes.
            </p>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.95rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <CheckCircle2 size={18} color="var(--accent-emerald)" />
                <span>Spoken audio script synced with on-screen visual canvas</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <CheckCircle2 size={18} color="var(--accent-emerald)" />
                <span>Interactive play, pause, and concept stepper controls</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <CheckCircle2 size={18} color="var(--accent-emerald)" />
                <span>Instant re-teaching with new analogies on wrong answers</span>
              </li>
            </ul>
          </div>

          <div className="card" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color-glow)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-light)' }}>AI TEACHER STUDIO</span>
              <span className="badge badge-primary">Concept 2 of 4</span>
            </div>
            <div style={{ height: '180px', borderRadius: 'var(--radius-md)', background: '#090d16', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', position: 'relative' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 0 20px rgba(99,102,241,0.5)' }}>
                <Play size={28} style={{ marginLeft: '4px' }} />
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Click to Preview AI Teaching Studio</span>
            </div>
          </div>
        </div>
      </section>


      {/* 6. PERSONALIZATION SECTION */}
      <section id="personalization" style={{ padding: '4rem 0 5rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem', padding: '0 1.5rem' }}>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>
            Tailored to <span className="brand-text-gradient">Your Exact Preferences</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto' }}>
            Customize your learning experience based on your current knowledge, available schedule, and language preference.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', padding: '0 2rem' }}>
          <div className="card" style={{ background: 'var(--bg-primary)' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <GraduationCap size={18} color="var(--primary-light)" /> Knowledge Level
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <div style={{ padding: '0.4rem 0.75rem', background: 'rgba(99,102,241,0.15)', color: 'var(--primary-light)', borderRadius: '6px', fontWeight: 600 }}>Beginner &bull; Plain Language</div>
              <div style={{ padding: '0.4rem 0.75rem', background: 'rgba(255,255,255,0.04)', borderRadius: '6px' }}>Intermediate &bull; Practical Focus</div>
              <div style={{ padding: '0.4rem 0.75rem', background: 'rgba(255,255,255,0.04)', borderRadius: '6px' }}>Advanced &bull; Deep Theory</div>
            </div>
          </div>

          <div className="card" style={{ background: 'var(--bg-primary)' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} color="var(--accent-cyan)" /> Learning Duration
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <div style={{ padding: '0.4rem 0.75rem', background: 'rgba(255,255,255,0.04)', borderRadius: '6px' }}>⚡ 5 Min Express Review</div>
              <div style={{ padding: '0.4rem 0.75rem', background: 'rgba(6,182,212,0.15)', color: 'var(--accent-cyan)', borderRadius: '6px', fontWeight: 600 }}>📘 20 Min Structured Lesson</div>
              <div style={{ padding: '0.4rem 0.75rem', background: 'rgba(255,255,255,0.04)', borderRadius: '6px' }}>🗓️ 7-Day Complete Course</div>
            </div>
          </div>

          <div className="card" style={{ background: 'var(--bg-primary)' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Globe size={18} color="var(--accent-emerald)" /> Global Languages
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <div style={{ padding: '0.4rem 0.75rem', background: 'rgba(16,185,129,0.15)', color: '#34d399', borderRadius: '6px', fontWeight: 600 }}>🇬🇧 English &bull; Default</div>
              <div style={{ padding: '0.4rem 0.75rem', background: 'rgba(255,255,255,0.04)', borderRadius: '6px' }}>🇩🇪 German &bull; Deutsch</div>
              <div style={{ padding: '0.4rem 0.75rem', background: 'rgba(255,255,255,0.04)', borderRadius: '6px' }}>🇪🇸 Spanish &bull; Español</div>
            </div>
          </div>
        </div>
      </section>


      {/* 7. LEARNING LOOP SECTION */}
      <section style={{ padding: '5rem 0', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '2.5rem' }}>
          The Continuous <span className="brand-text-gradient">Mastery Loop</span>
        </h2>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="badge badge-primary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem' }}>1. Learn Concept</div>
          <ChevronRight size={18} color="var(--text-muted)" />
          <div className="badge badge-warning" style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem' }}>2. Answer Question</div>
          <ChevronRight size={18} color="var(--text-muted)" />
          <div className="badge badge-danger" style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem' }}>3. Get Diagnosed</div>
          <ChevronRight size={18} color="var(--text-muted)" />
          <div className="badge badge-success" style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem' }}>4. Adapt & Master</div>
        </div>
      </section>


      {/* 8. FINAL CTA SECTION */}
      <section style={{ padding: '5rem 2rem', textAlign: 'center', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.15))', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color-glow)', margin: '2rem 0 4rem' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-0.02em' }}>
          Ready to Learn Smarter?
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '540px', margin: '0 auto 2rem auto' }}>
          Start your personalized learning journey with AI Teacher today. Upload your materials or pick any topic.
        </p>
        <Link 
          to="/register" 
          className="btn-primary" 
          style={{ padding: '0.95rem 2.2rem', fontSize: '1.05rem', borderRadius: 'var(--radius-sm)' }}
        >
          Start Learning Free
          <ArrowRight size={20} />
        </Link>
      </section>

    </div>
  );
}
