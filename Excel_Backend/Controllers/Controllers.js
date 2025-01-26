import { uploadFileToS3, generateSignedUrl } from "../utils/s3Utils.js";
import { getUserByGoogleId, insertFileRecord } from "../utils/dbUtils.js";
import fs from "fs";
import fastcsv from "fast-csv";
import { User } from "../Model/Db_config.js";

export const RegisterFlow = async (accessToken, refreshToken, profile, done) => {
  try {
    const googleId = profile.id;
    let user = await getUserByGoogleId(googleId);

    // Check if user exists and has a file
    if (user) {
      const fileResult = await User.query(
        `SELECT file_name FROM project_files WHERE google_id = $1 ORDER BY modified_at DESC LIMIT 1`,
        [googleId]
      );

      if (fileResult.rows.length > 0) {
        // If file exists, just return the user
        return done(null,  googleId );
      }
    }

    // If no user or no file, create new user and file
    if (!user) {
      user = await User.query(
        `INSERT INTO users(google_id, email, display_name, imageURL)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [googleId, profile.emails[0].value, profile.displayName, profile.picture]
      );
    }

    // Create and upload a new file
    const fileName = `file_${Date.now()}_${googleId}.csv`;
    const filePath = `./${fileName}`;
    const rows = 10;
    const cols = 100;
    const data = Array(cols).fill().map(() => Array(rows).fill(''));

    return new Promise((resolve, reject) => {
      fastcsv
        .write(data, { headers: false })
        .pipe(fs.createWriteStream(filePath))
        .on("finish", async () => {
          try {
            const fileUrl = await uploadFileToS3(
              `${process.env.S3_BUCKET_NAME}/${googleId}`,
              fileName,
              filePath
            );
            await insertFileRecord(googleId, fileName, fileUrl);
            
            // Call done only once
            done(null,  googleId);
            resolve();
          } catch (error) {
            done(error, null);
            reject(error);
          } finally {
            fs.unlinkSync(filePath); // Clean up local file
          }
        })
        .on("error", (err) => {
          done(err, null);
          reject(err);
        });
    });

  } catch (error) {
    console.error("RegisterFlow Error:", error);
    done(error, null);
  }
};