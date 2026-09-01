const llmProvider = require('./llmProvider');

/**
 * AI Teaching Engine Module
 * Orchestrates real-time conversational explanations, step-by-step Socratic teaching, and adaptive content.
 * This is the CORE of personalized teaching - NOT a chatbot.
 */
class TeachingEngine {
  /**
   * Explain a concept in a way appropriate for the student's level and understanding
   */
  async explainConcept(concept, studentContext, ragContext = '') {
    if (!concept || !studentContext) {
      throw new Error('Concept and studentContext are required');
    }

    // Build teaching context
    const teachingLevel = studentContext.knowledge_level || 'Intermediate';
    const language = studentContext.preferred_language || 'English';

    let systemPrompt = `You are an expert AI Teacher explaining a concept to a student.

TEACHING LEVEL: ${teachingLevel}
STUDENT'S LANGUAGE: ${language}
STUDENT'S GOAL: ${studentContext.learning_goal || 'General understanding'}

${ragContext ? `DOCUMENT CONTEXT:\n${ragContext}\n` : ''}

TEACHING INSTRUCTIONS:
- Adapt your explanation to the student's knowledge level
- For Beginner: Use simple language, analogies, everyday examples, small steps
- For Intermediate: Use technical terms but explain them, practical examples
- For Advanced: Include mathematical depth, implementation details, edge cases
- Start with a hook that engages the student
- Use examples before abstract definitions
- Ask rhetorical questions to engage thinking
- Keep explanations concise but complete
- Suggest next steps for deeper understanding`;

    const prompt = `Please explain this concept clearly and engagingly:\n\n${concept.title}\n\n${concept.description || ''}`;

    const explanation = await llmProvider.generateCompletion(prompt, systemPrompt);

    return {
      concept: concept.title,
      explanation,
      level: teachingLevel,
      language,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Helper to clean internal markers, tool calls, and code blocks from text
   */
  _cleanText(text) {
    if (typeof text !== 'string') return '';
    return text
      .replace(/<\|[\s\S]*?\|>/g, '') // Strip internal model/tool markers like <|tool_call_start|>...<|tool_call_end|>
      .replace(/<tool_call>[\s\S]*?<\/tool_call>/gi, '') // Strip XML-style tool call tags
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();
  }

  /**
   * Respond to a student's query/attempt in the context of a lesson
   * This is where Socratic teaching happens - guide rather than just answer
   */
  async respondToStudentQuery(studentMessage, history = [], lessonState = {}, contextData = {}) {
    if (!studentMessage) {
      throw new Error('Student message is required');
    }

    const teachingLevel = contextData.level || lessonState.knowledge_level || lessonState.level || 'Intermediate';
    const currentConcept = contextData.concept || lessonState.currentConcept || lessonState.conceptTitle || lessonState.topic || 'General Topic';
    const actualQuestion = contextData.question || lessonState.question || lessonState.currentQuestion?.question || '';
    const language = lessonState.language || 'English';

    const systemPrompt = `You are an expert Socratic AI Teacher.
Your goal is to guide the student to discover the solution on their own without giving away the answer, code, or query.

TEACHING CONTEXT:
- Question: "${actualQuestion || 'N/A'}"
- Concept: "${currentConcept}"
- Student's Input: "${studentMessage}"
- Student's Level: "${teachingLevel}"
- Language: "${language}"

STRICT INSTRUCTIONS & RULES:
1. NEVER ask what topic or problem the student is learning.
2. NEVER ask the student to repeat the question.
3. NEVER directly solve the question.
4. NEVER provide the SQL query, code, or complete solution.
   - WRONG EXAMPLE for "Find top 5 highest-paid employees": "Sort employees by salary descending and limit to 5."
   - RIGHT EXAMPLE: "Think about how you would arrange employees from highest to lowest salary. Which SQL clause allows you to order rows?"
5. Give a concise conceptual hint specific to the actual question ("${actualQuestion}") and concept ("${currentConcept}").
6. If the student says "I don't know", gives an empty answer, or is confused, give ONE small conceptual clue.
7. End with ONE clear guiding question to prompt the student's next step.
8. Keep the hint concise and appropriate to the student's level ("${teachingLevel}").
9. Do NOT output internal thoughts, tool calls, or special tags like <|tool_call_start|>.
10. Return ONLY a valid JSON object. No markdown code blocks, no preambles, no conversational text outside JSON.

REQUIRED JSON FORMAT:
{
  "teacherResponse": "specific Socratic hint",
  "next_thought": "guiding question"
}`;

    const userPrompt = `Student says: "${studentMessage}"`;

    const rawResponse = await llmProvider.generateCompletion(userPrompt, systemPrompt);

    // 1. Strip all internal model/tool markers & markdown fences
    let cleaned = this._cleanText(rawResponse);

    // 2. Safely extract JSON object if surrounded by extra text
    let cleanJsonStr = cleaned;
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanJsonStr = jsonMatch[0];
    }

    // 3. Parse JSON response
    let parsedResponse = null;
    try {
      parsedResponse = JSON.parse(cleanJsonStr);
    } catch (err) {
      console.warn('[TeachingEngine] Failed to parse JSON from LLM response, fallback to clean text:', err.message);
      parsedResponse = {
        teacherResponse: cleaned,
        next_thought: 'What do you think is the first step to approach this question?'
      };
    }

    const hint = this._cleanText(parsedResponse?.teacherResponse || parsedResponse?.guidance || cleaned);
    const nextThought = this._cleanText(parsedResponse?.next_thought || parsedResponse?.guidingQuestion || '');

    // Combined response formatted for display
    const combinedResponse = nextThought
      ? `${hint}\n\n${nextThought}`
      : hint;

    return {
      studentMessage,
      teacherResponse: combinedResponse,
      hint,
      next_thought: nextThought,
      concept: currentConcept,
      level: teachingLevel,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate the next teaching step based on student performance
   */
  async generateNextTeachingStep(lessonState, studentPerformance) {
    if (!lessonState || !studentPerformance) {
      throw new Error('lessonState and studentPerformance are required');
    }

    const systemPrompt = `You are an AI teaching orchestrator.
Based on the student's performance, determine the BEST next step.

CURRENT STATE:
- Concept: ${lessonState.currentConcept}
- Understanding: ${studentPerformance.understanding || 0}/100
- Misconceptions Detected: ${studentPerformance.misconceptions || 'None'}
- Knowledge Level: ${lessonState.knowledge_level}

DECISION LOGIC:
If understanding >= 80: Move to next concept or practice
If understanding 50-79: Provide another example or practice question
If understanding < 50: Simplify explanation, use different analogy, review basics
If misconceptions detected: Address misconception directly before proceeding

Return as JSON with:
{
  "action": "continue_explanation" | "ask_question" | "next_concept" | "review",
  "rationale": "Why this action",
  "content": "What to present next"
}`;

    try {
      const response = await llmProvider.generateCompletion(
        `Student understanding: ${studentPerformance.understanding}%, Misconceptions: ${studentPerformance.misconceptions}`,
        systemPrompt
      );

      let jsonStr = response.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Error generating next step:', error);

      // Fallback decision
      if ((studentPerformance.understanding || 0) >= 80) {
        return {
          action: 'next_concept',
          rationale: 'Student demonstrates sufficient understanding',
          content: 'Move to the next concept'
        };
      } else {
        return {
          action: 'ask_question',
          rationale: 'Assess understanding through questioning',
          content: 'Ask a practice question'
        };
      }
    }
  }
}

module.exports = new TeachingEngine();
