import nodemailer from "nodemailer";
import * as dotenv from "dotenv";

dotenv.config();

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  await transporter.sendMail({
    from: `"Grocery Store" <${process.env.SMTP_USER}>`,
    ...options,
  });
};

export const sendPasswordResetOtp = async (
  email: string,
  otp: string
): Promise<void> => {
  const subject = "Password Reset OTP";
  const html = `
    <div>
      <h2>Password Reset Request</h2>
      <p>Your OTP for password reset is: <strong>${otp}</strong></p>
      <p>This OTP is valid for 10 minutes.</p>
    </div>
  `;

  await sendEmail({ to: email, subject, html });
};
