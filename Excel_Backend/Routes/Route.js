import { Router } from 'express';
import { isAuthenticated } from '../Middleware/authMiddleware.js';
import { generateSignedUrl } from '../utils/s3Utils.js';
import axios from "axios"
import { User } from '../Model/Db_config.js';
import { redisCache } from '../Cache/RedisConfig.js';
import { fileNamingMaps } from '../Server.js';


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
          FROM file_permissions WHERE file_id = $1;
        `;
        const permissionResult = await User.query(query2, [file.file_id]);

        return {
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

router.post("/file/rename",isAuthenticated,async (req,res)=>{
  const {file_id,fileNewName} = req.body
  const googleId = req.user.google_id;

  const result1 = await User.query(`select file_name_user from project_files
    where google_id = $1;
    `,[googleId])
  const files = result1.rows[0]  
  if(files.has(fileNewName)){
    return res.json("error", "name already in use")
  }  
  const result = await User.query(`update project_files set file_user_name = $1
    where file_id = $2 and google_id = $3 returning file_user_name;
    `,[fileNewName,file_id,googleId])
  if(result.rows.length > 0){
    return res.json(result.rows[0].file_name_user)
  }  
})  

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
      const result = await User.query(`SELECT read_permission,write_permission
        from file_permissions where file_id = $1 and user_id = $2;`
        ,[fileName,googleId])
      console.log(result.rows[0])
      if (!result.rows.length || !result.rows[0].read_permission) {
        return res.send("denied");
      }
      const resp = await redisCache.get(fileName);
      console.log("Data from Redis:");
            // Fetch data from Redis

      if (resp != null) {
        // Parse Redis data into an array
        const parsedArray = JSON.parse(resp);
  
        // Convert array to CSV
        function arrayToCSV(array) {
          return array
            .map(row => row.map(cell => `${cell}`).join(',')) // Wrap each cell in quotes
            .join('\n'); // Join rows with a newline
        }
  
        const csv = arrayToCSV(parsedArray);
        return res.set('Content-Type', 'text/csv').send(csv); // Send CSV response
         
      }
  
      // If not found in Redis, fetch Google ID and signed URL
      const response = await User.query(
        "SELECT google_id,file_name_user FROM project_files WHERE file_id = $1",
        [fileName]
      );
     
      const file_name_user = response.rows[0].file_name_user
      //console.log(file_name_user)
      if (!response.rows.length) {
        return res.status(404).send("File not found.");
      }
  
      const signedUrl = await generateSignedUrl(
          `${process.env.S3_BUCKET_NAME}/${response.rows[0].google_id}`,
        fileName
      );
  
      const fileData = await axios.get(signedUrl);
      await redisCache.set(`${fileName}name`, file_name_user); // Instead of fileName + "name"
      console.log("REDIS RES=>",await redisCache.get(`${fileName}name`))


      return res.send(fileData.data);
    } catch (error) {
      console.error("Error fetching or converting file:", error);
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
      console.log("fucked up ",updateFilePermissions.rows[0])
    } catch (error) {
      console.log("fucked up ",error)
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

    // Check if the file exists
    const fileResult = await User.query(
      `SELECT * FROM project_files WHERE file_id = $1`,
      [fileName]
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

    // Update user permissions in the project_files table
    const updateResult = await User.query(
      `UPDATE file_permissions 
       SET read_permission = $1, write_permission = $2, assigned_at = CURRENT_TIMESTAMP
       WHERE file_id = $3 AND email = $4 
       RETURNING *`,
      [read_permission, write_permission, fileName, email]
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