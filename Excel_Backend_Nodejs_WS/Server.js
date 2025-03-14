import express from "express";
import http from "http";
import WebSocket from "ws";
import dotenv from "dotenv";
import Redis from "ioredis";
import AWS from "aws-sdk";
import pkg from 'pg';
import cors from "cors";
import bodyParser from "body-parser";
import { WebSocketServer } from "ws";
import { s3UploadQueue } from "./queue.js";
import { createClient } from "redis";
import morgan from "morgan";
import winston from "winston";
import {ElasticsearchTransport} from "winston-elasticsearch";
dotenv.config();


// Elasticsearch Transport Configuration
const esTransportOpts = {
  level: 'info', // Log level (can be error, warn, info, etc.)
  clientOpts: {
    node: `http://${process.env.ELASTICSEARCH_URL}`  || "http://localhost:9200", // Your Elasticsearch URL
  },
  indexPrefix: "websocket-logs", // Index name in Elasticsearch
};

const esTransport = new ElasticsearchTransport(esTransportOpts);

// Winston Logger Setup
const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(), // Log to console
    esTransport, // Log to Elasticsearch
  ],
});

// Log on Startup
logger.info("WebSocket App Started", { timestamp: new Date().toISOString() });

const { Pool } = pkg;


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
app.use(cors());
app.use(morgan("dev"))
app.use(bodyParser.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server});

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

const redisCache = createClient({
  socket: {
    host: process.env.redis_host || "127.0.0.1",
    port: 6379,
  },
});

redisCache.on("connect", async() => {
  console.log("Redis Cache connected!");
  console.log("Redis Cache JSON:",redisCache.json); //removed because json is not a property of the client.
});
await redisCache.connect()

// Redis event handlers
redisPublisher.on('connect', () => console.log('Redis Publisher connected!'));
redisSubscriber.on('connect', () => console.log('Redis Subscriber connected!'));
redisCache.on('connect', () => console.log('Redis Cache connected!'));

redisPublisher.on('error', (err) => console.error('Redis Publisher Error:', err));
redisSubscriber.on('error', (err) => console.error('Redis Subscriber Error:', err));
redisCache.on('error', (err) => console.error('Redis Cache Error:', err));

const fileClients = new Map();
const googleIdClients = new Map();
const fileClientsDrawing = new Map();
const googleIdClientsDrawing = new Map();


async function updateDrawing(fileKey, drawingData) {
  // Create a Redis pipeline for batch processing
  const pipeline = redisPublisher.pipeline();

  // Store the current drawing state in Redis JSON
  pipeline.call(
    "JSON.SET", 
    `drawing:${fileKey}`, 
    "$", 
    JSON.stringify(drawingData.scene)
  );
  
  // Publish the update to all subscribers
  pipeline.publish(fileKey, JSON.stringify(drawingData));
  
  // Execute all operations in a single Redis call
  await pipeline.exec();
  console.log("Drawing update batch completed!");
}


async function updateSpreadsheet(fileKey, updates) {
  if(updates[0].fileNameFromUser==="undefined"){
    console.log("we are returning due to absence of filename=Undefined")
    return
  }
  const pipeline = redisPublisher.pipeline(); // Create a Redis pipeline
  
  for (const update of updates) {
      if (update.isWritePermitted) {
          const path = `$.data[${update.row}][${update.col}]`;
          console.log(path)
          pipeline.call("JSON.SET", fileKey, path, JSON.stringify(update.value)); // Batch updates
         
      } else {
          console.warn(`Write not permitted for row ${update.row}, col ${update.col}`);
      }
  }

  await pipeline.exec(); // Execute all updates in one Redis call
  console.log("Batch updates completed!");
}



