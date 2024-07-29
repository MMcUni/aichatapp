import { db } from "./firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  writeBatch,
  limit,
  startAfter,
} from "firebase/firestore";
import { log, error, warn, info } from "../utils/logger";
import { format, parseISO, isAfter, isBefore } from "date-fns";

const REMINDERS_COLLECTION = "reminders";

const normalizeTime = (timeString) => {
  let [time, period] = timeString.toLowerCase().split(/\s+/);
  let [hours, minutes] = time.split(":");
  
  hours = parseInt(hours, 10);
  minutes = minutes ? parseInt(minutes, 10) : 0;

  if (period === "pm" && hours !== 12) {
    hours += 12;
  } else if (period === "am" && hours === 12) {
    hours = 0;
  }

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
};

export const createReminder = async (userId, reminderData) => {
  try {
    const reminder = {
      userId,
      medication: reminderData.medication,
      dosage: reminderData.dosage,
      time: reminderData.time, // The time should already be normalized in parseReminderInput
      frequency: reminderData.frequency,
      createdAt: new Date().toISOString(),
      isCompleted: false,
    };
    log(`Attempting to create reminder: ${JSON.stringify(reminder)}`);
    const docRef = await addDoc(collection(db, REMINDERS_COLLECTION), reminder);
    log(`Reminder created with ID: ${docRef.id}`);
    return { id: docRef.id, ...reminder };
  } catch (err) {
    error("Error creating reminder:", err);
    throw new Error(`Failed to create reminder: ${err.message}`);
  }
};

export const updateReminder = async (reminderId, updateData) => {
  try {
    const reminderRef = doc(db, REMINDERS_COLLECTION, reminderId);
    await updateDoc(reminderRef, updateData);
    log(`Reminder updated: ${reminderId}`);
  } catch (err) {
    error("Error updating reminder:", err);
    throw new Error(`Failed to update reminder: ${err.message}`);
  }
};

export const deleteReminder = async (reminderId) => {
  try {
    await deleteDoc(doc(db, REMINDERS_COLLECTION, reminderId));
    log(`Reminder deleted: ${reminderId}`);
  } catch (err) {
    error("Error deleting reminder:", err);
    throw new Error(`Failed to delete reminder: ${err.message}`);
  }
};

export const getUserReminders = async (
  userId,
  pageSize = 20,
  lastVisible = null
) => {
  try {
    let q = query(
      collection(db, REMINDERS_COLLECTION),
      where("userId", "==", userId),
      limit(pageSize)
    );

    if (lastVisible) {
      q = query(q, startAfter(lastVisible));
    }

    const querySnapshot = await getDocs(q);
    const reminders = [];
    querySnapshot.forEach((doc) => {
      reminders.push({ id: doc.id, ...doc.data() });
    });
    log(`Retrieved ${reminders.length} reminders for user ${userId}`);

    const lastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
    return { reminders, lastVisible: lastVisibleDoc };
  } catch (err) {
    if (err.code === "permission-denied") {
      warn(`Permission denied when fetching reminders for user ${userId}`);
      return { reminders: [], lastVisible: null };
    }
    error("Error getting user reminders:", err);
    throw new Error(`Failed to get user reminders: ${err.message}`);
  }
};

export const checkDueReminders = async (userId) => {
  try {
    const remindersRef = collection(db, REMINDERS_COLLECTION);
    const now = new Date();
    const currentTime = format(now, "HH:mm");

    const q = query(
      remindersRef,
      where("userId", "==", userId),
      where("isCompleted", "==", false)
    );

    const querySnapshot = await getDocs(q);
    const dueReminders = [];
    querySnapshot.forEach((doc) => {
      const reminderData = doc.data();
      const reminderTime = reminderData.time; // This should now be in "HH:mm" format
      if (reminderTime <= currentTime) {
        dueReminders.push({ id: doc.id, ...reminderData });
      }
    });

    log(`Found ${dueReminders.length} due reminders for user ${userId}`);
    return dueReminders;
  } catch (err) {
    error("Error checking due reminders:", err);
    throw new Error(`Failed to check due reminders: ${err.message}`);
  }
};

export const markReminderAsCompleted = async (reminderId) => {
  try {
    await markRemindersAsCompleted([reminderId]);
    log(`Marked reminder ${reminderId} as completed`);
  } catch (err) {
    error("Error marking reminder as completed:", err);
    throw new Error(`Failed to mark reminder as completed: ${err.message}`);
  }
};

export const markRemindersAsCompleted = async (reminderIds) => {
  try {
    const batch = writeBatch(db);
    reminderIds.forEach((id) => {
      const reminderRef = doc(db, REMINDERS_COLLECTION, id);
      batch.update(reminderRef, { isCompleted: true });
    });
    await batch.commit();
    log(`Marked ${reminderIds.length} reminders as completed`);
  } catch (err) {
    error("Error marking reminders as completed:", err);
    throw new Error(`Failed to mark reminders as completed: ${err.message}`);
  }
};
