import nodemailer from 'nodemailer';

// Create transporter
const createTransporter = () => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error('Email configuration missing. Please set EMAIL_USER and EMAIL_PASS in environment variables.');
    }
    
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

// Generate 6-digit OTP
export const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email for password reset
export const sendOTPEmail = async (email, otp, fullName) => {
    try {
        const transporter = createTransporter();
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'PlayBack - Password Reset OTP',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                    <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #ef4444; margin: 0; font-size: 28px;">PlayBack</h1>
                            <p style="color: #666; margin: 5px 0 0 0;">Video Streaming Platform</p>
                        </div>
                        
                        <h2 style="color: #333; margin-bottom: 20px;">Password Reset Request</h2>
                        
                        <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
                            Hello ${fullName},
                        </p>
                        
                        <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
                            We received a request to reset your password for your PlayBack account.
                            Use the following OTP to reset your password:
                        </p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; display: inline-block;">
                                <h1 style="color: #ef4444; margin: 0; font-size: 36px; letter-spacing: 8px; font-weight: bold;">
                                    ${otp}
                                </h1>
                            </div>
                        </div>
                        
                        <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
                            This OTP is valid for <strong>10 minutes</strong>. If you didn't request this password reset,
                            please ignore this email or contact our support team.
                        </p>
                        
                        <div style="background-color: #fef3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <p style="color: #856404; margin: 0; font-size: 14px;">
                                <strong>Security Note:</strong> Never share this OTP with anyone. PlayBack will never ask for your OTP via phone or email.
                            </p>
                        </div>
                        
                        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                            <p style="color: #999; font-size: 12px; margin: 0;">
                                This email was sent from PlayBack. If you have any questions, please contact our support team.
                            </p>
                        </div>
                    </div>
                </div>
            `
        };

        const result = await transporter.sendMail(mailOptions);
        return { success: true, messageId: result.messageId };
    } catch (error) {
        console.error('Email sending error:', error);
        return { success: false, error: error.message };
    }
};

// Send OTP email for registration
export const sendRegistrationOTPEmail = async (email, otp, fullName) => {
    try {
        const transporter = createTransporter();
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'PlayBack - Welcome! Verify Your Email',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f0f8ff;">
                    <div style="background-color: #ffffff; padding: 30px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 2px solid #3b82f6;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <div style="background: linear-gradient(135deg, #ef4444, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                                <h1 style="margin: 0; font-size: 32px; font-weight: bold;">PlayBack</h1>
                            </div>
                            <p style="color: #666; margin: 5px 0 0 0; font-size: 16px;">Welcome to the Future of Video Streaming!</p>
                        </div>
                        
                        <div style="text-align: center; margin-bottom: 25px;">
                            <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 15px; border-radius: 50%; display: inline-block; width: 60px; height: 60px;">
                                <span style="color: white; font-size: 30px;">🎉</span>
                            </div>
                        </div>
                        
                        <h2 style="color: #1f2937; margin-bottom: 20px; text-align: center; font-size: 24px;">Almost There!</h2>
                        
                        <p style="color: #374151; line-height: 1.6; margin-bottom: 20px; font-size: 16px;">
                            Hello <strong>${fullName}</strong>,
                        </p>
                        
                        <p style="color: #374151; line-height: 1.6; margin-bottom: 25px; font-size: 16px;">
                            Welcome to PlayBack! We're excited to have you join our community. To complete your registration and start your video streaming journey, please verify your email address using the verification code below:
                        </p>
                        
                        <div style="text-align: center; margin: 35px 0;">
                            <div style="background: linear-gradient(135deg, #dbeafe, #e0e7ff); padding: 25px; border-radius: 12px; display: inline-block; border: 2px dashed #3b82f6;">
                                <p style="color: #1e40af; margin: 0 0 10px 0; font-size: 14px; font-weight: 600;">VERIFICATION CODE</p>
                                <h1 style="color: #1e40af; margin: 0; font-size: 40px; letter-spacing: 10px; font-weight: bold; font-family: 'Courier New', monospace;">
                                    ${otp}
                                </h1>
                            </div>
                        </div>
                        
                        <div style="background: linear-gradient(135deg, #ecfdf5, #f0fdf4); padding: 20px; border-radius: 10px; margin: 25px 0;">
                            <h3 style="color: #065f46; margin: 0 0 10px 0; font-size: 16px;">What's Next?</h3>
                            <ul style="color: #047857; margin: 0; padding-left: 20px; line-height: 1.6;">
                                <li>Enter this code in the registration form</li>
                                <li>Upload your profile pictures</li>
                                <li>Start exploring amazing videos</li>
                                <li>Create and share your own content</li>
                            </ul>
                        </div>
                        
                        <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px; font-size: 14px; text-align: center;">
                            This verification code is valid for <strong style="color: #ef4444;">10 minutes</strong>. If you didn't create an account with PlayBack, please ignore this email.
                        </p>
                        
                        <div style="background-color: #fef3cd; padding: 15px; border-radius: 8px; margin: 25px 0;">
                            <p style="color: #92400e; margin: 0; font-size: 14px;">
                                <strong>🔒 Security Tip:</strong> Keep this code private! PlayBack will never ask for your verification code via phone calls or other emails.
                            </p>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <div style="background: linear-gradient(135deg, #f3f4f6, #e5e7eb); padding: 20px; border-radius: 10px;">
                                <p style="color: #4b5563; margin: 0; font-size: 14px; line-height: 1.5;">
                                    Need help? Contact our support team<br>
                                    <strong>Email:</strong> scatchotp@gmail.com
                                </p>
                            </div>
                        </div>
                        
                        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
                            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                                © 2025 PlayBack. All rights reserved.<br>
                                This email was sent to verify your account registration.
                            </p>
                        </div>
                    </div>
                </div>
            `
        };

        const result = await transporter.sendMail(mailOptions);
        return { success: true, messageId: result.messageId };
    } catch (error) {
        console.error('Registration email sending error:', error);
        return { success: false, error: error.message };
    }
};

