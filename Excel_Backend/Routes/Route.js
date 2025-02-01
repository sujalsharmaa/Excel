import { Router } from 'express';
import { isAuthenticated } from '../Middleware/authMiddleware.js';
import { generateSignedUrl } from '../utils/s3Utils.js';
import axios from "axios"
import { User } from '../Model/Db_config.js';
import { redisCache } from '../Cache/RedisConfig.js';
import fs from "fs";
import fastcsv from "fast-csv";
import { uploadFileToS3 } from '../utils/s3Utils.js';
import crypto from "crypto"

export const router = Router();

router.get("/admin", isAuthenticated, async (req, res) => {
  try {
    const googleId = req.user.google_id;

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


  router.get("/file/:fileName/name", isAuthenticated, async (req,res)=>{
    // console.log("request obj =>",req)
    const { fileName } = req.params;
    console.log(fileName)
    const fileNameFromUser = await redisCache.get(`${fileName}name`); // Instead of fileName + "name"
    console.log(fileNameFromUser)
    return res.send({fileNameForUser: fileNameFromUser})
  })


  router.post("/newfile", isAuthenticated, async (req, res) => {
    try {
      const { fileNamebyUser, UserPermissions } = req.body;
      const googleId = req.user.google_id;
      const userEmail = req.user.email;
  
      // Generate unique file ID
      const fileName = `file_${Date.now()}_${googleId}.csv`;
      const filePath = `./${fileName}`;
      
      // Create empty CSV
      const data = Array(100).fill().map(() => Array(10).fill(''));
      await new Promise((resolve, reject) => {
        fastcsv
          .write(data, { headers: false })
          .pipe(fs.createWriteStream(filePath))
          .on("finish", resolve)
          .on("error", reject);
      });
  
      // Upload to S3
      const fileUrl = await uploadFileToS3(
        `${process.env.S3_BUCKET_NAME}/${googleId}`,
        fileName,
        filePath
      );
      fs.unlinkSync(filePath); // Clean up local file
  
      // Insert file record
      await User.query(
        `INSERT INTO project_files (google_id, file_id, file_name_user, location, email)
         VALUES ($1, $2, $3, $4, $5)`,
        [googleId, fileName, fileNamebyUser, fileUrl, userEmail]
      );
  
      // Set permissions
      const permissions = [
        // Owner permissions (use existing googleId)
        {
          userId: googleId,
          email: userEmail,
          read: true,
          write: true,
          isAdmin: true
        },
        // Add other users
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
  
      // Filter out invalid users and insert permissions
      const validPermissions = permissions.filter(p => p.userId);
      const invalidEmails = permissions.filter(p => !p.userId).map(p => p.email);
  
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
  
      res.json({
        success: true,
        newFile: {
          fileId: fileName,
          fileName: fileNamebyUser,
          authorizedEmails: validPermissions.map(p => p.email),
          permissions: validPermissions.map(p => 
            p.write ? 'Read + Write' : 'Read'
          ),
          lastModified: new Date().toISOString(),
          token: { value: "", expiresAt: null }
        },
        invalidEmails: invalidEmails
      });
  
    } catch (error) {
      console.error('File creation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create file',
        error: error.message
      });
    }
  });

  router.post("/file/rename", isAuthenticated, async (req, res) => {
    try {
      const { file_Old_name, fileNewName } = req.body;
      const googleId = req.user.google_id;
      
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
      const googleId = req.user.google_id;
  
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
    const googleId = req.user.google_id;
  
    try {
      // Check user permissions
      const result = await User.query(
        `SELECT read_permission, write_permission 
         FROM file_permissions 
         WHERE file_id = $1 AND user_id = $2;`,
        [fileName, googleId]
      );
  
      if (!result.rows.length || !result.rows[0].read_permission) {
        return res.send({ error: "denied" });
      }
  
      // Check if data is in Redis
      const cachedData = await redisCache.get(fileName);
      // const cachedFileName = await redisCache.get(`${fileName}name`);
  
      if (cachedData && cachedFileName) {
        return res.json({
          fileNameForUser: cachedFileName,
          fileContent: JSON.parse(cachedData),
        });
      }
  
      // If not found in Redis, fetch from DB
      const response = await User.query(
        `SELECT google_id, file_name_user FROM project_files WHERE file_id = $1`,
        [fileName]
      );
  
      if (!response.rows.length) {
        return res.status(404).send("File not found.");
      }
  
      const { google_id, file_name_user } = response.rows[0];
  
      // Generate Signed URL and fetch file data
      const signedUrl = await generateSignedUrl(
        `${process.env.S3_BUCKET_NAME}/${google_id}`,
        fileName
      );
  
      const fileData = await axios.get(signedUrl);
  
      // Store in Redis for faster future retrieval
      await redisCache.set(fileName, JSON.stringify(fileData.data));
      // await redisCache.set(`${fileName}name`, file_name_user);
  
      return res.json({
        fileNameForUser: file_name_user,
        fileContent: fileData.data,
      });
    } catch (error) {
      console.error("Error fetching file:", error);
      return res.status(500).send("Internal Server Error.");
    }
  });
  

router.post('/admin/files/:fileName/users', isAuthenticated, async (req, res) => {
  try {
    const { fileName } = req.params;
    const { email, read_permission, write_permission } = req.body;
    const google_id = req.user.google_id;

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
    const google_id = req.user.google_id;

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
    const google_id = req.user.google_id;
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

    // Check for existing token
    const existingToken = await redisCache.get(`${fileId}token`);
    if (existingToken) {
      return res.json({
        token: existingToken,
        url: `http://localhost:5173/file/${fileId}/${existingToken}`
      });
    }

    // Generate new token and set expiration
    const token = crypto.randomBytes(8).toString('base64');

    const expiresIn = convertToSeconds(time); // Implement time conversion
    
    await redisCache.set(`${fileId}token`, token, 'EX', expiresIn);


    return res.json({
      token: token,
      url: `http://localhost:5173/file/${fileId}/${token}`,
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

    // Get the token stored in Redis
    const cachedToken = await redisCache.get(`${file_id}token`);

    if (!cachedToken || cachedToken !== token) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }

    // Get google_id from database
    const resp = await User.query(
      `SELECT google_id FROM project_files WHERE file_id = $1;`,
      [file_id]
    );

    if (resp.rows.length === 0) {
      return res.status(404).json({ error: "File not found" });
    }

    const google_id = resp.rows[0].google_id;

    // Generate signed URL
    const signedUrl = await generateSignedUrl(
      `${process.env.S3_BUCKET_NAME}/${google_id}`,
      file_id
    );

    console.log("Generated signed URL:", signedUrl);

    // Fetch file data
    const fileResponse = await axios.get(signedUrl);
    
    return res.send(fileResponse.data);
  } catch (error) {
    console.error("Error fetching file:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});



// Delete file route
router.delete('/admin/files/:fileName', isAuthenticated, async (req, res) => {
  try {
    const { fileName } = req.params;
    const googleId = req.user.google_id;

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

    res.json({ success: true });

  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user from file route
router.delete('/admin/files/:fileName/users/:email', isAuthenticated, async (req, res) => {
  try {
    const { fileName, email } = req.params;
    const googleId = req.user.google_id;

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