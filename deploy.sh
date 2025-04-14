#!/bin/bash

# Build and deploy script for Vercel
# Make this script executable with: chmod +x deploy.sh

echo "🚀 Preparing for deployment to Vercel..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Run linting
echo "🔍 Running linter..."
npm run lint

# Run build to check for errors
echo "🏗️ Building the application..."
npm run build

# Deployment instructions
echo "✅ Build completed successfully!"
echo ""
echo "======================================================================================="
echo "To deploy to Vercel, follow these steps:"
echo ""
echo "1. Make sure you have the Vercel CLI installed: npm install -g vercel"
echo "2. Login to Vercel if needed: vercel login"
echo "3. Deploy with one of these commands:"
echo "   - Development deployment: vercel"
echo "   - Production deployment: vercel --prod"
echo ""
echo "Or deploy through the Vercel dashboard by connecting your GitHub repository:"
echo "https://vercel.com/new"
echo "=======================================================================================" 