// Send password reset confirmation email
export const sendPasswordResetConfirmationEmail = async (email, fullName) => {
    try {
        const transporter = createTransporter();
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'PlayBack - Password Reset Successful',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                    <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #ef4444; margin: 0; font-size: 28px;">PlayBack</h1>
                            <p style="color: #666; margin: 5px 0 0 0;">Video Streaming Platform</p>
                        </div>
                        
                        <div style="text-align: center; margin-bottom: 30px;">
                            <div style="background-color: #d1fae5; padding: 20px; border-radius: 50%; display: inline-block; width: 60px; height: 60px;">
                                <span style="color: #059669; font-size: 30px;">✓</span>
                            </div>
                        </div>
                        
                        <h2 style="color: #333; margin-bottom: 20px; text-align: center;">Password Reset Successful</h2>
                        
                        <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
                            Hello ${fullName},
                        </p>
                        
                        <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
                            Your password has been successfully reset. You can now log in to your PlayBack account with your new password.
                        </p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.FRONTEND_URL}/login" 
                               style="background-color: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                                Login to PlayBack
                            </a>
                        </div>
                        
                        <div style="background-color: #fef3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <p style="color: #856404; margin: 0; font-size: 14px;">
                                <strong>Security Note:</strong> If you didn't reset your password, please contact our support team immediately.
                            </p>
                        </div>
                        
                        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                            <p style="color: #999; font-size: 12px; margin: 0;">
                                This email was sent from PlayBack. If you have any questions, please contact our support team.
                            </p>
                        </div>
                    </div>
                </div>
            `
        };

        const result = await transporter.sendMail(mailOptions);
        return { success: true, messageId: result.messageId };
    } catch (error) {
        console.error('Email sending error:', error);
        return { success: false, error: error.message };
    }
};