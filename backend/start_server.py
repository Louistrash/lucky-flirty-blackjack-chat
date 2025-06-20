#!/usr/bin/env python3
"""
Production server startup script for Lucky Flirty Chat Backend
This script simply starts the Uvicorn server.
All configuration should be handled via the .env file.
"""
import os
import subprocess
import sys

def main():
    """Start the Uvicorn server for production."""
    print("🚀 Starting Lucky Flirty Chat Backend Server...")
    
    # Ensure .env file is loaded by the application
    # The application itself (main.py) should use dotenv.load_dotenv()
    
    # Determine the host and port
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8001"))
    
    print(f"🌍 Server will be available at http://{host}:{port}")
    
    try:
        # Execute Uvicorn server
        subprocess.check_call([
            sys.executable,
            "-m",
            "uvicorn",
            "main:app",
            "--host",
            host,
            "--port",
            str(port)
        ])
    except FileNotFoundError:
        print("❌ uvicorn or python not found. Make sure you are in the correct virtual environment.")
        sys.exit(1)
    except subprocess.CalledProcessError as e:
        print(f"❌ Server failed to start with error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 