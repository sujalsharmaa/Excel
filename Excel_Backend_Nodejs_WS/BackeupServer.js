import express from "express";
import http from "http";
import WebSocket from "ws";
import dotenv from "dotenv";
import Redis from "ioredis";
import axios from "axios";
import AWS from "aws-sdk";
import pkg from 'pg';
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
const clients = new Map(); // Use a Map to store clients with their IDs
let spreadsheetState = new Map();
let fileName = new Array();
let userGoogleID = new Map();
let newChange = new Map();

// Store acknowledged updates
const acknowledgedUpdates = new Set();

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
  console.log(`Number of connected clients: ${clients.size}`);
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

        // Set the parsed CSV data to the spreadsheetState
        spreadsheetState.set(fileName, rows);

        console.log('Spreadsheet state updated successfully from S3');
    } catch (error) {
        console.error('Error in getCSVfileAndSetState:', error);
        throw error;
    }
};

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('New client connected');

  // Handle incoming messages
  ws.on('message', async (message) => {
    try {
        const data = JSON.parse(message);
        console.log("userID: ", data.userID, 'fileName: ', data.fileName);

        if (!spreadsheetState.has(data.fileName) && data.userID && data.fileName) {
            fileName.push(data.fileName);
            const response = await User.query("SELECT google_id from project_files where file_name = $1", [data.fileName]);
            console.log(response.rows[0]?.google_id);
            if (response.rows.length > 0) {
                const googleId = response.rows[0].google_id;
                userGoogleID.set(data.fileName, googleId);
            }
            await getCSVfileAndSetState(
                process.env.S3_BUCKET_NAME, 
                `${response.rows[0].google_id}/${data.fileName}`,
                `${data.fileName}`
            );
        }

        // Handle updates from clients
        if (data.type === 'UPDATE') {
            const { row, col, value, id, fileNameFromUser } = data;
            console.log(`Received update: row=${row}, col=${col}, value=${value}, id=${id}, fileName=${fileNameFromUser}`);
            if (!isValidCell(row, col)) throw new Error('Invalid cell address');
            if (spreadsheetState.has(fileNameFromUser)) {
                const file = spreadsheetState.get(fileNameFromUser);
                file[row][col] = value;
                spreadsheetState.set(fileNameFromUser, file);
                newChange.set(fileNameFromUser, true);
            }

            // Store the client's ID
            clients.set(ws, id);

            // Log the number of connected clients
            logClientCount();

            // Publish the update to Redis
            redisPublisher.publish(`${fileNameFromUser}`, JSON.stringify({ row, col, value, senderId: id }));
        }

        // Handle acknowledgments from clients
        if (data.type === 'ACK') {
            const { updateId } = data;
            console.log(`Received acknowledgment for update: ${updateId}`);
            acknowledgedUpdates.add(updateId); // Mark the update as acknowledged
        }
    } catch (error) {
        console.error('Invalid message:', error);
        ws.send(JSON.stringify({ type: 'ERROR', error: error.message }));
    }
  });

  // Handle WebSocket disconnection
  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);

    // Log the number of connected clients
    logClientCount();
  });
});

// Subscribe to Redis channel
fileName.forEach(file => {
    redisSubscriber.subscribe(`${file}`).then(() => {
        console.log('Subscribed to Redis channel: spreadsheet-updates');
      });
});




// Redis subscription event handler
redisSubscriber.on('message', async (channel, message) => {
  if (channel === `${fileName}`) {
    const { row, col, value, senderId } = JSON.parse(message);
    const updateId = `${row}-${col}-${value}-${senderId}`; // Unique ID for the update

    // Skip if the update has already been acknowledged
    if (acknowledgedUpdates.has(updateId)) {
      console.log(`Update already acknowledged: ${updateId}`);
      return;
    }

    console.log(`Broadcasting: row=${row}, col=${col}, value=${value}, senderId=${senderId}`);

    // Send the message to all connected WebSocket clients except the sender
    const sendPromises = [];
    clients.forEach((id, client) => {
      if (id !== senderId && client.readyState === WebSocket.OPEN) {
        const promise = new Promise((resolve) => {
          client.send(JSON.stringify({ row, col, value, updateId }), (error) => {
            if (error) {
              console.error(`Failed to send update to client ${id}:`, error);
            } else {
              console.log(`Update sent to client ${id}`);
            }
            resolve();
          });
        });
        sendPromises.push(promise);
      }
    });

    // Wait for all updates to be sent
    await Promise.all(sendPromises);

    // Mark the update as acknowledged
    acknowledgedUpdates.add(updateId);
    console.log(`Update acknowledged: ${updateId}`);
  }
});

// Periodically clear acknowledged updates to allow new updates to the same cell
setInterval(() => {
  acknowledgedUpdates.clear();
  console.log('Cleared acknowledged updates');
}, 10000); // Clear every 10 seconds

// Modify the newChange processing
const processS3Upload = () => {
    newChange.forEach((isChanged, fileName) => {
      if (isChanged) {
        const googleId = userGoogleID.get(fileName);
        const sheetData = spreadsheetState.get(fileName);
        
        if (googleId && sheetData) {
          s3UploadQueue.add({
            bucket: process.env.S3_BUCKET_NAME,
            key: `${googleId}/${fileName}`,
            spreadsheet: sheetData
          });
          
          newChange.set(fileName, false);
          console.log(`Spreadsheet state added to queue for ${fileName}`);
        }
      }
    });
};

// Call this periodically
setInterval(processS3Upload); // Check every 5 seconds

// Start the server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});