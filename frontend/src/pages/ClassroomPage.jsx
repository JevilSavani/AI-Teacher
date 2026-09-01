import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import lessonService from '../services/lessonService';
import LoadingSpinner from '../components/ui/LoadingSpinner';
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

    // ---------------------------------------------------------
    // LOAD LESSON
    // ---------------------------------------------------------
    useEffect(() => {
        loadLesson();
    }, [lessonId]);

    const loadLesson = async () => {
        try {
            setLoading(true);

            const lessonData =
                await lessonService.getLessonById(lessonId);

            const statusData =
                await lessonService.getLessonStatus(lessonId);

            setLesson(lessonData);
            setStatus(statusData);

            setLanguage(
                lessonData?.language || 'English'
            );

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
    // MOVE TO NEXT CONCEPT
    // ---------------------------------------------------------
    const moveToNextConcept = async () => {
        try {
            setLoading(true);

            const nextStepData =
                await lessonService.getNextStep(
                    lessonId
                );

            if (
                nextStepData?.action ===
                'lesson_complete'
            ) {
                setTeachingPhase('complete');
            } else {
                await getNextQuestion();
            }

        } catch (error) {
            console.error(
                'Error moving to next concept:',
                error
            );
        } finally {
            setLoading(false);
        }
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
                        Duration:{' '}
                        {lesson.duration_minutes} min
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
                        teachingPhase === 'explanation' && (

                        <div className="teaching-section explanation">

                            <h2>
                                📚 Concept Explanation
                            </h2>

                            <div className="concept-card">

                                <h3>
                                    Let's explore the
                                    next concept...
                                </h3>

                                <p>
                                    Click the button below
                                    to get your first
                                    question and begin
                                    interactive teaching.
                                </p>

                            </div>

                            <button
                                onClick={getNextQuestion}
                                className="btn-primary"
                            >
                                Get Question
                            </button>

                        </div>
                    )}

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

                                    <p>
                                        {typeof guidance === 'object' && guidance !== null
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
                                            : guidance}
                                    </p>

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

                                        <p>
                                            {String(
                                                evaluation.feedback
                                            )}
                                        </p>

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
                                                        {String(
                                                            misconception
                                                        )}
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

                                        <p>
                                            {String(
                                                evaluation.explanation
                                            )}
                                        </p>

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
                                🎉 Lesson Complete!
                            </h2>

                            <div className="completion-card">

                                <p className="final-score">
                                    Final Understanding
                                    Score:{' '}
                                    {Math.round(
                                        status?.understandingScore ||
                                        0
                                    )}
                                    %
                                </p>

                                <p className="concepts-learned">
                                    Concepts Mastered:{' '}
                                    {status?.completedConcepts
                                        ?.length || 0}
                                    {' / '}
                                    {status?.totalConcepts || 0}
                                </p>

                                <p className="encouragement">
                                    Great job! You've
                                    completed this lesson.
                                    Consider practicing
                                    more or trying the
                                    next topic.
                                </p>

                            </div>

                            <div className="button-group">

                                <button
                                    onClick={() =>
                                        navigate(
                                            '/dashboard'
                                        )
                                    }
                                    className="btn-primary"
                                >
                                    Back to Dashboard
                                </button>

                                <button
                                    onClick={() =>
                                        navigate(
                                            '/top-topics'
                                        )
                                    }
                                    className="btn-secondary"
                                >
                                    Explore More Topics
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

        </div>
    );
}