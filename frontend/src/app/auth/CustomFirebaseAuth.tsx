import React, { useState, useEffect } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  onAuthStateChanged,
  getRedirectResult,
  User
} from "firebase/auth";
import { firebaseAuth } from "./firebase";
import { config } from "./config";
import { useLocation, useNavigate } from "react-router-dom";

interface Props {
  signInOptions: {
    google?: boolean;
    facebook?: boolean;
    github?: boolean;
    twitter?: boolean;
    emailAndPassword?: boolean;
    magicLink?: boolean;
  };
  onSignInSuccess?: (user: User) => void;
}

export const CustomFirebaseAuth: React.FC<Props> = ({ signInOptions, onSignInSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Handle redirect result from Google Sign-In
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(firebaseAuth);
        if (result && result.user) {
          // User signed in via redirect, auth state change will handle navigation
          console.log("✅ Google Sign-In redirect successful:", result.user.email);
        }
      } catch (error: any) {
        console.error("❌ Google Sign-In redirect error:", error);
        setError(error.message || "Google inloggen mislukt");
        setIsLoading(false);
      }
    };

    handleRedirectResult();
  }, []);

  // Listen for auth state changes and redirect on success
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      // Prevent loops by only handling auth changes when not currently processing
      if (user && !isLoading) {
        console.log("✅ User authenticated, redirecting...", user.email);
        
        // Clear any loading states
        setIsLoading(false);
        setError("");
        
        // User is signed in, redirect appropriately
        if (onSignInSuccess) {
          onSignInSuccess(user);
        } else {
          // Check for 'next' parameter in URL
          const searchParams = new URLSearchParams(location.search);
          const nextPath = searchParams.get('next');
          
          // Avoid redirect loops by checking current path
          const currentPath = location.pathname;
          if (currentPath === '/login' || currentPath === '/register') {
            // Redirect to the intended page or home
            if (nextPath && nextPath !== '/login' && nextPath !== '/logout') {
              navigate(nextPath, { replace: true });
            } else {
              // Default to home page
              navigate('/', { replace: true });
            }
          }
        }
      } else if (!user && !isLoading) {
        // User is not authenticated, ensure we're on login page
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [isLoading, onSignInSuccess, location.search, location.pathname, navigate]);

  const handleEmailPasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(firebaseAuth, email, password);
      } else {
        await signInWithEmailAndPassword(firebaseAuth, email, password);
      }
      // Redirect will be handled by the auth state change listener
    } catch (error: any) {
      console.error("❌ Authentication error:", error);
      
      // More specific error handling
      let errorMessage = "Er is een fout opgetreden";
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = "Gebruiker niet gevonden. Controleer je email adres.";
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = "Onjuist wachtwoord. Probeer opnieuw.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Ongeldig email adres.";
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = "Dit account is uitgeschakeld.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Te veel login pogingen. Probeer later opnieuw.";
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = "Netwerkfout. Controleer je internetverbinding.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError("");

    try {
      const provider = new GoogleAuthProvider();
      provider.addScope("https://www.googleapis.com/auth/userinfo.profile");
      provider.addScope("https://www.googleapis.com/auth/userinfo.email");
      
      // Use redirect instead of popup to avoid CORS issues
      const { signInWithRedirect } = await import("firebase/auth");
      await signInWithRedirect(firebaseAuth, provider);
      // Redirect will be handled automatically by Firebase
    } catch (error: any) {
      setError(error.message || "Google inloggen mislukt");
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError("Voer eerst je email adres in");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await sendPasswordResetEmail(firebaseAuth, email);
      setResetEmailSent(true);
    } catch (error: any) {
      setError(error.message || "Wachtwoord reset mislukt");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {resetEmailSent ? (
        <div className="text-center">
          <div className="bg-green-900/30 border border-green-400/30 text-green-300 p-4 rounded-lg mb-4">
            <div className="flex items-center justify-center mb-2">
              <span className="text-xl">✅</span>
            </div>
            <p className="text-sm">Wachtwoord reset email is verzonden naar</p>
            <p className="font-semibold">{email}</p>
          </div>
          <button
            onClick={() => setResetEmailSent(false)}
            className="text-amber-400 hover:text-amber-300 underline transition-colors"
          >
            Terug naar inloggen
          </button>
        </div>
      ) : (
        <>
          {/* Google Sign In */}
          {signInOptions.google && (
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full mb-6 px-4 py-3 bg-white hover:bg-gray-50 disabled:bg-gray-300 disabled:cursor-not-allowed text-gray-800 font-semibold rounded-lg shadow-lg transition-all duration-200 flex items-center justify-center border border-gray-200 hover:shadow-xl"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {isLoading ? "Bezig met inloggen..." : "Inloggen met Google"}
            </button>
          )}

          {/* Email/Password Form */}
          {signInOptions.emailAndPassword && (
            <>
              {signInOptions.google && (
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-600/50"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-3 bg-slate-800/40 text-slate-400">of</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleEmailPasswordAuth} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all duration-200 backdrop-blur-sm"
                    placeholder="je@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                    Wachtwoord
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all duration-200 backdrop-blur-sm"
                    placeholder="••••••••"
                  />
                </div>

                {error && (
                  <div className="bg-red-900/30 border border-red-400/30 text-red-300 p-4 rounded-lg text-sm">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">⚠️</span>
                      {error}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-black font-semibold rounded-lg shadow-lg transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
                      Bezig...
                    </div>
                  ) : (
                    isSignUp ? "Account aanmaken" : "INLOGGEN"
                  )}
                </button>
              </form>

              <div className="mt-6 text-center space-y-3">
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-amber-400 hover:text-amber-300 underline text-sm transition-colors"
                >
                  {isSignUp ? "Al een account? Inloggen" : "Nog geen account? Registreren"}
                </button>

                {!isSignUp && (
                  <div>
                    <button
                      onClick={handlePasswordReset}
                      disabled={isLoading}
                      className="text-slate-400 hover:text-slate-300 underline text-sm transition-colors"
                    >
                      Wachtwoord vergeten?
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}; 