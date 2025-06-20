import React, { useEffect, useState } from 'react';
import { firebaseAuth } from '../app/auth/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User } from 'firebase/auth';

export function AuthTest() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleEmailPasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(firebaseAuth, email, password);
      } else {
        await signInWithEmailAndPassword(firebaseAuth, email, password);
      }
      setEmail('');
      setPassword('');
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(firebaseAuth);
    } catch (error: any) {
      setError(error.message);
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-800/60 backdrop-blur-sm border border-blue-400/30 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-300 mb-4 flex items-center">
          🔐 Firebase Authentication Test
        </h3>
        <div className="text-slate-300">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm border border-blue-400/30 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-blue-300 mb-4 flex items-center">
        🔐 Firebase Authentication Test
      </h3>
      
      {user ? (
        <div className="space-y-4">
          <div className="bg-green-900/30 border border-green-400/30 rounded-lg p-4">
            <h4 className="font-semibold text-green-300 mb-2">✅ Authenticated</h4>
            <div className="text-sm text-slate-300 space-y-1">
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>UID:</strong> {user.uid}</p>
              <p><strong>Display Name:</strong> {user.displayName || 'Not set'}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-yellow-900/30 border border-yellow-400/30 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-300 mb-2">⚠️ Not Authenticated</h4>
            <p className="text-sm text-slate-300">Please sign in to continue</p>
          </div>
          
          <form onSubmit={handleEmailPasswordAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="register"
                checked={isRegistering}
                onChange={(e) => setIsRegistering(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="register" className="text-sm text-slate-300">
                Create new account
              </label>
            </div>
            
            {error && (
              <div className="bg-red-900/30 border border-red-400/30 rounded-lg p-3">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}
            
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              {isRegistering ? 'Register' : 'Sign In'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
} 