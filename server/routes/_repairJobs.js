const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Helper function to log user activities.
const logActivity = async (req, action_type, details) => {
    const { db, io, user } = req;
    try {
        const userResult = await db.query('SELECT username FROM users WHERE id = $1', [user.id]);
        const username = userResult.rows[0]?.username || 'Unknown User';
        await db.query(
            'INSERT INTO activities (user_id, username, action_type, details) VALUES ($1, $2, $3, $4)',
            [user.id, username, action_type, details]
        );
        io.emit('activity_updated');
    } catch (err) {
        console.error('Failed to log activity:', err.message);
    }
};

// Helper function to notify clients of data changes.
const notifyClientsOfUpdate = (req) => {
    if (req.io) {
        req.io.emit('repair_jobs_updated');
        console.log("Emitted 'repair_jobs_updated' event to all clients.");
    }
};

// @route   GET api/repair-jobs
// @desc    Get all repair jobs with search and customer info
// --- THIS ROUTE HAS BEEN REVERTED TO A SINGLE-ITEM-PER-JOB STRUCTURE ---
router.get('/', auth, async (req, res) => {
    const { db } = req;
    const { search } = req.query;
    try {
        const baseQuery = `
            FROM (
                SELECT
                    rj.*,
                    c.name as customer_name,
                    (SELECT ARRAY_AGG(js.service_id) FROM job_services js WHERE js.job_id = rj.job_id) as service_ids,
                    (
                        SELECT STRING_AGG(s.name, ', ')
                        FROM job_services js
                        JOIN services s ON s.id = js.service_id
                        WHERE js.job_id = rj.job_id
                    ) as services_list
                FROM repair_jobs rj
                LEFT JOIN customers c ON rj.customer_id = c.id
            ) as all_jobs
        `;

        const values = [];
        let whereClause = '';
        if (search) {
            whereClause = ` WHERE customer_name ILIKE $1`;
            values.push(`%${search}%`);
        }

        const totalQuery = `SELECT COUNT(*) ${baseQuery} ${whereClause}`;
        const totalResult = await db.query(totalQuery, values);
        const total = parseInt(totalResult.rows[0].count, 10);

        const dataQuery = `SELECT * ${baseQuery} ${whereClause} ORDER BY date_received DESC;`;
        const { rows } = await db.query(dataQuery, values);

        const jobs = rows.map(row => {
            row.service_ids = row.service_ids || [];
            return row;
        });

        res.json({ jobs, total });
    } catch (err) {
        console.error('Error fetching repair jobs:', err.message);
        res.status(500).send('Server Error');
    }
});


// @route   POST api/repair-jobs
// @desc    Create a new repair job and link its services
// --- THIS ROUTE HAS BEEN REVERTED TO A SINGLE-ITEM-PER-JOB STRUCTURE ---
router.post('/', auth, async (req, res) => {
    const { db } = req;
    let {
        customer_id,
        status,
        assigned_to,
        item_name,
        item_brand,
        item_notes,
        work_description,
        estimated_cost,
        final_cost,
        payment_status,
        date_due,
        date_completed,
        service_ids
    } = req.body;

    date_due = date_due || null;
    date_completed = date_completed || null;

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        const jobQueryText = `
            INSERT INTO repair_jobs (
                customer_id, status, assigned_to, item_name, item_brand, item_notes,
                work_description, estimated_cost, final_cost, payment_status,
                date_due, date_completed, user_id
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING job_id;
        `;
        const jobValues = [
            customer_id, status, assigned_to, item_name, item_brand, item_notes,
            work_description, estimated_cost, final_cost, payment_status,
            date_due, date_completed, req.user.id
        ];
        const jobResult = await client.query(jobQueryText, jobValues);
        const newJobId = jobResult.rows[0].job_id;

        if (service_ids && Array.isArray(service_ids) && service_ids.length > 0) {
            const serviceQueryText = 'INSERT INTO job_services (job_id, service_id) VALUES ($1, $2)';
            for (const service_id of service_ids) {
                const serviceId = parseInt(service_id, 10);
                if (!isNaN(serviceId) && serviceId > 0) {
                    await client.query(serviceQueryText, [newJobId, serviceId]);
                }
            }
        }

        await client.query('COMMIT');

        logActivity(req, 'create_repair_job', `Created new repair job #${newJobId} for item: ${item_name}`);
        notifyClientsOfUpdate(req);
        res.status(201).json({ job_id: newJobId });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error creating repair job:', err.message);
        res.status(500).send('Server Error');
    } finally {
        client.release();
    }
});


