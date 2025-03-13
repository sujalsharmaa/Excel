import dotenv from "dotenv";
dotenv.config(); // Load environment variables

import { logger } from "../Server.js"; 
import { WELCOME_EMAIL_TEMPLATE, EMAIL_TEMPLATE } from "./emailTemplates.js";
import { nodemailerClient } from "./mailtrap.config.js";

/**
 * Sends a welcome email to a newly registered user.
 * @param {string} email - Recipient's email address.
 * @param {string} name - Recipient's name.
 */
export const sendWelcomeEmail = async (email, name) => {
  try {
    logger.info(`Sending welcome email to: ${email}`);

    const response = await nodemailerClient.sendMail({
      from: process.env.MY_EMAIL,
      to: email,
      subject: "Welcome to SheetWise",
      html: WELCOME_EMAIL_TEMPLATE.replace("{name}", name),
    });

    logger.info(`Welcome email sent successfully to: ${email}`, { response });
    return response;
  } catch (error) {
    logger.error(`Failed to send welcome email to ${email}: ${error.message}`, { error });
  }
};

/**
 * Sends an email with a file download link and an attached CSV file.
 * @param {string} email - Recipient's email address.
 * @param {string} name - Recipient's name.
 * @param {string} link - Download link for the file.
 * @param {Buffer} fileBuffer - File content in buffer format.
 * @param {string} fileName - Name of the attached file.
 */
export const sendEmailFileLink = async (email, name, link, fileBuffer, fileName) => {
  try {
    logger.info(`Sending file link email to: ${email}, File: ${fileName}`);

    const formattedEmail = EMAIL_TEMPLATE.replace("{name}", name).replace(/{link}/g, link);
    
    const response = await nodemailerClient.sendMail({
      from: process.env.MY_EMAIL,
      to: email,
      subject: "You received a file link!",
      html: formattedEmail,
      attachments: [
        {
          filename: fileName,
          content: fileBuffer,
          contentType: "text/csv", // Assuming a CSV file
        },
      ],
    });

    logger.info(`File link email sent successfully to: ${email}`, { response });
    return response;
  } catch (error) {
    logger.error(`Failed to send file link email to ${email}: ${error.message}`, { error });
  }
};