const uploadAndCleanup = async (fileName) => {
  const googleId = (fileName.match(/_(\d+)\.csv$/))[1]
  const fileData = await redisCache.sendCommand(["JSON.GET",fileName])
  // console.log(fileData)

  if (googleId && fileData) {
    try {

      // Upload to S3
      await s3UploadQueue.add({
        bucket: process.env.S3_BUCKET_NAME,
        key: `${googleId}/${fileName}`,
        spreadsheet: (JSON.parse(fileData)).data,
      });
      const result = await User.query(`
        UPDATE project_files 
        SET modified_at = NOW()
        WHERE file_id = $1 AND google_id = $2;
      `, [fileName, googleId]);
      
      if (result.rowCount > 0) {
        console.log("Updated the modified_at for file", fileName);
      }

      console.log(`File ${fileName} uploaded to S3 successfully.`);
    } catch (error) {
      console.error(`Error uploading file ${fileName} to S3:`, error);
    } finally {

      // Delete the file from Redis cache
      await redisCache.del(fileName);
      console.log(`File ${fileName} deleted from Redis cache.`);
    }
  }
};


wss.on('connection', async (ws) => {
  console.log("Client connected");
  logger.info("New WebSocket client connected");

  ws.on('message', async (message) => {
    const data = JSON.parse(message);
    logger.info("Received message", { message });
   // console.log("Message received from client", data);

    switch (data.type) {
      case 'INIT':
        console.log(data)
        if(!data.fileName){
          return
        }
        await redisSubscriber.subscribe(data.fileName);
        //console.log("Subscribed to", data.fileName);

        if (!fileClients.has(data.fileName)) {
          fileClients.set(data.fileName, new Set());
          console.log("i have set new file set for clients")
        }
        fileClients.get(data.fileName).add(ws);
        googleIdClients.set(data.userID, ws); // Track the user’s WebSocket

        console.log(fileClients.size)
        console.log(googleIdClients.size)

        //ws.send(JSON.stringify(data))
        break;
      
        case 'ROW_ADD':
          if(data.isWritePermitted) {
            console.log("data ->", data);
            await redisPublisher.publish(data.fileNameFromUser, JSON.stringify(data));
            
            // Get the current document structure
            const currentDoc = await redisCache.sendCommand(["JSON.GET", data.fileNameFromUser]);
            console.log('file ->', currentDoc);

            let numColumns = 10; // Default in case no rows exist

            if (currentDoc) {
                const parsedDoc = JSON.parse(currentDoc);
                if (parsedDoc.data && parsedDoc.data.length > 0) {
                    numColumns = parsedDoc.data[0].length; // Get column count from the first row
                }
            }
            
            // Create a single empty row with 10 columns (matching your existing structure)
            const emptyRow = JSON.stringify(Array(numColumns).fill(""));

            console.log(numColumns)
            
            // Use pipeline for batch execution
            const pipeline = redisPublisher.pipeline();
            
            for(let i = 0; i < data.amount; i++) {
              pipeline.call("JSON.ARRAPPEND", data.fileNameFromUser, "$.data", emptyRow);
            }
            
            // Execute all commands in a single round trip
            const results = await pipeline.exec();
            console.log("Res ->", results[results.length - 1]);
          }
          break;
      
          case 'COL_ADD':
            if (data.isWritePermitted) {
                console.log("data ->", data);
                await redisPublisher.publish(data.fileNameFromUser, JSON.stringify(data));
        
                // Get the current document structure
                const currentDoc = await redisCache.sendCommand(["JSON.GET", data.fileNameFromUser]);
                console.log('file ->', currentDoc);
        
                let numRows = 0; // Default if no rows exist
        
                if (currentDoc) {
                    const parsedDoc = JSON.parse(currentDoc);
                    if (parsedDoc.data && parsedDoc.data.length > 0) {
                        numRows = parsedDoc.data.length; // Get row count from the existing data
                    }
                }
        
                console.log(`Detected row count: ${numRows}`);
        
                // Use pipeline for batch execution
                const pipeline = redisPublisher.pipeline();
        
                // Append new columns to each existing row
                for (let rowIndex = 0; rowIndex < numRows; rowIndex++) {
                    for (let i = 0; i < data.amount; i++) {
                        pipeline.call(
                            "JSON.ARRAPPEND",
                            data.fileNameFromUser,
                            `$.data[${rowIndex}]`,
                            `""`
                        );
                    }
                }
        
                // Execute all commands in a single batch
                const results = await pipeline.exec();
                console.log("Pipeline Result ->", results);
            }
            break;
         
        
      case "CHAT_HISTORY":
        try {
          console.log("Loading chat history",data)
          const chatKey = `chat:${data.fileNameFromUser}`;
          const chatHistory = await redisCache.sendCommand(["lrange",chatKey,"0","-1"])
          console.log("Retrieved chat history, length:", chatHistory.length)
          if (chatHistory.length > 0) {
            // Send chat history to the newly connected client
            ws.send(JSON.stringify({
              type: 'CHAT_HISTORY',
              messages: chatHistory.map(msg => JSON.parse(msg))
            }));
            console.log("Sent chat history to client")
            break;
          }
          else {
            ws.send(JSON.stringify({
              type: 'CHAT_HISTORY',
              messages: []
            }));
            break;
          }
        } catch (error) {
          console.error('Error loading chat history from Redis:', error);
          break;
        }
        case "CHAT_MESSAGE":
          const { sender, message, timestamp, fileNameFromUser } = data;
          console.log(`Chat message received: ${message} from ${sender.name}`);
  
          // Publish the chat message to Redis for other servers
          redisPublisher.publish(fileNameFromUser, JSON.stringify({
            type: 'CHAT_MESSAGE',
            sender,
            message,
            timestamp
          }));
  
          try {
            const chatKey = `chat:${fileNameFromUser}`;
            const chatMessage = { sender, message, timestamp };
            await redisCache.sendCommand(["rpush",chatKey,JSON.stringify(chatMessage)])
            await redisCache.sendCommand(["ltrim",chatKey,"-100","-1"]);
            break;
          } catch (error) {
            console.error('Error storing chat message in Redis:', error);
            break;
        }
      case 'GET_DRAWING_HISTORY':
        console.log("drawing history pingded",data)
        if (!fileClientsDrawing.has(data.fileNameFromUser)) {
          fileClientsDrawing.set(data.fileNameFromUser, new Set());

        }
        fileClientsDrawing.get(data.fileNameFromUser).add(ws);
        googleIdClientsDrawing.set(data.id, ws);

        const file = await redisCache.sendCommand(["JSON.GET",`drawing:${data.fileNameFromUser}`])
        // console.log("file",file)
        if(file){
          ws.send(JSON.stringify({
            type: 'DRAWING_HISTORY',
            history: JSON.parse(file)
          }));
          break;
        }

        try {
          const result = await User.query(
            `SELECT drawing_data FROM project_files WHERE file_id = $1`,
            [data.fileNameFromUser]
          );
          
          if (result.rows.length > 0 && result.rows[0].drawing_data) {
            ws.send(JSON.stringify({
              type: 'DRAWING_HISTORY',
              history: result.rows[0].drawing_data 
            }));
            break;
          }
          break;
        } catch (error) {
          console.error('Error fetching drawing data:', error);
          break;
        }
       
      
      case 'SAVE_DRAWING':
          console.log("drawing save pingded")
          fileClientsDrawing.get(data.fileNameFromUser)?.delete(ws)
          googleIdClientsDrawing.delete(data.id)
          const cachedfile = await redisCache.sendCommand(["JSON.GET",`drawing:${data.fileNameFromUser}`])
          console.log("file",cachedfile)

          try {
            const res = await User.query(
              `UPDATE project_files SET drawing_data = $1, modified_at = NOW() WHERE file_id = $2 returning drawing_data`,
              [JSON.parse(cachedfile), data.fileNameFromUser]
            );
            console.log("db_saving_changes",res.rows)
            break;  
          } catch (error) {
            console.error('Error saving drawing data:', error);
            break;  
          }
        
          


      case 'DRAWING_UPDATE':
        if (!fileClientsDrawing.has(data.fileNameFromUser)) {
          fileClientsDrawing.set(data.fileNameFromUser, new Set());
          fileClientsDrawing.get(data.fileNameFromUser).add(ws);
          googleIdClientsDrawing.set(data.id, ws);
        }

      console.warn("Drawing update size =>", new Blob([JSON.stringify(data.scene.elements)]).size);
        if(new Blob([JSON.stringify(data.scene.elements)]).size <= 2 ){
          return
        }

      await updateDrawing(data.fileNameFromUser, data);
      break;
      case 'VIDEO_OFFER':
        //console.log(data)
        await redisPublisher.publish(data.fileNameFromUser, JSON.stringify(data)); 
        break;
      
      case 'ICE_CANDIDATE':
        await redisPublisher.publish(data.fileNameFromUser, JSON.stringify(data)); 
        break;

      case 'VIDEO_ANSWER':
        await redisPublisher.publish(data.fileNameFromUser, JSON.stringify(data)); 
        break;      
      default:
        // Attach the sender's WebSocket reference
        console.log(data)
        data[0].senderId = data[0].id;
        if(!data[0].isWritePermitted || !data[0].fileNameFromUser){
          return;
        }

        await redisPublisher.publish(data[0].fileNameFromUser, JSON.stringify(data))
        await updateSpreadsheet(data[0].fileNameFromUser,data)
        console.log(data[0].fileNameFromUser)
        break;
    }
  });
  
  ws.on('close', async() => {
    console.log('Client disconnected');

    logger.info("WebSocket client disconnected");

    for (const [fileName, clients] of fileClients.entries()) {

      if (clients.has(ws)) {
        clients.delete(ws);
        console.log(`WebSocket removed from file: ${fileName}`,clients.size);
        
        // If no clients are left for a file, remove the entry

        if (clients.size === 0) {
          await uploadAndCleanup(fileName)
          fileClients.delete(fileName);
          console.log(`No more connections for file: ${fileName}, entry removed.`);
        }
        
        break; // Stop searching once ws is found
      }
    }

    for(const [googleID,clients] of googleIdClients.entries()){
      if(clients===ws){
        googleIdClients.delete(googleID)
        break;
      }
      
    }
    
    //googleIdClients.delete(ws)
    console.log("onclose",fileClientsDrawing.size)
    console.log("onclose",googleIdClientsDrawing.size)
  });
  ws.on('error', (error) => {
    logger.error("WebSocket error", { error });
  });

});



