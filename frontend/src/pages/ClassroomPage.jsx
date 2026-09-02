import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import lessonService from '../services/lessonService';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import QuizModal from '../components/QuizModal';
import MarkdownRenderer from '../components/MarkdownRenderer';
import VisualExplanation from '../components/VisualExplanation';
import VoicePlayer from '../components/VoicePlayer';
import speechService from '../utils/speechService';
import '../assets/styles/classroom.css';

export default function ClassroomPage() {
    const { id: lessonId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [lesson, setLesson] = useState(null);
    const [status, setStatus] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [studentAnswer, setStudentAnswer] = useState('');
    const [evaluation, setEvaluation] = useState(null);
    const [guidance, setGuidance] = useState(null);

    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGettingGuidance, setIsGettingGuidance] = useState(false);

    const [teachingPhase, setTeachingPhase] = useState('explanation');
    const [language, setLanguage] = useState('English');
    const [showRagChat, setShowRagChat] = useState(false);
    const [showQuizModal, setShowQuizModal] = useState(false);
    const [progression, setProgression] = useState(null);

    // ---------------------------------------------------------
    // LOAD LESSON
    // ---------------------------------------------------------
    useEffect(() => {
        speechService.stop();
        loadLesson();
        return () => {
            speechService.stop();
        };
    }, [lessonId]);

    const loadLesson = async () => {
        try {
            setLoading(true);

            const lessonData =
                await lessonService.getLessonById(lessonId);

            const statusData =
                await lessonService.getLessonStatus(lessonId);

            let progData = null;
            try {
                progData = await lessonService.getNextProgression(lessonId);
                setProgression(progData);
            } catch (e) {
                console.error('Error fetching progression info:', e);
            }

            setLesson(lessonData);
            setStatus(statusData);

            setLanguage(
                lessonData?.language || 'English'
            );

            if (progData?.isCourseComplete) {
                setTeachingPhase('course_complete');
            } else if (statusData?.status === 'completed' || (statusData?.currentConceptIndex >= statusData?.totalConcepts && statusData?.totalConcepts > 0)) {
                setTeachingPhase('complete');
            }

        } catch (error) {
            console.error(
                'Error loading lesson:',
                error
            );
        } finally {
            setLoading(false);
        }
    };

    // ---------------------------------------------------------
    // START TEACHING
    // ---------------------------------------------------------
    const startTeaching = async () => {
        try {
            setLoading(true);

            await lessonService.startLesson(lessonId);

            setTeachingPhase('explanation');

            await loadLesson();

        } catch (error) {
            console.error(
                'Error starting lesson:',
                error
            );
        } finally {
            setLoading(false);
        }
    };

    // ---------------------------------------------------------
    // GET NEXT QUESTION
    // ---------------------------------------------------------
    const getNextQuestion = async () => {
        try {
            setLoading(true);

            const response =
                await lessonService.getQuestion(
                    lessonId
                );

            // Normalize API response
            let question = response;

            if (response?.data?.data) {
                question = response.data.data;
            } else if (response?.data) {
                question = response.data;
            }

            // Handle nested question object
            if (
                question?.question &&
                typeof question.question === 'object'
            ) {
                question = question.question;
            }

            // Validate question
            if (
                !question ||
                typeof question !== 'object' ||
                typeof question.question !== 'string'
            ) {
                console.error(
                    'Invalid question response:',
                    response
                );

                throw new Error(
                    'Invalid question format received'
                );
            }

            setCurrentQuestion(question);
            setStudentAnswer('');
            setEvaluation(null);
            setGuidance(null);
            setTeachingPhase('question');

        } catch (error) {
            console.error(
                'Error getting question:',
                error
            );
            if (error?.message?.includes('Lesson is complete')) {
                await handleContinueLearning();
            }
        } finally {
            setLoading(false);
        }
    };

    // ---------------------------------------------------------
    // SUBMIT ANSWER
    // ---------------------------------------------------------
    const submitAnswer = async () => {
        if (!studentAnswer.trim()) {
            return;
        }

        try {
            setIsSubmitting(true);

            const result =
                await lessonService.submitAnswer(
                    lessonId,
                    {
                        answer: studentAnswer.trim(),
                        questionId: currentQuestion?.id
                    }
                );

            setEvaluation(
                result?.evaluation || result
            );

            setGuidance(null);
            setStudentAnswer('');
            setTeachingPhase('evaluation');

            await loadLesson();

        } catch (error) {
            console.error(
                'Error submitting answer:',
                error
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    // ---------------------------------------------------------
    // SOCRATIC GUIDANCE / GET HINT
    // ---------------------------------------------------------
    const getSocraticGuidance = async () => {
        try {
            setIsGettingGuidance(true);

            /*
             * The backend requires studentThought.
             *
             * If the student has not answered yet,
             * provide a default thought so they can
             * still request a Socratic hint.
             */
            const studentThought =
                studentAnswer.trim() ||
                "I don't know how to answer this question yet.";

            const result =
                await lessonService.getSocraticGuidance(
                    lessonId,
                    {
                        studentThought,

                        question:
                            currentQuestion?.question || '',

                        concept:
                            currentQuestion?.conceptTitle ||
                            lesson?.topic ||
                            ''
                    }
                );

            const rawGuidance = result?.guidance;
            let guidanceText = '';

            if (typeof rawGuidance === 'object' && rawGuidance !== null) {
                guidanceText =
                    rawGuidance.teacherResponse ||
                    rawGuidance.guidance ||
                    rawGuidance.message ||
                    JSON.stringify(rawGuidance);
            } else if (typeof rawGuidance === 'string') {
                try {
                    const parsed = JSON.parse(rawGuidance);
                    if (parsed && typeof parsed === 'object') {
                        guidanceText =
                            parsed.teacherResponse ||
                            parsed.guidance ||
                            parsed.message ||
                            rawGuidance;
                    } else {
                        guidanceText = rawGuidance;
                    }
                } catch {
                    guidanceText = rawGuidance;
                }
            } else {
                guidanceText =
                    result?.message ||
                    'Think carefully about the question and what you already know.';
            }

            setGuidance(guidanceText);

        } catch (error) {
            console.error(
                'Error getting guidance:',
                error
            );

            setGuidance(
                'Unable to get guidance right now. Please try again.'
            );

        } finally {
            setIsGettingGuidance(false);
        }
    };

    // ---------------------------------------------------------
    // SWITCH LANGUAGE
    // ---------------------------------------------------------
    const switchLanguage = async (newLanguage) => {
        try {
            speechService.stop();
            await lessonService.switchLanguage(
                lessonId,
                {
                    language: newLanguage
                }
            );

            setLanguage(newLanguage);

        } catch (error) {
            console.error(
                'Error switching language:',
                error
            );
        }
    };

    // ---------------------------------------------------------
    // CONTINUE LEARNING & MOVE TO NEXT CONCEPT
    // ---------------------------------------------------------
    const handleContinueLearning = async () => {
        try {
            setLoading(true);
            const progression = await lessonService.getNextProgression(lessonId);

            if (progression?.isCourseComplete) {
                setTeachingPhase('course_complete');
                setStatus(prev => ({
                    ...prev,
                    finalScore: progression.finalUnderstandingScore,
                    totalCompletedConcepts: progression.completedConcepts
                }));
            } else if (progression?.isSameLesson) {
                await loadLesson();
                setTeachingPhase('explanation');
            } else if (progression?.lessonId) {
                navigate(`/classroom/${progression.lessonId}`);
            } else {
                setTeachingPhase('complete');
            }
        } catch (error) {
            console.error('Error continuing learning progression:', error);
            setTeachingPhase('complete');
        } finally {
            setLoading(false);
        }
    };

    const moveToNextConcept = async () => {
        await handleContinueLearning();
    };

    // ---------------------------------------------------------
    // LOADING
    // ---------------------------------------------------------
    if (loading && !lesson) {
        return <LoadingSpinner />;
    }

    // ---------------------------------------------------------
    // LESSON NOT FOUND
    // ---------------------------------------------------------
    if (!lesson) {
        return (
            <div className="classroom-container">

                <div className="error-message">
                    Lesson not found
                </div>

                <button
                    onClick={() =>
                        navigate('/dashboard')
                    }
                    className="btn-primary"
                >
                    Back to Dashboard
                </button>

            </div>
        );
    }

    // ---------------------------------------------------------
    // UI
    // ---------------------------------------------------------
    return (
        <div className="classroom-container">

            {/* HEADER */}
            <div className="classroom-header">

                <div className="lesson-title">

                    <h1>
                        {lesson.topic}
                    </h1>

                    <p className="lesson-level">
                        Level: {lesson.level}
                        {' | '}
                        Time Frame:{' '}
                        {lesson.duration_minutes === 10080 ? '📅 7 Days Plan' : `⏱️ ${lesson.duration_minutes} min`}
                    </p>

                </div>

                <div className="classroom-controls">

                    <select
                        value={language}
                        onChange={(e) =>
                            switchLanguage(
                                e.target.value
                            )
                        }
                        className="language-selector"
                    >
                        <option value="English">
                            English
                        </option>

                        <option value="Spanish">
                            Spanish
                        </option>

                        <option value="French">
                            French
                        </option>

                        <option value="German">
                            German
                        </option>

                        <option value="Chinese">
                            Chinese
                        </option>
                    </select>

                    <button
                        onClick={() => navigate(`/teach/${lessonId}`)}
                        className="btn-primary"
                        style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem', background: 'linear-gradient(135deg, #6366f1, #ec4899)', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                        🎥 Start AI Teacher
                    </button>

                    <button
                        onClick={() =>
                            setShowQuizModal(true)
                        }
                        className="btn-primary"
                        style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
                    >
                        Take Quiz
                    </button>

                    <button
                        onClick={() =>
                            setShowRagChat(
                                !showRagChat
                            )
                        }
                        className="btn-secondary"
                    >
                        {showRagChat
                            ? 'Hide'
                            : 'Ask'}{' '}
                        Resources
                    </button>

                </div>

            </div>

            {/* PROGRESS */}
            {status && (
                <div className="progress-section">

                    <div className="progress-info">

                        <span>
                            Progress:{' '}
                            {Math.min(
                                (status.currentConceptIndex || 0) + 1,
                                status.totalConcepts || 0
                            )}
                            {' / '}
                            {status.totalConcepts || 0}
                            {' concepts'}
                        </span>

                        <span>
                            Understanding:{' '}
                            {Math.round(
                                status.understandingScore || 0
                            )}
                            %
                        </span>

                    </div>

                    <div className="progress-bar">

                        <div
                            className="progress-fill"
                            style={{
                                width: `${
                                    status.totalConcepts
                                        ? Math.min(
                                            100,
                                            ((status.currentConceptIndex || 0) /
                                                status.totalConcepts) *
                                                100
                                        )
                                        : 0
                                }%`
                            }}
                        />

                    </div>

                </div>
            )}

            <div className="classroom-content">

                {/* MAIN TEACHING AREA */}
                <div className="teaching-area">

                    {/* WELCOME */}
                    {lesson.status === 'created' &&
                        teachingPhase === 'explanation' && (

                        <div className="teaching-section welcome">

                            <h2>
                                Welcome to {lesson.topic}!
                            </h2>

                            <p>
                                This interactive lesson
                                will help you master{' '}
                                {lesson.topic} at your
                                own pace.
                            </p>

                            <p>
                                You'll learn key concepts,
                                answer questions, and get
                                personalized guidance.
                            </p>

                            <button
                                onClick={startTeaching}
                                className="btn-primary btn-large"
                            >
                                Start Learning
                            </button>

                        </div>
                    )}

                    {/* EXPLANATION */}
                    {lesson.status === 'in_progress' &&
                        teachingPhase === 'explanation' && (() => {
                        const planObj = typeof lesson?.lesson_plan === 'string' ? JSON.parse(lesson.lesson_plan || '{}') : (lesson?.lesson_plan || {});
                        const conceptsList = planObj?.concepts || [];
                        const activeIdx = status?.currentConceptIndex || 0;
                        const activeConcept = conceptsList[activeIdx] || conceptsList[0] || null;

                        return (
                        <div className="teaching-section explanation">

                            <h2>
                                📚 Concept Explanation & Visual Learning
                            </h2>

                            <div className="concept-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    <h3 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                                        {activeConcept?.title || lesson.topic}
                                    </h3>
                                    <VoicePlayer 
                                        text={`${activeConcept?.title || ''}. ${activeConcept?.description || ''}. Key points: ${(activeConcept?.teaching_points || []).join('. ')}.`} 
                                        language={language}
                                        compact={true}
                                    />
                                </div>

                                <VoicePlayer 
                                    text={`${activeConcept?.title || ''}. ${activeConcept?.description || ''}. Key points: ${(activeConcept?.teaching_points || []).join('. ')}.`} 
                                    language={language}
                                />

                                {/* 1. Concept Explanation */}
                                {activeConcept?.description && (
                                    <div className="concept-description">
                                        <MarkdownRenderer content={activeConcept.description} />
                                    </div>
                                )}

                                {/* 2. Key Points */}
                                {activeConcept?.teaching_points && Array.isArray(activeConcept.teaching_points) && activeConcept.teaching_points.length > 0 && (
                                    <div className="teaching-points" style={{ padding: '1rem 1.25rem', background: 'var(--bg-secondary, #1e293b)', borderRadius: '10px', border: '1px solid var(--border-color, #334155)' }}>
                                        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', fontWeight: '700', color: 'var(--primary-light, #818cf8)' }}>
                                            🎯 Key Teaching Points
                                        </h4>
                                        <ul style={{ paddingLeft: '1.2rem', margin: 0 }}>
                                            {activeConcept.teaching_points.map((pt, pIdx) => (
                                                <li key={pIdx} style={{ margin: '0.35rem 0', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                                    <MarkdownRenderer content={String(pt)} />
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* 3. Example / Code Snippet */}
                                {activeConcept?.example && (
                                    <div className="concept-example">
                                        <MarkdownRenderer content={activeConcept.example} />
                                    </div>
                                )}

                                {/* 4 & 5 & 6. Visual Diagrams & Code Blocks */}
                                {activeConcept?.visual && (
                                    <VisualExplanation visual={activeConcept.visual} title={activeConcept.title} />
                                )}

                                {/* 7. Key Takeaway */}
                                {activeConcept?.practice_question && (
                                    <div className="key-takeaway-card" style={{ padding: '0.85rem 1.2rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.08)', borderLeft: '4px solid #10b981', color: 'var(--text-primary)' }}>
                                        <span style={{ fontWeight: '700', color: '#10b981' }}>💡 Key Takeaway: </span>
                                        <span>Mastering {activeConcept.title || 'this concept'} unlocks deeper understanding across {lesson.topic}.</span>
                                    </div>
                                )}

                            </div>

                            {/* 8. Practice & Get Questions Button */}
                            <div style={{ marginTop: '1.5rem' }}>
                                <button
                                    onClick={getNextQuestion}
                                    className="btn-primary btn-large"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    Practice & Get Questions &rarr;
                                </button>
                            </div>

                        </div>
                        );
                    })()}

                    {/* QUESTION */}
                    {teachingPhase === 'question' &&
                        currentQuestion && (

                        <div className="teaching-section question-section">

                            <h2>
                                {currentQuestion.isRemediation ? '🎯 Remedial Practice Question' : '❓ Question'}
                            </h2>

                            {currentQuestion.isRemediation && (
                                <div className="remediation-badge" style={{
                                    background: '#e0f2fe',
                                    borderLeft: '4px solid #0284c7',
                                    color: '#0369a1',
                                    padding: '12px 16px',
                                    borderRadius: '8px',
                                    marginBottom: '16px',
                                    fontWeight: '600',
                                    fontSize: '0.9rem'
                                }}>
                                    💡 Remedial Mode: Focused on correcting {currentQuestion.misconception ? `"${currentQuestion.misconception}"` : 'your weak concept'}
                                </div>
                            )}

                            <div className="question-card">

                                <p className="question-text">
                                    {typeof currentQuestion.question ===
                                    'string'
                                        ? currentQuestion.question
                                        : JSON.stringify(
                                            currentQuestion.question
                                        )}
                                </p>

                                {/* MCQ OPTIONS */}
                                {Array.isArray(
                                    currentQuestion.options
                                ) && (

                                    <div className="options">

                                        {currentQuestion.options.map(
                                            (option, index) => (

                                                <button
                                                    key={index}
                                                    type="button"
                                                    onClick={() =>
                                                        setStudentAnswer(
                                                            String(option)
                                                        )
                                                    }
                                                    className={`option-btn ${
                                                        studentAnswer ===
                                                        String(option)
                                                            ? 'selected'
                                                            : ''
                                                    }`}
                                                >

                                                    {String.fromCharCode(
                                                        65 + index
                                                    )}
                                                    {') '}
                                                    {String(option)}

                                                </button>

                                            )
                                        )}

                                    </div>
                                )}

                                {/* TEXT ANSWER */}
                                {!Array.isArray(
                                    currentQuestion.options
                                ) && (

                                    <textarea
                                        value={studentAnswer}
                                        onChange={(e) =>
                                            setStudentAnswer(
                                                e.target.value
                                            )
                                        }
                                        placeholder="Type your answer here..."
                                        className="answer-input"
                                        rows="4"
                                    />

                                )}

                            </div>

                            {/* BUTTONS */}
                            <div className="button-group">

                                {/* SUBMIT ANSWER */}
                                <button
                                    onClick={submitAnswer}
                                    disabled={
                                        isSubmitting ||
                                        !studentAnswer.trim()
                                    }
                                    className="btn-primary"
                                >
                                    {isSubmitting
                                        ? 'Evaluating...'
                                        : 'Submit Answer'}
                                </button>

                                {/* GET HINT
                                    IMPORTANT:
                                    This button is NOT disabled
                                    when studentAnswer is empty.
                                */}
                                <button
                                    type="button"
                                    onClick={
                                        getSocraticGuidance
                                    }
                                    disabled={
                                        isGettingGuidance
                                    }
                                    className="btn-secondary"
                                >
                                    {isGettingGuidance
                                        ? 'Thinking...'
                                        : '💡 Get Hint'}
                                </button>

                            </div>

                            {/* GUIDANCE */}
                            {guidance && (

                                <div className="guidance-box">

                                    <h4>
                                        💭 Guidance
                                    </h4>

                                    <MarkdownRenderer 
                                        content={
                                            typeof guidance === 'object' && guidance !== null
                                                ? guidance.teacherResponse || guidance.guidance || JSON.stringify(guidance)
                                                : typeof guidance === 'string'
                                                ? (() => {
                                                      try {
                                                          const parsed = JSON.parse(guidance);
                                                          return parsed?.teacherResponse || parsed?.guidance || guidance;
                                                      } catch {
                                                          return guidance;
                                                      }
                                                  })()
                                                : guidance
                                        } 
                                    />

                                </div>
                            )}

                        </div>
                    )}

                    {/* EVALUATION */}
                    {teachingPhase === 'evaluation' &&
                        evaluation && (

                        <div className="teaching-section evaluation">

                            <h2>
                                📊 Evaluation
                            </h2>

                            <div
                                className={`evaluation-card ${
                                    evaluation.is_correct
                                        ? 'correct'
                                        : 'incorrect'
                                }`}
                            >

                                <div className="score-display">

                                    <h3>
                                        {evaluation.score ?? 0}%
                                    </h3>

                                    <p>
                                        {evaluation.is_correct
                                            ? '✅ Correct!'
                                            : '❌ Not quite right'}
                                    </p>

                                </div>

                                {evaluation.feedback && (

                                    <div className="feedback">

                                        <h4>
                                            Feedback
                                        </h4>

                                        <MarkdownRenderer content={String(evaluation.feedback)} />

                                    </div>
                                )}

                                {(evaluation.visualRemediation || evaluation.visual) && (
                                    <div className="remedial-visual-section" style={{ margin: '1rem 0' }}>
                                        <VisualExplanation visual={evaluation.visualRemediation || evaluation.visual} />
                                    </div>
                                )}

                                {Array.isArray(
                                    evaluation.misconceptions
                                ) &&
                                    evaluation.misconceptions.length >
                                        0 && (

                                    <div className="misconceptions">

                                        <h4>
                                            ⚠️ Common
                                            Misconceptions
                                        </h4>

                                        <ul>

                                            {evaluation.misconceptions.map(
                                                (
                                                    misconception,
                                                    index
                                                ) => (

                                                    <li
                                                        key={index}
                                                    >
                                                        <MarkdownRenderer content={String(misconception)} />
                                                    </li>
                                                )
                                            )}

                                        </ul>

                                    </div>
                                )}

                                {evaluation.explanation && (

                                    <div className="explanation">

                                        <h4>
                                            📖 Explanation
                                        </h4>

                                        <MarkdownRenderer content={String(evaluation.explanation)} />

                                    </div>
                                )}

                            </div>

                            <div className="button-group">

                                <button
                                    onClick={
                                        moveToNextConcept
                                    }
                                    className="btn-primary"
                                >
                                    {evaluation.should_move_forward
                                        ? 'Next Concept'
                                        : 'Try Again'}
                                </button>

                            </div>

                        </div>
                    )}

                    {/* COMPLETE */}
                    {teachingPhase === 'complete' && (

                        <div className="teaching-section complete">

                            <h2>
                                {(progression?.isCourseComplete || (!progression?.isSameLesson && !progression?.lessonId))
                                    ? "🎉 You've completed all concepts!"
                                    : "🎉 Concept Complete!"}
                            </h2>

                            <div className="completion-card">

                                <p className="final-score">
                                    Understanding Score:{' '}
                                    {Math.round(
                                        status?.understandingScore || 0
                                    )}
                                    %
                                </p>

                                <p className="concepts-learned">
                                    Concepts Mastered:{' '}
                                    {status?.completedConcepts?.length || 0}
                                    {' / '}
                                    {status?.totalConcepts || 0}
                                </p>

                                <p className="encouragement">
                                    {(progression?.isCourseComplete || (!progression?.isSameLesson && !progression?.lessonId))
                                        ? "Great job! You have mastered all concepts in this course."
                                        : "Great job! You have mastered this concept. Click Continue Learning to advance to the next concept."}
                                </p>

                            </div>

                            <div className="button-group">

                                {(!progression?.isCourseComplete && (progression?.isSameLesson || progression?.lessonId)) && (
                                    <button
                                        onClick={handleContinueLearning}
                                        className="btn-primary"
                                    >
                                        Continue Learning &rarr;
                                    </button>
                                )}

                                <button
                                    onClick={() => navigate('/progress')}
                                    className={(!progression?.isCourseComplete && (progression?.isSameLesson || progression?.lessonId)) ? "btn-secondary" : "btn-primary"}
                                >
                                    View Progress
                                </button>

                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="btn-secondary"
                                >
                                    Back to Dashboard
                                </button>

                            </div>

                        </div>
                    )}

                    {/* COURSE COMPLETE */}
                    {teachingPhase === 'course_complete' && (

                        <div className="teaching-section complete">

                            <h2>
                                🏆 Course Completed!
                            </h2>

                            <div className="completion-card" style={{ textAlign: 'center', padding: '1.5rem' }}>

                                <p className="final-score" style={{ fontSize: '1.5rem', fontWeight: '800', color: '#10b981', margin: '0 0 0.5rem' }}>
                                    Final Score: {status?.finalScore || Math.round(status?.understandingScore || 100)}%
                                </p>

                                <p className="concepts-learned" style={{ fontSize: '1rem', fontWeight: '600' }}>
                                    🎉 You've completed all concepts! ({status?.completedConcepts?.length || status?.totalConcepts || 0} / {status?.totalConcepts || status?.completedConcepts?.length || 0})
                                </p>

                                <p className="encouragement" style={{ color: 'var(--text-secondary)' }}>
                                    Congratulations! You have completed all lessons and concepts in your learning path.
                                </p>

                            </div>

                            <div className="button-group" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>

                                <button
                                    onClick={() => navigate('/progress')}
                                    className="btn-primary"
                                >
                                    View Progress & Analytics
                                </button>

                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="btn-secondary"
                                >
                                    Back to Dashboard
                                </button>

                            </div>

                        </div>
                    )}

                </div>

                {/* SIDEBAR */}
                <div className="sidebar">

                    {/* STATUS */}
                    <div className="status-card">

                        <h3>
                            Current Status
                        </h3>

                        {status && (
                            <>

                                <div className="status-item">

                                    <label>
                                        Concepts Completed:
                                    </label>

                                    <span>
                                        {status.completedConcepts
                                            ?.length || 0}
                                    </span>

                                </div>

                                <div className="status-item">

                                    <label>
                                        Questions Asked:
                                    </label>

                                    <span>
                                        {status.questionsAsked ||
                                            0}
                                    </span>

                                </div>

                                <div className="status-item">

                                    <label>
                                        Understanding:
                                    </label>

                                    <span className="score">
                                        {Math.round(
                                            status.understandingScore ||
                                            0
                                        )}
                                        %
                                    </span>

                                </div>

                            </>
                        )}

                    </div>

                    {/* RAG */}
                    {showRagChat && (

                        <div className="rag-chat-panel">

                            <h3>
                                📚 Learning Resources
                            </h3>

                            <p className="info-text">
                                Have questions about
                                this topic? Check your
                                uploaded materials or ask
                                for clarification.
                            </p>

                            <button
                                className="btn-secondary full-width"
                            >
                                Chat with Materials
                            </button>

                        </div>
                    )}

                    {/* COMPLETED CONCEPTS */}
                    {status?.completedConcepts &&
                        status.completedConcepts.length >
                            0 && (

                        <div className="concepts-card">

                            <h3>
                                ✅ Concepts Learned
                            </h3>

                            <ul className="concepts-list">

                                {status.completedConcepts.map(
                                    (concept, index) => (

                                        <li key={index}>
                                            {String(
                                                concept
                                            )}
                                        </li>

                                    )
                                )}

                            </ul>

                        </div>
                    )}

                </div>

            </div>

            <QuizModal
                isOpen={showQuizModal}
                onClose={() => setShowQuizModal(false)}
                lessonId={lessonId}
                topic={lesson?.topic}
                onComplete={loadLesson}
            />

        </div>
    );
}