
const db = require("../config/db");

// Student applies for a job
exports.applyJob = (req, res) => {
    if (req.user.role !== "student") {
        return res.status(403).json({
            message: "Only students can apply"
        });
    }

    const { job_id, cover_letter } = req.body;

    if (!job_id) {
        return res.status(400).json({
            message: "Job ID is required"
        });
    }

    const resume = req.file
        ? "/uploads/" + req.file.filename
        : null;

    const sql = `
        INSERT INTO applications
        (job_id, student_id, cover_letter, resume)
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        sql,
        [job_id, req.user.id, cover_letter || null, resume],
        (err, result) => {
            if (err) {
                if (err.code === "ER_DUP_ENTRY") {
                    return res.status(409).json({
                        message: "Already applied for this job"
                    });
                }

                return res.status(500).json({
                    message: "Application failed",
                    error: err.message
                });
            }

            res.status(201).json({
                message: "Application submitted successfully",
                applicationId: result.insertId,
                resume
            });
        }
    );
};


// Student views own applications
exports.getMyApplications = (req, res) => {
    if (req.user.role !== "student") {
        return res.status(403).json({
            message: "Only students can view applications"
        });
    }

    const sql = `
        SELECT applications.*, jobs.title, jobs.location,
        jobs.job_type, companies.company_name
        FROM applications
        JOIN jobs ON applications.job_id = jobs.id
        JOIN companies ON jobs.company_id = companies.id
        WHERE applications.student_id = ?
        ORDER BY applications.applied_at DESC
    `;

    db.query(sql, [req.user.id], (err, results) => {
        if (err) {
            return res.status(500).json({
                message: "Unable to fetch applications",
                error: err.message
            });
        }

        res.json(results);
    });
};


// Recruiter views applications
exports.getRecruiterApplications = (req, res) => {
    if (req.user.role !== "recruiter") {
        return res.status(403).json({
            message: "Only recruiters can view applications"
        });
    }

    const sql = `
        SELECT applications.*, users.name AS student_name,
        users.email AS student_email,
        users.phone AS student_phone,
        jobs.title AS job_title
        FROM applications
        JOIN jobs ON applications.job_id = jobs.id
        JOIN companies ON jobs.company_id = companies.id
        JOIN users ON applications.student_id = users.id
        WHERE companies.user_id = ?
        ORDER BY applications.applied_at DESC
    `;

    db.query(sql, [req.user.id], (err, results) => {
        if (err) {
            return res.status(500).json({
                message: "Unable to fetch applications",
                error: err.message
            });
        }

        res.json(results);
    });
};


// Recruiter updates application status
// Automatically sends notification to student
exports.updateApplicationStatus = (req, res) => {
    if (req.user.role !== "recruiter") {
        return res.status(403).json({
            message: "Only recruiters can update status"
        });
    }

    const { status } = req.body;
    const applicationId = req.params.id;
    const recruiterId = req.user.id;

    const allowedStatuses = [
        "Pending",
        "Reviewed",
        "Shortlisted",
        "Rejected",
        "Selected"
    ];

    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
            message: "Invalid status"
        });
    }

    // Update application status only for recruiter's company
    const updateSql = `
        UPDATE applications
        JOIN jobs ON applications.job_id = jobs.id
        JOIN companies ON jobs.company_id = companies.id
        SET applications.status = ?
        WHERE applications.id = ?
        AND companies.user_id = ?
    `;

    db.query(
        updateSql,
        [status, applicationId, recruiterId],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    message: "Status update failed",
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Application not found or not your company's job"
                });
            }

            // Get student details
            const studentSql = `
                SELECT applications.student_id, jobs.title
                FROM applications
                JOIN jobs ON applications.job_id = jobs.id
                WHERE applications.id = ?
            `;

            db.query(
                studentSql,
                [applicationId],
                (err, rows) => {
                    if (err || rows.length === 0) {
                        return res.status(500).json({
                            message: "Status updated but student lookup failed"
                        });
                    }

                    const studentId = rows[0].student_id;
                    const jobTitle = rows[0].title;

                    // Create notification
                    const notificationMessage =
                        `Your application for ${jobTitle} has been updated to ${status}.`;

                    const notificationSql = `
                        INSERT INTO notifications
                        (user_id, message)
                        VALUES (?, ?)
                    `;

                    db.query(
                        notificationSql,
                        [studentId, notificationMessage],
                        (err) => {
                            if (err) {
                                return res.status(500).json({
                                    message: "Status updated but notification creation failed",
                                    error: err.message
                                });
                            }

                            res.json({
                                message: "Application status updated and student notified!",
                                status
                            });
                        }
                    );
                }
            );
        }
    );
};
