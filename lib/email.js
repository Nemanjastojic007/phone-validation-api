const { Resend } = require('resend');

// Resend client instance (singleton pattern)
let resendClient = null;

/**
 * Get or initialize Resend client
 * Uses RESEND_KEY environment variable for authentication
 * @returns {Resend} Resend client instance
 */
function getResendClient() {
  if (resendClient) {
    return resendClient;
  }

  const RESEND_KEY = process.env.RESEND_KEY;
  
  if (!RESEND_KEY) {
    throw new Error('RESEND_KEY environment variable is not set');
  }

  resendClient = new Resend(RESEND_KEY);
  return resendClient;
}

/**
 * Send welcome email with API key to new user
 * @param {string} toEmail - Recipient email address
 * @param {string} apiKey - Generated API key
 * @param {string} planName - Plan name (e.g., "Free", "Starter", "Pro")
 * @param {number} requestsLimit - Number of requests allowed per month
 * @param {string} userName - User's name (optional)
 * @returns {Promise<Object>} Resend API response
 */
async function sendWelcomeEmail(toEmail, apiKey, planName, requestsLimit, userName = null) {
  try {
    const resend = getResendClient();
    
    // Determine sender email - should be a verified domain in Resend
    // Using a placeholder that should be replaced with your actual verified domain
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    
    // Get API base URL for documentation links
    const apiBaseUrl = process.env.API_BASE_URL || 'https://your-api-domain.com';
    
    // Personalize greeting
    const greeting = userName ? `Hi ${userName},` : 'Hi there,';
    
    // Email subject
    const subject = `Welcome to Phone Validation API - Your API Key is Ready!`;
    
    // HTML email content
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Phone Validation API</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #111827;
      background-color: #f9fafb;
      margin: 0;
      padding: 0;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
      padding: 32px;
      border-radius: 12px 12px 0 0;
      margin: -40px -40px 32px -40px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
    }
    .api-key-box {
      background: #1e293b;
      color: #e2e8f0;
      padding: 20px;
      border-radius: 8px;
      font-family: 'SF Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
      font-size: 14px;
      word-break: break-all;
      margin: 24px 0;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .info-box {
      background: #f0f9ff;
      border-left: 4px solid #6366f1;
      padding: 16px;
      margin: 24px 0;
      border-radius: 4px;
    }
    .code-block {
      background: #f3f4f6;
      padding: 16px;
      border-radius: 8px;
      font-family: 'SF Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
      font-size: 13px;
      overflow-x: auto;
      margin: 16px 0;
      border: 1px solid #e5e7eb;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
      padding: 14px 28px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 24px 0;
    }
    .footer {
      margin-top: 32px;
      padding-top: 32px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 14px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>🎉 Welcome to Phone Validation API!</h1>
    </div>
    
    <p>${greeting}</p>
    
    <p>Thank you for signing up! Your API key has been generated and is ready to use.</p>
    
    <h2 style="margin-top: 32px; margin-bottom: 12px; font-size: 18px;">Your API Key</h2>
    <div class="api-key-box">${apiKey}</div>
    <p style="font-size: 14px; color: #6b7280; margin-top: -16px;">Keep this key secure and don't share it publicly.</p>
    
    <div class="info-box">
      <strong>Your Plan:</strong> ${planName}<br>
      <strong>Monthly Requests:</strong> ${requestsLimit.toLocaleString()} requests/month
    </div>
    
    <h2 style="margin-top: 32px; margin-bottom: 12px; font-size: 18px;">Quick Start</h2>
    
    <p>Use your API key in the <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">x-api-key</code> header when making requests:</p>
    
    <div class="code-block">curl -X GET "${apiBaseUrl}/api/validate?phone=+14155552671" \\
  -H "x-api-key: ${apiKey}" \\
  -H "Content-Type: application/json"</div>
    
    <h3 style="margin-top: 24px; margin-bottom: 12px; font-size: 16px;">JavaScript Example</h3>
    <div class="code-block">async function validatePhone(phoneNumber) {
  const response = await fetch(
    \`${apiBaseUrl}/api/validate?phone=\${encodeURIComponent(phoneNumber)}\`,
    {
      method: 'GET',
      headers: {
        'x-api-key': '${apiKey}',
        'Content-Type': 'application/json'
      }
    }
  );
  
  const data = await response.json();
  console.log(data);
}</div>
    
    <h3 style="margin-top: 24px; margin-bottom: 12px; font-size: 16px;">Response Format</h3>
    <div class="code-block">{
  "valid": true,
  "number": "+14155552671",
  "country": "US",
  "type": "mobile"
}</div>
    
    <p style="margin-top: 32px;">If you have any questions, feel free to reach out to our support team.</p>
    
    <p>Happy validating! 🚀</p>
    
    <div class="footer">
      <p>Phone Validation API Team</p>
      <p style="font-size: 12px; margin-top: 8px;">This email was sent to ${toEmail} after successful signup.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
    
    // Plain text version for email clients that don't support HTML
    const textContent = `
Welcome to Phone Validation API!

${greeting}

Thank you for signing up! Your API key has been generated and is ready to use.

Your API Key:
${apiKey}

Keep this key secure and don't share it publicly.

Your Plan: ${planName}
Monthly Requests: ${requestsLimit.toLocaleString()} requests/month

Quick Start:
Use your API key in the x-api-key header when making requests:

curl -X GET "${apiBaseUrl}/api/validate?phone=+14155552671" \\
  -H "x-api-key: ${apiKey}" \\
  -H "Content-Type: application/json"

JavaScript Example:
async function validatePhone(phoneNumber) {
  const response = await fetch(
    \`${apiBaseUrl}/api/validate?phone=\${encodeURIComponent(phoneNumber)}\`,
    {
      method: 'GET',
      headers: {
        'x-api-key': '${apiKey}',
        'Content-Type': 'application/json'
      }
    }
  );
  
  const data = await response.json();
  console.log(data);
}

Response Format:
{
  "valid": true,
  "number": "+14155552671",
  "country": "US",
  "type": "mobile"
}

If you have any questions, feel free to reach out to our support team.

Happy validating!

---
Phone Validation API Team
This email was sent to ${toEmail} after successful signup.
    `.trim();
    
    // Send email via Resend
    // Email is sent to the user's email address (toEmail) that was provided during signup
    // This happens after successful PayPal payment and API key generation
    const result = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: subject,
      html: htmlContent,
      text: textContent
    });
    
    console.log(`Welcome email sent successfully to ${toEmail} (email ID: ${result.id})`);
    
    return result;
    
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
}

module.exports = {
  getResendClient,
  sendWelcomeEmail
};

