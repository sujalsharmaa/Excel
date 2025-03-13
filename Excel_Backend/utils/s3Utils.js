// utils/s3Utils.js
import AWS from "aws-sdk";
import dotenv from "dotenv";
dotenv.config();

export const s3 = new AWS.S3({
  accessKeyId: process.env.accesskeyid,
  secretAccessKey: process.env.secretaccesskey,
  region: 'us-east-1',
});

export const uploadFileToS3 = async (bucket, key, fileBuffer) => {
  const params = {
    Bucket: bucket,
    Key: key,
    Body: fileBuffer, // Directly use buffer
    ContentType: "text/csv",
  };

  try {
    const response = await s3.upload(params).promise();
    return response.Location;
  } catch (error) {
    console.error("S3 Upload Error:", error);
    throw new Error("Failed to upload file to S3.");
  }
};


export const deleteFileFromS3 = async (bucket, key) => {
  const params = {
    Bucket: bucket,
    Key: key,
  };

  try {
    const response = await s3.deleteObject(params).promise();
    return response.VersionId
  } catch (error) {
    console.error("S3 Upload Error:", error);
    throw new Error("Failed to upload file to S3.");
  }
};


export const generateSignedUrl = async(bucket, key, expiresIn = 300) => {
  const params = { Bucket: bucket, Key: key, Expires: expiresIn };
  return s3.getSignedUrl("getObject", params);
};
