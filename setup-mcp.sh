#!/bin/bash

# 🔥 Lucky Flirty Chat - MCP Setup Script
# Configureert Firebase MCP server en andere benodigde tools

echo "🚀 Setting up MCP servers for Lucky Flirty Chat..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

# Install Firebase CLI globally if not present
echo "📦 Installing Firebase CLI..."
npm install -g firebase-tools

# Install MCP packages
echo "📦 Installing MCP packages..."
npm install -g @modelcontextprotocol/server-git
npm install -g @modelcontextprotocol/server-filesystem

# Create MCP config directory for Claude Desktop (if using macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    MCP_CONFIG_DIR="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
    echo "📁 Creating Claude Desktop MCP config at: $MCP_CONFIG_DIR"
    
    # Backup existing config if it exists
    if [ -f "$MCP_CONFIG_DIR" ]; then
        cp "$MCP_CONFIG_DIR" "$MCP_CONFIG_DIR.backup.$(date +%Y%m%d_%H%M%S)"
        echo "💾 Backed up existing config"
    fi
    
    # Copy our config
    mkdir -p "$(dirname "$MCP_CONFIG_DIR")"
    cp claude_desktop_config.json "$MCP_CONFIG_DIR"
    echo "✅ Claude Desktop MCP config installed"
fi

# Login to Firebase (interactive)
echo "🔐 Logging into Firebase..."
firebase login

# Set Firebase project
echo "🎯 Setting Firebase project..."
firebase use flirty-chat-a045e

# Test Firebase connection
echo "🧪 Testing Firebase connection..."
firebase projects:list

echo ""
echo "🎉 MCP Setup Complete!"
echo ""
echo "📋 Available MCP Servers:"
echo "  - firebase: Firebase CLI tools"
echo "  - git: Git repository management"
echo "  - filesystem: File system access"
echo ""
echo "🔧 Configuration files created:"
echo "  - mcp_servers.json (general MCP config)"
echo "  - claude_desktop_config.json (Claude Desktop specific)"
echo ""
echo "💡 Next steps:"
echo "  1. Restart Claude Desktop (if using)"
echo "  2. Test Firebase Storage: window.testFirebaseStorage()"
echo "  3. Start development: cd frontend && npm run dev"
echo "" 