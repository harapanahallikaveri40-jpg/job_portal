
const db = require("../config/db");

// Get Student Notifications
const getNotifications = (req, res) => {
    const userId = req.user.id;

    const sql = `
        SELECT * FROM notifications
        WHERE user_id = ?
        ORDER BY created_at DESC
    `;

    db.query(sql, [userId], (err, results) => {
        if (err) {
            return res.status(500).json({
                message: "Unable to get notifications"
            });
        }

        res.json(results);
    });
};

// Mark Notification as Read
const markAsRead = (req, res) => {
    const notificationId = req.params.id;
    const userId = req.user.id;

    const sql = `
        UPDATE notifications
        SET is_read = TRUE
        WHERE id = ? AND user_id = ?
    `;

    db.query(sql, [notificationId, userId], (err, result) => {
        if (err) {
            return res.status(500).json({
                message: "Unable to update notification"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Notification not found"
            });
        }

        res.json({
            message: "Notification marked as read"
        });
    });
};

module.exports = {
    getNotifications,
    markAsRead
};
