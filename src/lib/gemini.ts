import { GoogleGenerativeAI, SchemaType, Schema } from "@google/generative-ai";
import { jsonrepair } from "jsonrepair";

// Helper to get API keys
const getApiKeys = () => {
  if (process.env.GEMINI_API_KEYS) {
    return process.env.GEMINI_API_KEYS.split(',').map(k => k.trim()).filter(k => k);
  }
  if (process.env.GEMINI_API_KEY) {
    return [process.env.GEMINI_API_KEY];
  }
  return [];
};

const apiKeys = getApiKeys();

if (apiKeys.length === 0) {
  throw new Error("No Gemini API keys found. Please set GEMINI_API_KEYS or GEMINI_API_KEY.");
}

const schema: Schema = {
  description: "Study notes and quiz schema",
  type: SchemaType.OBJECT,
  properties: {
    topics: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING, description: "Topic title from syllabus" },
          description: { type: SchemaType.STRING, description: "Brief summary of the topic" },
          content: { type: SchemaType.STRING, description: "Detailed markdown content including headings, bullet points, formulas, and mermaid diagrams" }
        },
        required: ["title", "description", "content"]
      }
    },
    quiz: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          question: { type: SchemaType.STRING },
          options: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          answer: { type: SchemaType.STRING }
        },
        required: ["question", "options", "answer"]
      }
    }
  },
  required: ["topics", "quiz"]
};

interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
}

function isQuizQuestion(obj: unknown): obj is QuizQuestion {
  if (typeof obj !== 'object' || obj === null) return false;
  
  const q = obj as Record<string, unknown>;
  
  return (
    typeof q.question === 'string' &&
    Array.isArray(q.options) &&
    typeof q.answer === 'string'
  );
}

const FALLBACK_MODELS = [
  'gemini-2.0-flash-lite', // Primary (Fast & Cheap)
  'gemini-2.0-flash',      // Fallback 1 (Robust)
  'gemini-2.5-flash'       // Fallback 2 (Newer/Experimental)
];

export async function generateNotes(syllabus: string, sourceText: string) {
  const prompt = `
    You are an expert educational assistant. Generate detailed study notes based on the provided Syllabus and Source Material.

    **Instructions:**
    **Content & Formatting Standards:**
    1.  **Structure**: Follow the syllabus topics exactly.
    2.  **Verbosity**: Provide extensive, textbook-quality notes. Avoid brief summaries.
    3.  **Mathematical Content**:
        *   Use **LaTeX** for all formulas and symbols (e.g., $E=mc^2$, $\\sum_{i=0}^n$).
        *   **Step-by-Step Solutions**: For every quantitative concept, provide at least one detailed solved example. Break it down into clear steps (Step 1, Step 2, etc.).
        *   **Formulas**: Clearly state formulas before applying them.
    4.  **Formatting**:
        *   Use extensive Markdown features: Bullet points, **Bold** for emphasis, *Italic* for definitions.
        *   **Mermaid Diagrams**: Visualise processes/flowcharts where applicable.
        *   **Code Blocks**: Use for algorithms or programming concepts.
    5.  **Examples**: Include real-world analogies and application examples.
    6.  **Common Questions**: End each major topic with a "Common Questions & pitfalls" section.

    **Syllabus:**
    ${syllabus}

    **Source Material:**
    ${sourceText ? sourceText.slice(0, 50000) : "No source material provided. Use general knowledge."}

    Generate 5-10 quiz questions.
  `;

  let currentKeyIndex = 0;
  let currentModelIndex = 0;
  let retryCount = 0;
  
  // Total attempts allowed: (Number of Keys * Number of Models) * 2 (extra buffer)
  // But practically we loop until we exhaust combinations or hit a hard limit
  const maxTotalRetries = (apiKeys.length * FALLBACK_MODELS.length) + 2;

  while (retryCount < maxTotalRetries) {
    try {
      const apiKey = apiKeys[currentKeyIndex];
      const modelName = FALLBACK_MODELS[currentModelIndex];
      
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: schema,
          maxOutputTokens: 8192,
          temperature: 0.1,
        },
      });

      console.log(`Attempting generation with Model: ${modelName}, Key Index: ${currentKeyIndex}`);
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const textResponse = response.text();

      try {
        const parsedData = JSON.parse(jsonrepair(textResponse));

        if (!parsedData.topics || !Array.isArray(parsedData.topics)) {
          throw new Error("Invalid response structure: missing 'topics' array");
        }

        if (parsedData.quiz && Array.isArray(parsedData.quiz)) {
          parsedData.quiz = parsedData.quiz.filter(isQuizQuestion);
        } else {
          console.warn("Warning: missing 'quiz' array in response");
          parsedData.quiz = [];
        }

        console.log(`Successfully generated notes using ${modelName}`);
        return parsedData;

      } catch (parseError: unknown) {
        throw new Error(`Failed to parse AI response: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
      }
    } catch (error: unknown) {
      // Type assertion or check for specific error properties if known
      // GoogleGenerativeAI errors might have status/message
      const err = error as { message?: string; status?: number };
      const message = err.message || String(error);
      const status = err.status;

      const isRateLimit = message.includes("429") || status === 429;
      const isServerOverload = status === 503;
      const isInvalidKey = message.includes("API key not valid") || status === 400; // 400 Bad Request often means invalid key

      if (isRateLimit || isServerOverload || isInvalidKey) {
        console.warn(`Attempt failed (Model: ${FALLBACK_MODELS[currentModelIndex]}, Key: ${currentKeyIndex}): ${message}`);
        
        // Strategy: Rotate Keys first. If all keys exhausted for this model, switch Model.
        
        // Move to next key
        currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;

        // If we circled back to the first key, it means we tried all keys for the current model.
        // So switch to the next model.
        if (currentKeyIndex === 0) {
            currentModelIndex = (currentModelIndex + 1) % FALLBACK_MODELS.length;
            console.log(`All keys exhausted for this model. Switching to next model: ${FALLBACK_MODELS[currentModelIndex]}`);
        }
        
        retryCount++;

        // Calculate delay
        // If it was an invalid key, don't wait long, just switch.
        // If it was rate limit, wait a bit.
        let delay = 1000;
        if (isInvalidKey) {
            delay = 100; // Fast retry for invalid key
        } else {
            // Exponential backoff for rate limits
             delay = Math.pow(2, Math.min(retryCount, 5)) * 1000 + Math.random() * 1000;
        }

        if (retryCount >= maxTotalRetries) {
           throw new Error(`Failed to generate notes after ${maxTotalRetries} attempts across multiple keys and models.`);
        }

        console.log(`Retrying in ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error; // Rethrow other errors (like 401, 403 if not key related, or parsing/validation errors)
      }
    }
  }

  throw new Error("Failed to generate notes after maximum retries");
}
