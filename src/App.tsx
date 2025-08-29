import React from "react";
import { Routes, Route } from "react-router-dom";
import Admin from "./pages/Admin";
import RegistrationDetail from "./pages/RegistrationDetail";

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<Admin />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/registration/:id" element={<RegistrationDetail />} />
      </Routes>
    </div>
  );
}

export default App;
