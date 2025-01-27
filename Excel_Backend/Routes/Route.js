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
      const google_id = req.user.google_id;

      // Fetch all files where the user is an admin
      const files = await User.query(
          `SELECT file_name_user FROM project_files WHERE google_id = $1 AND is_admin = true`,
          [google_id]
      );

      //console.log(files.rows); // Logs all file names

      const info = [];

      for (let i = 0; i < files.rows.length; i++) {
          const fileName = files.rows[i].file_name_user;

          // Fetch detailed info for each file
          const res2 = await User.query(
              `SELECT email, read_permission, write_permission, modified_at 
              FROM project_files 
              WHERE file_name = $1`,
              [fileName]
          );

          info.push(fileName,res2.rows[0]);
          console.log(fileName)
      }
      console.log("info",info); // Logs the detailed info for each file

      // Respond to the client with the collected information
      return res.send(info)

  } catch (error) {
      console.error("Error fetching admin files:", error);
      res.status(500).json({ error: "Internal Server Error" });
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


  router.get("/file/:fileName", isAuthenticated, async (req, res) => {
    const { fileName } = req.params;
  
    try {
      // Fetch data from Redis
      const resp = await redisCache.get(fileName);
      console.log("Data from Redis:");
  
      if (resp != null) {
        // Parse Redis data into an array
        const parsedArray = JSON.parse(resp);
  
        // Convert array to CSV
        function arrayToCSV(array) {
          return array
            .map(row => row.map(cell => `"${cell}"`).join(',')) // Wrap each cell in quotes
            .join('\n'); // Join rows with a newline
        }
  
        const csv = arrayToCSV(parsedArray);
        return res.set('Content-Type', 'text/csv').send(csv); // Send CSV response
         
      }
  
      // If not found in Redis, fetch Google ID and signed URL
      const response = await User.query(
        "SELECT google_id,file_name_user FROM project_files WHERE file_name = $1",
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
  