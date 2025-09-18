// server/routes/provincialAdmin.js

const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const provincialAdminController = require("../controllers/provincialAdminController");

// Route: Get all municipal admins in the same province as the provincial admin
router.get("/municipal-admins", authenticateToken, provincialAdminController.getMunicipalAdmins);

// Route: Add new municipal admin
router.post("/add-municipal-admin", authenticateToken, provincialAdminController.addMunicipalAdmin);

module.exports = router;