const llmProvider = require('./llmProvider');
const visualService = require('./visualService');

/**
 * Lesson Planning Service
 * Generates structured curricula, learning objectives, and concept hierarchies.
 */
class LessonPlanningService {
    async generateLessonPlan(
        topic,
        level = 'Intermediate',
        language = 'English',
        durationMinutes = 20
    ) {
        const systemPrompt = `You are an expert curriculum designer and AI Teacher.

Create a detailed, personalized lesson plan.

Topic: ${topic}
Student Level: ${level}
Language: ${language}
Available Time: ${durationMinutes} minutes

CRITICAL LANGUAGE RULE:
Generate all titles, objectives, concept titles, descriptions, teaching points, examples, and text strictly in "${language}". Keep programming code syntax or technical SQL/C++ keywords (e.g. #include, std::cout, int main, SELECT, WHERE) in standard syntax.
Do NOT output Spanish, German, French, or any other language unless "${language}" is explicitly specified as that language.

Return ONLY valid JSON.
Do not use markdown.
Do not use code fences.
Do not put newline characters inside JSON string values.
Escape quotation marks inside strings.

Required JSON structure:

{
  "title": "Lesson Title",
  "objectives": [
    "Objective 1",
    "Objective 2"
  ],
  "concepts": [
    {
      "title": "Concept Name",
      "description": "Brief description",
      "duration_minutes": 5,
      "difficulty": "Beginner",
      "teaching_points": [
        "Point 1",
        "Point 2"
      ],
      "example": "Real world example",
      "practice_question": "Question to test understanding",
      "visual": {
        "type": "mermaid" | "svg" | "html_steps" | "code",
        "title": "Diagram Title in ${language}",
        "caption": "Short explanation in ${language}",
        "content": "Mermaid diagram text or code or SVG string"
      }
    }
  ],
  "teaching_strategy": "Description of how to teach this topic",
  "common_misconceptions": [
    "Misconception 1",
    "Misconception 2"
  ],
  "assessment": {
    "type": "multiple_choice",
    "questions": [
      "Question 1",
      "Question 2"
    ]
  }
}

Make sure the response is valid JSON that can be parsed directly with JSON.parse().`;

        try {
            const response = await llmProvider.generateCompletion(
                `Generate a lesson plan for: ${topic}`,
                systemPrompt
            );

            const lessonPlan = this._parseAIJson(response);

            // Validate structure
            if (
                !lessonPlan ||
                typeof lessonPlan !== 'object' ||
                !lessonPlan.title ||
                !Array.isArray(lessonPlan.concepts)
            ) {
                throw new Error('Invalid lesson plan structure returned by AI');
            }

            // Add metadata
            lessonPlan.topic = topic;
            lessonPlan.level = level;
            lessonPlan.language = language;
            lessonPlan.created_at = new Date().toISOString();

            return lessonPlan;

        } catch (error) {
            console.error('Error generating lesson plan:', error);

            // Return fallback so the application does not crash.
            return this._createFallbackLesson(
                topic,
                level,
                language,
                durationMinutes
            );
        }
    }

