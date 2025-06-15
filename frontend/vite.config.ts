import react from "@vitejs/plugin-react";
import "dotenv/config";
import path from "node:path";
import { defineConfig, splitVendorChunkPlugin } from "vite";
import injectHTML from "vite-plugin-html-inject";
import tsConfigPaths from "vite-tsconfig-paths";

// Schone Firebase configuratie zonder Databutton
const firebaseConfig = {
	apiKey: "AIzaSyBrENmWwomte9B3p3emXZcNN6S1KbMw-yk",
	authDomain: "flirty-chat-a045e.firebaseapp.com",
	projectId: "flirty-chat-a045e",
	storageBucket: "flirty-chat-a045e.firebasestorage.app",
	messagingSenderId: "177376218865",
	appId: "1:177376218865:web:2fc736cfc207b307cce350",
	databaseURL: "https://flirty-chat-a045e-default-rtdb.europe-west1.firebasedatabase.app",
	measurementId: "G-M7K4JFS3EW"
};

const appConfig = {
	firebaseConfig,
	signInOptions: {
		google: true,
		emailAndPassword: true
	},
	siteName: "Lucky Flirty Chat",
	signInSuccessUrl: "/"
};

console.log("🚀 Using clean Firebase config:", firebaseConfig);

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
	// Production URLs voor adultsplaystore.com
	const isProduction = mode === 'production';
	const apiUrl = isProduction ? "https://api.adultsplaystore.com" : "http://localhost:8000";
	const wsUrl = isProduction ? "wss://api.adultsplaystore.com" : "ws://localhost:8000";
	
	return {
		define: {
			__APP_ID__: JSON.stringify(process.env.APP_ID || "lucky-flirty-chat"),
			__API_PATH__: JSON.stringify(""),
			__API_URL__: JSON.stringify(apiUrl),
			__WS_API_URL__: JSON.stringify(wsUrl),
			__APP_BASE_PATH__: JSON.stringify("/"),
			__APP_TITLE__: JSON.stringify("Lucky Flirty Chat - Premium Blackjack Casino"),
			__APP_FAVICON_LIGHT__: JSON.stringify("/favicon-light.svg"),
			__APP_FAVICON_DARK__: JSON.stringify("/favicon-dark.svg"),
			__APP_DEPLOY_USERNAME__: JSON.stringify(""),
			__APP_DEPLOY_APPNAME__: JSON.stringify(""),
			__APP_DEPLOY_CUSTOM_DOMAIN__: JSON.stringify("www.adultsplaystore.com"),
		},
		plugins: [react(), splitVendorChunkPlugin(), tsConfigPaths(), injectHTML()],
		server: {
			proxy: {
				"/routes": {
					target: "http://127.0.0.1:8000",
					changeOrigin: true,
				},
				"/api": {
					target: "http://127.0.0.1:8000",
					changeOrigin: true,
				},
			},
			port: 3000,
			host: true,
			hmr: {
				overlay: true
			}
		},
		resolve: {
			alias: {
				"@": path.resolve(__dirname, "./src"),
				"app": path.resolve(__dirname, "./src/app"),
				"components": path.resolve(__dirname, "./src/components"),
				"pages": path.resolve(__dirname, "./src/pages"),
				"utils": path.resolve(__dirname, "./src/utils"),
			},
		},
		base: '/',
		build: {
			outDir: 'dist',
			chunkSizeWarningLimit: 1000,
			rollupOptions: {
				output: {
					manualChunks: {
						'vendor-react': ['react', 'react-dom', 'react-router-dom'],
						'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
						'vendor-ui': ['lucide-react'],
						
						'admin': [
							'./src/pages/AdminPage.tsx',
							'./src/pages/AdminSetupPage.tsx',
							'./src/pages/DealerManagementPage.tsx',
							'./src/components/DealerForm.tsx'
						],
						'game': [
							'./src/pages/GamePage.tsx',
							'./src/components/GameInterface.tsx'
						],
						'auth': [
							'./src/pages/Login.tsx',
							'./src/app/auth/CustomFirebaseAuth.tsx',
							'./src/app/auth/UserGuard.tsx'
						]
					}
				}
			},
			sourcemap: false, // Geen sourcemaps voor productie
			minify: 'terser',
			commonjsOptions: {
				include: [/node_modules/]
			}
		},
		optimizeDeps: {
			include: [
				'react',
				'react-dom',
				'react-router-dom',
				'firebase/app',
				'firebase/auth',
				'firebase/firestore',
				'firebase/storage'
			]
		}
	}
});
