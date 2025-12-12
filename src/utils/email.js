const nodemailer = require("nodemailer");

// Remove quotes from password if they exist
const emailPassword = process.env.EMAIL_PASSWORD
  ? process.env.EMAIL_PASSWORD.replace(/^"(.*)"$/, "$1").trim()
  : "";

console.log("Email config:", {
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  user: process.env.EMAIL_USER,
  hasPassword: !!emailPassword,
  from: process.env.EMAIL_FROM,
});

// Log transporter configuration for debugging
console.log("Transporter config:", {
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: emailPassword ? "****" : "NOT SET",
  },
});

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: emailPassword,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

exports.sendEmail = async ({ to, subject, text, html }) => {
  console.log("Email sending attempt:");
  console.log("- To:", to);
  console.log("- Subject:", subject);
  console.log("- Has HTML content:", !!html);
  console.log("- Has text content:", !!text);
  console.log(
    "- From address:",
    process.env.EMAIL_FROM || "no-reply@saajjewels.com"
  );
  console.log("- Email host:", process.env.EMAIL_HOST || "smtp.gmail.com");
  console.log("- Email port:", process.env.EMAIL_PORT || "587");
  console.log("- Email user:", process.env.EMAIL_USER);
  console.log("- Has password:", !!emailPassword);

  // Check if email credentials are properly configured
  const hasValidCredentials = process.env.EMAIL_USER && emailPassword;
  if (!hasValidCredentials) {
    console.warn("Email credentials are not properly configured.");
    console.warn("EMAIL_USER:", process.env.EMAIL_USER ? "SET" : "MISSING");
    console.warn("EMAIL_PASSWORD:", emailPassword ? "SET" : "MISSING");
    // Even in development, if credentials are provided, we should attempt to send
  }

  try {
    console.log("Attempting to send email to:", to);
    console.log("Email subject:", subject);

    // Validate email address format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      console.error("Invalid email address format:", to);
      throw new Error("Invalid email address format");
    }

    // Skip if no credentials at all
    if (!process.env.EMAIL_USER && !emailPassword) {
      console.log("No email credentials configured, skipping email send");
      return { messageId: "no-credentials-skip" };
    }

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || "no-reply@saajjewels.com",
      to,
      subject,
      text,
      html,
    });

    console.log("Email sent successfully:", info.messageId);
    return info;
  } catch (error) {
    console.error("Email sending failed:", error.message);
    console.error("Error details:", error);
    console.error("Full error object:", JSON.stringify(error, null, 2));
    // Don't fail the entire operation if email fails, but log the error clearly
    console.log("Continuing operation despite email failure");
    return { messageId: "email-failure-skip", error: error.message };
  }
};
