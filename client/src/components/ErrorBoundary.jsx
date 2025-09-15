import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      adminContact: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can log error info to an error reporting service here
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    
    // Fetch admin contact details based on user's municipality
    this.fetchAdminContact();
  }

  fetchAdminContact = async () => {
    try {
      const token = sessionStorage.getItem("token");
      if (!token) return;
      
      // Get user's municipality from JWT
      const userData = JSON.parse(atob(token.split('.')[1]));
      const userMunicipality = userData.municipality;
      
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
      
      const response = await fetch(
        `${API_BASE_URL}/admin/admin-contact?municipality=${encodeURIComponent(userMunicipality)}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.ok) {
        const adminContact = await response.json();
        this.setState({ adminContact });
      }
    } catch (err) {
      console.error("Error fetching admin contact in ErrorBoundary:", err);
    }
  }

  render() {
    if (this.state.hasError) {
      const { adminContact } = this.state;
      
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-sky-50 p-4">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Something went wrong.</h1>
          <p className="text-gray-700 mb-4 text-center">
            Please try refreshing the page. If the problem persists, contact your local tourism office:
          </p>
          
          <div className="mb-4 text-center bg-white p-4 rounded-lg shadow-sm max-w-md">
            {adminContact ? (
              <>
                <h3 className="font-semibold text-lg mb-2">
                  {adminContact.municipality} Tourism Office
                </h3>
                {adminContact.phone_number && (
                  <div className="mb-2">
                    <span className="font-semibold">Phone:</span><br />
                    <a 
                      href={`tel:${adminContact.phone_number}`} 
                      className="text-blue-600 hover:underline"
                    >
                      {adminContact.phone_number}
                    </a>
                  </div>
                )}
                {adminContact.email && (
                  <div className="mb-2">
                    <span className="font-semibold">Email:</span><br />
                    <a 
                      href={`mailto:${adminContact.email}`} 
                      className="text-blue-600 hover:underline break-words"
                    >
                      {adminContact.email}
                    </a>
                  </div>
                )}
                {(adminContact.barangay || adminContact.municipality || adminContact.province) && (
                  <div className="mb-2">
                    <span className="font-semibold">Address:</span><br />
                    <span className="text-gray-600">
                      {[adminContact.barangay, adminContact.municipality, adminContact.province]
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  </div>
                )}
              </>
            ) : (
              // Fallback to default contact details if admin contact fetch fails
              <>
                <div className="mb-2">
                  <span className="font-semibold">Phone:</span><br />
                  <a href="tel:+63384116731" className="text-blue-600 hover:underline">
                    (038) 411 6731
                  </a>
                </div>
                <div>
                  <span className="font-semibold">Email:</span><br />
                  <a 
                    href="mailto:statistics.tourismpanglao@gmail.com" 
                    className="text-blue-600 hover:underline break-words"
                  >
                    statistics.tourismpanglao@gmail.com
                  </a>
                </div>
              </>
            )}
          </div>
          
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Refresh Page
          </button>
          
          {/* Optionally show error details in development */}
          {import.meta.env.MODE === "development" && (
            <pre className="bg-gray-100 p-2 rounded text-xs text-red-800 mt-4 max-w-2xl overflow-auto">
              {this.state.error && this.state.error.toString()}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;