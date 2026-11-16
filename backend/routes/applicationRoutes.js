
const express = require("express");
const router = express.Router();

const {
    applyJob,
    getMyApplications,
    getRecruiterApplications,
    updateApplicationStatus
} = require("../controllers/applicationController");

const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

router.post("/", authMiddleware, upload.single("resume"), applyJob);

router.get("/my", authMiddleware, getMyApplications);
router.get("/recruiter", authMiddleware, getRecruiterApplications);
router.put("/:id/status", authMiddleware, updateApplicationStatus);

module.exports = router;
