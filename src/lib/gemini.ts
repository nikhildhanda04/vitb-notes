import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateNotes(syllabus: string, sourceText: string) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: "application/json",
      maxOutputTokens: 8192,
      temperature: 0.1, // Add this for more consistent JSON output
    },
  });

  const prompt = `
    You are an expert educational assistant. Generate detailed study notes as a valid JSON object.

    CRITICAL: Your response must be ONLY a valid JSON object. No explanations, no markdown, no extra text.

    **Instructions:**
    1.  **Structure**: Follow the topics in the Syllabus exactly.
    2.  **Content**: Extract relevant information from Source Material for each topic.
    3.  **Detail**: Provide extensive, in-depth, textbook-quality notes. Do not summarize.
    4.  **Verbosity**: Explain every concept thoroughly with multiple paragraphs.
    5.  **Examples**: Include real-world examples and analogies.
    6.  **Gap Filling**: Use general knowledge if source material is incomplete.
    7.  **Format**: Content MUST use Markdown with:
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
    8.  **Escaping**: In JSON strings, escape backslashes (\\\\), quotes (\\\"), and newlines (\\n)

    **Syllabus:**
    ${syllabus}

    **Source Material:**
    ${sourceText ? sourceText.slice(0, 50000) : "No source material provided."}

    **Required JSON Structure:**
    {
      "topics": [
        {
          "title": "Topic Title from Syllabus",
          "description": "Brief summary (1-2 sentences)",
          "content": "# Main Heading\\n\\nDetailed markdown content...\\n\\n## Subsection\\n\\nMore content..."
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

    Generate 5-10 quiz questions covering key syllabus concepts with 4 options each.
    
    Remember: Output ONLY the JSON object. Start with { and end with }. No other text.
  `;

  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const textResponse = response.text();

      try {
        // Clean the response
        let cleanedResponse = textResponse.trim();

        // Remove markdown code blocks if present
        cleanedResponse = cleanedResponse.replace(/```json\s*/g, '').replace(/```\s*$/g, '');

        // Extract JSON using a more precise regex (non-greedy, balanced braces)
        const jsonMatch = cleanedResponse.match(/\{(?:[^{}]|\{[^{}]*\})*\}/);

        if (!jsonMatch) {
          console.error("No JSON found. Full response:", textResponse);
          throw new Error("No JSON object found in response");
        }

        const parsedData = JSON.parse(jsonMatch[0]);

        // Validate structure
        if (!parsedData.topics || !Array.isArray(parsedData.topics)) {
          throw new Error("Invalid response structure: missing 'topics' array");
        }

        if (!parsedData.quiz || !Array.isArray(parsedData.quiz)) {
          console.warn("Warning: missing 'quiz' array in response");
          parsedData.quiz = []; // Provide default empty array
        }

        console.log(`Successfully generated ${parsedData.topics.length} topics and ${parsedData.quiz.length} quiz questions`);
        return parsedData;

      } catch (parseError: any) {
        console.error("=== PARSE ERROR ===");
        console.error("Error:", parseError.message);
        console.error("First 500 chars:", textResponse.slice(0, 500));
        console.error("Last 500 chars:", textResponse.slice(-500));
        console.error("Total length:", textResponse.length);

        throw new Error(
          `Failed to parse AI response: ${parseError.message}. ` +
          `Response length: ${textResponse.length} chars. ` +
          `Preview: ${textResponse.slice(0, 200)}...`
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
