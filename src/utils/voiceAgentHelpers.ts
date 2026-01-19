/**
 * Helper utilities for voice agent webhook processing
 */

/**
 * Parse relative date strings like "Tomorrow", "Today" to actual dates
 */
export function parseRelativeDate(dateStr: string): string {
  if (!dateStr) {
    return new Date().toISOString().split('T')[0];
  }

  const lower = dateStr.toLowerCase().trim();
  const today = new Date();
  
  // Handle "Tomorrow"
  if (lower.includes('tomorrow')) {
    today.setDate(today.getDate() + 1);
    return today.toISOString().split('T')[0];
  }
  
  // Handle "Today"
  if (lower.includes('today')) {
    return today.toISOString().split('T')[0];
  }
  
  // Handle "Next Monday", "Next Tuesday", etc.
  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  for (let i = 0; i < daysOfWeek.length; i++) {
    if (lower.includes(daysOfWeek[i])) {
      const targetDay = i;
      const currentDay = today.getDay();
      let daysToAdd = targetDay - currentDay;
      
      if (daysToAdd <= 0) {
        daysToAdd += 7; // Next week
      }
      
      today.setDate(today.getDate() + daysToAdd);
      return today.toISOString().split('T')[0];
    }
  }
  
  // Try to parse as ISO date or return as-is
  try {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  } catch (e) {
    // Return as-is if can't parse
  }
  
  return dateStr;
}

/**
 * Parse time strings like "12 PM", "2:30 PM" to 24-hour format "HH:MM"
 */
export function parseTime(timeStr: string): string {
  if (!timeStr) {
    return '09:00'; // Default to 9 AM
  }

  const lower = timeStr.toLowerCase().trim();
  
  // Remove spaces
  const cleaned = lower.replace(/\s+/g, '');
  
  // Match patterns like "12pm", "2:30pm", "14:00"
  const match = cleaned.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  
  if (!match) {
    return '09:00'; // Default
  }
  
  let hours = parseInt(match[1]);
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const meridiem = match[3];
  
  // Convert to 24-hour format
  if (meridiem === 'pm' && hours !== 12) {
    hours += 12;
  } else if (meridiem === 'am' && hours === 12) {
    hours = 0;
  }
  
  // Ensure valid range
  if (hours < 0 || hours > 23) hours = 9;
  if (minutes < 0 || minutes > 59) return `${hours.toString().padStart(2, '0')}:00`;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Format and validate phone number
 * Prioritizes Retell's call.from_number, falls back to extracted
 */
export function formatPhoneNumber(
  fromNumber?: string,
  extractedNumber?: string
): string {
  // Use Retell's from_number as source of truth
  const phoneToUse = fromNumber || extractedNumber || '';
  
  if (!phoneToUse) {
    return 'N/A';
  }
  
  // Remove all non-digit characters except +
  let cleaned = phoneToUse.replace(/[^\d+]/g, '');
  
  // Ensure it starts with +
  if (!cleaned.startsWith('+')) {
    // Assume US number if no country code
    if (cleaned.length === 10) {
      cleaned = '+1' + cleaned;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      cleaned = '+' + cleaned;
    } else {
      cleaned = '+' + cleaned;
    }
  }
  
  return cleaned;
}

/**
 * Convert duration in seconds to "M:SS" format
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return '0:00';
  
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Extract patient name from various formats
 */
export function extractPatientName(name?: string): string {
  if (!name) return 'Unknown Patient';
  
  // Trim and capitalize first letter of each word
  return name
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Determine channel type from call data
 */
export function getChannelType(call: any): 'web_call' | 'phone_call' {
  // Check if it's a web call based on access_token presence or other indicators
  if (call?.access_token || call?.channel_type === 'web') {
    return 'web_call';
  }
  return 'phone_call';
}

/**
 * Calculate call cost summary
 */
export function calculateCostSummary(callCost: any) {
  if (!callCost) {
    return {
      totalCost: 0,
      durationSeconds: 0,
      breakdown: []
    };
  }
  
  return {
    totalCost: callCost.combined_cost || callCost.total_cost || 0,
    durationSeconds: callCost.total_duration_seconds || 0,
    breakdown: (callCost.product_costs || []).map((item: any) => ({
      product: item.product,
      cost: item.cost,
      unitPrice: item.unit_price
    }))
  };
}
