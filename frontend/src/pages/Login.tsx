import React from "react";
import { LuxuryAuth } from "../components/LuxuryAuth";
import casinoPattern from '/casino-pattern.png';

export default function Login() {
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
          {/* Login Card */}
          <div className="bg-slate-800/40 backdrop-blur-lg border border-amber-400/20 rounded-2xl shadow-2xl p-8 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400"></div>
            <div className="absolute -top-10 -right-10 w-20 h-20 bg-amber-400/10 rounded-full blur-xl"></div>
            <div className="absolute -bottom-10 -left-10 w-20 h-20 bg-amber-400/10 rounded-full blur-xl"></div>
            
            {/* Card Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-400/20 rounded-full mb-4">
                <span className="text-2xl">♠️</span>
              </div>
              <h2 className="text-2xl font-bold text-amber-400 mb-2" style={{ fontFamily: '"Cinzel Decorative", cursive' }}>
                Black Jack Chat
              </h2>
              <p className="text-slate-300 text-sm">Welkom terug!</p>
            </div>

            {/* Auth Component */}
            <div className="relative z-10">
              <LuxuryAuth />
            </div>

            {/* Card Footer */}
            <div className="mt-8 pt-6 border-t border-slate-700/50 text-center">
              <p className="text-xs text-slate-400">
                Nog geen account? 
                <a href="/register" className="text-amber-400 hover:text-amber-300 ml-1 underline">
                  Registreer nu
                </a>
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
};