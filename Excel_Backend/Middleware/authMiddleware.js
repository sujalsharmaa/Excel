// authMiddleware.js
import  {JWTService}  from "../utils/JWTservice.js";

export const isAuthenticated = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log(authHeader)
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false, 
      error: 'Unauthorized', 
      message: 'Authentication token is required' 
    });
  }
  
  const token = authHeader.split('Bearer ')[1];
  const user = JWTService.decodeToken(token);
  
  if (!user) {
    return res.status(401).json({ 
      success: false, 
      error: 'Unauthorized', 
      message: 'Invalid or expired token' 
    });
  }
  
  // Attach user to request object
  req.user = user;
  next();
};