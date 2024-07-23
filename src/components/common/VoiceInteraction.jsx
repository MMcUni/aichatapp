import React, { useState, useRef } from 'react';
import { useChatStore } from "../../store/chatStore";
import { useUserStore } from '../../store/userStore';
import { transcribeAudio, getAIResponse, generateAudio } from '../../services/api';
import { toast } from 'react-toastify';
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../../services/firebase";
import { log, error, warn, info } from '../../utils/logger';

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
      log("Requesting microphone access");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      log("Microphone access granted");
      mediaRecorder.current = new MediaRecorder(stream);
      mediaRecorder.current.ondataavailable = (event) => {
        log("Data available from media recorder");
        audioChunks.current.push(event.data);
      };
      mediaRecorder.current.onstop = handleStop;
      mediaRecorder.current.start();
      setIsRecording(true);
      log("Recording started");
      toast.info("Recording started. Speak now!");
    } catch (err) {
      console.error("Error accessing the microphone", err);
      if (err.name === 'NotAllowedError') {
        toast.error("Microphone access denied. Please allow microphone access to use this feature.");
      } else if (err.name === 'NotFoundError') {
        toast.error("No microphone detected. Please connect a microphone and try again.");
      } else {
        toast.error("Error accessing the microphone. Please try again.");
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      log("Stopping media recorder");
      mediaRecorder.current.stop();
      setIsRecording(false);
      toast.info("Recording stopped. Processing your message...");
    } else {
      log("Unable to stop recording: mediaRecorder is null or not recording");
      toast.warn("No active recording to stop.");
    }
  };

  const handleStop = async () => {
    log("Handle stop triggered");
    setIsProcessing(true);
    const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
    const audioUrl = URL.createObjectURL(audioBlob);
    setAudioUrl(audioUrl);
    log("Audio blob created", audioBlob);

    try {
      log("Starting transcription");
      const transcription = await transcribeAudio(audioBlob);
      log("Transcription completed", transcription);
      setTranscription(transcription);

      log("Adding user message to chat");
      const userMessage = {
        id: Date.now().toString(), // Ensure this is a string
        senderId: currentUser.id,
        text: transcription,
        createdAt: new Date().toISOString(),
        type: 'voice',
        audioUrl: audioUrl,
      };
      await updateDoc(doc(db, "chats", chatId), {
        messages: arrayUnion(userMessage)
      });

      log("Requesting AI response");
      log("AI agent:", user);
      const aiResponse = await getAIResponse(transcription, user.specialization, currentUser.username);
      log("AI response received", aiResponse);
      setResponse(aiResponse);

      log("Generating audio for AI response");
      log("AI agent ID:", user.id);
      const audioResponse = await generateAudio(aiResponse, user.id);
      log("Audio response generated");

      log("Adding AI message to chat");
      const aiMessage = {
        id: (Date.now() + 1).toString(), // Ensure this is a string and different from the user message
        senderId: user.id,
        text: aiResponse,
        createdAt: new Date().toISOString(),
        type: 'voice',
        audioUrl: audioResponse,
      };
      await updateDoc(doc(db, "chats", chatId), {
        messages: arrayUnion(aiMessage)
      });

      toast.success("Voice message processed successfully!");
    } catch (error) {
      console.error('Error processing voice interaction:', error);
      toast.error("Error processing voice message. Please try again.");
    } finally {
      setIsProcessing(false);
      audioChunks.current = [];
      log("Voice interaction processing completed");
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