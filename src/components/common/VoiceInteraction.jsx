import React, { useState, useRef } from "react";
import { useChatStore } from "../../store/chatStore";
import { useUserStore } from "../../store/userStore";
import {
  transcribeAudio,
  getAIResponse,
  generateAudio,
} from "../../services/api";
import { toast } from "react-toastify";
import styles from "./VoiceInteraction.module.css";
import micIcon from "/mic.png";

const VoiceInteraction = () => {
  // State declarations
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [transcription, setTranscription] = useState("");
  const [response, setResponse] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Refs
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);

  // Store hooks
  const { currentUser } = useUserStore();
  const { chatId, user, addMessage } = useChatStore();

  // Start recording function
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
      toast.info("Recording started. Speak now!");
    } catch (err) {
      console.error("Error accessing the microphone", err);
      handleMicrophoneError(err);
    }
  };

  // Stop recording function
  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      console.log("Stopping media recorder");
      mediaRecorder.current.stop();
      setIsRecording(false);
      toast.info("Recording stopped. Processing your message...");
    } else {
      console.log(
        "Unable to stop recording: mediaRecorder is null or not recording"
      );
      toast.warn("No active recording to stop.");
    }
  };

  // Handle microphone errors
  const handleMicrophoneError = (err) => {
    if (err.name === "NotAllowedError") {
      toast.error(
        "Microphone access denied. Please allow microphone access to use this feature."
      );
    } else if (err.name === "NotFoundError") {
      toast.error(
        "No microphone detected. Please connect a microphone and try again."
      );
    } else {
      toast.error("Error accessing the microphone. Please try again.");
    }
  };

  // Handle stop recording
  const handleStop = async () => {
    console.log("Handle stop triggered");
    setIsProcessing(true);
    const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
    const audioUrl = URL.createObjectURL(audioBlob);
    setAudioUrl(audioUrl);
    console.log("Audio blob created", audioBlob);

    try {
      // Transcribe audio
      console.log("Starting transcription");
      const transcription = await transcribeAudio(audioBlob);
      console.log("Transcription completed", transcription);
      setTranscription(transcription);

      // Add user message to chat
      console.log("Adding user message to chat");
      addMessage({
        id: Date.now(),
        senderId: currentUser.id,
        text: transcription,
        createdAt: new Date().toISOString(),
        type: "voice",
        audioUrl: audioUrl,
      });

      // Get AI response
      console.log("Requesting AI response");
      const aiResponse = await getAIResponse(
        transcription,
        user.id,
        currentUser.username
      );
      console.log("AI response received", aiResponse);
      setResponse(aiResponse);

      // Generate audio for AI response
      console.log("Generating audio for AI response");
      const audioResponse = await generateAudio(aiResponse, user.id);
      console.log("Audio response generated");

      // Add AI message to chat
      console.log("Adding AI message to chat");
      addMessage({
        id: Date.now() + 1,
        senderId: user.id,
        text: aiResponse,
        createdAt: new Date().toISOString(),
        type: "voice",
        audioUrl: audioResponse,
      });

      toast.success("Voice message processed successfully!");
    } catch (error) {
      console.error("Error processing voice interaction:", error);
      toast.error("Error processing voice message. Please try again.");
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
      className={`${styles.voiceButton} ${
        isRecording ? styles.recording : ""
      } ${isProcessing ? styles.processing : ""}`}
    >
      <img src={micIcon} alt="Microphone" className={styles.micIcon} />
    </button>
  );
};

export default VoiceInteraction;
