import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { firebaseAuth } from '../app/auth/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  signInWithPopup,
  GoogleAuthProvider,
  User 
} from 'firebase/auth';
import { isAdminUser } from '../utils/adminDealerManager';

interface LuxuryAuthProps {
  defaultMode?: 'login' | 'register';
}

export function LuxuryAuth({ defaultMode }: LuxuryAuthProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminDropdown, setShowAdminDropdown] = useState(false);

  const googleProvider = new GoogleAuthProvider();

  // Set initial mode based on current path or prop
  useEffect(() => {
    if (defaultMode) {
      setIsRegistering(defaultMode === 'register');
    } else {
      // Auto-detect based on current path
      setIsRegistering(location.pathname === '/register');
    }
  }, [defaultMode, location.pathname]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      setUser(user);
      if (user) {
        // Check admin status
        try {
          const adminStatus = await isAdminUser(user.uid);
          setIsAdmin(adminStatus);
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleEmailPasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAuthLoading(true);
    
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(firebaseAuth, email, password);
      } else {
        await signInWithEmailAndPassword(firebaseAuth, email, password);
      }
      setEmail('');
      setPassword('');
      // Redirect will happen in useEffect when user state changes
    } catch (error: any) {
      setError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setAuthLoading(true);
    
    try {
      await signInWithPopup(firebaseAuth, googleProvider);
      // Redirect will happen in useEffect when user state changes
    } catch (error: any) {
      setError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(firebaseAuth);
    } catch (error: any) {
      setError(error.message);
    }
  };

  // Redirect to main page after successful login
  useEffect(() => {
    if (user && !loading) {
      // Small delay to ensure UI has time to update
      setTimeout(() => {
        navigate('/');
      }, 1000);
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-amber-400 font-medium">Laden...</span>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="space-y-6">
        {/* Welkom bericht */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full mb-4 shadow-xl">
            <span className="text-3xl">👑</span>
          </div>
          <h3 className="text-2xl font-bold text-amber-400 mb-2" style={{ fontFamily: '"Cinzel Decorative", cursive' }}>
            Welkom Terug
          </h3>
          <p className="text-slate-300">Redirecting to casino...</p>
        </div>

        {/* User info */}
        <div className="bg-gradient-to-r from-amber-900/20 to-yellow-900/20 border border-amber-400/30 rounded-xl p-6">
          <div className="flex items-center space-x-4">
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt="Profile" 
                className="w-12 h-12 rounded-full border-2 border-amber-400"
              />
            ) : (
              <div className="w-12 h-12 bg-amber-400/20 rounded-full flex items-center justify-center">
                <span className="text-amber-400 font-bold text-xl">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || '?'}
                </span>
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <p className="font-semibold text-white">
                  {user.displayName || 'Speler'}
                </p>
                {isAdmin && (
                  <span className="px-2 py-1 text-xs bg-red-600 text-white rounded-full font-bold">
                    ADMIN
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-300">{user.email}</p>
            </div>
            
            {/* Admin Dropdown */}
            {isAdmin && (
              <div className="relative">
                <button
                  onClick={() => setShowAdminDropdown(!showAdminDropdown)}
                  className="p-2 bg-red-600/20 hover:bg-red-600/30 rounded-lg border border-red-400/30 transition-colors"
                >
                  <span className="text-red-400">⚙️</span>
                </button>
                
                {showAdminDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50">
                    <a
                      href="/dealer-management"
                      className="block px-4 py-2 text-sm text-white hover:bg-slate-700 transition-colors"
                    >
                      🎰 Dealer Management
                    </a>
                    <a
                      href="/admin-page"
                      className="block px-4 py-2 text-sm text-white hover:bg-slate-700 transition-colors"
                    >
                      🛡️ Admin Panel
                    </a>
                    <a
                      href="/admin-setup"
                      className="block px-4 py-2 text-sm text-white hover:bg-slate-700 transition-colors border-t border-slate-600"
                    >
                      🔧 Admin Setup
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Loading message */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-amber-400">Redirecting to casino...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Login header */}
      <div className="text-center">
        <h3 className="text-xl font-bold text-amber-400 mb-2" style={{ fontFamily: '"Cinzel Decorative", cursive' }}>
          VIP Login
        </h3>
        <p className="text-slate-300 text-sm">Toegang tot het exclusieve blackjack casino</p>
      </div>

      {/* Google Sign In - Prominent */}
      <button
        onClick={handleGoogleSignIn}
        disabled={authLoading}
        className="w-full bg-white hover:bg-gray-50 text-gray-800 font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl border border-gray-300 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {authLoading ? (
          <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Inloggen met Google</span>
          </>
        )}
      </button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-700"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-slate-800 px-4 text-slate-400">of</span>
        </div>
      </div>

      {/* Email/Password Form */}
      <form onSubmit={handleEmailPasswordAuth} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Email adres
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-300"
            placeholder="uw.email@voorbeeld.com"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Wachtwoord
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-300"
            placeholder="••••••••"
            required
          />
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="register"
            checked={isRegistering}
            onChange={(e) => setIsRegistering(e.target.checked)}
            className="h-4 w-4 text-amber-400 focus:ring-amber-400 border-slate-600 rounded bg-slate-700"
          />
          <label htmlFor="register" className="ml-2 text-sm text-slate-300">
            Nieuw account aanmaken
          </label>
        </div>
        
        {error && (
          <div className="bg-red-900/30 border border-red-400/30 rounded-xl p-4">
            <p className="text-red-300 text-sm flex items-center">
              <span className="mr-2">⚠️</span>
              {error}
            </p>
          </div>
        )}
        
        <button
          type="submit"
          disabled={authLoading}
          className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {authLoading ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
              Laden...
            </div>
          ) : (
            isRegistering ? '👑 Account Aanmaken' : '🃏 VIP Inloggen'
          )}
        </button>
      </form>

      {/* Footer note */}
      <div className="text-center pt-4">
        <p className="text-xs text-slate-500">
          Door in te loggen gaat u akkoord met onze voorwaarden
        </p>
      </div>
    </div>
  );
} 