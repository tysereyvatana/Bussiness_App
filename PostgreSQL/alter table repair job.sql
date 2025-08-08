-- Step 1: Add a service_id column to the repair_jobs table.
-- This column will link a repair job to a specific service from the 'services' table.
-- It's set to NULLABLE for now to handle existing data, but new jobs should have a service.
ALTER TABLE repair_jobs
ADD COLUMN service_id INTEGER REFERENCES services(id) ON DELETE SET NULL;

-- Step 2 (Optional but Recommended): Create a junction table for multiple services per job.
-- This table allows a single repair job to be associated with many different services.
CREATE TABLE job_services (
    job_id INTEGER NOT NULL REFERENCES repair_jobs(job_id) ON DELETE CASCADE,
    service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    PRIMARY KEY (job_id, service_id) -- Ensures a service can't be added to the same job twice.
);
