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
        durationMinutes = 20,
        studentProgress = null,
        materialContext = null
    ) {
        const is7Days = String(durationMinutes) === '7_days' || Number(durationMinutes) === 10080;
        const durNum = Number(durationMinutes) || 20;

        let timeInstruction = '';
        if (is7Days) {
            timeInstruction = `TIME REQUIREMENT: 7-DAY PERSONALIZED CURRICULUM.
Generate EXACTLY 7 concepts representing Day 1 through Day 7:
- Day 1: Foundational overview & Core Concepts
- Day 2: Mechanics & Detailed Architecture
- Day 3: Hands-on Practical Examples
- Day 4: Advanced Scenarios & Edge Cases
- Day 5: Real-World Case Studies
- Day 6: Best Practices & Common Misconceptions
- Day 7: Day 7 Revision & Final Comprehensive Evaluation
Every concept title MUST start with "Day 1:", "Day 2:", etc.
Day 7 MUST be a revision and assessment concept.`;
        } else if (durNum <= 5) {
            timeInstruction = `TIME REQUIREMENT: 5-MINUTE EXPRESS LESSON.
Generate EXACTLY 1 to 2 core concepts only. Keep explanations very short and punchy. Include minimal questions (1 quick check). Focus strictly on the single most critical takeaway.`;
        } else if (durNum <= 25) {
            timeInstruction = `TIME REQUIREMENT: 20-MINUTE STRUCTURED LESSON.
Generate EXACTLY 3 structured concepts. Include clear explanations, practical examples, visual diagrams, and 3 assessment questions.`;
        } else {
            timeInstruction = `TIME REQUIREMENT: 60-MINUTE DEEP DIVE LESSON.
Generate 5 to 6 in-depth concepts. Provide comprehensive explanations, multiple real-world code/practical examples, rich visual diagrams, deep interactive questions, and a full 5-question assessment.`;
        }

        let studentContext = '';
        if (studentProgress) {
            if (studentProgress.weakConcepts && studentProgress.weakConcepts.length > 0) {
                const weakNames = studentProgress.weakConcepts.map(w => typeof w === 'object' ? w.concept : w).join(', ');
                studentContext += `\nPERSONALIZATION NOTE: Student has known weak concepts: ${weakNames}. Give extra depth and practice for these areas.`;
            }
        }

        let docContext = '';
        if (materialContext && materialContext.ragText) {
            const scopeLabel = materialContext.sectionTitle || materialContext.chapterTitle || materialContext.documentTitle || 'Selected Chapter';
            docContext = `\nCRITICAL MATERIAL SCOPE: The student selected "${scopeLabel}". Generate concepts, explanations, and questions strictly focused ONLY on this selected material section.\nDocument Excerpt:\n${materialContext.ragText}`;
        }

        const systemPrompt = `You are an expert curriculum designer and AI Teacher.

Create a detailed, personalized lesson plan tailored to available time, selected material scope, and student needs.

Topic: ${topic}
Student Level: ${level}
Language: ${language}
${timeInstruction}
${studentContext}
${docContext}

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
  "learning_time": "${is7Days ? '7_days' : `${durNum}_min`}",
  "objectives": [
    "Objective 1",
    "Objective 2"
  ],
  "concepts": [
    {
      "title": "${is7Days ? 'Day 1: Concept Name' : 'Concept Name'}",
      "description": "Explanations tailored in depth to duration",
      "duration_minutes": ${is7Days ? 1440 : Math.max(2, Math.floor(durNum / 3))},
      "difficulty": "${level}",
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
            lessonPlan.learning_time = is7Days ? '7_days' : `${durNum}_min`;
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
        const is7Days = String(durationMinutes) === '7_days' || Number(durationMinutes) === 10080;
        const durNum = Number(durationMinutes) || 20;

        let conceptsList = [];
        if (is7Days) {
            conceptsList = Array.from({ length: 7 }, (_, i) => {
                const dayNum = i + 1;
                const title = dayNum === 7 
                    ? `Day 7: Revision & Final Assessment of ${topic}`
                    : `Day ${dayNum}: Core Phase ${dayNum} of ${topic}`;
                return {
                    title,
                    description: `Day ${dayNum} focused learning module for ${topic}.`,
                    duration_minutes: 1440,
                    difficulty: level,
                    teaching_points: [`Day ${dayNum} Core Objective`, `Practical Practice`],
                    example: `Day ${dayNum} Example Application`,
                    practice_question: `What is the key takeaway of Day ${dayNum}?`,
                    visual: visualService.getFallbackVisual(title, topic, language)
                };
            });
        } else if (durNum <= 5) {
            conceptsList = [
                {
                    title: `Essential ${topic}`,
                    description: `Concise 5-minute core breakdown of ${topic}.`,
                    duration_minutes: 5,
                    difficulty: level,
                    teaching_points: ['Core principle', 'Main takeaway'],
                    example: 'Quick practical application',
                    practice_question: `What is the most important concept in ${topic}?`,
                    visual: visualService.getFallbackVisual(`Essential ${topic}`, topic, language)
                }
            ];
        } else if (durNum <= 25) {
            conceptsList = [
                {
                    title: `Introduction to ${topic}`,
                    description: 'Basic overview and foundational concepts.',
                    duration_minutes: 7,
                    difficulty: level,
                    teaching_points: ['Definition', 'Key concepts', 'Importance'],
                    example: 'Real-world application',
                    practice_question: `What is ${topic}?`,
                    visual: visualService.getFallbackVisual(`Introduction to ${topic}`, topic, language)
                },
                {
                    title: `Core Principles of ${topic}`,
                    description: 'Key principles and mechanics.',
                    duration_minutes: 7,
                    difficulty: level,
                    teaching_points: ['Main principle 1', 'Main principle 2'],
                    example: 'Applied example',
                    practice_question: 'How do the principles apply here?',
                    visual: visualService.getFallbackVisual(`Core Principles of ${topic}`, topic, language)
                },
                {
                    title: 'Applications and Practice',
                    description: 'Practical applications of the concepts.',
                    duration_minutes: 6,
                    difficulty: level,
                    teaching_points: ['Real-world usage', 'Best practices'],
                    example: 'Complex scenario',
                    practice_question: 'How would you approach this problem?',
                    visual: visualService.getFallbackVisual(`Applications of ${topic}`, topic, language)
                }
            ];
        } else {
            // 60 minutes
            conceptsList = [
                {
                    title: `Foundations of ${topic}`,
                    description: 'Comprehensive overview and history.',
                    duration_minutes: 10,
                    difficulty: level,
                    teaching_points: ['Overview', 'Background', 'Core Concepts'],
                    example: 'Historical & modern context',
                    practice_question: `Why is ${topic} essential?`,
                    visual: visualService.getFallbackVisual(`Foundations of ${topic}`, topic, language)
                },
                {
                    title: `Mechanics & Architecture`,
                    description: 'Deep dive into inner workings.',
                    duration_minutes: 12,
                    difficulty: level,
                    teaching_points: ['System design', 'Internal state', 'Control flow'],
                    example: 'Structural breakdown',
                    practice_question: 'Explain the internal mechanics.',
                    visual: visualService.getFallbackVisual(`Architecture of ${topic}`, topic, language)
                },
                {
                    title: `Advanced Techniques`,
                    description: 'Optimizations and complex implementations.',
                    duration_minutes: 12,
                    difficulty: level,
                    teaching_points: ['Optimization 1', 'Edge cases'],
                    example: 'Advanced code example',
                    practice_question: 'How do you handle edge cases?',
                    visual: visualService.getFallbackVisual(`Advanced ${topic}`, topic, language)
                },
                {
                    title: `Real-World Case Studies`,
                    description: 'Industry examples and production deployment.',
                    duration_minutes: 13,
                    difficulty: level,
                    teaching_points: ['Case Study A', 'Case Study B'],
                    example: 'Production failure & fix',
                    practice_question: 'Identify the bug in this production setup.',
                    visual: visualService.getFallbackVisual(`Case Studies in ${topic}`, topic, language)
                },
                {
                    title: `Mastery & Assessment`,
                    description: 'Final review and synthesis.',
                    duration_minutes: 13,
                    difficulty: level,
                    teaching_points: ['Review', 'Synthesis', 'Next steps'],
                    example: 'Comprehensive scenario',
                    practice_question: 'Synthesize all 60 minutes of learning.',
                    visual: visualService.getFallbackVisual(`Mastery of ${topic}`, topic, language)
                }
            ];
        }

        return {
            title: `Learning ${topic}`,
            topic,
            level,
            language,
            learning_time: is7Days ? '7_days' : `${durNum}_min`,

            objectives: [
                `Understand the fundamentals of ${topic}`,
                `Apply concepts of ${topic} to real-world scenarios`,
                `Evaluate and analyze problems using ${topic}`
            ],

            concepts: conceptsList,

            teaching_strategy:
                `Teach ${topic} progressively from concepts to application over ${is7Days ? '7 days' : `${durNum} minutes`}.`,

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