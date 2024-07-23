import { toast } from 'react-toastify';

class ErrorHandler {
  static handle(error, context = '') {
    console.error(`Error in ${context}:`, error);

    let message = 'An unexpected error occurred. Please try again.';

    if (error.code) {
      // Handle Firebase Auth errors
      message = this.getFirebaseAuthErrorMessage(error.code);
    } else if (error.response) {
      // Handle API errors
      message = this.getAPIErrorMessage(error.response.status);
    } else if (error.request) {
      message = "No response from server. Please check your internet connection.";
    } else if (error.message) {
      message = error.message;
    }

    toast.error(message);
  }

  static getFirebaseAuthErrorMessage(code) {
    const errorMessages = {
      'auth/invalid-email': "Invalid email address. Please check and try again.",
      'auth/user-disabled': "This account has been disabled. Please contact support.",
      'auth/user-not-found': "No account found with this email. Please check or sign up.",
      'auth/wrong-password': "Incorrect email or password. Please try again.",
      'auth/email-already-in-use': "This email is already registered. Try logging in instead.",
      'auth/weak-password': "Password is too weak. Please use a stronger password.",
      'auth/invalid-credential': "Invalid login credentials. Please check your email and password.",
      'auth/too-many-requests': "Too many failed login attempts. Please try again later.",
      'auth/network-request-failed': "Network error. Please check your internet connection.",
    };

    return errorMessages[code] || "An authentication error occurred. Please try again.";
  }
}

export default ErrorHandler;