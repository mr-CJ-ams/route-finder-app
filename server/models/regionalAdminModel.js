// server/models/regionalAdminModel.js

const pool = require("../db");

class RegionalAdminModel {
  // List all provincial admins in the region
  static async getProvincialAdmins(region) {
    const result = await pool.query(
      `SELECT 
        user_id,
        email,
        province,
        company_name,
        phone_number
      FROM users 
      WHERE role = 'p_admin' 
        AND TRIM(region) ILIKE TRIM($1)
        AND is_approved = true
        AND is_active = true
      ORDER BY province ASC, company_name ASC`,
      [region]
    );
    return result.rows;
  }

  // Province metrics for the region - FIXED VERSION (using submissions for room count)
  static async getProvinceMetrics(region, year, month) {
    const query = `
      -- Get all provinces that belong to this region through provincial admins
      WITH region_provinces AS (
        SELECT DISTINCT TRIM(province) as province
        FROM users 
        WHERE role = 'p_admin' 
          AND TRIM(region) ILIKE TRIM($1)
          AND province IS NOT NULL 
          AND province != ''
          AND is_approved = true
          AND is_active = true
      ),
      -- Count total users per province in this region
      user_counts AS (
        SELECT 
          rp.province,
          COUNT(DISTINCT u.user_id) as total_users
        FROM region_provinces rp
        LEFT JOIN users u ON u.role = 'user' 
          AND TRIM(u.region) ILIKE TRIM($1)
          AND TRIM(u.province) = rp.province
          AND u.is_active = true
          AND u.is_approved = true
        GROUP BY rp.province
      ),
      -- Get submission data for the specified month/year
      submission_data AS (
        SELECT 
          rp.province,
          COUNT(DISTINCT s.submission_id) as total_submissions,
          COALESCE(SUM(dm.check_ins), 0) as total_check_ins,
          COALESCE(SUM(dm.overnight), 0) as total_overnight,
          COALESCE(SUM(dm.occupied), 0) as total_occupied,
          COALESCE(AVG(s.average_guest_nights), 0) as average_guest_nights,
          COALESCE(AVG(s.average_room_occupancy_rate), 0) as average_room_occupancy_rate,
          COALESCE(AVG(s.average_guests_per_room), 0) as average_guests_per_room
        FROM region_provinces rp
        LEFT JOIN users u ON u.role = 'user' 
          AND TRIM(u.region) ILIKE TRIM($1)
          AND TRIM(u.province) = rp.province
          AND u.is_active = true
          AND u.is_approved = true
        LEFT JOIN submissions s ON s.user_id = u.user_id 
          AND s.year = $2 
          AND s.month = $3
        LEFT JOIN daily_metrics dm ON dm.submission_id = s.submission_id
        GROUP BY rp.province
      ),
      -- FIXED: Count total rooms from submissions (not from users table)
      room_counts AS (
        SELECT
          rp.province,
          COALESCE(SUM(s.number_of_rooms), 0) as total_rooms
        FROM region_provinces rp
        LEFT JOIN users u ON u.role = 'user' 
          AND TRIM(u.region) ILIKE TRIM($1)
          AND TRIM(u.province) = rp.province
          AND u.is_active = true
          AND u.is_approved = true
        LEFT JOIN submissions s ON s.user_id = u.user_id 
          AND s.year = $2 
          AND s.month = $3
        GROUP BY rp.province
      )
      -- Final result combining all data
      SELECT 
        rp.province,
        COALESCE(uc.total_users, 0) as total_users,
        COALESCE(rc.total_rooms, 0) as total_rooms,
        COALESCE(sd.total_submissions, 0) as total_submissions,
        COALESCE(sd.total_check_ins, 0) as total_check_ins,
        COALESCE(sd.total_overnight, 0) as total_overnight,
        COALESCE(sd.total_occupied, 0) as total_occupied,
        COALESCE(sd.average_guest_nights, 0) as average_guest_nights,
        COALESCE(sd.average_room_occupancy_rate, 0) as average_room_occupancy_rate,
        COALESCE(sd.average_guests_per_room, 0) as average_guests_per_room,
        CASE 
          WHEN uc.total_users > 0 THEN 
            (COALESCE(sd.total_submissions, 0) * 100.0 / uc.total_users)
          ELSE 0 
        END as submission_rate
      FROM region_provinces rp
      LEFT JOIN user_counts uc ON uc.province = rp.province
      LEFT JOIN room_counts rc ON rc.province = rp.province
      LEFT JOIN submission_data sd ON sd.province = rp.province
      ORDER BY rp.province ASC
    `;

    try {
      const result = await pool.query(query, [region, year, month]);
      
      return result.rows.map(row => ({
        province: row.province,
        total_rooms: Number(row.total_rooms),
        total_submissions: Number(row.total_submissions),
        submission_rate: Number(row.submission_rate),
        total_check_ins: Number(row.total_check_ins),
        total_overnight: Number(row.total_overnight),
        total_occupied: Number(row.total_occupied),
        average_guest_nights: Number(row.average_guest_nights),
        average_room_occupancy_rate: Number(row.average_room_occupancy_rate),
        average_guests_per_room: Number(row.average_guests_per_room)
      }));
    } catch (error) {
      console.error("Database error in getProvinceMetrics:", error);
      throw error;
    }
  }

