import { log, error, warn, info } from "./logger";

export const parseReminderInput = (input) => {
  log(`Parsing reminder input: ${input}`);

  const result = {
    medication: null,
    dosage: null,
    time: null,
    frequency: null,
  };

  // Extract medication name and dosage
  const medicationMatch = input.match(
    /take\s+(?:(\d+(?:\.\d+)?)\s+)?(.+?)\s+(?:at|every|each)/i
  );
  if (medicationMatch) {
    result.dosage = medicationMatch[1];
    result.medication = medicationMatch[2].trim().toLowerCase();
  }

  // Extract time
  const timeMatch = input.match(/at\s+(\d{1,2}(?::\d{2})?(?:\s*[ap]m)?)/i);
  if (timeMatch) {
    result.time = normalizeTime(timeMatch[1]);
  }

  // Extract frequency
  const frequencyMatch = input.match(
    /(?:every|each)\s+(day|week|month|(\d+)\s+(?:days?|weeks?|months?))/i
  );
  if (frequencyMatch) {
    result.frequency = frequencyMatch[0].toLowerCase();
  }

  log(`Parsed reminder: ${JSON.stringify(result)}`);
  return result;
};

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

export const formatReminderResponse = (parsedReminder) => {
  const { medication, dosage, time, frequency } = parsedReminder;

  if (!medication || !time) {
    return "I'm sorry, I couldn't understand the medication or time for your reminder. Could you please rephrase your request?";
  }

  let response = `I've set a reminder for you to take`;
  if (dosage) {
    response += ` ${dosage}`;
  }
  response += ` ${medication} at ${formatTimeForDisplay(time)}`;
  if (frequency) response += ` ${frequency}`;
  response += ". Is there anything else you'd like me to remind you about?";

  return response;
};

const formatTimeForDisplay = (time) => {
  const [hours, minutes] = time.split(':');
  const parsedHours = parseInt(hours, 10);
  const period = parsedHours >= 12 ? 'PM' : 'AM';
  const displayHours = parsedHours % 12 || 12;
  return `${displayHours}:${minutes} ${period}`;
};