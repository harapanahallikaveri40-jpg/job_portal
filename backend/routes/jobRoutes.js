
const express = require("express");
const router = express.Router();

const {
    createJob,
    getAllJobs,
    getMyJobs,
    updateJob,
    deleteJob
} = require("../controllers/jobController");

const authMiddleware = require("../middleware/authMiddleware");

router.get("/", getAllJobs);
router.get("/my", authMiddleware, getMyJobs);
router.post("/", authMiddleware, createJob);
router.put("/:id", authMiddleware, updateJob);
router.delete("/:id", authMiddleware, deleteJob);

module.exports = router;
