-- Creates a custom type for the user roles.
CREATE TYPE user_role AS ENUM ('Admin', 'Manager', 'Staff');

-- Creates a custom type for the user status.
CREATE TYPE user_status AS ENUM ('Active', 'Inactive', 'Pending');

-- Alters the existing 'users' table to add the new columns.
ALTER TABLE users
ADD COLUMN role user_role NOT NULL DEFAULT 'Staff',
ADD COLUMN status user_status NOT NULL DEFAULT 'Active';
