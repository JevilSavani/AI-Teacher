const llmProvider = require('./llmProvider');

/**
 * Question Generator Module
 * Generates diverse, adaptive questions based on student level and concept
 */
class QuestionGenerator {

  /**
   * Safely extract JSON object from an LLM response.
   * Handles markdown, extra text, safety labels, etc.
   */
  _parseJSON(response) {
    if (!response || typeof response !== 'string') {
      throw new Error('Empty AI response');
    }

    let text = response.trim();

    // Remove markdown code fences
    text = text
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    // First try direct JSON parsing
    try {
      return JSON.parse(text);
    } catch (_) {
      // Continue with extraction
    }

    // Find the first JSON object
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');

    if (start === -1 || end === -1 || end <= start) {
      throw new Error(
        `No valid JSON object found in AI response: ${text.substring(0, 300)}`
      );
    }

    let jsonText = text.substring(start, end + 1);

    // Remove control characters that can break JSON parsing
    jsonText = jsonText.replace(
      /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,
      ''
    );

    return JSON.parse(jsonText);
  }

  /**
   * Generate a question for a specific concept
   */
  async generateQuestion(
    concept,
    studentLevel = 'Intermediate',
    questionType = 'mcq',
    language = 'English'
  ) {
    if (!concept) {
      throw new Error('Concept is required');
    }

    const difficultyMap = {
      Beginner: 'Easy',
      Intermediate: 'Medium',
      Advanced: 'Hard'
    };

    const difficulty =
      difficultyMap[studentLevel] || 'Medium';

    let typePrompt = '';
    let jsonFormat = '';

    switch (questionType.toLowerCase()) {

      case 'mcq':
        typePrompt =
          'Multiple choice with 4 options (1 correct, 3 plausible distractors)';

        jsonFormat = `{
  "question": "The actual question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct_answer": 0,
  "explanation": "Why this answer is correct"
}`;
        break;

      case 'short_answer':
        typePrompt =
          'Short answer question (1-2 sentences expected)';

        jsonFormat = `{
  "question": "The question text",
  "expected_keywords": ["keyword1", "keyword2"],
  "model_answer": "A good answer would be..."
}`;
        break;

      case 'conceptual':
        typePrompt =
          'Conceptual question requiring explanation of understanding';

        jsonFormat = `{
  "question": "The conceptual question",
  "key_points": ["Point 1", "Point 2"],
  "model_answer": "A complete answer should mention...",
  "rubric": "How to evaluate the answer"
}`;
        break;

      default:
        typePrompt =
          'Multiple choice question';

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
Teaching Points: ${JSON.stringify(
      concept.teaching_points || []
    )}

REQUIREMENTS:
- Language: "${language}"
- Difficulty: ${difficulty}
- Question Type: ${typePrompt}
- Tests whether students understand the concept
- Appropriate for a ${studentLevel} student
- Clear and unambiguous
- No trick questions
- CRITICAL LANGUAGE RULE: Write the question, options, and explanation strictly in "${language}". Do NOT translate programming code syntax or SQL keywords (e.g. SELECT, WHERE, ORDER BY) incorrectly — keep code elements in standard technical notation.

IMPORTANT:
Return ONLY the JSON object.
Do not include markdown.
Do not include explanations outside JSON.
Do not include safety labels.
Do not include phrases such as "User Safety".
Do not include any text before or after the JSON.

JSON FORMAT:
${jsonFormat}`;

    try {

      const response =
        await llmProvider.generateCompletion(
          `Generate a ${difficulty} ${questionType} question about: ${concept.title}`,
          systemPrompt
        );

      const question =
        this._parseJSON(response);

      // Basic validation
      if (!question.question) {
        throw new Error(
          'AI returned a question without question text'
        );
      }

      // Validate MCQ
      if (
        questionType.toLowerCase() === 'mcq'
      ) {
        if (
          !Array.isArray(question.options) ||
          question.options.length !== 4
        ) {
          throw new Error(
            'AI returned invalid MCQ options'
          );
        }

        if (
          typeof question.correct_answer !==
            'number' ||
          question.correct_answer < 0 ||
          question.correct_answer > 3
        ) {
          throw new Error(
            'AI returned invalid correct_answer'
          );
        }
      }

      return {
        ...question,
        conceptTitle: concept.title,
        studentLevel,
        difficulty,
        type: questionType,
        generatedAt:
          new Date().toISOString()
      };

    } catch (error) {

      console.error(
        'Error generating question:',
        error
      );

      // Return a fallback question
      return {
        question:
          `What is a key aspect of ${concept.title}?`,

        options: [
          concept.teaching_points?.[0] ||
            'Correct answer',
          'Incorrect option 1',
          'Incorrect option 2',
          'Incorrect option 3'
        ],

        correct_answer: 0,

        explanation:
          `The correct answer relates to the main teaching point of ${concept.title}`,

        conceptTitle: concept.title,
        studentLevel,
        difficulty,
        type: 'mcq',

        generatedAt:
          new Date().toISOString()
      };
    }
  }

  /**
   * Generate multiple questions for a lesson
   */
  async generateLessonQuestions(
    concepts,
    studentLevel = 'Intermediate',
    questionsPerConcept = 2
  ) {
    if (
      !concepts ||
      !Array.isArray(concepts)
    ) {
      throw new Error(
        'Concepts array is required'
      );
    }

    const questionTypes = [
      'mcq',
      'short_answer',
      'conceptual'
    ];

    const questions = [];

    for (const concept of concepts) {

      for (
        let i = 0;
        i < questionsPerConcept;
        i++
      ) {

        const questionType =
          questionTypes[
            i % questionTypes.length
          ];

        try {

          const question =
            await this.generateQuestion(
              concept,
              studentLevel,
              questionType
            );

          questions.push(question);

          // Small delay to avoid rate limiting
          await new Promise(
            resolve =>
              setTimeout(resolve, 500)
          );

        } catch (error) {

          console.error(
            `Failed to generate question for ${concept.title}:`,
            error
          );
        }
      }
    }

    return questions;
  }

  /**
   * Generate a practice question based on misconceptions
   */
  async generateRemediationQuestion(
    concept,
    misconception,
    studentLevel = 'Beginner',
    language = 'English'
  ) {
    const conceptTitle = typeof concept === 'object' ? (concept.title || concept.conceptTitle || 'Concept') : String(concept || 'Concept');

    const systemPrompt = `You are a specialized remedial educator.

The student is learning "${conceptTitle}" at level "${studentLevel}" in language "${language}".
They demonstrated the following specific misconception:
"${misconception || 'Unclear understanding of the core concept'}"

Generate an EASIER, targeted remedial practice question (Multiple Choice format) focused specifically on correcting this misconception.

RULES:
- Language: "${language}"
- Make the question simpler than standard questions (Beginner/Easy level).
- Focus strictly on addressing the misconception: "${misconception}".
- Provide 4 clear options (0-indexed correct_answer).
- Provide a supportive explanation that directly clarifies the misconception.
- CRITICAL LANGUAGE RULE: Write the question, options, and explanation strictly in "${language}". Do NOT translate programming code syntax or SQL keywords (e.g. SELECT, WHERE, ORDER BY) incorrectly — keep code elements in standard technical notation.
- Return ONLY valid JSON without markdown formatting.

Required JSON format:
{
  "question": "Easier guiding question text addressing the misconception",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct_answer": 0,
  "explanation": "Clear explanation of why this answer is correct and how it resolves the misconception",
  "hint": "A gentle hint for the student"
}`;

    try {
      const response = await llmProvider.generateCompletion(
        `Generate an easy remedial question for misconception: ${misconception}`,
        systemPrompt
      );

      const parsed = this._parseJSON(response);
      return {
        ...parsed,
        conceptTitle: conceptTitle,
        isRemediation: true,
        misconception: misconception
      };
    } catch (error) {
      console.error('Error generating remediation question:', error);
      return {
        question: `Let's review ${conceptTitle} with a simpler question: What is the primary principle behind ${conceptTitle}?`,
        options: [
          `Review the fundamental rule of ${conceptTitle}`,
          'Ignore the fundamental rule',
          'Apply an unrelated rule',
          'None of the above'
        ],
        correct_answer: 0,
        explanation: `Understanding this core principle will clear up the misconception about "${misconception}".`,
        conceptTitle: conceptTitle,
        isRemediation: true,
        misconception: misconception
      };
    }
  }

  /**
   * Legacy method for backwards compatibility
   */
  async generateQuestions(
    concept,
    difficulty = 'medium',
    count = 5
  ) {

    const questions = [];

    for (
      let i = 0;
      i < count;
      i++
    ) {

      try {

        const question =
          await this.generateQuestion(
            concept,
            difficulty,
            'mcq'
          );

        questions.push(question);

        await new Promise(
          resolve =>
            setTimeout(resolve, 300)
        );

      } catch (error) {

        console.error(
          'Error generating question:',
          error
        );
      }
    }

    return questions;
  }

  /**
   * Legacy method for backwards compatibility
   */
  async generateQuizForLesson(
    lessonId,
    difficultyDistribution = null
  ) {

    return {
      lessonId,
      questions: []
    };
  }
}

module.exports = new QuestionGenerator();