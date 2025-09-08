import { useEffect, useState } from "react";
import axios from "axios";
import { Database } from "lucide-react";

interface StorageRow {
  name: string;
  estimated_size?: string;
}

const accentColors: Record<string, string> = {
  users: "bg-cyan-50 text-cyan-800",
  submissions: "bg-amber-50 text-amber-800",
  daily_metrics: "bg-green-50 text-green-800",
  guests: "bg-blue-50 text-blue-800",
  draft_submissions: "bg-indigo-50 text-indigo-800",
  "TOTAL (Your Area)":
    "bg-gradient-to-r from-emerald-200 to-emerald-100 text-emerald-900 font-bold shadow-inner",
};

const StorageUsage = ({ API_BASE_URL }: { API_BASE_URL: string }) => {
  const [usage, setUsage] = useState<StorageRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const { data } = await axios.get<StorageRow[]>(
          `${API_BASE_URL}/admin/storage-usage`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setUsage(data);
      } catch (err) {
        setUsage([]);
      } finally {
        setLoading(false);
      }
    };
    fetchUsage();
  }, [API_BASE_URL]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-6 md:p-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-cyan-100 rounded-full p-3 shadow">
            <Database size={32} className="text-cyan-600" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-sky-900 tracking-tight drop-shadow-sm">
            Database Storage Usage
          </h2>
        </div>
        <div className="bg-white/95 rounded-2xl shadow-xl p-6 md:p-10 border border-sky-100 backdrop-blur-sm">
          <p className="mb-8 text-gray-700 text-base md:text-lg leading-relaxed">
            <span className="font-semibold text-cyan-700">
              Estimated storage usage
            </span>{" "}
            for your admin area, based on the data of users in your region,
            province, and municipality.
          </p>
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <svg
                className="animate-spin h-10 w-10 text-cyan-500"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
              <span className="ml-4 text-cyan-700 font-medium text-lg">
                Loading storage data...
              </span>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl shadow-inner">
              <table className="min-w-full rounded-2xl overflow-hidden border-separate border-spacing-0">
                <thead>
                  <tr className="bg-gradient-to-r from-sky-100 to-sky-50 text-sky-900">
                    <th className="p-4 md:p-5 text-left font-semibold rounded-tl-2xl text-base md:text-lg tracking-wide">
                      Table Name
                    </th>
                    <th className="p-4 md:p-5 text-left font-semibold rounded-tr-2xl text-base md:text-lg tracking-wide">
                      Estimated Size (Your Area)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {usage.map((row, idx) => (
                    <tr
                      key={row.name}
                      className={
                        row.name === "TOTAL (Your Area)"
                          ? accentColors[row.name]
                          : `transition-colors duration-200 ${
                              idx % 2 === 0
                                ? "bg-white/90"
                                : "bg-sky-50/80"
                            } hover:bg-emerald-50/80`
                      }
                      style={
                        row.name === "TOTAL (Your Area)"
                          ? { position: "sticky", bottom: 0, zIndex: 10 }
                          : {}
                      }
                    >
                      <td
                        className={`p-4 md:p-5 font-medium capitalize rounded-l-2xl whitespace-nowrap ${
                          accentColors[row.name] || ""
                        }`}
                        style={{
                          letterSpacing: "0.01em",
                          fontSize:
                            row.name === "TOTAL (Your Area)" ? "1.1rem" : "1rem",
                        }}
                      >
                        {row.name.replace(/_/g, " ")}
                      </td>
                      <td
                        className={`p-4 md:p-5 font-mono text-lg rounded-r-2xl ${
                          accentColors[row.name] || ""
                        }`}
                        style={{
                          fontWeight: row.name === "TOTAL (Your Area)" ? 700 : 500,
                        }}
                      >
                        {row.estimated_size ?? "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-6 text-gray-500 text-sm italic">
                <span className="font-semibold text-cyan-700">Note:</span>{" "}
                Storage is estimated based on row counts and total table size.
                Actual usage may vary. Table colors and textures help visually distinguish data types.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StorageUsage;