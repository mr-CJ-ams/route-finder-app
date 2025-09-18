// client/src/provincial_admin/components/MunicipalityList.tsx

import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

interface MunicipalAdmin {
  user_id: number;
  email: string;
  password: string;
  phone_number: string;
  registered_owner: string;
  company_name: string;
  municipality: string;
  barangay: string;
}

interface AddUserForm {
  email: string;
  password: string;
  phone_number: string;
  registered_owner: string;
  company_name: string;
  municipality: string;
  barangay: string;
}

const MunicipalityList: React.FC = () => {
  const [municipalAdmins, setMunicipalAdmins] = useState<MunicipalAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof MunicipalAdmin>("municipality");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingUser, setAddingUser] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [newUser, setNewUser] = useState<AddUserForm>({
    email: "",
    password: "",
    phone_number: "",
    registered_owner: "",
    company_name: "",
    municipality: "",
    barangay: ""
  });

  useEffect(() => {
    fetchMunicipalAdmins();
  }, []);

  const fetchMunicipalAdmins = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/provincial-admin/municipal-admins`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMunicipalAdmins(response.data);
      setError("");
    } catch (err: any) {
      console.error("Error fetching municipal admins:", err);
      setError(err.response?.data?.error || "Failed to fetch municipal admins");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    try {
      setAddingUser(true);
      const token = sessionStorage.getItem("token");
      
      // Trim and capitalize municipality and barangay before sending
      const userData = {
        ...newUser,
        municipality: newUser.municipality.trim().toUpperCase(),
        barangay: newUser.barangay.trim().toUpperCase(),
        company_name: newUser.company_name.trim(),
        registered_owner: newUser.registered_owner.trim()
      };
      
      await axios.post(`${API_BASE_URL}/provincial-admin/add-municipal-admin`, 
        userData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setAddSuccess(true);
      setShowAddModal(false);
      setNewUser({
        email: "",
        password: "",
        phone_number: "",
        registered_owner: "",
        company_name: "",
        municipality: "",
        barangay: ""
      });
      setShowPassword(false);
      
      // Refresh the list
      setTimeout(() => {
        setAddSuccess(false);
        fetchMunicipalAdmins();
      }, 2000);
      
    } catch (err: any) {
      console.error("Error adding municipal admin:", err);
      setError(err.response?.data?.error || "Failed to add municipal admin");
    } finally {
      setAddingUser(false);
    }
  };

  const handleMunicipalityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setNewUser({...newUser, municipality: value});
  };

  const handleBarangayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setNewUser({...newUser, barangay: value});
  };

  // Filter and sort data
  const filteredAndSortedData = municipalAdmins
    .filter(admin => 
      Object.values(admin).some(value => 
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
    .sort((a, b) => {
      const aValue = a[sortField] || "";
      const bValue = b[sortField] || "";
      
      if (sortDirection === "asc") {
        return aValue.toString().localeCompare(bValue.toString());
      } else {
        return bValue.toString().localeCompare(aValue.toString());
      }
    });

  const handleSort = (field: keyof MunicipalAdmin) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortIcon: React.FC<{ field: keyof MunicipalAdmin }> = ({ field }) => {
    if (sortField !== field) return <i className="bi bi-arrow-down-up" style={{ opacity: 0.3 }}></i>;
    return sortDirection === "asc" ? 
      <i className="bi bi-arrow-up"></i> : 
      <i className="bi bi-arrow-down"></i>;
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
          Loading Municipal Administrators...
        </p>
      </div>
    );
  }

  if (error && !addSuccess) {
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
          onClick={fetchMunicipalAdmins}
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
      {/* Success Message */}
      {addSuccess && (
        <div style={{
          padding: "16px",
          backgroundColor: "#d4edda",
          color: "#155724",
          borderRadius: "8px",
          marginBottom: "20px",
          border: "1px solid #c3e6cb",
          display: "flex",
          alignItems: "center",
          gap: "10px"
        }}>
          <i className="bi bi-check-circle-fill" style={{ fontSize: "1.2rem" }}></i>
          <span>Municipal administrator added successfully!</span>
        </div>
      )}

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
              <i className="bi bi-building-gear" style={{ marginRight: "12px", color: "#00BCD4" }}></i>
              Municipal Administrators
            </h3>
            <p style={{ color: "#666", margin: "4px 0 0 0", fontSize: "0.95rem" }}>
              Manage all municipal tourism offices in your province
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
              {filteredAndSortedData.length} {filteredAndSortedData.length === 1 ? 'Office' : 'Offices'}
            </span>
            
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-success"
              style={{ 
                padding: "10px 16px", 
                borderRadius: "10px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <i className="bi bi-plus-circle"></i>
              Add New
            </button>
          </div>
        </div>

        {/* Search and Controls */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "16px"
        }}>
          <div style={{ position: "relative", flex: "1", minWidth: "300px" }}>
            <i className="bi bi-search" style={{ 
              position: "absolute", 
              left: "12px", 
              top: "50%", 
              transform: "translateY(-50%)", 
              color: "#666" 
            }}></i>
            <input
              type="text"
              placeholder="Search across all fields..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 12px 12px 40px",
                border: "2px solid #e0e0e0",
                borderRadius: "12px",
                fontSize: "1rem",
                transition: "all 0.3s ease"
              }}
              onFocus={(e) => e.target.style.borderColor = "#00BCD4"}
              onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
            />
          </div>
          
          <button 
            onClick={fetchMunicipalAdmins}
            className="btn btn-outline-primary"
            style={{ 
              padding: "10px 16px", 
              borderRadius: "10px",
              fontWeight: 500
            }}
          >
            <i className="bi bi-arrow-clockwise" style={{ marginRight: "6px" }}></i>
            Refresh
          </button>
        </div>

        {filteredAndSortedData.length === 0 ? (
          <div style={{ 
            textAlign: "center", 
            padding: "60px 20px", 
            color: "#666",
            backgroundColor: "#f8f9fa",
            borderRadius: "12px"
          }}>
            <i className="bi bi-building-x" style={{ fontSize: "64px", marginBottom: "20px", display: "block", color: "#ccc" }}></i>
            <h5 style={{ marginBottom: "12px", fontWeight: 600 }}>No Municipal Offices Found</h5>
            <p style={{ margin: 0 }}>
              {searchTerm ? 'No offices match your search criteria.' : 'There are no municipal tourism offices registered in your province yet.'}
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-success"
              style={{ 
                marginTop: "20px",
                padding: "10px 20px",
                borderRadius: "10px",
                fontWeight: 600
              }}
            >
              <i className="bi bi-plus-circle" style={{ marginRight: "6px" }}></i>
              Add First Office
            </button>
          </div>
        ) : (
          <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #e0e0e0" }}>
            <table className="table" style={{ width: "100%", margin: 0, borderCollapse: "collapse" }}>
              <thead style={{ backgroundColor: "#00BCD4", color: "#FFFFFF" }}>
                <tr>
                  {[
                    { key: "user_id", label: "ID", width: "80px" },
                    { key: "municipality", label: "Municipality", width: "140px" },
                    { key: "barangay", label: "Barangay", width: "120px" },
                    { key: "company_name", label: "Office Name", width: "180px" },
                    { key: "registered_owner", label: "Registered Owner", width: "150px" },
                    { key: "email", label: "Email", width: "200px" },
                    { key: "phone_number", label: "Phone", width: "130px" }
                  ].map(({ key, label, width }) => (
                    <th 
                      key={key}
                      style={{ 
                        padding: "16px 12px", 
                        fontWeight: 600, 
                        cursor: "pointer",
                        minWidth: width,
                        position: "relative"
                      }}
                      onClick={() => handleSort(key as keyof MunicipalAdmin)}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {label}
                        <SortIcon field={key as keyof MunicipalAdmin} />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedData.map((admin, index) => (
                  <tr 
                    key={admin.user_id} 
                    style={{ 
                      backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8f9fa",
                      transition: "background-color 0.2s ease",
                      cursor: "pointer"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#e3f2fd"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? "#ffffff" : "#f8f9fa"}
                  >
                    <td style={{ padding: "16px 12px", fontWeight: 600, color: "#00BCD4" }}>
                      #{admin.user_id}
                    </td>
                    <td style={{ padding: "16px 12px", fontWeight: 600 }}>
                      {admin.municipality || "N/A"}
                    </td>
                    <td style={{ padding: "16px 12px" }}>
                      {admin.barangay || "N/A"}
                    </td>
                    <td style={{ padding: "16px 12px", fontWeight: 500 }}>
                      {admin.company_name || "N/A"}
                    </td>
                    <td style={{ padding: "16px 12px" }}>
                      {admin.registered_owner || "N/A"}
                    </td>
                    <td style={{ padding: "16px 12px" }}>
                      <a 
                        href={`mailto:${admin.email}`} 
                        style={{ 
                          color: "#00BCD4", 
                          textDecoration: "none",
                          fontWeight: 500 
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"}
                        onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}
                      >
                        {admin.email}
                      </a>
                    </td>
                    <td style={{ padding: "16px 12px" }}>
                      {admin.phone_number ? (
                        <a 
                          href={`tel:${admin.phone_number}`} 
                          style={{ 
                            color: "#37474F", 
                            textDecoration: "none",
                            fontWeight: 500 
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"}
                          onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}
                        >
                          {admin.phone_number}
                        </a>
                      ) : (
                        "N/A"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Stats */}
        {filteredAndSortedData.length > 0 && (
          <div style={{ 
            marginTop: "20px", 
            padding: "16px", 
            backgroundColor: "#f8f9fa", 
            borderRadius: "12px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <i className="bi bi-info-circle" style={{ color: "#00BCD4" }}></i>
              <span style={{ color: "#666", fontSize: "0.9rem" }}>
                Showing {filteredAndSortedData.length} of {municipalAdmins.length} offices
                {searchTerm && ` matching "${searchTerm}"`}
              </span>
            </div>
            
            <div style={{ display: "flex", gap: "16px" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ color: "#00BCD4", fontWeight: 600, fontSize: "1.1rem" }}>
                  {new Set(municipalAdmins.map(a => a.municipality)).size}
                </div>
                <div style={{ color: "#666", fontSize: "0.8rem" }}>Municipalities</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1060
        }}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "16px",
            padding: "24px",
            width: "90%",
            maxWidth: "600px",
            maxHeight: "90vh",
            overflowY: "auto"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h4 style={{ margin: 0, color: "#37474F" }}>
                <i className="bi bi-person-plus" style={{ marginRight: "10px", color: "#00BCD4" }}></i>
                Add Municipal Administrator
              </h4>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowPassword(false);
                }}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  color: "#666"
                }}
              >
                &times;
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>Email *</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2px solid #e0e0e0",
                    borderRadius: "8px",
                    fontSize: "1rem"
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>Password *</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    style={{
                      width: "100%",
                      padding: "10px 40px 10px 10px",
                      border: "2px solid #e0e0e0",
                      borderRadius: "8px",
                      fontSize: "1rem"
                    }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#666"
                    }}
                  >
                    <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>Municipality *</label>
                <input
                  type="text"
                  value={newUser.municipality}
                  onChange={handleMunicipalityChange}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2px solid #e0e0e0",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    textTransform: "uppercase"
                  }}
                  placeholder="e.g., PANGLAO"
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>Barangay</label>
                <input
                  type="text"
                  value={newUser.barangay}
                  onChange={handleBarangayChange}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2px solid #e0e0e0",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    textTransform: "uppercase"
                  }}
                  placeholder="e.g., DAO"
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>Office Name *</label>
                <input
                  type="text"
                  value={newUser.company_name}
                  onChange={(e) => setNewUser({...newUser, company_name: e.target.value})}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2px solid #e0e0e0",
                    borderRadius: "8px",
                    fontSize: "1rem"
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>Registered Owner *</label>
                <input
                  type="text"
                  value={newUser.registered_owner}
                  onChange={(e) => setNewUser({...newUser, registered_owner: e.target.value})}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2px solid #e0e0e0",
                    borderRadius: "8px",
                    fontSize: "1rem"
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>Phone Number</label>
                <input
                  type="tel"
                  value={newUser.phone_number}
                  onChange={(e) => setNewUser({...newUser, phone_number: e.target.value})}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2px solid #e0e0e0",
                    borderRadius: "8px",
                    fontSize: "1rem"
                  }}
                />
              </div>
            </div>

            <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowPassword(false);
                }}
                className="btn btn-outline-secondary"
                style={{ padding: "10px 20px", borderRadius: "8px" }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddUser}
                disabled={addingUser || !newUser.email || !newUser.password || !newUser.municipality || !newUser.company_name || !newUser.registered_owner}
                className="btn btn-success"
                style={{ 
                  padding: "10px 20px", 
                  borderRadius: "8px",
                  opacity: addingUser || !newUser.email || !newUser.password || !newUser.municipality || !newUser.company_name || !newUser.registered_owner ? 0.6 : 1
                }}
              >
                {addingUser ? (
                  <>
                    <div className="spinner-border spinner-border-sm" style={{ marginRight: "8px" }}></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-lg" style={{ marginRight: "8px" }}></i>
                    Add Administrator
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MunicipalityList;