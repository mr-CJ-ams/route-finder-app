import { useEffect, useState } from "react";
import axios from "axios";
import ProvincialAdminSidebar from "./ProvincialAdminSidebar";
import LineChartComponent from "../admin/components/LineChart";
import MonthlyMetrics from "../admin/components/MonthlyMetrics";
import GuestDemographics from "../admin/components/GuestDemographics";
import NationalityCounts from "../admin/components/NationalityCounts";
import RegionalDistribution from "../admin/components/RegionalDistribution";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const ProvincialAdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [monthlyCheckIns, setMonthlyCheckIns] = useState([]);
  const [monthlyMetrics, setMonthlyMetrics] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [province, setProvince] = useState("");
  const [municipalities, setMunicipalities] = useState<string[]>([]);
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>("ALL");
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [guestDemographics, setGuestDemographics] = useState<any[]>([]);
  const [nationalityCounts, setNationalityCounts] = useState<any[]>([]);

  useEffect(() => {
    // Fetch user info from sessionStorage
    const userData = sessionStorage.getItem("user");
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      setProvince(parsed.province || "");
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    // Fetch monthly check-ins for the whole province or selected municipality
    const fetchCheckIns = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const params: any = {
          year: selectedYear,
          region: user.region,
          province: user.province,
        };
        if (selectedMunicipality && selectedMunicipality !== "ALL") {
          params.municipality = selectedMunicipality;
        }
        const res = await axios.get(`${API_BASE_URL}/admin/monthly-checkins`, {
          params,
          headers: { Authorization: `Bearer ${token}` }
        });
        setMonthlyCheckIns(res.data);
      } catch (err) {
        setMonthlyCheckIns([]);
      }
    };
    // Fetch allowed municipalities for filter (province admins)
    const fetchMunicipalities = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const res = await axios.get(`${API_BASE_URL}/admin/municipalities`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const list: string[] = res.data?.municipalities || [];
        setMunicipalities(["ALL", ...list]);
      } catch (e) {
        setMunicipalities(["ALL"]);
      }
    };
    const fetchMetrics = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const params: any = {
          year: selectedYear,
          region: user.region,
          province: user.province,
        };
        if (selectedMunicipality && selectedMunicipality !== "ALL") {
          params.municipality = selectedMunicipality;
        }
        const res = await axios.get(`${API_BASE_URL}/admin/monthly-metrics`, {
          params,
          headers: { Authorization: `Bearer ${token}` }
        });
        const allMonths = Array.from({ length: 12 }, (_, i) => i + 1);
        const filled = allMonths.map(m => {
          const d = res.data.find((x: any) => x.month === m) || {};
          return {
            month: m,
            total_check_ins: d.total_check_ins || 0,
            total_overnight: d.total_overnight || 0,
            total_occupied: d.total_occupied || 0,
            average_guest_nights: d.average_guest_nights || 0,
            average_room_occupancy_rate: d.average_room_occupancy_rate || 0,
            average_guests_per_room: d.average_guests_per_room || 0,
            total_submissions: d.total_submissions || 0,
            submission_rate: d.submission_rate || 0,
            total_rooms: d.total_rooms || 0,
          };
        });
        setMonthlyMetrics(filled);
      } catch (err) {
        setMonthlyMetrics([]);
      }
    };
    const fetchDemographics = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const params: any = {
          year: selectedYear,
          month: selectedMonth,
          region: user.region,
          province: user.province,
        };
        if (selectedMunicipality && selectedMunicipality !== "ALL") {
          params.municipality = selectedMunicipality;
        }
        const res = await axios.get(`${API_BASE_URL}/admin/guest-demographics`, {
          params,
          headers: { Authorization: `Bearer ${token}` }
        });
        setGuestDemographics(res.data || []);
      } catch (err) {
        setGuestDemographics([]);
      }
    };
    const fetchNationalityCounts = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const params: any = {
          year: selectedYear,
          month: selectedMonth,
          region: user.region,
          province: user.province,
        };
        if (selectedMunicipality && selectedMunicipality !== "ALL") {
          params.municipality = selectedMunicipality;
        }
        const res = await axios.get(`${API_BASE_URL}/admin/nationality-counts`, {
          params,
          headers: { Authorization: `Bearer ${token}` }
        });
        // Sort by highest count
        const sorted = (res.data || []).slice().sort((a: any, b: any) => (Number(b.count || 0) - Number(a.count || 0)));
        setNationalityCounts(sorted);
      } catch (err) {
        setNationalityCounts([]);
      }
    };
    fetchMunicipalities();
    fetchCheckIns();
    fetchMetrics();
    fetchDemographics();
    fetchNationalityCounts();
  }, [user, selectedYear, selectedMunicipality, selectedMonth]);

  const handleLogout = () => {
    sessionStorage.clear();
    window.location.href = "/login";
  };

  const formatMonth = (month: number) =>
    new Date(0, month - 1).toLocaleString("default", { month: "long" });

  const toNumber = (v: string | number, d: number = 0): number =>
    isNaN(parseFloat(v as string)) ? d : parseFloat(v as string);

  return (
    <div style={{ display: "flex" }}>
      <ProvincialAdminSidebar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        handleLogout={handleLogout}
        adminProvince={province}
      />
      <div style={{ marginLeft: 260, width: "100%", padding: 30, background: "#F5F7FA", minHeight: "100vh" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ color: "#0288D1", fontWeight: 700 }}>
            {province} Provincial Dashboard
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
            <label style={{ fontWeight: 600, marginRight: 8 }}>Municipality:</label>
            <select
              value={selectedMunicipality}
              onChange={(e) => setSelectedMunicipality(e.target.value)}
              style={{ padding: "6px 10px", borderRadius: 6 }}
            >
              {municipalities.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
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
          </div>
        </div>
        <div style={{ marginTop: 30 }}>
          <LineChartComponent
            monthlyCheckIns={monthlyCheckIns}
            selectedYear={selectedYear}
            formatMonth={formatMonth}
            adminMunicipality={selectedMunicipality === "ALL" ? province : selectedMunicipality}
          />
        </div>
        <div style={{ marginTop: 20 }}>
          <MonthlyMetrics
            monthlyMetrics={monthlyMetrics}
            selectedYear={selectedYear}
            formatMonth={formatMonth}
            toNumber={toNumber}
            adminMunicipality={selectedMunicipality === "ALL" ? province : selectedMunicipality}
          />
        </div>
        <div style={{ marginTop: 20 }}>
          
          <GuestDemographics
            guestDemographics={guestDemographics}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            formatMonth={formatMonth}
            adminMunicipality={selectedMunicipality === "ALL" ? province : selectedMunicipality}
          />
        </div>
        <div style={{ marginTop: 20 }}>
          <h3 style={{ color: "#37474F", marginBottom: 12 }}> Top Markets Ranking </h3>
          <button
            className="btn"
            style={{
              backgroundColor: "#00BCD4",
              color: "#FFFFFF",
              border: "none",
              padding: "10px 20px",
              borderRadius: 8,
              cursor: "pointer",
              marginBottom: 12,
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
            onClick={() => {
              // Delegate to RegionalDistribution's export by rendering hidden component and clicking its export
              // Simpler: render RegionalDistribution's button inline for same UX/format
              const anchor = document.getElementById("dae-form-2-export-btn");
              if (anchor) (anchor as HTMLButtonElement).click();
            }}
          >
            DAE-form 2
          </button>
          <NationalityCounts
            nationalityCounts={nationalityCounts}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            formatMonth={formatMonth}
            adminMunicipality={selectedMunicipality === "ALL" ? province : selectedMunicipality}
          />
          {/* Hidden RegionalDistribution instance to reuse export logic */}
          <div style={{ display: "none" }}>
            <RegionalDistribution
              nationalityCounts={nationalityCounts}
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              formatMonth={formatMonth}
              user={{ role: "admin" }}
              adminMunicipality={selectedMunicipality} // Pass the actual selected municipality
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProvincialAdminDashboard;
