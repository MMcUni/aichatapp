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
        "What's the weather like in New York this weekend?",
        "Will it rain tomorrow in London?",
        "What's the forecast for next week in Tokyo?",
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
        {renderUserActions()}
      </div>
      <button className="logout" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
};

export default Detail;