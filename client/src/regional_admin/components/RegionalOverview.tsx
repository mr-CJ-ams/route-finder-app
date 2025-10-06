import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

interface RegionalOverviewProps {
  region: string;
  selectedYear: number;
  selectedMonth: number;
}

const RegionalOverview: React.FC<RegionalOverviewProps> = ({
  region,
  selectedYear,
  selectedMonth
}) => {
  const [provinceMetrics, setProvinceMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProvinceMetrics();
  }, [selectedYear, selectedMonth]);

  const fetchProvinceMetrics = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/provincial-admin/regional/province-metrics`, {
        params: { year: selectedYear, month: selectedMonth },
        headers: { Authorization: `Bearer ${token}` }
      });
      setProvinceMetrics(res.data);
    } catch (err) {
      setProvinceMetrics([]);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (isNaN(num) || num === null || num === undefined) return "0";
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatPercentage = (num: number) => {
    if (isNaN(num) || num === null || num === undefined) return "0%";
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num / 100);
  };

  if (loading) {
    return (
      <div style={{ 
        padding: "60px 20px", 
        textAlign: "center", 
        backgroundColor: "#FFFFFF", 
        borderRadius: "16px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
      }}>
        <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p style={{ marginTop: "20px", color: "#666", fontSize: "1.1rem", fontWeight: 500 }}>
          Loading Regional Overview...
        </p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
      <h3 style={{ color: "#37474F", marginBottom: "20px", fontWeight: 700 }}>
        Regional Overview - {region}
      </h3>
      
      {provinceMetrics.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
          <i className="bi bi-bar-chart" style={{ fontSize: "48px", marginBottom: "16px", display: "block", color: "#ccc" }}></i>
          <h5 style={{ marginBottom: "12px", fontWeight: 600 }}>No Data Available</h5>
          <p>No province data found for the selected period.</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="table table-striped table-hover" style={{ background: "#fff", borderRadius: 8 }}>
            <thead style={{ backgroundColor: "#00BCD4", color: "#fff" }}>
              <tr>
                <th>Province</th>
                <th>Total Rooms</th>
                <th>Total Submissions</th>
                <th>Submission Rate (%)</th>
                <th>Check-ins</th>
                <th>Overnight</th>
                <th>Occupied</th>
                <th>Avg Guest Nights</th>
                <th>Avg Room Occupancy</th>
                <th>Avg Guests/Room</th>
              </tr>
            </thead>
            <tbody>
              {provinceMetrics.map((row: any) => (
                <tr key={row.province}>
                  <td style={{ fontWeight: 600 }}>{row.province}</td>
                  <td>{formatNumber(row.total_rooms)}</td>
                  <td>{formatNumber(row.total_submissions)}</td>
                  <td style={{ 
                    fontWeight: 600,
                    color: (row.submission_rate || 0) >= 80 ? "#2e7d32" : (row.submission_rate || 0) >= 50 ? "#ff9800" : "#d32f2f"
                  }}>
                    {formatPercentage(row.submission_rate)}
                  </td>
                  <td>{formatNumber(row.total_check_ins)}</td>
                  <td>{formatNumber(row.total_overnight)}</td>
                  <td>{formatNumber(row.total_occupied)}</td>
                  <td>{row.average_guest_nights?.toFixed(2)}</td>
                  <td>{formatPercentage(row.average_room_occupancy_rate)}</td>
                  <td>{row.average_guests_per_room?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RegionalOverview;