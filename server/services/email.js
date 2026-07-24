const nodemailer = require('nodemailer');

let transporter = null;

/**
 * Initialize email transporter
 */
function initEmail() {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (emailUser && emailPass) {
        try {
            transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: emailUser,
                    pass: emailPass
                }
            });
            console.log('✅ Email service initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize email:', error.message);
            return false;
        }
    } else {
        console.log('⚠️ Email credentials not configured. Using console fallback.');
        console.log('   Set EMAIL_USER and EMAIL_PASS environment variables.');
        console.log('   For Gmail, use an App Password from Google Account settings.');
        return false;
    }
}

/**
 * Send an email
 */
async function sendEmail(to, subject, html) {
    if (transporter) {
        try {
            const info = await transporter.sendMail({
                from: `"JobPortal" <${process.env.EMAIL_USER}>`,
                to,
                subject,
                html
            });
            console.log(`📧 Email sent to ${to}: ${subject} (ID: ${info.messageId})`);
            return { success: true, messageId: info.messageId, error: null };
        } catch (error) {
            console.error('❌ Failed to send email:', error.message);
            return { success: false, error: error.message };
        }
    } else {
        // Fallback: log to console
        console.log(`\n📧 [EMAIL FALLBACK]`);
        console.log(`   To: ${to}`);
        console.log(`   Subject: ${subject}`);
        console.log(`   Body: ${html.replace(/<[^>]*>/g, '')}\n`);
        return { success: true, messageId: 'console-fallback', error: null };
    }
}

/**
 * Send forgot password reset code email
 */
async function sendResetCode(to, name, resetCode) {
    const html = `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; background: #f4f7fc; border-radius: 24px;">
            <div style="background: white; padding: 32px; border-radius: 20px; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
                <div style="text-align: center; margin-bottom: 24px;">
                    <div style="font-size: 48px; margin-bottom: 8px;">🔐</div>
                    <h1 style="color: #0b1a33; font-size: 22px; font-weight: 700; margin: 0;">Password Reset Code</h1>
                </div>
                
                <p style="color: #3d5070; font-size: 15px; line-height: 1.6;">Hello <strong>${name}</strong>,</p>
                
                <p style="color: #3d5070; font-size: 15px; line-height: 1.6;">
                    We received a request to reset your JobPortal account password. 
                    Use the following code to reset your password:
                </p>
                
                <div style="background: #f0f7ff; border-radius: 16px; padding: 20px; text-align: center; margin: 24px 0; border: 2px dashed #2a7de1;">
                    <span style="font-size: 36px; font-weight: 800; color: #2a7de1; letter-spacing: 8px; font-family: monospace;">${resetCode}</span>
                </div>
                
                <p style="color: #5e6f8d; font-size: 13px; line-height: 1.5;">
                    This code will expire in 15 minutes. If you didn't request a password reset, 
                    please ignore this email.
                </p>
                
                <hr style="border: none; border-top: 1px solid #e6ecf5; margin: 24px 0;">
                
                <p style="color: #5e6f8d; font-size: 12px; text-align: center;">
                    JobPortal &copy; ${new Date().getFullYear()} - All rights reserved
                </p>
            </div>
        </div>
    `;

    return await sendEmail(to, 'JobPortal - Password Reset Code', html);
}

/**
 * Send account approval notification email
 */
async function sendApprovalEmail(to, name, role, appUrl) {
    const roleName = role === 'developer' ? 'Developer' : 'Client';
    const loginLink = appUrl || process.env.APP_URL || 'http://localhost:5000';

    const html = `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; background: #f4f7fc; border-radius: 24px;">
            <div style="background: white; padding: 32px; border-radius: 20px; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
                <div style="text-align: center; margin-bottom: 24px;">
                    <div style="font-size: 48px; margin-bottom: 8px;">🎉</div>
                    <h1 style="color: #0b1a33; font-size: 22px; font-weight: 700; margin: 0;">Account Approved!</h1>
                </div>
                
                <p style="color: #3d5070; font-size: 15px; line-height: 1.6;">Hello <strong>${name}</strong>,</p>
                
                <p style="color: #3d5070; font-size: 15px; line-height: 1.6;">
                    Congratulations! Your JobPortal account has been approved. 
                    You can now log in as a <strong>${roleName}</strong> and start using the platform.
                </p>
                
                <div style="text-align: center; margin: 28px 0;">
                    <a href="${loginLink}" 
                       style="background: #2a7de1; color: white; padding: 14px 36px; border-radius: 14px; 
                              text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">
                        Login to JobPortal
                    </a>
                </div>
                
                <hr style="border: none; border-top: 1px solid #e6ecf5; margin: 24px 0;">
                
                <p style="color: #5e6f8d; font-size: 12px; text-align: center;">
                    JobPortal &copy; ${new Date().getFullYear()} - All rights reserved
                </p>
            </div>
        </div>
    `;

    return await sendEmail(to, 'JobPortal - Account Approved 🎉', html);
}

module.exports = {
    initEmail,
    sendEmail,
    sendResetCode,
    sendApprovalEmail
};