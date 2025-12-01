import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateNotes(syllabus: string, sourceText: string) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: { responseMimeType: "application/json" },
  });

  const prompt = `
    You are an expert educational assistant. Your task is to generate detailed, high-quality study notes based on the provided **Syllabus** and **Source Material**.

    **Instructions:**
    1.  **Structure**: Strictly follow the topics listed in the **Syllabus**. Do not invent new topics outside the syllabus.
    2.  **Content**: For each topic in the syllabus, extract relevant information, explanations, examples, and formulas from the **Source Material**.
    3.  **Detail**: Provide comprehensive notes. If the source material lacks details for a specific syllabus topic, use your general knowledge to fill in the gaps, but prioritize the source material.
    4.  **Format**: The content for each topic MUST be in Markdown. Include:
        *   Clear headings
        *   Bullet points for readability
        *   Formulas using LaTeX syntax (e.g., $E=mc^2$)
        *   Code snippets where applicable
        *   **Diagrams**: Use Mermaid.js syntax for diagrams. Wrap them in a code block with the language \`mermaid\`.
            Example:
            \`\`\`mermaid
            graph TD;
  A-- > B;
  \`\`\`
            Provide a diagram whenever it helps explain a concept (e.g., flowcharts, system architectures, sequences).
    5.  **Output**: Return the result strictly as a valid JSON array of objects. Ensure all strings are properly escaped, especially backslashes in LaTeX formulas and code snippets. Do not include any markdown formatting outside the JSON array.

    **Syllabus:**
    ${syllabus}

    **Source Material:**
    ${sourceText ? sourceText.slice(0, 50000) : "No source material provided. Use your general knowledge to generate notes based on the syllabus."}

    **Output Format (JSON Array):**
    [
      {
        "title": "Topic Title (from Syllabus)",
        "description": "Brief summary",
        "content": "# Heading\\n\\nDetailed explanation...\\n\\n$$ Formula $$"
      }
    ]
  `;

  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const textResponse = response.text();

      try {
        return JSON.parse(textResponse);
      } catch (error) {
        console.error("Failed to parse Gemini response. Raw response:", textResponse);
        throw new Error(`Failed to generate valid JSON from AI response. Raw: ${textResponse.slice(0, 200)}...`);
      }
    } catch (error: any) {
      if (error.message.includes("429") || error.status === 429) {
        retryCount++;
        if (retryCount === maxRetries) {
          throw error; // Rethrow if max retries reached
        }
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 2s, 4s, 8s
        console.log(`Rate limited (429). Retrying in ${delay}ms... (Attempt ${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error; // Rethrow other errors immediately
      }
    }
  }
}
