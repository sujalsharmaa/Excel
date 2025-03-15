import dotenv from "dotenv"
dotenv.config()

export const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect(process.env.FRONTEND_URL);
  };