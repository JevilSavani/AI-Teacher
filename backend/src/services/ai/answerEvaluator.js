const llmProvider = require('./llmProvider');

/**
 * Answer Evaluator Module
 * Evaluates student answers, provides feedback, and identifies misconceptions
 */
class AnswerEvaluator {
  /**
   * Evaluate a student's answer to a question
   * Returns: score (0-100), feedback, and detected misconceptions
   */
  async evaluateAnswer(question, studentAnswer, studentLevel = 'Intermediate') {
    if (!question || !studentAnswer) {
      throw new Error('Question and studentAnswer are required');
    }

    const systemPrompt = `You are an expert evaluator of student learning.
You need to evaluate this student answer carefully and provide:
1. A correctness score (0-100)
2. Detailed feedback (encouraging but honest)
3. Any misconceptions detected
4. Guidance for improvement

QUESTION:
${JSON.stringify(question, null, 2)}

STUDENT LEVEL: ${studentLevel}

EVALUATION CRITERIA:
- Correctness: Is the answer factually correct?
- Completeness: Does it address all parts of the question?
- Understanding: Does it show genuine understanding or just memorization?
- Clarity: Is the reasoning clear?
- Misconceptions: Are there any incorrect assumptions or misunderstandings?

Return as JSON (ONLY JSON, no explanation):
{
  "score": 0-100,
  "is_correct": true/false,
  "correctness_confidence": 0-1,
  "feedback": "Encouraging and helpful feedback",
  "strengths": ["What they did well"],
  "improvements": ["What could be better"],
  "misconceptions": ["Any misconceptions detected"],
  "next_step": "What should they focus on next",
  "should_move_forward": true/false
}`;

    try {
      const response = await llmProvider.generateCompletion(
        `Evaluate this answer: "${studentAnswer}"`,
        systemPrompt
      );

      let jsonStr = response.replace(/```json\n?|\n?```/g, '').trim();
      const evaluation = JSON.parse(jsonStr);

      return {
        ...evaluation,
        studentAnswer,
        questionId: question.id || null,
        evaluatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error evaluating answer:', error);

      // Fallback evaluation
      const isCorrect = this._simpleCheck(studentAnswer, question);
      return {
        score: isCorrect ? 100 : 0,
        is_correct: isCorrect,
        correctness_confidence: 0.7,
        feedback: isCorrect
          ? 'Good job! Your answer is correct.'
          : 'This answer needs review. Please think more carefully about the question.',
        strengths: isCorrect ? ['Correct understanding'] : [],
        improvements: isCorrect ? [] : ['Review the concept', 'Try again'],
        misconceptions: [],
        next_step: isCorrect ? 'Move to next question' : 'Review and try again',
        should_move_forward: isCorrect,
        studentAnswer,
        evaluatedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Diagnose misconceptions from an incorrect answer
   */
  async diagnoseMisconceptions(question, studentAnswer, conceptTitle) {
    if (!question || !studentAnswer || !conceptTitle) {
      throw new Error('question, studentAnswer, and conceptTitle are required');
    }

    const systemPrompt = `You are a learning scientist specializing in misconception diagnosis.
Analyze this wrong answer to identify the UNDERLYING MISCONCEPTION.

CONCEPT: ${conceptTitle}
QUESTION: ${question.question || JSON.stringify(question)}
STUDENT ANSWER: "${studentAnswer}"

Diagnose:
1. What misconception does this answer reveal?
2. Why might the student think this way?
3. What correct understanding do they need?
4. What teaching strategy would help?

Return as JSON:
{
  "misconception": "The underlying incorrect belief",
  "root_cause": "Why they might think this",
  "correct_understanding": "What they need to learn",
  "teaching_strategy": "How to address this misconception",
  "remediation_approach": "Specific steps to help them",
  "common_in_students": ["Group of students who have this misconception"]
}`;

    try {
      const response = await llmProvider.generateCompletion(
        `Diagnose misconception in: "${studentAnswer}"`,
        systemPrompt
      );

      let jsonStr = response.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Error diagnosing misconception:', error);

      return {
        misconception: 'Student may have incomplete understanding of the concept',
        root_cause: 'Insufficient grasp of foundational principles',
        correct_understanding: `${conceptTitle} requires understanding the key principles`,
        teaching_strategy: 'Use examples and analogies to clarify',
        remediation_approach: 'Start with simpler examples and build up',
        common_in_students: ['Beginners', 'Students without prerequisites']
      };
    }
  }

  /**
   * Generate personalized feedback based on performance
   */
  async generateFeedback(evaluation, studentLevel, concept) {
    if (!evaluation) {
      throw new Error('Evaluation object is required');
    }

    const tone = studentLevel === 'Beginner' ? 'encouraging and supportive' : 'constructive and specific';

    const systemPrompt = `You are an empathetic teacher providing personalized feedback.
Generate feedback that is ${tone}, specific, and actionable.

STUDENT PERFORMANCE:
- Score: ${evaluation.score}
- Correct: ${evaluation.is_correct}
- Misconceptions: ${evaluation.misconceptions?.join(', ') || 'None'}

CONCEPT: ${concept?.title || 'Unknown'}

FEEDBACK SHOULD:
1. Acknowledge what they did well
2. Be specific about what needs improvement
3. Provide actionable next steps
4. Be encouraging and growth-oriented
5. Match their learning level

Return as JSON:
{
  "encouragement": "Positive affirmation",
  "specifics": "What exactly needs work",
  "next_action": "Concrete next step",
  "resources": "What might help"
}`;

    try {
      const response = await llmProvider.generateCompletion(
        'Generate personalized feedback',
        systemPrompt
      );

      let jsonStr = response.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Error generating feedback:', error);

      return {
        encouragement: 'Keep practicing - you\'re making progress!',
        specifics: `Focus on understanding ${concept?.title || 'the concept'} better`,
        next_action: 'Try another practice question',
        resources: 'Review the lesson material'
      };
    }
  }

  /**
   * Simple check for multiple choice answers
   */
  _simpleCheck(studentAnswer, question) {
    if (question.correct_answer === undefined) return false;

    const correctOption = question.options?.[question.correct_answer];
    if (!correctOption) return false;

    // Simple string matching (not ideal but fallback)
    return studentAnswer.toLowerCase().includes(correctOption.toLowerCase()) ||
      correctOption.toLowerCase().includes(studentAnswer.toLowerCase());
  }
}

module.exports = new AnswerEvaluator();
