// JWTService.js
import jwt from 'jsonwebtoken';
import dotenv from "dotenv"
dotenv.config()

export class JWTService {
    static generateToken(user) {
      return jwt.sign(
        { 
          id: user.google_id,
          email: user.email,
          displayName: user.display_name,
          picture: user.imageURL
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
    }
  
    static decodeToken(token) {
      try {
        return jwt.verify(token, process.env.JWT_SECRET);
      } catch (error) {
        return null;
      }
    }
  }