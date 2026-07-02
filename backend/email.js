const nodemailer = require("nodemailer");

let transporter;

function initEmailService() {
  const emailService = process.env.EMAIL_SERVICE || "gmail";
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;

  if (!emailUser || !emailPassword) {
    console.warn("Email service not configured. Password reset emails will not be sent.");
    return null;
  }

  transporter = nodemailer.createTransport({
    service: emailService,
    auth: {
      user: emailUser,
      pass: emailPassword
    }
  });

  return transporter;
}

async function sendPasswordResetEmail(userEmail, userName, resetToken, resetUrl) {
  if (!transporter) {
    console.warn(`Password reset email not sent to ${userEmail}: Email service not configured`);
    return false;
  }

  try {
    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME || "Nursery Management"} <${process.env.EMAIL_USER}>`,
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

module.exports = { initEmailService, sendPasswordResetEmail };
