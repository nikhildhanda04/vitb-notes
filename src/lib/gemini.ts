import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateNotes(syllabus: string, sourceText: string) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: "application/json",
      maxOutputTokens: 8192,
    },
  });

  const prompt = `
    You are an expert educational assistant. Your task is to generate detailed, high-quality study notes based on the provided **Syllabus** and **Source Material**.

    **Instructions:**
    1.  **Structure**: Strictly follow the topics listed in the **Syllabus**. Do not invent new topics outside the syllabus.
    2.  **Content**: For each topic in the syllabus, extract relevant information, explanations, examples, and formulas from the **Source Material**.
    3.  **Detail**: Provide **extensive, in-depth, and textbook-quality** notes. **Do not summarize.** The goal is to create a complete study resource that covers every nuance of the syllabus.
    4.  **Verbosity**: Explain every concept in depth. Use multiple paragraphs for complex topics. Avoid brevity.
    5.  **Examples**: Include real-world examples and analogies for every major concept to aid understanding.
    6.  **Gap Filling**: If the source material lacks details for a specific syllabus topic, use your general knowledge to fill in the gaps extensively, but prioritize the source material where available.
    7.  **Format**: The content for each topic MUST be in Markdown. Include:
        *   Clear headings
        *   Bullet points for readability
        *   Formulas using LaTeX syntax (e.g., $E=mc^2$)
        *   Code snippets where applicable
        *   **Diagrams**: Use Mermaid.js syntax for diagrams. Wrap them in a code block with the language \`mermaid\`.
            IMPORTANT:
            - Always quote node labels: \`id["Label Text"]\`
            - **Strictly match brackets for shapes**:
              - Rectangle: \`id["Label"]\` or \`id["Label"]\`
              - Rounded: \`id("Label")\`
              - Diamond: \`id{"Label"}\`
              - Circle: \`id(("Label"))\`
            - **NEVER mix brackets** (e.g., \`id{"Label"]\` is INVALID).
            Example:
            \`\`\`mermaid
            graph TD;
            A["Start"] --> B{"Is Valid?"};
            B -- Yes --> C["Continue"];
            B -- No --> D["Stop"];
            \`\`\`
            Provide a diagram whenever it helps explain a concept (e.g., flowcharts, system architectures, sequences).
    8.  **Output**: Return the result strictly as a valid JSON array of objects. Ensure all strings are properly escaped, especially backslashes in LaTeX formulas and code snippets. Do not include any markdown formatting outside the JSON array.

    **Syllabus:**
    ${syllabus}

    **Source Material:**
    ${sourceText ? sourceText.slice(0, 50000) : "No source material provided. Use your general knowledge to generate notes based on the syllabus."}

    **Output Format (JSON Object):**
    {
      "topics": [
        {
          "title": "Topic Title (from Syllabus)",
          "description": "Brief summary",
          "content": "# Heading\\n\\nDetailed explanation...\\n\\n$$ Formula $$"
        }
      ],
      "quiz": [
        {
          "question": "Question text?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "answer": "Option A"
        }
      ]
    }

    **Instructions for Quiz:**
    1. Generate 5-10 multiple-choice questions based on the generated notes.
    2. Ensure the questions cover key concepts from the syllabus.
    3. Provide 4 options for each question.
    4. Specify the correct answer text exactly as it appears in the options.
  `;

  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const textResponse = response.text();

      try {
        // Use regex to extract the JSON object from the response
        // This handles cases where the AI adds text before/after or uses markdown blocks
        const jsonMatch = textResponse.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
          throw new Error("No JSON object found in response");
        }

        return JSON.parse(jsonMatch[0]);
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
