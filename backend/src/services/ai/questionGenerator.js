const llmProvider = require('./llmProvider');

/**
 * Question Generator Module
 * Generates diverse, adaptive questions based on student level and concept
 */
class QuestionGenerator {
  /**
   * Generate a question for a specific concept
   */
  async generateQuestion(concept, studentLevel = 'Intermediate', questionType = 'mcq') {
    if (!concept) {
      throw new Error('Concept is required');
    }

    const difficultyMap = {
      'Beginner': 'Easy',
      'Intermediate': 'Medium',
      'Advanced': 'Hard'
    };

    const difficulty = difficultyMap[studentLevel] || 'Medium';

    let typePrompt = '';
    let jsonFormat = '';

    switch (questionType.toLowerCase()) {
      case 'mcq':
        typePrompt = 'Multiple choice with 4 options (1 correct, 3 plausible distractors)';
        jsonFormat = `{
  "question": "The actual question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct_answer": 0,
  "explanation": "Why this answer is correct"
}`;
        break;
      case 'short_answer':
        typePrompt = 'Short answer question (1-2 sentences expected)';
        jsonFormat = `{
  "question": "The question text",
  "expected_keywords": ["keyword1", "keyword2"],
  "model_answer": "A good answer would be..."
}`;
        break;
      case 'conceptual':
        typePrompt = 'Conceptual question requiring explanation of understanding';
        jsonFormat = `{
  "question": "The conceptual question",
  "key_points": ["Point 1", "Point 2"],
  "model_answer": "A complete answer should mention...",
  "rubric": "How to evaluate the answer"
}`;
        break;
      default:
        typePrompt = 'Multiple choice question';
        jsonFormat = `{
  "question": "The question text",
  "options": ["A", "B", "C", "D"],
  "correct_answer": 0,
  "explanation": "Explanation of the correct answer"
}`;
    }

    const systemPrompt = `You are an expert question designer and assessment specialist.
Generate a ${difficulty} level ${typePrompt} for this concept.

CONCEPT:
Title: ${concept.title}
Description: ${concept.description || ''}
Teaching Points: ${JSON.stringify(concept.teaching_points || [])}

REQUIREMENTS:
- Difficulty: ${difficulty}
- Question Type: ${typePrompt}
- Tests whether students understand the concept
- Appropriate for a ${studentLevel} student
- Clear and unambiguous
- No trick questions

Return ONLY valid JSON:
${jsonFormat}`;

    try {
      const response = await llmProvider.generateCompletion(
        `Generate a ${difficulty} ${questionType} question about: ${concept.title}`,
        systemPrompt
      );

      let jsonStr = response.replace(/```json\n?|\n?```/g, '').trim();
      const question = JSON.parse(jsonStr);

      return {
        ...question,
        conceptTitle: concept.title,
        studentLevel,
        difficulty,
        type: questionType,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating question:', error);

      // Return a fallback question
      return {
        question: `What is a key aspect of ${concept.title}?`,
        options: [
          concept.teaching_points?.[0] || 'Correct answer',
          'Incorrect option 1',
          'Incorrect option 2',
          'Incorrect option 3'
        ],
        correct_answer: 0,
        explanation: `The correct answer relates to the main teaching point of ${concept.title}`,
        conceptTitle: concept.title,
        studentLevel,
        difficulty,
        type: 'mcq'
      };
    }
  }

  /**
   * Generate multiple questions for a lesson
   */
  async generateLessonQuestions(concepts, studentLevel = 'Intermediate', questionsPerConcept = 2) {
    if (!concepts || !Array.isArray(concepts)) {
      throw new Error('Concepts array is required');
    }

    const questionTypes = ['mcq', 'short_answer', 'conceptual'];
    const questions = [];

    for (const concept of concepts) {
      for (let i = 0; i < questionsPerConcept; i++) {
        const questionType = questionTypes[i % questionTypes.length];
        try {
          const question = await this.generateQuestion(concept, studentLevel, questionType);
          questions.push(question);

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`Failed to generate question for ${concept.title}:`, error);
        }
      }
    }

    return questions;
  }

  /**
   * Generate a practice question based on misconceptions
   */
  async generateRemediationQuestion(concept, misconception, studentLevel) {
    const systemPrompt = `You are a specialized remedial educator.
The student has the following misconception about ${concept}:
"${misconception}"

Create a question that will help them discover and correct this misconception.
Use a Socratic approach - guide them to see the error in their thinking.

Return as JSON:
{
  "question": "The guiding question",
  "hint": "A hint to help them think",
  "key_insight": "The insight they should gain"
}`;

    try {
      const response = await llmProvider.generateCompletion(
        `Help student overcome this misconception: ${misconception}`,
        systemPrompt
      );

      let jsonStr = response.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Error generating remediation question:', error);
      return {
        question: `Let's think about this aspect of ${concept} more carefully...`,
        hint: `Consider what you understand about ${concept}`,
        key_insight: `The misconception about "${misconception}" can be corrected by...`
      };
    }
  }

  /**
   * Legacy method for backwards compatibility
   */
  async generateQuestions(concept, difficulty = 'medium', count = 5) {
    const questions = [];
    for (let i = 0; i < count; i++) {
      try {
        const question = await this.generateQuestion(concept, difficulty, 'mcq');
        questions.push(question);
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error('Error generating question:', error);
      }
    }
    return questions;
  }

  /**
   * Legacy method for backwards compatibility
   */
  async generateQuizForLesson(lessonId, difficultyDistribution = null) {
    // This would need lesson data from database
    return { lessonId, questions: [] };
  }
}

module.exports = new QuestionGenerator();
