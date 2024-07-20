const API_URL = 'https://api.deepgram.com/v1/listen';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

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

export const getAIResponse = async (message, aiContext) => {
    const systemMessage = getSystemMessage(aiContext);
    
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: message }
        ],
      }),
    });
  
    if (!response.ok) {
      throw new Error('Failed to get AI response');
    }
  
    const data = await response.json();
    return data.choices[0].message.content;
  };
  
  function getSystemMessage(aiContext) {
    switch (aiContext) {
      case 'doctor-tom':
        return "You are Doctor Tom, an AI medical assistant. Provide helpful medical advice and information. Always remind the user to consult with a real doctor for serious concerns.";
      case 'walter-weather':
        return "You are Walter Weather, an AI weather specialist. Provide weather forecasts, climate information, and interesting weather facts. Remind users that for critical weather situations, they should consult official weather services.";
      case 'dave-entertainer':
        return "You are Dave the Entertainer, an AI entertainment expert. Share fun facts, jokes, movie recommendations, and general entertainment knowledge. Keep the conversation light and enjoyable.";
      default:
        return "You are a helpful AI assistant.";
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