  // FIXED: Get regional overview data (using submissions for room count)
  static async getRegionalOverview(region, year, month) {
    const query = `
      WITH region_provinces AS (
        SELECT DISTINCT TRIM(province) as province
        FROM users 
        WHERE role = 'p_admin' 
          AND TRIM(region) ILIKE TRIM($1)
          AND province IS NOT NULL
      ),
      regional_totals AS (
        SELECT 
          COUNT(DISTINCT u.user_id) as total_users,
          COUNT(DISTINCT pa.province) as total_provinces,
          -- FIXED: Count rooms from submissions, not users table
          COALESCE(SUM(s.number_of_rooms), 0) as total_rooms,
          COUNT(DISTINCT s.submission_id) as total_submissions,
          COALESCE(SUM(dm.check_ins), 0) as total_check_ins,
          COALESCE(SUM(dm.overnight), 0) as total_overnight,
          COALESCE(SUM(dm.occupied), 0) as total_occupied
        FROM region_provinces rp
        LEFT JOIN users u ON u.role = 'user' 
          AND TRIM(u.region) ILIKE TRIM($1)
          AND TRIM(u.province) = rp.province
          AND u.is_active = true
          AND u.is_approved = true
        LEFT JOIN submissions s ON s.user_id = u.user_id 
          AND s.year = $2 
          AND s.month = $3
        LEFT JOIN daily_metrics dm ON dm.submission_id = s.submission_id
      ),
      province_metrics AS (
        SELECT 
          rp.province,
          COUNT(DISTINCT s.submission_id) as submissions,
          COUNT(DISTINCT u.user_id) as users,
          CASE 
            WHEN COUNT(DISTINCT u.user_id) > 0 THEN 
              (COUNT(DISTINCT s.submission_id) * 100.0 / COUNT(DISTINCT u.user_id))
            ELSE 0 
          END as submission_rate
        FROM region_provinces rp
        LEFT JOIN users u ON u.role = 'user' 
          AND TRIM(u.region) ILIKE TRIM($1)
          AND TRIM(u.province) = rp.province
          AND u.is_active = true
          AND u.is_approved = true
        LEFT JOIN submissions s ON s.user_id = u.user_id 
          AND s.year = $2 
          AND s.month = $3
        GROUP BY rp.province
      )
      SELECT 
        rt.total_users,
        rt.total_provinces,
        rt.total_rooms,
        rt.total_submissions,
        rt.total_check_ins,
        rt.total_overnight,
        rt.total_occupied,
        CASE 
          WHEN rt.total_users > 0 THEN 
            (rt.total_submissions * 100.0 / rt.total_users)
          ELSE 0 
        END as overall_submission_rate,
        COALESCE(AVG(pm.submission_rate), 0) as avg_province_submission_rate,
        (
          SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'province', pm.province,
              'submission_rate', pm.submission_rate,
              'submissions', pm.submissions,
              'users', pm.users
            )
          )
          FROM province_metrics pm
        ) as province_breakdown
      FROM regional_totals rt, province_metrics pm
      GROUP BY 
        rt.total_users, rt.total_provinces, rt.total_rooms, 
        rt.total_submissions, rt.total_check_ins, rt.total_overnight, 
        rt.total_occupied
    `;

    const result = await pool.query(query, [region, year, month]);
    return result.rows[0] || {};
  }

