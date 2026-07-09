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

async function sendOrderConfirmationEmail(orderData) {
  if (!transporter) {
    console.warn(`Order confirmation email not sent to ${orderData.email}: Email service not configured`);
    return false;
  }

  try {
    const itemsHtml = orderData.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">₹${item.unitPrice}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">₹${item.quantity * item.unitPrice}</td>
      </tr>
    `).join('');

    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME || "Nursery Management"} <${process.env.SMTP_USER || process.env.EMAIL_USER}>`,
      to: orderData.email,
      subject: `Order Confirmation - ${orderData.orderNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #2d5016; margin: 0;">Order Confirmed!</h2>
            </div>
            
            <p>Hello <strong>${orderData.customerName}</strong>,</p>
            
            <p>Thank you for shopping with us! We have received your order and are currently processing it. Here are the details of your order:</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Order Number:</strong> ${orderData.orderNumber}</p>
              <p style="margin: 5px 0;"><strong>Total Amount:</strong> ₹${orderData.totalAmount}</p>
            </div>
            
            <h3 style="color: #2d5016; border-bottom: 2px solid #4CAF50; padding-bottom: 5px;">Order Summary</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background-color: #f4f4f4;">
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Item</th>
                  <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Qty</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Grand Total:</td>
                  <td style="padding: 10px; text-align: right; font-weight: bold; color: #2d5016;">₹${orderData.totalAmount}</td>
                </tr>
              </tfoot>
            </table>
            
            <p style="color: #666; font-size: 14px;">We will notify you again once your order is dispatched.</p>
            
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
    console.log(`Order confirmation email sent to ${orderData.email}`);
    return true;
  } catch (error) {
    console.error(`Failed to send order confirmation email to ${orderData.email}:`, error.message);
    return false;
  }
}

async function sendOrderDeliveredEmail(orderData) {
  if (!transporter) {
    console.warn(`Order delivered email not sent to ${orderData.email}: Email service not configured`);
    return false;
  }

  try {
    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME || "Nursery Management"} <${process.env.SMTP_USER || process.env.EMAIL_USER}>`,
      to: orderData.email,
      subject: `Your Order ${orderData.orderNumber} has been Delivered`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #2d5016; margin: 0;">Order Delivered!</h2>
            </div>
            
            <p>Hello <strong>${orderData.customerName}</strong>,</p>
            
            <p>Great news! Your order <strong>${orderData.orderNumber}</strong> has been successfully delivered.</p>
            
            <p>We hope you are satisfied with your purchase. If you have any feedback or if there are any issues with your order, please do not hesitate to reach out to us.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CORS_ORIGIN || "http://localhost:3000"}/my-orders" style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                View Order Details
              </a>
            </div>
            
            <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
              Thank you for shopping with us!
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
    console.log(`Order delivered email sent to ${orderData.email}`);
    return true;
  } catch (error) {
    console.error(`Failed to send order delivered email to ${orderData.email}:`, error.message);
    return false;
  }
}

module.exports = { initEmailService, sendPasswordResetEmail, sendAccountCreationEmail, sendOrderConfirmationEmail, sendOrderDeliveredEmail };
