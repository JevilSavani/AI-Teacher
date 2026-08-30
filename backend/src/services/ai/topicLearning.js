const llmProvider = require('./llmProvider');

class TopicLearningService {
  /**
   * Generates a structured topic outline based on subject, level, and language
   */
  async generateTopicOutline(topic, level = 'Intermediate', language = 'English') {
    const systemPrompt = `You are an expert AI Teacher. 
Create a structured learning outline for the topic: "${topic}".
The target student's knowledge level is: ${level}.
The preferred language is: ${language}.

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
   * Explains a specific section of a topic
   */
  async explainTopicSection(courseTopic, sectionTitle, level = 'Intermediate', language = 'English') {
    const systemPrompt = `You are an expert AI Teacher. 
The student is learning about "${courseTopic}" at a ${level} level.
Their preferred language is ${language}.

Explain the following specific section: "${sectionTitle}".
Keep your explanation clear, engaging, and age/level appropriate. Use analogies and examples where helpful.
Keep the explanation concise (200-300 words).`;

    return llmProvider.generateCompletion(`Please explain: ${sectionTitle}`, systemPrompt);
  }
}

module.exports = new TopicLearningService();
