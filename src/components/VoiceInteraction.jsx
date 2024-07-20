import React, { useState, useRef } from 'react';
import { useChatStore } from "../lib/chatStore";
import { useUserStore } from '../lib/userStore';
import { transcribeAudio, getAIResponse, generateAudio } from '../lib/api';

const VoiceInteraction = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [transcription, setTranscription] = useState('');
  const [response, setResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);

  const { currentUser } = useUserStore();
  const { chatId, user, addMessage } = useChatStore();

  const startRecording = async () => {
    try {
      console.log("Requesting microphone access");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("Microphone access granted");
      mediaRecorder.current = new MediaRecorder(stream);
      mediaRecorder.current.ondataavailable = (event) => {
        console.log("Data available from media recorder");
        audioChunks.current.push(event.data);
      };
      mediaRecorder.current.onstop = handleStop;
      mediaRecorder.current.start();
      setIsRecording(true);
      console.log("Recording started");
    } catch (err) {
      console.error("Error accessing the microphone", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      console.log("Stopping media recorder");
      mediaRecorder.current.stop();
      setIsRecording(false);
    } else {
      console.log("Unable to stop recording: mediaRecorder is null or not recording");
    }
  };

  const handleStop = async () => {
    console.log("Handle stop triggered");
    setIsProcessing(true);
    const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
    const audioUrl = URL.createObjectURL(audioBlob);
    setAudioUrl(audioUrl);
    console.log("Audio blob created", audioBlob);

    try {
      console.log("Starting transcription");
      const transcription = await transcribeAudio(audioBlob);
      console.log("Transcription completed", transcription);
      setTranscription(transcription);

      console.log("Adding user message to chat");
      addMessage({
        id: Date.now(),
        senderId: currentUser.id,
        text: transcription,
        createdAt: new Date().toISOString(),
        type: 'voice',
        audioUrl: audioUrl,
      });

      console.log("Requesting AI response");
      const aiResponse = await getAIResponse(transcription, user.id, currentUser.username);
      console.log("AI response received", aiResponse);
      setResponse(aiResponse);

      console.log("Generating audio for AI response");
      const audioResponse = await generateAudio(aiResponse);
      console.log("Audio response generated");

      console.log("Adding AI message to chat");
      addMessage({
        id: Date.now() + 1,
        senderId: user.id,
        text: aiResponse,
        createdAt: new Date().toISOString(),
        type: 'voice',
        audioUrl: audioResponse,
      });
    } catch (error) {
      console.error('Error processing voice interaction:', error);
    } finally {
      setIsProcessing(false);
      audioChunks.current = [];
      console.log("Voice interaction processing completed");
    }
  };

  return (
    <button 
      onClick={isRecording ? stopRecording : startRecording} 
      disabled={isProcessing}
      className={`voice-button ${isRecording ? 'recording' : ''} ${isProcessing ? 'processing' : ''}`}
    >
      <img src="./mic.png" alt="Microphone" />
    </button>
  );
};

export default VoiceInteraction;