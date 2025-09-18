// server/controllers/provincialAdminController.js

const ProvincialAdminModel = require("../models/provincialAdminModel");
const bcrypt = require("bcrypt");

// Controller: Get all municipal admins in the same province as the provincial admin
exports.getMunicipalAdmins = async (req, res) => {
  try {
    if (req.user.role !== 'p_admin') {
      return res.status(403).json({ error: "Access denied. Provincial admin role required." });
    }
    const { region, province } = req.user;
    const admins = await ProvincialAdminModel.getMunicipalAdmins(region, province);
    res.json(admins);
  } catch (err) {
    console.error("Error fetching municipal admins:", err);
    res.status(500).json({ error: "Failed to fetch municipal admins" });
  }
};

// Controller: Add new municipal admin
exports.addMunicipalAdmin = async (req, res) => {
  try {
    if (req.user.role !== 'p_admin') {
      return res.status(403).json({ error: "Access denied. Provincial admin role required." });
    }

    const { region, province } = req.user;
    let { email, password, phone_number, registered_owner, company_name, municipality, barangay } = req.body;

    // Validate required fields
    if (!email || !password || !municipality || !company_name || !registered_owner) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Trim and clean all fields
    email = email.trim().toLowerCase();
    municipality = municipality.trim().toUpperCase();
    barangay = barangay ? barangay.trim().toUpperCase() : null;
    company_name = company_name.trim();
    registered_owner = registered_owner.trim();
    phone_number = phone_number ? phone_number.trim() : null;

    // Check if email already exists
    const existingUser = await ProvincialAdminModel.checkEmailExists(email);
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Add new municipal admin
    const newAdmin = await ProvincialAdminModel.addMunicipalAdmin({
      email,
      password: hashedPassword,
      phone_number,
      registered_owner,
      company_name,
      municipality,
      barangay,
      region,
      province
    });

    res.json({ 
      success: true, 
      message: "Municipal administrator added successfully",
      user_id: newAdmin.user_id
    });

  } catch (err) {
    console.error("Error adding municipal admin:", err);
    res.status(500).json({ error: "Failed to add municipal administrator" });
  }
};