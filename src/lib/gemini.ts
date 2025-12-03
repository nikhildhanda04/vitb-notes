import { GoogleGenerativeAI, SchemaType, Schema } from "@google/generative-ai";
import { jsonrepair } from "jsonrepair";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

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

export async function generateNotes(syllabus: string, sourceText: string) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema,
      maxOutputTokens: 80000,
      temperature: 0.1,
    },
  });

  const prompt = `
    You are an expert educational assistant. Generate detailed study notes based on the provided Syllabus and Source Material.

    **Instructions:**
    1.  **Structure**: Follow the topics in the Syllabus exactly.
    2.  **Content**: Extract relevant information from Source Material for each topic.
    3.  **Detail**: Provide extensive, in-depth, textbook-quality notes. Do not summarize.
    4.  **Verbosity**: Explain every concept thoroughly with multiple paragraphs.
    5.  **Examples**: Include real-world examples and analogies.
    6.  **Gap Filling**: Use general knowledge if source material is incomplete.
    7.  **Format**: Content field MUST use Markdown with:
        *   Clear headings (# ## ###)
        *   Bullet points
        *   LaTeX formulas: Use double backslashes for LaTeX commands (e.g., \\frac, \\sum)
        *   Code snippets with language tags
        *   **Mermaid Diagrams**: Always quote labels and match brackets correctly
            \`\`\`mermaid
            graph TD;
            A["Start"] --> B{"Is Valid?"};
            B -- Yes --> C["Continue"];
            \`\`\`

    **Syllabus:**
    ${syllabus}

    **Source Material:**
    ${sourceText ? sourceText.slice(0, 50000) : "No source material provided."}

    Generate 5-10 quiz questions covering key syllabus concepts with 4 options each.
  `;

  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const textResponse = response.text();

      try {
        // With responseSchema, the output is guaranteed to be valid JSON structure
        // Use jsonrepair to fix common JSON issues (unescaped quotes, control chars, etc.)
        const parsedData = JSON.parse(jsonrepair(textResponse));

        // Validate structure
        if (!parsedData.topics || !Array.isArray(parsedData.topics)) {
          throw new Error("Invalid response structure: missing 'topics' array");
        }

        // Filter out invalid quiz questions to prevent DB errors
        if (parsedData.quiz && Array.isArray(parsedData.quiz)) {
          parsedData.quiz = parsedData.quiz.filter((q: any) =>
            q.question &&
            typeof q.question === 'string' &&
            Array.isArray(q.options) &&
            q.options.length > 0 &&
            q.answer &&
            typeof q.answer === 'string'
          );
        } else {
          console.warn("Warning: missing 'quiz' array in response");
          parsedData.quiz = []; // Provide default empty array
        }

        console.log(`Successfully generated ${parsedData.topics?.length || 0} topics and ${parsedData.quiz?.length || 0} quiz questions`);
        return parsedData;

      } catch (parseError: any) {
        console.error("=== PARSE ERROR ===");
        console.error("Error:", parseError.message);
        console.error("First 500 chars:", textResponse.slice(0, 500));

        throw new Error(
          `Failed to parse AI response: ${parseError.message}. ` +
          `Response length: ${textResponse.length} chars.`
        );
      }
    } catch (error: any) {
      if (error.message.includes("429") || error.status === 429) {
        retryCount++;
        if (retryCount === maxRetries) {
          throw new Error(`Rate limit exceeded after ${maxRetries} retries`);
        }
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`Rate limited. Retrying in ${delay}ms... (${retryCount}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }

  throw new Error("Failed to generate notes after maximum retries");
}
