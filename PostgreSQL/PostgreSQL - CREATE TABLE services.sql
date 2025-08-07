-- Creates a custom type for the service status.
CREATE TYPE service_status AS ENUM ('Active', 'Inactive');

-- Creates the 'services' table to store all service information.
-- Each service is linked to the user who created it.
CREATE TABLE services (
    -- Auto-incrementing primary key.
    id SERIAL PRIMARY KEY,

    -- Links to the 'users' table. Deletes services if the user is deleted.
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- The name of the service (e.g., "Web Design"). Cannot be empty.
    name VARCHAR(255) NOT NULL,

    -- A detailed description of the service.
    description TEXT,

    -- The price of the service. NUMERIC is best for currency.
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,

    -- The status of the service, using the custom 'service_status' type.
    status service_status NOT NULL DEFAULT 'Active',

    -- Timestamps for creation and last update.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optional: Index on user_id for faster lookups.
CREATE INDEX idx_services_user_id ON services(user_id);

-- Re-use the existing trigger function to automatically update the 'updated_at' field.
-- You only need to create the function once per database.
CREATE TRIGGER set_timestamp_services
BEFORE UPDATE ON services
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();
