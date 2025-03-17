import { response, Router } from 'express';
import { isAuthenticated } from '../Middleware/authMiddleware.js';
import { deleteFileFromS3, generateSignedUrl, s3 } from '../utils/s3Utils.js';
import axios from "axios"
import { User } from '../Model/Db_config.js';
import { redisCache } from '../Cache/RedisConfig.js';
import fs from "fs";
import fastcsv from "fast-csv";
import { uploadFileToS3 } from '../utils/s3Utils.js';
import crypto from "crypto"
import { sendEmailFileLink } from '../Mailtrap/EmailControllers.js';
import Razorpay from "razorpay";
import dotenv from "dotenv"
dotenv.config()
import { GoogleGenerativeAI } from '@google/generative-ai';
import { parse } from "fast-csv";

import xlsx from "xlsx";
import path from "path";
import multer from "multer";
const upload = multer({ dest: "uploads/" }); // Temp storage for file processing
import { parseCSV } from '../utils/dbUtils.js';

const gemini = new GoogleGenerativeAI(process.env.GEMINI_KEYS_2);

// Load the generative model
const geminiModel = gemini.getGenerativeModel({ model: "gemini-2.0-flash" });




 // ✅ Convert Redis JSON format to 2D array
  function redisJsonTo2DArray(redisJson) {
    if (!redisJson || Object.keys(redisJson).length === 0) return [];
    return redisJson.data; // Redis is already a 2D array format
}


export const router = Router();

router.get("/admin", isAuthenticated, async (req, res) => {
  try {
    const googleId = req.user.id;
    console.log(req.user.id)

    // Fetch all project files for the user
    const query1 = `
      SELECT file_id, file_name_user, modified_at 
      FROM project_files WHERE google_id = $1;
    `;
    const result1 = await User.query(query1, [googleId]);

    const fileData = await Promise.all(
      result1.rows.map(async (file) => {
        // Fetch permissions for each file
        const query2 = `
          SELECT email, read_permission, write_permission, assigned_at
          FROM file_permissions WHERE file_id = $1 and is_admin = 'false';
        `;
        const permissionResult = await User.query(query2, [file.file_id]);

        return {
          fileId: file.file_id,
          file_name_user: file.file_name_user,
          modified_at: file.modified_at,
          permissions: permissionResult.rows.map((row) => ({
            email: row.email,
            read_permission: row.read_permission,
            write_permission: row.write_permission,
            assigned_at: row.assigned_at,
          })),
        };
      })
    );
    console.log(fileData)

    return res.json({
      success: true,
      data: fileData,
    });
  } catch (error) {
    console.error("Error fetching admin files:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
    });
  }
});