redisSubscriber.on('message', async (channel, message) => {
  let data = JSON.parse(message) 

  let clients = fileClients.get(channel);
  let drawingClients = fileClientsDrawing.get(channel)
  //console.log(data)
  console.log(`Received message on channel: ${channel}`);

  switch(data.type){
    case "VIDEO_ANSWER":
      const sendPromisesVideoAnswer = [];
      clients.forEach((client) => {
        const senderWs = googleIdClients.get(data.id); // Get sender's WebSocket
        
        // ✅ Avoid sending updates back to the sender
        if (client.readyState === WebSocket.OPEN && client !== senderWs) {
          sendPromisesVideoAnswer.push(new Promise((resolve) => {
            client.send(JSON.stringify(data), (error) => {
              if (error) {
                console.error(`Failed to send update to client:`, error);
              }
              resolve();
            });
          }));
        }
      });
  
      await Promise.all(sendPromisesVideoAnswer);
      break;

    case "VIDEO_OFFER":
      console.log("data-->",data)
      const sendPromisesVideoOFFER = [];
      clients.forEach((client) => {
        const senderWs = googleIdClients.get(data.id); // Get sender's WebSocket
        
        // ✅ Avoid sending updates back to the sender
        if (client.readyState === WebSocket.OPEN && client !== senderWs) {
          sendPromisesVideoOFFER.push(new Promise((resolve) => {
            client.send(JSON.stringify(data), (error) => {
              if (error) {
                console.error(`Failed to send update to client:`, error);
              }
              resolve();
            });
          }));
        }
      });
  
      await Promise.all(sendPromisesVideoOFFER);
      break;
    
    case "ICE_CANDIDATE":
      const sendPromisesIceCandidate = [];
      clients.forEach((client) => {
        const senderWs = googleIdClients.get(data.id); // Get sender's WebSocket
        
        // ✅ Avoid sending updates back to the sender
        if (client.readyState === WebSocket.OPEN && client !== senderWs) {
          sendPromisesIceCandidate.push(new Promise((resolve) => {
            client.send(JSON.stringify(data), (error) => {
              if (error) {
                console.error(`Failed to send update to client:`, error);
              }
              resolve();
            });
          }));
        }
      });
  
      await Promise.all(sendPromisesIceCandidate);
      break;

    case "CHAT_MESSAGE":
      console.log(googleIdClients.size)
      console.log(fileClients.size)
    const sendPromises = [];
    clients.forEach((client) => {
      const senderWs = googleIdClients.get(data.sender.id); // Get sender's WebSocket
      
      // ✅ Avoid sending updates back to the sender
      if (client.readyState === WebSocket.OPEN && client !== senderWs) {
        sendPromises.push(new Promise((resolve) => {
          client.send(JSON.stringify(data), (error) => {
            if (error) {
              console.error(`Failed to send update to client:`, error);
            }
            resolve();
          });
        }));
      }
    });

    await Promise.all(sendPromises);
    break;

    case "ROW_ADD":

    if (fileClients.has(channel)) {
      const clients = fileClients.get(channel);
      
  
      const sendPromises = [];
      clients.forEach((client) => {
        const senderWs = googleIdClients.get(data.id); // Get sender's WebSocket
        
        // ✅ Avoid sending updates back to the sender
        if (client.readyState === WebSocket.OPEN && client !== senderWs) {
          sendPromises.push(new Promise((resolve) => {
            client.send(JSON.stringify(data), (error) => {
              if (error) {
                console.error(`Failed to send update to client:`, error);
              }
              resolve();
            });
          }));
        }
      });
  
      await Promise.all(sendPromises);
      
    }
    break;

    case "COL_ADD":

    if (fileClients.has(channel)) {
      const clients = fileClients.get(channel);
      
  
      const sendPromises = [];
      clients.forEach((client) => {
        const senderWs = googleIdClients.get(data.id); // Get sender's WebSocket
        
        // ✅ Avoid sending updates back to the sender
        if (client.readyState === WebSocket.OPEN && client !== senderWs) {
          sendPromises.push(new Promise((resolve) => {
            client.send(JSON.stringify(data), (error) => {
              if (error) {
                console.error(`Failed to send update to client:`, error);
              }
              resolve();
            });
          }));
        }
      });
  
      await Promise.all(sendPromises);
      
    }
    break;

    case "DRAWING_UPDATE":
      const sendPromisesDrawing = [];
      console.log(googleIdClientsDrawing.size)
      drawingClients.forEach((client) => {
        const senderWs = googleIdClientsDrawing.get(data.sender?.id); // Get sender's WebSocket (added optional chaining)

        // Avoid sending updates back to the sender
        if (client.readyState === WebSocket.OPEN && client !== senderWs) {
       
          sendPromisesDrawing.push(new Promise((resolve) => {
            client.send(JSON.stringify(data), (error) => {
              //console.log("we sendu message")
              if (error) {
                console.error(`Failed to send drawing update to client:`, error);
              }
              resolve();
            });
          }));
        }
      });
  
      await Promise.all(sendPromisesDrawing);
      break;

    default: 
    if (data[0].type === 'UPDATE' && fileClients.has(channel)) {
      const clients = fileClients.get(channel);
      
  
      const sendPromises = [];
      clients.forEach((client) => {
        const senderWs = googleIdClients.get(data[0].senderId); // Get sender's WebSocket
        
        // ✅ Avoid sending updates back to the sender
        if (client.readyState === WebSocket.OPEN && client !== senderWs) {
          sendPromises.push(new Promise((resolve) => {
            client.send(JSON.stringify(data), (error) => {
              if (error) {
                console.error(`Failed to send update to client:`, error);
              }
              resolve();
            });
          }));
        }
      });
  
      await Promise.all(sendPromises);
    }  
  }
  
  
})


const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});