/**
 * Format a timestamp string to a readable time format
 * @param timestamp ISO string timestamp
 * @returns Formatted time string (e.g., "14:30")
 */
export function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (error) {
    console.error("Error formatting timestamp:", error);
    return "Unknown time";
  }
}