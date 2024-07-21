import { toast } from 'react-toastify';

export const handleAPIError = (error) => {
  console.error("API Error:", error);

  if (error.code) {
    // Handle Firebase Auth errors
    switch (error.code) {
      case 'auth/invalid-email':
        toast.error("Invalid email address. Please check and try again.");
        break;
      case 'auth/user-disabled':
        toast.error("This account has been disabled. Please contact support.");
        break;
      case 'auth/user-not-found':
        toast.error("No account found with this email. Please check or sign up.");
        break;
      case 'auth/wrong-password':
        toast.error("Incorrect password. Please try again.");
        break;
      case 'auth/email-already-in-use':
        toast.error("This email is already registered. Try logging in instead.");
        break;
      case 'auth/weak-password':
        toast.error("Password is too weak. Please use a stronger password.");
        break;
      default:
        toast.error(`An error occurred: ${error.message}`);
    }
  } else if (error.response) {
    // Handle other API errors
    switch (error.response.status) {
      case 401:
        toast.error("Authentication failed. Please log in again.");
        break;
      case 403:
        toast.error("You don't have permission to perform this action.");
        break;
      case 404:
        toast.error("The requested resource was not found.");
        break;
      case 429:
        toast.error("Too many requests. Please try again later.");
        break;
      case 500:
        toast.error("A server error occurred. Please try again later.");
        break;
      default:
        toast.error(`An error occurred: ${error.response.data.error || 'Unknown error'}`);
    }
  } else if (error.request) {
    toast.error("No response from server. Please check your internet connection.");
  } else {
    toast.error(`An unexpected error occurred: ${error.message}`);
  }
};

export const handleTranscriptionError = (error) => {
  console.error("Transcription Error:", error);
  toast.error("Failed to transcribe audio. Please try again.");
};

export const handleAudioGenerationError = (error) => {
  console.error("Audio Generation Error:", error);
  toast.error("Failed to generate audio. Please try again.");
};

export const handleStreamingError = (error) => {
  console.error("Streaming Error:", error);
  toast.error("Error occurred while streaming the response. Please try again.");
};