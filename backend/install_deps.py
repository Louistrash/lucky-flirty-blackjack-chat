#!/usr/bin/env python3
"""
Install script for Lucky Flirty Chat Backend dependencies
"""
import subprocess
import sys
import os

def install_package(package):
    """Install a Python package using pip"""
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", package])
        print(f"✅ Installed {package}")
        return True
    except subprocess.CalledProcessError:
        print(f"❌ Failed to install {package}")
        return False

def main():
    """Install all required dependencies"""
    print("🚀 Installing Lucky Flirty Chat Backend Dependencies")
    print("=" * 60)
    
    # List of required packages
    packages = [
        "fastapi",
        "uvicorn[standard]", 
        "stripe",
        "openai",
        "python-dotenv",
        "requests",
        "Pillow",  # For image processing
        "firebase-admin",
        "python-multipart",  # For file uploads
        "pydantic",
        "typing-extensions"
    ]
    
    print(f"📦 Installing {len(packages)} packages...")
    print()
    
    failed_packages = []
    
    for package in packages:
        print(f"Installing {package}...")
        if not install_package(package):
            failed_packages.append(package)
    
    print("\n" + "=" * 60)
    
    if failed_packages:
        print(f"❌ Failed to install {len(failed_packages)} packages:")
        for package in failed_packages:
            print(f"   - {package}")
        print("\n💡 Try installing manually with: pip install <package-name>")
        return 1
    else:
        print("✅ All packages installed successfully!")
        print("\n🎉 Backend dependencies are ready!")
        print("\n Next steps:")
        print("   1. Set your environment variables in .env file")
        print("   2. Add your OpenAI API key")
        print("   3. Add your Stripe keys")
        print("   4. Run: python start_server.py")
        return 0

if __name__ == "__main__":
    sys.exit(main()) 