import React from "react";
import { Phone, Mail, MapPin, Clock, ArrowLeft } from "lucide-react"; // Icons for contact details
import { useNavigate } from "react-router-dom";
import Panglao_lgu_logo from "../components/img/panglao-logo.png"
import Panglao_tourism_logo from "../components/img/Tourism_logo.png"
import BISU_logo from "../components/img/BISU_Logo.png"
import ICpEP_Logo from "../components/img/CpE_Logo.png"

const HelpSupportPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-blue-100 p-2 sm:p-8">
      <div className="w-full sm:max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header with Beach-Inspired Design */}
        <div className="bg-blue-500 p-4 sm:p-8 text-center relative">
          <div className="absolute top-0 left-0 w-full h-12 bg-white opacity-20 transform skew-y-2"></div>
          <div className="absolute top-8 left-0 w-full h-12 bg-white opacity-10 transform skew-y-4"></div>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate("/login")}
              className="flex items-center gap-2 text-white hover:text-blue-100 transition-colors z-20 relative"
            >
              <ArrowLeft size={20} />
              Back to Login
            </button>
            <div className="flex items-center gap-2">
              <img src={Panglao_tourism_logo} alt="Tourism Logo" className="w-8 h-8" />
              <span className="text-white font-semibold">TDMS</span>
            </div>
          </div>
          <h3 className="text-2xl sm:text-4xl font-bold text-white mb-2 sm:mb-4">Video Demonstration</h3>
          {/* <p className="text-base sm:text-lg text-blue-100">
            We're here to help you! Reach out to us for any inquiries or assistance.
          </p> */}
        </div>

       {/* User Guide section */} 
       <div className="p-4 sm:p-8">

         {/* Tutorial Video Section */}
         <div className="mb-8">
           <h4 className="text-xl sm:text-2xl font-semibold text-sky-900 mb-4">
             Watch the TDMS Tutorial
           </h4>
           <div
             className="w-full max-w-2xl mx-auto rounded-lg overflow-hidden shadow-lg border border-blue-200"
             style={{
               aspectRatio: "16/9",
               minHeight: "200px",
               height: "auto",
               maxHeight: "60vw"
             }}
           >
             <iframe
               src="https://www.youtube.com/embed/tESZX530Av4?si=7-72btxkwTngeRdH"
               title="TDMS Tutorial"
               allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
               allowFullScreen
               className="w-full h-full min-h-[200px]"
               style={{
                 aspectRatio: "16/9",
                 minHeight: "200px",
                 height: "100%",
                 maxHeight: "60vw"
               }}
             ></iframe>
           </div>
           <p className="text-gray-600 text-sm sm:text-base mt-2 text-center">
             Need help? Watch our step-by-step video guide on how to use the Panglao Tourist Data Management System.
           </p>
         </div>

          {/* Back to Login Button */}
          <div className="text-center mt-8">
            <button
              onClick={() => navigate("/login")}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpSupportPage;