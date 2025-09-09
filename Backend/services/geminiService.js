import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

let genAI;
let model;

const GEMINI_API_URL = process.env.GEMINI_API_URL;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export const initializeGemini = async () => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    console.log('🤖 Gemini AI initialized successfully');
    return true;

  } catch (error) {
    console.error('❌ Gemini AI initialization failed:', error);
    throw error;
  }
};

export const analyzeWithGemini = async (prompt, options = {}) => {
  try {
    if (!model) {
      await initializeGemini();
    }

    const {
      maxTokens = 8192,
      temperature = 0.3,
      topP = 0.8,
      topK = 40
    } = options;

    // Create the generation config
    const generationConfig = {
      temperature,
      topP,
      topK,
      maxOutputTokens: maxTokens,
    };

    // Generate content
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig
    });

    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error('No response generated from Gemini');
    }

    console.log('✅ Gemini analysis completed');
    return text;

  } catch (error) {
    console.error('Gemini analysis error:', error);
    
    // Handle specific error types
    if (error.message?.includes('SAFETY')) {
      throw new Error('Content was flagged by safety filters. Please try rephrasing your request.');
    } else if (error.message?.includes('QUOTA_EXCEEDED')) {
      throw new Error('API quota exceeded. Please try again later.');
    } else if (error.message?.includes('INVALID_API_KEY')) {
      throw new Error('Invalid API key. Please check your Gemini API configuration.');
    }
    
    throw new Error(`Analysis failed: ${error.message}`);
  }
};

export const chatWithGemini = async (prompt, conversationHistory = [], options = {}) => {
  try {
    if (!model) {
      await initializeGemini();
    }

    const {
      maxTokens = 4096,
      temperature = 0.5,
      topP = 0.9,
      topK = 40
    } = options;

    // Create the generation config for chat
    const generationConfig = {
      temperature,
      topP,
      topK,
      maxOutputTokens: maxTokens,
    };

    // Build conversation context
    const contents = [];
    
    // Add conversation history
    conversationHistory.forEach((item) => {
      contents.push({ role: 'user', parts: [{ text: item.question }] });
      contents.push({ role: 'model', parts: [{ text: item.answer }] });
    });

    // Add current prompt
    contents.push({ role: 'user', parts: [{ text: prompt }] });

    // Generate response
    const result = await model.generateContent({
      contents,
      generationConfig
    });

    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error('No response generated from Gemini');
    }

    console.log('✅ Gemini chat response completed');
    return text;

  } catch (error) {
    console.error('Gemini chat error:', error);
    
    // Handle specific error types
    if (error.message?.includes('SAFETY')) {
      throw new Error('Content was flagged by safety filters. Please try rephrasing your question.');
    } else if (error.message?.includes('QUOTA_EXCEEDED')) {
      throw new Error('API quota exceeded. Please try again later.');
    } else if (error.message?.includes('INVALID_API_KEY')) {
      throw new Error('Invalid API key. Please check your Gemini API configuration.');
    }
    
    throw new Error(`Chat failed: ${error.message}`);
  }
};

export const generateSummary = async (text, options = {}) => {
  try {
    const {
      maxLength = 500,
      style = 'comprehensive'
    } = options;

    let summaryPrompt;
    
    switch (style) {
      case 'brief':
        summaryPrompt = `Please provide a brief summary (max ${maxLength} words) of the following legal document:\n\n${text}`;
        break;
      case 'detailed':
        summaryPrompt = `Please provide a detailed analysis and summary of the following legal document. Include key parties, important clauses, dates, obligations, and potential risks:\n\n${text}`;
        break;
      default:
        summaryPrompt = `Please provide a comprehensive summary of the following legal document. Include the main purpose, key parties involved, important terms and conditions, significant dates, and any notable clauses or provisions:\n\n${text}`;
    }

    return await analyzeWithGemini(summaryPrompt, options);

  } catch (error) {
    console.error('Generate summary error:', error);
    throw error;
  }
};

export const extractKeyInformation = async (text, options = {}) => {
  try {
    const prompt = `Please extract and organize the following key information from this legal document:

1. Document Type
2. Parties Involved (names and roles)
3. Key Dates (effective dates, deadlines, expiration dates)
4. Main Obligations and Responsibilities
5. Financial Terms (amounts, payment schedules, penalties)
6. Important Clauses and Provisions
7. Potential Risks or Concerns
8. Next Steps or Action Items

Document content:
${text}

Please format the response in a clear, structured manner.`;

    return await analyzeWithGemini(prompt, options);

  } catch (error) {
    console.error('Extract key information error:', error);
    throw error;
  }
};

export { genAI, model };
