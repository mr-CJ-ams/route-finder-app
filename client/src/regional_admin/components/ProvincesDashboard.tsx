import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

interface ProvinceMetrics {
  province: string;
  total_check_ins: number;
  total_overnight: number;
  total_occupied: number;
  average_guest_nights: number;
  average_room_occupancy_rate: number;
  average_guests_per_room: number;
  total_rooms: number;
  total_submissions: number;
  submission_rate: number;
}

type SortField = keyof ProvinceMetrics;
type SortDirection = "asc" | "desc";

const ProvincesDashboard: React.FC = () => {
  const [provinceMetrics, setProvinceMetrics] = useState<ProvinceMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [sortField, setSortField] = useState<SortField>("province");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  useEffect(() => {
    fetchProvinceMetrics();
  }, [selectedYear, selectedMonth]);

  const fetchProvinceMetrics = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/provincial-admin/regional/province-metrics`, {
        params: { year: selectedYear, month: selectedMonth },
        headers: { Authorization: `Bearer ${token}` }
      });
      setProvinceMetrics(response.data);
      setError("");
    } catch (err: any) {
      console.error("Error fetching province metrics:", err);
      setError(err.response?.data?.error || "Failed to fetch province metrics");
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortIcon: React.FC<{ field: SortField }> = ({ field }) => {
    if (sortField !== field) return <i className="bi bi-arrow-down-up" style={{ opacity: 0.3, fontSize: "0.8rem" }}></i>;
    return sortDirection === "asc" ? 
      <i className="bi bi-arrow-up" style={{ fontSize: "0.8rem" }}></i> : 
      <i className="bi bi-arrow-down" style={{ fontSize: "0.8rem" }}></i>;
  };

  const sortedData = [...provinceMetrics].sort((a, b) => {
    const aValue = a[sortField] || 0;
    const bValue = b[sortField] || 0;
    
    if (sortDirection === "asc") {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    } else {
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
    }
  });

  const formatNumber = (num: number) => {
    if (isNaN(num) || num === null || num === undefined) return "0";
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(num);
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
        marginTop: "20px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
      }}>
        <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p style={{ marginTop: "20px", color: "#666", fontSize: "1.1rem", fontWeight: 500 }}>
          Loading Provinces Dashboard...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: "40px", 
        backgroundColor: "#FFFFFF", 
        borderRadius: "16px", 
        marginTop: "20px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        textAlign: "center" 
      }}>
        <div style={{ color: "#dc3545", fontSize: "3rem", marginBottom: "20px" }}>
          <i className="bi bi-exclamation-triangle"></i>
        </div>
        <h4 style={{ color: "#dc3545", marginBottom: "20px", fontWeight: 600 }}>Error Loading Data</h4>
        <p style={{ color: "#666", marginBottom: "20px", fontSize: "1.1rem" }}>{error}</p>
        <button 
          className="btn btn-primary"
          onClick={fetchProvinceMetrics}
          style={{ 
            padding: "12px 24px", 
            borderRadius: "12px",
            fontWeight: 600,
            boxShadow: "0 4px 12px rgba(0,188,212,0.3)"
          }}
        >
          <i className="bi bi-arrow-clockwise" style={{ marginRight: "8px" }}></i>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={{ marginTop: "20px" }}>
      <div style={{ 
        backgroundColor: "#FFFFFF", 
        borderRadius: "16px", 
        padding: "24px", 
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        overflow: "hidden"
      }}>
        
        {/* Header Section */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginBottom: "24px", 
          paddingBottom: "16px", 
          borderBottom: "2px solid #00BCD4",
          flexWrap: "wrap",
          gap: "16px"
        }}>
          <div>
            <h3 style={{ color: "#37474F", margin: 0, fontWeight: 700, fontSize: "1.5rem" }}>
              <i className="bi bi-grid-3x3" style={{ marginRight: "12px", color: "#00BCD4" }}></i>
              Provinces Performance Dashboard
            </h3>
            <p style={{ color: "#666", margin: "4px 0 0 0", fontSize: "0.95rem" }}>
              Overview of tourism metrics across all provinces in the region
            </p>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span className="badge" style={{ 
              backgroundColor: "#00BCD4", 
              color: "white", 
              fontSize: "0.9rem", 
              padding: "8px 12px",
              borderRadius: "20px",
              fontWeight: 600
            }}>
              {sortedData.length} {sortedData.length === 1 ? 'Province' : 'Provinces'}
            </span>
          </div>
        </div>

        {/* Filters */}
        <div style={{ 
          display: "flex", 
          gap: "16px", 
          alignItems: "center", 
          marginBottom: "24px",
          flexWrap: "wrap"
        }}>
          <div>
            <label style={{ fontWeight: 600, marginRight: "8px" }}>Year:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              style={{ 
                padding: "8px 12px", 
                borderRadius: "8px",
                border: "2px solid #e0e0e0"
              }}
            >
              {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontWeight: 600, marginRight: "8px" }}>Month:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              style={{ 
                padding: "8px 12px", 
                borderRadius: "8px",
                border: "2px solid #e0e0e0"
              }}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>
                  {new Date(0, m - 1).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>

          <button 
            onClick={fetchProvinceMetrics}
            className="btn btn-outline-primary"
            style={{ 
              padding: "8px 16px", 
              borderRadius: "8px",
              fontWeight: 500
            }}
          >
            <i className="bi bi-arrow-clockwise" style={{ marginRight: "6px" }}></i>
            Refresh
          </button>
        </div>

        {sortedData.length === 0 ? (
          <div style={{ 
            textAlign: "center", 
            padding: "60px 20px", 
            color: "#666",
            backgroundColor: "#f8f9fa",
            borderRadius: "12px"
          }}>
            <i className="bi bi-bar-chart" style={{ fontSize: "64px", marginBottom: "20px", display: "block", color: "#ccc" }}></i>
            <h5 style={{ marginBottom: "12px", fontWeight: 600 }}>No Data Available</h5>
            <p style={{ margin: 0 }}>
              No province metrics found for the selected period.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #e0e0e0" }}>
            <table className="table" style={{ width: "100%", margin: 0, borderCollapse: "collapse" }}>
              <thead style={{ backgroundColor: "#00BCD4", color: "#FFFFFF" }}>
                <tr>
                  <th 
                    style={{ 
                      padding: "16px 12px", 
                      fontWeight: 600, 
                      minWidth: "120px", 
                      position: "sticky", 
                      left: 0, 
                      backgroundColor: "#00BCD4",
                      cursor: "pointer"
                    }}
                    onClick={() => handleSort("province")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      Province
                      <SortIcon field="province" />
                    </div>
                  </th>
                  <th 
                    style={{ padding: "16px 12px", fontWeight: 600, minWidth: "120px", cursor: "pointer" }}
                    onClick={() => handleSort("total_check_ins")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      Total Check-Ins
                      <SortIcon field="total_check_ins" />
                    </div>
                  </th>
                  <th 
                    style={{ padding: "16px 12px", fontWeight: 600, minWidth: "140px", cursor: "pointer" }}
                    onClick={() => handleSort("total_overnight")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      Total Overnight
                      <SortIcon field="total_overnight" />
                    </div>
                  </th>
                  <th 
                    style={{ padding: "16px 12px", fontWeight: 600, minWidth: "100px", cursor: "pointer" }}
                    onClick={() => handleSort("total_occupied")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      Total Occupied
                      <SortIcon field="total_occupied" />
                    </div>
                  </th>
                  <th 
                    style={{ padding: "16px 12px", fontWeight: 600, minWidth: "120px", cursor: "pointer" }}
                    onClick={() => handleSort("average_guest_nights")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      Ave. Guest-Nights
                      <SortIcon field="average_guest_nights" />
                    </div>
                  </th>
                  <th 
                    style={{ padding: "16px 12px", fontWeight: 600, minWidth: "150px", cursor: "pointer" }}
                    onClick={() => handleSort("average_room_occupancy_rate")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      Ave. Room Occupancy Rate
                      <SortIcon field="average_room_occupancy_rate" />
                    </div>
                  </th>
                  <th 
                    style={{ padding: "16px 12px", fontWeight: 600, minWidth: "130px", cursor: "pointer" }}
                    onClick={() => handleSort("average_guests_per_room")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      Ave. Guests per Room
                      <SortIcon field="average_guests_per_room" />
                    </div>
                  </th>
                  <th 
                    style={{ padding: "16px 12px", fontWeight: 600, minWidth: "100px", cursor: "pointer" }}
                    onClick={() => handleSort("total_rooms")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      Total Rooms
                      <SortIcon field="total_rooms" />
                    </div>
                  </th>
                  <th 
                    style={{ padding: "16px 12px", fontWeight: 600, minWidth: "120px", cursor: "pointer" }}
                    onClick={() => handleSort("total_submissions")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      Total Submissions
                      <SortIcon field="total_submissions" />
                    </div>
                  </th>
                  <th 
                    style={{ padding: "16px 12px", fontWeight: 600, minWidth: "120px", cursor: "pointer" }}
                    onClick={() => handleSort("submission_rate")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      Submission Rate
                      <SortIcon field="submission_rate" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedData.map((metrics, index) => (
                  <tr 
                    key={metrics.province} 
                    style={{ 
                      backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8f9fa",
                      transition: "background-color 0.2s ease"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#e3f2fd"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? "#ffffff" : "#f8f9fa"}
                  >
                    <td style={{ 
                      padding: "16px 12px", 
                      fontWeight: 600, 
                      position: "sticky", 
                      left: 0, 
                      backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8f9fa",
                      zIndex: 1
                    }}>
                      {metrics.province || "N/A"}
                    </td>
                    <td style={{ padding: "16px 12px", textAlign: "center", fontWeight: 500 }}>
                      {formatNumber(metrics.total_check_ins || 0)}
                    </td>
                    <td style={{ padding: "16px 12px", textAlign: "center", fontWeight: 500 }}>
                      {formatNumber(metrics.total_overnight || 0)}
                    </td>
                    <td style={{ padding: "16px 12px", textAlign: "center", fontWeight: 500 }}>
                      {formatNumber(metrics.total_occupied || 0)}
                    </td>
                    <td style={{ padding: "16px 12px", textAlign: "center", fontWeight: 500 }}>
                      {formatNumber(metrics.average_guest_nights || 0)}
                    </td>
                    <td style={{ padding: "16px 12px", textAlign: "center", fontWeight: 500, color: "#2e7d32" }}>
                      {formatPercentage(metrics.average_room_occupancy_rate || 0)}
                    </td>
                    <td style={{ padding: "16px 12px", textAlign: "center", fontWeight: 500 }}>
                      {formatNumber(metrics.average_guests_per_room || 0)}
                    </td>
                    <td style={{ padding: "16px 12px", textAlign: "center", fontWeight: 500 }}>
                      {formatNumber(metrics.total_rooms || 0)}
                    </td>
                    <td style={{ padding: "16px 12px", textAlign: "center", fontWeight: 500 }}>
                      {formatNumber(metrics.total_submissions || 0)}
                    </td>
                    <td style={{ 
                      padding: "16px 12px", 
                      textAlign: "center", 
                      fontWeight: 600,
                      color: (metrics.submission_rate || 0) >= 80 ? "#2e7d32" : (metrics.submission_rate || 0) >= 50 ? "#ff9800" : "#d32f2f"
                    }}>
                      {formatPercentage(metrics.submission_rate || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary Stats */}
        {sortedData.length > 0 && (
          <div style={{ 
            marginTop: "24px", 
            padding: "20px", 
            backgroundColor: "#f8f9fa", 
            borderRadius: "12px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px"
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "#00BCD4", fontWeight: 700, fontSize: "1.5rem" }}>
                {formatNumber(sortedData.reduce((sum, p) => sum + (p.total_check_ins || 0), 0))}
              </div>
              <div style={{ color: "#666", fontSize: "0.9rem" }}>Total Check-Ins</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "#00BCD4", fontWeight: 700, fontSize: "1.5rem" }}>
                {formatNumber(sortedData.reduce((sum, p) => sum + (p.total_submissions || 0), 0))}
              </div>
              <div style={{ color: "#666", fontSize: "0.9rem" }}>Total Submissions</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "#00BCD4", fontWeight: 700, fontSize: "1.5rem" }}>
                {formatPercentage(
                  sortedData.reduce((sum, p) => sum + (p.submission_rate || 0), 0) / 
                  sortedData.length
                )}
              </div>
              <div style={{ color: "#666", fontSize: "0.9rem" }}>Avg. Submission Rate</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "#00BCD4", fontWeight: 700, fontSize: "1.5rem" }}>
                {formatNumber(sortedData.reduce((sum, p) => sum + (p.total_rooms || 0), 0))}
              </div>
              <div style={{ color: "#666", fontSize: "0.9rem" }}>Total Rooms</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProvincesDashboard;