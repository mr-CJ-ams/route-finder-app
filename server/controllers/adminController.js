/**
 * adminController.js
 * 
 * Panglao Tourist Data Management System - Admin Controller
 * 
 * =========================
 * Overview:
 * =========================
 * This file contains all controller logic for admin-related operations in the Panglao TDMS backend.
 * It acts as the main interface between HTTP requests (from routes/admin.js) and the database/model layer (models/adminModel.js).
 * 
 * =========================
 * Responsibilities:
 * =========================
 * - User Management: Approve, decline, deactivate users, update accommodation types, and fetch user lists.
 * - Submission Management: Retrieve, filter, and paginate submissions for admin review and reporting.
 * - Analytics & Statistics: Provide endpoints for monthly check-ins, metrics, nationality counts, guest demographics, and more.
 * - Auto-Approval: Get and set the system's auto-approval feature for new user registrations.
 * - Notification: Integrates with the email utility to send notifications on user status changes.
 * 
 * =========================
 * Key Features:
 * =========================
 * - Each exported function is an Express route handler, designed for use with async/await.
 * - All database access is delegated to the AdminModel (models/adminModel.js) for separation of concerns.
 * - Uses middleware for authentication and admin authorization (see middleware/auth.js).
 * - Handles errors gracefully and returns appropriate HTTP status codes and messages.
 * - Supports filtering, searching, and pagination for large data sets.
 * 
 * =========================
 * Typical Usage:
 * =========================
 * - Called by routes defined in routes/admin.js (e.g., /admin/users, /admin/monthly-checkins).
 * - Used by the admin dashboard frontend to display and manage users, submissions, and analytics.
 * 
 * =========================
 * Developer Notes:
 * =========================
 * - All methods are asynchronous and should be used with Express async error handling.
 * - For new admin features, add the controller logic here and expose it via routes/admin.js.
 * - For business logic/data access, use or extend models/adminModel.js.
 * - For email notifications, use the sendEmailNotification utility.
 * 
 * =========================
 * Related Files:
 * =========================
 * - models/adminModel.js      (database queries and business logic)
 * - routes/admin.js           (Express route definitions)
 * - middleware/auth.js        (JWT authentication and admin authorization)
 * - utils/email.js            (email notification utility)
 * 
 * =========================
 * Author: Carlojead Amaquin
 * Date: [2025-08-21]
 */

const AdminModel = require("../models/adminModel");
const { sendEmailNotification } = require("../utils/email");
const db = require("../db"); // Make sure db is imported!

async function getFilterAddress(req) {
  // System admin: use stored admin address
  if (req.user.role === 'admin') {
    return await AdminModel.getAdminAddress(req.user.user_id);
  }

  // Regional admin: region-wide scope, can be filtered by province
  if (req.user.role === 'r_admin') {
    return {
      region: req.user.region,
      province: req.query.province || null, // Use province from query if available
      municipality: null
    };
  }

  // Provincial admin: province-wide scope (no municipality filter)
  if (req.user.role === 'p_admin') {
    return {
      region: req.user.region,
      province: req.user.province,
      municipality: null
    };
  }

  // Default (regular user): use own full address from JWT
  return {
    region: req.user.region,
    province: req.user.province,
    municipality: req.user.municipality
  };
}

// Get all users with role 'user' and matching address to admin
exports.getUsers = async (req, res) => {
  try {
    // const adminId = req.user.user_id;
    const { region, province, municipality } = await getFilterAddress(req);
    const users = await AdminModel.getUsersByAddress(region, province, municipality);
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// Approve User
exports.approveUser = async (req, res) => {
  try {
    const { id } = req.params;
    const email = await AdminModel.getUserEmailById(id);
    if (!email) return res.status(404).json({ success: false, message: "User email not found." });

    const subject = "Your TDMS Account Has Been Approved";
    const message = `
      Dear Valued User,<br><br>
      We are pleased to inform you that your account registration for the Tourism Data Management System (TDMS) has been approved.<br><br>
      You may now log in and access the system using the following link:<br>
      <a href=\"https://tdms-panglao-client.onrender.com\">Login Link</a><br><br>
      If you have any questions or require assistance, please do not hesitate to contact our office.<br><br>
      Thank you for your interest in the TDMS.<br><br>
      Best regards,<br>
      Panglao Tourism Office
    `;
    await sendEmailNotification(email, subject, message);
    await AdminModel.approveUser(id);
    res.json({ success: true, message: "User approved and email sent successfully." });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: "Failed to send email. User not approved." });
  }
};

