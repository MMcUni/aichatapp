import React from "react";
import ErrorHandler from "../../utils/errorHandler";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  // Static method to update state when an error occurs
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  // Lifecycle method to catch errors
  componentDidCatch(error, errorInfo) {
    ErrorHandler.handle(error, "ErrorBoundary");
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI when an error occurs
      return <h1>Something went wrong. Please try refreshing the page.</h1>;
    }

    // Render children components when no error
    return this.props.children;
  }
}

export default ErrorBoundary;
