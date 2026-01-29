/**
 * Test Medical Document Upload & AI Processing
 * 
 * This script tests:
 * 1. Document upload
 * 2. AI processing with Gemini
 * 3. Retrieving document with insights
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

// You'll need a valid JWT token - get it by logging in first
const JWT_TOKEN = 'YOUR_JWT_TOKEN_HERE';

async function testUploadDocument() {
  try {
    console.log('🧪 Testing Medical Document Upload...\n');

    // Create a test PDF file (you can use one of the sample PDFs from earlier)
    const testFilePath = path.join(__dirname, 'test-lab-report.pdf');
    
    if (!fs.existsSync(testFilePath)) {
      console.error('❌ Test file not found. Please create a test PDF first.');
      console.log('You can use one of the sample PDFs we created earlier.');
      return;
    }

    // Create form data
    const form = new FormData();
    form.append('file', fs.createReadStream(testFilePath));
    form.append('type', 'lab_report');
    form.append('title', 'CBC Blood Test Results');
    form.append('description', 'Complete Blood Count test from Jan 2026');

    // Upload document
    console.log('📤 Uploading document...');
    const uploadResponse = await axios.post(
      `${API_BASE_URL}/medical-documents/upload`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${JWT_TOKEN}`,
        },
      }
    );

    console.log('✅ Upload successful!');
    console.log('Document ID:', uploadResponse.data.document.id);
    console.log('Status:', uploadResponse.data.document.status);
    console.log('\n⏳ AI processing started... (wait 5-10 seconds)\n');

    const documentId = uploadResponse.data.document.id;

    // Wait for AI processing
    await new Promise((resolve) => setTimeout(resolve, 10000));

    // Get document with insights
    console.log('📥 Fetching document with AI insights...');
    const getResponse = await axios.get(
      `${API_BASE_URL}/medical-documents/${documentId}`,
      {
        headers: {
          Authorization: `Bearer ${JWT_TOKEN}`,
        },
      }
    );

    console.log('\n✅ Document retrieved successfully!\n');
    console.log('=== DOCUMENT INFO ===');
    console.log('Title:', getResponse.data.document.title);
    console.log('Type:', getResponse.data.document.type);
    console.log('Status:', getResponse.data.document.status);
    console.log('File:', getResponse.data.document.fileName);

    if (getResponse.data.insight) {
      console.log('\n=== AI INSIGHTS ===');
      console.log('Summary:', getResponse.data.insight.summary);
      console.log('Confidence:', getResponse.data.insight.confidence);
      console.log('Processing Time:', getResponse.data.insight.processingTime, 'ms');
      
      if (getResponse.data.insight.structuredData.testResults) {
        console.log('\n=== TEST RESULTS ===');
        getResponse.data.insight.structuredData.testResults.forEach((test) => {
          console.log(`- ${test.testName}: ${test.value} (${test.status})`);
        });
      }

      if (getResponse.data.insight.structuredData.abnormalFindings?.length > 0) {
        console.log('\n=== ABNORMAL FINDINGS ===');
        getResponse.data.insight.structuredData.abnormalFindings.forEach((finding) => {
          console.log(`- ${finding}`);
        });
      }

      console.log('\n⚠️ Disclaimer:', getResponse.data.insight.disclaimer);
    } else {
      console.log('\n⏳ AI processing not completed yet. Try again in a few seconds.');
    }

    console.log('\n✅ Test completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
  }
}

async function testGetMyDocuments() {
  try {
    console.log('\n🧪 Testing Get My Documents...\n');

    const response = await axios.get(`${API_BASE_URL}/medical-documents/my-documents`, {
      headers: {
        Authorization: `Bearer ${JWT_TOKEN}`,
      },
    });

    console.log('✅ Retrieved', response.data.count, 'documents\n');
    
    response.data.documents.forEach((doc, index) => {
      console.log(`${index + 1}. ${doc.title}`);
      console.log(`   Type: ${doc.type}`);
      console.log(`   Status: ${doc.status}`);
      console.log(`   Has Summary: ${doc.hasSummary ? 'Yes' : 'No'}`);
      if (doc.summary) {
        console.log(`   Summary: ${doc.summary.substring(0, 100)}...`);
      }
      console.log('');
    });
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run tests
console.log('🚀 MedFlow AI - Medical Document Test Suite\n');
console.log('⚠️  Make sure to:');
console.log('1. Start the backend server (npm run dev)');
console.log('2. Replace JWT_TOKEN with a valid token');
console.log('3. Have a test PDF file ready\n');

// Uncomment to run tests
// testUploadDocument();
// testGetMyDocuments();

console.log('💡 Uncomment the test functions at the bottom of this file to run tests.');
