const llmProvider = require('./llmProvider');

/**
 * Lesson Planning Service Module
 * Generates structured curricula, learning objectives, and concept hierarchies.
 */
class LessonPlanningService {
    /**
     * Generates a comprehensive lesson plan based on topic, level, and constraints
     */
    async generateLessonPlan(topic, level = 'Intermediate', language = 'English', durationMinutes = 20) {
        const systemPrompt = `You are an expert curriculum designer and AI Teacher.
Create a detailed, personalized lesson plan for the following:

Topic: ${topic}
Student Level: ${level}
Language: ${language}
Available Time: ${durationMinutes} minutes

Generate a STRUCTURED lesson plan in JSON format with:
1. Learning objectives (2-4 clear objectives)
2. Key concepts (ordered list of concepts to teach)
3. Teaching strategy (explanation approach)
4. Estimated duration for each concept
5. Example scenarios
6. Practice questions for each concept
7. Common misconceptions to address
8. Assessment strategy

CRITICAL: The structure must be valid JSON. Return ONLY JSON, no markdown wrapping.
Format strictly as:
{
  "title": "Lesson Title",
  "objectives": ["Objective 1", "Objective 2"],
  "concepts": [
    {
      "title": "Concept Name",
      "description": "Brief description",
      "duration_minutes": 5,
      "difficulty": "Beginner",
      "teaching_points": ["Point 1", "Point 2"],
      "example": "Real world example",
      "practice_question": "Question to test understanding"
    }
  ],
  "teaching_strategy": "Description of how to teach this topic",
  "common_misconceptions": ["Misconception 1", "Misconception 2"],
  "assessment": {
    "type": "multiple_choice",
    "questions": ["Q1", "Q2"]
  }
}`;

        try {
            const response = await llmProvider.generateCompletion(
                `Generate a lesson plan for: ${topic}`,
                systemPrompt
            );

            // Clean and parse response
            let jsonStr = response;

            // Remove markdown code blocks if present
            if (jsonStr.includes('```json')) {
                jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            } else if (jsonStr.includes('```')) {
                jsonStr = jsonStr.replace(/```\n?/g, '').trim();
            }

            const lessonPlan = JSON.parse(jsonStr);

            // Validate structure
            if (!lessonPlan.title || !lessonPlan.concepts || !Array.isArray(lessonPlan.concepts)) {
                throw new Error('Invalid lesson plan structure');
            }

            // Add metadata
            lessonPlan.topic = topic;
            lessonPlan.level = level;
            lessonPlan.language = language;
            lessonPlan.created_at = new Date().toISOString();

            return lessonPlan;
        } catch (error) {
            console.error('Error generating lesson plan:', error);

            // Return a fallback lesson plan
            return {
                title: `Learning ${topic}`,
                topic,
                level,
                language,
                objectives: [
                    `Understand the fundamentals of ${topic}`,
                    `Apply concepts of ${topic} to real-world scenarios`,
                    `Evaluate and analyze problems using ${topic}`
                ],
                concepts: [
                    {
                        title: `Introduction to ${topic}`,
                        description: `Basic overview and foundational concepts`,
                        duration_minutes: Math.floor(durationMinutes / 3),
                        difficulty: level,
                        teaching_points: ['Definition', 'Key concepts', 'Importance'],
                        example: 'Real-world application',
                        practice_question: `What is ${topic}?`
                    },
                    {
                        title: `Core Principles of ${topic}`,
                        description: `Key principles and how they work`,
                        duration_minutes: Math.floor(durationMinutes / 3),
                        difficulty: level,
                        teaching_points: ['Main principle 1', 'Main principle 2'],
                        example: 'Applied example',
                        practice_question: 'How do the principles apply here?'
                    },
                    {
                        title: `Applications and Practice`,
                        description: `Practical applications of concepts`,
                        duration_minutes: Math.floor(durationMinutes / 3),
                        difficulty: level,
                        teaching_points: ['Real-world usage', 'Best practices'],
                        example: 'Complex scenario',
                        practice_question: 'How would you approach this problem?'
                    }
                ],
                teaching_strategy: `Teach ${topic} progressively from concepts to application`,
                common_misconceptions: ['Misunderstanding 1', 'Misunderstanding 2'],
                assessment: {
                    type: 'multiple_choice',
                    questions: ['Question 1', 'Question 2', 'Question 3']
                },
                created_at: new Date().toISOString()
            };
        }
    }

    /**
     * Extract specific concepts from lesson content
     */
    async extractConcepts(lessonContent) {
        const systemPrompt = `You are an expert at identifying learning concepts.
From the following lesson content, extract the key concepts that students need to understand.
Return as a JSON array of concept objects with title and description.

Format:
[
  { "title": "Concept 1", "description": "Brief description" },
  { "title": "Concept 2", "description": "Brief description" }
]`;

        try {
            const response = await llmProvider.generateCompletion(
                lessonContent,
                systemPrompt
            );

            let jsonStr = response.replace(/```json\n?|\n?```/g, '').trim();
            return JSON.parse(jsonStr);
        } catch (error) {
            console.error('Error extracting concepts:', error);
            return [];
        }
    }

    /**
     * Get detailed information about a specific lesson
     */
    async getLessonDetails(lessonData) {
        if (!lessonData || typeof lessonData !== 'object') {
            throw new Error('Invalid lesson data');
        }

        // If lessonData is already a lesson plan JSON, return enhanced version
        if (lessonData.concepts && Array.isArray(lessonData.concepts)) {
            return {
                ...lessonData,
                conceptCount: lessonData.concepts.length,
                estimatedTotalDuration: lessonData.concepts.reduce((sum, c) => sum + (c.duration_minutes || 5), 0),
                complexityLevel: this._assessComplexity(lessonData)
            };
        }

        return lessonData;
    }

    /**
     * Assess the complexity level of a lesson
     */
    _assessComplexity(lessonData) {
        if (!lessonData.concepts || lessonData.concepts.length === 0) return 'Unknown';

        const avgDifficulty = lessonData.concepts
            .map(c => {
                switch (c.difficulty) {
                    case 'Beginner': return 1;
                    case 'Intermediate': return 2;
                    case 'Advanced': return 3;
                    default: return 2;
                }
            })
            .reduce((a, b) => a + b, 0) / lessonData.concepts.length;

        if (avgDifficulty < 1.5) return 'Beginner';
        if (avgDifficulty < 2.5) return 'Intermediate';
        return 'Advanced';
    }
}

module.exports = new LessonPlanningService();