// Decline User
exports.declineUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { message: declineMessage } = req.body;
    const email = await AdminModel.getUserEmailById(id);
    if (!email) return res.status(404).json({ success: false, message: "User email not found." });

    const subject = "Your TDMS Account Application Status";
    const message = `
      Dear Applicant,<br><br>
      We regret to inform you that your registration for the Tourism Data Management System (TDMS) has not been approved.<br><br>
      <strong>Reason for decline:</strong> ${declineMessage}<br><br>
      If you believe this decision was made in error or if you have any questions, please contact our office for further clarification.<br><br>
      Thank you for your interest in the TDMS.<br><br>
      Sincerely,<br>
      Panglao Tourism Office
    `;
    await sendEmailNotification(email, subject, message);
    await AdminModel.declineUser(id);
    res.json({ success: true, message: "User declined and email sent successfully." });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: "Failed to send email. User not declined." });
  }
};

// Deactivate User
exports.deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await AdminModel.deactivateUser(id);
    if (result === null) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User deactivated successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Update Accommodation Type
exports.updateAccommodation = async (req, res) => {
  try {
    const { id } = req.params;
    const { accommodation_type } = req.body;
    await AdminModel.updateAccommodation(id, accommodation_type);
    res.json({ message: "Accommodation type updated successfully" });
  } catch (err) {
    console.error("Error updating accommodation type:", err);
    res.status(500).json({ error: "Failed to update accommodation type" });
  }
};

