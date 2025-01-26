import express from "express";
import http from "http";
import WebSocket from "ws";
import dotenv from "dotenv";
import Redis from "ioredis";
import axios from "axios";
import AWS from "aws-sdk";
import pkg from 'pg';
import cors from "cors"
import bodyParser from "body-parser";
import { WebSocketServer } from "ws";
import { s3UploadQueue } from "./queue.js";

const { Pool } = pkg;
dotenv.config();

const s3 = new AWS.S3({
  accessKeyId: process.env.accesskeyid,
  secretAccessKey: process.env.secretaccesskey,
  region: 'us-east-1',
});

// Configure the PostgreSQL connection pool
const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
};

// Add SSL settings for production
if (process.env.NODE_ENV === "prod") {
  dbConfig.ssl = {
    rejectUnauthorized: false,
  };
}

const User = new Pool(dbConfig);

// Test the connection
User.connect()
  .then((client) => {
    console.log('Connected to RDS PostgreSQL database!');
    client.release(); // Release the client back to the pool
  })
  .catch((error) => console.error('Unable to connect to the database:', error));

const app = express();


// Middleware order is important!

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Redis client for publishing messages
const redisPublisher = new Redis({
  host: process.env.redis_host || '127.0.0.1',
  port: 6379,
});

// Redis client for subscribing to channels
const redisSubscriber = new Redis({
  host: process.env.redis_host || '127.0.0.1',
  port: 6379,
});

// Redis event handlers
redisPublisher.on('connect', () => console.log('Redis Publisher connected!'));
redisSubscriber.on('connect', () => console.log('Redis Subscriber connected!'));

redisPublisher.on('error', (err) => console.error('Redis Publisher Error:', err));
redisSubscriber.on('error', (err) => console.error('Redis Subscriber Error:', err));

// Store WebSocket clients and their IDs
const fileClients = new Map(); // Maps file names to sets of WebSocket clients
const fileSubscriberCounts = new Map(); // Tracks the number of subscribers for each file
const localFileVersions = new Map(); // Stores local versions of files
let userGoogleID = new Map();

// Store acknowledged updates
const acknowledgedUpdates = new Set();

// Track subscribed channels manually
const subscribedChannels = new Set();

// Validate cell coordinates
const isValidCell = (row, col) => {
  return (
    Number.isInteger(row) &&
    Number.isInteger(col) &&
    row >= 0 &&
    row < 10 &&
    col >= 0 &&
    col < 10
  );
};

// Function to log the number of connected clients
const logClientCount = () => {
  console.log(`Number of connected clients: ${fileClients.size}`);
};

const getCSVfileAndSetState = async (bucket, key, fileName, expiresIn = 300) => {
  try {
    const params = { Bucket: bucket, Key: key, Expires: expiresIn };
    // Generate a pre-signed URL to fetch the CSV file
    const url = await s3.getSignedUrlPromise("getObject", params);

    // Fetch the CSV file contents
    const response = await axios.get(url);
    const csvText = response.data;

    if (!csvText) {
      throw new Error('No data received from the S3 object');
    }

    // Parse CSV into a 2D array
    const rows = csvText.trim().split('\n').map((row) =>
      row.split(',').map((cell) => cell.trim())
    );

    // Validate if the CSV has data and matches expected dimensions (e.g., 10x10)
    if (rows.length === 0 || rows.some((row) => row.length === 0)) {
      throw new Error('CSV is empty or not properly formatted');
    }

    // Set the parsed CSV data to the local file version
    localFileVersions.set(fileName, rows);

    console.log('Local file version updated successfully from S3');
  } catch (error) {
    console.error('Error in getCSVfileAndSetState:', error);
    throw error;
  }
};

// Subscribe to Redis dynamically as files are added
const subscribeToFileChannel = (fileName) => {
  if (!subscribedChannels.has(fileName)) {
    redisSubscriber.subscribe(fileName).then(() => {
      subscribedChannels.add(fileName); // Add the channel to the Set
      console.log(`Subscribed to Redis channel: ${fileName}`);
    }).catch((err) => {
      console.error(`Failed to subscribe to Redis channel ${fileName}:`, err);
    });
  }
};

