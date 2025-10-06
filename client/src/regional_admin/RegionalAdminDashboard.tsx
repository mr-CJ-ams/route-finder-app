import React, { useEffect, useState } from "react";
import RegionalAdminSidebar from "./RegionalAdminSidebar";
import ProvincialAdminList from "./ProvincialAdminList";
import ProvincesDashboard from "./components/ProvincesDashboard";
import LineChartComponent from "../admin/components/LineChart";
import MonthlyMetrics from "../admin/components/MonthlyMetrics";
import GuestDemographics from "../admin/components/GuestDemographics";
import NationalityCounts from "../admin/components/NationalityCounts";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const RegionalAdminDashboard: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [region, setRegion] = useState("");
  const [provinces, setProvinces] = useState<string[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<string>("ALL");

  // Analytics data
  const [monthlyCheckIns, setMonthlyCheckIns] = useState<any[]>([]);
  const [monthlyMetrics, setMonthlyMetrics] = useState<any[]>([]);
  const [processedMonthlyMetrics, setProcessedMonthlyMetrics] = useState<any[]>([]);
  const [guestDemographics, setGuestDemographics] = useState<any[]>([]);
  const [nationalityCounts, setNationalityCounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userData = sessionStorage.getItem("user");
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      setRegion(parsed.region || "");
    }
  }, []);

  // Fetch provinces for the region
  useEffect(() => {
    if (!region) return;
    const fetchProvinces = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const res = await axios.get(`${API_BASE_URL}/provincial-admin/regional/provincial-admins`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const provinceList = Array.from(new Set(res.data.map((a: any) => String(a.province)))).sort() as string[];
        setProvinces(["ALL", ...provinceList]);
      } catch (err) {
        setProvinces(["ALL"]);
      }
    };
    fetchProvinces();
  }, [region]);

  // Main data fetching effect
  useEffect(() => {
    if (!region) return;
    
    setLoading(true);

    // Fetch monthly check-ins for region or selected province
    const fetchCheckIns = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const params: any = { year: selectedYear };
        if (selectedProvince && selectedProvince !== "ALL") {
          params.province = selectedProvince;
        }
        const res = await axios.get(`${API_BASE_URL}/provincial-admin/regional/monthly-checkins`, {
          params,
          headers: { Authorization: `Bearer ${token}` }
        });
        setMonthlyCheckIns(res.data);
      } catch (err) {
        console.error("Error fetching check-ins:", err);
        setMonthlyCheckIns([]);
      }
    };

    // Fetch monthly metrics for region or selected province
    const fetchMetrics = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const params: any = { year: selectedYear };
        if (selectedProvince && selectedProvince !== "ALL") {
          params.province = selectedProvince;
        }
        const res = await axios.get(`${API_BASE_URL}/provincial-admin/regional/monthly-metrics`, {
          params,
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Monthly metrics data:", res.data);
        setMonthlyMetrics(res.data);
      } catch (err) {
        console.error("Error fetching metrics:", err);
        setMonthlyMetrics([]);
      }
    };

    // FIXED: Fetch guest demographics with province filter
    const fetchDemographics = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const params: any = { 
          year: selectedYear, 
          month: selectedMonth 
        };
        // For regional admin, we can filter by province.
        // The backend adminController will handle the 'ALL' case.
        if (selectedProvince) {
          params.province = selectedProvince;
        }
        const res = await axios.get(`${API_BASE_URL}/admin/guest-demographics`, {
          params,
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Guest demographics data:", res.data); // Debug log
        setGuestDemographics(res.data || []);
      } catch (err) {
        console.error("Error fetching demographics:", err);
        setGuestDemographics([]);
      }
    };

    // Fetch nationality counts for region or selected province
    const fetchNationalityCounts = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const params: any = { 
          year: selectedYear, 
          month: selectedMonth 
        };
        if (selectedProvince && selectedProvince !== "ALL") {
          params.province = selectedProvince;
        }
        const res = await axios.get(`${API_BASE_URL}/provincial-admin/regional/nationality-counts`, {
          params,
          headers: { Authorization: `Bearer ${token}` }
        });
        setNationalityCounts(res.data);
      } catch (err) {
        console.error("Error fetching nationality counts:", err);
        setNationalityCounts([]);
      }
    };

    // Execute all fetches
    Promise.all([
      fetchCheckIns(),
      fetchMetrics(),
      fetchDemographics(),
      fetchNationalityCounts()
    ]).finally(() => {
      setLoading(false);
    });
  }, [region, selectedYear, selectedMonth, selectedProvince]);

  // Preprocess monthlyMetrics to ensure months 1-12 are present and formatted
  useEffect(() => {
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    
    if (monthlyMetrics.length > 0) {
      const metricsMap = new Map();
      monthlyMetrics.forEach((m) => {
        metricsMap.set(Number(m.month), m);
      });
      
      const filledMetrics = months.map((month) => {
        const m = metricsMap.get(month);
        return {
          month,
          total_check_ins: m?.total_check_ins ?? 0,
          total_overnight: m?.total_overnight ?? 0,
          total_occupied: m?.total_occupied ?? 0,
          average_guest_nights: m?.average_guest_nights ?? 0,
          average_room_occupancy_rate: m?.average_room_occupancy_rate ?? 0,
          average_guests_per_room: m?.average_guests_per_room ?? 0,
          total_rooms: m?.total_rooms ?? 0,
          total_submissions: m?.total_submissions ?? 0,
          submission_rate: m?.submission_rate ?? 0,
        };
      });
      setProcessedMonthlyMetrics(filledMetrics);
    } else {
      const emptyMetrics = months.map(month => ({
        month,
        total_check_ins: 0,
        total_overnight: 0,
        total_occupied: 0,
        average_guest_nights: 0,
        average_room_occupancy_rate: 0,
        average_guests_per_room: 0,
        total_rooms: 0,
        total_submissions: 0,
        submission_rate: 0,
      }));
      setProcessedMonthlyMetrics(emptyMetrics);
    }
  }, [monthlyMetrics]);

  const handleLogout = () => {
    sessionStorage.clear();
    window.location.href = "/login";
  };

  const formatMonth = (month: number) =>
    new Date(0, month - 1).toLocaleString("default", { month: "long" });

  const toNumber = (v: string | number, d: number = 0): number =>
    isNaN(parseFloat(v as string)) ? d : parseFloat(v as string);

  // Get the display name for guest demographics
  const getGuestDemographicsDisplayName = () => {
    if (selectedProvince === "ALL") {
      return region;
    } else {
      return selectedProvince;
    }
  };

  return (
    <div style={{ display: "flex" }}>
      <RegionalAdminSidebar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        handleLogout={handleLogout}
        adminRegion={region}
      />
      
      <div style={{ marginLeft: 260, width: "100%", padding: 30, background: "#F5F7FA", minHeight: "100vh" }}>
        
        {/* Only show dashboard header and filters for dashboard section */}
        {activeSection === "dashboard" && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ color: "#0288D1", fontWeight: 700 }}>
                {region} Regional Dashboard
              </h2>
              <button
                className="btn btn-outline-info d-md-none"
                onClick={() => setSidebarOpen(true)}
                style={{ fontWeight: 600 }}
              >
                Menu
              </button>
            </div>
            
            <div style={{ marginTop: 16, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <div>
                <label style={{ fontWeight: 600, marginRight: 8 }}>Year:</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  style={{ padding: "6px 10px", borderRadius: 6 }}
                >
                  {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontWeight: 600, marginRight: 8 }}>Month:</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  style={{ padding: "6px 10px", borderRadius: 6 }}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>{formatMonth(m)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontWeight: 600, marginRight: 8 }}>Province:</label>
                <select
                  value={selectedProvince}
                  onChange={e => setSelectedProvince(e.target.value)}
                  style={{ padding: "6px 10px", borderRadius: 6 }}
                >
                  {provinces.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
          </>
        )}

        {/* Show different header for provincial list section */}
        {activeSection === "provincial-list" && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ color: "#0288D1", fontWeight: 700 }}>
              Provincial Administrators
            </h2>
            <button
              className="btn btn-outline-info d-md-none"
              onClick={() => setSidebarOpen(true)}
              style={{ fontWeight: 600 }}
            >
              Menu
            </button>
          </div>
        )}

        {/* Show different header for provinces dashboard section */}
        {activeSection === "provinces-dashboard" && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ color: "#0288D1", fontWeight: 700 }}>
              Provinces Performance Dashboard
            </h2>
            <button
              className="btn btn-outline-info d-md-none"
              onClick={() => setSidebarOpen(true)}
              style={{ fontWeight: 600 }}
            >
              Menu
            </button>
          </div>
        )}

        {/* Render different components based on active section */}
        {activeSection === "dashboard" && (
          <div style={{ marginTop: 30 }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p style={{ marginTop: "16px", color: "#666" }}>Loading dashboard data...</p>
              </div>
            ) : (
              <>
                {/* Monthly Arrivals LineChart */}
                <LineChartComponent
                  monthlyCheckIns={monthlyCheckIns}
                  selectedYear={selectedYear}
                  formatMonth={formatMonth}
                  adminMunicipality={getGuestDemographicsDisplayName()}
                />
                {/* Monthly Metrics Table */}
                <MonthlyMetrics
                  monthlyMetrics={processedMonthlyMetrics}
                  selectedYear={selectedYear}
                  formatMonth={formatMonth}
                  toNumber={toNumber}
                  adminMunicipality={getGuestDemographicsDisplayName()}
                />
                {/* Guest Demographics */}
                <GuestDemographics
                  guestDemographics={guestDemographics}
                  selectedYear={selectedYear}
                  selectedMonth={selectedMonth}
                  formatMonth={formatMonth}
                  adminMunicipality={getGuestDemographicsDisplayName()}
                />
                {/* Top Markets Ranking */}
                <NationalityCounts
                  nationalityCounts={nationalityCounts}
                  selectedYear={selectedYear}
                  selectedMonth={selectedMonth}
                  formatMonth={formatMonth}
                  adminMunicipality={getGuestDemographicsDisplayName()}
                />
              </>
            )}
          </div>
        )}
        
        {activeSection === "provincial-list" && (
          <ProvincialAdminList />
        )}

        {activeSection === "provinces-dashboard" && (
          <ProvincesDashboard />
        )}
      </div>
    </div>
  );
};

export default RegionalAdminDashboard;