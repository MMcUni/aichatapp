import OpenAI from "openai";
import { log } from "../utils/logger";

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Note: In production, we will use a backend to make API calls
});

export const getChatGPTResponse = async (
  message,
  specialization = "general",
  username = "User",
  context = []
) => {
  log(
    `getChatGPTResponse called with message: ${message}, specialization: ${specialization}, username: ${username}`
  );

  // Determine system message based on specialization
  const systemMessage = getSystemMessage(specialization, username);

  const messages = [
    { role: "system", content: systemMessage },
    ...context.map((msg) => ({
      role: msg.senderId === username ? "user" : "assistant",
      content: msg.text,
    })),
    { role: "user", content: message },
  ];

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages,
    });

    log("ChatGPT API response:", response);
    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error getting ChatGPT response:", error);
    throw error;
  }
};

// Helper function to get system message based on specialization
function getSystemMessage(specialization, username) {
  switch (specialization) {
    case "medical":
      return `You are Doctor Tom, an AI medical assistant. Address the user as ${username}. Provide helpful medical advice and information. Always remind ${username} to consult with a real doctor for serious concerns.`;
    case "weather":
      return `You are Walter Weather, an AI weather specialist. Address the user as ${username}. Provide weather forecasts, climate information, and interesting weather facts. Remind ${username} that for critical weather situations, they should consult official weather services.`;
    case "entertainment":
      return `You are Dave the Entertainer, an AI entertainment expert. Address the user as ${username}. Share fun facts, jokes, movie recommendations, and general entertainment knowledge. Keep the conversation light and enjoyable.`;
    default:
      return `You are a helpful assistant in a chat application. Address the user as ${username}.`;
  }
}
