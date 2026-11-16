
const db = require("../config/db");

// Create New Job
exports.createJob = (req, res) => {
    if (req.user.role !== "recruiter") {
        return res.status(403).json({ message: "Only recruiters can post jobs" });
    }

    const {
        title,
        description,
        requirements,
        location,
        job_type,
        salary,
        skills,
        deadline
    } = req.body;

    if (!title || !description || !job_type) {
        return res.status(400).json({
            message: "Title, description and job type are required"
        });
    }

    const companySql = "SELECT id FROM companies WHERE user_id = ?";

    db.query(companySql, [req.user.id], (err, companies) => {
        if (err) return res.status(500).json({ message: err.message });

        if (companies.length === 0) {
            return res.status(400).json({
                message: "Please create your company profile first"
            });
        }

        const companyId = companies[0].id;

        const sql = `
            INSERT INTO jobs
            (company_id, title, description, requirements, location,
             job_type, salary, skills, deadline)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(sql, [
            companyId,
            title,
            description,
            requirements || "",
            location || "",
            job_type,
            salary || "",
            skills || "",
            deadline || null
        ], (err, result) => {
            if (err) return res.status(500).json({ message: err.message });

            res.status(201).json({
                message: "Job posted successfully!",
                jobId: result.insertId
            });
        });
    });
};

// Get All Active Jobs
exports.getAllJobs = (req, res) => {
    const sql = `
        SELECT jobs.*, companies.company_name
        FROM jobs
        JOIN companies ON jobs.company_id = companies.id
        WHERE jobs.status = 'Active'
        ORDER BY jobs.created_at DESC
    `;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(results);
    });
};

// Get Recruiter's Own Jobs
exports.getMyJobs = (req, res) => {
    if (req.user.role !== "recruiter") {
        return res.status(403).json({ message: "Recruiter access only" });
    }

    const sql = `
        SELECT jobs.*, companies.company_name
        FROM jobs
        JOIN companies ON jobs.company_id = companies.id
        WHERE companies.user_id = ?
        ORDER BY jobs.created_at DESC
    `;

    db.query(sql, [req.user.id], (err, results) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(results);
    });
};

// Edit Job
exports.updateJob = (req, res) => {
    if (req.user.role !== "recruiter") {
        return res.status(403).json({ message: "Recruiter access only" });
    }

    const {
        title,
        description,
        requirements,
        location,
        job_type,
        salary,
        skills,
        deadline,
        status
    } = req.body;

    const sql = `
        UPDATE jobs
        JOIN companies ON jobs.company_id = companies.id
        SET title = ?,
            description = ?,
            requirements = ?,
            location = ?,
            job_type = ?,
            salary = ?,
            skills = ?,
            deadline = ?,
            status = ?
        WHERE jobs.id = ? AND companies.user_id = ?
    `;

    db.query(sql, [
        title,
        description,
        requirements || "",
        location || "",
        job_type,
        salary || "",
        skills || "",
        deadline || null,
        status || "Active",
        req.params.id,
        req.user.id
    ], (err, result) => {
        if (err) return res.status(500).json({ message: err.message });

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Job not found" });
        }

        res.json({ message: "Job updated successfully!" });
    });
};

// Delete Job
exports.deleteJob = (req, res) => {
    if (req.user.role !== "recruiter") {
        return res.status(403).json({ message: "Recruiter access only" });
    }

    const sql = `
        DELETE jobs FROM jobs
        JOIN companies ON jobs.company_id = companies.id
        WHERE jobs.id = ? AND companies.user_id = ?
    `;

    db.query(sql, [req.params.id, req.user.id], (err, result) => {
        if (err) return res.status(500).json({ message: err.message });

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Job not found" });
        }

        res.json({ message: "Job deleted successfully!" });
    });
};
