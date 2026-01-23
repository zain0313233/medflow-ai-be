import { google } from 'googleapis';
import { IDoctorProfile } from '../models/DoctorProfile';

interface CalendarEventData {
  patientName: string;
  patientEmail: string;
  doctorName: string;
  doctorEmail: string;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:MM
  duration: number; // minutes
  reasonForVisit: string;
  consultationType: 'online' | 'in-person';
}

class GoogleCalendarService {
  private calendar;

  constructor() {
    // Initialize Google Calendar API with service account
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    this.calendar = google.calendar({ version: 'v3', auth });
  }

  /**
   * Create a calendar event with Google Meet link
   */
  async createAppointmentEvent(
    doctor: IDoctorProfile,
    eventData: CalendarEventData
  ): Promise<{ success: boolean; meetLink?: string; eventId?: string; error?: string }> {
    try {
      // Check if doctor has calendar enabled
      if (!doctor.googleCalendarEnabled || !doctor.googleCalendarId) {
        console.log('Doctor calendar not enabled or calendar ID missing');
        return {
          success: false,
          error: 'Doctor calendar not configured',
        };
      }

      // Parse date and time
      const startDateTime = this.createDateTime(
        eventData.appointmentDate,
        eventData.appointmentTime
      );
      const endDateTime = new Date(startDateTime.getTime() + eventData.duration * 60000);

      // Create event
      const event = {
        summary: `Appointment: ${eventData.patientName}`,
        description: `
Patient: ${eventData.patientName}
Doctor: ${eventData.doctorName}
Reason: ${eventData.reasonForVisit}
Type: ${eventData.consultationType}

This is an automated appointment booking from Nova Health Clinic.
        `.trim(),
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: 'Asia/Karachi', // Adjust to your timezone
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: 'Asia/Karachi',
        },
        attendees: [
          { email: eventData.patientEmail, displayName: eventData.patientName },
          { email: eventData.doctorEmail, displayName: eventData.doctorName },
        ],
        conferenceData: {
          createRequest: {
            requestId: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 day before
            { method: 'popup', minutes: 30 }, // 30 minutes before
          ],
        },
      };

      const response = await this.calendar.events.insert({
        calendarId: doctor.googleCalendarId,
        conferenceDataVersion: 1,
        requestBody: event,
        sendUpdates: 'all', // Send email to all attendees
      });

      const meetLink = response.data.hangoutLink || response.data.conferenceData?.entryPoints?.[0]?.uri || undefined;

      console.log('Calendar event created successfully:', response.data.id);

      return {
        success: true,
        meetLink,
        eventId: response.data.id || undefined,
      };
    } catch (error: any) {
      console.error('Error creating calendar event:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Helper: Create Date object from date and time strings
   */
  private createDateTime(date: string, time: string): Date {
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);
    return new Date(year, month - 1, day, hours, minutes);
  }

  /**
   * Delete a calendar event
   */
  async deleteAppointmentEvent(
    calendarId: string,
    eventId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.calendar.events.delete({
        calendarId,
        eventId,
        sendUpdates: 'all',
      });

      console.log('Calendar event deleted successfully:', eventId);
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting calendar event:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update a calendar event
   */
  async updateAppointmentEvent(
    calendarId: string,
    eventId: string,
    updates: Partial<CalendarEventData>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get existing event
      const existingEvent = await this.calendar.events.get({
        calendarId,
        eventId,
      });

      // Update fields
      const updatedEvent = {
        ...existingEvent.data,
        summary: updates.patientName
          ? `Appointment: ${updates.patientName}`
          : existingEvent.data.summary,
      };

      await this.calendar.events.update({
        calendarId,
        eventId,
        requestBody: updatedEvent,
        sendUpdates: 'all',
      });

      console.log('Calendar event updated successfully:', eventId);
      return { success: true };
    } catch (error: any) {
      console.error('Error updating calendar event:', error.message);
      return { success: false, error: error.message };
    }
  }
}

export default new GoogleCalendarService();
