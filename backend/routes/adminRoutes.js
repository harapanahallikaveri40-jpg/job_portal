
const express = require("express");
const router = express.Router();

const {
    getDashboardStats,
    getAllUsers,
    getAllCompanies,
    verifyCompany,
    getAllJobs,
    deleteJob
} = require("../controllers/adminController");

const authMiddleware = require("../middleware/authMiddleware");

router.get("/stats", authMiddleware, getDashboardStats);
router.get("/users", authMiddleware, getAllUsers);
router.get("/companies", authMiddleware, getAllCompanies);
router.put("/companies/:id/verify", authMiddleware, verifyCompany);

router.get("/jobs", authMiddleware, getAllJobs);
router.delete("/jobs/:id", authMiddleware, deleteJob);

module.exports = router;
