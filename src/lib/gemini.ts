import { GoogleGenerativeAI, SchemaType, Schema, FinishReason } from "@google/generative-ai";
import { fitToBudget, joinSources, OUTLINE_CHAR_BUDGET, PYQ_CHAR_BUDGET, type Source } from "@/lib/sources";
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

const quizSchema: Schema = {
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
};

const outlineSchema: Schema = {
  description: "Topic outline, quiz and PYQ analysis",
  type: SchemaType.OBJECT,
  properties: {
    topics: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING, description: "Topic title from syllabus" },
          description: { type: SchemaType.STRING, description: "Brief summary of the topic and the sub-points it must cover" }
        },
        required: ["title", "description"]
      }
    },
    quiz: quizSchema,
    probableQuestions: {
      type: SchemaType.STRING,
      description: "Markdown analysis of the previous year question papers with probable questions for the next exam. Empty string if no papers were given."
    }
  },
  required: ["topics", "quiz"]
};

const topicSchema: Schema = {
  description: "Notes for one topic",
  type: SchemaType.OBJECT,
  properties: {
    content: { type: SchemaType.STRING, description: "Detailed markdown content including headings, bullet points, formulas, and mermaid diagrams" }
  },
  required: ["content"]
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
  'gemini-2.5-flash',      // Primary (same as love-lafda-solver)
  'gemini-2.5-flash-lite'  // Fallback (Fast & Cheap)
];

const FORMATTING_RULES = `
    **Content & Formatting Standards:**
    1.  **Verbosity**: Provide extensive, textbook-quality notes. Avoid brief summaries.
    2.  **Mathematical Content**:
        *   Use **LaTeX** for all formulas and symbols (e.g., $E=mc^2$, $\\sum_{i=0}^n$).
        *   **Step-by-Step Solutions**: For every quantitative concept, provide at least one detailed solved example. Break it down into clear steps (Step 1, Step 2, etc.).
        *   **Formulas**: Clearly state formulas before applying them.
    3.  **Formatting**:
        *   Use extensive Markdown features: Bullet points, **Bold** for emphasis, *Italic* for definitions.
        *   **Mermaid Diagrams**: Visualise processes/flowcharts where applicable. Always wrap node labels and edge labels in double quotes, e.g. A["Admission (s.7)"] -->|"Yes"| B{"Approved?"}.
        *   **Code Blocks**: Use for algorithms or programming concepts.
    4.  **Examples**: Include real-world analogies and application examples.
    5.  **Common Questions**: End the topic with a "Common Questions & pitfalls" section.
`;

export interface OutlineTopic {
  title: string;
  description: string;
}

