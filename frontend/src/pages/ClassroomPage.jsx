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
    const [teachingPhase, setTeachingPhase] = useState('explanation'); // explanation, question, evaluation, feedback
    const [language, setLanguage] = useState('English');
    const [showRagChat, setShowRagChat] = useState(false);

    // Load lesson on mount
    useEffect(() => {
        loadLesson();
    }, [lessonId]);

    const loadLesson = async () => {
        try {
            setLoading(true);
            const lessonData = await lessonService.getLessonById(lessonId);
            const statusData = await lessonService.getLessonStatus(lessonId);
            setLesson(lessonData);
            setStatus(statusData);
            setLanguage(lessonData.language || 'English');
        } catch (error) {
            console.error('Error loading lesson:', error);
        } finally {
            setLoading(false);
        }
    };

    const startTeaching = async () => {
        try {
            setLoading(true);
            await lessonService.startLesson(lessonId);
            setTeachingPhase('explanation');
            await loadLesson();
        } catch (error) {
            console.error('Error starting lesson:', error);
        } finally {
            setLoading(false);
        }
    };

    const getNextQuestion = async () => {
        try {
            setLoading(true);
            const question = await lessonService.getQuestion(lessonId);
            setCurrentQuestion(question);
            setStudentAnswer('');
            setEvaluation(null);
            setGuidance(null);
            setTeachingPhase('question');
        } catch (error) {
            console.error('Error getting question:', error);
        } finally {
            setLoading(false);
        }
    };

    const submitAnswer = async () => {
        if (!studentAnswer.trim()) return;

        try {
            setIsSubmitting(true);
            const result = await lessonService.submitAnswer(lessonId, {
                answer: studentAnswer,
                questionId: currentQuestion.id
            });
            setEvaluation(result.evaluation);
            setStudentAnswer('');
            setTeachingPhase('evaluation');
            await loadLesson();
        } catch (error) {
            console.error('Error submitting answer:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getSocraticGuidance = async () => {
        try {
            const result = await lessonService.getSocraticGuidance(lessonId, {
                studentThought: studentAnswer
            });
            setGuidance(result.guidance);
        } catch (error) {
            console.error('Error getting guidance:', error);
        }
    };

    const switchLanguage = async (newLanguage) => {
        try {
            await lessonService.switchLanguage(lessonId, { language: newLanguage });
            setLanguage(newLanguage);
        } catch (error) {
            console.error('Error switching language:', error);
        }
    };

    const moveToNextConcept = async () => {
        try {
            setLoading(true);
            const nextStepData = await lessonService.getNextStep(lessonId);

            if (nextStepData.action === 'lesson_complete') {
                setTeachingPhase('complete');
            } else {
                await getNextQuestion();
            }
        } catch (error) {
            console.error('Error moving to next concept:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !lesson) {
        return <LoadingSpinner />;
    }

    if (!lesson) {
        return (
            <div className="classroom-container">
                <div className="error-message">Lesson not found</div>
                <button onClick={() => navigate('/dashboard')} className="btn-primary">
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="classroom-container">
            {/* Header */}
            <div className="classroom-header">
                <div className="lesson-title">
                    <h1>{lesson.topic}</h1>
                    <p className="lesson-level">Level: {lesson.level} | Duration: {lesson.duration_minutes} min</p>
                </div>
                <div className="classroom-controls">
                    <select
                        value={language}
                        onChange={(e) => switchLanguage(e.target.value)}
                        className="language-selector"
                    >
                        <option value="English">English</option>
                        <option value="Spanish">Spanish</option>
                        <option value="French">French</option>
                        <option value="German">German</option>
                        <option value="Chinese">Chinese</option>
                    </select>
                    <button
                        onClick={() => setShowRagChat(!showRagChat)}
                        className="btn-secondary"
                    >
                        {showRagChat ? 'Hide' : 'Ask'} Resources
                    </button>
                </div>
            </div>

            {/* Progress Bar */}
            {status && (
                <div className="progress-section">
                    <div className="progress-info">
                        <span>Progress: {status.currentConceptIndex + 1} / {status.totalConcepts} concepts</span>
                        <span>Understanding: {Math.round(status.understandingScore)}%</span>
                    </div>
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${(status.currentConceptIndex / status.totalConcepts) * 100}%` }}
                        />
                    </div>
                </div>
            )}

            <div className="classroom-content">
                {/* Main Teaching Area */}
                <div className="teaching-area">
                    {lesson.status === 'created' && teachingPhase === 'explanation' && (
                        <div className="teaching-section welcome">
                            <h2>Welcome to {lesson.topic}!</h2>
                            <p>This interactive lesson will help you master {lesson.topic} at your own pace.</p>
                            <p>You'll learn key concepts, answer questions, and get personalized guidance.</p>
                            <button onClick={startTeaching} className="btn-primary btn-large">
                                Start Learning
                            </button>
                        </div>
                    )}

                    {lesson.status === 'in_progress' && teachingPhase === 'explanation' && (
                        <div className="teaching-section explanation">
                            <h2>📚 Concept Explanation</h2>
                            <div className="concept-card">
                                <h3>Let's explore the next concept...</h3>
                                <p>Click the button below to get your first question and begin the interactive teaching.</p>
                            </div>
                            <button onClick={getNextQuestion} className="btn-primary">
                                Get Question
                            </button>
                        </div>
                    )}

                    {teachingPhase === 'question' && currentQuestion && (
                        <div className="teaching-section question-section">
                            <h2>❓ Question</h2>
                            <div className="question-card">
                                <p className="question-text">{currentQuestion.question}</p>

                                {currentQuestion.options && (
                                    <div className="options">
                                        {currentQuestion.options.map((option, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setStudentAnswer(option)}
                                                className={`option-btn ${studentAnswer === option ? 'selected' : ''}`}
                                            >
                                                {String.fromCharCode(65 + index)}) {option}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {!currentQuestion.options && (
                                    <textarea
                                        value={studentAnswer}
                                        onChange={(e) => setStudentAnswer(e.target.value)}
                                        placeholder="Type your answer here..."
                                        className="answer-input"
                                        rows="4"
                                    />
                                )}
                            </div>

                            <div className="button-group">
                                <button
                                    onClick={submitAnswer}
                                    disabled={isSubmitting || !studentAnswer}
                                    className="btn-primary"
                                >
                                    {isSubmitting ? 'Evaluating...' : 'Submit Answer'}
                                </button>
                                <button
                                    onClick={getSocraticGuidance}
                                    className="btn-secondary"
                                >
                                    💡 Get Hint
                                </button>
                            </div>

                            {guidance && (
                                <div className="guidance-box">
                                    <h4>💭 Guidance</h4>
                                    <p>{guidance}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {teachingPhase === 'evaluation' && evaluation && (
                        <div className="teaching-section evaluation">
                            <h2>📊 Evaluation</h2>
                            <div className={`evaluation-card ${evaluation.is_correct ? 'correct' : 'incorrect'}`}>
                                <div className="score-display">
                                    <h3>{evaluation.score}%</h3>
                                    <p>{evaluation.is_correct ? '✅ Correct!' : '❌ Not quite right'}</p>
                                </div>

                                <div className="feedback">
                                    <h4>Feedback</h4>
                                    <p>{evaluation.feedback}</p>
                                </div>

                                {evaluation.misconceptions && evaluation.misconceptions.length > 0 && (
                                    <div className="misconceptions">
                                        <h4>⚠️ Common Misconceptions</h4>
                                        <ul>
                                            {evaluation.misconceptions.map((m, i) => (
                                                <li key={i}>{m}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {evaluation.explanation && (
                                    <div className="explanation">
                                        <h4>📖 Explanation</h4>
                                        <p>{evaluation.explanation}</p>
                                    </div>
                                )}
                            </div>

                            <div className="button-group">
                                <button
                                    onClick={moveToNextConcept}
                                    className="btn-primary"
                                >
                                    {evaluation.should_move_forward ? 'Next Concept' : 'Try Again'}
                                </button>
                            </div>
                        </div>
                    )}

                    {teachingPhase === 'complete' && (
                        <div className="teaching-section complete">
                            <h2>🎉 Lesson Complete!</h2>
                            <div className="completion-card">
                                <p className="final-score">
                                    Final Understanding Score: {Math.round(status?.understandingScore || 0)}%
                                </p>
                                <p className="concepts-learned">
                                    Concepts Mastered: {status?.completedConcepts?.length || 0} / {status?.totalConcepts || 0}
                                </p>
                                <p className="encouragement">
                                    Great job! You've completed this lesson. Consider practicing more or trying the next topic.
                                </p>
                            </div>
                            <div className="button-group">
                                <button onClick={() => navigate('/dashboard')} className="btn-primary">
                                    Back to Dashboard
                                </button>
                                <button onClick={() => navigate('/top-topics')} className="btn-secondary">
                                    Explore More Topics
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar - Current Status */}
                <div className="sidebar">
                    <div className="status-card">
                        <h3>Current Status</h3>
                        {status && (
                            <>
                                <div className="status-item">
                                    <label>Concepts Completed:</label>
                                    <span>{status.completedConcepts?.length || 0}</span>
                                </div>
                                <div className="status-item">
                                    <label>Questions Asked:</label>
                                    <span>{status.questionsAsked || 0}</span>
                                </div>
                                <div className="status-item">
                                    <label>Understanding:</label>
                                    <span className="score">{Math.round(status.understandingScore || 0)}%</span>
                                </div>
                            </>
                        )}
                    </div>

                    {showRagChat && (
                        <div className="rag-chat-panel">
                            <h3>📚 Learning Resources</h3>
                            <p className="info-text">
                                Have questions about this topic? Check your uploaded materials or ask for clarification.
                            </p>
                            <button className="btn-secondary full-width">
                                Chat with Materials
                            </button>
                        </div>
                    )}

                    {status?.completedConcepts && status.completedConcepts.length > 0 && (
                        <div className="concepts-card">
                            <h3>✅ Concepts Learned</h3>
                            <ul className="concepts-list">
                                {status.completedConcepts.map((concept, i) => (
                                    <li key={i}>{concept}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
