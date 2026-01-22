import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_EMAIL}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text
      });
      console.log(`✅ Email sent to ${options.to}`);
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendOTPEmail(email: string, otp: string, firstName: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
          .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏥 MedFlow AI</h1>
            <p>Email Verification</p>
          </div>
          <div class="content">
            <h2>Hello ${firstName}!</h2>
            <p>Thank you for signing up with MedFlow AI. To complete your registration, please verify your email address.</p>
            
            <div class="otp-box">
              <p style="margin: 0; color: #666;">Your verification code is:</p>
              <div class="otp-code">${otp}</div>
              <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">Valid for 10 minutes</p>
            </div>
            
            <p>Enter this code in the verification popup to activate your account.</p>
            
            <div class="warning">
              <strong>⚠️ Security Notice:</strong> Never share this code with anyone. MedFlow AI will never ask for your verification code via phone or email.
            </div>
            
            <p>If you didn't request this code, please ignore this email.</p>
            
            <p>Best regards,<br>The MedFlow AI Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} MedFlow AI. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Hello ${firstName}!

Thank you for signing up with MedFlow AI.

Your verification code is: ${otp}

This code is valid for 10 minutes.

Enter this code in the verification popup to activate your account.

If you didn't request this code, please ignore this email.

Best regards,
The MedFlow AI Team
    `;

    await this.sendEmail({
      to: email,
      subject: 'Verify Your MedFlow AI Account',
      html,
      text
    });
  }

  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to MedFlow AI!</h1>
          </div>
          <div class="content">
            <h2>Hello ${firstName}!</h2>
            <p>Your email has been successfully verified. Welcome to MedFlow AI!</p>
            
            <p>You can now access all features of your account:</p>
            <ul>
              <li>📅 Book appointments with doctors</li>
              <li>🤖 Use our AI voice assistant</li>
              <li>📊 View your medical records</li>
              <li>💬 Chat with healthcare professionals</li>
            </ul>
            
            <p style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="button">Go to Dashboard</a>
            </p>
            
            <p>If you have any questions, feel free to reach out to our support team.</p>
            
            <p>Best regards,<br>The MedFlow AI Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} MedFlow AI. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Welcome to MedFlow AI! 🎉',
      html
    });
  }
}

export default new EmailService();
