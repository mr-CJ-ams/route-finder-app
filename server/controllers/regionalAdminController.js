// server/controllers/regionalAdminController.js

const RegionalAdminModel = require("../models/regionalAdminModel");

// NEW: Get nationality counts for the region

// Controller: List all provincial admins in the same region
exports.getProvincialAdmins = async (req, res) => {
  try {
    if (req.user.role !== 'r_admin') {
      return res.status(403).json({ error: "Access denied. Regional admin role required." });
    }
    const { region } = req.user;
    const admins = await RegionalAdminModel.getProvincialAdmins(region);
    res.json(admins);
  } catch (err) {
    console.error("Error fetching provincial admins:", err);
    res.status(500).json({ error: "Failed to fetch provincial admins" });
  }
};

// Controller: Get province metrics for the region (for detailed dashboard)
exports.getProvinceMetrics = async (req, res) => {
  try {
    if (req.user.role !== 'r_admin') {
      return res.status(403).json({ error: "Access denied. Regional admin role required." });
    }
    const { region } = req.user;
    let { year, month } = req.query;
    // Validate year and month, set defaults if missing or invalid
    year = parseInt(year);
    month = parseInt(month);
    if (isNaN(year) || year < 2000 || year > 2100) {
      year = new Date().getFullYear();
    }
    if (isNaN(month) || month < 1 || month > 12) {
      month = new Date().getMonth() + 1;
    }
    const metrics = await RegionalAdminModel.getProvinceMetrics(region, year, month);
    res.json(metrics);
  } catch (err) {
    console.error("Error fetching province metrics:", err);
    res.status(500).json({ error: "Failed to fetch province metrics" });
  }
};

// NEW: Get regional overview data with charts and summaries
exports.getRegionalOverview = async (req, res) => {
  try {
    if (req.user.role !== 'r_admin') {
      return res.status(403).json({ error: "Access denied. Regional admin role required." });
    }
    const { region } = req.user;
    const { year, month } = req.query;
    
    const overviewData = await RegionalAdminModel.getRegionalOverview(region, parseInt(year), parseInt(month));
    res.json(overviewData);
  } catch (err) {
    console.error("Error fetching regional overview:", err);
    res.status(500).json({ error: "Failed to fetch regional overview" });
  }
};

// NEW: Get monthly check-ins data for charts
exports.getMonthlyCheckIns = async (req, res) => {
  try {
    if (req.user.role !== 'r_admin') {
      return res.status(403).json({ error: "Access denied. Regional admin role required." });
    }
    const { region } = req.user;
    const { year } = req.query;
    
    const checkInsData = await RegionalAdminModel.getMonthlyCheckIns(region, parseInt(year));
    res.json(checkInsData);
  } catch (err) {
    console.error("Error fetching monthly check-ins:", err);
    res.status(500).json({ error: "Failed to fetch monthly check-ins data" });
  }
};

// NEW: Get nationality counts for the region
exports.getNationalityCounts = async (req, res) => {
  try {
    if (req.user.role !== 'r_admin') {
      return res.status(403).json({ error: "Access denied. Regional admin role required." });
    }
    const { region } = req.user;
    const { year, month } = req.query;
    
    const nationalityData = await RegionalAdminModel.getNationalityCounts(region, parseInt(year), parseInt(month));
    res.json(nationalityData);
  } catch (err) {
    console.error("Error fetching nationality counts:", err);
    res.status(500).json({ error: "Failed to fetch nationality counts" });
  }
};

exports.getMonthlyMetrics = async (req, res) => {
  try {
    if (req.user.role !== 'r_admin') {
      return res.status(403).json({ error: "Access denied. Regional admin role required." });
    }
    const { region } = req.user;
    let { year, province } = req.query;
    
    // Validate year, set defaults if missing or invalid
    year = parseInt(year);
    if (isNaN(year) || year < 2000 || year > 2100) {
      year = new Date().getFullYear();
    }

    const metrics = await RegionalAdminModel.getMonthlyMetrics(region, year, province);
    res.json(metrics);
  } catch (err) {
    console.error("Error fetching monthly metrics:", err);
    res.status(500).json({ error: "Failed to fetch monthly metrics" });
  }
};