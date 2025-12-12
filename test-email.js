require("dotenv").config();
const { sendEmail } = require("./src/utils/email");

async function testEmail() {
  try {
    console.log("Testing email sending...");
    const result = await sendEmail({
      to: "test@example.com",
      subject: "Test Email from SaajJewels",
      text: "This is a test email to verify email functionality.",
      html: "<h1>Test Email</h1><p>This is a test email to verify email functionality.</p>",
    });
    console.log("Email sent successfully:", result);
  } catch (error) {
    console.error("Failed to send test email:", error);
  }
}

testEmail();
