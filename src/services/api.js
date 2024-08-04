import OpenAI from "openai";
import ErrorHandler from "../utils/errorHandler";
import { AI_AGENTS } from "../components/constants/aiAgents";
import { log, error, warn, info } from "../utils/logger";
import { fetchTopNews } from "./newsService";

const API_URL = "https://api.deepgram.com/v1/listen";
const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1/text-to-speech";

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

const VOICE_IDS = {
  "doctor-tom": "rrIua2BxiuHg5SA4dAwK", // Rob
  "walter-weather": "gUbIduqGzBP438teh4ZA", // Scottish Lewis
  "dave-entertainer": "9yzdeviXkFddZ4Oz8Mok", // Lutz Laughs
  default: "21m00Tcm4TlvDq8ikWAM", // Default voice
};

export const transcribeAudio = async (audioBlob) => {
  try {
    const formData = new FormData();
    formData.append("audio", audioBlob);

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Token ${import.meta.env.VITE_DEEPGRAM_API_KEY}`,
        "Content-Type": "audio/webm",
      },
      body: audioBlob,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Deepgram API Error:", response.status, errorBody);
      throw new Error(`Transcription failed: ${response.status} ${errorBody}`);
    }

    const data = await response.json();
    return data.results.channels[0].alternatives[0].transcript;
  } catch (error) {
    ErrorHandler.handle(error, "Transcribing audio");
    throw error;
  }
};

export const getAIResponse = async (
  message,
  aiContext,
  username,
  chatHistory = []
) => {
  log(
    `getAIResponse called with message: ${message}, aiContext: ${aiContext}, username: ${username}, chatHistory length: ${chatHistory.length}`
  );

  const systemMessage = getSystemMessage(aiContext, username);

  try {
    const messages = [
      { role: "system", content: systemMessage },
      ...chatHistory.map((msg) => ({
        role: msg.senderId === username ? "user" : "assistant",
        content: msg.text,
      })),
      { role: "user", content: message },
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages,
      max_tokens: 150,
    });

    if (
      response.choices &&
      response.choices.length > 0 &&
      response.choices[0].message
    ) {
      log("AI response received:", response.choices[0].message.content);
      return response.choices[0].message.content;
    } else {
      throw new Error("No valid response from AI");
    }
  } catch (error) {
    ErrorHandler.handle(error, "Getting ChatGPT response");
    throw error;
  }
};

function getSystemMessage(aiContext, username) {
  const agent = Object.values(AI_AGENTS).find(
    (agent) => agent.specialization === aiContext
  );
  if (!agent) {
    throw new Error(`No AI agent found for specialization: ${aiContext}`);
  }

  const baseMessage = `You are an AI assistant named ${agent.username}. Keep your responses concise, ideally one short paragraph. Address the user as ${username}. `;

  switch (aiContext) {
    case "medical":
      return (
        baseMessage +
        "You are Doctor Tom, a medical assistant. Provide helpful medical advice and information based on general knowledge. For minor issues, offer practical suggestions and home remedies. Only recommend seeking professional medical help for potentially serious or persistent problems. Use your judgment to determine when professional care is necessary. Always maintain a caring and supportive tone."
      );
    case "weather":
      return (
        baseMessage +
        "You are Walter Weather, a weather specialist. Provide weather forecasts, climate information, and interesting weather facts. Remind users that for critical weather situations, they should consult official weather services."
      );
    case "entertainment":
      return (
        baseMessage +
        "You are Dave the Entertainer, an entertainment expert. Share fun facts, jokes, movie recommendations, and general entertainment knowledge. Keep the conversation light and enjoyable."
      );
    case "medication_reminders":
      return (
        baseMessage +
        "You are MedRemind, a medication reminder assistant. Help users set reminders for their medications and provide information about proper medication usage. Always remind users to consult with their healthcare provider for medical advice."
      );
    case "companionship":
      return (
        baseMessage +
        "You are CompanionAI, a friendly and empathetic AI companion. Your goal is to provide emotional support, engage in meaningful conversations, and build a rapport with the user. Remember previous interactions to ask relevant follow-up questions and maintain context. Be supportive, understanding, and always prioritize the user's well-being."
      );
    default:
      return baseMessage + "Provide helpful and friendly assistance.";
  }
}

export const generateAudio = async (text, agentId) => {
  try {
    log("Generating audio for agent ID:", agentId);
    const voiceId = VOICE_IDS[agentId] || VOICE_IDS.default;
    const apiUrl = `${ELEVENLABS_API_URL}/${voiceId}`;

    if (!text) {
      throw new Error("No text provided for audio generation");
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": import.meta.env.VITE_ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: text,
        voice_settings: {
          stability: 0.75,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API error:", errorText);
      throw new Error(`Failed to generate audio: ${errorText}`);
    }

    const audioBlob = await response.blob();
    const url = URL.createObjectURL(audioBlob);

    return url;
  } catch (error) {
    console.error("Error generating audio:", error);
    ErrorHandler.handle(error, "Generating audio");

    // Attempt to use default voice if custom voice fails
    if (agentId !== "default") {
      log("Attempting to use default voice...");
      return generateAudio(text, "default");
    }

    throw error;
  }
};

export const getJSONResponse = async (message, aiContext, username) => {
  log(
    `getJSONResponse called with message: ${message}, aiContext: ${aiContext}, username: ${username}`
  );

  const systemMessage =
    getSystemMessage(aiContext, username) +
    " Always respond in valid JSON format.";

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: message },
      ],
      response_format: { type: "json_object" },
    });

    log("AI JSON response received:", response.choices[0].message.content);
    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("Error getting JSON response:", error);
    ErrorHandler.handle(error, "Getting JSON response");
    throw error;
  }
};

export const getStreamingResponse = async (
  message,
  aiContext,
  username,
  onUpdate
) => {
  log(
    `getStreamingResponse called with message: ${message}, aiContext: ${aiContext}, username: ${username}`
  );

  const systemMessage = getSystemMessage(aiContext, username);

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: message },
      ],
      stream: true,
    });

    let fullResponse = "";
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      fullResponse += content;
      onUpdate(content); // Call the update function with each chunk
    }

    log("Full streaming response received:", fullResponse);
    return fullResponse;
  } catch (error) {
    console.error("Error in streaming response:", error);
    ErrorHandler.handle(error, "Getting streaming response");
    throw error;
  }
};

export const summarizeText = async (text) => {
  log("Summarizing text:", text.substring(0, 50) + "...");
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that summarizes text.",
        },
        {
          role: "user",
          content: `Please summarize the following text in one sentence:\n\n${text}`,
        },
      ],
      max_tokens: 60,
    });

    log("Text summarized successfully");
    return response.choices[0].message.content;
  } catch (err) {
    error("Error summarizing text:", err);
    throw err;
  }
};

export const getNewsSummary = async () => {
  log("Getting news summary");
  try {
    const articles = await fetchTopNews();
    log(`Fetched ${articles.length} top news articles`);

    const summaries = await Promise.all(
      articles.map(async (article) => {
        const fullText = `${article.title}. ${article.description}`;
        return await summarizeText(fullText);
      })
    );

    log("All articles summarized successfully");
    return summaries.join("\n\n");
  } catch (err) {
    error("Error getting news summary:", err);
    throw err;
  }
};
