import { uploadFileToS3, generateSignedUrl } from "../utils/s3Utils.js";
import { getUserByGoogleId, insertFileRecord } from "../utils/dbUtils.js";
import { User } from "../Model/Db_config.js";
import { sendWelcomeEmail } from "../Mailtrap/EmailControllers.js";
import { redisCache } from "../Cache/RedisConfig.js";
import crypto from "crypto";
import { parseCSV } from "../utils/dbUtils.js";
import axios from "axios";

// Modified to work both as a Passport strategy callback and a standalone endpoint
export const verifyAuth = async (req, res, next) => {
  try {
    // Determine if function is called as Passport strategy or direct endpoint
    const isPassportStrategy = !res;
    
    let googleId, email, displayName, picture;

    if (isPassportStrategy) {
      // This is being called as the Passport strategy callback
      // req is actually the accessToken in this context
      const accessToken = req;
      // res is the refreshToken
      const refreshToken = res;
      // next is the profile object
      const profile = next;
      
      googleId = profile.id;
      email = profile.email;
      displayName = profile.displayName;
      picture = profile.photos?.[0]?.value || null;
      
      // Passport requires this specific callback pattern
      const done = arguments[3];
      
      try {
        await handleUserData(googleId, email, displayName, picture);
        
        // Get the latest user data
        const userResult = await User.query('SELECT * FROM users WHERE google_id = $1', [googleId]);
        const user = userResult.rows[0];
        
        return done(null, user);
      } catch (error) {
        console.error("Passport strategy error:", error);
        return done(error, null);
      }
    } else {
      // This is being called directly from the /auth/google/verify endpoint
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ error: "Token is required" });
      }

      // Verify token with Google
      const googleOauthURL = `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`;
      const { data } = await axios.get(googleOauthURL);

      if (data.aud !== process.env.GOOGLE_CLIENT_ID) {
        return res.status(401).json({ error: "Invalid token" });
      }
      
      googleId = data.sub;
      email = data.email;
      displayName = data.name;
      picture = data.picture;

      console.log(googleId);

      try {
        await handleUserData(googleId, email, displayName, picture);
        
        // Get the latest user data
        const userResult = await User.query('SELECT * FROM users WHERE google_id = $1', [googleId]);
        const user = userResult.rows[0];
        
        if (!user) {
          return res.status(500).json({ error: "Failed to retrieve user after creation" });
        }

        // Use Passport's req.login to establish session
        req.login(user, (err) => {
          if (err) return res.status(500).json({ error: "Session creation failed" });
          return res.json({ user });
        });
      } catch (error) {
        console.error("Direct auth error:", error);
        return res.status(500).json({ error: "Authentication failed", details: error.message });
      }
    }
  } catch (error) {
    console.error("Token verification error:", error);
    if (res) {
      return res.status(401).json({ error: "Authentication failed" });
    }
    // For Passport strategy, call the done callback with error
    return arguments[3](error, null);
  }
};

// Separate function to handle user data operations for both auth flows
async function handleUserData(googleId, email, displayName, picture) {
  // Check if user exists
  let userResult = await User.query('SELECT * FROM users WHERE google_id = $1', [googleId]);
  let user = userResult.rows[0];

  if (!user) {
    // Create new user
    const newUserResult = await User.query(
      `INSERT INTO users(google_id, email, display_name, imageURL)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [googleId, email, displayName, picture]
    );
    user = newUserResult.rows[0];
    
    // Only for new users: Create spreadsheet and send welcome email
    const fileName = `file_${Date.now()}_${googleId}.csv`;
    const fileNameForUser = `${displayName}_spreadsheet_1`;

    // Generate an empty CSV buffer
    const emptyCSV = Array(100)
      .fill()
      .map(() => Array(10).fill("").join(","))
      .join("\n");

    // Parse and cache CSV data
    const jsonData = await parseCSV(emptyCSV);
    await redisCache.sendCommand(["JSON.SET", fileName, "$", JSON.stringify(jsonData)]);
    
    // Upload to S3
    const fileUrl = await uploadFileToS3(
      `${process.env.S3_BUCKET_NAME}/${googleId}`,
      fileName,
      Buffer.from(emptyCSV, "utf-8")
    );

    // Generate token
    const token = crypto.randomBytes(8).toString('base64');
    
    console.log(email, displayName);
    
    // Insert file record and send welcome email
    await Promise.all([
      insertFileRecord(googleId, fileName, fileUrl, fileNameForUser, email),
      sendWelcomeEmail(email, displayName)
    ]);
  }
  
  return user;
}