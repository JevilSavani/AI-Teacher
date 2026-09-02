const llmProvider = require('./llmProvider');

/**
 * Visual Explanation Service
 * Generates and formats visual aids (Mermaid diagrams, SVG graphics, HTML step cards, code blocks)
 * for lessons, concepts, explanations, and remedial guidance.
 */
class VisualService {
  /**
   * Generates a visual explanation object based on concept, topic, subject, and student language.
   * If image generation fails or is unavailable, seamlessly falls back to Mermaid/SVG/HTML diagrams.
   */
  async generateVisualExplanation(conceptTitle, topic, language = 'English', level = 'Intermediate') {
    const systemPrompt = `You are an expert visual educator and diagram designer.
Create a educational visual explanation for the concept "${conceptTitle}" within the topic "${topic}".

STUDENT LEVEL: ${level}
PREFERRED LANGUAGE: Strictly ${language}

CRITICAL RULES:
1. All node labels, titles, descriptions, and step names MUST be strictly written in ${language}. Keep programming language keywords (e.g. std::cout, function, SELECT, def, if/else) in standard syntax.
2. Select the most effective visual format for this concept:
   - "mermaid": Use standard Mermaid graph (flowchart TD, graph LR, sequenceDiagram, timeline, mindmap, stateDiagram-v2).
   - "svg": Clean, standalone responsive SVG markup (max width 600px, viewBox 0 0 600 300) with styled boxes/arrows/circles and legible text labels.
   - "html_steps": Ordered step-by-step process/pipeline (array of steps with number, title, description, and icon name e.g. "sparkles", "arrow-right", "check", "zap", "brain", "code", "database").
   - "code": Code example with language identifier and detailed inline comments.
3. Keep the visual concise, accurate, educational, and easy to read.

Return ONLY valid JSON:
{
  "type": "mermaid" | "svg" | "html_steps" | "code",
  "title": "Visual Title in ${language}",
  "caption": "Brief 1-sentence summary of what this visual illustrates in ${language}",
  "content": "The Mermaid markup, SVG markup, code snippet, or string JSON for html_steps",
  "steps": [
    {
      "step_number": 1,
      "title": "Step 1 Title in ${language}",
      "description": "Step 1 description in ${language}",
      "icon": "zap"
    }
  ] // Only required if type is "html_steps"
}`;

    try {
      const response = await llmProvider.generateCompletion(
        `Generate visual explanation for: ${conceptTitle} (${topic})`,
        systemPrompt
      );

      const parsed = this._parseAIJson(response);

      if (parsed && (parsed.content || parsed.steps)) {
        return {
          type: parsed.type || 'html_steps',
          title: parsed.title || conceptTitle,
          caption: parsed.caption || '',
          content: parsed.content || '',
          steps: parsed.steps || []
        };
      }
    } catch (error) {
      console.warn(`[VisualService] LLM visual generation failed for "${conceptTitle}", using smart fallback:`, error.message);
    }

    return this.getFallbackVisual(conceptTitle, topic, language);
  }

  /**
   * Generates visual remediation specifically designed for a weak concept or misconception.
   */
  async generateRemedialVisual(weakConcept, misconception, language = 'English') {
    const systemPrompt = `You are a learning scientist. A student had a misconception regarding "${weakConcept}":
Misconception: "${misconception}"

Create a clear visual contrast or step-by-step visual diagram in strictly ${language} that clears up this specific misconception.

Return ONLY valid JSON:
{
  "type": "mermaid" | "svg" | "html_steps" | "code",
  "title": "Correcting: ${weakConcept}",
  "caption": "Visual clarification in ${language}",
  "content": "Mermaid diagram, SVG, or code snippet clearing the confusion",
  "steps": [
    { "step_number": 1, "title": "Common Pitfall", "description": "...", "icon": "alert-triangle" },
    { "step_number": 2, "title": "Correct Principle", "description": "...", "icon": "check-circle" }
  ]
}`;

    try {
      const response = await llmProvider.generateCompletion(
        `Generate visual remediation for misconception "${misconception}" on "${weakConcept}"`,
        systemPrompt
      );
      const parsed = this._parseAIJson(response);
      if (parsed && (parsed.content || parsed.steps)) {
        return parsed;
      }
    } catch (error) {
      console.warn('[VisualService] Remedial visual generation failed, using fallback:', error.message);
    }

    return {
      type: 'html_steps',
      title: `Key Insight: ${weakConcept}`,
      caption: `Clearing up: ${misconception}`,
      steps: [
        { step_number: 1, title: 'Concept Focus', description: `Review the core mechanics of ${weakConcept}.`, icon: 'search' },
        { step_number: 2, title: 'Key Takeaway', description: misconception ? `Remember: ${misconception}` : `Apply the step-by-step rules.`, icon: 'sparkles' }
      ]
    };
  }

  /**
   * Helper to safely parse JSON response from LLM
   */
  _parseAIJson(response) {
    if (!response || typeof response !== 'string') return null;
    let jsonStr = response
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const firstBrace = jsonStr.indexOf('{');
    const lastBrace = jsonStr.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
    }

    try {
      return JSON.parse(jsonStr);
    } catch (e) {
      return null;
    }
  }

  /**
   * Smart SVG/Mermaid/HTML Fallback Generator based on topic/concept
   */
  getFallbackVisual(conceptTitle, topic, language = 'English') {
    const isProg = /code|algorithm|javascript|python|c\+\+|java|react|database|sql|function|loop|array|node/i.test(`${conceptTitle} ${topic}`);
    const isMath = /math|algebra|geometry|calculus|equation|fraction|matrix/i.test(`${conceptTitle} ${topic}`);
    const isScience = /physics|chemistry|biology|science|cell|molecule|atom|force|energy|water/i.test(`${conceptTitle} ${topic}`);
    
    if (isProg) {
      return {
        type: 'mermaid',
        title: `${conceptTitle} Flow`,
        caption: `Visual process for ${conceptTitle}`,
        content: `graph TD\n    A["Start: ${conceptTitle}"] --> B["Input / Initialization"]\n    B --> C{"Condition Check?"}\n    C -- Yes --> D["Execute Core Step"]\n    D --> E["Update State"]\n    E --> C\n    C -- No --> F["End / Return Result"]`
      };
    } else if (isScience || isMath) {
      return {
        type: 'html_steps',
        title: `Understanding ${conceptTitle}`,
        caption: `Core breakdown of ${conceptTitle}`,
        steps: [
          { step_number: 1, title: 'Observe & Identify', description: `Define the primary elements of ${conceptTitle}.`, icon: 'eye' },
          { step_number: 2, title: 'Process & Transform', description: `Examine interactions and mechanisms involved.`, icon: 'zap' },
          { step_number: 3, title: 'Outcome & Synthesis', description: `Evaluate the resulting state or solution.`, icon: 'check-circle' }
        ]
      };
    } else {
      return {
        type: 'html_steps',
        title: `${conceptTitle} Overview`,
        caption: `Step-by-step visual summary of ${conceptTitle}`,
        steps: [
          { step_number: 1, title: 'Foundation', description: `Key definition of ${conceptTitle}.`, icon: 'book-open' },
          { step_number: 2, title: 'Application', description: `How ${conceptTitle} functions in practice.`, icon: 'target' },
          { step_number: 3, title: 'Mastery', description: `Connecting ${conceptTitle} to broader concepts.`, icon: 'award' }
        ]
      };
    }
  }
}

module.exports = new VisualService();
