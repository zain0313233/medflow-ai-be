import nodemailer from 'nodemailer';

interface AppointmentEmailData {
  patientName: string;
  patientEmail: string;
  doctorName: string;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:MM
  reasonForVisit: string;
  consultationType: 'online' | 'in-person';
  confirmationNumber: string;
  clinicAddress?: string;
  clinicPhone?: string;
}

interface DelayNotificationData {
  patientName: string;
  patientEmail: string;
  doctorName: string;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:MM
  reasonForVisit: string;
  consultationType: 'online' | 'in-person';
  confirmationNumber: string;
  clinicAddress?: string;
  clinicPhone?: string;
  originalTime: string;
  estimatedTime: string;
  delayMinutes: number;
  reason?: string;
}

class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  /**
   * Send appointment confirmation email (without calendar invite)
   * Used when Google Calendar is not configured
   */
  async sendAppointmentConfirmationEmail(data: AppointmentEmailData): Promise<boolean> {
    try {
      console.log('📧 Sending appointment confirmation email to:', data.patientEmail);

      const formattedDate = this.formatDate(data.appointmentDate);
      const formattedTime = this.formatTime(data.appointmentTime);

      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .content {
      background: #f9f9f9;
      padding: 30px;
      border: 1px solid #ddd;
      border-top: none;
    }
    .confirmation-box {
      background: white;
      border: 2px solid #667eea;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      text-align: center;
    }
    .confirmation-number {
      font-size: 24px;
      font-weight: bold;
      color: #667eea;
      margin: 10px 0;
    }
    .details-table {
      width: 100%;
      margin: 20px 0;
      background: white;
      border-radius: 8px;
      overflow: hidden;
    }
    .details-table tr {
      border-bottom: 1px solid #eee;
    }
    .details-table tr:last-child {
      border-bottom: none;
    }
    .details-table td {
      padding: 15px;
    }
    .details-table td:first-child {
      font-weight: bold;
      color: #667eea;
      width: 40%;
    }
    .badge {
      display: inline-block;
      padding: 5px 15px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .badge-online {
      background: #10b981;
      color: white;
    }
    .badge-inperson {
      background: #3b82f6;
      color: white;
    }
    .footer {
      background: #f9f9f9;
      padding: 20px;
      text-align: center;
      border: 1px solid #ddd;
      border-top: none;
      border-radius: 0 0 10px 10px;
      font-size: 14px;
      color: #666;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background: #667eea;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      margin: 10px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>✅ Appointment Confirmed</h1>
    <p>Nova Health Clinic</p>
  </div>
  
  <div class="content">
    <p>Dear ${data.patientName},</p>
    
    <p>Your appointment has been successfully booked! Please save this confirmation for your records.</p>
    
    <div class="confirmation-box">
      <p style="margin: 0; color: #666;">Confirmation Number</p>
      <div class="confirmation-number">${data.confirmationNumber}</div>
      <p style="margin: 0; font-size: 12px; color: #999;">Please keep this number for reference</p>
    </div>
    
    <table class="details-table">
      <tr>
        <td>👨‍⚕️ Doctor</td>
        <td>${data.doctorName}</td>
      </tr>
      <tr>
        <td>📅 Date</td>
        <td>${formattedDate}</td>
      </tr>
      <tr>
        <td>🕐 Time</td>
        <td>${formattedTime}</td>
      </tr>
      <tr>
        <td>📝 Reason</td>
        <td>${data.reasonForVisit}</td>
      </tr>
      <tr>
        <td>💼 Type</td>
        <td>
          <span class="badge ${data.consultationType === 'online' ? 'badge-online' : 'badge-inperson'}">
            ${data.consultationType === 'online' ? '🎥 Online' : '🏥 In-Person'}
          </span>
        </td>
      </tr>
      ${data.clinicAddress ? `
      <tr>
        <td>📍 Location</td>
        <td>${data.clinicAddress}</td>
      </tr>
      ` : ''}
      ${data.clinicPhone ? `
      <tr>
        <td>📞 Contact</td>
        <td>${data.clinicPhone}</td>
      </tr>
      ` : ''}
    </table>
    
    <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 5px; padding: 15px; margin: 20px 0;">
      <strong>⚠️ Important Reminders:</strong>
      <ul style="margin: 10px 0; padding-left: 20px;">
        <li>Please arrive 10 minutes before your appointment time</li>
        <li>Bring your ID and insurance card (if applicable)</li>
        <li>If you need to reschedule or cancel, please contact us at least 24 hours in advance</li>
      </ul>
    </div>
    
    <p style="text-align: center;">
      <a href="tel:${data.clinicPhone || '+1234567890'}" class="button">📞 Call Clinic</a>
    </p>
  </div>
  
  <div class="footer">
    <p><strong>Nova Health Clinic</strong></p>
    <p>Thank you for choosing us for your healthcare needs!</p>
    <p style="font-size: 12px; color: #999; margin-top: 10px;">
      This is an automated email. Please do not reply to this message.
    </p>
  </div>
</body>
</html>
      `;

      const mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
        to: data.patientEmail,
        subject: `Appointment Confirmed - ${data.confirmationNumber}`,
        html: emailHtml,
      };

      await this.transporter.sendMail(mailOptions);
      console.log('✅ Appointment confirmation email sent successfully');
      return true;

    } catch (error: any) {
      console.error('❌ Error sending appointment confirmation email:', error.message);
      return false;
    }
  }

  /**
   * Format date to readable format
   */
  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  }

  /**
   * Format time to readable format
   */
  private formatTime(timeString: string): string {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  /**
   * Send appointment reschedule email
   */
  async sendRescheduleEmail(data: AppointmentEmailData & { 
    oldDate: string; 
    oldTime: string;
  }): Promise<boolean> {
    try {
      console.log('📧 Sending reschedule email to:', data.patientEmail);

      const oldFormattedDate = this.formatDate(data.oldDate);
      const oldFormattedTime = this.formatTime(data.oldTime);
      const newFormattedDate = this.formatDate(data.appointmentDate);
      const newFormattedTime = this.formatTime(data.appointmentTime);

      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .content {
      background: #f9f9f9;
      padding: 30px;
      border: 1px solid #ddd;
      border-top: none;
    }
    .confirmation-box {
      background: white;
      border: 2px solid #f59e0b;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      text-align: center;
    }
    .confirmation-number {
      font-size: 24px;
      font-weight: bold;
      color: #f59e0b;
      margin: 10px 0;
    }
    .change-box {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 20px 0;
      border-radius: 5px;
    }
    .old-details {
      text-decoration: line-through;
      color: #999;
      margin-bottom: 10px;
    }
    .new-details {
      color: #059669;
      font-weight: bold;
      font-size: 18px;
    }
    .details-table {
      width: 100%;
      margin: 20px 0;
      background: white;
      border-radius: 8px;
      overflow: hidden;
    }
    .details-table tr {
      border-bottom: 1px solid #eee;
    }
    .details-table tr:last-child {
      border-bottom: none;
    }
    .details-table td {
      padding: 15px;
    }
    .details-table td:first-child {
      font-weight: bold;
      color: #f59e0b;
      width: 40%;
    }
    .badge {
      display: inline-block;
      padding: 5px 15px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .badge-online {
      background: #10b981;
      color: white;
    }
    .badge-inperson {
      background: #3b82f6;
      color: white;
    }
    .footer {
      background: #f9f9f9;
      padding: 20px;
      text-align: center;
      border: 1px solid #ddd;
      border-top: none;
      border-radius: 0 0 10px 10px;
      font-size: 14px;
      color: #666;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background: #f59e0b;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      margin: 10px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔄 Appointment Rescheduled</h1>
    <p>Nova Health Clinic</p>
  </div>
  
  <div class="content">
    <p>Dear ${data.patientName},</p>
    
    <p>Your appointment has been successfully rescheduled. Here are your updated appointment details:</p>
    
    <div class="confirmation-box">
      <p style="margin: 0; color: #666;">Confirmation Number</p>
      <div class="confirmation-number">${data.confirmationNumber}</div>
    </div>

    <div class="change-box">
      <p style="margin: 0 0 10px 0; font-weight: bold; color: #d97706;">📅 Schedule Change:</p>
      <div class="old-details">
        Previous: ${oldFormattedDate} at ${oldFormattedTime}
      </div>
      <div class="new-details">
        New: ${newFormattedDate} at ${newFormattedTime} ✓
      </div>
    </div>
    
    <table class="details-table">
      <tr>
        <td>👨‍⚕️ Doctor</td>
        <td>${data.doctorName}</td>
      </tr>
      <tr>
        <td>📅 New Date</td>
        <td>${newFormattedDate}</td>
      </tr>
      <tr>
        <td>🕐 New Time</td>
        <td>${newFormattedTime}</td>
      </tr>
      <tr>
        <td>📝 Reason</td>
        <td>${data.reasonForVisit}</td>
      </tr>
      <tr>
        <td>💼 Type</td>
        <td>
          <span class="badge ${data.consultationType === 'online' ? 'badge-online' : 'badge-inperson'}">
            ${data.consultationType === 'online' ? '🎥 Online' : '🏥 In-Person'}
          </span>
        </td>
      </tr>
      ${data.clinicAddress ? `
      <tr>
        <td>📍 Location</td>
        <td>${data.clinicAddress}</td>
      </tr>
      ` : ''}
      ${data.clinicPhone ? `
      <tr>
        <td>📞 Contact</td>
        <td>${data.clinicPhone}</td>
      </tr>
      ` : ''}
    </table>
    
    <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 5px; padding: 15px; margin: 20px 0;">
      <strong>⚠️ Important Reminders:</strong>
      <ul style="margin: 10px 0; padding-left: 20px;">
        <li>Please arrive 10 minutes before your appointment time</li>
        <li>Bring your ID and insurance card (if applicable)</li>
        <li>If you need to reschedule again, please contact us at least 24 hours in advance</li>
      </ul>
    </div>
    
    <p style="text-align: center;">
      <a href="tel:${data.clinicPhone || '+1234567890'}" class="button">📞 Call Clinic</a>
    </p>
  </div>
  
  <div class="footer">
    <p><strong>Nova Health Clinic</strong></p>
    <p>Thank you for choosing us for your healthcare needs!</p>
    <p style="font-size: 12px; color: #999; margin-top: 10px;">
      This is an automated email. Please do not reply to this message.
    </p>
  </div>
</body>
</html>
      `;

      const mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
        to: data.patientEmail,
        subject: `Appointment Rescheduled - ${data.confirmationNumber}`,
        html: emailHtml,
      };

      await this.transporter.sendMail(mailOptions);
      console.log('✅ Reschedule email sent successfully');
      return true;

    } catch (error: any) {
      console.error('❌ Error sending reschedule email:', error.message);
      return false;
    }
  }

  /**
   * Send appointment cancellation email
   */
  async sendCancellationEmail(data: AppointmentEmailData): Promise<boolean> {
    try {
      console.log('📧 Sending cancellation email to:', data.patientEmail);

      const formattedDate = this.formatDate(data.appointmentDate);
      const formattedTime = this.formatTime(data.appointmentTime);

      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .content {
      background: #f9f9f9;
      padding: 30px;
      border: 1px solid #ddd;
      border-top: none;
    }
    .confirmation-box {
      background: white;
      border: 2px solid #ef4444;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      text-align: center;
    }
    .confirmation-number {
      font-size: 24px;
      font-weight: bold;
      color: #ef4444;
      margin: 10px 0;
    }
    .details-table {
      width: 100%;
      margin: 20px 0;
      background: white;
      border-radius: 8px;
      overflow: hidden;
    }
    .details-table tr {
      border-bottom: 1px solid #eee;
    }
    .details-table tr:last-child {
      border-bottom: none;
    }
    .details-table td {
      padding: 15px;
    }
    .details-table td:first-child {
      font-weight: bold;
      color: #ef4444;
      width: 40%;
    }
    .footer {
      background: #f9f9f9;
      padding: 20px;
      text-align: center;
      border: 1px solid #ddd;
      border-top: none;
      border-radius: 0 0 10px 10px;
      font-size: 14px;
      color: #666;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background: #667eea;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      margin: 10px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>❌ Appointment Cancelled</h1>
    <p>Nova Health Clinic</p>
  </div>
  
  <div class="content">
    <p>Dear ${data.patientName},</p>
    
    <p>Your appointment has been cancelled as requested. Here are the details of the cancelled appointment:</p>
    
    <div class="confirmation-box">
      <p style="margin: 0; color: #666;">Confirmation Number</p>
      <div class="confirmation-number">${data.confirmationNumber}</div>
      <p style="margin: 10px 0 0 0; color: #ef4444; font-weight: bold;">CANCELLED</p>
    </div>
    
    <table class="details-table">
      <tr>
        <td>👨‍⚕️ Doctor</td>
        <td>${data.doctorName}</td>
      </tr>
      <tr>
        <td>📅 Date</td>
        <td>${formattedDate}</td>
      </tr>
      <tr>
        <td>🕐 Time</td>
        <td>${formattedTime}</td>
      </tr>
      <tr>
        <td>📝 Reason</td>
        <td>${data.reasonForVisit}</td>
      </tr>
    </table>
    
    <div style="background: #dbeafe; border: 1px solid #3b82f6; border-radius: 5px; padding: 15px; margin: 20px 0;">
      <strong>💡 Need to Book Again?</strong>
      <p style="margin: 10px 0 0 0;">
        If you'd like to schedule a new appointment, please call us or use our voice booking system.
      </p>
    </div>
    
    <p style="text-align: center;">
      <a href="tel:${data.clinicPhone || '+1234567890'}" class="button">📞 Call to Rebook</a>
    </p>
  </div>
  
  <div class="footer">
    <p><strong>Nova Health Clinic</strong></p>
    <p>We hope to see you again soon!</p>
    <p style="font-size: 12px; color: #999; margin-top: 10px;">
      This is an automated email. Please do not reply to this message.
    </p>
  </div>
</body>
</html>
      `;

      const mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
        to: data.patientEmail,
        subject: `Appointment Cancelled - ${data.confirmationNumber}`,
        html: emailHtml,
      };

      await this.transporter.sendMail(mailOptions);
      console.log('✅ Cancellation email sent successfully');
      return true;

    } catch (error: any) {
      console.error('❌ Error sending cancellation email:', error.message);
      return false;
    }
  }

  /**
   * Send appointment reminder email (24 hours before)
   */
  async sendAppointmentReminder(data: AppointmentEmailData): Promise<boolean> {
    try {
      console.log('📧 Sending appointment reminder to:', data.patientEmail);

      const formattedDate = this.formatDate(data.appointmentDate);
      const formattedTime = this.formatTime(data.appointmentTime);

      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .content {
      background: #f9f9f9;
      padding: 30px;
      border: 1px solid #ddd;
      border-top: none;
    }
    .reminder-box {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border: 2px solid #f59e0b;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      text-align: center;
    }
    .reminder-time {
      font-size: 32px;
      font-weight: bold;
      color: #d97706;
      margin: 10px 0;
    }
    .confirmation-box {
      background: white;
      border: 2px solid #8b5cf6;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      text-align: center;
    }
    .confirmation-number {
      font-size: 20px;
      font-weight: bold;
      color: #8b5cf6;
      margin: 10px 0;
    }
    .details-table {
      width: 100%;
      margin: 20px 0;
      background: white;
      border-radius: 8px;
      overflow: hidden;
    }
    .details-table tr {
      border-bottom: 1px solid #eee;
    }
    .details-table tr:last-child {
      border-bottom: none;
    }
    .details-table td {
      padding: 15px;
    }
    .details-table td:first-child {
      font-weight: bold;
      color: #8b5cf6;
      width: 40%;
    }
    .badge {
      display: inline-block;
      padding: 5px 15px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .badge-online {
      background: #10b981;
      color: white;
    }
    .badge-inperson {
      background: #3b82f6;
      color: white;
    }
    .footer {
      background: #f9f9f9;
      padding: 20px;
      text-align: center;
      border: 1px solid #ddd;
      border-top: none;
      border-radius: 0 0 10px 10px;
      font-size: 14px;
      color: #666;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background: #8b5cf6;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      margin: 10px 5px;
    }
    .button-secondary {
      background: #6b7280;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>⏰ Appointment Reminder</h1>
    <p>Nova Health Clinic</p>
  </div>
  
  <div class="content">
    <p>Dear ${data.patientName},</p>
    
    <p>This is a friendly reminder about your upcoming appointment tomorrow.</p>
    
    <div class="reminder-box">
      <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: bold;">YOUR APPOINTMENT IS IN</p>
      <div class="reminder-time">24 HOURS</div>
      <p style="margin: 0; color: #92400e; font-size: 14px;">Don't forget!</p>
    </div>

    <div class="confirmation-box">
      <p style="margin: 0; color: #666; font-size: 12px;">Confirmation Number</p>
      <div class="confirmation-number">${data.confirmationNumber}</div>
    </div>
    
    <table class="details-table">
      <tr>
        <td>👨‍⚕️ Doctor</td>
        <td>${data.doctorName}</td>
      </tr>
      <tr>
        <td>📅 Date</td>
        <td><strong>${formattedDate}</strong></td>
      </tr>
      <tr>
        <td>🕐 Time</td>
        <td><strong>${formattedTime}</strong></td>
      </tr>
      <tr>
        <td>📝 Reason</td>
        <td>${data.reasonForVisit}</td>
      </tr>
      <tr>
        <td>💼 Type</td>
        <td>
          <span class="badge ${data.consultationType === 'online' ? 'badge-online' : 'badge-inperson'}">
            ${data.consultationType === 'online' ? '🎥 Online' : '🏥 In-Person'}
          </span>
        </td>
      </tr>
      ${data.clinicAddress ? `
      <tr>
        <td>📍 Location</td>
        <td>${data.clinicAddress}</td>
      </tr>
      ` : ''}
      ${data.clinicPhone ? `
      <tr>
        <td>📞 Contact</td>
        <td>${data.clinicPhone}</td>
      </tr>
      ` : ''}
    </table>
    
    <div style="background: #dbeafe; border: 1px solid #3b82f6; border-radius: 5px; padding: 15px; margin: 20px 0;">
      <strong>📋 Before Your Appointment:</strong>
      <ul style="margin: 10px 0; padding-left: 20px;">
        <li>Please arrive 10 minutes early</li>
        <li>Bring your ID and insurance card</li>
        <li>Bring any relevant medical records or test results</li>
        <li>List of current medications (if applicable)</li>
      </ul>
    </div>

    <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 5px; padding: 15px; margin: 20px 0;">
      <strong>⚠️ Need to Reschedule or Cancel?</strong>
      <p style="margin: 10px 0 0 0;">
        If you can't make it, please let us know at least 24 hours in advance. You can call us or use our voice assistant to reschedule.
      </p>
    </div>
    
    <p style="text-align: center;">
      <a href="tel:${data.clinicPhone || '+1234567890'}" class="button">📞 Call Clinic</a>
      <a href="#" class="button button-secondary">🔄 Reschedule</a>
    </p>
  </div>
  
  <div class="footer">
    <p><strong>Nova Health Clinic</strong></p>
    <p>We look forward to seeing you!</p>
    <p style="font-size: 12px; color: #999; margin-top: 10px;">
      This is an automated reminder. Please do not reply to this message.
    </p>
  </div>
</body>
</html>
      `;

      const mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
        to: data.patientEmail,
        subject: `⏰ Reminder: Appointment Tomorrow at ${formattedTime}`,
        html: emailHtml,
      };

      await this.transporter.sendMail(mailOptions);
      console.log('✅ Appointment reminder sent successfully');
      return true;

    } catch (error: any) {
      console.error('❌ Error sending appointment reminder:', error.message);
      return false;
    }
  }

  /**
   * Send appointment delay notification
   */
  async sendDelayNotification(data: DelayNotificationData): Promise<boolean> {
    try {
      console.log('📧 Sending delay notification to:', data.patientEmail);

      const formattedDate = this.formatDate(data.appointmentDate);
      const originalFormattedTime = this.formatTime(data.originalTime);
      const estimatedFormattedTime = this.formatTime(data.estimatedTime);

      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .content {
      background: #f9f9f9;
      padding: 30px;
      border: 1px solid #ddd;
      border-top: none;
    }
    .delay-box {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border: 2px solid #f59e0b;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      text-align: center;
    }
    .delay-time {
      font-size: 32px;
      font-weight: bold;
      color: #d97706;
      margin: 10px 0;
    }
    .time-change {
      background: white;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 20px 0;
      border-radius: 5px;
    }
    .old-time {
      text-decoration: line-through;
      color: #999;
      font-size: 18px;
    }
    .new-time {
      color: #059669;
      font-weight: bold;
      font-size: 24px;
      margin-top: 5px;
    }
    .details-table {
      width: 100%;
      margin: 20px 0;
      background: white;
      border-radius: 8px;
      overflow: hidden;
    }
    .details-table tr {
      border-bottom: 1px solid #eee;
    }
    .details-table tr:last-child {
      border-bottom: none;
    }
    .details-table td {
      padding: 15px;
    }
    .details-table td:first-child {
      font-weight: bold;
      color: #f59e0b;
      width: 40%;
    }
    .footer {
      background: #f9f9f9;
      padding: 20px;
      text-align: center;
      border: 1px solid #ddd;
      border-top: none;
      border-radius: 0 0 10px 10px;
      font-size: 14px;
      color: #666;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background: #f59e0b;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      margin: 10px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>⏰ Appointment Time Update</h1>
    <p>Nova Health Clinic</p>
  </div>
  
  <div class="content">
    <p>Dear ${data.patientName},</p>
    
    <p>We wanted to inform you that ${data.doctorName} is running a bit behind schedule today.</p>
    
    <div class="delay-box">
      <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: bold;">RUNNING LATE BY</p>
      <div class="delay-time">${data.delayMinutes} MINUTES</div>
      ${data.reason ? `<p style="margin: 10px 0 0 0; color: #92400e; font-size: 14px;">${data.reason}</p>` : ''}
    </div>

    <div class="time-change">
      <p style="margin: 0 0 10px 0; font-weight: bold; color: #d97706;">📅 Updated Appointment Time:</p>
      <div class="old-time">
        Original: ${originalFormattedTime}
      </div>
      <div class="new-time">
        New Time: ${estimatedFormattedTime} ✓
      </div>
    </div>
    
    <table class="details-table">
      <tr>
        <td>👨‍⚕️ Doctor</td>
        <td>${data.doctorName}</td>
      </tr>
      <tr>
        <td>📅 Date</td>
        <td>${formattedDate}</td>
      </tr>
      <tr>
        <td>🕐 New Time</td>
        <td><strong>${estimatedFormattedTime}</strong></td>
      </tr>
      <tr>
        <td>📝 Reason</td>
        <td>${data.reasonForVisit}</td>
      </tr>
      ${data.clinicAddress ? `
      <tr>
        <td>📍 Location</td>
        <td>${data.clinicAddress}</td>
      </tr>
      ` : ''}
      ${data.clinicPhone ? `
      <tr>
        <td>📞 Contact</td>
        <td>${data.clinicPhone}</td>
      </tr>
      ` : ''}
    </table>
    
    <div style="background: #dbeafe; border: 1px solid #3b82f6; border-radius: 5px; padding: 15px; margin: 20px 0;">
      <strong>💡 What This Means:</strong>
      <ul style="margin: 10px 0; padding-left: 20px;">
        <li>Please arrive at the new time: ${estimatedFormattedTime}</li>
        <li>Your appointment is still confirmed</li>
        <li>We apologize for any inconvenience</li>
        <li>If you can't make the new time, please call us to reschedule</li>
      </ul>
    </div>
    
    <p style="text-align: center;">
      <a href="tel:${data.clinicPhone || '+1234567890'}" class="button">📞 Call Clinic</a>
    </p>
  </div>
  
  <div class="footer">
    <p><strong>Nova Health Clinic</strong></p>
    <p>Thank you for your patience and understanding!</p>
    <p style="font-size: 12px; color: #999; margin-top: 10px;">
      This is an automated notification. Please do not reply to this message.
    </p>
  </div>
</body>
</html>
      `;

      const mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
        to: data.patientEmail,
        subject: `⏰ Appointment Delayed - New Time: ${estimatedFormattedTime}`,
        html: emailHtml,
      };

      await this.transporter.sendMail(mailOptions);
      console.log('✅ Delay notification sent successfully');
      return true;

    } catch (error: any) {
      console.error('❌ Error sending delay notification:', error.message);
      return false;
    }
  }

  /**
   * Send OTP email for email verification
   */
  async sendOTPEmail(email: string, otp: string, firstName: string): Promise<boolean> {
    try {
      console.log('📧 Sending OTP email to:', email);

      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .content {
      background: #f9f9f9;
      padding: 30px;
      border: 1px solid #ddd;
      border-top: none;
    }
    .otp-box {
      background: white;
      border: 2px solid #667eea;
      border-radius: 8px;
      padding: 30px;
      margin: 20px 0;
      text-align: center;
    }
    .otp-code {
      font-size: 36px;
      font-weight: bold;
      color: #667eea;
      letter-spacing: 8px;
      margin: 20px 0;
    }
    .footer {
      background: #f9f9f9;
      padding: 20px;
      text-align: center;
      border: 1px solid #ddd;
      border-top: none;
      border-radius: 0 0 10px 10px;
      font-size: 14px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔐 Email Verification</h1>
    <p>Nova Health Clinic</p>
  </div>
  
  <div class="content">
    <p>Dear ${firstName},</p>
    
    <p>Thank you for signing up! Please use the following OTP to verify your email address:</p>
    
    <div class="otp-box">
      <p style="margin: 0; color: #666;">Your Verification Code</p>
      <div class="otp-code">${otp}</div>
      <p style="margin: 0; font-size: 12px; color: #999;">This code will expire in 10 minutes</p>
    </div>
    
    <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 5px; padding: 15px; margin: 20px 0;">
      <strong>⚠️ Security Notice:</strong>
      <ul style="margin: 10px 0; padding-left: 20px;">
        <li>Never share this code with anyone</li>
        <li>Our team will never ask for your OTP</li>
        <li>If you didn't request this, please ignore this email</li>
      </ul>
    </div>
  </div>
  
  <div class="footer">
    <p><strong>Nova Health Clinic</strong></p>
    <p style="font-size: 12px; color: #999; margin-top: 10px;">
      This is an automated email. Please do not reply to this message.
    </p>
  </div>
</body>
</html>
      `;

      const mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
        to: email,
        subject: `Your Verification Code: ${otp}`,
        html: emailHtml,
      };

      await this.transporter.sendMail(mailOptions);
      console.log('✅ OTP email sent successfully');
      return true;

    } catch (error: any) {
      console.error('❌ Error sending OTP email:', error.message);
      return false;
    }
  }

  /**
   * Send welcome email after successful verification
   */
  async sendWelcomeEmail(email: string, firstName: string): Promise<boolean> {
    try {
      console.log('📧 Sending welcome email to:', email);

      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .content {
      background: #f9f9f9;
      padding: 30px;
      border: 1px solid #ddd;
      border-top: none;
    }
    .welcome-box {
      background: white;
      border: 2px solid #10b981;
      border-radius: 8px;
      padding: 30px;
      margin: 20px 0;
      text-align: center;
    }
    .footer {
      background: #f9f9f9;
      padding: 20px;
      text-align: center;
      border: 1px solid #ddd;
      border-top: none;
      border-radius: 0 0 10px 10px;
      font-size: 14px;
      color: #666;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background: #10b981;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      margin: 10px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 Welcome to Nova Health!</h1>
  </div>
  
  <div class="content">
    <p>Dear ${firstName},</p>
    
    <div class="welcome-box">
      <h2 style="color: #10b981; margin-top: 0;">✅ Email Verified Successfully!</h2>
      <p>Your account is now active and ready to use.</p>
    </div>
    
    <p>You can now:</p>
    <ul>
      <li>📅 Book appointments with our doctors</li>
      <li>🎤 Use our voice booking system</li>
      <li>📊 Access your medical dashboard</li>
      <li>💬 Communicate with healthcare providers</li>
    </ul>
    
    <div style="background: #dbeafe; border: 1px solid #3b82f6; border-radius: 5px; padding: 15px; margin: 20px 0;">
      <strong>💡 Getting Started:</strong>
      <p style="margin: 10px 0 0 0;">
        Complete your profile to get the most out of your Nova Health experience!
      </p>
    </div>
    
    <p style="text-align: center;">
      <a href="#" class="button">Complete Your Profile</a>
    </p>
  </div>
  
  <div class="footer">
    <p><strong>Nova Health Clinic</strong></p>
    <p>Thank you for choosing us for your healthcare needs!</p>
    <p style="font-size: 12px; color: #999; margin-top: 10px;">
      This is an automated email. Please do not reply to this message.
    </p>
  </div>
</body>
</html>
      `;

      const mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
        to: email,
        subject: 'Welcome to Nova Health Clinic! 🎉',
        html: emailHtml,
      };

      await this.transporter.sendMail(mailOptions);
      console.log('✅ Welcome email sent successfully');
      return true;

    } catch (error: any) {
      console.error('❌ Error sending welcome email:', error.message);
      return false;
    }
  }
}

export default new EmailService();
