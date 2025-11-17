import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create a transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * Sends an email using Nodemailer.
 * @param {{to: string, subject: string, html: string, text?: string}} mailOptions - Email options.
 * @returns {Promise<any>} The nodemailer response (e.g., messageId).
 */
export const sendEmail = async ({ to, subject, html, text }) => {
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error('Email credentials (EMAIL_USER/EMAIL_PASS) are not set in .env.');
    }

    const mailData = {
        from: `Synapse Agent <${process.env.EMAIL_USER}>`,
        to: to,
        subject: subject,
        html: html,
        // Fallback text if HTML is not supported
        text: text || "This is a system-generated email from Synapse Agent. Please view in an HTML-enabled client." 
    };

    try {
        const info = await transporter.sendMail(mailData);
        console.log('Email sent: %s', info.messageId);
        // This is primarily for testing with ethereal
        if (process.env.EMAIL_HOST === 'smtp.ethereal.email') {
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        }
        return info;
    } catch (error) {
        console.error('Nodemailer error:', error);
        throw new Error(`Failed to send email to ${to}: ${error.message}`);
    }
};