// Step 1: list every topic (so nothing is skipped) plus the quiz and PYQ analysis.
export async function generateOutline(syllabus: string, sources: Source[], pyqs: Source[] = []) {
  const sourceText = joinSources(fitToBudget(sources, OUTLINE_CHAR_BUDGET), "Reference File");
  const pyqText = joinSources(fitToBudget(pyqs, PYQ_CHAR_BUDGET), "Previous Year Paper");

  const prompt = `
    You are an expert educational assistant planning detailed study notes from a Syllabus and Source Material (which may contain several reference files).
    The notes for each topic will be written separately later, so here you only produce the topic list, a quiz and (if given) the PYQ analysis.

    **Topic list rules (nothing may be missed):**
    1.  Include EVERY syllabus item, in syllabus order. Split a broad item into several topics rather than squeezing it into one.
    2.  Read ALL reference files, not just the first. Add a topic for every important syllabus-related concept a file covers that the syllabus list misses.
    3.  Each description must name the specific sub-points, sections, definitions, cases and examples the topic has to cover, so the writer does not leave any out.

    **Syllabus:**
    ${syllabus}

    **Source Material:**
    ${sourceText || "No source material provided. Use general knowledge."}

    Generate 5-10 quiz questions covering the whole syllabus.
${pyqText ? `
    **Previous Year Question Papers (PYQs):**
    ${pyqText}

    **Probable Questions (fill the "probableQuestions" field, Markdown):**
    Analyse ALL the previous year papers above against the syllabus and predict the next exam.
    1.  **Topic Frequency**: A Markdown table of syllabus topics with how many papers asked about them and the typical marks.
    2.  **Probable Questions**: 10-15 likely questions for the next exam, grouped by likelihood under "### High", "### Medium" and "### Low" headings. For each, give the question, expected marks, and a one-line reason (e.g. "asked in 3 of 4 papers", "syllabus topic never asked yet").
    3.  **Patterns**: Short bullet list of patterns noticed (question styles, repeated numericals, marks distribution).
    Base predictions on evidence from the papers; do not copy a past question verbatim unless it repeats across papers.
` : `
    No previous year papers were given: set "probableQuestions" to an empty string.
`}
  `;

  const { data, truncated } = await callGemini(prompt, outlineSchema);
  if (!Array.isArray(data.topics)) {
    throw new Error("Invalid response structure: missing 'topics' array");
  }
  const topics = (data.topics as unknown[]).filter(
    (t): t is OutlineTopic => typeof (t as OutlineTopic)?.title === "string" && typeof (t as OutlineTopic)?.description === "string"
  );
  const quiz = Array.isArray(data.quiz) ? data.quiz.filter(isQuizQuestion) : [];
  const probableQuestions = typeof data.probableQuestions === "string" ? data.probableQuestions : "";
  return { topics, quiz, probableQuestions, truncated };
}

// Step 2: write one topic in full, from the source passages relevant to it. Each topic gets its own output budget.
export async function generateTopic(syllabus: string, topic: OutlineTopic, allTitles: string[], excerpts: Source[]) {
  const prompt = `
    You are an expert educational assistant writing ONE topic of a set of detailed study notes.

    **Topic to write:** ${topic.title}
    **Must cover:** ${topic.description}

    **Other topics in these notes (covered separately, do not repeat them in depth):**
    ${allTitles.filter(t => t !== topic.title).map(t => `- ${t}`).join("\n")}

    **Completeness (most important):**
    Cover EVERY concept, definition, section/clause number, case, condition, time limit, example and fact in the source passages below that relates to this topic.
    Do not summarise details away and do not skip anything because it seems minor. If the sources are thin, fill gaps from general knowledge of the subject.
${FORMATTING_RULES}
    **Syllabus (for context):**
    ${syllabus}

    **Source passages for this topic:**
    ${joinSources(excerpts, "Reference File") || "No source material provided. Use general knowledge."}
  `;

  const { data, truncated } = await callGemini(prompt, topicSchema);
  if (typeof data.content !== "string") {
    throw new Error("Invalid response structure: missing 'content'");
  }
  return { content: data.content, truncated };
}

// Runs a prompt with key/model rotation on rate limits. `truncated` is true when the
// model hit the output token limit, i.e. the end of the response was cut off.
async function callGemini(prompt: string, schema: Schema): Promise<{ data: Record<string, unknown>; truncated: boolean }> {
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
          maxOutputTokens: 65536,
          temperature: 0.1,
        },
      });

      console.log(`Attempting generation with Model: ${modelName}, Key Index: ${currentKeyIndex}`);
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const textResponse = response.text();
      const truncated = response.candidates?.[0]?.finishReason === FinishReason.MAX_TOKENS;
      if (truncated) console.warn(`Response from ${modelName} hit the output token limit and was cut off`);

      try {
        const data = JSON.parse(jsonrepair(textResponse));
        console.log(`Successfully generated using ${modelName}`);
        return { data, truncated };

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
           throw new Error(`Failed to generate after ${maxTotalRetries} attempts across multiple keys and models.`);
        }

        console.log(`Retrying in ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error; // Rethrow other errors (like 401, 403 if not key related, or parsing/validation errors)
      }
    }
  }

  throw new Error("Failed to generate after maximum retries");
}
