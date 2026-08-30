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
   * Respond to a student's query/attempt in the context of a lesson
   * This is where Socratic teaching happens - guide rather than just answer
   */
  async respondToStudentQuery(studentMessage, history = [], lessonState = {}) {
    if (!studentMessage) {
      throw new Error('Student message is required');
    }

    const teachingLevel = lessonState.knowledge_level || 'Intermediate';
    const currentConcept = lessonState.currentConcept || 'Unknown';
    const language = lessonState.language || 'English';

    // Build conversation history for context
    const conversationHistory = history
      .slice(-5) // Last 5 exchanges
      .map((h, i) => (i % 2 === 0 ? `Student: ${h}` : `Teacher: ${h}`))
      .join('\n');

    const systemPrompt = `You are an expert Socratic AI Teacher, not a simple chatbot.
Your role is to GUIDE the student to understanding, not just give answers.

TEACHING CONTEXT:
- Student Level: ${teachingLevel}
- Current Concept: ${currentConcept}
- Language: ${language}
- Student's Learning Goal: ${lessonState.learning_goal || 'Understanding'}

SOCRATIC METHOD:
If the student:
1. Gives a CORRECT answer → Affirm, extend understanding, ask a deeper question
2. Gives a PARTIAL answer → Guide them to think about what's missing
3. Gives a WRONG answer → Ask guiding questions to help them discover the error
4. Asks a question → First ask what THEY think, then explain if needed
5. Is confused → Simplify and use an analogy or different example

COMMUNICATION:
- Use encouraging, supportive tone
- Avoid just giving answers - guide discovery
- Use examples and analogies appropriate to their level
- Point out good thinking even in wrong answers
- Help them make connections to prior knowledge
- Suggest practice or exploration

${conversationHistory ? `Recent conversation:\n${conversationHistory}\n` : ''}

Respond as a caring, knowledgeable teacher would - not as an AI assistant.`;

    const response = await llmProvider.generateCompletion(studentMessage, systemPrompt);

    return {
      studentMessage,
      teacherResponse: response,
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
