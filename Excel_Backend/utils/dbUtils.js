// utils/dbUtils.js
import { User } from "../Model/Db_config.js";

export const getUserByGoogleId = async (googleId) => {
  const result = await User.query("SELECT * FROM users WHERE google_id = $1", [googleId]);
  return result.rows[0];
};

export const insertFileRecord = async (googleId, fileName, location,fileNameForUser,email) => {
  await User.query(
    `INSERT INTO project_files(google_id, file_name,file_name_user, location, is_admin, read_permission, write_permission,email)
     VALUES ($1, $2, $3, $4, $5, $6, $7,$8)`,
    [googleId, fileName,fileNameForUser, location, true, true, true,email]
  );
};