  // NEW: Get monthly check-ins for charts (supports province filter, uses latest submission per user per month)
  static async getMonthlyCheckIns(region, year, province = null) {
    let query, params;
    if (province) {
      query = `
        WITH months AS (
          SELECT generate_series(1, 12) as month
        ), latest_submissions AS (
          SELECT s.*
          FROM submissions s
          JOIN users u ON u.user_id = s.user_id
          WHERE s.year = $2
            AND TRIM(u.region) ILIKE TRIM($1)
            AND TRIM(u.province) ILIKE TRIM($3)
            AND u.role = 'user'
            AND u.is_approved = true
            AND u.is_active = true
            AND s.submitted_at = (
              SELECT MAX(s2.submitted_at)
              FROM submissions s2
              WHERE s2.user_id = s.user_id AND s2.year = s.year AND s2.month = s.month
            )
        )
        SELECT m.month,
          COALESCE(SUM(dm.check_ins), 0) as total_check_ins
        FROM months m
        LEFT JOIN latest_submissions ls ON ls.month = m.month
        LEFT JOIN daily_metrics dm ON dm.submission_id = ls.submission_id
        GROUP BY m.month
        ORDER BY m.month
      `;
      params = [region, year, province];
    } else {
      query = `
        WITH months AS (
          SELECT generate_series(1, 12) as month
        ), latest_submissions AS (
          SELECT s.*
          FROM submissions s
          JOIN users u ON u.user_id = s.user_id
          WHERE s.year = $2
            AND TRIM(u.region) ILIKE TRIM($1)
            AND u.role = 'user'
            AND u.is_approved = true
            AND u.is_active = true
            AND s.submitted_at = (
              SELECT MAX(s2.submitted_at)
              FROM submissions s2
              WHERE s2.user_id = s.user_id AND s2.year = s.year AND s2.month = s.month
            )
        )
        SELECT m.month,
          COALESCE(SUM(dm.check_ins), 0) as total_check_ins
        FROM months m
        LEFT JOIN latest_submissions ls ON ls.month = m.month
        LEFT JOIN daily_metrics dm ON dm.submission_id = ls.submission_id
        GROUP BY m.month
        ORDER BY m.month
      `;
      params = [region, year];
    }
    const result = await pool.query(query, params);
    return result.rows;
  }

  // NEW: Get nationality counts for the region
  static async getNationalityCounts(region, year, month) {
    const query = `
      SELECT 
        g.nationality,
        COUNT(*) as count
      FROM guests g
      JOIN daily_metrics dm ON dm.metric_id = g.metric_id
      JOIN submissions s ON s.submission_id = dm.submission_id
      JOIN users u ON u.user_id = s.user_id
      WHERE TRIM(u.region) ILIKE TRIM($1)
        AND s.year = $2
        AND s.month = $3
        AND u.role = 'user'
        AND u.is_active = true
        AND u.is_approved = true
      GROUP BY g.nationality
      ORDER BY count DESC
      LIMIT 20
    `;

    const result = await pool.query(query, [region, year, month]);
    return result.rows;
  }

