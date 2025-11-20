import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import RouteFinder from "./user/pages/RouteFinder";
import "bootstrap/dist/css/bootstrap.min.css";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RouteFinder />} />
        <Route path="/route-finder" element={<RouteFinder />} />
      </Routes>
    </Router>
  );
};

export default App;