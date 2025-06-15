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
import casinoPattern from '/casino-pattern.png';

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const googleProvider = new GoogleAuthProvider();

  // Set initial mode based on current path
  useEffect(() => {
    setIsLogin(location.pathname === '/login');
  }, [location.pathname]);

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
    
    if (!isLogin && password !== confirmPassword) {
      setError('Wachtwoorden komen niet overeen');
      return;
    }
    
    setAuthLoading(true);
    
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(firebaseAuth, email, password);
      } else {
        await createUserWithEmailAndPassword(firebaseAuth, email, password);
      }
      setEmail('');
      setPassword('');
      setConfirmPassword('');
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
    } catch (error: any) {
      setError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Redirect to main page after successful login
  useEffect(() => {
    if (user && !loading) {
      setTimeout(() => {
        navigate('/');
      }, 1000);
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-amber-400 font-medium">Laden...</span>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div 
        className="min-h-screen bg-slate-900 text-white flex flex-col relative"
        style={{
          backgroundImage: `url(${casinoPattern})`,
          backgroundRepeat: 'repeat',
          backgroundSize: '300px 300px',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="absolute inset-0 bg-slate-900/50 pointer-events-none z-10"></div>
        
        <main className="relative z-20 flex-grow flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md">
            <div className="bg-slate-800/40 backdrop-blur-lg border border-amber-400/20 rounded-2xl shadow-2xl p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400"></div>
              
              <div className="text-center space-y-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full mb-4 shadow-xl">
                  <span className="text-3xl">👑</span>
                </div>
                <h3 className="text-2xl font-bold text-amber-400 mb-2" style={{ fontFamily: '"Cinzel Decorative", cursive' }}>
                  Welkom Terug
                </h3>
                <p className="text-slate-300">Redirecting naar casino...</p>
                
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-amber-400">Redirecting naar casino...</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-slate-900 text-white flex flex-col relative"
      style={{
        backgroundImage: `url(${casinoPattern})`,
        backgroundRepeat: 'repeat',
        backgroundSize: '300px 300px',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Single unified overlay */}
      <div className="absolute inset-0 bg-slate-900/50 pointer-events-none z-10"></div>
      
      {/* Header */}
      <header className="relative z-50 backdrop-blur-md shadow-lg sticky top-0 py-4 px-6 border-b border-slate-700/30">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <img src="/logo-blackjack-royal.png" alt="Blackjack Royal Logo" className="h-16 w-auto mr-4 object-contain" /> 
            <h1 className="text-3xl font-bold text-amber-400 tracking-wider" style={{ fontFamily: '"Cinzel Decorative", cursive' }}>
              Blackjack Royal
            </h1>
          </div>
          <nav className="flex items-center space-x-4">
            <a 
              href="/" 
              className="text-sm bg-amber-500 hover:bg-amber-600 text-black font-semibold py-2 px-4 rounded-lg transition-colors shadow-md"
            >
              Terug naar Home
            </a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-20 flex-grow flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Auth Card */}
          <div className="bg-slate-800/40 backdrop-blur-lg border border-amber-400/20 rounded-2xl shadow-2xl p-8 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400"></div>
            <div className="absolute -top-10 -right-10 w-20 h-20 bg-amber-400/10 rounded-full blur-xl"></div>
            <div className="absolute -bottom-10 -left-10 w-20 h-20 bg-amber-400/10 rounded-full blur-xl"></div>
            
            {/* Logo and Title */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <img src="/logo-blackjack-royal.png" alt="Blackjack Royal Logo" className="h-20 w-auto object-contain" />
              </div>
              <h2 className="text-2xl font-bold text-amber-400 mb-2" style={{ fontFamily: '"Cinzel Decorative", cursive' }}>
                {isLogin ? 'Welkom Terug' : 'VIP Registratie'}
              </h2>
              <p className="text-slate-300 text-sm">
                {isLogin ? 'Log in bij je exclusieve casino account' : 'Word lid van ons exclusieve casino'}
              </p>
            </div>

            {/* Toggle Buttons */}
            <div className="relative mb-8">
              <div className="bg-slate-700/50 rounded-xl p-1 flex">
                <button
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                    isLogin 
                      ? 'bg-amber-500 text-black shadow-lg' 
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Inloggen
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                    !isLogin 
                      ? 'bg-amber-500 text-black shadow-lg' 
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Registreren
                </button>
              </div>
            </div>

            {/* Google Sign In */}
            <button
              onClick={handleGoogleSignIn}
              disabled={authLoading}
              className="w-full bg-white hover:bg-gray-50 text-gray-800 font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl border border-gray-300 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
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
                  <span>{isLogin ? 'Inloggen' : 'Registreren'} met Google</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative mb-6">
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

              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Bevestig wachtwoord
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-300"
                    placeholder="••••••••"
                    required
                  />
                </div>
              )}
              
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
                  isLogin ? '🃏 VIP Inloggen' : '👑 Account Aanmaken'
                )}
              </button>
            </form>

            {/* Footer note */}
            <div className="mt-6 text-center">
              <p className="text-xs text-slate-500">
                Door {isLogin ? 'in te loggen' : 'te registreren'} gaat u akkoord met onze voorwaarden
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 py-6 text-center text-slate-500 border-t border-slate-800/50 bg-slate-900/20 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="text-xs text-slate-600">
            <p>&copy; {new Date().getFullYear()} Blackjack Royal Casino. All rights reserved.</p>
            <p className="mt-1">Play responsibly. 18+</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 