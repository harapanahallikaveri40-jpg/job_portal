
require("dotenv").config();

const bcrypt = require("bcryptjs");
const db = require("./config/db");

async function createAdmin() {
    const name = "Portal Admin";
    const email = "admin@gmail.com";
    const password = "Admin@12345";

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        await db.promise().query(
            `INSERT INTO users (name, email, password, role)
             VALUES (?, ?, ?, 'admin')
             ON DUPLICATE KEY UPDATE
             name = VALUES(name),
             password = VALUES(password),
             role = 'admin'`,
            [name, email, hashedPassword]
        );

        console.log("Admin account created/reset successfully!");
        console.log("Email: admin@gmail.com");
        console.log("Password: Admin@12345");

    } catch (error) {
        console.log("Error:", error.message);
    } finally {
        db.end();
    }
}

createAdmin();
