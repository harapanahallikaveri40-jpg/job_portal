
const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ================================
// REGISTER
// ================================
exports.register = async (req, res) => {
    try {
        const { name, email, password, phone, role } = req.body;

        if (!name?.trim() || !email?.trim() || !password) {
            return res.status(400).json({
                message: "Name, email and password are required"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must contain at least 6 characters"
            });
        }

        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();
        const userRole = role || "student";

        if (!["student", "recruiter"].includes(userRole)) {
            return res.status(400).json({
                message: "Invalid role"
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(cleanEmail)) {
            return res.status(400).json({
                message: "Enter a valid email address"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = `
            INSERT INTO users (name, email, password, phone, role)
            VALUES (?, ?, ?, ?, ?)
        `;

        db.query(
            sql,
            [
                cleanName,
                cleanEmail,
                hashedPassword,
                phone?.trim() || null,
                userRole
            ],
            (err, result) => {
                if (err) {
                    console.error("Registration error:", err);

                    if (err.code === "ER_DUP_ENTRY") {
                        return res.status(409).json({
                            message: "Email already registered"
                        });
                    }

                    return res.status(500).json({
                        message: "Registration failed"
                    });
                }

                return res.status(201).json({
                    message: "Registration successful",
                    userId: result.insertId
                });
            }
        );

    } catch (error) {
        console.error("Register error:", error);

        return res.status(500).json({
            message: "Server error"
        });
    }
};


// ================================
// LOGIN
// ================================
exports.login = (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password are required"
        });
    }

    db.query(
        "SELECT * FROM users WHERE email = ?",
        [email.trim().toLowerCase()],
        async (err, results) => {
            if (err) {
                console.error("Login database error:", err);

                return res.status(500).json({
                    message: "Database error"
                });
            }

            if (!results.length) {
                return res.status(401).json({
                    message: "Invalid email or password"
                });
            }

            try {
                const user = results[0];

                const isMatch = await bcrypt.compare(
                    password,
                    user.password
                );

                if (!isMatch) {
                    return res.status(401).json({
                        message: "Invalid email or password"
                    });
                }

                const token = jwt.sign(
                    {
                        id: user.id,
                        role: user.role
                    },
                    process.env.JWT_SECRET,
                    { expiresIn: "1d" }
                );

                return res.json({
                    message: "Login successful",
                    token,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        phone: user.phone,
                        role: user.role
                    }
                });

            } catch (error) {
                console.error("Login error:", error);

                return res.status(500).json({
                    message: "Login failed"
                });
            }
        }
    );
};


// ================================
// GET PROFILE
// ================================
exports.getProfile = (req, res) => {
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({
            message: "Invalid user authentication"
        });
    }

    db.query(
        "SELECT id, name, email, phone, role FROM users WHERE id = ?",
        [userId],
        (err, results) => {
            if (err) {
                console.error("Get profile error:", err);

                return res.status(500).json({
                    message: "Failed to fetch profile"
                });
            }

            if (!results.length) {
                return res.status(404).json({
                    message: "User not found"
                });
            }

            return res.status(200).json({
                user: results[0]
            });
        }
    );
};


// ================================
// UPDATE PROFILE
// NAME + EMAIL + PHONE
// ALL ROLES
// ================================
exports.updateProfile = (req, res) => {
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({
            message: "Invalid user authentication"
        });
    }

    const { name, email, phone } = req.body;

    if (
        typeof name !== "string" ||
        typeof email !== "string" ||
        (phone !== undefined && phone !== null && typeof phone !== "string")
    ) {
        return res.status(400).json({
            message: "Invalid profile details"
        });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone?.trim() || null;

    if (cleanName.length < 2 || cleanName.length > 100) {
        return res.status(400).json({
            message: "Name must be between 2 and 100 characters"
        });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
        return res.status(400).json({
            message: "Enter a valid email address"
        });
    }

    // Check whether another account uses this email
    db.query(
        "SELECT id FROM users WHERE email = ? AND id != ?",
        [cleanEmail, userId],
        (checkErr, existingUsers) => {
            if (checkErr) {
                console.error("Email check error:", checkErr);

                return res.status(500).json({
                    message: "Unable to verify email"
                });
            }

            if (existingUsers.length > 0) {
                return res.status(409).json({
                    message: "This email is already used by another account"
                });
            }

            // Update all profile details
            const updateSql = `
                UPDATE users
                SET name = ?, email = ?, phone = ?
                WHERE id = ?
            `;

            db.query(
                updateSql,
                [cleanName, cleanEmail, cleanPhone, userId],
                (updateErr) => {
                    if (updateErr) {
                        console.error("Profile update error:", updateErr);

                        return res.status(500).json({
                            message: "Profile update failed",
                            error: updateErr.code || updateErr.message
                        });
                    }

                    // Get updated profile from database
                    db.query(
                        "SELECT id, name, email, phone, role FROM users WHERE id = ?",
                        [userId],
                        (selectErr, results) => {
                            if (selectErr) {
                                console.error("Updated profile fetch error:", selectErr);

                                return res.status(500).json({
                                    message: "Profile updated but unable to fetch details"
                                });
                            }

                            if (!results.length) {
                                return res.status(404).json({
                                    message: "User not found"
                                });
                            }

                            return res.status(200).json({
                                message: "Profile updated successfully",
                                user: results[0]
                            });
                        }
                    );
                }
            );
        }
    );
};