// @route   PUT api/repair-jobs/:id
// @desc    Update a repair job
// --- THIS ROUTE HAS BEEN REVERTED TO A SINGLE-ITEM-PER-JOB STRUCTURE ---
router.put('/:id', auth, async (req, res) => {
    const { db } = req;
    let {
        customer_id, status, assigned_to, item_name, item_brand, item_notes,
        work_description, estimated_cost, final_cost, payment_status, date_due, date_completed, service_ids
    } = req.body;

    date_due = date_due || null;
    date_completed = date_completed || null;

    const jobId = parseInt(req.params.id, 10);
    if (isNaN(jobId)) {
        return res.status(400).json({ msg: 'Invalid job ID format.' });
    }

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        const jobQueryText = `
            UPDATE repair_jobs
            SET customer_id = $1, status = $2, assigned_to = $3, item_name = $4, item_brand = $5, item_notes = $6,
                work_description = $7, estimated_cost = $8, final_cost = $9, payment_status = $10, date_due = $11, date_completed = $12
            WHERE job_id = $13 AND user_id = $14
            RETURNING *;
        `;
        const jobValues = [
            customer_id, status, assigned_to, item_name, item_brand, item_notes,
            work_description, estimated_cost, final_cost, payment_status, date_due, date_completed, jobId, req.user.id
        ];
        const { rows } = await client.query(jobQueryText, jobValues);

        if (rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ msg: 'Job not found or user not authorized.' });
        }

        await client.query('DELETE FROM job_services WHERE job_id = $1', [jobId]);
        if (service_ids && Array.isArray(service_ids) && service_ids.length > 0) {
            const serviceQueryText = 'INSERT INTO job_services (job_id, service_id) VALUES ($1, $2)';
            for (const id of service_ids) {
                const serviceId = parseInt(id, 10);
                if (!isNaN(serviceId) && serviceId > 0) {
                    await client.query(serviceQueryText, [jobId, serviceId]);
                }
            }
        }

        await client.query('COMMIT');

        logActivity(req, 'update_repair_job', `Updated repair job #${jobId} for item: ${item_name}`);
        notifyClientsOfUpdate(req);
        res.json(rows[0]);

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error updating repair job:', err.message);
        res.status(500).send('Server Error');
    } finally {
        client.release();
    }
});

// @route   DELETE api/repair-jobs/:id
// @desc    Delete a repair job
router.delete('/:id', auth, async (req, res) => {
    const { db } = req;

    const jobId = parseInt(req.params.id, 10);
    if (isNaN(jobId)) {
        return res.status(400).json({ msg: 'Invalid job ID format.' });
    }

    try {
        const jobResult = await db.query('SELECT item_name FROM repair_jobs WHERE job_id = $1 AND user_id = $2', [jobId, req.user.id]);
        if (jobResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Job not found or user not authorized.' });
        }
        const itemName = jobResult.rows[0].item_name;

        const deleteQuery = `DELETE FROM repair_jobs WHERE job_id = $1 AND user_id = $2;`;
        const result = await db.query(deleteQuery, [jobId, req.user.id]);

        if (result.rowCount > 0) {
            logActivity(req, 'delete_repair_job', `Deleted repair job for item: ${itemName}`);
            notifyClientsOfUpdate(req);
            res.json({ msg: 'Repair job removed' });
        } else {
            res.status(404).json({ msg: 'Job not found or user not authorized.' });
        }
    } catch (err) {
        console.error('Error deleting repair job:', err.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router;
