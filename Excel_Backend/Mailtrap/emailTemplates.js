export const WELCOME_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to SheetWise ✨</title>
  <style>
    /* Previous styles remain unchanged */
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      background-color: #f4f4f7;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(90deg, #6a11cb 0%, #2575fc 100%);
      padding: 40px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      font-size: 28px;
      margin: 0;
      font-weight: bold;
    }
    .header p {
      color: #ffffff;
      font-size: 18px;
      margin: 0;
      padding-top: 10px;
    }
    .content {
      padding: 40px;
      color: #333333;
      text-align: center;
    }
    .content h2 {
      font-size: 24px;
      margin-bottom: 20px;
      color: #6a11cb;
    }
    .content p {
      font-size: 16px;
      line-height: 1.6;
      margin: 0 0 20px;
    }
    .content .cta-button {
      display: inline-block;
      background-color: #6a11cb;
      color: #ffffff;
      text-decoration: none;
      padding: 15px 30px 15px 30px;
      font-size: 16px;
      border-radius: 5px;
      margin-top: 20px;
      transition: background-color 0.3s ease;
    }
    .content .cta-button:hover {
      background-color: #2575fc;
    }
    .footer {
      background-color: #f4f4f7;
      text-align: center;
      padding: 20px;
      font-size: 12px;
      color: #888888;
    }
    .footer p {
      margin: 0;
    }
    .footer a {
      color: #2575fc;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header Section -->
    <div class="header">
      <h1>✨ Welcome to SheetWise! 🎉</h1>
      <p>We're excited to have you on board! 🚀</p>
    </div>

    <!-- Content Section -->
    <div class="content">
      <h2>Hello {name}! 👋</h2>
      <p>Thank you for joining us! 🌟 We're thrilled to have you as part of our growing community. Get ready to explore, learn, and connect with amazing people! 🤝</p>
      <p>As a member, you now have access to exclusive features ⭐️, updates 📱, and much more! We can't wait to see what you achieve! 🎯</p>

      <!-- CTA Button -->
      <a href="https://sujalsharma.in" class="cta-button">Get Started 🚀</a>

      <p>If you have any questions, feel free to reply to this email or reach out to our support team at any time. We're here to help! 💪</p>
      <p>Best regards,<br><strong>Team SheetWise</strong> 💫</p>
    </div>

    <!-- Footer Section -->
    <div class="footer">
      <p>Need help? Visit our <a href="#">Help Center</a> 📚 or <a href="mailto:support@sheetwise.com">contact support</a> 💌</p>
      <p>&copy; 2024 SheetWise corp. All rights reserved. ✨</p>
    </div>
  </div>
</body>
</html>
`

export const EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You got a Link! 🔗</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #4CAF50, #45a049); padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">Shared Link 🔗✨</h1>
  </div>
  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
    <p>Hello! 👋</p>
    <p>Your friend 
      <span style="background: linear-gradient(to right, #ff4e50, #fc6767); color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">
        {name} 
      </span> 
       just shared a file with you! 📁✨ If you want to open the file, click the link below! 🎯
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{link}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Open File 📂</a>
    </div>
    <p>Best regards,<br>SheetWise Team 💫</p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
    <p>This is an automated message, please do not reply to this email. 🤖</p>
  </div>
</body>
</html>

`;