// Upload local file version to S3 and clean up
const uploadAndCleanup = async (fileName) => {
  const googleId = userGoogleID.get(fileName);
  const fileData = localFileVersions.get(fileName);

  if (googleId && fileData) {
    try {
      // Convert the file data to CSV
      const csvData = fileData.map((row) => row.join(',')).join('\n');

      // Upload to S3
      await s3UploadQueue.add({
        bucket: process.env.S3_BUCKET_NAME,
        key: `${googleId}/${fileName}`,
        spreadsheet: fileData,
      });

      console.log(`File ${fileName} uploaded to S3 successfully.`);
    } catch (error) {
      console.error(`Error uploading file ${fileName} to S3:`, error);
    } finally {
      // Delete the local version of the file
      localFileVersions.delete(fileName);
      console.log(`Local version of file ${fileName} deleted.`);
    }
  }
};

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('New client connected');

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      console.log("userID: ", data.userID, 'fileName: ', data.fileName);

      // Associate the client with the file
      if (data.fileName) {
        if (!fileClients.has(data.fileName)) {
          fileClients.set(data.fileName, new Set());
          fileSubscriberCounts.set(data.fileName, 0);
        }
        fileClients.get(data.fileName).add(ws);
        fileSubscriberCounts.set(data.fileName, fileSubscriberCounts.get(data.fileName) + 1);

        // Subscribe to the Redis channel for this file
        subscribeToFileChannel(data.fileName);

        // Load the file if it's not already loaded
        if (!localFileVersions.has(data.fileName)) {
          const response = await User.query("SELECT google_id FROM project_files WHERE file_name = $1", [data.fileName]);
          if (response.rows.length > 0) {
            const googleId = response.rows[0].google_id;
            userGoogleID.set(data.fileName, googleId);
            await getCSVfileAndSetState(
              process.env.S3_BUCKET_NAME,
              `${googleId}/${data.fileName}`,
              data.fileName
            );
          }
        }
      }

      // Handle updates from clients
      if (data.type === 'UPDATE') {
        const { row, col, value, id, fileNameFromUser } = data;
        console.log(`Received update: row=${row}, col=${col}, value=${value}, id=${id}, fileName=${fileNameFromUser}`);
        if (!isValidCell(row, col)) throw new Error('Invalid cell address');

        if (localFileVersions.has(fileNameFromUser)) {
          const file = localFileVersions.get(fileNameFromUser);
          file[row][col] = value;
          localFileVersions.set(fileNameFromUser, file);
        }

        // Publish the update to Redis
        redisPublisher.publish(`${fileNameFromUser}`, JSON.stringify({ row, col, value, senderId: id }));
      }

      // Handle acknowledgments from clients
      if (data.type === 'ACK') {
        const { updateId } = data;
        console.log(`Received acknowledgment for update: ${updateId}`);
        acknowledgedUpdates.add(updateId);
      }
    } catch (error) {
      console.error('Invalid message:', error);
      ws.send(JSON.stringify({ type: 'ERROR', error: error.message }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');

    // Remove the client from all file associations
    fileClients.forEach((clients, fileName) => {
      if (clients.has(ws)) {
        clients.delete(ws);
        fileSubscriberCounts.set(fileName, fileSubscriberCounts.get(fileName) - 1);

        // If no more subscribers, upload the file to S3 and clean up
        if (fileSubscriberCounts.get(fileName) === 0) {
          uploadAndCleanup(fileName);
          fileClients.delete(fileName);
          fileSubscriberCounts.delete(fileName);
        }
      }
    });
  });
});

// Redis subscription handler
redisSubscriber.on('message', async (channel, message) => {
  const { row, col, value, senderId } = JSON.parse(message);
  const updateId = `${row}-${col}-${value}-${senderId}`;

  if (acknowledgedUpdates.has(updateId)) {
    console.log(`Update already acknowledged: ${updateId}`);
    return;
  }

  console.log(`Broadcasting: row=${row}, col=${col}, value=${value}, senderId=${senderId}`);

  // Send the update to all clients subscribed to this file
  if (fileClients.has(channel)) {
    const clients = fileClients.get(channel);
    const sendPromises = [];
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        sendPromises.push(new Promise((resolve) => {
          client.send(JSON.stringify({ row, col, value, updateId }), (error) => {
            if (error) {
              console.error(`Failed to send update to client:`, error);
            }
            resolve();
          });
        }));
      }
    });

    await Promise.all(sendPromises);
    acknowledgedUpdates.add(updateId);
  }
});

// Periodically clear acknowledged updates
setInterval(() => {
  acknowledgedUpdates.clear();
  console.log('Cleared acknowledged updates');
}, 10000); // Clear every 10 seconds


// Start the server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