  // NEW: Get monthly metrics for the region (aggregated by month)
  static async getMonthlyMetrics(region, year, province = null) {
    let query, params;

    if (province && province !== "ALL") {
      // Filter by specific province
      query = `
        WITH months AS (
          SELECT generate_series(1, 12) as month
        ),
        monthly_data AS (
          SELECT 
            s.month,
            COUNT(DISTINCT s.submission_id) as total_submissions,
            COALESCE(SUM(dm.check_ins), 0) as total_check_ins,
            COALESCE(SUM(dm.overnight), 0) as total_overnight,
            COALESCE(SUM(dm.occupied), 0) as total_occupied,
            COALESCE(AVG(s.average_guest_nights), 0) as average_guest_nights,
            COALESCE(AVG(s.average_room_occupancy_rate), 0) as average_room_occupancy_rate,
            COALESCE(AVG(s.average_guests_per_room), 0) as average_guests_per_room,
            COALESCE(SUM(s.number_of_rooms), 0) as total_rooms
          FROM submissions s
          JOIN users u ON u.user_id = s.user_id
          LEFT JOIN daily_metrics dm ON dm.submission_id = s.submission_id
          WHERE s.year = $2
            AND TRIM(u.region) ILIKE TRIM($1)
            AND TRIM(u.province) ILIKE TRIM($3)
            AND u.role = 'user'
            AND u.is_active = true
            AND u.is_approved = true
          GROUP BY s.month
        ),
        user_counts AS (
          SELECT 
            COUNT(DISTINCT u.user_id) as total_users
          FROM users u
          WHERE TRIM(u.region) ILIKE TRIM($1)
            AND TRIM(u.province) ILIKE TRIM($3)
            AND u.role = 'user'
            AND u.is_active = true
            AND u.is_approved = true
        )
        SELECT 
          m.month,
          COALESCE(md.total_check_ins, 0) as total_check_ins,
          COALESCE(md.total_overnight, 0) as total_overnight,
          COALESCE(md.total_occupied, 0) as total_occupied,
          COALESCE(md.average_guest_nights, 0) as average_guest_nights,
          COALESCE(md.average_room_occupancy_rate, 0) as average_room_occupancy_rate,
          COALESCE(md.average_guests_per_room, 0) as average_guests_per_room,
          COALESCE(md.total_rooms, 0) as total_rooms,
          COALESCE(md.total_submissions, 0) as total_submissions,
          CASE 
            WHEN uc.total_users > 0 THEN 
              (COALESCE(md.total_submissions, 0) * 100.0 / uc.total_users)
            ELSE 0 
          END as submission_rate
        FROM months m
        LEFT JOIN monthly_data md ON md.month = m.month
        CROSS JOIN user_counts uc
        ORDER BY m.month
      `;
      params = [region, year, province];
    } else {
      // All provinces in the region
      query = `
        WITH months AS (
          SELECT generate_series(1, 12) as month
        ),
        monthly_data AS (
          SELECT 
            s.month,
            COUNT(DISTINCT s.submission_id) as total_submissions,
            COALESCE(SUM(dm.check_ins), 0) as total_check_ins,
            COALESCE(SUM(dm.overnight), 0) as total_overnight,
            COALESCE(SUM(dm.occupied), 0) as total_occupied,
            COALESCE(AVG(s.average_guest_nights), 0) as average_guest_nights,
            COALESCE(AVG(s.average_room_occupancy_rate), 0) as average_room_occupancy_rate,
            COALESCE(AVG(s.average_guests_per_room), 0) as average_guests_per_room,
            COALESCE(SUM(s.number_of_rooms), 0) as total_rooms
          FROM submissions s
          JOIN users u ON u.user_id = s.user_id
          LEFT JOIN daily_metrics dm ON dm.submission_id = s.submission_id
          WHERE s.year = $2
            AND TRIM(u.region) ILIKE TRIM($1)
            AND u.role = 'user'
            AND u.is_active = true
            AND u.is_approved = true
          GROUP BY s.month
        ),
        user_counts AS (
          SELECT 
            COUNT(DISTINCT u.user_id) as total_users
          FROM users u
          WHERE TRIM(u.region) ILIKE TRIM($1)
            AND u.role = 'user'
            AND u.is_active = true
            AND u.is_approved = true
        )
        SELECT 
          m.month,
          COALESCE(md.total_check_ins, 0) as total_check_ins,
          COALESCE(md.total_overnight, 0) as total_overnight,
          COALESCE(md.total_occupied, 0) as total_occupied,
          COALESCE(md.average_guest_nights, 0) as average_guest_nights,
          COALESCE(md.average_room_occupancy_rate, 0) as average_room_occupancy_rate,
          COALESCE(md.average_guests_per_room, 0) as average_guests_per_room,
          COALESCE(md.total_rooms, 0) as total_rooms,
          COALESCE(md.total_submissions, 0) as total_submissions,
          CASE 
            WHEN uc.total_users > 0 THEN 
              (COALESCE(md.total_submissions, 0) * 100.0 / uc.total_users)
            ELSE 0 
          END as submission_rate
        FROM months m
        LEFT JOIN monthly_data md ON md.month = m.month
        CROSS JOIN user_counts uc
        ORDER BY m.month
      `;
      params = [region, year];
    }

    try {
      const result = await pool.query(query, params);
      
      return result.rows.map(row => ({
        month: Number(row.month),
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
    } catch (error) {
      console.error("Database error in getMonthlyMetrics:", error);
      throw error;
    }
  }
}

module.exports = RegionalAdminModel;