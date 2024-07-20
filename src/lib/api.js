import OpenAI from 'openai';

const API_URL = 'https://api.deepgram.com/v1/listen';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, we will use a backend to make API calls
});

export const transcribeAudio = async (audioBlob) => {
  try {
    const formData = new FormData();
    formData.append('audio', audioBlob);

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${import.meta.env.VITE_DEEPGRAM_API_KEY}`,
        'Content-Type': 'audio/webm',
      },
      body: audioBlob,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Deepgram API Error:', response.status, errorBody);
      throw new Error(`Transcription failed: ${response.status} ${errorBody}`);
    }

    const data = await response.json();
    return data.results.channels[0].alternatives[0].transcript;
  } catch (error) {
    console.error('Error in transcribeAudio:', error);
    throw error;
  }
};

export const getAIResponse = async (message, aiContext, username) => {
  console.log(`getAIResponse called with message: ${message}, aiContext: ${aiContext}, username: ${username}`);
  
  const systemMessage = getSystemMessage(aiContext, username);
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: message }
      ],
      max_tokens: 150,
    });

    console.log("AI response received:", response.choices[0].message.content);
    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error getting ChatGPT response:", error);
    throw error;
  }
};

function getSystemMessage(aiContext, username) {
  const baseMessage = `You are an AI assistant. Keep your responses concise, ideally one short paragraph. Address the user as ${username}. `;
  
  switch (aiContext) {
    case 'doctor-tom':
      return baseMessage + "You are Doctor Tom, a medical assistant. Provide helpful medical advice and information. Always remind the user to consult with a real doctor for serious concerns.";
    case 'walter-weather':
      return baseMessage + "You are Walter Weather, a weather specialist. Provide weather forecasts, climate information, and interesting weather facts. Remind users that for critical weather situations, they should consult official weather services.";
    case 'dave-entertainer':
      return baseMessage + "You are Dave the Entertainer, an entertainment expert. Share fun facts, jokes, movie recommendations, and general entertainment knowledge. Keep the conversation light and enjoyable.";
    default:
      return baseMessage + "Provide helpful and friendly assistance.";
  }
}

export const generateAudio = async (text) => {
  const response = await fetch(`${ELEVENLABS_API_URL}/21m00Tcm4TlvDq8ikWAM`, {
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
    throw new Error('Failed to generate audio');
  }

  const audioBlob = await response.blob();
  return URL.createObjectURL(audioBlob);
};