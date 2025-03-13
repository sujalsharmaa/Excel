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
    is_premium_user BOOLEAN DEFAULT false,
    storage INT DEFAULT 1
);


CREATE TABLE IF NOT EXISTS project_files (
    file_id VARCHAR(255) PRIMARY KEY, -- Use VARCHAR instead of SERIAL for file IDs
    email VARCHAR(255),
    google_id VARCHAR(255) NOT NULL,
    modified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    file_name_user VARCHAR(255),
    location VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (google_id) REFERENCES users (google_id) ON DELETE CASCADE,
    FOREIGN KEY (email) REFERENCES users (email) ON DELETE CASCADE,
    drawing_data JSONB
);


CREATE TABLE IF NOT EXISTS file_permissions (
    id SERIAL PRIMARY KEY,
    file_id VARCHAR(255) NOT NULL, -- Use VARCHAR for file IDs
    user_id VARCHAR(255) NOT NULL,
    read_permission BOOLEAN DEFAULT false,
    write_permission BOOLEAN DEFAULT false,
    email VARCHAR(255) NOT NULL,
    is_admin BOOLEAN NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (file_id) REFERENCES project_files(file_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(google_id) ON DELETE CASCADE,
    UNIQUE (file_id, user_id)
);

INSERT INTO users (email, google_id) VALUES
('example123@email.com', '112131026502251'),
('example1234@email.com', '122131026502251'),
('example1235@email.com', '132131026502251'),
('example1236@email.com', '142131026502251'),
('example13@email.com', '152131026502251'),
('example3@email.com', '162131026502251'),
('example11123@email.com', '172131026502251'),
('example12003@email.com', '182131026502251'),
('example12113@email.com', '192131026502251'),
('example1@gmail.com', '132213102650225');

`;

    try {
        await User.query(query);
        console.log('Tables created successfully!');
    } catch (error) {
        console.error('Error creating tables:', error);
    }
};

