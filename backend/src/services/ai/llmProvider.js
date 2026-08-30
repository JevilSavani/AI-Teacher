const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');

class LLMProvider {
  constructor() {
    this.provider = process.env.DEFAULT_LLM_MODEL && process.env.DEFAULT_LLM_MODEL.includes('gpt') ? 'openai' : 'gemini';
    
    // Initialize Gemini
    if (process.env.GEMINI_API_KEY) {
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }

    // Initialize OpenAI
    if (process.env.OPENAI_API_KEY) {
      const config = { apiKey: process.env.OPENAI_API_KEY };
      if (process.env.OPENAI_BASE_URL) {
        config.baseURL = process.env.OPENAI_BASE_URL;
      }
      this.openai = new OpenAI(config);
    }
  }

  _checkConfig() {
    if (this.provider === 'gemini' && !this.genAI) {
      throw new Error('AIProviderNotConfigured: GEMINI_API_KEY is missing');
    }
    if (this.provider === 'openai' && !this.openai) {
      throw new Error('AIProviderNotConfigured: OPENAI_API_KEY is missing');
    }
  }

  async generateEmbedding(text) {
    this._checkConfig();

    if (this.provider === 'gemini') {
      const model = this.genAI.getGenerativeModel({ model: "text-embedding-004" });
      const result = await model.embedContent(text);
      return result.embedding.values;
    } else if (this.provider === 'openai') {
      const response = await this.openai.embeddings.create({
        model: process.env.EMBEDDING_MODEL || "text-embedding-3-small",
        input: text,
      });
      return response.data[0].embedding;
    }
  }

  async generateCompletion(prompt, systemInstruction = '') {
    this._checkConfig();

    if (this.provider === 'gemini') {
      const model = this.genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        systemInstruction: systemInstruction 
      });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } else if (this.provider === 'openai') {
      const messages = [];
      if (systemInstruction) {
        messages.push({ role: 'system', content: systemInstruction });
      }
      messages.push({ role: 'user', content: prompt });
      
      const response = await this.openai.chat.completions.create({
        model: process.env.DEFAULT_LLM_MODEL || "gpt-4o",
        messages: messages,
      });
      return response.choices[0].message.content;
    }
  }
}

module.exports = new LLMProvider();
