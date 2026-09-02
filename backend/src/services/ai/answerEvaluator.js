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
  async evaluateAnswer(question, studentAnswer, studentLevel = 'Intermediate', language = 'English', ragContext = null) {
    if (!question || !studentAnswer) {
      throw new Error('Question and studentAnswer are required');
    }

    let docGroundingPrompt = '';
    if (ragContext) {
      docGroundingPrompt = `\nDOCUMENT GROUNDING CONTEXT:\n${ragContext}\nEvaluate strictly against this material. Do not hallucinate external facts.`;
    }

    const systemPrompt = `You are an expert pedagogical evaluator and diagnostic learning scientist.
Evaluate the student's answer carefully and distinguish:
- "correct": Score 85-100. Complete, accurate reasoning.
- "partially_correct": Score 50-84. Correct intuition but incomplete or missing key steps.
- "incorrect": Score 0-49. Factually wrong answer.
- "misconception": Score 0-49. Clear underlying flawed logic, assumption, or confused reasoning.

QUESTION:
${JSON.stringify(question, null, 2)}

STUDENT ANSWER: "${studentAnswer}"
STUDENT LEVEL: ${studentLevel}
LANGUAGE: ${language}
${docGroundingPrompt}

CRITICAL LANGUAGE RULE: Write feedback, diagnosis, alternative_explanation, new_example, and misconceptions strictly in "${language}". Keep standard programming keywords unchanged.

Return ONLY valid JSON:
{
  "score": 0-100,
  "is_correct": true/false,
  "answer_status": "correct" | "partially_correct" | "incorrect" | "misconception",
  "feedback": "Honest, encouraging feedback",
  "diagnosis": "Explain specifically WHY the student's thinking or reasoning is incorrect/incomplete",
  "alternative_explanation": "Re-explain the concept using a fresh analogy or simplified step-by-step breakdown",
  "new_example": "A new concrete code snippet or real-world example illustrating the correct concept",
  "strengths": ["What they understood correctly"],
  "improvements": ["Specific areas to improve"],
  "misconceptions": ["Identified misconception"],
  "next_step": "What they should focus on",
  "should_move_forward": true/false
}`;

    try {
      const response = await llmProvider.generateCompletion(
        `Evaluate this answer: "${studentAnswer}"`,
        systemPrompt
      );

      let jsonStr = response.replace(/```json\n?|\n?```/g, '').trim();
      const evaluation = JSON.parse(jsonStr);

      const isCorrect = evaluation.is_correct || evaluation.score >= 70;
      const status = evaluation.answer_status || (isCorrect ? 'correct' : (evaluation.score >= 50 ? 'partially_correct' : 'incorrect'));

      return {
        ...evaluation,
        answer_status: status,
        is_correct: isCorrect,
        should_move_forward: isCorrect,
        studentAnswer,
        questionId: question.id || null,
        evaluatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error evaluating answer:', error);

      const isCorrect = this._simpleCheck(studentAnswer, question);
      return {
        score: isCorrect ? 100 : 30,
        is_correct: isCorrect,
        answer_status: isCorrect ? 'correct' : 'incorrect',
        correctness_confidence: 0.7,
        feedback: isCorrect
          ? 'Good job! Your answer is correct.'
          : 'This answer needs review. Please think more carefully about the concept.',
        diagnosis: isCorrect ? null : 'The answer does not match the core requirements of the question.',
        alternative_explanation: isCorrect ? null : 'Consider breaking down the concept into simpler steps.',
        new_example: isCorrect ? null : 'Review a basic example before trying again.',
        strengths: isCorrect ? ['Correct understanding'] : [],
        improvements: isCorrect ? [] : ['Review the concept', 'Try again'],
        misconceptions: isCorrect ? [] : ['Incomplete concept grasp'],
        next_step: isCorrect ? 'Move to next question' : 'Review re-explanation and re-evaluate',
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
  async generateFeedback(evaluation, studentLevel, concept, language = 'English') {
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
LANGUAGE: ${language}

CRITICAL LANGUAGE RULE: Write feedback strictly in "${language}".

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
