const nodemailer = require("nodemailer");

let transporter;

function initEmailService() {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT || 587;
  const smtpSecure = process.env.SMTP_SECURE === 'true'; // true for 465, false for other ports
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const smtpPassword = process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD;

  if (!smtpHost || !smtpUser || !smtpPassword) {
    console.warn("SMTP service not configured. Emails will not be sent.");
    console.warn("Required: SMTP_HOST, SMTP_USER, SMTP_PASSWORD");
    return null;
  }

  try {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: smtpSecure, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPassword
      },
      tls: {
        rejectUnauthorized: false // Accept self-signed certificates
      }
    });

    console.log('✅ SMTP Email Service Configured');
    console.log(`   Host: ${smtpHost}`);
    console.log(`   Port: ${smtpPort}`);
    console.log(`   Secure: ${smtpSecure}`);
    console.log(`   User: ${smtpUser}`);

    return transporter;
  } catch (error) {
    console.error('❌ Failed to initialize SMTP service:', error.message);
    return null;
  }
}

async function sendPasswordResetEmail(userEmail, userName, resetToken, resetUrl) {
  if (!transporter) {
    console.warn(`Password reset email not sent to ${userEmail}: Email service not configured`);
    return false;
  }

  try {
    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME || "Nursery Management"} <${process.env.SMTP_USER || process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: "Password Reset Request - Nursery Management",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #2d5016;">Password Reset Request</h2>
            
            <p>Hello <strong>${userName}</strong>,</p>
            
            <p>We received a request to reset the password for your account. If you didn't make this request, you can safely ignore this email.</p>
            
            <p><strong>To reset your password, click the link below:</strong></p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #666; font-size: 12px; background: #f4f4f4; padding: 10px; border-radius: 4px;">
              ${resetUrl}
            </p>
            
            <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
              <strong>Important:</strong> This link will expire in 1 hour. If the link has expired, you can request a new password reset.
            </p>
            
            <p style="color: #999; font-size: 12px;">
              If you have any questions, please contact our support team.
            </p>
            
            <p style="color: #999; font-size: 12px;">
              Best regards,<br/>
              <strong>Nursery Management Team</strong>
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${userEmail}`);
    return true;
  } catch (error) {
    console.error(`Failed to send password reset email to ${userEmail}:`, error.message);
    return false;
  }
}

async function sendAccountCreationEmail(userEmail, userName, password) {
  if (!transporter) {
    console.warn(`Account creation email not sent to ${userEmail}: Email service not configured`);
    return false;
  }

  try {
    const loginUrl = `${process.env.CORS_ORIGIN || "http://localhost:3000"}/login`;
    
    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME || "Nursery Management"} <${process.env.SMTP_USER || process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: "Welcome! Your Account Has Been Created - Nursery Management",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #2d5016;">Welcome to Nursery Management!</h2>
            
            <p>Hello <strong>${userName}</strong>,</p>
            
            <p>Your account has been successfully created. You can now log in to track your orders and manage your profile.</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50;">
              <p style="margin: 0 0 10px 0;"><strong>Login Credentials:</strong></p>
              <p style="margin: 5px 0;"><strong>Email:</strong> ${userEmail}</p>
              <p style="margin: 5px 0;"><strong>Password:</strong> <code style="background: #fff; padding: 5px 10px; border-radius: 4px; font-size: 14px;">${password}</code></p>
            </div>
            
            <p style="color: #d9534f; font-size: 14px;">
              <strong>⚠️ Important Security Notice:</strong> This is a system-generated password. For your security, please change it after your first login.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginUrl}" style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Login to Your Account
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #666; font-size: 12px; background: #f4f4f4; padding: 10px; border-radius: 4px;">
              ${loginUrl}
            </p>
            
            <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
              If you have any questions, please contact our support team.
            </p>
            
            <p style="color: #999; font-size: 12px;">
              Best regards,<br/>
              <strong>Nursery Management Team</strong>
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Account creation email sent to ${userEmail}`);
    return true;
  } catch (error) {
    console.error(`Failed to send account creation email to ${userEmail}:`, error.message);
    return false;
  }
}

module.exports = { initEmailService, sendPasswordResetEmail, sendAccountCreationEmail };
