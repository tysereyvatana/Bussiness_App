-- Creates a custom type for the customer status to ensure data integrity.
-- This means the 'status' column can only contain one of these three values.
CREATE TYPE customer_status AS ENUM ('Active', 'Inactive', 'Lead');

-- Creates the 'customers' table.
-- This table will store all customer information and link each customer
-- to a user in the 'users' table.
CREATE TABLE customers (
    -- 'SERIAL' creates an auto-incrementing integer, perfect for a primary key.
    id SERIAL PRIMARY KEY,

    -- This links to the 'id' column of your 'users' table.
    -- 'ON DELETE CASCADE' means if a user is deleted, all their customers are also deleted.
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Customer's full name. It cannot be empty.
    name VARCHAR(255) NOT NULL,

    -- Customer's email address.
    email VARCHAR(255),

    -- Customer's phone number.
    phone VARCHAR(50),

    -- Customer's physical address. 'TEXT' allows for longer strings.
    address TEXT,

    -- The customer's status, using the custom 'customer_status' type we created.
    -- It defaults to 'Active' if no status is provided.
    status customer_status NOT NULL DEFAULT 'Active',

    -- Timestamp for when the record was created. Defaults to the current time.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Timestamp for when the record was last updated.
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- This constraint ensures that a single user cannot have multiple
    -- customers with the exact same email address.
    CONSTRAINT unique_customer_email_per_user UNIQUE (user_id, email)
);

-- Optional: Create an index on the user_id column for faster lookups
-- of all customers belonging to a specific user.
CREATE INDEX idx_customers_user_id ON customers(user_id);

-- This is a trigger function that will automatically update the 'updated_at'
-- field every time a row is modified.
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attaches the trigger to the 'customers' table. It will fire before
-- any UPDATE operation.
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON customers
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

