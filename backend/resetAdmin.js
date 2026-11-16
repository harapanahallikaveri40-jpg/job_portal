require("dotenv").config();

const bcrypt = require("bcryptjs");
const db = require("./config/db");

async function resetAdmin() {
    const name = "Portal Admin";
    const email = "admin@gmail.com";
    const password = "Admin@12345";

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        db.query(
            `UPDATE users
             SET name = ?, password = ?, role = 'admin'
             WHERE email = ?`,
            [name, hashedPassword, email],
            (err, result) => {
                if (err) {
                    console.log(err.message);
                } else if (result.affectedRows === 0) {
                    console.log("Admin account not found. Create it first.");
                } else {
                    console.log("Admin password reset successfully!");
                }

                db.end();
            }
        );
    } catch (error) {
        console.log(error.message);
        db.end();
    }
}

resetAdmin();