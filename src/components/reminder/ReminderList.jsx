import React, { useEffect, useState } from "react";
import { useReminderStore } from "../../store/reminderStore";
import { useUserStore } from "../../store/userStore";
import { format, parseISO } from "date-fns";
import "./reminderList.css";
import { log } from "../../utils/logger";

const ReminderList = () => {
  const { currentUser } = useUserStore();
  const { reminders, fetchReminders, deleteReminder, markReminderCompleted } =
    useReminderStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadReminders = async () => {
      if (currentUser && currentUser.id) {
        setIsLoading(true);
        await fetchReminders(currentUser.id);
        setIsLoading(false);
      }
    };
    loadReminders();
  }, [currentUser, fetchReminders]);

  const handleDelete = async (reminderId) => {
    try {
      await deleteReminder(reminderId);
      log(`Reminder ${reminderId} deleted`);
    } catch (error) {
      log(`Error deleting reminder ${reminderId}:`, error);
    }
  };

  const handleMarkCompleted = async (reminderId) => {
    try {
      await markReminderCompleted(reminderId);
      log(`Reminder ${reminderId} marked as completed`);
    } catch (error) {
      log(`Error marking reminder ${reminderId} as completed:`, error);
    }
  };

  if (isLoading) {
    return <div className="reminder-list">Loading reminders...</div>;
  }

  return (
    <div className="reminder-list">
      <h2>Your Medication Reminders</h2>
      {reminders.length === 0 ? (
        <p>You have no active reminders.</p>
      ) : (
        <ul>
          {reminders.map((reminder) => (
            <li
              key={reminder.id}
              className={`reminder-item ${
                reminder.isCompleted ? "completed" : ""
              }`}
            >
              <div className="reminder-content">
                <h3>{reminder.medication}</h3>
                <p>Dosage: {reminder.dosage || "Not specified"}</p>
                <p>Time: {format(parseISO(reminder.time), "pp")}</p>
                {reminder.frequency && <p>Frequency: {reminder.frequency}</p>}
              </div>
              <div className="reminder-actions">
                {!reminder.isCompleted && (
                  <button onClick={() => handleMarkCompleted(reminder.id)}>
                    Mark Completed
                  </button>
                )}
                <button onClick={() => handleDelete(reminder.id)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ReminderList;
