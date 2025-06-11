const nodeMailer = require("nodemailer");

class Mailer {
    static async sendEmail(email, subject, message) {
        const transporter = nodeMailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject,
            text: message,
        };

        try {
            const info = await transporter.sendMail(mailOptions);

        } catch (error) {

        }
    }
}

module.exports = Mailer;