const OpenAI = require('openai');

class LLMProvider {
  constructor() {
    this.provider = 'openrouter';

    if (!process.env.OPENAI_API_KEY) {
      console.warn('[LLM] OPENAI_API_KEY is missing');
      return;
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'http://localhost:5173',
        'X-Title': process.env.OPENROUTER_APP_NAME || 'AI Teacher',
      },
    });
  }

  _checkConfig() {
    if (!this.openai) {
      throw new Error(
        'AIProviderNotConfigured: OPENAI_API_KEY is missing'
      );
    }
  }

  async generateEmbedding(text) {
    this._checkConfig();

    const model =
      process.env.EMBEDDING_MODEL || 'text-embedding-3-small';

    const response = await this.openai.embeddings.create({
      model,
      input: text,
    });

    return response.data[0].embedding;
  }

  async generateCompletion(prompt, systemInstruction = '') {
    this._checkConfig();

    const messages = [];

    if (systemInstruction) {
      messages.push({
        role: 'system',
        content: systemInstruction,
      });
    }

    messages.push({
      role: 'user',
      content: prompt,
    });

    const model =
      process.env.DEFAULT_LLM_MODEL || 'openrouter/free';

    console.log(`[LLM] Using OpenRouter model: ${model}`);

    const response = await this.openai.chat.completions.create({
      model,
      messages,
      temperature: 0.7,
    });

    const content = response.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('LLM returned an empty response');
    }

    return content;
  }

  async generateImage(prompt) {
    this._checkConfig();
    try {
      if (typeof this.openai.images?.generate === 'function') {
        const response = await this.openai.images.generate({
          prompt,
          n: 1,
          size: '512x512',
        });
        return response.data?.[0]?.url || null;
      }
    } catch (err) {
      console.warn('[LLM] Image generation unavailable or failed:', err.message);
    }
    return null;
  }
}

module.exports = new LLMProvider();