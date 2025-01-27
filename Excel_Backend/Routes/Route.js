import { Router } from 'express';
import { isAuthenticated } from '../Middleware/authMiddleware.js';
import { generateSignedUrl } from '../utils/s3Utils.js';
import axios from "axios"
import { User } from '../Model/Db_config.js';
import { redisCache } from '../Cache/RedisConfig.js';


export const router = Router();

router.post("/file/newfile", isAuthenticated, async (req, res) => {
    const googleId = req.user.google_id;
    try {
      const fileResult = await User.query(
        `SELECT file_name FROM project_files WHERE google_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [googleId]
      );
  
      if (fileResult.rows.length > 0) {
        const signedUrl = generateSignedUrl(
          `${process.env.S3_BUCKET_NAME}/${googleId}`,
          fileResult.rows[0].file_name
        );
        return res.redirect(`http://localhost:5173/file/${fileResult.rows[0].file_name}`);
      } else {
        return res.status(404).json({ message: "No file found." });
      }
    } catch (error) {
      console.error("Error fetching file:", error);
      res.status(500).send("Error fetching file.");
    }
  });
  
  router.get("/file/:fileName", isAuthenticated, async (req, res) => {
    const { fileName } = req.params;
  
    try {
      // Fetch data from Redis
      const resp = await redisCache.get(fileName);
      console.log("Data from Redis:", resp);
  
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
        "SELECT google_id FROM project_files WHERE file_name = $1",
        [fileName]
      );
  
      if (!response.rows.length) {
        return res.status(404).send("File not found.");
      }
  
      const signedUrl = await generateSignedUrl(
        `${process.env.S3_BUCKET_NAME}/${response.rows[0].google_id}`,
        fileName
      );
  
      const fileData = await axios.get(signedUrl);
  
      return res.send(fileData.data);
    } catch (error) {
      console.error("Error fetching or converting file:", error);
      return res.status(500).send("Internal Server Error.");
    }
  });
  