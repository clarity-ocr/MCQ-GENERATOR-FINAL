import { GoogleGenAI, Type } from "@google/genai";
import type { FormState, MCQ } from "../types";
import { AiProvider } from "../types";

// IMPORTANT: In a production application, API keys must be stored securely as environment variables.
// For the purpose of this interactive demo environment, the Groq API key is defined here
// as provided by the user, because this environment doesn't support setting custom environment variables.
const GROQ_API_KEY = "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";

const buildPrompt = (inputs: FormState): string => {
  const { topic, difficulty, taxonomy, questions, studyMaterial, imageData } = inputs;
  const safeQuestions = Math.max(1, Math.min(100, questions));
  const hasContent = !!studyMaterial || !!imageData;
  const contentSource = imageData ? "the provided image" : "the provided study material";

  return `
You are an Quizly AI. ALWAYS return only valid JSON (no explanation, no extra text).
Inputs:
- topic: "${topic}"
- difficulty: "${difficulty}"
- taxonomy: "${taxonomy}"
- questions: ${safeQuestions}
- studyMaterial: "${studyMaterial}" // This may be empty, especially if an image is provided.
- image provided: ${!!imageData}

Rules:
1) If content is provided (${hasContent ? contentSource : 'none'}) -> generate MCQs ONLY from that content.
2) If no content is provided -> generate MCQs using general knowledge of the topic.
3) If topic is also empty and no content is provided -> generate ${safeQuestions} general Computer Science MCQs.
4) Output EXACTLY ${safeQuestions} questions (no fewer, no more).
5) The final JSON output must be an array of objects.
6) Each item must be:
   {
     "question": "string",
     "options": ["opt1","opt2","opt3","opt4"],
     "answer": "one of the options exactly",
     "explanation": "short reason"
   }
7) Options must be unique; answer must match an option; explanation <= 30 words.

Now generate ${safeQuestions} MCQs.
  `;
};

const mcqSchema = {
  type: Type.OBJECT,
  properties: {
    question: { type: Type.STRING, description: "The question text." },
    options: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "An array of 4 possible answers."
    },
    answer: { type: Type.STRING, description: "The correct answer, must match one of the options." },
    explanation: { type: Type.STRING, description: "A brief explanation for the correct answer." },
  },
  required: ["question", "options", "answer", "explanation"],
};

const mcqListSchema = {
  type: Type.ARRAY,
  items: mcqSchema,
};

const validateMcqs = (parsedMcqs: any, requestedQuestions: number, provider: string): MCQ[] => {
    if (!Array.isArray(parsedMcqs)) {
        throw new Error(`AI (${provider}) response was not a valid JSON array. Cannot process the result.`);
    }

    // If the AI returns more questions, truncate the list.
    if (parsedMcqs.length > requestedQuestions) {
        console.warn(`AI (${provider}) returned ${parsedMcqs.length} questions instead of ${requestedQuestions}. The result will be truncated.`);
        parsedMcqs = parsedMcqs.slice(0, requestedQuestions);
    } 
    // If it returns fewer, it's an error because we can't meet the user's request.
    else if (parsedMcqs.length < requestedQuestions) {
      throw new Error(`AI (${provider}) returned an incorrect number of questions. Expected ${requestedQuestions}, got ${parsedMcqs.length}.`);
    }
    
    parsedMcqs.forEach((mcq, index) => {
        if (!mcq.question || !mcq.options || !mcq.answer || !mcq.explanation || !Array.isArray(mcq.options) || mcq.options.length !== 4 || !mcq.options.includes(mcq.answer)) {
            throw new Error(`Validation failed for question #${index + 1} from ${provider}. The AI returned an invalid structure.`);
        }
    });

    return parsedMcqs as MCQ[];
}

const _generateWithGroq = async (formData: FormState): Promise<MCQ[]> => {
    if (!GROQ_API_KEY) {
        throw new Error("Groq API key is not configured. Please add it to continue.");
    }
    
    const prompt = buildPrompt(formData);
    const requestedQuestions = Math.max(1, Math.min(100, formData.questions));

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: [{ role: 'user', content: prompt }],
                model: 'meta-llama/llama-4-scout-17b-16e-instruct',
                temperature: 0.7,
                max_tokens: 8192,
                top_p: 1,
            }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("Groq API error response:", errorBody);
            throw new Error(`Groq API request failed with status ${response.status}. See console for details.`);
        }

        const data = await response.json();
        
        if (!data.choices || data.choices.length === 0 || !data.choices[0].message.content) {
            throw new Error("Groq API returned an invalid response structure.");
        }
        
        const responseText = data.choices[0].message.content;
        
        // Find the start and end of the JSON array
        const jsonStartIndex = responseText.indexOf('[');
        const jsonEndIndex = responseText.lastIndexOf(']');

        if (jsonStartIndex === -1 || jsonEndIndex === -1) {
             throw new Error("The AI (Groq) returned a response that did not contain a valid JSON array.");
        }

        const jsonString = responseText.substring(jsonStartIndex, jsonEndIndex + 1);
        const parsedJson = JSON.parse(jsonString);
        
        return validateMcqs(parsedJson, requestedQuestions, "Groq");

    } catch (error) {
        console.error("Error calling Groq API:", error);
        if (error instanceof Error && error.message.includes('JSON')) {
            throw new Error("The AI (Groq) returned an invalid JSON format. Please try again.");
        }
        throw new Error(error instanceof Error ? error.message : "Failed to generate MCQs from Groq. Check the console for details.");
    }
};

const _generateWithGemini = async (formData: FormState): Promise<MCQ[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set. Please add it to use the Gemini provider.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = buildPrompt(formData);
  const requestedQuestions = Math.max(1, Math.min(100, formData.questions));
  
  let contents: string | { parts: ({ text: string } | { inlineData: { mimeType: string; data: string; } })[] };

  if (formData.imageData && formData.imageData.data) {
    contents = {
      parts: [
        { text: prompt },
        { 
          inlineData: {
            mimeType: formData.imageData.mimeType,
            data: formData.imageData.data,
          }
        }
      ]
    };
  } else {
    contents = prompt;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        responseMimeType: 'application/json',
        responseSchema: mcqListSchema,
      }
    });

    const responseText = response.text.trim();
    const parsedMcqs: any[] = JSON.parse(responseText);
    
    return validateMcqs(parsedMcqs, requestedQuestions, "Gemini");
    
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error && error.message.includes('JSON')) {
        throw new Error("The AI (Gemini) returned an invalid JSON format. Please try again.");
    }
    throw new Error(error instanceof Error ? error.message : "Failed to generate MCQs from Gemini. Check the console for details.");
  }
};

export const generateMcqs = async (formData: Omit<FormState, 'aiProvider'>): Promise<MCQ[]> => {
    const provider = (formData.imageData || formData.questions > 40)
        ? AiProvider.Gemini
        : AiProvider.Groq;
    
    const fullFormData: FormState = {
        ...formData,
        aiProvider: provider,
    };

    if (provider === AiProvider.Groq) {
        return _generateWithGroq(fullFormData);
    }
    return _generateWithGemini(fullFormData);
};