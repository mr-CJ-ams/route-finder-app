import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const ProvincialAdminList: React.FC = () => {
  const [provincialAdmins, setProvincialAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProvincialAdmins();
    // eslint-disable-next-line
  }, []);

  const fetchProvincialAdmins = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/provincial-admin/regional/provincial-admins`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProvincialAdmins(res.data);
      setError("");
    } catch (err: any) {
      setError("Failed to fetch provincial admins");
      setProvincialAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 20 }}>Loading provincial admins...</div>;
  }
  if (error) {
    return <div style={{ padding: 20, color: "red" }}>{error}</div>;
  }

  return (
    <div style={{ padding: 20, background: "#fff", borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
      <h3 style={{ color: "#37474F", marginBottom: 20 }}>Provincial Administrators</h3>
      <table className="table table-striped table-hover">
        <thead style={{ backgroundColor: "#00BCD4", color: "#fff" }}>
          <tr>
            <th>Province</th>
            <th>Admin Name</th>
            <th>Email</th>
            <th>Phone</th>
          </tr>
        </thead>
        <tbody>
          {provincialAdmins.map((admin: any) => (
            <tr key={admin.user_id}>
              <td>{admin.province}</td>
              <td>{admin.company_name}</td>
              <td>{admin.email}</td>
              <td>{admin.phone_number || "N/A"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProvincialAdminList;
