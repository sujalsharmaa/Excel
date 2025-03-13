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
import morgan from "morgan";
import winston from "winston";
import NodeCache from "node-cache";
import {ElasticsearchTransport} from "winston-elasticsearch";
dotenv.config();

const app = express();
export const nodeCache = new NodeCache();
app.use(express.json()); 
app.use(morgan("dev"))

const esTransportOptions = {
  level: "info",
  clientOpts: { node: `http://${process.env.ELASTICSEARCH_URL}` || "http://localhost:9200" },
  indexPrefix: "app-logs",
  bufferLimit: 1000, // Prevent blocking if ES is down
  flushInterval: 5000, // Send logs in batch every 5s
};

export const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
      new winston.transports.Console(),
      new ElasticsearchTransport(esTransportOptions)
  ],
});

app.use((req, res, next) => {
  logger.info(`Incoming request: ${req.method} ${req.url}`, {
      timestamp: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.headers["user-agent"],
  });
  next();
});

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
    callbackURL: `${process.env.BACKEND_URL}/auth/google/callback`
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
    failureRedirect: process.env.FRONTEND_URL,
    successRedirect: process.env.FRONTEND_URL,
    failureMessage: true
  })
);

app.get('/auth/status', async (req, res) => {

  if(req.isAuthenticated()){

  }
  if (req.user) {
    const googleId = req.user.google_id;
    const fileResult = await User.query(
      `SELECT file_id FROM project_files WHERE google_id = $1 ORDER BY modified_at DESC LIMIT 1`,
      [googleId]
    );


    if (fileResult.rows.length > 0) {
      const LastModifiedFileId = fileResult.rows[0].file_id
    return res.json({ user: req.user, LastModifiedFileId });
    }
  } else {
    return res.json({ user: null });
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
    const emptyCSV = new Array(100)
    .fill(",".repeat(10))
    .join("\n");
    nodeCache.set("CSV_TEMPLATE",JSON.stringify(emptyCSV))
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