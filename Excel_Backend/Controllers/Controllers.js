import { uploadFileToS3, generateSignedUrl } from "../utils/s3Utils.js";
import { getUserByGoogleId, insertFileRecord } from "../utils/dbUtils.js";
import { User } from "../Model/Db_config.js";
import { sendWelcomeEmail } from "../Mailtrap/EmailControllers.js";
import { redisCache } from "../Cache/RedisConfig.js";
import crypto from "crypto"
import { parseCSV } from "../utils/dbUtils.js";

export const RegisterFlow = async (accessToken, refreshToken, profile, done) => {
  try {
    const googleId = profile.id;

    // Check if user exists and has a file
    let user = await getUserByGoogleId(googleId);
    if (user) {
      const fileResult = await User.query(
        `SELECT file_id FROM project_files WHERE google_id = $1 ORDER BY modified_at DESC LIMIT 1`,
        [googleId]
      );
      if (fileResult.rows.length > 0) {
        // **Fast response**: Authenticate user immediately
        return done(null, googleId);
      }
    }

    // **Fast response**: Send authentication response ASAP
    done(null, googleId);

    // Background execution starts here 🔽
    (async () => {
      try {
        if (!user) {
          user = await User.query(
            `INSERT INTO users(google_id, email, display_name, imageURL)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [googleId, profile.emails[0].value, profile.displayName, profile.picture]
          );
        }

        // Generate file metadata
        const fileName = `file_${Date.now()}_${googleId}.csv`;
        const fileNameForUser = `${profile.displayName}_spreadsheet_1`;


        // Generate an empty CSV buffer (10 rows x 100 columns)
        const emptyCSV = Array(100)
          .fill()
          .map(() => Array(10).fill("").join(","))
          .join("\n");

        // Upload directly to S3 (no local file creation)
        const jsonData = await parseCSV(emptyCSV);

        await redisCache.sendCommand(["JSON.SET", fileName, "$", JSON.stringify(jsonData)]);
        const fileUrl = await uploadFileToS3(
          `${process.env.S3_BUCKET_NAME}/${googleId}`,
          fileName,
          Buffer.from(emptyCSV, "utf-8") // Upload buffer directly
        );

        // Store file details & send email in parallel
        const email = profile.emails[0].value;
        const name = profile.displayName;

            // Generate new token and set expiration
            const token = crypto.randomBytes(8).toString('base64');
        
        console.log(email,name)
        await Promise.all([
          insertFileRecord(googleId, fileName, fileUrl, fileNameForUser, email),
          sendWelcomeEmail(email, name)
        ]);

      } catch (bgError) {
        console.error("Background Task Error:", bgError);
      }
    })();

  } catch (error) {
    console.error("RegisterFlow Error:", error);
    done(error, null);
  }
};

