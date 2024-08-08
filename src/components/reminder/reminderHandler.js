import React, { useEffect, useCallback, useRef } from "react";
import { useUserStore } from "../../store/userStore";
import { useReminderStore } from "../../store/reminderStore";
import { useChatStore } from "../../store/chatStore";
import { log, error } from "../../utils/logger";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  arrayUnion,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../services/firebase";
import { useAuthStore } from "../../store/authStore"; // Import the auth store

const ReminderHandler = () => {
  const { currentUser } = useUserStore();
  const { checkDueReminders, markReminderCompleted } = useReminderStore();
  const { addMessage } = useChatStore();
  const { isAuthenticated } = useAuthStore(); // Get authentication status
  const intervalIdRef = useRef(null);
  const unsubscribeRef = useRef(null);

  const sendReminderMessage = useCallback(
    async (reminder, chatId) => {
      const reminderText = `${
        currentUser.username
      }, you need to remember to take ${
        reminder.dosage ? `${reminder.dosage} ` : ""
      }${reminder.medication}.`;
      const reminderMessage = {
        id: `reminder-${reminder.id}`,
        senderId: "med-reminder",
        text: reminderText,
        createdAt: new Date().toISOString(),
        type: "reminder",
      };

      try {
        await addMessage(reminderMessage, chatId);
        log(`Sent reminder message: ${reminderText}`);
        await markReminderCompleted(reminder.id);
      } catch (err) {
        error(`Error sending reminder message: ${err.message}`);
      }
    },
    [addMessage, markReminderCompleted, currentUser?.username]
  );

  const checkReminders = useCallback(async () => {
    if (currentUser && currentUser.id && isAuthenticated) {
      try {
        const now = new Date();
        log(`Checking reminders at ${now.toISOString()}`);
        const dueReminders = await checkDueReminders(currentUser.id);
        if (dueReminders && dueReminders.length > 0) {
          log(`Found ${dueReminders.length} due reminders`);
          const medReminderChatId = `ai-assistant-med-reminder-${currentUser.id}`;
          const chatRef = doc(db, "chats", medReminderChatId);
          const chatDoc = await getDoc(chatRef);

          if (!chatDoc.exists()) {
            log(`Creating new chat for reminders: ${medReminderChatId}`);
            await setDoc(chatRef, { messages: [] });

            // Add MedRemind chat to userchats
            const userChatsRef = doc(db, "userchats", currentUser.id);
            await updateDoc(userChatsRef, {
              chats: arrayUnion({
                chatId: medReminderChatId,
                receiverId: "med-reminder",
                lastMessage: "Medication Reminder",
                updatedAt: new Date().toISOString(),
              }),
            });
          }

          for (const reminder of dueReminders) {
            await sendReminderMessage(reminder, medReminderChatId);
          }
        } else {
          log(`No due reminders found for user ${currentUser.id}`);
        }
      } catch (err) {
        error("Error checking reminders:", err);
      }
    }
  }, [currentUser, isAuthenticated, checkDueReminders, sendReminderMessage]);

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      log("Setting up reminder handler");
      const fetchRemindersAndCheck = async () => {
        await useReminderStore.getState().fetchReminders(currentUser.id);
        checkReminders();
      };
      fetchRemindersAndCheck();
      intervalIdRef.current = setInterval(checkReminders, 30000); // Check every 30 seconds

      // Set up listener for user's reminders
      const remindersRef = doc(db, "reminders", currentUser.id);
      unsubscribeRef.current = onSnapshot(remindersRef, (doc) => {
        if (doc.exists()) {
          log("Reminders updated, checking for due reminders");
          checkReminders();
        }
      });
    }

    return () => {
      log("Cleaning up reminder handler");
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [isAuthenticated, currentUser, checkReminders]);

  useEffect(() => {
    if (!isAuthenticated) {
      log("Authentication state changed, cleaning up ReminderHandler");
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    }
  }, [isAuthenticated]);

  return null;
};

export default ReminderHandler;