    /**
     * Safely parse JSON returned by an LLM.
     */
    _parseAIJson(response) {
        if (!response || typeof response !== 'string') {
            throw new Error('AI returned an empty response');
        }

        let jsonStr = response.trim();

        // Remove markdown code fences.
        jsonStr = jsonStr
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/\s*```$/i, '')
            .trim();

        // Find the outer JSON object if the model added extra text.
        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');

        if (firstBrace !== -1 && lastBrace !== -1) {
            jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        }

        try {
            return JSON.parse(jsonStr);
        } catch (firstError) {
            console.warn(
                'Initial JSON parsing failed. Attempting cleanup...'
            );

            /*
             * Some LLMs occasionally return literal control characters
             * inside JSON strings. Escape them while preserving the
             * actual JSON structure.
             */
            let cleaned = '';
            let insideString = false;
            let escaped = false;

            for (let i = 0; i < jsonStr.length; i++) {
                const char = jsonStr[i];

                if (escaped) {
                    cleaned += char;
                    escaped = false;
                    continue;
                }

                if (char === '\\') {
                    cleaned += char;
                    escaped = true;
                    continue;
                }

                if (char === '"') {
                    insideString = !insideString;
                    cleaned += char;
                    continue;
                }

                if (insideString) {
                    if (char === '\n') {
                        cleaned += '\\n';
                        continue;
                    }

                    if (char === '\r') {
                        cleaned += '\\r';
                        continue;
                    }

                    if (char === '\t') {
                        cleaned += '\\t';
                        continue;
                    }

                    // Remove other invalid control characters.
                    if (char.charCodeAt(0) < 32) {
                        continue;
                    }
                }

                cleaned += char;
            }

            try {
                return JSON.parse(cleaned);
            } catch (secondError) {
                console.error(
                    'AI JSON parsing failed:',
                    secondError.message
                );

                console.error(
                    'AI response preview:',
                    jsonStr.substring(0, 2000)
                );

                throw firstError;
            }
        }
    }

    /**
     * Fallback lesson plan.
     */
    _createFallbackLesson(
        topic,
        level,
        language,
        durationMinutes
    ) {
        const conceptDuration = Math.max(
            1,
            Math.floor(durationMinutes / 3)
        );

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
                    description:
                        'Basic overview and foundational concepts.',
                    duration_minutes: conceptDuration,
                    difficulty: level,
                    teaching_points: [
                        'Definition',
                        'Key concepts',
                        'Importance'
                    ],
                    example: 'Real-world application',
                    practice_question: `What is ${topic}?`,
                    visual: visualService.getFallbackVisual(`Introduction to ${topic}`, topic, language)
                },

                {
                    title: `Core Principles of ${topic}`,
                    description:
                        'Key principles and how they work.',
                    duration_minutes: conceptDuration,
                    difficulty: level,
                    teaching_points: [
                        'Main principle 1',
                        'Main principle 2'
                    ],
                    example: 'Applied example',
                    practice_question:
                        'How do the principles apply here?',
                    visual: visualService.getFallbackVisual(`Core Principles of ${topic}`, topic, language)
                },

                {
                    title: 'Applications and Practice',
                    description:
                        'Practical applications of the concepts.',
                    duration_minutes: conceptDuration,
                    difficulty: level,
                    teaching_points: [
                        'Real-world usage',
                        'Best practices'
                    ],
                    example: 'Complex scenario',
                    practice_question:
                        'How would you approach this problem?',
                    visual: visualService.getFallbackVisual(`Applications of ${topic}`, topic, language)
                }
            ],

            teaching_strategy:
                `Teach ${topic} progressively from concepts to application.`,

            common_misconceptions: [
                'Misunderstanding the basic concepts',
                'Applying concepts incorrectly'
            ],

            assessment: {
                type: 'multiple_choice',
                questions: [
                    `What is the main idea behind ${topic}?`,
                    `Which statement correctly describes ${topic}?`,
                    `How can ${topic} be applied in practice?`
                ]
            },

            created_at: new Date().toISOString()
        };
    }

    /**
     * Extract concepts from lesson content.
     */
    async extractConcepts(lessonContent) {
        const systemPrompt = `You are an expert at identifying learning concepts.

From the following lesson content, extract the key concepts students need to understand.

Return ONLY valid JSON.
Do not use markdown or code fences.

Format:
[
  {
    "title": "Concept 1",
    "description": "Brief description"
  },
  {
    "title": "Concept 2",
    "description": "Brief description"
  }
]`;

        try {
            const response = await llmProvider.generateCompletion(
                lessonContent,
                systemPrompt
            );

            let jsonStr = response
                .replace(/^```json\s*/i, '')
                .replace(/^```\s*/i, '')
                .replace(/\s*```$/i, '')
                .trim();

            const firstBracket = jsonStr.indexOf('[');
            const lastBracket = jsonStr.lastIndexOf(']');

            if (
                firstBracket !== -1 &&
                lastBracket !== -1
            ) {
                jsonStr = jsonStr.substring(
                    firstBracket,
                    lastBracket + 1
                );
            }

            return JSON.parse(jsonStr);

        } catch (error) {
            console.error(
                'Error extracting concepts:',
                error
            );

            return [];
        }
    }

    /**
     * Get detailed lesson information.
     */
    async getLessonDetails(lessonData) {
        if (!lessonData || typeof lessonData !== 'object') {
            throw new Error('Invalid lesson data');
        }

        if (
            lessonData.concepts &&
            Array.isArray(lessonData.concepts)
        ) {
            return {
                ...lessonData,
                conceptCount: lessonData.concepts.length,
                estimatedTotalDuration:
                    lessonData.concepts.reduce(
                        (sum, concept) =>
                            sum +
                            (concept.duration_minutes || 5),
                        0
                    ),
                complexityLevel:
                    this._assessComplexity(lessonData)
            };
        }

        return lessonData;
    }

    /**
     * Assess lesson complexity.
     */
    _assessComplexity(lessonData) {
        if (
            !lessonData.concepts ||
            lessonData.concepts.length === 0
        ) {
            return 'Unknown';
        }

        const avgDifficulty =
            lessonData.concepts
                .map((concept) => {
                    switch (concept.difficulty) {
                        case 'Beginner':
                            return 1;
                        case 'Intermediate':
                            return 2;
                        case 'Advanced':
                            return 3;
                        default:
                            return 2;
                    }
                })
                .reduce((a, b) => a + b, 0) /
            lessonData.concepts.length;

        if (avgDifficulty < 1.5) {
            return 'Beginner';
        }

        if (avgDifficulty < 2.5) {
            return 'Intermediate';
        }

        return 'Advanced';
    }
}

module.exports = new LessonPlanningService();