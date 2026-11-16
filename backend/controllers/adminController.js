
const db = require("../config/db");

// Check Admin Role
const checkAdmin = (req, res) => {
    if (req.user.role !== "admin") {
        res.status(403).json({
            message: "Access denied. Admin only."
        });
        return false;
    }
    return true;
};

// Admin Dashboard Statistics
exports.getDashboardStats = async (req, res) => {
    if (!checkAdmin(req, res)) return;

    try {
        const [users] = await db.promise().query(
            "SELECT COUNT(*) AS totalUsers FROM users"
        );

        const [students] = await db.promise().query(
            "SELECT COUNT(*) AS totalStudents FROM users WHERE role = 'student'"
        );

        const [recruiters] = await db.promise().query(
            "SELECT COUNT(*) AS totalRecruiters FROM users WHERE role = 'recruiter'"
        );

        const [jobs] = await db.promise().query(
            "SELECT COUNT(*) AS totalJobs FROM jobs"
        );

        const [companies] = await db.promise().query(
            "SELECT COUNT(*) AS totalCompanies FROM companies"
        );

        res.json({
            totalUsers: users[0].totalUsers,
            totalStudents: students[0].totalStudents,
            totalRecruiters: recruiters[0].totalRecruiters,
            totalJobs: jobs[0].totalJobs,
            totalCompanies: companies[0].totalCompanies
        });

    } catch (error) {
        res.status(500).json({
            message: "Unable to load dashboard statistics",
            error: error.message
        });
    }
};

// View All Users
exports.getAllUsers = (req, res) => {
    if (!checkAdmin(req, res)) return;

    const sql = `
        SELECT id, name, email, phone, role, created_at
        FROM users
        ORDER BY created_at DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({
                message: "Unable to fetch users",
                error: err.message
            });
        }

        res.json(results);
    });
};

// View All Companies
exports.getAllCompanies = (req, res) => {
    if (!checkAdmin(req, res)) return;

    const sql = `
        SELECT companies.*,
        users.name AS recruiter_name,
        users.email AS recruiter_email
        FROM companies
        JOIN users ON companies.user_id = users.id
        ORDER BY companies.created_at DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({
                message: "Unable to fetch companies",
                error: err.message
            });
        }

        res.json(results);
    });
};

// Verify Company
exports.verifyCompany = (req, res) => {
    if (!checkAdmin(req, res)) return;

    const companyId = req.params.id;

    const sql = `
        UPDATE companies
        SET is_verified = TRUE
        WHERE id = ?
    `;

    db.query(sql, [companyId], (err, result) => {
        if (err) {
            return res.status(500).json({
                message: "Company verification failed",
                error: err.message
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Company not found"
            });
        }

        res.json({
            message: "Company verified successfully"
        });
    });
};

// View All Jobs
exports.getAllJobs = (req, res) => {
    if (!checkAdmin(req, res)) return;

    const sql = `
        SELECT jobs.*, companies.company_name
        FROM jobs
        LEFT JOIN companies ON jobs.company_id = companies.id
        ORDER BY jobs.id DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({
                message: "Unable to fetch jobs",
                error: err.message
            });
        }

        res.json(results);
    });
};

// Delete Job
exports.deleteJob = (req, res) => {
    if (!checkAdmin(req, res)) return;

    const jobId = req.params.id;

    db.query(
        "DELETE FROM jobs WHERE id = ?",
        [jobId],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    message: "Unable to delete job",
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Job not found"
                });
            }

            res.json({
                message: "Job deleted successfully"
            });
        }
    );
};
