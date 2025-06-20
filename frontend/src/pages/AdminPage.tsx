import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getDealers, getLocalDealers } from "../utils/adminDealerManager";
import { isAdminUser } from "../utils/adminDealerManager";
import { useCurrentUser, useUserGuardContext } from "app";
import { DealerData } from "../utils/dealerData";

const AdminPage = () => {
  const { user } = useUserGuardContext();
  const navigate = useNavigate();
  
  const [dealers, setDealers] = useState<DealerData[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [firestoreDealersCount, setFirestoreDealersCount] = useState<number>(0);

  // Fetch dealers function
  const fetchDashboardData = async () => {
    if (!user?.uid) return;
    
    try {
      setError(null);
      
      // Haal Firestore dealers op
      const firestoreDealers = await getDealers();
      
      // Simple carousel count - first 5 active dealers
      const activeDealers = firestoreDealers.filter(d => d.isActive);
      
      setDealers(firestoreDealers);
      setFirestoreDealersCount(firestoreDealers.length);
      
      console.log(`📊 Admin dashboard: ${firestoreDealers.length} Firestore dealers, ${activeDealers.length} active`);
      
    } catch (err) {
      console.error("Error fetching dealers:", err);
      setError("Failed to load dealers from database");
    }
  };

  // Check admin status and fetch dealers
  useEffect(() => {
    const checkAdminAndFetchDealers = async () => {
      if (!user?.uid) return;
      
      setIsLoading(true);
      try {
        const adminStatus = await isAdminUser(user.uid);
        setIsAdmin(adminStatus);
        
        if (adminStatus) {
          await fetchDashboardData();
        } else {
          navigate("/");
        }
      } catch (err) {
        console.error("Error checking admin status:", err);
        setError("Failed to verify admin access");
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAndFetchDealers();
  }, [user, navigate]);

  // Auto-clear messages
  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-amber-400 mx-auto mb-4"></div>
          <p className="text-xl text-amber-400">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8 flex flex-col justify-center items-center">
        <div className="text-center">
          <div className="text-6xl mb-6">🔐</div>
          <h1 className="text-4xl font-bold text-red-400 mb-4">Access Denied</h1>
          <p className="text-lg text-slate-300 mb-8">You do not have administrator privileges.</p>
          <div className="space-x-4">
            <button
              onClick={() => navigate('/')}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              ← Back to Home
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="bg-slate-600 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Go to Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-amber-400 mb-2">🎰 Admin Dashboard</h1>
              <p className="text-slate-300 text-lg">Manage your casino platform</p>
            </div>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <button
                onClick={() => navigate('/')}
                className="bg-slate-600 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                ← Home
              </button>
              <button
                onClick={() => navigate('/dealer-management')}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                📋 Dealer Management
              </button>
            </div>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="bg-red-900/50 border border-red-400/50 rounded-lg p-4 mb-6 text-red-200">
              <div className="flex items-center">
                <span className="text-2xl mr-3">❌</span>
                <div>
                  <strong>Error:</strong> {error}
                </div>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="bg-green-900/50 border border-green-400/50 rounded-lg p-4 mb-6 text-green-200">
              <div className="flex items-center">
                <span className="text-2xl mr-3">✅</span>
                <div>
                  <strong>Success:</strong> {successMessage}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Platform Overview */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl shadow-xl border border-amber-400/20">
            <h2 className="text-2xl font-semibold text-amber-400 mb-4 flex items-center">
              <span className="mr-2">📊</span>
              Platform Overview
            </h2>
            <p className="text-slate-300 mb-6">
              Current status of your casino platform and dealer statistics.
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-blue-400">{firestoreDealersCount}</div>
                <div className="text-sm text-slate-400">Total Dealers</div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-400">
                  {dealers.filter(d => d.isActive).length}
                </div>
                <div className="text-sm text-slate-400">Active Dealers</div>
              </div>
            </div>

            <button
              onClick={() => navigate('/dealer-management')}
              className="bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-900 font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg w-full"
            >
              📋 Manage Dealers
            </button>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl shadow-xl border border-purple-400/20">
            <h2 className="text-2xl font-semibold text-purple-400 mb-4 flex items-center">
              <span className="mr-2">⚡</span>
              Quick Actions
            </h2>
            <p className="text-slate-300 mb-6">
              Common administrative tasks and management options.
            </p>
            
            <div className="space-y-4">
              <button
                onClick={() => navigate('/dealer-management')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors text-left flex items-center"
              >
                <span className="mr-3">👩‍💼</span>
                <div>
                  <div className="font-semibold">Dealer Management</div>
                  <div className="text-sm opacity-75">Add, edit, and organize dealers</div>
                </div>
              </button>
              
              <button
                onClick={() => navigate('/profile')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors text-left flex items-center"
              >
                <span className="mr-3">👤</span>
                <div>
                  <div className="font-semibold">User Profile</div>
                  <div className="text-sm opacity-75">Manage your account settings</div>
                </div>
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors text-left flex items-center"
              >
                <span className="mr-3">🔄</span>
                <div>
                  <div className="font-semibold">Refresh Data</div>
                  <div className="text-sm opacity-75">Reload dashboard information</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation & Tools */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl shadow-xl mb-8 border border-slate-700">
          <h2 className="text-2xl font-semibold text-amber-400 mb-6 flex items-center">
            <span className="mr-2">🧭</span>
            Navigation & Tools
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/dealer-management')}
              className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg text-center"
            >
              <div className="text-2xl mb-2">📋</div>
              <div className="text-sm">Dealer Management</div>
            </button>
            
            <button
              onClick={() => navigate('/profile')}
              className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg text-center"
            >
              <div className="text-2xl mb-2">👤</div>
              <div className="text-sm">User Profile</div>
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-green-600 to-teal-500 hover:from-green-500 hover:to-teal-400 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg text-center"
            >
              <div className="text-2xl mb-2">🔄</div>
              <div className="text-sm">Refresh Dashboard</div>
            </button>
            
            <button
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg text-center"
            >
              <div className="text-2xl mb-2">🏠</div>
              <div className="text-sm">View Homepage</div>
            </button>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl shadow-xl border border-slate-700">
          <h2 className="text-2xl font-semibold text-amber-400 mb-6 flex items-center">
            <span className="mr-2">📈</span>
            System Status
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{firestoreDealersCount}</div>
              <div className="text-sm text-slate-400">Total Dealers</div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">
                {dealers.filter(d => d.isActive).length}
              </div>
              <div className="text-sm text-slate-400">Active Dealers</div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-400">
                {dealers.filter(d => !d.isActive).length}
              </div>
              <div className="text-sm text-slate-400">Draft Dealers</div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">
                {dealers.filter(d => d.avatarUrl).length}
              </div>
              <div className="text-sm text-slate-400">With Images</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
