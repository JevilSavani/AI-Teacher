const llmProvider = require('./llmProvider');

class TopicLearningService {
  /**
   * Generates a structured topic outline based on subject, level, and language
   */
  async generateTopicOutline(topic, level, language = 'English') {
    const systemPrompt = `You are an expert AI Teacher. 
Create a structured learning outline for the topic: "${topic}".
The target student's knowledge level is: ${level}.
The preferred language is: ${language}.

Respond with a JSON object containing an array of modules. 
Format:
{
  "title": "Course Title",
  "modules": [
    {
      "title": "Module Title",
      "topics": ["Subtopic 1", "Subtopic 2"]
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
      throw new Error('Failed to generate a valid topic outline.');
    }
  }

  /**
   * Explains a specific section of a topic
   */
  async explainTopicSection(courseTopic, sectionTitle, level, language = 'English') {
    const systemPrompt = `You are an expert AI Teacher. 
The student is learning about "${courseTopic}" at a ${level} level.
Their preferred language is ${language}.

Explain the following specific section: "${sectionTitle}".
Keep your explanation clear, engaging, and age/level appropriate. Use analogies if helpful.`;

    return llmProvider.generateCompletion(`Please explain: ${sectionTitle}`, systemPrompt);
  }
}

module.exports = new TopicLearningService();
