import React, { useState, useRef, useEffect } from 'react';
import { useChatStore } from "../lib/chatStore";
import { useUserStore } from '../lib/userStore';
import { transcribeAudio, getAIResponse, generateAudio } from '../lib/api';

const VoiceInteraction = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [transcription, setTranscription] = useState('');
  const [response, setResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiAudioUrl, setAiAudioUrl] = useState(null);
  
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const aiAudioRef = useRef(null);

  const { currentUser } = useUserStore();
  const { chatId, user, addMessage } = useChatStore();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };
      mediaRecorder.current.onstop = handleStop;
      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing the microphone", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };

  const handleStop = async () => {
    setIsProcessing(true);
    const audioBlob = new Blob(audioChunks.current);
    const audioUrl = URL.createObjectURL(audioBlob);
    setAudioUrl(audioUrl);

    try {
      const transcription = await transcribeAudio(audioBlob);
      setTranscription(transcription);

      addMessage({
        id: Date.now(),
        senderId: currentUser.id,
        text: transcription,
        createdAt: new Date().toISOString(),
        type: 'voice',
        audioUrl: audioUrl,
      });

      const aiContext = user.isAI ? user.id : 'default';
      const aiResponse = await getAIResponse(transcription, aiContext);
      setResponse(aiResponse);

      const audioResponse = await generateAudio(aiResponse);
      setAiAudioUrl(audioResponse);

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
    }
  };

  useEffect(() => {
    if (aiAudioRef.current && aiAudioUrl) {
      aiAudioRef.current.play();
    }
  }, [aiAudioUrl]);

  return (
    <div>
      <button onClick={isRecording ? stopRecording : startRecording} disabled={isProcessing}>
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </button>
      {isProcessing && <p>Processing...</p>}
      {audioUrl && <audio src={audioUrl} controls />}
      <div>Transcription: {transcription}</div>
      <div>AI Response: {response}</div>
      {aiAudioUrl && <audio ref={aiAudioRef} src={aiAudioUrl} controls />}
    </div>
  );
};

export default VoiceInteraction;