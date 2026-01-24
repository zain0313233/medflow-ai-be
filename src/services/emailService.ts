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
}

export default new EmailService();
