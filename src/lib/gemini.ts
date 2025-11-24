import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateNotes(syllabus: string, sourceText: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
        *   Diagram descriptions (e.g., [Diagram: Description of the diagram]) if a diagram would be helpful.
    5.  **Output**: Return the result strictly as a JSON array of objects.

    **Syllabus:**
    ${syllabus}

    **Source Material:**
    ${sourceText.slice(0, 50000)} // Limit input to avoid token limits.

    **Output Format (JSON Array):**
    [
      {
        "title": "Topic Title (from Syllabus)",
        "description": "Brief summary",
        "content": "# Heading\n\nDetailed explanation...\n\n$$ Formula $$"
      }
    ]
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const textResponse = response.text();

  try {
    // Clean up markdown code blocks if Gemini wraps the JSON in ```json ... ```
    const cleanedText = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Failed to parse Gemini response:", textResponse);
    throw new Error("Failed to generate valid JSON from AI response");
  }
}
