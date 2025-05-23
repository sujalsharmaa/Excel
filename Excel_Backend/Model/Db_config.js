import dotenv from "dotenv";
dotenv.config();
import pkg from 'pg';
const { Pool } = pkg;

// Configure the PostgreSQL connection pool
const dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
};

// Add SSL settings for production
if (process.env.NODE_ENV === "prod") {
    dbConfig.ssl = {
        rejectUnauthorized: false,
    };
}

export const User = new Pool(dbConfig);

// Test the connection
User.connect()
    .then((client) => {
        console.log('Connected to RDS PostgreSQL database!');
        client.release(); // Release the client back to the pool
    })
    .catch((error) => console.error('Unable to connect to the database:', error));