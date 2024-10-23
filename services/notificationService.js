
require('dotenv').config();
const nodemailer = require("nodemailer");

const sendVerificationEmailService = async (email, subject, message) => {
    try {
        // Set up the Nodemailer transporter
        const transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email", // Ethereal for testing; replace with your service in production
            port: 587,
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD,
            },
        });
        
        // console.log(email)
        // return;

        // Mail options including the dynamic message
        const mailOptions = {
            from: process.env.NODEMAILER_EMAIL,
            to: email,
            subject: subject, // Subject passed as parameter
            html: `<p>${message}</p>`, // Use the dynamic message
        };

        // Send email and return status
        await transporter.sendMail(mailOptions);
        return "Email sent";
    } catch (error) {
        console.error("Error sending email:", error);
        throw new Error('Email not sent');
    }
};


const twilio = require('twilio');
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

const sendSMS = async (to, message) => {
    try {
        await client.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: "7070261370"
        });
        console.log('SMS sent successfully');
    } catch (error) {
        console.error('Error sending SMS:', error);
    }
};

module.exports = {
    sendSMS, sendVerificationEmailService
};