router.post("/newfile", isAuthenticated, async (req, res) => {
  try {
    const { fileNamebyUser, UserPermissions } = req.body;
    const googleId = req.user.id;
    const userEmail = req.user.email;

    const result1 = await User.query(
      `SELECT file_name_user FROM project_files WHERE google_id = $1;`,
      [googleId]
    );
    const files = result1.rows.map(row => row.file_name_user);
    
    if (files.includes(fileNamebyUser)) {
      return res.status(400).json({ error: "Name already in use" });
    }

    // Generate a unique file ID
    const fileName = `file_${Date.now()}_${googleId}.csv`;
        // Send success response to user ASAP
    res.json({ success: true,fileId: fileName });

    // Generate an empty CSV buffer (100 rows x 15 columns)
    const emptyCSV = Array(100)
      .fill()
      .map(() => Array(15).fill("").join(","))
      .join("\n");

    // convert to json and store in redis  
    const jsonData = await parseCSV(emptyCSV)
    await redisCache.sendCommand(["JSON.SET", fileName, "$", JSON.stringify(jsonData)]);

    // Upload the empty CSV buffer to S3
    const fileUrl = await uploadFileToS3(
      `${process.env.S3_BUCKET_NAME}/${googleId}`,
      fileName,
      Buffer.from(emptyCSV, "utf-8") // Pass buffer instead of filePath
    );


    // Perform DB tasks in background
    setImmediate(async () => {
      try {

        // Insert file record into the database
        await User.query(
          `INSERT INTO project_files (google_id, file_id, file_name_user, location, email)
           VALUES ($1, $2, $3, $4, $5)`,
          [googleId, fileName, fileNamebyUser, fileUrl, userEmail]
        );

        // Process user permissions
        const permissions = [
          {
            userId: googleId,
            email: userEmail,
            read: true,
            write: true,
            isAdmin: true,
          },
          ...await Promise.all(UserPermissions.map(async (u) => {
            const userResult = await User.query(
              `SELECT google_id FROM users WHERE email = $1`,
              [u.email]
            );
            return {
              userId: userResult.rows[0]?.google_id,
              email: u.email,
              read: u.permission === 'view' || u.permission === 'edit',
              write: u.permission === 'edit',
              isAdmin: false
            };
          }))
        ];

        // Insert valid permissions
        const validPermissions = permissions.filter(p => p.userId);
        for (const perm of validPermissions) {
          await User.query(
            `INSERT INTO file_permissions 
             (file_id, user_id, email, read_permission, write_permission, is_admin)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (file_id, user_id) DO UPDATE SET
               read_permission = EXCLUDED.read_permission,
               write_permission = EXCLUDED.write_permission`,
            [fileName, perm.userId, perm.email, perm.read, perm.write, perm.isAdmin]
          );
        }
      } catch (error) {
        console.error("Background task error:", error);
      }
    });

  } catch (error) {
    console.error("File creation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create file",
      error: error.message
    });
  }
});


  router.post("/file/rename", isAuthenticated, async (req, res) => {
    try {
      const { file_Old_name, fileNewName } = req.body;
      const googleId = req.user.id;
      
      console.log("i got hit ", fileNewName,file_Old_name,googleId);
  
      // Get all file names for the user
      const result1 = await User.query(
        `SELECT file_name_user FROM project_files WHERE google_id = $1;`,
        [googleId]
      );
  
      const files = result1.rows.map(row => row.file_name_user); // Convert rows to an array
  
      // Check if the new file name is already used
      if (files.includes(fileNewName)) {
        return res.status(400).json({ error: "Name already in use" });
      }
  
      // Update file name
      const result = await User.query(
        `UPDATE project_files SET file_name_user = $1
         WHERE file_name_user = $2 AND google_id = $3 RETURNING file_name_user;`,
        [fileNewName,file_Old_name,googleId]
      );
  
      if (result.rowCount > 0) {
        console.log("Updated file:", result.rows[0]);
        return res.json({ file_name_user: result.rows[0].file_name_user });
      } else {
        return res.status(404).json({ error: "File not found" });
      }
    } catch (error) {
      console.error("Error renaming file:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  

  router.get("/file/:fileName/writeCheck", isAuthenticated, async (req, res) => {
    try {
      console.log("Permission check route hit");
  
      const { fileName } = req.params;
      const googleId = req.user.id;
  
      const result = await User.query(
        `SELECT write_permission 
         FROM file_permissions 
         WHERE file_id = $1 AND user_id = $2;`,
        [fileName, googleId]
      );
  
      console.log("Permission check result:", result.rows[0]);
  
      // Return JSON response with permission status
      const hasPermission = result.rows.length && result.rows[0].write_permission;
      return res.json({ permission: hasPermission });
  
    } catch (error) {
      console.error("Error during permission check:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  });
  


  router.get("/file/:fileName", isAuthenticated, async (req, res) => {
    const { fileName } = req.params;
    const googleId = req.user.id;

    try {
        // 🔹 Step 1: Check User Permissions

        const result = await User.query(
            `SELECT read_permission, write_permission 
             FROM file_permissions 
             WHERE file_id = $1 AND user_id = $2;`,
            [fileName, googleId]
        );

        if (!result.rows.length || !result.rows[0].read_permission) {
            return res.send({ error: "denied" });
        }

        // 🔹 Step 2: Get File Name from DB (Avoids Second Query)
        const fileResult = await User.query(
            `SELECT file_name_user, google_id FROM project_files WHERE file_id = $1`,
            [fileName]
        );

        if (!fileResult.rows.length) {
            return res.status(404).send("File not found.");
        }

        const { file_name_user, google_id } = fileResult.rows[0];

        // 🔹 Step 3: Check Redis Cache First (Avoid DB Load)
        const cachedData = await redisCache.sendCommand(["JSON.GET", fileName]);

        if (cachedData) {
            console.log("✅ Redis Cache Hit:");

            try {
                // **Fix:** Parse JSON properly before conversion
                const parsedData = JSON.parse(cachedData);
                const two_d_Array = redisJsonTo2DArray(parsedData);

                return res.json({
                    fileNameForUser: file_name_user,
                    fileContent: two_d_Array,
                });
            } catch (parseError) {
                console.error("❌ Error parsing Redis JSON:", parseError);
            }
        }

        // 🔹 Step 4: Fetch File from S3 if Not Cached
        console.log("❌ Cache Miss, Fetching from S3...");
        const signedUrl = await generateSignedUrl(
            `${process.env.S3_BUCKET_NAME}/${google_id}`,
            fileName
        );

        const fileData = await axios.get(signedUrl);
        const jsonData = await parseCSV(fileData.data);

        // 🔹 Step 5: Store in Redis for Future Requests
        await redisCache.sendCommand(["JSON.SET", fileName, "$", JSON.stringify(jsonData)]);

        const two_d_Array = redisJsonTo2DArray(jsonData);

        return res.json({
            fileNameForUser: file_name_user,
            fileContent: two_d_Array
        });

    } catch (error) {
        console.error("❌ Error fetching file:", error);
        return res.status(500).send("Internal Server Error.");
    }
});







router.post("/email", isAuthenticated, async (req, res) => {
  try {
    const { email, file_id,fileName } = req.body;
    const name = req.user.display_name;
    const google_id = req.user.id;
    const link = `${process.env.FRONTEND_URL}/file/${file_id}`;

    // Generate signed URL for file access
    const signedUrl = await generateSignedUrl(
      `${process.env.S3_BUCKET_NAME}/${google_id}`,
      file_id
    );

    // Download the file from S3
    const fileResponse = await axios.get(signedUrl, { responseType: "arraybuffer" });
    const fileBuffer = Buffer.from(fileResponse.data, "binary"); // Convert response to Buffer

    // Send the email with the file as an attachment
    const formatedName = fileName.replace(/$/, ".csv")
    const emailResponse = await sendEmailFileLink(email, name, link, fileBuffer,formatedName);

    return res.status(200).json({ success: true, message: "Email sent successfully", emailResponse });

  } catch (error) {
    console.error("Error sending email:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});


  router.post('/admin/files/:fileName/users', isAuthenticated, async (req, res) => {
  try {
    const { fileName } = req.params;
    const { email, read_permission, write_permission } = req.body;
    const google_id = req.user.id;

    // Check if the file exists
    const fileResult = await User.query(
      `SELECT file_id FROM project_files WHERE file_name_user = $1 and google_id = $2`,
      [fileName,google_id]
    );
    if (fileResult.rows.length === 0) {
      return res.status(404).json({ error: 'File not found dear' });
    }
    const file_name = fileResult.rows[0].file_id

    // Check if the user exists
    // console.log("email in body =>",req)
    const userResult = await User.query(
      `SELECT google_id FROM users WHERE email = $1`,
      [email]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }


    const googleId = userResult.rows[0].google_id;

    // Add user permissions for the file
    try {
      var updateFilePermissions = await User.query(
        `INSERT INTO file_permissions (file_id, user_id, read_permission, write_permission,email,is_admin)
VALUES ($1, $2, $3, $4,$5,$6)
ON CONFLICT (file_id, user_id)
DO UPDATE SET 
    read_permission = EXCLUDED.read_permission, 
    write_permission = EXCLUDED.write_permission
    returning email,read_permission,write_permission;
`,
        [file_name,googleId,read_permission || false, write_permission || false,email,false ]
        
      );
      console.log(updateFilePermissions.rows[0])
    } catch (error) {
      console.log(error)
    }

    // If the file permission update was not successful
    if (updateFilePermissions.rows.length === 0) {
      return res.status(400).json({ error: 'Failed to update file permissions' });
    }

    res.json(updateFilePermissions.rows[0]);
  } catch (error) {
    console.error('Error adding user to file:', error);
    res.status(500).json({ error: error.message });
  }
})

// Update user permissions
router.put('/admin/files/:fileName/users/:email', isAuthenticated, async (req, res) => {
  try {
    const { fileName, email } = req.params;
    const { read_permission, write_permission } = req.body;
    const google_id = req.user.id;

    // Check if the file exists
    const fileResult = await User.query(
      `SELECT file_id FROM project_files WHERE file_name_user = $1 
      AND google_id = $2;
      `,
      [fileName,google_id]
    );
    if (fileResult.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check if the user exists
    const userResult = await User.query(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const file_id = fileResult.rows[0].file_id

    // Update user permissions in the project_files table
    const updateResult = await User.query(
      `UPDATE file_permissions 
       SET read_permission = $1, write_permission = $2, assigned_at = CURRENT_TIMESTAMP
       WHERE file_id = $3 AND email = $4 
       RETURNING *`,
      [read_permission, write_permission, file_id, email]
    );
    console.log(updateResult.rows[0])

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ error: 'User is not authorized for the file' });
    }

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Error updating permissions:', error);
    res.status(500).json({ error: error.message });
  }
});


router.post("/admin/generateToken", isAuthenticated, async (req, res) => {
  try {
    console.log("i got hit from token req")
    const google_id = req.user.id;
    const { time, fileName } = req.body;
    console.log("data from token req => ",req.body)

    // Validate input
    if (!time || !fileName) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Get file ID from database
    const result = await User.query(`
      SELECT file_id FROM project_files 
      WHERE file_name_user = $1 AND google_id = $2;
    `, [fileName, google_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "File not found" });
    }

    const fileId = result.rows[0].file_id;
    const expiresIn = convertToSeconds(time); 

    // Check for existing token
    const existingToken = await redisCache.get(`${fileId}token`);
    if (existingToken) {
      console.log("i send data from cache =>",`${process.env.FRONTEND_URL}/token/file/${fileId}/${existingToken}`)
      return res.json({
        token: existingToken,
        url: `${process.env.FRONTEND_URL}/${fileId}/${existingToken}`,
        expiresAt: Date.now() - (expiresIn * 1000)
      });
    }

    // Generate new token and set expiration
    const token = crypto.randomBytes(8).toString('base64');

    // Implement time conversion
    
    await redisCache.set(`${fileId}token`, token);
    await redisCache.expire(`${fileId}token`, expiresIn);
    

    console.log("i send data from db =>",`${process.env.FRONTEND_URL}/token/file/${fileId}/${token}`)
    return res.json({
      token: token,
      url: `${process.env.FRONTEND_URL}/${fileId}/${token}`,
      expiresAt: Date.now() + (expiresIn * 1000)
    });

  } catch (error) {
    console.error("Token generation error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Helper function to convert time string to seconds
function convertToSeconds(timeStr) {
  const value = parseInt(timeStr);
  const unit = timeStr.slice(-1);
  
  switch (unit) {
    case 'm': return value * 60;
    case 'h': return value * 60 * 60;
    case 'd': return value * 60 * 60 * 24;
    default: throw new Error('Invalid time unit');
  }
}


router.get("/token/file/:file_id/:token", async (req, res) => {
  try {
    const { file_id, token } = req.params;
    console.log("Received token file request:", file_id, token);

    // Check token in Redis
    const cachedToken = await redisCache.get(`${file_id}token`);
    if (!cachedToken || cachedToken !== token) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }

    // Get remaining time before token expires
    const ttl = await redisCache.ttl(`${file_id}token`);
    console.log(`Token TTL: ${ttl} seconds`);

    // Get google_id from database
    const resp = await User.query(
      `SELECT google_id,file_name_user FROM project_files WHERE file_id = $1;`,
      [file_id]
    );

    if (resp.rows.length === 0) {
      return res.status(404).json({ error: "File not found" });
    }

    const google_id = resp.rows[0].google_id;
    const fileNameFromUser = resp.rows[0].file_name_user

    // Generate signed URL
    const signedUrl = await generateSignedUrl(
      `${process.env.S3_BUCKET_NAME}/${google_id}`,
      file_id
    );

    console.log("Generated signed URL:", signedUrl);

    // Fetch file data from S3
    const fileResponse = await axios.get(signedUrl);

    // Send file content along with TTL
    return res.json({ fileContent: fileResponse.data, ttl,fileNameFromUser });
  } catch (error) {
    console.error("Error fetching file:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});




// Delete file route
router.delete('/admin/files/:fileName', isAuthenticated, async (req, res) => {
  try {
    const { fileName } = req.params;
    const googleId = req.user.id;

    const fileCount = await User.query(
      `SELECT count(file_id) from project_files
      where google_id = $1;
      `,
    [googleId])
    console.log(fileCount.rows[0])
    if(fileCount.rows[0].count == 1){
      return res.status(404).json({error: "one file needs to exist"})
    }

    // Get file ID
    const fileResult = await User.query(
      `SELECT file_id FROM project_files 
       WHERE file_name_user = $1 AND google_id = $2`,
      [fileName, googleId]
    );
   
    
    if (fileResult.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }
    const fileId = fileResult.rows[0].file_id;

    // Delete permissions
    await User.query(
      `DELETE FROM file_permissions WHERE file_id = $1`,
      [fileId]
    );

    // Delete file record
    await User.query(
      `DELETE FROM project_files WHERE file_id = $1`,
      [fileId]
    );

    // Delete from Redis cache
    await redisCache.del(fileId);
    await redisCache.del(`${fileId}token`);
    await redisCache.del(`${fileId}name`);

    const response = await deleteFileFromS3(
      `${process.env.S3_BUCKET_NAME}/${googleId}`,
      fileId,
    );

    res.json({ success: true,version: response });

  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user from file route
router.delete('/admin/files/:fileName/users/:email', isAuthenticated, async (req, res) => {
  try {
    const { fileName, email } = req.params;
    const googleId = req.user.id;

    // Get file ID
    const fileResult = await User.query(
      `SELECT file_id FROM project_files 
       WHERE file_name_user = $1 AND google_id = $2`,
      [fileName, googleId]
    );
    
    if (fileResult.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }
    const fileId = fileResult.rows[0].file_id;

    // Delete user permission
    const result = await User.query(
      `DELETE FROM file_permissions 
       WHERE file_id = $1 AND email = $2
       RETURNING *`,
      [fileId, email]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found in file permissions' });
    }

    res.json({ success: true });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// Get S3 Folder Size
router.get("/storageSize", isAuthenticated, async (req, res) => {
  const googleId = req.user.id;
  const folderPrefix = `${googleId}/`; // Ensure it ends with "/"
  console.log("googleid",googleId)

  let totalSize = 0;
  let continuationToken = undefined;

  try {
    do {
      const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Prefix: folderPrefix,
        ContinuationToken: continuationToken,
      };

      const response = await s3.listObjectsV2(params).promise(); // Fix: Add `.promise()`

      response.Contents.forEach((item) => {
        totalSize += item.Size;
      });

      continuationToken = response.NextContinuationToken; // Handle pagination
    } while (continuationToken);

    // Convert bytes to readable formats
    const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
    const sizeInGB = (totalSize / (1024 * 1024 * 1024)).toFixed(2);

    return res.json({
      bytes: totalSize,
      megabytes: parseFloat(sizeInMB),
      gigabytes: parseFloat(sizeInGB),
    });
  } catch (error) {
    console.error("Error calculating folder size:", error);
    return res.status(500).json({ error: "Failed to calculate folder size" });
  }
});



const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

router.post('/create-storage-order',isAuthenticated, async (req, res) => {
  console.log("payment got hit", process.env.RAZORPAY_KEY_ID,process.env.RAZORPAY_KEY_SECRET)
  try {
    const options = {
      amount: req.body.amount,
      currency: req.body.currency,
      receipt: 'storage_upgrade_' + Date.now(),
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order' });
  }
});

router.post('/verify-payment',isAuthenticated, async (req, res) => {
  const {
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature
  } = req.body;

  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');

  const isAuthentic = expectedSignature === razorpay_signature;

  if (isAuthentic) {
    // Update user's storage limit in database
    await updateUserStorage(req.user.id, 10); // Add 100GB
    res.json({ success: true });
  } else {
    res.status(400).json({ success: false });
  }
});


async function updateUserStorage(google_id,size){
  try {
    const resp = await User.query(`
      UPDATE users SET is_premium_user = $1,SET storage = $2
      WHERE google_id = $3 returning is_premium_user
      `,
      [true,size,google_id]
    )
    console.log("update user storage success",resp[0].is_premium_user)
    return ({success: true,premium_user: resp.rows[0].is_premium_user})

  } catch (error) {
    console.log(error.message)
  }
}





router.post(
  "/uploadToS3AndLoadFile",
  isAuthenticated,
  upload.single("file"), // Multer middleware to handle file upload
  async (req, res) => {
    try {
      const { filename, UserPermissions, fileType } = req.body;
      const googleId = req.user.id;
      const userEmail = req.user.email;
      const fileSize = req.file.size;
      let filePath = req.file.path;
      let finalFileName = `file_${Date.now()}_${googleId}.csv`;

      console.log("Received file:", filename, "File Type:", fileType);

      // Check if file is Excel and convert it to CSV
      if (fileType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || fileType === "application/vnd.ms-excel") {
        console.log("Excel file detected, converting to CSV...");
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const csvData = xlsx.utils.sheet_to_csv(workbook.Sheets[sheetName]);

        // Save CSV temporarily
        filePath = path.join("uploads", finalFileName);
        fs.writeFileSync(filePath, csvData);
      }

      // Upload to S3
      const fileBuffer = fs.readFileSync(filePath);
      const s3Params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `${googleId}/${finalFileName}`,
        Body: fileBuffer,
        ContentType: "text/csv",
      };

      const uploadResponse = await s3.upload(s3Params).promise();
      console.log("File uploaded successfully:", uploadResponse.Location);

      // Store file metadata in the database
      await User.query(
        `INSERT INTO project_files (google_id, file_id, file_name_user, location, email)
         VALUES ($1, $2, $3, $4, $5)`,
        [googleId, finalFileName, filename, uploadResponse.Location, userEmail]
      );

      // Assign permissions
      await User.query(
        `INSERT INTO file_permissions 
         (file_id, user_id, email, read_permission, write_permission, is_admin)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [finalFileName, googleId, userEmail, true, true, true]
      );

      // Delete temp file after upload
      fs.unlinkSync(filePath);

      res.json({ success: true, fileName: finalFileName, fileUrl: uploadResponse.Location });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ success: false, message: "Failed to upload file", error: error.message });
    }
  }
);



router.post("/chat", isAuthenticated, async (req, res) => {
  try {
    const { fileUrl } = req.body;

    // Ensure the fileUrl is provided
    if (!fileUrl) {
      return res.status(400).json({ error: "File URL is required" });
    }

    // Get the 2D array from Redis
    const file2DArray = await redisCache.sendCommand(["JSON.GET",fileUrl])
    if (!file2DArray) {
      return res.status(404).json({ error: "File not found in cache" });
    }
    console.log("CSV File:", file2DArray);

    // Convert 2D array to CSV string
    const fileCSV = await new Promise((resolve, reject) => {
      let csvString = "";
      fastcsv
        .writeToString(JSON.parse(file2DArray).data, { headers: false })
        .then(resolve)
        .catch(reject);
    });

    

    // Validate request messages
    if (!req.body.messages || !Array.isArray(req.body.messages)) {
      return res.status(400).json({ error: "Invalid request format" });
    }

    const model = "gemini";

    // Extract system and user messages

    //const systemMessage = req.body.messages.find((msg) => msg.role === "system");
    const userMessage = req.body.messages.find((msg) => msg.role === "user");

    // Create a prompt including the CSV data
    const prompt = `
You are an AI assistant helping users interact with a spreadsheet. 
Never use regex always use your intelligence.
Remember my spreadsheet rows and columns starts from index 0.
But my vertical row header starts from 1 so A1 = row: 0, col: 0
B1 = row: 0, col: 1, A2 = row: 1,col: 0, B2 = row: 1, col: 1. 
              For spreadsheet actions, respond with JSON. For normal chat, respond with plain text.
              
              Spreadsheet action format:
              {
                "actions": [
                  {
                    "type": "SET_CELL_VALUE",
                    "row": 0,
                    "col": 0,
                    "value": "123"
                  }
                ],
                "response": "I've set cell A1 to 123."
              }
              Remember my spreadsheet rows and columns starts from index 0.
But my vertical row header starts from 1 so A1 = row: 0, col: 0
B1 = row: 0, col: 1, A2 = row: 1,col: 0, B2 = row: 1, col: 1. 
always check there is existing header in the sheet, if it exists then set formulas below headers.
donot use formula for translation. use your own intelligence.
              if the user want you to use formula then your respond should be in json like this:

              {
               "actions":[
               {
                    "type": "SET_FORMULA",
                    "row": target row where result should appear,
                    "col": target column where result should appear (if there is header make sure you donot delete it, always set correspondingly values),
                    "formula": "=formula_name(A1:B1)" (Formula range remains correct)

               }
               ],
               "response": "I' ve apply formula_name on A1,B1...cells"
              }
              
              

      User request: ${userMessage?.content}
      Here is the current file for context:
      type can only be SET_FORMULA or SET_CELL_VALUE even when you need to add or delete column you just use SET_CELL_VALUE 
      also NEVER include JSON in "response" put it in action.
      ${fileCSV}
    `;

    

    // Send prompt to Gemini
    const geminiResponse = await geminiModel.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    let assistantMessage = geminiResponse.response.text();

    // Try to parse JSON response
    if (assistantMessage) {
      try {
        const parsedResponse = assistantMessage.trim().replace(/^```json\s*/, '').replace(/```$/, '');
        assistantMessage = parsedResponse;
      } catch (e) {
        console.warn("Response looked like JSON but couldn't be parsed:", e);
      }
    }
    console.log(assistantMessage)

    res.status(200).json({ response: assistantMessage });
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ error: "Error processing request" });
  }
});

const verifyPaymentWithRazorpay = async (paymentId) => {
  try {
    // Fetch payment details from Razorpay to verify

    const response = await axios.get(
      `https://api.razorpay.com/v1/payments/${paymentId}`,
      {
        auth: {
          username: process.env.RAZORPAY_KEY_ID,
          password: process.env.RAZORPAY_KEY_SECRET
        }
      }
    );
    
    // Check if payment is captured or authorized
    const paymentStatus = response.data.status;
    const paymentInfo = response.data;
    
    return {
      isValid: paymentStatus === 'captured' || paymentStatus === 'authorized',
      paymentInfo
    };
  } catch (error) {
    console.error('Razorpay verification error:', error);
    return { isValid: false };
  }
};

router.post('/payment-success',isAuthenticated, async (req, res) => {
  const { pid } = req.body
    console.log(pid)
  if (!pid) {
    return res.status(400).json({ success: false, message: 'Missing payment information' });
  }

      // Get user from session or JWT token
      const userId = req.user?.google_id;
    
      if (!userId) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
      }
  
  // Verify with Razorpay API
  const isValid = await verifyPaymentWithRazorpay(pid);
  
  if (isValid) {
    await updateUserStorage(req.user.id, 10); // Add 100GB
    return res.json({ success: true });
  } else {
    return res.status(400).json({ success: false });
  }
});