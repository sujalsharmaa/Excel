// utils/dbUtils.js
import { User } from "../Model/Db_config.js";

export const getUserByGoogleId = async (googleId) => {
  const result = await User.query("SELECT * FROM users WHERE google_id = $1", [googleId]);
  return result.rows[0];
};

export const insertFileRecord = async (googleId, fileName, location) => {
  await User.query(
    `INSERT INTO project_files(google_id, file_name, location, is_admin, read_permission, write_permission)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [googleId, fileName, location, true, true, true]
  );
};
