const db = require("../config/db");

exports.saveJob = (req, res) => {
    const studentId = req.user.id;
    const { job_id } = req.body;

    const sql = "INSERT INTO saved_jobs (student_id, job_id) VALUES (?, ?)";

    db.query(sql, [studentId, job_id], (err, result) => {
        if (err) {
            if (err.code === "ER_DUP_ENTRY") {
                return res.status(400).json({ message: "Job already saved" });
            }
            return res.status(500).json({ message: err.message });
        }

        res.json({ message: "Job saved successfully!" });
    });
};

exports.getSavedJobs = (req, res) => {
    const sql = `
        SELECT saved_jobs.id, jobs.id AS job_id, jobs.title,
        jobs.description, jobs.location, jobs.job_type,
        jobs.salary, companies.company_name
        FROM saved_jobs
        JOIN jobs ON saved_jobs.job_id = jobs.id
        JOIN companies ON jobs.company_id = companies.id
        WHERE saved_jobs.student_id = ?
    `;

    db.query(sql, [req.user.id], (err, results) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(results);
    });
};

exports.removeSavedJob = (req, res) => {
    const sql = "DELETE FROM saved_jobs WHERE id = ? AND student_id = ?";

    db.query(sql, [req.params.id, req.user.id], (err, result) => {
        if (err) return res.status(500).json({ message: err.message });

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Saved job not found" });
        }

        res.json({ message: "Saved job removed successfully!" });
    });
};