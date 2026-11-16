
const db = require("../config/db");

exports.createCompany = (req, res) => {
    const { company_name, description, website, location } = req.body;
    const userId = req.user.id;

    if (!company_name) {
        return res.status(400).json({
            message: "Company name is required"
        });
    }

    const sql = `
        INSERT INTO companies
        (user_id, company_name, description, website, location)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [userId, company_name, description, website, location],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    message: "Company creation failed",
                    error: err.message
                });
            }

            res.status(201).json({
                message: "Company profile created successfully",
                companyId: result.insertId
            });
        }
    );
};
