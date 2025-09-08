import React from "react";
import { Routes, Route } from "react-router-dom";
import Admin from "./pages/Admin";
import RegistrationDetail from "./pages/RegistrationDetail";
import BarracasGrid from "./pages/BarracasGrid";
import BarracaDetail from "./pages/BarracaDetail";
import AppHeader from "./components/AppHeader";

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <Routes>
        <Route path="/" element={<Admin />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/registration/:id" element={<RegistrationDetail />} />
        <Route path="/barracas" element={<BarracasGrid />} />
        <Route path="/barracas/new" element={<BarracaDetail />} />
        <Route path="/barracas/:id" element={<BarracaDetail />} />
      </Routes>
    </div>
  );
}

export default App;
