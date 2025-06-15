import { firebaseAuth } from "../app/auth/firebase";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";

export default function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    const performLogout = async () => {
      try {
        await signOut(firebaseAuth);
        console.log("✅ User logged out successfully");
        // Redirect to home page after logout
        navigate("/", { replace: true });
      } catch (error) {
        console.error("❌ Logout error:", error);
        // Still redirect even if logout fails
        navigate("/", { replace: true });
      }
    };

    performLogout();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400 mx-auto mb-4"></div>
        <p className="text-slate-300">Uitloggen...</p>
      </div>
    </div>
  );
}