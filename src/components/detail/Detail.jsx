import React from "react";
import { useChatStore } from "../../store/chatStore";
import { useUserStore } from "../../store/userStore";
import { AI_AGENTS } from "../constants/aiAgents";
import AI_AGENT_TAGLINES from "../constants/aiAgentTaglines";
import "./detail.css";

const Detail = ({ handleLogout }) => {
  const { user, isCurrentUserBlocked, isReceiverBlocked, changeBlock } = useChatStore();
  const { currentUser } = useUserStore();

  const getExamplePrompts = (specialization) => {
    const prompts = {
      medical: [
        "What are the symptoms of the flu?",
        "How can I improve my sleep habits?",
        "What's a balanced diet look like?",
      ],
      weather_forecasting: [
        "What's the weather like in Edinburgh this weekend?",
        "Will it rain tomorrow in Glasgow?",
        "What's the forecast for next week in Aberdeen?",
      ],
      entertainment: [
        "Tell me a joke about cats",
        "What are the top movies this year?",
        "Give me a fun fact about music",
      ],
      medication_reminders: [
        "Remind me to take aspirin at 9 AM daily",
        "Set a reminder for my vitamin D pill every morning",
        "When should I take my next dose of antibiotics?",
      ],
      news_summarization: [
        "Summarize today's top headlines",
        "What's the latest news in technology?",
        "Give me an overview of current global events",
      ],
      companionship: [
        "How was your day?",
        "Can you recommend a good book?",
        "What's your favorite topic to discuss?",
      ],
    };
    return prompts[specialization] || [];
  };

  const getDisclaimer = (specialization) => {
    const disclaimers = {
      medical: "The medical information provided by Doctor Tom is for educational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.",
      weather_forecasting: "Weather forecasts provided by Walter Weather are for informational purposes only. For critical weather situations, please consult official weather services and local authorities.",
      entertainment: "Entertainment content provided by Dave the Entertainer is for fun and does not represent factual information. Any resemblance to real persons or events is purely coincidental.",
      medication_reminders: "Medication reminders are provided as a convenience feature. Always follow your healthcare provider's instructions and consult them before making any changes to your medication regimen.",
      news_summarization: "News summaries are provided for informational purposes only. They may not cover all aspects of a story. For comprehensive news coverage, please refer to multiple reputable news sources.",
      companionship: "Colin Companion is an AI and cannot replace human relationships or professional mental health support. If you're experiencing serious emotional distress, please seek help from a qualified professional.",
    };
    return disclaimers[specialization] || "This AI assistant is for informational and entertainment purposes only.";
  };

  const renderExamplePrompts = () => {
    if (!user?.isAI) return null;
    const prompts = getExamplePrompts(user.specialization);
    return (
      <div className="example-prompts">
        <h3>Example Prompts</h3>
        <ul>
          {prompts.map((prompt, index) => (
            <li key={index}>{prompt}</li>
          ))}
        </ul>
      </div>
    );
  };

  const renderDisclaimer = () => {
    if (!user?.isAI) return null;
    return (
      <div className="ai-disclaimer">
        <h3>Disclaimer</h3>
        <p>{getDisclaimer(user.specialization)}</p>
      </div>
    );
  };

  const renderAIInfo = () => {
    if (!user?.isAI) return null;
    return (
      <div className="ai-info">
        <h3>AI Assistant Information</h3>
        <p>Specialization: {AI_AGENTS[user.id].specialization}</p>
        <p>Version: 1.0</p>
      </div>
    );
  };

  const renderUserActions = () => {
    if (user?.isAI) return null;
    return (
      <div className="user-actions">
        <button onClick={changeBlock}>
          {isCurrentUserBlocked
            ? "You are Blocked!"
            : isReceiverBlocked
            ? "Unblock User"
            : "Block User"}
        </button>
      </div>
    );
  };

  return (
    <div className="detail">
      <div className="user">
        <img
          src={user?.avatar || "./avatar.png"}
          alt={user?.username || "User avatar"}
        />
        <h2>{user?.username}</h2>
        <p>{user?.isAI ? AI_AGENT_TAGLINES[user.id] : "User bio goes here"}</p>
      </div>
      <div className="info">
        {renderAIInfo()}
        {renderExamplePrompts()}
        {renderDisclaimer()}
        {renderUserActions()}
      </div>
      <button className="logout" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
};

export default Detail;