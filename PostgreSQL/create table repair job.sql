-- In PostgreSQL, you first define ENUM types.
CREATE TYPE job_status AS ENUM ('Received', 'In Progress', 'Awaiting Parts', 'Completed', 'Ready for Pickup', 'Closed');
CREATE TYPE payment_status_type AS ENUM ('Unpaid', 'Paid');


-- Second, a table for the repair jobs, which links to the customers table.
CREATE TABLE repair_jobs (
    -- Core Job Information
    job_id SERIAL PRIMARY KEY,               -- A unique ID for every repair job.
    customer_id INT NOT NULL,                -- This links the job to a specific customer in the `customers` table.
    
    -- Status and Assignment
    status job_status DEFAULT 'Received',    -- Uses the custom `job_status` ENUM type defined above.
    assigned_to VARCHAR(100),                -- Name of the person doing the repair.

    -- Item & Repair Details
    item_name VARCHAR(255) NOT NULL,         -- e.g., 'Soccer Cleats', 'Goalkeeper Gloves'.
    item_brand VARCHAR(100),                 -- e.g., 'Adidas', 'Nike', 'Puma'.
    item_notes TEXT,                         -- Any specific details about the item itself.
    work_description TEXT NOT NULL,          -- Detailed notes on the sewing/repair work needed.

    -- Financials
    estimated_cost DECIMAL(10, 2),
    final_cost DECIMAL(10, 2),
    payment_status payment_status_type DEFAULT 'Unpaid', -- Uses the custom `payment_status_type` ENUM.

    -- Timestamps
    date_received TIMESTAMPTZ DEFAULT now(),
    date_due TIMESTAMPTZ,
    date_completed TIMESTAMPTZ,
    
    -- This creates the actual link between the two tables.
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);