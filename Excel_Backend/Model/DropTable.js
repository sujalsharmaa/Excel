import { User } from "./Db_config.js";

export const dropTable = async () => {
    const query = `DROP table project_files;
    DROP table users;
    `;

    try {
        await User.query(query);
        console.log('Tables deleted successfully!');
    } catch (error) {
        console.error('Error deleting tables:', error);
    }
};

dropTable()