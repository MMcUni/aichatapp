import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

import {
  createReminder,
  updateReminder,
  deleteReminder,
  getUserReminders,
  checkDueReminders as checkDueRemindersService,
  markReminderAsCompleted,
} from "../services/reminderService";
import { log, error } from "../utils/logger";

export const useReminderStore = create(
  immer((set, get) => ({
    reminders: [],
    isLoading: false,
    error: null,

    clearError: () => set({ error: null }),

    fetchReminders: async (userId) => {
      set({ isLoading: true, error: null });
      try {
        const reminders = await getUserReminders(userId);
        set((state) => {
          state.reminders = reminders;
          state.isLoading = false;
        });
        log(`Fetched ${reminders.length} reminders for user ${userId}`);
      } catch (err) {
        error("Error fetching reminders:", err);
        set({ error: "Failed to fetch reminders", isLoading: false });
      }
    },

    addReminder: async (userId, reminderData) => {
      set({ isLoading: true, error: null });
      try {
        log(`Attempting to add reminder for user ${userId}: ${JSON.stringify(reminderData)}`);
        const newReminder = await createReminder(userId, reminderData);
        set((state) => {
          state.reminders.push(newReminder);
          state.isLoading = false;
        });
        log(`Added new reminder for user ${userId}: ${JSON.stringify(newReminder)}`);
      } catch (err) {
        error("Error adding reminder:", err);
        set({ error: "Failed to add reminder", isLoading: false });
      }
    },

    updateReminder: async (reminderId, updateData) => {
      set({ isLoading: true, error: null });
      try {
        await updateReminder(reminderId, updateData);
        set((state) => {
          const reminderIndex = state.reminders.findIndex((r) => r.id === reminderId);
          if (reminderIndex !== -1) {
            state.reminders[reminderIndex] = { ...state.reminders[reminderIndex], ...updateData };
          }
          state.isLoading = false;
        });
        log(`Updated reminder ${reminderId}`);
      } catch (err) {
        error("Error updating reminder:", err);
        set({ error: "Failed to update reminder", isLoading: false });
      }
    },

    deleteReminder: async (reminderId) => {
      set({ isLoading: true, error: null });
      try {
        await deleteReminder(reminderId);
        set((state) => {
          state.reminders = state.reminders.filter((reminder) => reminder.id !== reminderId);
          state.isLoading = false;
        });
        log(`Deleted reminder ${reminderId}`);
      } catch (err) {
        error("Error deleting reminder:", err);
        set({ error: "Failed to delete reminder", isLoading: false });
      }
    },

    checkDueReminders: async (userId) => {
      try {
        const dueReminders = await checkDueRemindersService(userId);
        log(`Found ${dueReminders.length} due reminders for user ${userId}`);
        return dueReminders;
      } catch (err) {
        error("Error checking due reminders:", err);
        return [];
      }
    },

    markReminderCompleted: async (reminderId) => {
      try {
        await markReminderAsCompleted(reminderId);
        set((state) => {
          const reminderIndex = state.reminders.findIndex((r) => r.id === reminderId);
          if (reminderIndex !== -1) {
            state.reminders[reminderIndex].isCompleted = true;
            state.reminders[reminderIndex].isDue = false;
          }
        });
        log(`Marked reminder ${reminderId} as completed`);
      } catch (err) {
        error("Error marking reminder as completed:", err);
        set({ error: "Failed to mark reminder as completed" });
      }
    },
  }))
);