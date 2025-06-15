import React from "react";
import { AdminSetup } from "../components/AdminSetup";

const AdminSetupPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-md border-b border-amber-400/20 p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <a 
            href="/"
            className="text-amber-400 hover:text-amber-300 flex items-center gap-2"
          >
            ← Terug naar Home
          </a>
          <h1 className="text-2xl font-bold text-amber-400">
            🔧 Admin Setup
          </h1>
          <div></div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <AdminSetup />
      </div>
    </div>
  );
};

export default AdminSetupPage; 