// Get submissions with filters, pagination, and search, filtered by admin's address
exports.getSubmissions = async (req, res) => {
  try {
    const {
      page = 1, limit = 20, month, year, status, penaltyStatus, search,
    } = req.query;
    const offset = (page - 1) * limit;
    const adminId = req.user.user_id;
    const { region, province, municipality } = await AdminModel.getAdminAddress(adminId);

    const result = await AdminModel.getSubmissionsWithAddress(
      { month, year, status, penaltyStatus, search, limit, offset },
      { region, province, municipality }
    );

    res.json({
      submissions: result.submissions,
      total: result.total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    console.error("Submissions error:", err);
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
};

// Monthly Check-ins
exports.getMonthlyCheckins = async (req, res) => {
  try {
    const { year, municipality: qMunicipality } = req.query;
    const { region, province, municipality: storedMunicipality } = await getFilterAddress(req);

    // Determine municipality scope
    let municipality = null;
    if (req.user.role === 'admin') {
      // Municipal admin defaults to their own municipality unless a specific one is requested
      municipality = qMunicipality && qMunicipality.toUpperCase() !== 'ALL'
        ? qMunicipality
        : (storedMunicipality || null);
    } else if (req.user.role === 'p_admin') {
      // Provincial admin: allow optional municipality filter within their province
      if (qMunicipality && qMunicipality.toUpperCase() !== 'ALL') {
        const allowed = await AdminModel.getAdminMunicipalities(region, province);
        if (!allowed.includes(qMunicipality)) {
          return res.status(403).json({ error: 'Municipality not permitted' });
        }
        municipality = qMunicipality;
      } else {
        municipality = null; // Province-wide
      }
    } else {
      // Regular users: stick to their own municipality
      municipality = storedMunicipality || req.user.municipality || null;
    }

    const result = await AdminModel.getMonthlyCheckins(year, region, province, municipality);
    res.json(result);
  } catch (err) {
    console.error("Error fetching monthly check-ins:", err);
    res.status(500).json({ error: "Failed to fetch monthly check-ins" });
  }
};

// Monthly Metrics
exports.getMonthlyMetrics = async (req, res) => {
  try {
    const { year, municipality: qMunicipality } = req.query;
    const { region, province, municipality: storedMunicipality } = await getFilterAddress(req);

    let municipality = null;
    if (req.user.role === 'admin') {
      municipality = qMunicipality && qMunicipality.toUpperCase() !== 'ALL'
        ? qMunicipality
        : (storedMunicipality || null);
    } else if (req.user.role === 'p_admin') {
      if (qMunicipality && qMunicipality.toUpperCase() !== 'ALL') {
        const allowed = await AdminModel.getAdminMunicipalities(region, province);
        if (!allowed.includes(qMunicipality)) {
          return res.status(403).json({ error: 'Municipality not permitted' });
        }
        municipality = qMunicipality;
      } else {
        municipality = null;
      }
    } else {
      municipality = storedMunicipality || req.user.municipality || null;
    }

    const { metrics, totalUsers } = await AdminModel.getMonthlyMetrics(
      year,
      region,
      province,
      municipality
    );

    const metricsWithSubmissionRate = metrics.map((row) => ({
      ...row,
      submission_rate: totalUsers > 0 ? ((row.total_submissions / totalUsers) * 100).toFixed(2) : 0,
    }));

    res.json(metricsWithSubmissionRate);
  } catch (err) {
    console.error("Error fetching monthly metrics:", err);
    res.status(500).json({ error: "Failed to fetch monthly metrics" });
  }
};

// Nationality Counts
exports.getNationalityCounts = async (req, res) => {
  try {
    const { year, month, municipality: qMunicipality } = req.query;
    const { region, province, municipality: storedMunicipality } = await getFilterAddress(req);

    let municipality = null;
    if (req.user.role === 'admin') {
      municipality = qMunicipality && qMunicipality.toUpperCase() !== 'ALL'
        ? qMunicipality
        : (storedMunicipality || null);
    } else if (req.user.role === 'p_admin') {
      if (qMunicipality && qMunicipality.toUpperCase() !== 'ALL') {
        const allowed = await AdminModel.getAdminMunicipalities(region, province);
        if (!allowed.includes(qMunicipality)) {
          return res.status(403).json({ error: 'Municipality not permitted' });
        }
        municipality = qMunicipality;
      } else {
        municipality = null;
      }
    } else {
      municipality = storedMunicipality || req.user.municipality || null;
    }

    const result = await AdminModel.getNationalityCounts(year, month, region, province, municipality);
    res.json(result);
  } catch (err) {
    console.error("Error fetching nationality counts:", err);
    res.status(500).json({ error: "Failed to fetch nationality counts" });
  }
};

// Nationality Counts by Establishment
exports.getNationalityCountsByEstablishment = async (req, res) => {
  try {
    const { year, month, municipality: qMunicipality } = req.query;
    const { region, province, municipality: storedMunicipality } = await getFilterAddress(req);
    
    let municipality = null;
    
    // For provincial admins or system admins
    if (req.user.role === 'p_admin' || req.user.role === 'admin') {
      if (qMunicipality && qMunicipality.toUpperCase() !== 'ALL') {
        // For specific municipality, validate it exists in the province
        const allowed = await AdminModel.getAdminMunicipalities(region, province);
        if (!allowed.includes(qMunicipality)) {
          return res.status(403).json({ error: 'Municipality not permitted' });
        }
        municipality = qMunicipality;
      } else {
        // If ALL or no municipality specified, don't filter by municipality
        municipality = null;
      }
    } else {
      // Regular users: use their own municipality
      municipality = storedMunicipality || req.user.municipality || null;
    }

    const result = await AdminModel.getNationalityCountsByEstablishment(
      year, month, region, province, municipality
    );
    res.json(result);
  } catch (err) {
    console.error("Error fetching nationality counts by establishment:", err);
    res.status(500).json({ error: "Failed to fetch nationality counts by establishment" });
  }
};

// Nationality Counts by Municipality (province-wide summary)
exports.getNationalityCountsByMunicipality = async (req, res) => {
  try {
    const { year, month } = req.query;
    if (!(req.user.role === 'p_admin' || req.user.role === 'admin')) {
      return res.status(403).json({ error: 'Insufficient privileges' });
    }
    const { region, province } = await getFilterAddress(req);
    const result = await AdminModel.getNationalityCountsByMunicipality(year, month, region, province);
    res.json(result);
  } catch (err) {
    console.error("Error fetching nationality counts by municipality:", err);
    res.status(500).json({ error: "Failed to fetch nationality counts by municipality" });
  }
};

// Nationality Counts by Municipality (province-wide summary)
exports.getNationalityCountsByMunicipality = async (req, res) => {
  try {
    const { year, month } = req.query;
    if (!(req.user.role === 'p_admin' || req.user.role === 'admin')) {
      return res.status(403).json({ error: 'Insufficient privileges' });
    }
    const { region, province } = await getFilterAddress(req);
    const result = await AdminModel.getNationalityCountsByMunicipality(year, month, region, province);
    res.json(result);
  } catch (err) {
    console.error("Error fetching nationality counts by municipality:", err);
    res.status(500).json({ error: "Failed to fetch nationality counts by municipality" });
  }
};

// Guest Demographics
exports.getGuestDemographics = async (req, res) => {
  try {
    const { year, month, province } = req.query;
    const { region } = req.user;
    let filterProvince = province;
    // For regional admin, treat 'ALL' or empty province as null (region-wide)
    if (req.user.role === 'r_admin') {
      if (!province || province === 'ALL') {
        filterProvince = null;
      }
    }
    // For provincial admin, use their province if not specified
    if (req.user.role === 'p_admin' && !province) {
      filterProvince = req.user.province;
    }
    // For municipal admin, use their municipality
    let municipality = null;
    if (req.user.role === 'admin') {
      municipality = req.user.municipality || null;
    }
    // Call model with correct filters
    const result = await AdminModel.getGuestDemographics(
      year,
      month,
      region,
      filterProvince,
      municipality
    );
    res.json(result);
  } catch (err) {
    console.error("Error fetching guest demographics:", err);
    res.status(500).json({ error: "Failed to fetch guest demographics" });
  }
};

// Get pending users for approval, filtered by admin's address
exports.getPendingUsers = async (req, res) => {
  try {
    const adminId = req.user.user_id;
    const { region, province, municipality } = await AdminModel.getAdminAddress(adminId);
    const users = await AdminModel.getPendingUsersByAddress(region, province, municipality);
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get storage usage statistics
exports.getStorageUsage = async (req, res) => {
  try {
    const adminId = req.user.user_id;
    const { region, province, municipality } = await AdminModel.getAdminAddress(adminId);
    const usage = await AdminModel.getStorageUsage(region, province, municipality);
    res.json(usage);
  } catch (err) {
    console.error("Error fetching storage usage:", err);
    res.status(500).json({ error: "Failed to fetch storage usage" });
  }
};

// Get admin profile
exports.getAdminProfile = async (req, res) => {
  try {
    const adminId = req.user.user_id;
    const result = await db.query(
      `SELECT user_id, email, role, region, province, municipality, company_name FROM users WHERE user_id = $1`,
      [adminId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Admin not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// Municipalities list for province (for p_admin filter)
exports.getAdminMunicipalities = async (req, res) => {
  try {
    const { role, region, province } = req.user;
    if (role !== 'p_admin' && role !== 'admin') {
      return res.status(403).json({ error: "Insufficient privileges" });
    }
    const municipalities = await AdminModel.getAdminMunicipalities(region, province);
    res.json({ municipalities });
  } catch (err) {
    console.error("Error fetching municipalities:", err);
    res.status(500).json({ error: "Failed to fetch municipalities" });
  }
};

// Add this method to get admin contact details by municipality
exports.getAdminContactDetails = async (req, res) => {
  try {
    const { municipality } = req.query;
    
    if (!municipality) {
      return res.status(400).json({ error: "Municipality parameter is required" });
    }
    
    // Get admin details for the specified municipality using the model
    const adminContact = await AdminModel.getAdminContactDetails(municipality);
    
    if (!adminContact) {
      return res.status(404).json({ 
        error: "Admin contact details not found for this municipality" 
      });
    }
    
    res.json(adminContact);
  } catch (err) {
    console.error("Error fetching admin contact details:", err);
    res.status(500).json({ error: "Failed to fetch admin contact details" });
  }
};