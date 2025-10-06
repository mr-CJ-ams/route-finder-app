// server/routes/provincialAdmin.js

const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const provincialAdminController = require("../controllers/provincialAdminController");

// Provincial Admin Routes
router.get("/municipal-admins", authenticateToken, provincialAdminController.getMunicipalAdmins);
router.post("/add-municipal-admin", authenticateToken, provincialAdminController.addMunicipalAdmin);
router.get("/municipality-metrics", authenticateToken, provincialAdminController.getMunicipalityMetrics);

// Regional Admin Routes
const regionalAdminController = require("../controllers/regionalAdminController");

// Provincial admins management
router.get("/regional/provincial-admins", authenticateToken, regionalAdminController.getProvincialAdmins);

// Dashboard data
router.get("/regional/province-metrics", authenticateToken, regionalAdminController.getProvinceMetrics);
router.get("/regional/monthly-metrics", authenticateToken, regionalAdminController.getMonthlyMetrics); // ADD THIS LINE
router.get("/regional/overview", authenticateToken, regionalAdminController.getRegionalOverview);
router.get("/regional/monthly-checkins", authenticateToken, regionalAdminController.getMonthlyCheckIns);
router.get("/regional/nationality-counts", authenticateToken, regionalAdminController.getNationalityCounts);


module.exports = router;