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

static async getMunicipalityMetrics(region, province, year, month) {
  const query = `
    WITH municipality_users AS (
      SELECT DISTINCT municipality
      FROM users 
      WHERE role = 'admin' 
        AND TRIM(region) ILIKE TRIM($1)
        AND TRIM(province) ILIKE TRIM($2)
        AND municipality IS NOT NULL
    ),
    user_counts AS (
      SELECT 
        u.municipality,
        COUNT(DISTINCT u2.user_id) as total_users
      FROM municipality_users u
      LEFT JOIN users u2 ON u2.role = 'user' 
        AND TRIM(u2.region) ILIKE TRIM($1)
        AND TRIM(u2.province) ILIKE TRIM($2)
        AND TRIM(u2.municipality) = TRIM(u.municipality)
        AND u2.is_active = true
        AND u2.is_approved = true
      GROUP BY u.municipality
    ),
    submission_data AS (
      SELECT 
        u.municipality,
        COUNT(DISTINCT s.submission_id) as total_submissions,
        COALESCE(SUM(dm.check_ins), 0) as total_check_ins,
        COALESCE(SUM(dm.overnight), 0) as total_overnight,
        COALESCE(SUM(dm.occupied), 0) as total_occupied,
        COALESCE(AVG(s.average_guest_nights), 0) as average_guest_nights,
        COALESCE(AVG(s.average_room_occupancy_rate), 0) as average_room_occupancy_rate,
        COALESCE(AVG(s.average_guests_per_room), 0) as average_guests_per_room
      FROM municipality_users u
      LEFT JOIN users u2 ON u2.role = 'user' 
        AND TRIM(u2.region) ILIKE TRIM($1)
        AND TRIM(u2.province) ILIKE TRIM($2)
        AND TRIM(u2.municipality) = TRIM(u.municipality)
        AND u2.is_active = true
        AND u2.is_approved = true
      LEFT JOIN submissions s ON s.user_id = u2.user_id 
        AND s.year = $3 
        AND s.month = $4
      LEFT JOIN daily_metrics dm ON dm.submission_id = s.submission_id
      GROUP BY u.municipality
    ),
    room_counts AS (
      SELECT
        u.municipality,
        COALESCE(SUM(s.number_of_rooms), 0) as total_rooms
      FROM municipality_users u
      LEFT JOIN users u2 ON u2.role = 'user' 
        AND TRIM(u2.region) ILIKE TRIM($1)
        AND TRIM(u2.province) ILIKE TRIM($2)
        AND TRIM(u2.municipality) = TRIM(u.municipality)
        AND u2.is_active = true
        AND u2.is_approved = true
      LEFT JOIN submissions s ON s.user_id = u2.user_id 
        AND s.year = $3 
        AND s.month = $4
      GROUP BY u.municipality
    )
    SELECT 
      mu.municipality,
      COALESCE(sd.total_check_ins, 0) as total_check_ins,
      COALESCE(sd.total_overnight, 0) as total_overnight,
      COALESCE(sd.total_occupied, 0) as total_occupied,
      COALESCE(sd.average_guest_nights, 0) as average_guest_nights,
      COALESCE(sd.average_room_occupancy_rate, 0) as average_room_occupancy_rate,
      COALESCE(sd.average_guests_per_room, 0) as average_guests_per_room,
      COALESCE(rc.total_rooms, 0) as total_rooms,
      COALESCE(sd.total_submissions, 0) as total_submissions,
      CASE 
        WHEN uc.total_users > 0 THEN 
          (COALESCE(sd.total_submissions, 0) * 100.0 / uc.total_users)
        ELSE 0 
      END as submission_rate
    FROM municipality_users mu
    LEFT JOIN user_counts uc ON uc.municipality = mu.municipality
    LEFT JOIN room_counts rc ON rc.municipality = mu.municipality
    LEFT JOIN submission_data sd ON sd.municipality = mu.municipality
    ORDER BY mu.municipality ASC
  `;

  const result = await pool.query(query, [region, province, year, month]);
  
  // Convert string numbers to actual numbers
  return result.rows.map(row => ({
    ...row,
    total_check_ins: Number(row.total_check_ins),
    total_overnight: Number(row.total_overnight),
    total_occupied: Number(row.total_occupied),
    average_guest_nights: Number(row.average_guest_nights),
    average_room_occupancy_rate: Number(row.average_room_occupancy_rate),
    average_guests_per_room: Number(row.average_guests_per_room),
    total_rooms: Number(row.total_rooms),
    total_submissions: Number(row.total_submissions),
    submission_rate: Number(row.submission_rate)
  }));
}
}

module.exports = ProvincialAdminModel;