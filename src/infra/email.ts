import cfg from "config";
import nodemailer from "nodemailer";

export type MailObject = {
  from: string;
  to: string;
  subject: string;
  text: string;
};

const transporter = nodemailer.createTransport({
  host: cfg.mailer.host,
  port: cfg.mailer.port,
  auth: {
    user: cfg.mailer.user,
    pass: cfg.mailer.password,
  },
  secure: cfg.environment === "production" ? true : false,
});

async function send(mailOptions: MailObject) {
  await transporter.sendMail(mailOptions);
}

const email = {
  send,
};

export default email;
