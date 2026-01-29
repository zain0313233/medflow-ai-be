import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import MedicalDocument from '../models/MedicalDocument';
import DocumentInsight, { IDocumentInsight } from '../models/DocumentInsight';

// Initialize Gemini AI with v1 SDK
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

/**
 * Process medical document with AI
 * Extracts text and generates patient-friendly summary
 */
export async function processMedicalDocument(documentId: string): Promise<IDocumentInsight> {
  const startTime = Date.now();

  try {
    // Get document from DB
    const document = await MedicalDocument.findById(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    // Update status to processing
    document.status = 'processing';
    await document.save();

    // Read file from disk (adjust path based on your storage)
    const filePath = document.fileUrl;
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const fileData = fs.readFileSync(filePath);
    const base64Data = fileData.toString('base64');

    // Prepare file part for Gemini v1 API
    const filePart = {
      inlineData: {
        data: base64Data,
        mimeType: document.mimeType,
      },
    };

    // Create prompt based on document type
    const prompt = createPromptForDocumentType(document.type);

    // Generate content using v1 SDK (correct structure)
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            filePart,
          ],
        },
      ],
    });

    const responseText = response.text;
    
    if (!responseText) {
      throw new Error('No response from AI model');
    }

    // Parse AI response (expecting JSON)
    let parsedData;
    try {
      // Extract JSON from response (in case AI adds extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        parsedData = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText);
      throw new Error('AI response is not valid JSON');
    }

    // Calculate processing time
    const processingTime = Date.now() - startTime;

    // Create document insight
    const insight = await DocumentInsight.create({
      documentId: document._id,
      extractedText: parsedData.extractedText || '',
      aiSummary: parsedData.summary || '',
      structuredData: {
        conditions: parsedData.conditions || [],
        medications: parsedData.medications || [],
        lifestyleAdvice: parsedData.lifestyleAdvice || [],
        dietRestrictions: parsedData.dietRestrictions || [],
        exercises: parsedData.exercises || [],
        followUp: parsedData.followUp || '',
        abnormalFindings: parsedData.abnormalFindings || [],
        testResults: parsedData.testResults || [],
      },
      flags: parsedData.flags || [],
      confidence: parsedData.confidence || 'medium',
      processingTime,
    });

    // Update document status
    document.status = 'completed';
    await document.save();

    return insight;
  } catch (error) {
    console.error('Error processing medical document:', error);
    
    // Update document status to failed
    const document = await MedicalDocument.findById(documentId);
    if (document) {
      document.status = 'failed';
      await document.save();
    }

    throw error;
  }
}

/**
 * Create appropriate prompt based on document type
 */
function createPromptForDocumentType(type: string): string {
  const baseInstructions = `
You are a medical document assistant. Your job is to extract information and summarize in simple, patient-friendly language.

CRITICAL RULES:
- Do NOT diagnose
- Do NOT change doctor's instructions
- Do NOT add new medical advice
- Only explain what is written in the document
- Use simple, non-medical language
- Always include disclaimer

Output MUST be valid JSON format.
`;

  const typeSpecificPrompts: Record<string, string> = {
    lab_report: `${baseInstructions}

This is a LAB REPORT. Extract:
1. Test name and date
2. Test results with values
3. Abnormal findings (if any)
4. Simple explanation of what results mean

JSON Format:
{
  "extractedText": "full text from document",
  "summary": "Simple explanation for patient",
  "testResults": [
    {
      "testName": "Test name",
      "value": "Result value",
      "normalRange": "Normal range",
      "status": "normal|high|low|abnormal"
    }
  ],
  "abnormalFindings": ["List of abnormal findings"],
  "flags": ["review_required", "abnormal"],
  "confidence": "high|medium|low"
}`,

    xray_report: `${baseInstructions}

This is an X-RAY/RADIOLOGY REPORT. Extract:
1. Study type and date
2. Findings
3. Impression/conclusion
4. Simple explanation

JSON Format:
{
  "extractedText": "full text from document",
  "summary": "Simple explanation for patient",
  "abnormalFindings": ["List of findings"],
  "flags": ["review_required"],
  "confidence": "high|medium|low"
}`,

    prescription: `${baseInstructions}

This is a PRESCRIPTION. Extract:
1. Medicines with dosage
2. Frequency and duration
3. Instructions

JSON Format:
{
  "extractedText": "full text from document",
  "summary": "Simple explanation of medicines",
  "medications": [
    {
      "name": "Medicine name",
      "dosage": "Dosage",
      "frequency": "How often",
      "duration": "How long",
      "purpose": "What it's for"
    }
  ],
  "flags": [],
  "confidence": "high|medium|low"
}`,

    vaccination_record: `${baseInstructions}

This is a VACCINATION RECORD. Extract:
1. Vaccines given (with dates)
2. Vaccines due
3. Next vaccination date

JSON Format:
{
  "extractedText": "full text from document",
  "summary": "Simple explanation of vaccination status",
  "medications": [
    {
      "name": "Vaccine name",
      "dosage": "Date given or Due date"
    }
  ],
  "followUp": "Next vaccination date",
  "flags": [],
  "confidence": "high|medium|low"
}`,

    medical_report: `${baseInstructions}

This is a MEDICAL REPORT from doctor. Extract:
1. Diagnosis/conditions
2. Prescribed medicines
3. Lifestyle advice
4. Diet restrictions
5. Exercises
6. Follow-up instructions

JSON Format:
{
  "extractedText": "full text from document",
  "summary": "Simple explanation of doctor's report",
  "conditions": ["List of conditions"],
  "medications": [
    {
      "name": "Medicine name",
      "dosage": "Dosage",
      "frequency": "How often",
      "duration": "How long",
      "purpose": "What it's for"
    }
  ],
  "lifestyleAdvice": ["List of lifestyle advice"],
  "dietRestrictions": ["Foods to avoid"],
  "exercises": ["Exercise recommendations"],
  "followUp": "Follow-up instructions",
  "flags": [],
  "confidence": "high|medium|low"
}`,
  };

  return typeSpecificPrompts[type] || typeSpecificPrompts.medical_report;
}

/**
 * Get document with insights
 */
export async function getDocumentWithInsights(documentId: string) {
  const document = await MedicalDocument.findById(documentId);
  if (!document) {
    throw new Error('Document not found');
  }

  const insight = await DocumentInsight.findOne({ documentId: document._id });

  return {
    document,
    insight,
  };
}

/**
 * Get all documents for a user
 */
export async function getUserDocuments(userId: string, type?: string) {
  const query: any = { userId };
  if (type) {
    query.type = type;
  }

  const documents = await MedicalDocument.find(query)
    .sort({ createdAt: -1 })
    .lean();

  // Get insights for each document
  const documentsWithInsights = await Promise.all(
    documents.map(async (doc) => {
      const insight = await DocumentInsight.findOne({ documentId: doc._id }).lean();
      return {
        ...doc,
        insight,
      };
    })
  );

  return documentsWithInsights;
}
