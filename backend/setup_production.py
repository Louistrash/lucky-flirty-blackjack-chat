#!/usr/bin/env python3
"""
Production setup script for Lucky Flirty Chat Backend
"""
import os

def create_env_file():
    """Create a production .env file with placeholder values"""
    
    env_content = """# Lucky Flirty Chat Production Environment Configuration
# Fill in your real values below

# =====================================
# STRIPE PAYMENT CONFIGURATION
# =====================================
# Get these from: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_live_your_live_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# =====================================
# OPENAI CONFIGURATION
# =====================================
# Get this from: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-proj-your_real_openai_api_key_here

# =====================================
# FIREBASE CONFIGURATION
# =====================================
FIREBASE_PROJECT_ID=flirty-chat-a045e

# =====================================
# SERVER CONFIGURATION
# =====================================
BACKEND_URL=https://www.adultsplaystore.com
FRONTEND_URL=https://www.adultsplaystore.com
NODE_ENV=production
PORT=8001

# =====================================
# CORS CONFIGURATION
# =====================================
CORS_ORIGINS=https://www.adultsplaystore.com,http://localhost:3000,http://localhost:5173

# =====================================
# DEVELOPMENT NOTES
# =====================================
# For testing, you can use Stripe test keys:
# STRIPE_SECRET_KEY=sk_test_51RXJkIIhYvmNDX3M...
# STRIPE_PUBLISHABLE_KEY=pk_test_51RXJkIIhYvmNDX3M...
#
# For OpenAI testing, get a real API key from:
# https://platform.openai.com/api-keys
#
# Make sure to replace ALL placeholder values with real ones!
"""
    
    # Write the .env file
    with open('.env', 'w') as f:
        f.write(env_content)
    
    print("✅ Created .env file with placeholder values")
    print("📝 Please edit .env and add your real API keys!")

def main():
    """Main setup function"""
    print("🚀 Lucky Flirty Chat Production Setup")
    print("=" * 50)
    
    # Check if .env already exists
    if os.path.exists('.env'):
        response = input("⚠️ .env file already exists. Overwrite? (y/N): ")
        if response.lower() != 'y':
            print("❌ Setup cancelled")
            return
    
    # Create .env file
    create_env_file()
    
    print("\n🎯 Next Steps:")
    print("1. Edit .env file and add your real API keys")
    print("2. Get OpenAI API key: https://platform.openai.com/api-keys")
    print("3. Get Stripe keys: https://dashboard.stripe.com/apikeys")
    print("4. Run: python install_deps.py")
    print("5. Run: python start_server.py")
    
    print("\n✨ Setup complete! Happy coding!")

if __name__ == "__main__":
    main() 