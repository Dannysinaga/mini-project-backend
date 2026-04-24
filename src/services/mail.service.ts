import { mailTransporter } from "../config/mail";

export class MailService {
  async sendResetPasswordEmail(to: string, resetLink: string) {
    await mailTransporter.sendMail({
      from: process.env.MAIL_FROM,
      to,
      subject: "Reset Password",
      html: `
        <h2>Reset Password</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">${resetLink}</a>
      `,
    });
  }
}