import Queue from "bull"
import { uploadFileToS3 } from "./s3Utils.js";
import dotenv from "dotenv"
dotenv.config()

const redisConfig = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
};

// Create a queue for S3 uploads
export const s3UploadQueue = new Queue('s3-upload', { redis: redisConfig });

// Function to process the queue
s3UploadQueue.process(async (job) => {
  const { bucket, key, spreadsheet } = job.data; // Extract job data

  try {
    // Validate the spreadsheet data
    //console.log(spreadsheet)

    if (!spreadsheet || !Array.isArray(spreadsheet)) {
      throw new Error('Invalid spreadsheet data');
    }

    // Convert the spreadsheet data to CSV
    const csvData = spreadsheet.map((row) => row.join(',')).join('\n');
    //console.log(csvData)
    // Upload to S3
    const fileLocation = await uploadFileToS3(bucket, key, csvData);
    console.log(`File uploaded successfully to: ${fileLocation}`);
    
  } catch (error) {
    console.error('Error processing S3 upload:', error.message);
    throw error;
  }
});

// Export the queue for external use

