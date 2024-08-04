// useChat.jsx
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { doc, onSnapshot, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useChatStore } from "../../store/chatStore";
import { useUserStore } from "../../store/userStore";
import { useReminderStore } from "../../store/reminderStore";
import upload from "../../utils/upload";
import {
  getAIResponse,
  generateAudio,
  getNewsSummary,
} from "../../services/api";
import {
  parseReminderInput,
  formatReminderResponse,
} from "../../utils/reminderParser";
import ErrorHandler from "../../utils/errorHandler";
import { toast } from "react-toastify";
import { log, error } from "../../utils/logger";
import {
  fetchWeatherData,
  interpretWeatherCode,
  getLocationFromText,
} from "../../services/weatherService";
import { format, parseISO } from "date-fns";

const useChat = () => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [img, setImg] = useState({ file: null, url: "" });
  const [open, setOpen] = useState(false);
  const [currentlyPlayingAudio, setCurrentlyPlayingAudio] = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState(null);

  const { currentUser } = useUserStore();
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked } =
    useChatStore();
  const { addReminder } = useReminderStore();

  const endRef = useRef(null);
  const chatContainerRef = useRef(null);
  const prevMessagesLengthRef = useRef(0);

  const enableAudio = useCallback(() => {
    setIsAudioEnabled(true);
    log("Audio playback enabled");
    toast.success("Audio playback enabled!");
  }, []);

  useEffect(() => {
    log("Chat component mounted. ChatId:", chatId);
    if (!chatId) return;

    log("Setting up chat listener for:", chatId);
    const unSub = onSnapshot(
      doc(db, "chats", chatId),
      (doc) => {
        if (doc.exists()) {
          const newMessages = doc.data().messages || [];
          setMessages(newMessages);
          if (newMessages.length > prevMessagesLengthRef.current) {
            scrollToBottom();
          }
          prevMessagesLengthRef.current = newMessages.length;
        } else {
          log("No such document!");
          toast.error("Chat not found. Please try again.");
        }
      },
      (err) => {
        ErrorHandler.handle(err, "Fetching chat messages");
      }
    );

    return () => {
      log("Cleaning up chat listener");
      unSub();
    };
  }, [chatId]);

  useEffect(() => {
    log("Messages updated, current count:", messages.length);
    if (messages.length > prevMessagesLengthRef.current) {
      const latestMessage = messages[messages.length - 1];
      log("Latest message:", latestMessage);
      if (latestMessage.senderId !== currentUser.id && latestMessage.audioUrl) {
        log("Attempting to play audio for new AI message");
        playAudioFromUrl(latestMessage.id, latestMessage.audioUrl);
      }
      scrollToBottom();
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages, currentUser.id]);

  const scrollToBottom = useCallback(() => {
    if (endRef.current) {
      setTimeout(() => {
        endRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
      }, 100);
    }
  }, []);

  const playAudioFromUrl = useCallback(
    (messageId, url) => {
      log(`Attempting to play audio for message ${messageId}`);
      if (!isAudioEnabled) {
        log("Audio not enabled, enabling now");
        enableAudio();
      }

      if (currentlyPlayingAudio) {
        log("Stopping currently playing audio");
        currentlyPlayingAudio.pause();
      }

      const audio = new Audio(url);
      audio.oncanplaythrough = () => {
        log("Audio can play through, attempting to play");
        audio
          .play()
          .then(() => {
            log("Audio playback started successfully");
            setPlayingMessageId(messageId);
            setCurrentlyPlayingAudio(audio);
          })
          .catch((e) => {
            error("Error playing audio:", e);
            toast.error("Failed to play audio. Please try again.");
          });
      };
      audio.onended = () => {
        log("Audio playback ended");
        setPlayingMessageId(null);
        setCurrentlyPlayingAudio(null);
      };
      audio.onerror = (e) => error("Error loading audio:", e);
    },
    [isAudioEnabled, currentlyPlayingAudio, enableAudio]
  );

  const toggleAudio = useCallback(
    (messageId, audioUrl) => {
      log(`Toggling audio for message ${messageId}`);
      if (playingMessageId === messageId && currentlyPlayingAudio) {
        if (currentlyPlayingAudio.paused) {
          log("Resuming paused audio");
          currentlyPlayingAudio.play();
        } else {
          log("Pausing playing audio");
          currentlyPlayingAudio.pause();
        }
      } else {
        log("Playing new audio");
        playAudioFromUrl(messageId, audioUrl);
      }
    },
    [playingMessageId, currentlyPlayingAudio, playAudioFromUrl]
  );

  const handleSend = useCallback(
    async (chatHistory = []) => {
      if (text.trim() === "" && !img.file) return;

      log(`Handling send for user: ${currentUser.id}, chatId: ${chatId}`);

      let imgUrl = null;
      if (img.file) {
        try {
          log("Uploading image");
          imgUrl = await upload(img.file);
          log("Image uploaded successfully");
        } catch (err) {
          ErrorHandler.handle(err, "Uploading image");
          return;
        }
      }

      const userMessage = {
        id: Date.now().toString(),
        senderId: currentUser.id,
        text,
        img: imgUrl,
        createdAt: new Date().toISOString(),
      };

      try {
        log("Adding user message to chat");
        await updateDoc(doc(db, "chats", chatId), {
          messages: arrayUnion(userMessage),
        });

        setText("");
        setImg({ file: null, url: "" });

        if (user?.isAI) {
          log(
            `Processing AI response for specialization: ${user.specialization}`
          );
          let aiResponse;

          switch (user.specialization) {
            case "medication_reminders":
              aiResponse = await handleMedicationReminder(text, currentUser.id);
              break;
            case "news_summarization":
              aiResponse = await handleNewsSummarization(text);
              break;
            case "weather_forecasting":
              aiResponse = await handleWeatherQuery(text);
            case "companionship":
              aiResponse = await getAIResponse(
                text,
                user.specialization,
                currentUser.username,
                chatHistory
              );
              break;
            default:
              aiResponse = await getAIResponse(
                text,
                user.specialization,
                currentUser.username
              );
          }

          if (aiResponse) {
            log("Generating audio for AI response");
            const audioUrl = await generateAudio(aiResponse, user.id);
            const aiMessage = {
              id: (Date.now() + 1).toString(),
              senderId: user.id,
              text: aiResponse,
              audioUrl: audioUrl,
              createdAt: new Date().toISOString(),
              type: "voice",
            };

            log("Adding AI message to chat");
            await updateDoc(doc(db, "chats", chatId), {
              messages: arrayUnion(aiMessage),
            });
          } else {
            error("No AI response received");
            toast.error("Failed to get AI response. Please try again.");
          }
        }
      } catch (err) {
        ErrorHandler.handle(err, "Sending message or getting AI response");
      }
    },
    [text, img, currentUser.id, chatId, user, addReminder]
  );

  const handleMedicationReminder = async (text) => {
    const parsedReminder = parseReminderInput(text);
    if (parsedReminder.medication && parsedReminder.time) {
      try {
        await addReminder(currentUser.id, parsedReminder);
        return formatReminderResponse(parsedReminder);
      } catch (reminderError) {
        error("Error adding reminder:", reminderError);
        return "I'm sorry, there was an error setting your reminder. Please try again.";
      }
    } else {
      return "I'm sorry, I couldn't understand your reminder request. Please try again with a medication name and time.";
    }
  };

  const handleWeatherQuery = async (text) => {
    try {
      const location = await getLocationFromText(text);
      const weatherData = await fetchWeatherData(
        location.latitude,
        location.longitude
      );

      if (text.toLowerCase().includes("current weather")) {
        return formatCurrentWeather(weatherData, location);
      } else if (text.toLowerCase().includes("weather forecast")) {
        return formatWeatherForecast(weatherData, location);
      } else {
        return `Hi there! I'd be happy to help you with the weather in ${location.name}, ${location.country}. Would you like to know about the current weather or get a 7-day forecast? Just ask me something like "What's the current weather?" or "Give me a weather forecast."`;
      }
    } catch (error) {
      console.error("Error in weather query:", error);
      return "I'm sorry, I'm having trouble getting the weather information right now. Can you please try again in a moment?";
    }
  };

  const formatCurrentWeather = (weatherData, location) => {
    const current = weatherData.hourly;
    const currentIndex = new Date().getHours();
    const temp = current.temperature_2m[currentIndex];
    const humidity = current.relative_humidity_2m[currentIndex];
    const precipProb = current.precipitation_probability[currentIndex];
    const condition = interpretWeatherCode(current.weathercode[currentIndex]);

    let response = `Hello! Here's the current weather in ${location.name}, ${location.country}:\n\n`;
    response += `🌡️ It's ${temp.toFixed(1)}°C out there. `;

    if (temp > 25) response += "Phew, it's a hot one! 🥵";
    else if (temp > 20) response += "It's nice and warm! 😎";
    else if (temp > 15) response += "It's pleasantly mild. 🙂";
    else if (temp > 10) response += "It's a bit chilly. 🧥";
    else response += "Bundle up, it's cold! 🥶";

    response += `\n💧 Humidity is at ${humidity}% and there's a ${precipProb}% chance of precipitation.\n`;
    response += `🌤️ Conditions are ${condition.toLowerCase()}.\n\n`;

    if (condition.includes("rain") || condition.includes("drizzle")) {
      response += "You might want to grab an umbrella! ☔";
    } else if (condition.includes("clear") || condition.includes("sunny")) {
      response += "It's a great day to spend some time outside! 🌳";
    }

    return response;
  };

  const formatWeatherForecast = (weatherData, location) => {
    const daily = weatherData.daily;
    let forecast = `Hello there! Here's your 7-day weather forecast for ${location.name}, ${location.country}:\n\n`;

    const getClothingSuggestion = (maxTemp, condition) => {
      if (maxTemp > 25)
        return "It's going to be hot! 🥵 Don't forget your sunscreen and maybe pack a hat.";
      if (maxTemp > 20)
        return "Nice and warm today! 😎 A light jacket might be handy for the evening.";
      if (maxTemp > 15)
        return "It's mild out there. 🙂 A light jacket or sweater should do the trick.";
      if (maxTemp > 10)
        return "It's a bit chilly! 🧥 You might want to layer up today.";
      return "Brrr, it's cold! 🥶 Time for that warm coat and maybe a scarf!";
    };

    const getActivitySuggestion = (condition, precipitation) => {
      if (condition.includes("rain") || condition.includes("drizzle")) {
        return precipitation > 5
          ? "Looks like a good day for indoor activities. How about visiting a museum? 🏛️"
          : "A light raincoat might be a good idea for any outdoor plans! ☔";
      }
      if (condition.includes("cloud"))
        return "Perfect weather for a nice walk in the park! 🌳";
      if (condition.includes("clear"))
        return "Great day for outdoor activities! Maybe a picnic? 🧺";
      return "Whatever you do today, I hope you enjoy it! 😊";
    };

    for (let i = 0; i < 7; i++) {
      const date = format(parseISO(daily.time[i]), "EEEE, MMMM do");
      const maxTemp = daily.temperature_2m_max[i];
      const minTemp = daily.temperature_2m_min[i];
      const precipitation = daily.precipitation_sum[i];
      const condition = interpretWeatherCode(daily.weathercode[i]);

      forecast += `${date}:\n`;
      forecast += `🌡️ High of ${maxTemp.toFixed(
        1
      )}°C and low of ${minTemp.toFixed(1)}°C\n`;
      forecast += `🌦️ ${condition} with ${precipitation.toFixed(
        1
      )}mm of precipitation\n`;
      forecast += `👚 ${getClothingSuggestion(maxTemp, condition)}\n`;
      forecast += `🎯 ${getActivitySuggestion(condition, precipitation)}\n\n`;
    }

    const averageMaxTemp =
      daily.temperature_2m_max.reduce((a, b) => a + b, 0) / 7;
    const isMainlyDry = daily.precipitation_sum.reduce((a, b) => a + b, 0) < 10;

    forecast += `Overall, it looks like we're in for ${
      isMainlyDry ? "a relatively dry" : "a bit of a wet"
    } week with average highs around ${averageMaxTemp.toFixed(1)}°C. `;
    forecast += isMainlyDry
      ? "Don't forget to water your plants! 🌱"
      : "Remember to grab your umbrella when heading out! ☂️";

    return forecast;
  };

  const handleNewsSummarization = async (text) => {
    log(`Handling news summarization request: "${text}"`);

    const summarizationTriggers = [
      "summarize today's news",
      "summarize todays news",
      "today's news summary",
      "todays news summary",
      "news summary",
      "summarize news",
    ];

    if (
      summarizationTriggers.some((trigger) =>
        text.toLowerCase().includes(trigger)
      )
    ) {
      log("News summarization request detected");
      try {
        log("Fetching news summary");
        const newsSummary = await getNewsSummary();
        log("News summary fetched successfully");
        return `Here's a summary of today's top news:\n\n${newsSummary}`;
      } catch (err) {
        error("Error getting news summary:", err);
        return "I'm sorry, I couldn't fetch the news summary at the moment. Please try again later.";
      }
    } else {
      log("No specific news summarization request detected");
      return "I'm here to summarize news for you. You can ask me to 'summarize today's news' for a quick update on current events.";
    }
  };

  const handleKeyPress = useCallback(
    (e, chatHistory = []) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend(chatHistory);
      }
    },
    [handleSend]
  );

  const handleImg = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      setImg({
        file,
        url: URL.createObjectURL(file),
      });
    }
  }, []);
  const handleEmoji = useCallback((emojiObject) => {
    setText((prev) => prev + emojiObject.emoji);
  }, []);

  const renderMessage = useCallback(
    (message) => {
      const isOwn = message.senderId === currentUser.id;
      const uniqueKey = `${message.id || message.createdAt}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      return {
        ...message,
        isOwn,
        uniqueKey,
      };
    },
    [currentUser.id]
  );

  const memoizedMessages = useMemo(
    () => messages.map(renderMessage),
    [messages, renderMessage]
  );

  return {
    messages: memoizedMessages,
    text,
    setText,
    img,
    setImg,
    open,
    setOpen,
    isAudioEnabled,
    enableAudio,
    playingMessageId,
    user,
    isCurrentUserBlocked,
    isReceiverBlocked,
    endRef,
    chatContainerRef,
    handleSend,
    handleKeyPress,
    handleImg,
    handleEmoji,
    toggleAudio,
  };
};

export default useChat;
