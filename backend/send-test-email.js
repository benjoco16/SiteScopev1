import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config(); // load .env

async function main() {
  const transporter = nodemailer.createTransport({
    host: "cp-wc35.syd02.ds.network", // from cPanel
    port: 465,
    secure: true, // SSL
    auth: {
      user: process.env.EMAIL_USER, // full email: support@benjoco.com
      pass: process.env.EMAIL_PASS, // email account password
    },
    tls: {
        rejectUnauthorized: false,  // ✅ allow self-signed certs
    },
    logger: true, // log details
    debug: true,  // show SMTP conversation
  });

  try {
    const info = await transporter.sendMail({
      from: `"SiteScope Test" <${process.env.EMAIL_USER}>`,
      to: process.env.ALERT_TO || process.env.EMAIL_USER,
      subject: "✅ SiteScope SMTP Test",
      text: "If you see this, your SMTP setup is working!",
    });

    console.log("📧 Test email sent:", info.messageId);
  } catch (err) {
    console.error("❌ SMTP test failed:", err.message);
  }
}

main();
