require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

async function listModels() {
  console.log('Checking available Gemini models...\n');
  
  // Try with v1beta
  console.log('=== Checking v1beta API ===');
  try {
    const clientBeta = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      apiVersion: 'v1beta',
    });
    
    const modelsBeta = await clientBeta.models.list();
    console.log('Available models on v1beta:');
    if (modelsBeta && modelsBeta.models) {
      modelsBeta.models.forEach(model => {
        console.log(`  - ${model.name}`);
        if (model.displayName) console.log(`    Display: ${model.displayName}`);
        if (model.supportedGenerationMethods) {
          console.log(`    Methods: ${model.supportedGenerationMethods.join(', ')}`);
        }
      });
    } else {
      console.log('  No models found or unexpected response format');
      console.log('  Response:', JSON.stringify(modelsBeta, null, 2));
    }
  } catch (error) {
    console.error('Error listing v1beta models:', error.message);
    if (error.error) {
      console.error('Details:', JSON.stringify(error.error, null, 2));
    }
  }
  
  console.log('\n=== Checking v1 API ===');
  try {
    const clientV1 = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      apiVersion: 'v1',
    });
    
    const modelsV1 = await clientV1.models.list();
    console.log('Available models on v1:');
    if (modelsV1 && modelsV1.models) {
      modelsV1.models.forEach(model => {
        console.log(`  - ${model.name}`);
        if (model.displayName) console.log(`    Display: ${model.displayName}`);
        if (model.supportedGenerationMethods) {
          console.log(`    Methods: ${model.supportedGenerationMethods.join(', ')}`);
        }
      });
    } else {
      console.log('  No models found or unexpected response format');
      console.log('  Response:', JSON.stringify(modelsV1, null, 2));
    }
  } catch (error) {
    console.error('Error listing v1 models:', error.message);
    if (error.error) {
      console.error('Details:', JSON.stringify(error.error, null, 2));
    }
  }
  
  console.log('\n=== Trying default (no version specified) ===');
  try {
    const clientDefault = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
    
    const modelsDefault = await clientDefault.models.list();
    console.log('Available models (default):');
    if (modelsDefault && modelsDefault.models) {
      modelsDefault.models.forEach(model => {
        console.log(`  - ${model.name}`);
        if (model.displayName) console.log(`    Display: ${model.displayName}`);
        if (model.supportedGenerationMethods) {
          console.log(`    Methods: ${model.supportedGenerationMethods.join(', ')}`);
        }
      });
    } else {
      console.log('  No models found or unexpected response format');
      console.log('  Response:', JSON.stringify(modelsDefault, null, 2));
    }
  } catch (error) {
    console.error('Error listing default models:', error.message);
    if (error.error) {
      console.error('Details:', JSON.stringify(error.error, null, 2));
    }
  }
}

listModels().catch(console.error);
