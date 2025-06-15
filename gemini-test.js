// Simple script to test if the Gemini API key works
const { GoogleGenAI } = require('@google/genai');

// Use the API key directly for testing
const API_KEY = 'AIzaSyDLzE1QRGxF1jLIFtvrUlFpua78VruMNjM';

const testGeminiAPI = async () => {
  try {
    console.log('Testing Gemini API with key:', API_KEY ? 'Key exists (not showing for security)' : 'No key found');
    
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    console.log('Gemini client created successfully');
    
    console.log('Sending test request to Gemini API...');
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-05-20',
      contents: 'Hello, Gemini! This is a test message.'
    });
    
    console.log('Response received successfully!');
    console.log('Response text:', response.text);
    
    console.log('\nAPI TEST SUCCESSFUL! ✅');
  } catch (error) {
    console.error('API TEST FAILED! ❌');
    console.error('Error testing Gemini API:', error);
  }
};

testGeminiAPI(); 