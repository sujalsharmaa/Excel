import { User } from "./Db_config.js";

export const createTable = async () => {
    const query = `
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            google_id VARCHAR(255) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            display_name VARCHAR(255),
            imageURL VARCHAR(255),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            is_premium_user BOOLEAN DEFAULT false
        );

        CREATE TABLE IF NOT EXISTS project_files (
            id SERIAL PRIMARY KEY, -- A unique identifier for each file
            google_id VARCHAR(255) NOT NULL,
            file_name VARCHAR(255) NOT NULL,
            file_name_user VARCHAR(255) NOT NULL,
            email VARCHAR(255),
            users JSON,
            location VARCHAR(255) NOT NULL,
            is_admin BOOLEAN NOT NULL,
            read_permission BOOLEAN NOT NULL,
            write_permission BOOLEAN NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            modified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (google_id) REFERENCES users (google_id) ON DELETE CASCADE,
            FOREIGN KEY (email) REFERENCES users (email) ON DELETE CASCADE
        );
    `;

    try {
        await User.query(query);
        console.log('Tables created successfully!');
    } catch (error) {
        console.error('Error creating tables:', error);
    }
};

