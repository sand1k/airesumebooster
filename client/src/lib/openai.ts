import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const apiKey = typeof process !== 'undefined' ? process.env.VITE_OPENAI_API_KEY : import.meta.env.VITE_OPENAI_API_KEY;
const openai = new OpenAI({ apiKey });

export async function analyzeResume(text: string): Promise<Array<{
  category: string;
  content: string;
  improvement: string;
}>> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional resume reviewer. Analyze the resume and provide improvement suggestions. Format the response as a JSON array with objects containing: category (string), content (string - the relevant content from resume), and improvement (string - specific suggestion for improvement)."
        },
        {
          role: "user",
          content: text
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No response content from OpenAI");
    }

    const result = JSON.parse(content);
    return result.suggestions;
  } catch (error) {
    console.error("Error analyzing resume:", error);
    throw error;
  }
}