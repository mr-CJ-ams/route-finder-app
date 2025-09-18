// server/models/provincialAdminModel.js

const pool = require("../db");

class ProvincialAdminModel {
  // Model: Get all municipal admins in the same province as the provincial admin
  static async getMunicipalAdmins(region, province) {
    const result = await pool.query(
      `SELECT 
        user_id,
        email,
        password,
        phone_number,
        registered_owner,
        company_name,
        municipality,
        barangay
      FROM users 
      WHERE role = 'admin' 
        AND TRIM(region) ILIKE TRIM($1)
        AND TRIM(province) ILIKE TRIM($2)
        AND is_approved = true
      ORDER BY municipality ASC, barangay ASC`,
      [region, province]
    );
    return result.rows;
  }

  // Model: Check if email already exists
  static async checkEmailExists(email) {
    const result = await pool.query(
      "SELECT user_id FROM users WHERE email = $1",
      [email]
    );
    return result.rows.length > 0;
  }

  // Model: Add new municipal admin
  static async addMunicipalAdmin(userData) {
    const {
      email,
      password,
      phone_number,
      registered_owner,
      company_name,
      municipality,
      barangay,
      region,
      province
    } = userData;

    const result = await pool.query(
      `INSERT INTO users (
        email, password, phone_number, registered_owner, 
        company_name, municipality, barangay, region, province,
        role, is_approved, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'admin', true, true)
      RETURNING user_id`,
      [
        email,
        password,
        phone_number || null,
        registered_owner,
        company_name,
        municipality,
        barangay || null,
        region,
        province
      ]
    );

    return result.rows[0];
  }
}

module.exports = ProvincialAdminModel;