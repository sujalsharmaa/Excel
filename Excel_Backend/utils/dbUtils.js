// utils/dbUtils.js
import { User } from "../Model/Db_config.js";

export const getUserByGoogleId = async (googleId) => {
  const result = await User.query("SELECT * FROM users WHERE google_id = $1", [googleId]);
  return result.rows[0];
};

export const insertFileRecord = async (googleId, fileName, location,fileNameForUser,email) => {
  await User.query(
    `INSERT INTO project_files(google_id, file_id,file_name_user, location,email)
     VALUES ($1, $2, $3, $4, $5)`,
    [googleId, fileName,fileNameForUser, location,email]
  );
  await User.query(
    `INSERT INTO file_permissions(user_id, file_id,email,read_permission,write_permission,is_admin)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [googleId, fileName,email,true,true,true]
  );
};
