const llmProvider = require('./llmProvider');
const visualService = require('./visualService');

class TopicLearningService {
  /**
   * Generates a structured topic outline based on subject, level, and language
   */
  async generateTopicOutline(topic, level = 'Intermediate', language = 'English') {
    const systemPrompt = `You are an expert AI Teacher. 
Create a structured learning outline for the topic: "${topic}".
The target student's knowledge level is: ${level}.
The preferred language is strictly: ${language}.

CRITICAL LANGUAGE RULE:
Generate all course titles, module titles, descriptions, and concept titles strictly in "${language}". Keep programming code syntax (e.g. C++, Java, Python, SQL) in standard code notation.
Do NOT use Spanish, German, French, or any other language unless "${language}" is explicitly specified as that language.

Respond with a JSON object containing:
- title: the course title
- description: brief description
- modules: array of modules with concepts

Format:
{
  "title": "Course Title",
  "description": "Brief description",
  "modules": [
    {
      "title": "Module 1 Title",
      "description": "What this module covers",
      "concepts": ["Concept 1", "Concept 2"]
    }
  ]
}`;

    const response = await llmProvider.generateCompletion('Generate the outline.', systemPrompt);

    try {
      // Extract JSON if it's wrapped in markdown code blocks
      const jsonStr = response.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Failed to parse topic outline JSON:', error);
      console.log('Raw response:', response);
      // Return a default structure if parsing fails
      return {
        title: topic,
        description: `Learning material for ${topic}`,
        modules: [
          {
            title: `Introduction to ${topic}`,
            description: `Foundational concepts of ${topic}`,
            concepts: ['Overview', 'Key Principles', 'Applications']
          }
        ]
      };
    }
  }

  /**
   * Explains a specific section of a topic with an accompanying visual diagram
   */
  async explainTopicSection(courseTopic, sectionTitle, level = 'Intermediate', language = 'English') {
    const systemPrompt = `You are an expert AI Teacher. 
The student is learning about "${courseTopic}" at a ${level} level.
Their preferred language is strictly: ${language}.

CRITICAL LANGUAGE RULE:
Write your explanation strictly in ${language}. Do NOT write in Spanish or German unless ${language} is explicitly set to Spanish or German.

Explain the following specific section: "${sectionTitle}".
Keep your explanation clear, engaging, and age/level appropriate. Use analogies, step-by-step points, and examples where helpful.
If applicable, include a Mermaid diagram block (using \`\`\`mermaid ... \`\`\`) or code block (using \`\`\`language ... \`\`\`) inside your explanation.
Keep the text clean and educational (200-300 words).`;

    const explanationText = await llmProvider.generateCompletion(`Please explain: ${sectionTitle}`, systemPrompt);
    const visual = await visualService.generateVisualExplanation(sectionTitle, courseTopic, language, level);

    return {
      explanation: explanationText,
      visual
    };
  }
}

module.exports = new TopicLearningService();
