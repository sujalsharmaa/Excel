// Required packages
import express from "express";
import bodyParser from "body-parser";
import passport from "passport";
import GoogleStrategy from "passport-google-oauth2";
import session from "express-session";
import dotenv from "dotenv";
import { RegisterFlow } from "./Controllers/Controllers.js";
import {createTable} from "./Model/CreateTable.js";
import { User } from "./Model/Db_config.js";
import cors from "cors"
import { router } from "./Routes/Route.js";
import { isAuthenticated } from "./Middleware/authMiddleware.js";
import { generateSignedUrl } from "./utils/s3Utils.js";
import Redis from "ioredis";
import { redisCache } from "./Cache/RedisConfig.js";
dotenv.config();



const app = express();

const corsOptions = {
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

// Middleware order is important!
app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: true }));

// 1. Session middleware must come before passport
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// 2. Initialize passport and session BEFORE setting up routes
app.use(passport.initialize());
app.use(passport.session());

// 3. Passport configuration
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback"
  }, RegisterFlow
));

// 4. Serialization (updated to handle different response formats)
passport.serializeUser((user, done) => {

  if (!user) {
    return done(new Error('No user to serialize'));
  }
  
  // Handle different user object structures
  const googleId = user.google_id || user.id || user;
  if (!googleId) {
    return done(new Error('No google_id found'));
  }
  
  done(null, googleId);
});

passport.deserializeUser(async (googleId, done) => {
  try {

    const result = await User.query('SELECT * FROM users WHERE google_id = $1', [googleId]);
    
    if (!result.rows.length) {
      return done(null, null);
    }
    
    done(null, result.rows[0]);
  } catch (err) {
    console.error("Deserialization error:", err);
    done(err, null);
  }
});

// 5. Routes come after passport setup
app.use(router);

// Authentication routes
app.get('/auth/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'] 
  })
);

app.get('/auth/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: 'http://localhost:5173/',
    successRedirect: 'http://localhost:5173/',
    failureMessage: true
  })
);

app.get('/auth/status', async (req, res) => {

  if(req.isAuthenticated()){

  }
  if (req.user) {
    const googleId = req.user.google_id;
    const fileResult = await User.query(
      `SELECT file_name FROM project_files WHERE google_id = $1 ORDER BY modified_at DESC LIMIT 1`,
      [googleId]
    );

    let signedUrl = null;
    if (fileResult.rows.length > 0) {
      // signedUrl = await generateSignedUrl(process.env.S3_BUCKET_NAME, fileResult.rows[0].file_name);
      signedUrl = fileResult.rows[0].file_name
    }

    res.json({ user: req.user, signedUrl });
  } else {
    res.json({ user: null });
  }
});

// Logout route
app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Error during logout:', err);
      return res.status(500).send('Error during logout');
    }
    res.clearCookie('connect.sid', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
    return res.status(200).send("logged out");
  });
});

// Start server
const PORT = process.env.PORT || 3000;
const startServer = async () => {
  try {
    console.log('Setting up database tables...');
    await createTable()
    console.log('Database tables are ready!');
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

startServer();