const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',

  db: {
    url: process.env.DATABASE_URL,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'ai_teacher',
    ssl: process.env.DB_SSL === 'true',
    poolMax: parseInt(process.env.DB_POOL_MAX, 10) || 20
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'default_dev_secret_replace_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },

  ai: {
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    defaultModel: process.env.DEFAULT_LLM_MODEL || 'gpt-4o',
    embeddingModel: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
    embeddingDimension: parseInt(process.env.EMBEDDING_DIMENSION, 10) || 1536
  },

  tts: {
    elevenlabsApiKey: process.env.ELEVENLABS_API_KEY || '',
    elevenlabsVoiceId: process.env.ELEVENLABS_VOICE_ID || '',
    azureSpeechKey: process.env.AZURE_SPEECH_KEY || '',
    azureSpeechRegion: process.env.AZURE_SPEECH_REGION || 'eastus'
  },

  video: {
    didApiKey: process.env.DID_API_KEY || '',
    heygenApiKey: process.env.HEYGEN_API_KEY || ''
  },

  upload: {
    dir: process.env.UPLOAD_DIR || 'uploads',
    maxSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 50
  }
};

module.exports = config;
