#!/bin/bash

# Setup Vercel Environment Variables
# This script adds all required environment variables to Vercel

echo "🚀 Setting up Vercel Environment Variables..."
echo ""
echo "Please ensure you are logged in to Vercel CLI:"
echo "Run: vercel login"
echo ""

# Read environment variables from .env.vercel
if [ ! -f .env.vercel ]; then
    echo "❌ Error: .env.vercel file not found"
    exit 1
fi

echo "📝 Adding environment variables to Vercel..."
echo ""

# Function to add environment variable to Vercel
add_env_var() {
    local key=$1
    local value=$2
    local environment=$3

    echo "Adding $key to $environment..."
    vercel env add "$key" "$environment" <<< "$value" 2>&1 | grep -v "Vercel CLI"
}

# Read .env.vercel and add each variable
while IFS='=' read -r key value; do
    # Skip comments and empty lines
    if [[ $key =~ ^#.* ]] || [[ -z $key ]]; then
        continue
    fi

    # Remove quotes from value
    value=$(echo "$value" | sed 's/^"//;s/"$//')

    # Add to production, preview, and development
    add_env_var "$key" "$value" "production"
    # add_env_var "$key" "$value" "preview"
    # add_env_var "$key" "$value" "development"
done < .env.vercel

echo ""
echo "✅ Environment variables setup complete!"
echo ""
echo "Next steps:"
echo "1. Verify variables in Vercel Dashboard"
echo "2. Trigger a new deployment: vercel --prod"
