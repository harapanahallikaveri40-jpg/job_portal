
const express = require("express");
const router = express.Router();

const { createCompany } = require("../controllers/companyController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, createCompany);

module.exports = router;
