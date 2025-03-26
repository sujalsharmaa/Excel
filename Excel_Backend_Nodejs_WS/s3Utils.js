import AWS from 'aws-sdk';
import dotenv from 'dotenv';
dotenv.config();

// Initialize the S3 client
const s3 = new AWS.S3({
  accessKeyId: process.env.accesskeyid,
  secretAccessKey: process.env.secretaccesskey,
  region: process.env.AWS_REGION,
});

// Function to upload a file to S3
export const uploadFileToS3 = async (bucket, key, fileContent) => {
  const params = {
    Bucket: bucket,
    Key: key,
    Body: fileContent,
    ContentType: 'text/csv',
  };

  try {
    const response = await s3.upload(params).promise();
    return response.Location;
  } catch (error) {
    console.error('S3 Upload Error:', error.message);
    throw new Error('Failed to upload file to S3.');
  }
};
